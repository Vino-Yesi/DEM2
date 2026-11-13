import { describe, it, expect, beforeAll } from 'vitest';
import { dbQuery, ensureDbInitialized } from '@/lib/db';
import {
  simulateConcurrentAllocationRace,
  receivePurchaseOrder,
  allocateSalesOrder,
  completePickTask,
  packSalesOrder,
  dispatchSalesOrder,
} from '@/lib/wms/service';
import { optimizeWavePickRouteSQA, runQuboSlottingOptimizer } from '@/lib/quantum/optimizer';
import {
  runWmsSystemDebugger,
  injectDiagnosticFault,
  autoHealWmsIssues,
} from '@/lib/ai/advisor-debugger';

describe('Quantum WMS Enterprise Core & PostgreSQL 18 Integrity Suite', () => {
  beforeAll(async () => {
    await ensureDbInitialized();
  });

  it('seeds all 12 PostgreSQL schemas with strict ledger & reservation parity', async () => {
    const debug = await runWmsSystemDebugger();
    expect(debug.overallHealth).toBe('HEALTHY');
    expect(debug.healthyCount).toBe(debug.totalChecks);
  });

  it('blocks UPDATE and DELETE on inventory.inventory_ledger via immutable trigger', async () => {
    await expect(
      dbQuery('DELETE FROM inventory.inventory_ledger WHERE id = 1')
    ).rejects.toThrow(/IMMUTABLE_LEDGER_VIOLATION/);
  });

  it('prevents double-allocation under concurrent Promise.all contention (Row-Level Locking)', async () => {
    // SO id=7 (SO-2026-8807) and SO id=8 (SO-2026-8808) both request 5x SKU-OPT-SFP, only 6 available!
    const race = await simulateConcurrentAllocationRace(7, 8);
    const successes = race.results.filter((r) => r.success);
    const failures = race.results.filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].message).toMatch(/Row-Lock Stock Guard/);

    const bal = await dbQuery<{ on_hand_qty: number; reserved_qty: number; available_qty: number }>(
      'SELECT on_hand_qty, reserved_qty, available_qty FROM inventory.inventory_balances WHERE id = 6'
    );
    // Originally 8 on_hand, 2 reserved -> +5 reserved = 7 reserved, 1 available!
    expect(bal.rows[0].reserved_qty).toBe(7);
    expect(bal.rows[0].available_qty).toBe(1);
  });

  it('achieves real travel speedup using Suzuki-Trotter Simulated Quantum Annealing & QUBO Slotting', async () => {
    const sqa = await optimizeWavePickRouteSQA({ warehouseId: 1, waveId: 1, applyToDatabase: true });
    expect(sqa.quantumDistanceM).toBeLessThan(sqa.classicalDistanceM);
    expect(sqa.speedupPct).toBeGreaterThan(15);
    expect(sqa.appliedToDb).toBe(true);

    const qubo = await runQuboSlottingOptimizer(1);
    expect(qubo.recommendations.length).toBeGreaterThan(0);
    expect(qubo.optimizedHamiltonian).toBeLessThan(qubo.initialHamiltonian);
  });

  it('completes full Inbound PO Receive -> Outbound Allocate -> Pick -> Pack -> Dispatch flow', async () => {
    // Receive PO-2026-402 (id=2) which brings in +50 SKU-OPT-SFP!
    const grn = await receivePurchaseOrder({ poId: 2, qcStatus: 'PASSED' });
    expect(grn.grns.length).toBeGreaterThan(0);

    // Now the order that lost the race earlier can allocate cleanly!
    const pendingRes = await dbQuery<{ id: number }>(
      `SELECT id FROM outbound.sales_orders WHERE id IN (7, 8) AND status = 'PENDING'`
    );
    expect(pendingRes.rows.length).toBe(1);
    const loserSoId = pendingRes.rows[0].id;

    const alloc = await allocateSalesOrder(loserSoId, 'Integration-Test-Operator');
    expect(alloc.success).toBe(true);

    // Pick all open pick tasks for this order
    const openTasks = await dbQuery<{ id: number }>(
      `SELECT id FROM outbound.pick_tasks WHERE so_id = $1 AND status <> 'COMPLETED'`,
      [loserSoId]
    );
    for (const t of openTasks.rows) {
      await completePickTask(t.id, 'Picker-Test');
    }

    // Pack into carton
    const packed = await packSalesOrder(loserSoId, 'STD-BOX-M');
    expect(packed.cartonNumber).toMatch(/^CTN-/);

    // Dispatch with carrier
    const shipped = await dispatchSalesOrder(loserSoId, 1, 'EXPRESS_AIR');
    expect(shipped.trackingNumber).toMatch(/AE$/);
  });

  it('detects injected operational faults in Live Debugger and self-heals back to HEALTHY', async () => {
    await injectDiagnosticFault('STUCK_OUTBOX_WEBHOOK');
    await injectDiagnosticFault('BLOCKED_PICK_BIN');
    await injectDiagnosticFault('ORPHAN_RESERVATION');

    const degraded = await runWmsSystemDebugger();
    expect(degraded.overallHealth).toBe('DEGRADED');
    expect(degraded.issueCount).toBeGreaterThanOrEqual(2);

    const heal = await autoHealWmsIssues();
    expect(heal.healedCount).toBeGreaterThanOrEqual(2);

    const cleanAgain = await runWmsSystemDebugger();
    expect(cleanAgain.overallHealth).toBe('HEALTHY');
    expect(cleanAgain.issueCount).toBe(0);
  });
});
