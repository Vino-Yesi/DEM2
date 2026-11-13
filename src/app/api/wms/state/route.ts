import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, getPersistenceMetadata } from '@/lib/db';
import { runMiniAiAdvisors } from '@/lib/ai/advisor-debugger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const whParam = req.nextUrl.searchParams.get('warehouseId');
    const warehouseId = whParam && whParam !== 'all' ? Number(whParam) : null;

    const [
      warehousesRes,
      skusRes,
      suppliersRes,
      customersRes,
      carriersRes,
      locationsRes,
      balancesRes,
      ledgerRes,
      transfersRes,
      replenRes,
      posRes,
      poLinesRes,
      receiptsRes,
      wavesRes,
      sosRes,
      soLinesRes,
      pickTasksRes,
      cartonsRes,
      shipmentsRes,
      rmasRes,
      outboxRes,
      auditRes,
      backupsRes,
      zoneUtilRes,
    ] = await Promise.all([
      dbQuery('SELECT * FROM core.warehouses ORDER BY id ASC'),
      dbQuery(
        `SELECT s.*, p.category, p.brand, p.temperature_zone, p.hazmat,
                v.total_on_hand, v.total_reserved, v.total_available, v.inventory_valuation
         FROM master.skus s
         JOIN master.products p ON p.id = s.product_id
         LEFT JOIN reporting.v_sku_stock_summary v ON v.sku_id = s.id
         ORDER BY s.id ASC`
      ),
      dbQuery('SELECT * FROM master.suppliers ORDER BY id ASC'),
      dbQuery('SELECT * FROM master.customers ORDER BY id ASC'),
      dbQuery('SELECT * FROM master.carriers ORDER BY id ASC'),
      dbQuery(
        `SELECT l.*, w.warehouse_code,
                COALESCE((SELECT SUM(b.on_hand_qty) FROM inventory.inventory_balances b WHERE b.location_id = l.id), 0)::int AS current_qty
         FROM location.locations l
         JOIN core.warehouses w ON w.id = l.warehouse_id
         WHERE ($1::int IS NULL OR l.warehouse_id = $1)
         ORDER BY l.warehouse_id ASC, l.x_coord ASC, l.y_coord ASC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT b.*, s.sku_code, s.barcode AS sku_barcode, s.name AS sku_name, s.uom, s.velocity_class, s.unit_cost,
                l.location_code, l.zone, l.location_type, w.warehouse_code
         FROM inventory.inventory_balances b
         JOIN master.skus s ON s.id = b.sku_id
         JOIN location.locations l ON l.id = b.location_id
         JOIN core.warehouses w ON w.id = b.warehouse_id
         WHERE ($1::int IS NULL OR b.warehouse_id = $1)
         ORDER BY b.warehouse_id ASC, l.location_code ASC, s.sku_code ASC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT led.*, s.sku_code, s.name AS sku_name, l.location_code, w.warehouse_code
         FROM inventory.inventory_ledger led
         JOIN master.skus s ON s.id = led.sku_id
         LEFT JOIN location.locations l ON l.id = led.location_id
         JOIN core.warehouses w ON w.id = led.warehouse_id
         WHERE ($1::int IS NULL OR led.warehouse_id = $1)
         ORDER BY led.id DESC
         LIMIT 60`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT t.*, s.sku_code, s.name AS sku_name,
                lf.location_code AS from_location_code, lt.location_code AS to_location_code
         FROM inventory.transfers t
         JOIN master.skus s ON s.id = t.sku_id
         JOIN location.locations lf ON lf.id = t.from_location_id
         JOIN location.locations lt ON lt.id = t.to_location_id
         ORDER BY t.id DESC LIMIT 25`
      ),
      dbQuery(
        `SELECT rt.*, s.sku_code, s.name AS sku_name,
                lf.location_code AS from_location_code, lt.location_code AS to_location_code
         FROM replenishment.replenishment_tasks rt
         JOIN master.skus s ON s.id = rt.sku_id
         JOIN location.locations lf ON lf.id = rt.from_location_id
         JOIN location.locations lt ON lt.id = rt.to_location_id
         WHERE ($1::int IS NULL OR rt.warehouse_id = $1)
         ORDER BY rt.status DESC, rt.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT po.*, sup.name AS supplier_name, sup.country AS supplier_country, w.warehouse_code
         FROM inbound.purchase_orders po
         JOIN master.suppliers sup ON sup.id = po.supplier_id
         JOIN core.warehouses w ON w.id = po.warehouse_id
         WHERE ($1::int IS NULL OR po.warehouse_id = $1)
         ORDER BY po.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT pol.*, s.sku_code, s.name AS sku_name, s.uom
         FROM inbound.purchase_order_lines pol
         JOIN master.skus s ON s.id = pol.sku_id
         ORDER BY pol.id ASC`
      ),
      dbQuery(
        `SELECT r.*, s.sku_code, l.location_code AS putaway_location_code
         FROM inbound.receipts r
         JOIN master.skus s ON s.id = r.sku_id
         LEFT JOIN location.locations l ON l.id = r.putaway_location_id
         WHERE ($1::int IS NULL OR r.warehouse_id = $1)
         ORDER BY r.id DESC LIMIT 25`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT wv.*, w.warehouse_code
         FROM outbound.waves wv
         JOIN core.warehouses w ON w.id = wv.warehouse_id
         WHERE ($1::int IS NULL OR wv.warehouse_id = $1)
         ORDER BY wv.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT so.*, c.name AS customer_name, c.city AS customer_city, c.sla_tier, w.warehouse_code
         FROM outbound.sales_orders so
         JOIN master.customers c ON c.id = so.customer_id
         JOIN core.warehouses w ON w.id = so.warehouse_id
         WHERE ($1::int IS NULL OR so.warehouse_id = $1)
         ORDER BY
           CASE so.priority WHEN 'CRITICAL' THEN 0 WHEN 'SAME_DAY' THEN 1 WHEN 'PRIORITY' THEN 2 ELSE 3 END,
           so.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT sol.*, s.sku_code, s.name AS sku_name, s.uom
         FROM outbound.sales_order_lines sol
         JOIN master.skus s ON s.id = sol.sku_id
         ORDER BY sol.id ASC`
      ),
      dbQuery(
        `SELECT pt.*, s.sku_code, s.name AS sku_name, s.barcode AS sku_barcode,
                lf.location_code AS from_location_code, lf.zone, lf.aisle, lf.x_coord, lf.y_coord,
                so.so_number
         FROM outbound.pick_tasks pt
         JOIN master.skus s ON s.id = pt.sku_id
         JOIN location.locations lf ON lf.id = pt.from_location_id
         JOIN outbound.sales_orders so ON so.id = pt.so_id
         WHERE ($1::int IS NULL OR pt.warehouse_id = $1)
         ORDER BY pt.status DESC, pt.pick_sequence ASC, pt.id ASC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT c.*, so.so_number
         FROM outbound.cartons c
         JOIN outbound.sales_orders so ON so.id = c.so_id
         WHERE ($1::int IS NULL OR c.warehouse_id = $1)
         ORDER BY c.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT sh.*, so.so_number, car.name AS carrier_name, car.scac_code, w.warehouse_code
         FROM transport.shipments sh
         JOIN outbound.sales_orders so ON so.id = sh.so_id
         JOIN master.carriers car ON car.id = sh.carrier_id
         JOIN core.warehouses w ON w.id = sh.warehouse_id
         WHERE ($1::int IS NULL OR sh.warehouse_id = $1)
         ORDER BY sh.id DESC`,
        [warehouseId]
      ),
      dbQuery(
        `SELECT r.*, c.name AS customer_name, s.sku_code, s.name AS sku_name, l.location_code AS restock_location_code
         FROM returns.rmas r
         JOIN master.customers c ON c.id = r.customer_id
         JOIN master.skus s ON s.id = r.sku_id
         LEFT JOIN location.locations l ON l.id = r.restock_location_id
         WHERE ($1::int IS NULL OR r.warehouse_id = $1)
         ORDER BY r.id DESC`,
        [warehouseId]
      ),
      dbQuery('SELECT * FROM integration.event_outbox ORDER BY id DESC LIMIT 25'),
      dbQuery('SELECT * FROM audit.audit_logs ORDER BY id DESC LIMIT 30'),
      dbQuery(
        'SELECT id, backup_code, environment, label, row_counts, checksum, created_by, created_at FROM audit.backups ORDER BY id DESC LIMIT 15'
      ),
      dbQuery(
        `SELECT * FROM reporting.v_zone_utilization
         WHERE ($1::int IS NULL OR warehouse_id = $1)
         ORDER BY warehouse_id ASC, zone ASC`,
        [warehouseId]
      ),
    ]);

    const poLinesByPo = new Map<number, any[]>();
    for (const l of poLinesRes.rows as Record<string, any>[]) {
      const list = poLinesByPo.get(l.po_id) || [];
      list.push(l);
      poLinesByPo.set(l.po_id, list);
    }

    const soLinesBySo = new Map<number, any[]>();
    for (const l of soLinesRes.rows as Record<string, any>[]) {
      const list = soLinesBySo.get(l.so_id) || [];
      list.push(l);
      soLinesBySo.set(l.so_id, list);
    }

    const purchaseOrders = (posRes.rows as Record<string, any>[]).map((po) => ({
      ...po,
      lines: poLinesByPo.get(po.id) || [],
    }));

    const salesOrders = (sosRes.rows as Record<string, any>[]).map((so) => ({
      ...so,
      lines: soLinesBySo.get(so.id) || [],
    }));

    const totalOnHand = (balancesRes.rows as Record<string, any>[]).reduce((s, b) => s + Number(b.on_hand_qty), 0);
    const totalReserved = (balancesRes.rows as Record<string, any>[]).reduce((s, b) => s + Number(b.reserved_qty), 0);
    const totalAvailable = (balancesRes.rows as Record<string, any>[]).reduce((s, b) => s + Number(b.available_qty), 0);
    const totalValuation = (balancesRes.rows as Record<string, any>[]).reduce(
      (s, b) => s + Number(b.on_hand_qty) * Number(b.unit_cost || 0),
      0
    );

    const openPicks = (pickTasksRes.rows as Record<string, any>[]).filter((t) => t.status !== 'COMPLETED').length;
    const latestWave = (wavesRes.rows as Record<string, any>[])[0];
    const aiInsights = await runMiniAiAdvisors(warehouseId || 1);

    return NextResponse.json({
      persistence: getPersistenceMetadata(),
      warehouses: warehousesRes.rows,
      kpis: {
        totalSkus: skusRes.rows.length,
        totalOnHand,
        totalReserved,
        totalAvailable,
        totalValuation: Math.round(totalValuation * 100) / 100,
        openPurchaseOrders: purchaseOrders.filter((p: Record<string, any>) => p.status !== 'RECEIVED' && p.status !== 'CANCELLED').length,
        activeSalesOrders: salesOrders.filter((s: Record<string, any>) => s.status !== 'DISPATCHED' && s.status !== 'CANCELLED').length,
        openPickTasks: openPicks,
        quantumSpeedupPct: Number(latestWave?.speedup_pct || 38.36),
        shipmentsCount: shipmentsRes.rows.length,
      },
      skus: skusRes.rows,
      suppliers: suppliersRes.rows,
      customers: customersRes.rows,
      carriers: carriersRes.rows,
      locations: locationsRes.rows,
      zoneUtilization: zoneUtilRes.rows,
      balances: balancesRes.rows,
      ledger: ledgerRes.rows,
      transfers: transfersRes.rows,
      replenishmentTasks: replenRes.rows,
      purchaseOrders,
      receipts: receiptsRes.rows,
      waves: wavesRes.rows,
      salesOrders,
      pickTasks: pickTasksRes.rows,
      cartons: cartonsRes.rows,
      shipments: shipmentsRes.rows,
      rmas: rmasRes.rows,
      outboxEvents: outboxRes.rows,
      auditLogs: auditRes.rows,
      backups: backupsRes.rows,
      aiInsights,
    });
  } catch (err: any) {
    console.error('WMS state error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to load WMS state' }, { status: 500 });
  }
}
