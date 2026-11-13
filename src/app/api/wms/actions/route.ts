import { NextRequest, NextResponse } from 'next/server';
import { resetDemoDatabase } from '@/lib/db';
import {
  scanBarcodeOrCode,
  createSkuMaster,
  createLocationBin,
  toggleLocationLock,
  createPurchaseOrder,
  receivePurchaseOrder,
  transferStock,
  adjustInventoryCycleCount,
  executeReplenishmentTask,
  createSalesOrder,
  allocateSalesOrder,
  simulateConcurrentAllocationRace,
  completePickTask,
  packSalesOrder,
  dispatchSalesOrder,
  createRmaReturn,
  processRmaDisposition,
  createManualSnapshot,
} from '@/lib/wms/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload = {} } = body;

    switch (action) {
      case 'SCAN_BARCODE': {
        const res = await scanBarcodeOrCode(String(payload.code || ''));
        return NextResponse.json(res);
      }
      case 'CREATE_SKU': {
        const sku = await createSkuMaster(payload);
        return NextResponse.json({ ok: true, sku });
      }
      case 'CREATE_LOCATION': {
        const location = await createLocationBin(payload);
        return NextResponse.json({ ok: true, location });
      }
      case 'TOGGLE_BIN_LOCK': {
        const location = await toggleLocationLock(Number(payload.locationId), Boolean(payload.isLocked));
        return NextResponse.json({ ok: true, location });
      }
      case 'CREATE_PO': {
        const po = await createPurchaseOrder(payload);
        return NextResponse.json({ ok: true, po });
      }
      case 'RECEIVE_PO': {
        const result = await receivePurchaseOrder(payload);
        return NextResponse.json({ ok: true, result });
      }
      case 'TRANSFER_STOCK': {
        const result = await transferStock(payload);
        return NextResponse.json({ ok: true, result });
      }
      case 'ADJUST_STOCK': {
        const result = await adjustInventoryCycleCount(payload);
        return NextResponse.json({ ok: true, result });
      }
      case 'EXECUTE_REPLENISHMENT': {
        const result = await executeReplenishmentTask(Number(payload.taskId));
        return NextResponse.json({ ok: true, result });
      }
      case 'CREATE_SO': {
        const so = await createSalesOrder(payload);
        return NextResponse.json({ ok: true, so });
      }
      case 'ALLOCATE_SO': {
        const result = await allocateSalesOrder(Number(payload.soId), payload.operatorName);
        return NextResponse.json({ ok: result.success, result }, { status: result.success ? 200 : 409 });
      }
      case 'SIMULATE_CONCURRENT_RACE': {
        const result = await simulateConcurrentAllocationRace(Number(payload.soIdA), Number(payload.soIdB));
        return NextResponse.json({ ok: true, result });
      }
      case 'COMPLETE_PICK_TASK': {
        const result = await completePickTask(Number(payload.taskId), payload.operatorName);
        return NextResponse.json({ ok: true, result });
      }
      case 'PACK_SO': {
        const result = await packSalesOrder(Number(payload.soId), payload.cartonType);
        return NextResponse.json({ ok: true, result });
      }
      case 'DISPATCH_SO': {
        const result = await dispatchSalesOrder(
          Number(payload.soId),
          Number(payload.carrierId || 1),
          payload.serviceLevel
        );
        return NextResponse.json({ ok: true, result });
      }
      case 'CREATE_RMA': {
        const rma = await createRmaReturn(payload);
        return NextResponse.json({ ok: true, rma });
      }
      case 'PROCESS_RMA': {
        const result = await processRmaDisposition(payload);
        return NextResponse.json({ ok: true, result });
      }
      case 'CREATE_SNAPSHOT': {
        const snapshot = await createManualSnapshot(String(payload.label || 'Manual Checkpoint'));
        return NextResponse.json({ ok: true, snapshot });
      }
      case 'RESET_DEMO_DB': {
        await resetDemoDatabase();
        return NextResponse.json({ ok: true, message: 'Database reset to fresh seeded demo state.' });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Operation failed' }, { status: 400 });
  }
}
