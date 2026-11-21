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
   - ERP events are written to the transactional outbox as `PENDING`; a delivery worker is not included, so the debugger never reports queued or failed events as published.

## Security & Integrations

- Production deployments and any deployment using `DATABASE_URL` must set `WMS_AUTH_USER` and a unique `WMS_AUTH_PASSWORD` of at least 16 characters. The app uses HTTP Basic authentication for its pages and API, so serve it over HTTPS and provide the same credentials to API clients.
- Browser integrations are same-origin by default. To allow another browser origin, list its exact `https://...` origin(s) in `WMS_ALLOWED_ORIGINS`, separated by commas; wildcard origins are rejected.
- Remote PostgreSQL connections verify TLS certificates by default. Set `DATABASE_SSL=disable` only for a trusted local database that does not support TLS; Docker Compose uses this only on its private local database connection.
- Demo database reset and diagnostic fault injection are disabled in production and for databases selected by `DATABASE_URL`.
- Apply `supabase/migrations/20261121000100_wms_outbox_delivery_state.sql` to existing databases so new outbox rows default to `PENDING`; fresh local schemas already include this default.
- This shared Basic-auth gate is not per-user authorization or tenant isolation. Add identity-based roles and database row-level access policies before using the demo as a multi-tenant production WMS.
- To use Docker Compose, copy `.env.example` to `.env`, set the required database, app-authentication, and MinIO credentials, then run `docker compose up --build`. Ports bind to `127.0.0.1` by default; set `WMS_BIND_ADDRESS` explicitly only when remote access is intended.
- Use Node.js 22.12+ or 24+ for development and tests. For Docker Compose, keep `POSTGRES_PASSWORD` URL-safe (letters, digits, `.`, `_`, or `-`) because it is included in the local connection URL.

## Quick Commands

```bash
npm install
npm test        # Run PostgreSQL 18 concurrency, quantum & debugger test suite
npm run build   # Production Next.js + TypeScript verification build
npm run dev     # Start live server on 0.0.0.0:3000
```
