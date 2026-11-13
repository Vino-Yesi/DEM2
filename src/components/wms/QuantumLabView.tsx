'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Atom, Play, CheckCircle2, ArrowRightLeft, Layers, Zap, RefreshCw } from 'lucide-react';
import { WmsStatePayload } from '@/types/wms';
import { StatusBadge } from './StatusBadge';

interface Props {
  data: WmsStatePayload;
  warehouseId: number;
  onRefresh: () => Promise<void>;
  notify: (type: 'success' | 'error' | 'info' | 'quantum', title: string, description?: string) => void;
}

export function QuantumLabView({ warehouseId, onRefresh, notify }: Props) {
  const [sqaResult, setSqaResult] = useState<any | null>(null);
  const [quboResult, setQuboResult] = useState<any | null>(null);
  const [isingResult, setIsingResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingRoute, setApplyingRoute] = useState(false);
  const [executingSlotId, setExecutingSlotId] = useState<string | null>(null);
  const [showClassicalOverlay, setShowClassicalOverlay] = useState(true);

  const loadQuantumSimulations = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/wms/quantum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'RUN_SQA_ROUTING', payload: { warehouseId, applyToDatabase: false } }),
        }).then((r) => r.json()),
        fetch('/api/wms/quantum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'RUN_QUBO_SLOTTING', payload: { warehouseId } }),
        }).then((r) => r.json()),
        fetch('/api/wms/quantum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'RUN_ISING_WAVE_BATCH', payload: { warehouseId } }),
        }).then((r) => r.json()),
      ]);
      if (r1.result) setSqaResult(r1.result);
      if (r2.result) setQuboResult(r2.result);
      if (r3.result) setIsingResult(r3.result);
    } catch (err: any) {
      notify('error', 'Quantum Simulation Error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, notify]);

  useEffect(() => {
    loadQuantumSimulations();
  }, [loadQuantumSimulations]);

  const handleApplySqaRoute = async () => {
    setApplyingRoute(true);
    try {
      const res = await fetch('/api/wms/quantum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'RUN_SQA_ROUTING', payload: { warehouseId, applyToDatabase: true } }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setSqaResult(res.result);
      notify(
        'quantum',
        `Quantum Route Committed (${res.result.speedupPct}% Speedup)`,
        `Updated pick_sequence across ${res.result.quantumSequence.length} pick tasks (${res.result.distanceSavedM}m saved).`
      );
      await onRefresh();
    } catch (err: any) {
      notify('error', 'Failed to apply quantum route', err?.message);
    } finally {
      setApplyingRoute(false);
    }
  };

  const handleExecuteSlotting = async (rec: any) => {
    setExecutingSlotId(rec.id);
    try {
      const res = await fetch('/api/wms/quantum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'EXECUTE_QUBO_SLOTTING',
          payload: {
            balanceId: rec.highVelocityBalanceId,
            toLocationId: rec.recommendedLocationId,
            qty: rec.availableQty,
          },
        }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      notify(
        'quantum',
        `QUBO Slotting Executed (${rec.highVelocitySkuCode})`,
        `Moved ${rec.availableQty} units to prime slot ${rec.recommendedLocationCode} (${rec.projectedDailyMetersSaved}m/day saved).`
      );
      await onRefresh();
      await loadQuantumSimulations();
    } catch (err: any) {
      notify('error', 'Slotting Transfer Blocked', err?.message);
    } finally {
      setExecutingSlotId(null);
    }
  };

  // Build SVG polyline points for route visualization
  const buildPolyline = (stops: any[]) => {
    if (!sqaResult || !stops || stops.length === 0) return '';
    const pts = [sqaResult.origin, ...stops, sqaResult.destination];
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-cyan-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
              <Atom className="h-3.5 w-3.5" />
              Quantum Combinatorial WMS Acceleration Engine
            </div>
            <h2 className="mt-2.5 text-xl font-bold tracking-tight">
              Suzuki-Trotter Quantum Annealing, QUBO Slotting & Ising Wave Batching
            </h2>
            <p className="mt-1 max-w-3xl text-xs text-slate-300">
              Warehouse order-picking, SKU bin slotting, and multi-order wave partitioning are NP-hard combinatorial problems.
              Quantum path-integral tunneling escapes cross-aisle local minima to accelerate picker walk paths and dock-to-dispatch throughput.
            </p>
          </div>
          <button
            type="button"
            onClick={loadQuantumSimulations}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-Run Quantum Solvers
          </button>
        </div>
      </div>

      {/* Section 1: Suzuki-Trotter SQA Multi-Aisle Pick Route Optimizer */}
      {sqaResult && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  1. Simulated Quantum Annealing (SQA) Pick-Path Solver
                </h3>
                <StatusBadge value="QUANTUM_SQA_TROTTER" />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {sqaResult.trotterReplicas} coupled Suzuki-Trotter quantum slices • {sqaResult.annealingSweeps} transverse-field sweeps • Solved in{' '}
                <span className="font-mono font-semibold text-slate-700">{sqaResult.computeTimeMs}ms</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClassicalOverlay}
                  onChange={(e) => setShowClassicalOverlay(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Show Classical Path Overlay
              </label>
              <button
                type="button"
                onClick={handleApplySqaRoute}
                disabled={applyingRoute || sqaResult.quantumSequence.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50 transition"
              >
                {sqaResult.appliedToDb ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
                {applyingRoute
                  ? 'Committing Sequence...'
                  : sqaResult.appliedToDb
                    ? 'Committed to PostgreSQL Pick Tasks'
                    : 'Commit Quantum Sequence to Pick Tasks'}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-500">Classical Tour Distance</p>
              <p className="mt-1 font-mono text-xl font-bold text-rose-600 tabular-nums">
                {sqaResult.classicalDistanceM}m
              </p>
            </div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3">
              <p className="text-[11px] font-medium text-cyan-800">Quantum Tunneling Tour</p>
              <p className="mt-1 font-mono text-xl font-bold text-cyan-900 tabular-nums">
                {sqaResult.quantumDistanceM}m
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-[11px] font-medium text-emerald-800">Walk Distance Reduction</p>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                {sqaResult.speedupPct}% ({sqaResult.distanceSavedM}m)
              </p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-[11px] font-medium text-indigo-800">Est. Picker Time Saved</p>
              <p className="mt-1 font-mono text-xl font-bold text-indigo-900 tabular-nums">
                {sqaResult.estimatedTimeSavedSec}s / wave
              </p>
            </div>
          </div>

          {/* Map + Convergence Curve */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Floor Route Visualization */}
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Warehouse Pick-Tour Topology</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-rose-400">
                    <span className="h-0.5 w-3 bg-rose-400 inline-block" /> Classical
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan-400">
                    <span className="h-0.5 w-3 bg-cyan-400 inline-block" /> Quantum SQA
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 92 52" className="w-full h-60">
                {[12, 24, 36, 48, 60, 72, 82].map((ax, i) => (
                  <g key={ax}>
                    <line x1={ax} y1={6} x2={ax} y2={44} stroke="#1e293b" strokeWidth={1.6} />
                    <text x={ax} y={4.2} fontSize={1.7} fill="#64748b" textAnchor="middle">
                      A0{i + 1}
                    </text>
                  </g>
                ))}

                {showClassicalOverlay && sqaResult.classicalSequence.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth={0.55}
                    strokeDasharray="1.4 1.1"
                    strokeOpacity={0.75}
                    points={buildPolyline(sqaResult.classicalSequence)}
                  />
                )}

                {sqaResult.quantumSequence.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={0.95}
                    points={buildPolyline(sqaResult.quantumSequence)}
                  />
                )}

                {/* Origin & Pack Station */}
                <circle cx={sqaResult.origin.x} cy={sqaResult.origin.y} r={1.8} fill="#a855f7" />
                <text x={sqaResult.origin.x + 2.5} y={sqaResult.origin.y + 0.6} fontSize={1.8} fill="#e9d5ff">
                  START
                </text>

                <rect
                  x={sqaResult.destination.x - 2}
                  y={sqaResult.destination.y - 2}
                  width={4}
                  height={4}
                  rx={0.7}
                  fill="#10b981"
                />
                <text x={sqaResult.destination.x + 3} y={sqaResult.destination.y + 0.8} fontSize={1.8} fill="#6ee7b7">
                  PACK ST01
                </text>

                {sqaResult.quantumSequence.map((stop: any, idx: number) => (
                  <g key={stop.taskId}>
                    <circle cx={stop.x} cy={stop.y} r={2.0} fill="#0891b2" stroke="#ecfeff" strokeWidth={0.35} />
                    <text
                      x={stop.x}
                      y={stop.y + 0.65}
                      fontSize={1.75}
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                    >
                      {idx + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Hamiltonian Convergence Curve + Sequence List */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Hamiltonian Ground-State Convergence (E vs Sweep)
                  </span>
                  <span className="font-mono text-[11px] text-cyan-700">Transverse Field Γ: 28.0 → 0.15</span>
                </div>

                {sqaResult.convergenceHistory?.length > 1 && (() => {
                  const hist = sqaResult.convergenceHistory;
                  const maxE = Math.max(...hist.map((h: any) => Math.max(h.classicalBestEnergy, h.quantumBestEnergy))) + 15;
                  const minE = Math.min(...hist.map((h: any) => Math.min(h.classicalBestEnergy, h.quantumBestEnergy))) - 15;
                  const range = Math.max(20, maxE - minE);
                  const toCoord = (idx: number, val: number) => {
                    const x = 6 + (idx / (hist.length - 1)) * 88;
                    const y = 36 - ((val - minE) / range) * 30;
                    return `${x},${y}`;
                  };
                  const classicalPts = hist.map((h: any, i: number) => toCoord(i, h.classicalBestEnergy)).join(' ');
                  const quantumPts = hist.map((h: any, i: number) => toCoord(i, h.quantumBestEnergy)).join(' ');

                  return (
                    <svg viewBox="0 0 100 42" className="mt-2 h-28 w-full rounded-lg bg-white ring-1 ring-slate-200 p-1">
                      <polyline fill="none" stroke="#f43f5e" strokeWidth={0.8} strokeDasharray="1.5 1" points={classicalPts} />
                      <polyline fill="none" stroke="#0891b2" strokeWidth={1.1} points={quantumPts} />
                      <text x={6} y={39.5} fontSize={2.4} fill="#64748b">
                        Sweep 0 (High Quantum Tunneling Γ)
                      </text>
                      <text x={94} y={39.5} fontSize={2.4} fill="#64748b" textAnchor="end">
                        Sweep 80 (Collapsed Ground State)
                      </text>
                    </svg>
                  );
                })()}
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Quantum-Ordered RF Pick Sequence
                </p>
                <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1 pr-1">
                  {sqaResult.quantumSequence.map((s: any, idx: number) => (
                    <div
                      key={s.taskId}
                      className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-200/70"
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-semibold text-slate-800">{s.locationCode}</span>
                        <span className="text-slate-500">{s.skuCode}</span>
                      </span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {s.qty} EA • ({s.x}m,{s.y}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2 & 3: QUBO Slotting + Ising Spin-Glass Wave Batching */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* QUBO Slotting */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
                2. QUBO Slotting & Co-Affinity Hamiltonian
              </h3>
              <p className="text-xs text-slate-500">
                Minimizes H(x) = xᵀQx across SKU pick velocity and Pack-Station distance
              </p>
            </div>
            {quboResult && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                -{quboResult.improvementPct}% Energy
              </span>
            )}
          </div>

          {quboResult && quboResult.recommendations.length > 0 ? (
            <div className="mt-4 space-y-3">
              {quboResult.recommendations.map((rec: any) => (
                <div key={rec.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{rec.highVelocitySkuCode}</span>
                        <StatusBadge value={`CLASS ${rec.velocityClass}`} />
                        <span className="font-mono text-xs text-emerald-700 font-semibold">
                          ΔH = {rec.quboDeltaEnergy}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{rec.reason}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                    <div className="font-mono text-xs text-slate-700">
                      {rec.currentLocationCode} ({rec.currentDistanceToPackM}m) →{' '}
                      <span className="font-bold text-emerald-700">
                        {rec.recommendedLocationCode} ({rec.recommendedDistanceToPackM}m)
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={executingSlotId === rec.id}
                      onClick={() => handleExecuteSlotting(rec)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      {executingSlotId === rec.id
                        ? 'Transferring...'
                        : `Execute Re-Slot (${rec.availableQty} EA)`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
              <p className="mt-2 text-xs font-semibold text-emerald-900">
                QUBO Ground State Reached — All Class-A Fast Movers Occupy Optimal Prime Slots!
              </p>
            </div>
          )}
        </div>

        {/* Ising Wave Partitioner */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-600" />
                3. Quantum Ising Spin-Glass Wave Partitioner
              </h3>
              <p className="text-xs text-slate-500">
                Ferromagnetic SKU-overlap coupling J_ij with balanced picker workload penalty
              </p>
            </div>
            {isingResult && (
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-800">
                +{isingResult.coPickAffinityGainPct}% Co-Pick Overlap
              </span>
            )}
          </div>

          {isingResult && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {isingResult.waves.map((w: any) => (
                <div key={w.cohort} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{w.cohort}</span>
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                      Spin {w.spinState}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {w.orderCount} orders • <span className="font-semibold text-slate-800">{w.totalUnits} total units</span>
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    {w.orders.map((o: any) => (
                      <div key={o.id} className="rounded-lg bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-slate-900">{o.soNumber}</span>
                          <StatusBadge value={o.priority} />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {o.customerName} • {o.units} EA
                        </p>
                      </div>
                    ))}
                    {w.orders.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No pending orders in this spin cohort.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
