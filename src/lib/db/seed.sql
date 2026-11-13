-- ============================================================================
-- QUANTUM WMS: REALISTIC ENTERPRISE DEMO SEED DATA
-- Strict Ledger-to-Balance & Reservation Parity Guaranteed
-- ============================================================================

-- 01. CORE
INSERT INTO core.tenants (id, tenant_code, name, plan, status) VALUES
  (1, 'TEN-NEXUS', 'NexusLogix Global Supply Chain', 'ENTERPRISE_QUANTUM', 'ACTIVE')
ON CONFLICT (tenant_code) DO NOTHING;

INSERT INTO core.companies (id, tenant_id, company_code, name, currency, country) VALUES
  (1, 1, 'CMP-MENA-01', 'NexusLogix Fulfilment MENA LLC', 'USD', 'United Arab Emirates')
ON CONFLICT (company_code) DO NOTHING;

INSERT INTO core.warehouses (id, company_id, warehouse_code, name, city, country, timezone, warehouse_type, total_area_sqft, dock_doors, status) VALUES
  (1, 1, 'WH-DXB-01', 'Dubai Jebel Ali Mega Fulfilment Hub', 'Dubai', 'United Arab Emirates', 'Asia/Dubai', 'AUTOMATED_OMNICHANNEL', 145000, 18, 'ACTIVE'),
  (2, 1, 'WH-AUH-02', 'Abu Dhabi KEZAD Robotics & Cold Hub', 'Abu Dhabi', 'United Arab Emirates', 'Asia/Dubai', 'ROBOTICS_COLD_CHAIN', 92000, 12, 'ACTIVE'),
  (3, 1, 'WH-SHJ-03', 'Sharjah Express Air Cross-Dock', 'Sharjah', 'United Arab Emirates', 'Asia/Dubai', 'EXPRESS_CROSS_DOCK', 48000, 8, 'ACTIVE')
ON CONFLICT (warehouse_code) DO NOTHING;

INSERT INTO core.users (id, tenant_id, email, full_name, role, assigned_warehouse_id) VALUES
  (1, 1, 'tariq.mansoor@nexuslogix.ae', 'Tariq Al-Mansoor', 'VP_OPERATIONS', 1),
  (2, 1, 'layla.hassan@nexuslogix.ae', 'Layla Hassan', 'INVENTORY_CONTROLLER', 1),
  (3, 1, 'omar.farooq@nexuslogix.ae', 'Omar Farooq', 'WAVE_PLANNER', 1),
  (4, 1, 'nadia.khoury@nexuslogix.ae', 'Nadia Khoury', 'QA_INSPECTOR', 2)
ON CONFLICT (email) DO NOTHING;

-- 02. MASTER: Products, SKUs, Suppliers, Customers, Carriers
INSERT INTO master.products (id, company_id, product_code, name, category, brand, temperature_zone, hazmat) VALUES
  (1, 1, 'PRD-VIS-01', 'NeuralEdge Vision Systems', 'Industrial Automation', 'NeuralEdge', 'AMBIENT', FALSE),
  (2, 1, 'PRD-LID-02', 'Solid-State AMR LiDAR Sensors', 'Robotics Sensing', 'VelodynePro', 'AMBIENT', FALSE),
  (3, 1, 'PRD-BAT-03', 'AGV Smart Energy Modules', 'Power Systems', 'VoltCore', 'AMBIENT', TRUE),
  (4, 1, 'PRD-RFD-04', 'Ultra-Wideband RFID Gateways', 'Auto-ID & RF', 'ZebraLink', 'AMBIENT', FALSE),
  (5, 1, 'PRD-THM-05', 'CryoSense Cold-Chain Telemetry', 'IoT Cold Chain', 'CryoSense', 'CHILLED', FALSE),
  (6, 1, 'PRD-PRN-06', 'Industrial Thermal Label Systems', 'Auto-ID & RF', 'ZebraLink', 'AMBIENT', FALSE),
  (7, 1, 'PRD-SRV-07', 'High-Torque Conveyor Actuators', 'Motion Control', 'MunichDrive', 'AMBIENT', FALSE),
  (8, 1, 'PRD-PLC-08', 'Deterministic Edge Controllers', 'Industrial Automation', 'SiemensEdge', 'AMBIENT', FALSE),
  (9, 1, 'PRD-PKG-09', 'EcoShield Protective Packaging', 'Consumables', 'EcoShield', 'AMBIENT', FALSE),
  (10, 1, 'PRD-ESD-10', 'Carbon-Conductive Storage Totes', 'Material Handling', 'KardexPro', 'AMBIENT', FALSE),
  (11, 1, 'PRD-CAB-11', 'Armored Industrial Networking', 'Connectivity', 'BeldenCore', 'AMBIENT', FALSE),
  (12, 1, 'PRD-OPT-12', 'High-Speed Optical Transceivers', 'Connectivity', 'PhotonixTW', 'AMBIENT', FALSE)
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO master.skus (id, product_id, sku_code, barcode, name, uom, weight_kg, volume_cm3, unit_cost, velocity_class, reorder_point, max_stock, lot_tracked) VALUES
  (1, 1, 'SKU-NVX-900', '6291041500013', 'NeuralEdge Industrial Vision Scanner X9', 'EA', 1.450, 3200, 420.00, 'A', 25, 180, TRUE),
  (2, 2, 'SKU-LID-450', '6291041500020', 'Solid-State AMR LiDAR Sensor Module', 'EA', 0.850, 1800, 680.00, 'A', 20, 150, TRUE),
  (3, 3, 'SKU-BAT-72V', '6291041500037', 'Lithium-Iron AGV Smart Battery Pack 72V', 'EA', 14.200, 18500, 890.00, 'A', 15, 100, TRUE),
  (4, 4, 'SKU-RFID-GTW', '6291041500044', 'Ultra-Wideband Dock Door RFID Gateway', 'EA', 3.100, 7400, 540.00, 'A', 18, 120, TRUE),
  (5, 5, 'SKU-THM-LOG', '6291041500051', 'CryoSense IoT Cold-Chain Telemetry Pod', 'BOX', 0.620, 1200, 145.00, 'B', 35, 240, TRUE),
  (6, 6, 'SKU-PRN-Z40', '6291041500068', 'Thermal Industrial Label Printer 600dpi', 'EA', 6.800, 14200, 390.00, 'B', 12, 90, FALSE),
  (7, 7, 'SKU-SRV-M12', '6291041500075', 'Brushless Conveyor Servo Actuator M12', 'EA', 4.300, 5600, 260.00, 'B', 20, 160, TRUE),
  (8, 8, 'SKU-PLC-C88', '6291041500082', 'Edge PLC Deterministic Controller C88', 'EA', 1.950, 4100, 510.00, 'B', 15, 110, TRUE),
  (9, 9, 'SKU-PKG-BIO', '6291041500099', 'EcoShield Shock-Absorbing Mailer Crate (50pk)', 'CTN', 8.500, 32000, 65.00, 'A', 40, 300, FALSE),
  (10, 10, 'SKU-ESD-TOT', '6291041500105', 'Carbon-Conductive ESD Modular Tote Bin', 'EA', 2.200, 24000, 48.00, 'C', 30, 250, FALSE),
  (11, 11, 'SKU-CAB-CAT8', '6291041500112', 'Armored Industrial Cat8 Trunk Cable 25m', 'RL', 3.400, 6800, 82.00, 'C', 25, 200, FALSE),
  (12, 12, 'SKU-OPT-SFP', '6291041500129', '100G QSFP28 Optical Transceiver Pair', 'PAIR', 0.180, 450, 310.00, 'A', 25, 160, TRUE)
