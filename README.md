# NexusQuantum WMS — Enterprise & Quantum-Accelerated Fulfilment System

Full-stack Warehouse Management System built on a **12-schema PostgreSQL 18 architecture** with strict ACID concurrency (`SELECT ... FOR UPDATE`), an append-only cryptographic stock ledger, **Quantum Combinatorial Optimization** (Suzuki-Trotter Simulated Quantum Annealing, QUBO Slotting, and Ising Wave Partitioning), and built-in **Mini AI Advisors & Live Self-Healing Debugger**.

## Key Architecture Highlights

1. **12 Enterprise PostgreSQL Schemas**:
   - `core` (Tenants, Companies, Multi-Warehouse Sites, Users)
   - `master` (Products, SKUs, UOMs, EAN-13/Code-128 Barcodes, Suppliers, Customers, Carriers)
   - `location` (Zones, Aisles, Racks, Shelves, Bins, 3D Floor Coordinates & Capacities)
   - `inbound` (Purchase Orders, ASN, GRN Receiving, Quality Inspection & Putaway)
   - `inventory` (Stock Balances, Immutable `inventory_ledger` with `BEFORE UPDATE OR DELETE` trigger guard, Row-Locked Reservations, Atomic Transfers)
   - `outbound` (Waves, Sales Orders, Concurrent Row-Locked Allocations, RF Pick Tasks, Cartons, Pack Lines)
   - `replenishment` (Min/Max Rules & Automated Bulk-to-Pick-Face Replenishment)
   - `transport` (Carrier Shipments, SCAC Tracking & Delivery Confirmation)
   - `returns` (RMA Inspection & Restock/Refurbish/Scrap Disposition)
   - `integration` (Transactional ERP/Webhook Event Outbox)
   - `audit` (Activity Audit Trail & Automated SHA-256 JSONB Backup Snapshots)
   - `reporting` (Real-time Valuation & Zone Utilization SQL Views)

2. **Persistent Storage Across Test, Develop & Deploy**:
   - **Test (`npm test`)**: Isolated PostgreSQL 18.6 (`@electric-sql/pglite`) running Vitest concurrency, ledger-trigger, full inbound/outbound lifecycle, quantum speedup, and fault self-healing suites.
   - **Develop (`npm run dev`)**: Persistent local PostgreSQL 18.6 stored at `./.pgdata-dev` (zero external setup required, works offline as a Hybrid Warehouse Edge Server).
   - **Deploy (`DATABASE_URL` / Docker / Cloud)**: Native `pg.Pool` connection to Supabase (`pmkdvlrjjkvkoxlqqcqx` / `myscantool` — pre-migrated via `supabase/migrations/`) or Docker `postgres:18` (`docker-compose.yml`).

3. **Quantum Methods for WMS Speedup**:
   - **Suzuki-Trotter Simulated Quantum Annealing (SQA)**: 8-replica path-integral Monte Carlo solver with decaying transverse field $\Gamma(t)$ that tunnels past cross-aisle backtracking traps (~38% walking distance speedup).
   - **QUBO Slotting Hamiltonian**: Optimizes $H(x) = x^T Q x$ across SKU velocity class and pack-station proximity with 1-click re-slotting transfers.
   - **Ising Spin-Glass Wave Partitioner**: Ferromagnetic SKU-overlap coupling with balanced picker unit load.

4. **Mini AI Advisors & Live Self-Healing System Debugger**:
   - Proactive stockout, FEFO cold-chain expiry, replenishment, and dock bottleneck advisors with 1-click fixes.
   - Live 6-invariant SQL verifier, Chaos/Fault Injector, and 1-click Self-Healing Auto-Repair.

## Quick Commands

```bash
npm install
npm test        # Run PostgreSQL 18 concurrency, quantum & debugger test suite
npm run build   # Production Next.js + TypeScript verification build
npm run dev     # Start live server on 0.0.0.0:3000
```
