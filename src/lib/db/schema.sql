-- ============================================================================
-- QUANTUM WMS: ENTERPRISE 12-SCHEMA POSTGRESQL 17/18 ARCHITECTURE
-- Compatible with PostgreSQL 17/18, Supabase, Neon, and PGlite Embedded PG 18
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS master;
CREATE SCHEMA IF NOT EXISTS location;
CREATE SCHEMA IF NOT EXISTS inbound;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS outbound;
CREATE SCHEMA IF NOT EXISTS replenishment;
CREATE SCHEMA IF NOT EXISTS transport;
CREATE SCHEMA IF NOT EXISTS returns;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;

-- ============================================================================
-- 01. CORE: Tenants, Companies, Warehouses, Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS core.tenants (
  id SERIAL PRIMARY KEY,
  tenant_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  plan VARCHAR(32) NOT NULL DEFAULT 'ENTERPRISE',
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.companies (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  company_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  country VARCHAR(64) NOT NULL DEFAULT 'United Arab Emirates',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.warehouses (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
  warehouse_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(64) NOT NULL,
  country VARCHAR(64) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Dubai',
  warehouse_type VARCHAR(40) NOT NULL DEFAULT 'FULFILMENT_CENTER',
  total_area_sqft INTEGER NOT NULL DEFAULT 100000,
  dock_doors INTEGER NOT NULL DEFAULT 12,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  email VARCHAR(160) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'WAREHOUSE_MANAGER',
  assigned_warehouse_id INTEGER REFERENCES core.warehouses(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 02. MASTER: Products, SKUs, Barcodes, Suppliers, Customers, Carriers
-- ============================================================================
CREATE TABLE IF NOT EXISTS master.products (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
  product_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(64) NOT NULL,
  brand VARCHAR(80) NOT NULL DEFAULT 'NexusTech',
  temperature_zone VARCHAR(32) NOT NULL DEFAULT 'AMBIENT',
  hazmat BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master.skus (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES master.products(id) ON DELETE CASCADE,
  sku_code VARCHAR(48) UNIQUE NOT NULL,
  barcode VARCHAR(48) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  uom VARCHAR(16) NOT NULL DEFAULT 'EA',
  weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
  volume_cm3 NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  velocity_class CHAR(1) NOT NULL DEFAULT 'B' CHECK (velocity_class IN ('A', 'B', 'C')),
  reorder_point INTEGER NOT NULL DEFAULT 20,
  max_stock INTEGER NOT NULL DEFAULT 250,
  lot_tracked BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master.suppliers (
  id SERIAL PRIMARY KEY,
  supplier_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(140) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  country VARCHAR(64) NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 5,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master.customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(140) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  city VARCHAR(64) NOT NULL,
  country VARCHAR(64) NOT NULL,
  sla_tier VARCHAR(24) NOT NULL DEFAULT 'PRIORITY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master.carriers (
  id SERIAL PRIMARY KEY,
  carrier_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  service_type VARCHAR(64) NOT NULL,
  scac_code VARCHAR(16) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- 03. LOCATION: Warehouse Zones, Aisles, Racks, Shelves, Bins & 3D Coords
-- ============================================================================
CREATE TABLE IF NOT EXISTS location.locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id) ON DELETE CASCADE,
  location_code VARCHAR(48) NOT NULL,
  barcode VARCHAR(48) UNIQUE NOT NULL,
  zone VARCHAR(24) NOT NULL,
  aisle VARCHAR(16) NOT NULL DEFAULT '01',
  rack VARCHAR(16) NOT NULL DEFAULT 'R1',
  shelf VARCHAR(16) NOT NULL DEFAULT 'S1',
  bin VARCHAR(16) NOT NULL DEFAULT 'B1',
  location_type VARCHAR(32) NOT NULL CHECK (location_type IN ('RECEIVING', 'PICK_FACE', 'BULK_STORAGE', 'COLD_STORAGE', 'PACKING', 'DISPATCH', 'QUARANTINE')),
  x_coord INTEGER NOT NULL DEFAULT 0,
  y_coord INTEGER NOT NULL DEFAULT 0,
  z_coord INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 200 CHECK (max_capacity > 0),
  max_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (warehouse_id, location_code)
);

-- ============================================================================
-- 04. INBOUND: Purchase Orders, ASN, Receiving, GRN, Quality Inspection
-- ============================================================================
CREATE TABLE IF NOT EXISTS inbound.purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(40) UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  supplier_id INTEGER NOT NULL REFERENCES master.suppliers(id),
  asn_number VARCHAR(48),
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'ASN_IN_TRANSIT', 'PENDING_QC', 'PARTIAL', 'RECEIVED', 'CANCELLED')),
  expected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(80) NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inbound.purchase_order_lines (
  id SERIAL PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES inbound.purchase_orders(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  ordered_qty INTEGER NOT NULL CHECK (ordered_qty > 0),
  received_qty INTEGER NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS inbound.receipts (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(40) UNIQUE NOT NULL,
  po_id INTEGER NOT NULL REFERENCES inbound.purchase_orders(id),
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  received_qty INTEGER NOT NULL CHECK (received_qty > 0),
  accepted_qty INTEGER NOT NULL DEFAULT 0,
  rejected_qty INTEGER NOT NULL DEFAULT 0,
  lot_number VARCHAR(48) NOT NULL DEFAULT 'LOT-STD',
  qc_status VARCHAR(24) NOT NULL DEFAULT 'PASSED' CHECK (qc_status IN ('PENDING_QC', 'PASSED', 'QUARANTINE')),
  putaway_location_id INTEGER REFERENCES location.locations(id),
  inspector_name VARCHAR(80) NOT NULL DEFAULT 'QA Auto-Gate',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 05. INVENTORY: Balances, Immutable Ledger, Reservations, Transfers
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.inventory_balances (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES location.locations(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES master.skus(id) ON DELETE CASCADE,
  lot_number VARCHAR(48) NOT NULL DEFAULT 'LOT-2026-A',
  serial_prefix VARCHAR(48),
  expiry_date DATE,
  on_hand_qty INTEGER NOT NULL DEFAULT 0 CHECK (on_hand_qty >= 0),
  reserved_qty INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0 AND reserved_qty <= on_hand_qty),
  available_qty INTEGER GENERATED ALWAYS AS (on_hand_qty - reserved_qty) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (warehouse_id, location_id, sku_id, lot_number)
);

CREATE TABLE IF NOT EXISTS inventory.inventory_ledger (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(96) UNIQUE NOT NULL,
  tx_hash VARCHAR(64) NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  location_id INTEGER REFERENCES location.locations(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  lot_number VARCHAR(48) NOT NULL DEFAULT 'LOT-2026-A',
  movement_type VARCHAR(32) NOT NULL CHECK (movement_type IN (
    'OPENING_BALANCE', 'INBOUND_RECEIPT', 'PUTAWAY', 'RESERVATION_LOCK',
    'RESERVATION_RELEASE', 'OUTBOUND_PICK', 'TRANSFER_OUT', 'TRANSFER_IN',
    'REPLENISH_OUT', 'REPLENISH_IN', 'CYCLE_ADJUSTMENT', 'RETURN_RESTOCK'
  )),
  qty_delta INTEGER NOT NULL,
  reserved_delta INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reference_type VARCHAR(32) NOT NULL,
  reference_code VARCHAR(64) NOT NULL,
  operator_name VARCHAR(80) NOT NULL DEFAULT 'WMS Engine',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IMMUTABLE LEDGER ENFORCEMENT TRIGGER
CREATE OR REPLACE FUNCTION inventory.prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_LEDGER_VIOLATION: inventory.inventory_ledger rows are strictly append-only and cannot be updated or deleted (id=%).', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_inventory_ledger ON inventory.inventory_ledger;
CREATE TRIGGER trg_immutable_inventory_ledger
BEFORE UPDATE OR DELETE ON inventory.inventory_ledger
FOR EACH ROW EXECUTE FUNCTION inventory.prevent_ledger_mutation();

CREATE TABLE IF NOT EXISTS inventory.reservations (
  id SERIAL PRIMARY KEY,
  reservation_code VARCHAR(48) UNIQUE NOT NULL,
  balance_id INTEGER NOT NULL REFERENCES inventory.inventory_balances(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  location_id INTEGER NOT NULL REFERENCES location.locations(id),
  reference_code VARCHAR(48) NOT NULL,
  reserved_qty INTEGER NOT NULL CHECK (reserved_qty > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'RELEASED')),
  locked_by VARCHAR(80) NOT NULL DEFAULT 'Allocation Engine',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(40) UNIQUE NOT NULL,
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  from_warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  from_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  to_warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  to_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  lot_number VARCHAR(48) NOT NULL DEFAULT 'LOT-2026-A',
  qty INTEGER NOT NULL CHECK (qty > 0),
  reason VARCHAR(120) NOT NULL DEFAULT 'Slotting Optimization',
  status VARCHAR(24) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  initiated_by VARCHAR(80) NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 06. OUTBOUND: Waves, Sales Orders, Allocations, Pick Tasks, Cartons, Pack
-- ============================================================================
CREATE TABLE IF NOT EXISTS outbound.waves (
  id SERIAL PRIMARY KEY,
  wave_number VARCHAR(40) UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  strategy VARCHAR(48) NOT NULL DEFAULT 'QUANTUM_ISING_BATCH',
  status VARCHAR(24) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
  order_count INTEGER NOT NULL DEFAULT 0,
  total_units INTEGER NOT NULL DEFAULT 0,
  classical_distance_m NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantum_distance_m NUMERIC(10, 2) NOT NULL DEFAULT 0,
  speedup_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound.sales_orders (
  id SERIAL PRIMARY KEY,
  so_number VARCHAR(40) UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  customer_id INTEGER NOT NULL REFERENCES master.customers(id),
  wave_id INTEGER REFERENCES outbound.waves(id),
  priority VARCHAR(24) NOT NULL DEFAULT 'STANDARD' CHECK (priority IN ('CRITICAL', 'SAME_DAY', 'PRIORITY', 'STANDARD')),
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED', 'DISPATCHED', 'CANCELLED')),
  promised_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound.sales_order_lines (
  id SERIAL PRIMARY KEY,
  so_id INTEGER NOT NULL REFERENCES outbound.sales_orders(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  ordered_qty INTEGER NOT NULL CHECK (ordered_qty > 0),
  allocated_qty INTEGER NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
  picked_qty INTEGER NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS outbound.allocations (
  id SERIAL PRIMARY KEY,
  allocation_code VARCHAR(48) UNIQUE NOT NULL,
  so_id INTEGER NOT NULL REFERENCES outbound.sales_orders(id) ON DELETE CASCADE,
  so_line_id INTEGER NOT NULL REFERENCES outbound.sales_order_lines(id) ON DELETE CASCADE,
  balance_id INTEGER NOT NULL REFERENCES inventory.inventory_balances(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  location_id INTEGER NOT NULL REFERENCES location.locations(id),
  allocated_qty INTEGER NOT NULL CHECK (allocated_qty > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'ALLOCATED' CHECK (status IN ('ALLOCATED', 'PICKED', 'RELEASED')),
  operator_name VARCHAR(80) NOT NULL DEFAULT 'Auto-Allocator',
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound.pick_tasks (
  id SERIAL PRIMARY KEY,
  task_code VARCHAR(48) UNIQUE NOT NULL,
  wave_id INTEGER REFERENCES outbound.waves(id),
  allocation_id INTEGER NOT NULL REFERENCES outbound.allocations(id) ON DELETE CASCADE,
  so_id INTEGER NOT NULL REFERENCES outbound.sales_orders(id) ON DELETE CASCADE,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  from_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  to_location_id INTEGER REFERENCES location.locations(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  pick_sequence INTEGER NOT NULL DEFAULT 1,
  travel_distance_m NUMERIC(8, 2) NOT NULL DEFAULT 12.0,
  assigned_to VARCHAR(80) NOT NULL DEFAULT 'Picker-RF-01',
  status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound.cartons (
  id SERIAL PRIMARY KEY,
  carton_number VARCHAR(48) UNIQUE NOT NULL,
  so_id INTEGER NOT NULL REFERENCES outbound.sales_orders(id) ON DELETE CASCADE,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  carton_type VARCHAR(32) NOT NULL DEFAULT 'STD-BOX-M',
  gross_weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 1.500,
  status VARCHAR(24) NOT NULL DEFAULT 'PACKED' CHECK (status IN ('OPEN', 'PACKED', 'SHIPPED')),
  packed_by VARCHAR(80) NOT NULL DEFAULT 'Pack-Station-01',
  packed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound.pack_lines (
  id SERIAL PRIMARY KEY,
  carton_id INTEGER NOT NULL REFERENCES outbound.cartons(id) ON DELETE CASCADE,
  pick_task_id INTEGER REFERENCES outbound.pick_tasks(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  packed_qty INTEGER NOT NULL CHECK (packed_qty > 0)
);

-- ============================================================================
-- 07. REPLENISHMENT: Min/Max Rules & Automated Replenishment Tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS replenishment.replenishment_rules (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES master.skus(id) ON DELETE CASCADE,
  pick_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  source_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  min_qty INTEGER NOT NULL DEFAULT 15,
  max_qty INTEGER NOT NULL DEFAULT 80,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (warehouse_id, sku_id, pick_location_id)
);

CREATE TABLE IF NOT EXISTS replenishment.replenishment_tasks (
  id SERIAL PRIMARY KEY,
  replen_code VARCHAR(48) UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  from_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  to_location_id INTEGER NOT NULL REFERENCES location.locations(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  priority VARCHAR(24) NOT NULL DEFAULT 'HIGH',
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 08. TRANSPORT: Shipments, Carriers, Tracking, Delivery Confirmation
-- ============================================================================
CREATE TABLE IF NOT EXISTS transport.shipments (
  id SERIAL PRIMARY KEY,
  shipment_number VARCHAR(48) UNIQUE NOT NULL,
  so_id INTEGER NOT NULL REFERENCES outbound.sales_orders(id),
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  carrier_id INTEGER NOT NULL REFERENCES master.carriers(id),
  carton_id INTEGER REFERENCES outbound.cartons(id),
  tracking_number VARCHAR(64) UNIQUE NOT NULL,
  service_level VARCHAR(48) NOT NULL DEFAULT 'EXPRESS_AIR',
  total_weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 2.000,
  status VARCHAR(24) NOT NULL DEFAULT 'MANIFESTED' CHECK (status IN ('MANIFESTED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION')),
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- ============================================================================
-- 09. RETURNS: RMA, Inspection & Disposition
-- ============================================================================
CREATE TABLE IF NOT EXISTS returns.rmas (
  id SERIAL PRIMARY KEY,
  rma_number VARCHAR(48) UNIQUE NOT NULL,
  so_id INTEGER REFERENCES outbound.sales_orders(id),
  customer_id INTEGER NOT NULL REFERENCES master.customers(id),
  warehouse_id INTEGER NOT NULL REFERENCES core.warehouses(id),
  sku_id INTEGER NOT NULL REFERENCES master.skus(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  reason VARCHAR(160) NOT NULL,
  condition_grade VARCHAR(32) NOT NULL DEFAULT 'UNOPENED_A',
  disposition VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (disposition IN ('PENDING', 'RESTOCK', 'REFURBISH', 'SCRAP')),
  status VARCHAR(24) NOT NULL DEFAULT 'AWAITING_INSPECTION' CHECK (status IN ('AWAITING_INSPECTION', 'PROCESSED')),
  restock_location_id INTEGER REFERENCES location.locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 10. INTEGRATION: Transactional Event Outbox & Webhook Sync Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration.event_outbox (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(64) UNIQUE NOT NULL,
  aggregate_type VARCHAR(48) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(24) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 11. AUDIT: User Activity, Stock Adjustments & Automated Backups
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit.audit_logs (
  id SERIAL PRIMARY KEY,
  actor VARCHAR(80) NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(48) NOT NULL,
  entity_code VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'CRITICAL')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit.backups (
  id SERIAL PRIMARY KEY,
  backup_code VARCHAR(48) UNIQUE NOT NULL,
  environment VARCHAR(24) NOT NULL DEFAULT 'DEVELOP',
  label VARCHAR(120) NOT NULL,
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  checksum VARCHAR(64) NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(80) NOT NULL DEFAULT 'Automated Backup Scheduler',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. REPORTING: Operational Summary & Real-Time KPI Views
-- ============================================================================
CREATE OR REPLACE VIEW reporting.v_sku_stock_summary AS
SELECT
  s.id AS sku_id,
  s.sku_code,
  s.barcode,
  s.name AS sku_name,
  s.uom,
  s.velocity_class,
  s.unit_cost,
  s.reorder_point,
  s.max_stock,
  COALESCE(SUM(b.on_hand_qty), 0)::INTEGER AS total_on_hand,
  COALESCE(SUM(b.reserved_qty), 0)::INTEGER AS total_reserved,
  COALESCE(SUM(b.available_qty), 0)::INTEGER AS total_available,
  ROUND(COALESCE(SUM(b.on_hand_qty), 0) * s.unit_cost, 2) AS inventory_valuation
FROM master.skus s
LEFT JOIN inventory.inventory_balances b ON b.sku_id = s.id
GROUP BY s.id;

CREATE OR REPLACE VIEW reporting.v_zone_utilization AS
SELECT
  l.warehouse_id,
  w.warehouse_code,
  l.zone,
  l.location_type,
  COUNT(DISTINCT l.id)::INTEGER AS bin_count,
  SUM(l.max_capacity)::INTEGER AS total_capacity,
  COALESCE(SUM(b.on_hand_qty), 0)::INTEGER AS current_units,
  CASE
    WHEN SUM(l.max_capacity) > 0 THEN ROUND((COALESCE(SUM(b.on_hand_qty), 0)::NUMERIC / SUM(l.max_capacity)::NUMERIC) * 100, 1)
    ELSE 0
  END AS utilization_pct
FROM location.locations l
JOIN core.warehouses w ON w.id = l.warehouse_id
LEFT JOIN inventory.inventory_balances b ON b.location_id = l.id
GROUP BY l.warehouse_id, w.warehouse_code, l.zone, l.location_type;

-- Indexes for fast concurrent lookups and locking
CREATE INDEX IF NOT EXISTS idx_inv_bal_sku_wh ON inventory.inventory_balances(warehouse_id, sku_id);
CREATE INDEX IF NOT EXISTS idx_inv_ledger_sku_created ON inventory.inventory_ledger(sku_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_so_status_priority ON outbound.sales_orders(status, priority);
CREATE INDEX IF NOT EXISTS idx_pick_tasks_wave_seq ON outbound.pick_tasks(wave_id, pick_sequence);