ON CONFLICT (sku_code) DO NOTHING;

INSERT INTO master.suppliers (id, supplier_code, name, contact_email, country, lead_time_days, rating) VALUES
  (1, 'SUP-SZN-01', 'Shenzhen OptoRobotics Ltd', 'supply@optorobotics.cn', 'China', 6, 4.90),
  (2, 'SUP-MUC-02', 'Munich Precision Drives GmbH', 'logistics@munichdrives.de', 'Germany', 5, 4.85),
  (3, 'SUP-FUJ-03', 'Fujairah EcoPackaging Industries', 'orders@ecopack.ae', 'United Arab Emirates', 2, 4.95),
  (4, 'SUP-TPE-04', 'Taipei Semiconductor Photonics', 'fulfilment@photonix.tw', 'Taiwan', 7, 4.88)
ON CONFLICT (supplier_code) DO NOTHING;

INSERT INTO master.customers (id, customer_code, name, contact_email, city, country, sla_tier) VALUES
  (1, 'CUS-EKC-01', 'Emirates SkyCargo Tech Ops', 'procurement@skycargo-ops.ae', 'Dubai', 'United Arab Emirates', 'SAME_DAY'),
  (2, 'CUS-NON-02', 'Noon Automated Sortation Centers', 'warehouse-eng@noon-ops.ae', 'Dubai', 'United Arab Emirates', 'PRIORITY'),
  (3, 'CUS-RYD-03', 'Riyadh GigaFactory Automation', 'inbound@riyadhgiga.sa', 'Riyadh', 'Saudi Arabia', 'PRIORITY'),
  (4, 'CUS-MED-04', 'MENA BioPharma Cold Logistics', 'ops@menabiopharma.ae', 'Abu Dhabi', 'United Arab Emirates', 'SAME_DAY'),
  (5, 'CUS-DOH-05', 'Doha Autonomous Port Terminal', 'parts@dohaports.qa', 'Doha', 'Qatar', 'STANDARD')
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO master.carriers (id, carrier_code, name, service_type, scac_code) VALUES
  (1, 'CAR-DHL', 'DHL Express MENA', 'EXPRESS_AIR', 'DHLE'),
  (2, 'CAR-ARMX', 'Aramex Priority Gulf', 'NEXT_DAY_GROUND', 'ARMX'),
  (3, 'CAR-SKY', 'Emirates SkyCargo', 'SAME_DAY_AIR', 'EKSC'),
  (4, 'CAR-MRSK', 'Maersk Overland GCC', 'HEAVY_FREIGHT', 'MAEU')
ON CONFLICT (carrier_code) DO NOTHING;

