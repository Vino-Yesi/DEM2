'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  Truck,
  Atom,
  ScanBarcode,
  MapPin,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { NavSection, ToastMessage, WmsStatePayload } from '@/types/wms';
import { DashboardSkeleton } from './StatusBadge';
import { DashboardOverview } from './DashboardOverview';
import {
  InventoryView,
  InboundView,
  OutboundView,
  CatalogScannerView,
  LocationsView,
  ReturnsRmaView,
} from './CoreFlowsViews';
import { QuantumLabView } from './QuantumLabView';
import { AiDebuggerView } from './AiDebuggerView';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  group: 'Command' | 'Fulfilment Flows' | 'Quantum & AI';
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
}> = [
  { id: 'dashboard', label: 'Command Overview', group: 'Command', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory & Ledger', group: 'Fulfilment Flows', icon: Boxes },
  { id: 'inbound', label: 'Inbound & QC Putaway', group: 'Fulfilment Flows', icon: ArrowDownToLine, badgeKey: 'openPurchaseOrders' },
  { id: 'outbound', label: 'Outbound, Pick & Ship', group: 'Fulfilment Flows', icon: Truck, badgeKey: 'activeSalesOrders' },
  { id: 'catalog', label: 'Catalog & RF Scanner', group: 'Fulfilment Flows', icon: ScanBarcode },
  { id: 'locations', label: 'Warehouses & Bins', group: 'Fulfilment Flows', icon: MapPin },
  { id: 'returns', label: 'Returns & RMA', group: 'Fulfilment Flows', icon: RotateCcw },
  { id: 'quantum', label: 'Quantum Speedup Lab', group: 'Quantum & AI', icon: Atom },
  { id: 'ai-debugger', label: 'AI Advisors & Debugger', group: 'Quantum & AI', icon: Sparkles },
];

export function WmsAppShell() {
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('1');
  const [data, setData] = useState<WmsStatePayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4800);
    },
    []
  );

  const fetchState = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch(`/api/wms/state?warehouseId=${selectedWarehouse}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load WMS state');
        setData(json);
      } catch (err: any) {
        notify('error', 'Connection Error', err?.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedWarehouse, notify]
  );

  useEffect(() => {
    fetchState(false);
  }, [fetchState]);

  /**
   * Optimistic mutation wrapper with automatic rollback on ACID / row-lock conflict!
   */
  const runAction = useCallback(
    async (
      action: string,
      payload: Record<string, any>,
      successMsg: string,
      optimisticMutator?: (draft: WmsStatePayload) => void
    ) => {
      setBusyAction(action);
      const snapshot = data ? structuredClone(data) : null;

      if (data && optimisticMutator) {
        const nextDraft = structuredClone(data);
        optimisticMutator(nextDraft);
        setData(nextDraft);
      }

      try {
        const res = await fetch('/api/wms/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || json.result?.message || 'Transaction rejected by database guard');
        }
        notify('success', successMsg, json.result?.message || json.result?.trackingNumber);
        await fetchState(true);
        return json;
      } catch (err: any) {
        if (snapshot) setData(snapshot);
        notify('error', 'ACID Guard / Validation', err?.message);
        await fetchState(true);
        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [data, fetchState, notify]
  );

  const handleExecuteAiAction = useCallback(
    async (actionType: string, params: Record<string, any>, label: string) => {
      setBusyAction(actionType);
      try {
        const res = await fetch('/api/wms/debugger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'EXECUTE_AI_ACTION', payload: { actionType, params } }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'AI action failed');
        notify('quantum', 'AI Advisor Action Completed', label);
        await fetchState(true);
      } catch (err: any) {
        notify('error', 'AI Action Failed', err?.message);
      } finally {
        setBusyAction(null);
      }
    },
    [fetchState, notify]
  );

  const numericWhId = selectedWarehouse === 'all' ? 1 : Number(selectedWarehouse);

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow">
            <Atom className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">NexusQuantum WMS</span>
            <span className="block font-mono text-[10px] text-cyan-400">PostgreSQL 18 • 12-Schema</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {(['Command', 'Fulfilment Flows', 'Quantum & AI'] as const).map((group) => (
          <div key={group}>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
            <div className="mt-1.5 space-y-1">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                const badgeVal = item.badgeKey && data?.kpis ? (data.kpis as any)[item.badgeKey] : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      {item.label}
                    </span>
                    {badgeVal !== null && badgeVal !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {badgeVal}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Persistence Card */}
      <div className="border-t border-slate-800/80 p-3.5">
        <div className="rounded-xl bg-slate-900/90 p-3 ring-1 ring-slate-800 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Database className="h-3.5 w-3.5" />
              {data?.persistence?.mode || 'DEVELOP'} DB
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-slate-400 truncate">
            {data?.persistence?.engine || 'PostgreSQL 18.6 Persistent'}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-indigo-400 truncate">
            Cloud: Supabase ({data?.persistence?.supabaseCloudProject?.name || 'myscantool'}) ✓
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100/80 text-slate-900">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 max-w-xs flex-1 flex-col">{renderSidebarContent()}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Command Header */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                {NAV_ITEMS.find((n) => n.id === activeNav)?.label}
              </h1>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                ACID Row-Locked Fulfilment • Immutable Stock Ledger • Quantum Optimization
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Warehouse Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none"
              >
                <option value="all">All 3 Warehouses (Global)</option>
                {data?.warehouses?.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.warehouse_code} — {w.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick RF Scan Button */}
            <button
              type="button"
              onClick={() => setActiveNav('catalog')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ScanBarcode className="h-3.5 w-3.5 text-indigo-600" />
              RF Scan
            </button>

            {/* AI Copilot & Debugger Slide-over Trigger */}
            <button
              type="button"
              onClick={() => setCopilotDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Advisor & Debugger
              {data?.aiInsights && data.aiInsights.length > 0 && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.2 font-mono text-[10px]">
                  {data.aiInsights.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => fetchState(true)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
              title="Refresh live data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {loading || !data ? (
            <DashboardSkeleton />
          ) : (
            <>
              {activeNav === 'dashboard' && (
                <DashboardOverview
                  data={data}
                  onNavigate={setActiveNav}
                  onExecuteAiAction={handleExecuteAiAction}
                  busyKey={busyAction}
                />
              )}
              {activeNav === 'inventory' && (
                <InventoryView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'inbound' && (
                <InboundView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'outbound' && (
                <OutboundView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'quantum' && (
                <QuantumLabView
                  data={data}
                  warehouseId={numericWhId}
                  onRefresh={() => fetchState(true)}
                  notify={notify}
                />
              )}
              {activeNav === 'catalog' && (
                <CatalogScannerView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'locations' && (
                <LocationsView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'returns' && (
                <ReturnsRmaView
                  data={data}
                  warehouseId={numericWhId}
                  runAction={runAction}
                  busyAction={busyAction}
                />
              )}
              {activeNav === 'ai-debugger' && (
                <AiDebuggerView
                  data={data}
                  warehouseId={numericWhId}
                  onRefresh={() => fetchState(true)}
                  notify={notify}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Slide-Over AI Copilot & Debugger Drawer */}
      {copilotDrawerOpen && data && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setCopilotDrawerOpen(false)} />
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold">Mini AI Advisor & Live System Debugger</span>
              </div>
              <button
                type="button"
                onClick={() => setCopilotDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AiDebuggerView
                data={data}
                warehouseId={numericWhId}
                compact
                onRefresh={() => fetchState(true)}
                notify={notify}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3.5 shadow-lg backdrop-blur transition ${
              t.type === 'error'
                ? 'border-rose-200 bg-rose-950/95 text-white'
                : t.type === 'quantum'
                  ? 'border-cyan-400/40 bg-slate-950/95 text-white'
                  : 'border-slate-800 bg-slate-900/95 text-white'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            ) : t.type === 'quantum' ? (
              <Atom className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 text-xs">
              <p className="font-bold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-slate-300 text-[11px]">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
