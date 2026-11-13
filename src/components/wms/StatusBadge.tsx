'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  HEALTHY: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PASS: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PASSED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  RECEIVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DISPATCHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PROCESSED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  RESTOCK: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',

  ALLOCATED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  PICKING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  PICKED: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  PACKED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ASN_IN_TRANSIT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  QUANTUM_SQA_TROTTER: 'bg-cyan-50 text-cyan-800 ring-cyan-600/25',
  OPPORTUNITY: 'bg-cyan-50 text-cyan-800 ring-cyan-600/25',

  PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  OPEN: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  PENDING_QC: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  AWAITING_INSPECTION: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  WARN: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  WARNING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  SAME_DAY: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  PRIORITY: 'bg-blue-50 text-blue-700 ring-blue-600/20',

  CRITICAL: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  QUARANTINE: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  FAIL: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  DEGRADED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  SCRAP: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  LOCKED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export function StatusBadge({ value, className = '' }: { value: string; className?: string }) {
  const key = String(value || 'STANDARD').toUpperCase();
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${style} ${className}`}
    >
      {key.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <Inbox className="h-5 w-5 text-slate-400" />
      </div>
      <h4 className="mt-3 text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Deterministic visual Code-128 style SVG barcode graphic for SKUs and Locations
 */
export function BarcodeGraphic({ value, height = 34 }: { value: string; height?: number }) {
  const bars: number[] = [];
  const str = value || '0000000000';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    bars.push((c % 3) + 1, ((c >> 2) % 2) + 1, ((c >> 4) % 3) + 1);
  }
  let x = 2;
  const elements: React.ReactNode[] = [];
  bars.forEach((w, idx) => {
    if (idx % 2 === 0) {
      elements.push(<rect key={idx} x={x} y={2} width={w * 1.35} height={height - 4} fill="#0f172a" rx={0.4} />);
    }
    x += w * 1.45 + 0.6;
  });

  return (
    <div className="inline-flex flex-col items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <svg width={Math.min(180, Math.max(90, x + 4))} height={height} viewBox={`0 0 ${x + 4} ${height}`}>
        {elements}
      </svg>
      <span className="mt-0.5 font-mono text-[10px] tracking-widest text-slate-600">{str}</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-7 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-2.5 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl border border-slate-200 bg-white lg:col-span-2" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