-- 03. LOCATION: 22 Spatial Bins across WH-DXB-01, WH-AUH-02, WH-SHJ-03
-- Coordinates (x_coord, y_coord) represent meters on the warehouse floor grid from Dispatch/Origin (0,0)
INSERT INTO location.locations (id, warehouse_id, location_code, barcode, zone, aisle, rack, shelf, bin, location_type, x_coord, y_coord, z_coord, max_capacity, max_weight_kg) VALUES
  (1, 1, 'DXB-RCV-D01', 'LOC-DXB-RCV01', 'RCV', '00', 'D1', 'S1', 'B1', 'RECEIVING', 4, 2, 1, 500, 5000),
  (2, 1, 'DXB-A-01-R1-B1', 'LOC-DXB-A01R1', 'ZONE-A', '01', 'R1', 'S1', 'B1', 'PICK_FACE', 12, 8, 1, 150, 800),
  (3, 1, 'DXB-A-01-R2-B1', 'LOC-DXB-A01R2', 'ZONE-A', '01', 'R2', 'S1', 'B1', 'PICK_FACE', 12, 22, 1, 150, 800),
  (4, 1, 'DXB-A-02-R1-B1', 'LOC-DXB-A02R1', 'ZONE-A', '02', 'R1', 'S2', 'B1', 'PICK_FACE', 24, 10, 1, 150, 1500),
  (5, 1, 'DXB-A-02-R3-B2', 'LOC-DXB-A02R3', 'ZONE-A', '02', 'R3', 'S1', 'B2', 'PICK_FACE', 24, 30, 1, 150, 800),
  (6, 1, 'DXB-A-03-R1-B1', 'LOC-DXB-A03R1', 'ZONE-A', '03', 'R1', 'S1', 'B1', 'PICK_FACE', 36, 12, 1, 200, 1200),
  (7, 1, 'DXB-A-03-R4-B1', 'LOC-DXB-A03R4', 'ZONE-A', '03', 'R4', 'S2', 'B1', 'PICK_FACE', 36, 36, 1, 150, 800),
  (8, 1, 'DXB-B-04-R1-B1', 'LOC-DXB-B04R1', 'ZONE-B', '04', 'R1', 'S1', 'B1', 'PICK_FACE', 48, 14, 1, 180, 1000),
  (9, 1, 'DXB-B-04-R3-B1', 'LOC-DXB-B04R3', 'ZONE-B', '04', 'R3', 'S2', 'B1', 'PICK_FACE', 48, 32, 2, 180, 1000),
  (10, 1, 'DXB-B-05-R2-B1', 'LOC-DXB-B05R2', 'ZONE-B', '05', 'R2', 'S1', 'B1', 'PICK_FACE', 60, 20, 1, 220, 1200),
  (11, 1, 'DXB-B-05-R4-B1', 'LOC-DXB-B05R4', 'ZONE-B', '05', 'R4', 'S1', 'B1', 'PICK_FACE', 60, 38, 1, 220, 1200),
  (12, 1, 'DXB-C-06-R1-B1', 'LOC-DXB-C06R1', 'ZONE-C', '06', 'R1', 'S1', 'B1', 'COLD_STORAGE', 72, 16, 1, 200, 900),
  (13, 1, 'DXB-BLK-07-P1', 'LOC-DXB-BLK01', 'BULK', '07', 'P1', 'S3', 'B1', 'BULK_STORAGE', 82, 12, 3, 400, 4000),
  (14, 1, 'DXB-BLK-07-P2', 'LOC-DXB-BLK02', 'BULK', '07', 'P2', 'S3', 'B1', 'BULK_STORAGE', 82, 28, 3, 400, 4000),
  (15, 1, 'DXB-PCK-ST01', 'LOC-DXB-PCK01', 'PACK', '00', 'ST1', 'S1', 'B1', 'PACKING', 8, 44, 1, 300, 2000),
  (16, 1, 'DXB-DSP-GATE1', 'LOC-DXB-DSP01', 'DISPATCH', '00', 'G1', 'S1', 'B1', 'DISPATCH', 2, 46, 1, 500, 5000),
  (17, 1, 'DXB-QRN-HOLD1', 'LOC-DXB-QRN01', 'QUARANTINE', '08', 'Q1', 'S1', 'B1', 'QUARANTINE', 88, 42, 1, 150, 1500),
  (18, 2, 'AUH-A-01-R1-B1', 'LOC-AUH-A01R1', 'ZONE-A', '01', 'R1', 'S1', 'B1', 'PICK_FACE', 14, 10, 1, 200, 1200),
  (19, 2, 'AUH-C-02-R1-B1', 'LOC-AUH-C02R1', 'ZONE-C', '02', 'R1', 'S1', 'B1', 'COLD_STORAGE', 28, 18, 1, 240, 1200),
  (20, 2, 'AUH-BLK-03-P1', 'LOC-AUH-BLK01', 'BULK', '03', 'P1', 'S2', 'B1', 'BULK_STORAGE', 46, 24, 2, 400, 3500),
  (21, 3, 'SHJ-XD-01-B1', 'LOC-SHJ-XD01', 'XDOCK', '01', 'X1', 'S1', 'B1', 'PICK_FACE', 10, 10, 1, 250, 2000),
  (22, 3, 'SHJ-DSP-AIR1', 'LOC-SHJ-DSP01', 'DISPATCH', '00', 'G1', 'S1', 'B1', 'DISPATCH', 4, 28, 1, 350, 3000)
ON CONFLICT (warehouse_id, location_code) DO NOTHING;

