import { NextRequest, NextResponse } from 'next/server';
import {
  optimizeWavePickRouteSQA,
  runQuboSlottingOptimizer,
  runQuantumIsingWaveBatcher,
} from '@/lib/quantum/optimizer';
import { transferStock } from '@/lib/wms/service';

export async function POST(req: NextRequest) {
  try {
    const { mode, payload = {} } = await req.json();

    switch (mode) {
      case 'RUN_SQA_ROUTING': {
        const result = await optimizeWavePickRouteSQA({
          warehouseId: Number(payload.warehouseId || 1),
          waveId: payload.waveId ? Number(payload.waveId) : undefined,
          applyToDatabase: Boolean(payload.applyToDatabase),
        });
        return NextResponse.json({ ok: true, result });
      }
      case 'RUN_QUBO_SLOTTING': {
        const result = await runQuboSlottingOptimizer(Number(payload.warehouseId || 1));
        return NextResponse.json({ ok: true, result });
      }
      case 'EXECUTE_QUBO_SLOTTING': {
        const transfer = await transferStock({
          balanceId: Number(payload.balanceId),
          toLocationId: Number(payload.toLocationId),
          qty: Number(payload.qty),
          reason: 'Quantum QUBO Slotting Optimization',
          operatorName: 'Quantum QUBO Solver',
        });
        return NextResponse.json({ ok: true, transfer });
      }
      case 'RUN_ISING_WAVE_BATCH': {
        const result = await runQuantumIsingWaveBatcher(Number(payload.warehouseId || 1));
        return NextResponse.json({ ok: true, result });
      }
      default:
        return NextResponse.json({ error: `Unsupported quantum mode: ${mode}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Quantum computation error' }, { status: 400 });
  }
}
