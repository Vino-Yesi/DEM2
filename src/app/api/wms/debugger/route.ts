import { NextRequest, NextResponse } from 'next/server';
import {
  runWmsSystemDebugger,
  runMiniAiAdvisors,
  askWmsAiAdvisor,
  executeAiAdvisorAction,
  injectDiagnosticFault,
  autoHealWmsIssues,
} from '@/lib/ai/advisor-debugger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const wh = Number(req.nextUrl.searchParams.get('warehouseId') || 1);
    const [debugReport, insights] = await Promise.all([runWmsSystemDebugger(), runMiniAiAdvisors(wh)]);
    return NextResponse.json({ debugReport, insights });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Debugger check failed' }, { status: 500 });
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
    return NextResponse.json({ error: err?.message || 'Debugger action failed' }, { status: 400 });
  }
}