-- 05. INVENTORY BALANCES (Strict parity with Ledger & Reservations below)
-- Note: SKU 12 (SKU-OPT-SFP) in bin 7 has only 8 on_hand, 2 reserved => 6 available!
-- Note: SKU 9 (SKU-PKG-BIO) — Velocity A high-pick item intentionally placed in far Zone B bin 11 (x=60,y=38)
--       and SKU 10 (SKU-ESD-TOT) — Velocity C slow item placed in prime Zone A bin 3 (x=12,y=22),
--       giving Quantum QUBO Slotting Optimizer a genuine high-ROI swap opportunity!
INSERT INTO inventory.inventory_balances (id, warehouse_id, location_id, sku_id, lot_number, serial_prefix, expiry_date, on_hand_qty, reserved_qty) VALUES
  (1, 1, 2, 1, 'LOT-2026-NVX1', 'SN-NVX9', '2028-06-30', 64, 6),
  (2, 1, 3, 10, 'LOT-2026-ESD1', NULL, NULL, 95, 0),
  (3, 1, 4, 3, 'LOT-2026-BAT1', 'SN-BAT7', '2027-09-15', 38, 4),
  (4, 1, 5, 4, 'LOT-2026-RFD1', 'SN-RFD4', '2028-12-31', 42, 5),
  (5, 1, 6, 2, 'LOT-2026-LID1', 'SN-LID2', '2028-03-31', 11, 3),
  (6, 1, 7, 12, 'LOT-2026-OPT1', 'SN-OPT8', '2029-01-31', 8, 2),
  (7, 1, 8, 6, 'LOT-2026-PRN1', 'SN-PRN6', NULL, 29, 2),
  (8, 1, 9, 7, 'LOT-2026-SRV1', 'SN-SRV7', '2028-08-31', 54, 6),
  (9, 1, 10, 8, 'LOT-2026-PLC1', 'SN-PLC8', '2028-11-30', 33, 3),
  (10, 1, 11, 9, 'LOT-2026-PKG1', NULL, NULL, 140, 10),
  (11, 1, 12, 5, 'LOT-2026-THM1', 'SN-THM5', '2026-12-18', 48, 0),
  (12, 1, 13, 2, 'LOT-2026-LIDB', 'SN-LIDB', '2028-10-31', 90, 0),
  (13, 1, 14, 1, 'LOT-2026-NVXB', 'SN-NVXB', '2028-11-30', 80, 0),
  (14, 1, 14, 11, 'LOT-2026-CAB1', NULL, NULL, 75, 0),
  (15, 2, 18, 1, 'LOT-2026-AUH1', 'SN-AUH1', '2028-07-31', 45, 0),
  (16, 2, 19, 5, 'LOT-2026-AUHC', 'SN-AUHC', '2027-04-30', 110, 0),
  (17, 2, 20, 3, 'LOT-2026-AUHB', 'SN-AUHB', '2027-11-30', 32, 0),
  (18, 3, 21, 9, 'LOT-2026-SHJ1', NULL, NULL, 85, 0),
  (19, 3, 21, 4, 'LOT-2026-SHJ2', 'SN-SHJ4', '2028-09-30', 26, 0)
ON CONFLICT (warehouse_id, location_id, sku_id, lot_number) DO NOTHING;

