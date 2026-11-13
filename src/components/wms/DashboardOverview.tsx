'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Truck,
  ArrowDownToLine,
  Atom,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MapPin,
  History,
  Activity,
} from 'lucide-react';
import { NavSection, WmsStatePayload } from '@/types/wms';
import { StatusBadge } from './StatusBadge';

interface Props {
  data: WmsStatePayload;
  onNavigate: (section: NavSection) => void;
  onExecuteAiAction: (actionType: string, params: Record<string, any>, label: string) => Promise<void>;
  busyKey: string | null;
}

export function DashboardOverview({ data, onNavigate, onExecuteAiAction, busyKey }: Props) {
  const { kpis, locations, zoneUtilization, ledger, aiInsights } = data;
  const [selectedLoc, setSelectedLoc] = useState<any | null>(locations[1] || locations[0] || null);

  return (
    <div className="space-y-6">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">On-Hand Stock</span>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {kpis.totalOnHand.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Valued at <span className="font-semibold text-slate-700">${kpis.totalValuation.toLocaleString()}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available vs Locked</span>
            <Lock className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {kpis.totalAvailable.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            <span className="font-semibold text-sky-700">{kpis.totalReserved}</span> row-locked in reservations
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('outbound')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outbound Pipeline</span>
            <Truck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {kpis.activeSalesOrders} <span className="text-sm font-normal text-slate-500">orders</span>
          </p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">
            {kpis.openPickTasks} open RF pick tasks →
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('inbound')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inbound & ASN Dock</span>
            <ArrowDownToLine className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {kpis.openPurchaseOrders} <span className="text-sm font-normal text-slate-500">POs</span>
          </p>
          <p className="mt-1 text-xs text-amber-700 font-medium">Dock receiving & QC →</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('quantum')}
          className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 via-white to-indigo-50/50 p-4 text-left shadow-sm hover:border-cyan-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-800">Quantum Speedup</span>
            <Atom className="h-4 w-4 text-cyan-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-cyan-900">
            +{kpis.quantumSpeedupPct.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-cyan-700 font-medium">SQA Trotter + QUBO Lab →</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai-debugger')}
          className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-left shadow-sm hover:border-emerald-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">ACID & Ledger Guard</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-emerald-900">12 Schemas Live</p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">AI Advisor & Debugger →</p>
        </button>
      </div>

      {/* Mini AI Advisor Priority Action Banner */}
      {aiInsights.length > 0 && (
        <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-4 text-white shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/40">
                <Sparkles className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Mini AI Warehouse Advisor
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-mono text-slate-200">
                    {aiInsights.length} live insights
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-white">{aiInsights[0].title}</p>
                <p className="mt-0.5 text-xs text-slate-300 max-w-3xl">{aiInsights[0].explanation}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {aiInsights[0].recommendedAction && (
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() =>
                    onExecuteAiAction(
                      aiInsights[0].recommendedAction.actionType,
                      aiInsights[0].recommendedAction.params,
                      aiInsights[0].recommendedAction.label
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiInsights[0].recommendedAction.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('ai-debugger')}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/15 transition"
              >
                All AI Advisors & Debugger
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Operational View: Spatial Floor Map + Zone Utilization */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Interactive Spatial Warehouse Digital Twin Floor Map */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-600" />
                Live Spatial Warehouse Floor Map (2D Digital Twin)
              </h3>
              <p className="text-xs text-slate-500">
                Click any bin coordinate node to inspect slot fill rate, lock state, and zone assignment.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Pick Face
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Cold / Bulk
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Dock / Pack
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Locked / Quarantine
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-950 p-3">
              <svg viewBox="0 0 100 54" className="w-full h-64 select-none">
                {/* Grid lines */}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => (
                  <line key={`gx-${x}`} x1={x} y1={2} x2={x} y2={52} stroke="#1e293b" strokeWidth={0.25} />
                ))}
                {[10, 20, 30, 40, 50].map((y) => (
                  <line key={`gy-${y}`} x1={2} y1={y} x2={98} y2={y} stroke="#1e293b" strokeWidth={0.25} />
                ))}
                {/* Cross-aisle walkways */}
                <rect x={2} y={5} width={94} height={2.2} fill="#0f172a" stroke="#334155" strokeWidth={0.2} />
                <rect x={2} y={41} width={94} height={2.2} fill="#0f172a" stroke="#334155" strokeWidth={0.2} />
                <text x={48} y={6.6} fontSize={1.7} fill="#64748b" textAnchor="middle">
                  NORTH CROSS-AISLE HIGHWAY
                </text>
                <text x={48} y={42.6} fontSize={1.7} fill="#64748b" textAnchor="middle">
                  SOUTH PACK & DISPATCH CONCOURSE
                </text>

                {locations.map((loc) => {
                  const pct = loc.max_capacity > 0 ? Math.min(100, Math.round((loc.current_qty / loc.max_capacity) * 100)) : 0;
                  const isSel = selectedLoc?.id === loc.id;
                  const fill =
                    loc.is_locked || loc.location_type === 'QUARANTINE'
                      ? '#f43f5e'
                      : loc.location_type === 'PICK_FACE'
                        ? '#10b981'
                        : loc.location_type === 'COLD_STORAGE' || loc.location_type === 'BULK_STORAGE'
                          ? '#0ea5e9'
                          : '#6366f1';

                  return (
                    <g
                      key={loc.id}
                      onClick={() => setSelectedLoc(loc)}
                      className="cursor-pointer"
                    >
                      {isSel && (
                        <circle
                          cx={Number(loc.x_coord)}
                          cy={Number(loc.y_coord)}
                          r={3.2}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={0.5}
                        />
                      )}
                      <rect
                        x={Number(loc.x_coord) - 2.1}
                        y={Number(loc.y_coord) - 1.8}
                        width={4.2}
                        height={3.6}
                        rx={0.7}
                        fill={fill}
                        fillOpacity={0.88}
                      />
                      <text
                        x={Number(loc.x_coord)}
                        y={Number(loc.y_coord) + 0.55}
                        fontSize={1.45}
                        fontWeight="bold"
                        fill="#ffffff"
                        textAnchor="middle"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Bin Inspector + Zone Utilization */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              {selectedLoc ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{selectedLoc.location_code}</span>
                    <StatusBadge value={selectedLoc.is_locked ? 'LOCKED' : selectedLoc.location_type} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Warehouse <span className="font-semibold text-slate-700">{selectedLoc.warehouse_code}</span> • Zone{' '}
                    {selectedLoc.zone} • Aisle {selectedLoc.aisle}
                  </p>
                  <div className="mt-3 space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200/80">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Coordinates</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ({selectedLoc.x_coord}m, {selectedLoc.y_coord}m, Z{selectedLoc.z_coord})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Occupancy</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedLoc.current_qty} / {selectedLoc.max_capacity} units
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(100, Math.round((selectedLoc.current_qty / Math.max(1, selectedLoc.max_capacity)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">RF Barcode</span>
                      <span className="font-mono text-[11px] text-slate-700">{selectedLoc.barcode}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a location node to inspect.</p>
              )}

              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Zone Capacity Summary</p>
                <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {zoneUtilization.slice(0, 5).map((z, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {z.warehouse_code} • {z.zone}
                      </span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {z.current_units}/{z.total_capacity} ({z.utilization_pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Immutable Ledger Feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                Immutable Stock Ledger
              </h3>
              <p className="text-xs text-slate-500">Append-only cryptographic movement log</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Full Ledger →
            </button>
          </div>

          <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
            {ledger.slice(0, 10).map((entry) => {
              const delta = Number(entry.qty_delta);
              const rsvDelta = Number(entry.reserved_delta);
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-900">{entry.sku_code}</span>
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {entry.movement_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {entry.location_code || entry.warehouse_code} • Ref {entry.reference_code} •{' '}
                      <span className="font-mono text-[10px] text-slate-400">{entry.tx_hash}</span>
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0 ml-2">
                    {delta !== 0 ? (
                      <span className={`font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    ) : (
                      <span className="font-bold text-sky-600">Lock {rsvDelta > 0 ? `+${rsvDelta}` : rsvDelta}</span>
                    )}
                    <p className="text-[10px] text-slate-400">Bal: {entry.balance_after}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/80 px-3 py-2 text-[11px] text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              Trigger Guard: trg_immutable_inventory_ledger
            </span>
            <span className="font-mono font-semibold">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
