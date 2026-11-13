'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Bug,
  ShieldCheck,
  Wrench,
  Send,
  Database,
  AlertTriangle,
  RefreshCw,
  HardDriveDownload,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { WmsStatePayload } from '@/types/wms';
import { StatusBadge } from './StatusBadge';

interface Props {
  data: WmsStatePayload;
  warehouseId: number;
  compact?: boolean;
  onRefresh: () => Promise<void>;
  notify: (type: 'success' | 'error' | 'info' | 'quantum', title: string, description?: string) => void;
}

const QUICK_PROMPTS = [
  'Which SKUs are at risk of stockout right now?',
  'Diagnose SO-2026-8807 allocation contention',
  'Run Quantum route speedup analysis',
  'Audit ledger & reservation lock integrity',
];

export function AiDebuggerView({ data, warehouseId, compact = false, onRefresh, notify }: Props) {
  const [debugReport, setDebugReport] = useState<any | null>(null);
  const [insights, setInsights] = useState<any[]>(data.aiInsights || []);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; actions?: any[] }>
  >([
    {
      role: 'assistant',
      content:
        'Mini AI Warehouse Advisor & Live Debugger online. Ask me about stockout risks, blocked orders (e.g. SO-2026-8807), Quantum wave routing, or inject a simulated warehouse fault below to watch real-time detection and self-healing.',
    },
  ]);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wms/debugger?warehouseId=${warehouseId}`).then((r) => r.json());
      if (res.debugReport) setDebugReport(res.debugReport);
      if (res.insights) setInsights(res.insights);
    } catch (err: any) {
      notify('error', 'Failed to run diagnostics', err?.message);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, notify]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const handleAsk = async (textOverride?: string) => {
    const q = (textOverride ?? prompt).trim();
    if (!q) return;
    if (!textOverride) setPrompt('');
    setChatHistory((prev) => [...prev, { role: 'user', content: q }]);
    setBusyAction('chat');
    try {
      const res = await fetch('/api/wms/debugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASK_COPILOT', payload: { question: q, warehouseId } }),
      }).then((r) => r.json());
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer || 'Completed analysis.',
          actions: res.suggestedActions || [],
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [...prev, { role: 'assistant', content: `Error: ${err?.message}` }]);
    } finally {
      setBusyAction(null);
    }
  };

  const handleExecuteAiFix = async (actionType: string, params: Record<string, any>, label: string) => {
    setBusyAction(label);
    try {
      const res = await fetch('/api/wms/debugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE_AI_ACTION', payload: { actionType, params } }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      notify('success', 'AI Remediation Executed', label);
      await onRefresh();
      await fetchDiagnostics();
    } catch (err: any) {
      notify('error', 'Remediation Failed', err?.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleInjectFault = async (faultType: string) => {
    setBusyAction(faultType);
    try {
      const res = await fetch('/api/wms/debugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INJECT_FAULT', payload: { faultType } }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setDebugReport(res.debugReport);
      notify('info', 'Diagnostic Fault Injected', res.result.message);
      await onRefresh();
    } catch (err: any) {
      notify('error', 'Fault Injection Error', err?.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleAutoHeal = async () => {
    setBusyAction('AUTO_HEAL');
    try {
      const res = await fetch('/api/wms/debugger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_HEAL' }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setDebugReport(res.debugReport);
      notify('success', 'Self-Healing Debugger Completed', res.result.actionsTaken.join(' '));
      await onRefresh();
    } catch (err: any) {
      notify('error', 'Auto-Heal Failed', err?.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateSnapshot = async () => {
    setBusyAction('SNAPSHOT');
    try {
      const res = await fetch('/api/wms/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SNAPSHOT',
          payload: { label: `Checkpoint ${new Date().toISOString().slice(11, 19)} UTC` },
        }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      notify('success', `Snapshot ${res.snapshot.backup_code} Saved`, `SHA-256: ${res.snapshot.checksum}`);
      await onRefresh();
    } catch (err: any) {
      notify('error', 'Snapshot Failed', err?.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetDemo = async () => {
    setBusyAction('RESET');
    try {
      const res = await fetch('/api/wms/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_DEMO_DB' }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      notify('success', 'Demo Seed Restored', 'All 12 PostgreSQL schemas re-seeded cleanly.');
      await onRefresh();
      await fetchDiagnostics();
    } catch (err: any) {
      notify('error', 'Reset Failed', err?.message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 gap-6 ${compact ? '' : 'xl:grid-cols-12'}`}>
        {/* Left: Mini AI Advisors + Interactive Copilot */}
        <div className={compact ? 'space-y-4' : 'xl:col-span-6 space-y-5'}>
          {/* Copilot Chat Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mini AI Warehouse Copilot</h3>
                  <p className="text-[11px] text-slate-500">Grounded in live PostgreSQL 18 tables & ledger state</p>
                </div>
              </div>
              <StatusBadge value="ACTIVE" />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => handleAsk(qp)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/70">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-xs whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'ml-8 bg-slate-900 text-white'
                      : 'mr-4 bg-white text-slate-800 ring-1 ring-slate-200'
                  }`}
                >
                  {msg.content}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
                      {msg.actions.map((act: any, i: number) => (
                        <button
                          key={i}
                          type="button"
                          disabled={busyAction !== null}
                          onClick={() => handleExecuteAiFix(act.actionType, act.params, act.label)}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 transition"
                        >
                          <Wrench className="h-3 w-3" />
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask e.g. 'Why is SO-2026-8807 pending?' or 'Check stockout risk'..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busyAction === 'chat'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                <Send className="h-3.5 w-3.5" />
                Ask AI
              </button>
            </form>
          </div>

          {/* Proactive AI Advisor Cards */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Proactive AI Operational Advisors ({insights.length})</h3>
            <div className="mt-3 space-y-2.5">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge value={ins.severity} />
                      <span className="text-xs font-bold text-slate-900">{ins.title}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">{ins.metricBadge}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{ins.explanation}</p>
                  {ins.recommendedAction && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleExecuteAiFix(
                          ins.recommendedAction.actionType,
                          ins.recommendedAction.params,
                          ins.recommendedAction.label
                        )
                      }
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {ins.recommendedAction.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live WMS Invariant Debugger + Fault Injection + Self-Healer */}
        <div className={compact ? 'space-y-4' : 'xl:col-span-6 space-y-5'}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Bug className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Live WMS Invariant Debugger</h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time SQL reconciliation, savepoint trigger probes & auto-repair
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {debugReport && <StatusBadge value={debugReport.overallHealth} />}
                <button
                  type="button"
                  onClick={fetchDiagnostics}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Re-scan invariants"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Fault Simulator + Auto-Heal Bar */}
            <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Chaos / Fault Simulator (Test Debugger & Self-Heal):
                </span>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={handleAutoHeal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {busyAction === 'AUTO_HEAL' ? 'Healing...' : 'Run Auto-Heal Repair'}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleInjectFault('STUCK_OUTBOX_WEBHOOK')}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-amber-300 hover:bg-amber-100/60 transition"
                >
                  + Inject Failed ERP Webhook
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleInjectFault('BLOCKED_PICK_BIN')}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-amber-300 hover:bg-amber-100/60 transition"
                >
                  + Lock Active Pick Bin
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleInjectFault('ORPHAN_RESERVATION')}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-amber-300 hover:bg-amber-100/60 transition"
                >
                  + Inject Ghost RF Lock Drift
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleInjectFault('OVER_CAPACITY_BIN')}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-amber-300 hover:bg-amber-100/60 transition"
                >
                  + Inject Bin Over-Capacity
                </button>
              </div>
            </div>

            {/* 6 Invariant Check Rows */}
            <div className="mt-3 space-y-2">
              {debugReport?.checks?.map((chk: any) => (
                <div
                  key={chk.code}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{chk.code}</span>
                      <span className="font-semibold text-slate-900">{chk.name}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">{chk.summary}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <StatusBadge value={chk.status} />
                    <span className="mt-1 font-mono text-[10px] text-slate-400">{chk.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Environment Persistence & Backup Manager (Full page mode) */}
          {!compact && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Persistent Storage Matrix (Test • Develop • Deploy)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={busyAction !== null}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    <HardDriveDownload className="h-3.5 w-3.5" />
                    Create Backup Snapshot
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={busyAction !== null}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Seed
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="font-mono text-[10px] font-bold uppercase text-slate-500">TEST ENV</span>
                  <p className="mt-1 font-semibold text-slate-900">Vitest + PGlite PG 18</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Isolated ACID concurrency & lock test runner</p>
                </div>
                <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase text-emerald-700">DEVELOP ENV</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">Persistent Disk PG 18.6</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 truncate">Dir: .pgdata-dev (Active Local)</p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                  <span className="font-mono text-[10px] font-bold uppercase text-indigo-700">DEPLOY ENV (CLOUD)</span>
                  <p className="mt-1 font-semibold text-slate-900">
                    Supabase ({data.persistence.supabaseCloudProject.name})
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-indigo-700">
                    Ref: {data.persistence.supabaseCloudProject.ref} ✓ Migrated
                  </p>
                </div>
              </div>

              {/* Snapshots List */}
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Automated & Manual SHA-256 Checkpoints ({data.backups.length})
                </p>
                <div className="mt-1.5 space-y-1.5 max-h-28 overflow-y-auto">
                  {data.backups.map((b: any) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800">{b.backup_code}</span>{' '}
                        <span className="text-slate-600">• {b.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">sha256:{b.checksum}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SQL Trace Ring Buffer */}
              {debugReport?.recentSqlTraces && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-slate-600" />
                    Live PostgreSQL Transaction & Row-Lock Telemetry
                  </p>
                  <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
                    {debugReport.recentSqlTraces.slice(0, 10).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          <span
                            className={
                              t.kind === 'ROW_LOCK'
                                ? 'text-cyan-400'
                                : t.status === 'ERROR'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                            }
                          >
                            [{t.kind}]
                          </span>{' '}
                          {t.sqlPreview}
                        </span>
                        <span className="text-slate-500 shrink-0">{t.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