-- 05b. IMMUTABLE INVENTORY LEDGER (Exact sum of qty_delta matches on_hand_qty for every balance!)
INSERT INTO inventory.inventory_ledger (id, idempotency_key, tx_hash, warehouse_id, location_id, sku_id, lot_number, movement_type, qty_delta, reserved_delta, balance_after, reference_type, reference_code, operator_name, created_at) VALUES
  (1, 'SEED-LED-001', 'sha256:8f01a1c4e9b2', 1, 2, 1, 'LOT-2026-NVX1', 'OPENING_BALANCE', 50, 0, 50, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '6 days'),
  (2, 'SEED-LED-002', 'sha256:9b12d3f8a7c1', 1, 2, 1, 'LOT-2026-NVX1', 'INBOUND_RECEIPT', 20, 0, 70, 'PO', 'PO-2026-401', 'Nadia Khoury', NOW() - INTERVAL '3 days'),
  (3, 'SEED-LED-003', 'sha256:4c23e5a1d9f0', 1, 2, 1, 'LOT-2026-NVX1', 'OUTBOUND_PICK', -6, 0, 64, 'SO', 'SO-2026-8801', 'Picker-RF-01', NOW() - INTERVAL '2 days'),
  (4, 'SEED-LED-004', 'sha256:7d34f6b2e8a1', 1, 2, 1, 'LOT-2026-NVX1', 'RESERVATION_LOCK', 0, 6, 64, 'SO', 'SO-2026-8803', 'Auto-Allocator', NOW() - INTERVAL '5 hours'),
  (5, 'SEED-LED-005', 'sha256:1e45a7c3f9b2', 1, 3, 10, 'LOT-2026-ESD1', 'OPENING_BALANCE', 95, 0, 95, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '6 days'),
  (6, 'SEED-LED-006', 'sha256:2f56b8d4a0c3', 1, 4, 3, 'LOT-2026-BAT1', 'OPENING_BALANCE', 38, 0, 38, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '6 days'),
  (7, 'SEED-LED-007', 'sha256:3a67c9e5b1d4', 1, 4, 3, 'LOT-2026-BAT1', 'RESERVATION_LOCK', 0, 4, 38, 'SO', 'SO-2026-8803', 'Auto-Allocator', NOW() - INTERVAL '5 hours'),
  (8, 'SEED-LED-008', 'sha256:4b78d0f6c2e5', 1, 5, 4, 'LOT-2026-RFD1', 'OPENING_BALANCE', 42, 0, 42, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '6 days'),
  (9, 'SEED-LED-009', 'sha256:5c89e1a7d3f6', 1, 5, 4, 'LOT-2026-RFD1', 'RESERVATION_LOCK', 0, 5, 42, 'SO', 'SO-2026-8804', 'Auto-Allocator', NOW() - INTERVAL '4 hours'),
  (10, 'SEED-LED-010', 'sha256:6d90f2b8e4a7', 1, 6, 2, 'LOT-2026-LID1', 'OPENING_BALANCE', 15, 0, 15, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (11, 'SEED-LED-011', 'sha256:7e01a3c9f5b8', 1, 6, 2, 'LOT-2026-LID1', 'OUTBOUND_PICK', -4, 0, 11, 'SO', 'SO-2026-8802', 'Picker-RF-02', NOW() - INTERVAL '1 day'),
  (12, 'SEED-LED-012', 'sha256:8f12b4d0a6c9', 1, 6, 2, 'LOT-2026-LID1', 'RESERVATION_LOCK', 0, 3, 11, 'SO', 'SO-2026-8804', 'Auto-Allocator', NOW() - INTERVAL '4 hours'),
  (13, 'SEED-LED-013', 'sha256:9a23c5e1b7d0', 1, 7, 12, 'LOT-2026-OPT1', 'OPENING_BALANCE', 8, 0, 8, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (14, 'SEED-LED-014', 'sha256:0b34d6f2c8e1', 1, 7, 12, 'LOT-2026-OPT1', 'RESERVATION_LOCK', 0, 2, 8, 'SO', 'SO-2026-8805', 'Auto-Allocator', NOW() - INTERVAL '3 hours'),
  (15, 'SEED-LED-015', 'sha256:1c45e7a3d9f2', 1, 8, 6, 'LOT-2026-PRN1', 'OPENING_BALANCE', 29, 0, 29, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (16, 'SEED-LED-016', 'sha256:2d56f8b4e0a3', 1, 8, 6, 'LOT-2026-PRN1', 'RESERVATION_LOCK', 0, 2, 29, 'SO', 'SO-2026-8805', 'Auto-Allocator', NOW() - INTERVAL '3 hours'),
  (17, 'SEED-LED-017', 'sha256:3e67a9c5f1b4', 1, 9, 7, 'LOT-2026-SRV1', 'OPENING_BALANCE', 54, 0, 54, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (18, 'SEED-LED-018', 'sha256:4f78b0d6a2c5', 1, 9, 7, 'LOT-2026-SRV1', 'RESERVATION_LOCK', 0, 6, 54, 'SO', 'SO-2026-8803', 'Auto-Allocator', NOW() - INTERVAL '5 hours'),
  (19, 'SEED-LED-019', 'sha256:5a89c1e7b3d6', 1, 10, 8, 'LOT-2026-PLC1', 'OPENING_BALANCE', 33, 0, 33, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (20, 'SEED-LED-020', 'sha256:6b90d2f8c4e7', 1, 10, 8, 'LOT-2026-PLC1', 'RESERVATION_LOCK', 0, 3, 33, 'SO', 'SO-2026-8804', 'Auto-Allocator', NOW() - INTERVAL '4 hours'),
  (21, 'SEED-LED-021', 'sha256:7c01e3a9d5f8', 1, 11, 9, 'LOT-2026-PKG1', 'OPENING_BALANCE', 140, 0, 140, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (22, 'SEED-LED-022', 'sha256:8d12f4b0e6a9', 1, 11, 9, 'LOT-2026-PKG1', 'RESERVATION_LOCK', 0, 10, 140, 'SO', 'SO-2026-8805', 'Auto-Allocator', NOW() - INTERVAL '3 hours'),
  (23, 'SEED-LED-023', 'sha256:9e23a5c1f7b0', 1, 12, 5, 'LOT-2026-THM1', 'OPENING_BALANCE', 48, 0, 48, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '4 days'),
  (24, 'SEED-LED-024', 'sha256:0f34b6d2a8c1', 1, 13, 2, 'LOT-2026-LIDB', 'OPENING_BALANCE', 90, 0, 90, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '4 days'),
  (25, 'SEED-LED-025', 'sha256:1a45c7e3b9d2', 1, 14, 1, 'LOT-2026-NVXB', 'OPENING_BALANCE', 80, 0, 80, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '4 days'),
  (26, 'SEED-LED-026', 'sha256:2b56d8f4c0e3', 1, 14, 11, 'LOT-2026-CAB1', 'OPENING_BALANCE', 75, 0, 75, 'INIT', 'OPEN-2026', 'Layla Hassan', NOW() - INTERVAL '4 days'),
  (27, 'SEED-LED-027', 'sha256:3c67e9a5d1f4', 2, 18, 1, 'LOT-2026-AUH1', 'OPENING_BALANCE', 45, 0, 45, 'INIT', 'OPEN-2026', 'Nadia Khoury', NOW() - INTERVAL '4 days'),
  (28, 'SEED-LED-028', 'sha256:4d78f0b6e2a5', 2, 19, 5, 'LOT-2026-AUHC', 'OPENING_BALANCE', 110, 0, 110, 'INIT', 'OPEN-2026', 'Nadia Khoury', NOW() - INTERVAL '4 days'),
  (29, 'SEED-LED-029', 'sha256:5e89a1c7f3b6', 2, 20, 3, 'LOT-2026-AUHB', 'OPENING_BALANCE', 32, 0, 32, 'INIT', 'OPEN-2026', 'Nadia Khoury', NOW() - INTERVAL '4 days'),
  (30, 'SEED-LED-030', 'sha256:6f90b2d8a4c7', 3, 21, 9, 'LOT-2026-SHJ1', 'OPENING_BALANCE', 85, 0, 85, 'INIT', 'OPEN-2026', 'Tariq Al-Mansoor', NOW() - INTERVAL '4 days'),
  (31, 'SEED-LED-031', 'sha256:7a01c3e9b5d8', 3, 21, 4, 'LOT-2026-SHJ2', 'OPENING_BALANCE', 26, 0, 26, 'INIT', 'OPEN-2026', 'Tariq Al-Mansoor', NOW() - INTERVAL '4 days')
ON CONFLICT (idempotency_key) DO NOTHING;

-- 04. INBOUND: Purchase Orders, Lines, and Receipts (GRNs)
INSERT INTO inbound.purchase_orders (id, po_number, warehouse_id, supplier_id, asn_number, status, expected_date, notes, created_by, created_at) VALUES
  (1, 'PO-2026-401', 1, 1, 'ASN-SZN-8821', 'RECEIVED', CURRENT_DATE - 3, 'Initial Q4 Vision Scanner replenishment', 'Layla Hassan', NOW() - INTERVAL '5 days'),
  (2, 'PO-2026-402', 1, 4, 'ASN-TPE-9910', 'ASN_IN_TRANSIT', CURRENT_DATE, 'Urgent 100G QSFP28 Optical Transceiver air-freight restock', 'Tariq Al-Mansoor', NOW() - INTERVAL '2 days'),
  (3, 'PO-2026-403', 1, 2, 'ASN-MUC-4402', 'PENDING_QC', CURRENT_DATE, 'Munich Servo & Edge PLC pallet arrived at Dock D01', 'Nadia Khoury', NOW() - INTERVAL '6 hours'),
  (4, 'PO-2026-404', 2, 3, 'ASN-FUJ-3109', 'OPEN', CURRENT_DATE + 2, 'EcoShield crates for Abu Dhabi KEZAD hub', 'Layla Hassan', NOW() - INTERVAL '1 day')
ON CONFLICT (po_number) DO NOTHING;

INSERT INTO inbound.purchase_order_lines (id, po_id, sku_id, ordered_qty, received_qty, unit_cost) VALUES
  (1, 1, 1, 20, 20, 420.00),
  (2, 2, 12, 50, 0, 310.00),
  (3, 2, 4, 25, 0, 540.00),
  (4, 3, 7, 30, 0, 260.00),
  (5, 3, 8, 20, 0, 510.00),
  (6, 4, 9, 100, 0, 65.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inbound.receipts (id, grn_number, po_id, warehouse_id, sku_id, received_qty, accepted_qty, rejected_qty, lot_number, qc_status, putaway_location_id, inspector_name, received_at) VALUES
  (1, 'GRN-2026-701', 1, 1, 1, 20, 20, 0, 'LOT-2026-NVX1', 'PASSED', 2, 'Nadia Khoury', NOW() - INTERVAL '3 days')
ON CONFLICT (grn_number) DO NOTHING;

-- 06. OUTBOUND: Waves, Sales Orders, Order Lines, Active Reservations, Allocations & Pick Tasks
INSERT INTO outbound.waves (id, wave_number, warehouse_id, strategy, status, order_count, total_units, classical_distance_m, quantum_distance_m, speedup_pct, created_at) VALUES
  (1, 'WV-2026-09', 1, 'CLASSICAL_SERPENTINE', 'IN_PROGRESS', 3, 39, 348.00, 214.50, 38.36, NOW() - INTERVAL '4 hours')
ON CONFLICT (wave_number) DO NOTHING;

INSERT INTO outbound.sales_orders (id, so_number, warehouse_id, customer_id, wave_id, priority, status, promised_date, total_value, notes, created_at) VALUES
  (1, 'SO-2026-8801', 1, 1, NULL, 'SAME_DAY', 'DISPATCHED', CURRENT_DATE - 1, 3240.00, 'SkyCargo Gate 4 automated scanner upgrade', NOW() - INTERVAL '2 days'),
  (2, 'SO-2026-8802', 1, 2, NULL, 'PRIORITY', 'PACKED', CURRENT_DATE, 3360.00, 'Noon sortation AMR LiDAR spare kit', NOW() - INTERVAL '1 day'),
  (3, 'SO-2026-8803', 1, 1, 1, 'SAME_DAY', 'PICKING', CURRENT_DATE, 7640.00, 'Wave WV-2026-09 high-priority robotics bundle', NOW() - INTERVAL '5 hours'),
  (4, 'SO-2026-8804', 1, 3, 1, 'PRIORITY', 'ALLOCATED', CURRENT_DATE, 6270.00, 'Riyadh GigaFactory line expansion', NOW() - INTERVAL '4 hours'),
  (5, 'SO-2026-8805', 1, 2, 1, 'PRIORITY', 'ALLOCATED', CURRENT_DATE, 2050.00, 'Optics + Printers + Packaging bundle', NOW() - INTERVAL '3 hours'),
  (6, 'SO-2026-8806', 1, 4, NULL, 'SAME_DAY', 'PENDING', CURRENT_DATE, 2900.00, 'Cold-chain telemetry pods + RFID gateways', NOW() - INTERVAL '90 minutes'),
  (7, 'SO-2026-8807', 1, 1, NULL, 'CRITICAL', 'PENDING', CURRENT_DATE, 1550.00, 'Competing Order A: Requests 5x 100G QSFP28 Optical Transceivers (Only 6 available!)', NOW() - INTERVAL '45 minutes'),
  (8, 'SO-2026-8808', 1, 5, NULL, 'CRITICAL', 'PENDING', CURRENT_DATE, 1550.00, 'Competing Order B: Requests 5x 100G QSFP28 Optical Transceivers (Test Race Lock!)', NOW() - INTERVAL '30 minutes')
ON CONFLICT (so_number) DO NOTHING;

INSERT INTO outbound.sales_order_lines (id, so_id, sku_id, ordered_qty, allocated_qty, picked_qty, unit_price) VALUES
  (1, 1, 1, 6, 6, 6, 540.00),
  (2, 2, 2, 4, 4, 4, 840.00),
  (3, 3, 1, 6, 6, 0, 520.00),
  (4, 3, 3, 4, 4, 0, 980.00),
  (5, 3, 7, 6, 6, 0, 320.00),
  (6, 4, 4, 5, 5, 0, 620.00),
  (7, 4, 2, 3, 3, 0, 780.00),
  (8, 4, 8, 3, 3, 0, 590.00),
  (9, 5, 12, 2, 2, 0, 380.00),
  (10, 5, 6, 2, 2, 0, 440.00),
  (11, 5, 9, 10, 10, 0, 81.00),
  (12, 6, 5, 12, 0, 0, 175.00),
  (13, 6, 1, 2, 0, 0, 400.00),
  (14, 7, 12, 5, 0, 0, 310.00),
  (15, 8, 12, 5, 0, 0, 310.00)
ON CONFLICT (id) DO NOTHING;

-- Reservations matching exact reserved_qty on balances (1:6, 3:4, 4:5, 5:3, 6:2, 7:2, 8:6, 9:3, 10:10)
INSERT INTO inventory.reservations (id, reservation_code, balance_id, sku_id, warehouse_id, location_id, reference_code, reserved_qty, status, locked_by) VALUES
  (1, 'RSV-8803-1', 1, 1, 1, 2, 'SO-2026-8803', 6, 'ACTIVE', 'Auto-Allocator'),
  (2, 'RSV-8803-2', 3, 3, 1, 4, 'SO-2026-8803', 4, 'ACTIVE', 'Auto-Allocator'),
  (3, 'RSV-8803-3', 8, 7, 1, 9, 'SO-2026-8803', 6, 'ACTIVE', 'Auto-Allocator'),
  (4, 'RSV-8804-1', 4, 4, 1, 5, 'SO-2026-8804', 5, 'ACTIVE', 'Auto-Allocator'),
  (5, 'RSV-8804-2', 5, 2, 1, 6, 'SO-2026-8804', 3, 'ACTIVE', 'Auto-Allocator'),
  (6, 'RSV-8804-3', 9, 8, 1, 10, 'SO-2026-8804', 3, 'ACTIVE', 'Auto-Allocator'),
  (7, 'RSV-8805-1', 6, 12, 1, 7, 'SO-2026-8805', 2, 'ACTIVE', 'Auto-Allocator'),
  (8, 'RSV-8805-2', 7, 6, 1, 8, 'SO-2026-8805', 2, 'ACTIVE', 'Auto-Allocator'),
  (9, 'RSV-8805-3', 10, 9, 1, 11, 'SO-2026-8805', 10, 'ACTIVE', 'Auto-Allocator')
ON CONFLICT (reservation_code) DO NOTHING;

INSERT INTO outbound.allocations (id, allocation_code, so_id, so_line_id, balance_id, sku_id, location_id, allocated_qty, status, operator_name) VALUES
  (1, 'ALC-8803-1', 3, 3, 1, 1, 2, 6, 'ALLOCATED', 'Auto-Allocator'),
  (2, 'ALC-8803-2', 3, 4, 3, 3, 4, 4, 'ALLOCATED', 'Auto-Allocator'),
  (3, 'ALC-8803-3', 3, 5, 8, 7, 9, 6, 'ALLOCATED', 'Auto-Allocator'),
  (4, 'ALC-8804-1', 4, 6, 4, 4, 5, 5, 'ALLOCATED', 'Auto-Allocator'),
  (5, 'ALC-8804-2', 4, 7, 5, 2, 6, 3, 'ALLOCATED', 'Auto-Allocator'),
  (6, 'ALC-8804-3', 4, 8, 9, 8, 10, 3, 'ALLOCATED', 'Auto-Allocator'),
  (7, 'ALC-8805-1', 5, 9, 6, 12, 7, 2, 'ALLOCATED', 'Auto-Allocator'),
  (8, 'ALC-8805-2', 5, 10, 7, 6, 8, 2, 'ALLOCATED', 'Auto-Allocator'),
  (9, 'ALC-8805-3', 5, 11, 10, 9, 11, 10, 'ALLOCATED', 'Auto-Allocator')
ON CONFLICT (allocation_code) DO NOTHING;

-- Deliberately suboptimal initial pick sequence (zig-zagging across aisles) so Quantum Annealing shows dramatic real travel savings!
INSERT INTO outbound.pick_tasks (id, task_code, wave_id, allocation_id, so_id, warehouse_id, sku_id, from_location_id, to_location_id, qty, pick_sequence, travel_distance_m, assigned_to, status) VALUES
  (1, 'PCK-2026-01', 1, 3, 3, 1, 7, 9, 15, 6, 1, 52.0, 'Picker-RF-01', 'OPEN'),
  (2, 'PCK-2026-02', 1, 1, 3, 1, 1, 2, 15, 6, 2, 60.0, 'Picker-RF-01', 'OPEN'),
  (3, 'PCK-2026-03', 1, 9, 5, 1, 9, 11, 15, 10, 3, 78.0, 'Picker-RF-01', 'OPEN'),
  (4, 'PCK-2026-04', 1, 2, 3, 1, 3, 4, 15, 4, 4, 64.0, 'Picker-RF-01', 'OPEN'),
  (5, 'PCK-2026-05', 1, 6, 4, 1, 8, 10, 15, 3, 5, 46.0, 'Picker-RF-01', 'OPEN'),
  (6, 'PCK-2026-06', 1, 4, 4, 1, 4, 5, 15, 5, 6, 46.0, 'Picker-RF-01', 'OPEN'),
  (7, 'PCK-2026-07', 1, 8, 5, 1, 6, 8, 15, 2, 7, 40.0, 'Picker-RF-01', 'OPEN'),
  (8, 'PCK-2026-08', 1, 5, 4, 1, 2, 6, 15, 3, 8, 14.0, 'Picker-RF-01', 'OPEN'),
  (9, 'PCK-2026-09', 1, 7, 5, 1, 12, 7, 15, 2, 9, 24.0, 'Picker-RF-01', 'OPEN')
ON CONFLICT (task_code) DO NOTHING;

-- Cartons & Shipments for completed/packed orders
INSERT INTO outbound.cartons (id, carton_number, so_id, warehouse_id, carton_type, gross_weight_kg, status, packed_by, packed_at) VALUES
  (1, 'CTN-DXB-9001', 1, 1, 'EURO-TOT-L', 9.200, 'SHIPPED', 'Pack-Station-01', NOW() - INTERVAL '44 hours'),
  (2, 'CTN-DXB-9002', 2, 1, 'STD-BOX-M', 3.900, 'PACKED', 'Pack-Station-02', NOW() - INTERVAL '18 hours')
ON CONFLICT (carton_number) DO NOTHING;

INSERT INTO outbound.pack_lines (id, carton_id, pick_task_id, sku_id, packed_qty) VALUES
  (1, 1, NULL, 1, 6),
  (2, 2, NULL, 2, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transport.shipments (id, shipment_number, so_id, warehouse_id, carrier_id, carton_id, tracking_number, service_level, total_weight_kg, status, dispatched_at, delivered_at) VALUES
  (1, 'SHP-2026-501', 1, 1, 3, 1, 'EKSC-992048112AE', 'SAME_DAY_AIR', 9.200, 'DELIVERED', NOW() - INTERVAL '42 hours', NOW() - INTERVAL '38 hours')
ON CONFLICT (shipment_number) DO NOTHING;

-- 07. REPLENISHMENT: Rules & Pending Task (SKU-LID-450 in DXB-A-03-R1-B1 has 8 available < min 15, while Bulk bin 13 has 90!)
INSERT INTO replenishment.replenishment_rules (id, warehouse_id, sku_id, pick_location_id, source_location_id, min_qty, max_qty) VALUES
  (1, 1, 2, 6, 13, 15, 80),
  (2, 1, 1, 2, 14, 20, 100)
ON CONFLICT (warehouse_id, sku_id, pick_location_id) DO NOTHING;

INSERT INTO replenishment.replenishment_tasks (id, replen_code, warehouse_id, sku_id, from_location_id, to_location_id, qty, priority, status) VALUES
  (1, 'RPL-2026-101', 1, 2, 13, 6, 40, 'HIGH', 'PENDING')
ON CONFLICT (replen_code) DO NOTHING;

-- 09. RETURNS: RMAs
INSERT INTO returns.rmas (id, rma_number, so_id, customer_id, warehouse_id, sku_id, qty, reason, condition_grade, disposition, status, restock_location_id, created_at) VALUES
  (1, 'RMA-2026-301', 1, 1, 1, 1, 1, 'Customer ordered extra spare scanner unit; factory sealed', 'UNOPENED_A', 'PENDING', 'AWAITING_INSPECTION', 2, NOW() - INTERVAL '5 hours'),
  (2, 'RMA-2026-302', NULL, 3, 1, 7, 2, 'Connector bracket scuffing during transit inspection', 'MINOR_WEAR_B', 'REFURBISH', 'PROCESSED', 17, NOW() - INTERVAL '2 days')
ON CONFLICT (rma_number) DO NOTHING;

-- 10. INTEGRATION: Event Outbox
INSERT INTO integration.event_outbox (id, event_id, aggregate_type, aggregate_id, event_type, payload, status, retry_count, created_at, processed_at) VALUES
  (1, 'EVT-9001', 'RECEIPT', 'GRN-2026-701', 'inbound.grn.posted', '{"po":"PO-2026-401","qty":20,"erp_sync":"SAP_S4"}'::jsonb, 'PUBLISHED', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (2, 'EVT-9002', 'SHIPMENT', 'SHP-2026-501', 'transport.shipment.delivered', '{"so":"SO-2026-8801","carrier":"EKSC"}'::jsonb, 'PUBLISHED', 0, NOW() - INTERVAL '38 hours', NOW() - INTERVAL '38 hours'),
  (3, 'EVT-9003', 'WAVE', 'WV-2026-09', 'outbound.wave.released', '{"orders":3,"units":39}'::jsonb, 'PUBLISHED', 0, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours')
ON CONFLICT (event_id) DO NOTHING;

-- 11. AUDIT LOGS
INSERT INTO audit.audit_logs (id, actor, action, entity_type, entity_code, severity, details, created_at) VALUES
  (1, 'System Bootstrap', 'SCHEMA_INITIALIZED', 'DATABASE', 'PG18-12NS', 'INFO', '{"schemas":12,"immutable_ledger":true,"row_locking":true}'::jsonb, NOW() - INTERVAL '6 days'),
  (2, 'Nadia Khoury', 'GRN_QC_PASSED', 'RECEIPT', 'GRN-2026-701', 'INFO', '{"po":"PO-2026-401","sku":"SKU-NVX-900","qty":20}'::jsonb, NOW() - INTERVAL '3 days'),
  (3, 'Omar Farooq', 'WAVE_RELEASED', 'WAVE', 'WV-2026-09', 'INFO', '{"orders":["SO-2026-8803","SO-2026-8804","SO-2026-8805"]}'::jsonb, NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- Reset PostgreSQL serial sequences cleanly so subsequent INSERTs never collide with seeded IDs!
SELECT setval('core.tenants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.tenants));
SELECT setval('core.companies_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.companies));
SELECT setval('core.warehouses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.warehouses));
SELECT setval('core.users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.users));
SELECT setval('master.products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master.products));
SELECT setval('master.skus_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master.skus));
SELECT setval('master.suppliers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master.suppliers));
SELECT setval('master.customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master.customers));
SELECT setval('master.carriers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master.carriers));
SELECT setval('location.locations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM location.locations));
SELECT setval('inbound.purchase_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inbound.purchase_orders));
SELECT setval('inbound.purchase_order_lines_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inbound.purchase_order_lines));
SELECT setval('inbound.receipts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inbound.receipts));
SELECT setval('inventory.inventory_balances_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inventory.inventory_balances));
SELECT setval('inventory.inventory_ledger_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inventory.inventory_ledger));
SELECT setval('inventory.reservations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inventory.reservations));
SELECT setval('outbound.waves_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.waves));
SELECT setval('outbound.sales_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.sales_orders));
SELECT setval('outbound.sales_order_lines_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.sales_order_lines));
SELECT setval('outbound.allocations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.allocations));
SELECT setval('outbound.pick_tasks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.pick_tasks));
SELECT setval('outbound.cartons_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.cartons));
SELECT setval('outbound.pack_lines_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outbound.pack_lines));
SELECT setval('replenishment.replenishment_rules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM replenishment.replenishment_rules));
SELECT setval('replenishment.replenishment_tasks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM replenishment.replenishment_tasks));
SELECT setval('transport.shipments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transport.shipments));
SELECT setval('returns.rmas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM returns.rmas));
SELECT setval('integration.event_outbox_id_seq', (SELECT COALESCE(MAX(id), 1) FROM integration.event_outbox));
SELECT setval('audit.audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit.audit_logs));
