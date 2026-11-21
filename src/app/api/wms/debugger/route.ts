import { NextRequest, NextResponse } from 'next/server';
import {
  runWmsSystemDebugger,
  runMiniAiAdvisors,
  askWmsAiAdvisor,
  executeAiAdvisorAction,
  injectDiagnosticFault,
  autoHealWmsIssues,
} from '@/lib/ai/advisor-debugger';
import { getPersistenceMode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const wh = Number(req.nextUrl.searchParams.get('warehouseId') || 1);
    const [debugReport, insights] = await Promise.all([runWmsSystemDebugger(), runMiniAiAdvisors(wh)]);
    return NextResponse.json({ debugReport, insights });
  } catch (err: any) {
    console.error('WMS debugger check failed:', err);
    return NextResponse.json({ error: 'Debugger check failed. Check the server logs for details.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, payload = {} } = await req.json();

    switch (action) {
      case 'ASK_COPILOT': {
        const res = await askWmsAiAdvisor(String(payload.question || ''), Number(payload.warehouseId || 1));
        return NextResponse.json({ ok: true, ...res });
      }
      case 'EXECUTE_AI_ACTION': {
        const result = await executeAiAdvisorAction(String(payload.actionType), payload.params || {});
        return NextResponse.json({ ok: true, result });
      }
      case 'INJECT_FAULT': {
        if (process.env.NODE_ENV === 'production' || getPersistenceMode() === 'DEPLOY') {
          return NextResponse.json({ error: 'Fault injection is disabled in production.' }, { status: 403 });
        }
        const result = await injectDiagnosticFault(payload.faultType);
        const debugReport = await runWmsSystemDebugger();
        return NextResponse.json({ ok: true, result, debugReport });
      }
      case 'AUTO_HEAL': {
        const result = await autoHealWmsIssues();
        const debugReport = await runWmsSystemDebugger();
        return NextResponse.json({ ok: true, result, debugReport });
      }
      default:
        return NextResponse.json({ error: `Unknown debugger action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('WMS debugger action failed:', err);
    return NextResponse.json({ error: 'Debugger action failed. Check the server logs for details.' }, { status: 400 });
  }
}
