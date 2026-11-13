'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  ScanBarcode,
  CheckCircle2,
  Lock,
  Unlock,
  PackageCheck,
  Truck,
  ShieldAlert,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { WmsStatePayload } from '@/types/wms';
import { BarcodeGraphic, EmptyState, StatusBadge } from './StatusBadge';

interface FlowProps {
  data: WmsStatePayload;
  warehouseId: number;
  runAction: (
    action: string,
    payload: Record<string, any>,
    successMsg: string,
    optimisticMutator?: (draft: WmsStatePayload) => void
  ) => Promise<any>;
  busyAction: string | null;
}

// ============================================================================
// 1. INVENTORY, LEDGER, TRANSFERS & REPLENISHMENT VIEW
// ============================================================================
export function InventoryView({ data, runAction, busyAction }: FlowProps) {
  const [tab, setTab] = useState<'balances' | 'ledger' | 'replenishment'>('balances');
  const [query, setQuery] = useState('');
  const [velocityFilter, setVelocityFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [transferModal, setTransferModal] = useState<any | null>(null);
  const [toLocId, setToLocId] = useState<number>(2);
  const [transferQty, setTransferQty] = useState<number>(5);
  const [adjustModal, setAdjustModal] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(2);
  const [adjustReason, setAdjustReason] = useState('Cycle Count Physical Audit');

  const filteredBalances = data.balances.filter((b) => {
    if (velocityFilter !== 'ALL' && b.velocity_class !== velocityFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.sku_code.toLowerCase().includes(q) ||
      b.sku_name.toLowerCase().includes(q) ||
      b.location_code.toLowerCase().includes(q) ||
      (b.lot_number || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Sub-navigation & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: 'balances', label: `Stock Balances (${data.balances.length})` },
            { id: 'replenishment', label: `Replenishment & Transfers (${data.replenishmentTasks.length})` },
            { id: 'ledger', label: `Immutable Ledger (${data.ledger.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'balances' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter SKU, bin, lot..."
                className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              {(['ALL', 'A', 'B', 'C'] as const).map((vc) => (
                <button
                  key={vc}
                  type="button"
                  onClick={() => setVelocityFilter(vc)}
                  className={`rounded-md px-2.5 py-1 font-semibold ${
                    velocityFilter === vc ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  {vc === 'ALL' ? 'All ABC' : `Class ${vc}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab === 'balances' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredBalances.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No matching inventory balances"
                description="No stock bins matched your current search or ABC velocity filter."
                actionLabel="Clear Filters"
                onAction={() => {
                  setQuery('');
                  setVelocityFilter('ALL');
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-left font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">SKU / Product</th>
                    <th className="px-4 py-3">Warehouse & Bin</th>
                    <th className="px-4 py-3">Lot & Expiry</th>
                    <th className="px-4 py-3 text-right">On Hand</th>
                    <th className="px-4 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBalances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{b.sku_code}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {b.velocity_class}
                          </span>
                        </div>
                        <p className="text-slate-500 truncate max-w-xs">{b.sku_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-800">{b.location_code}</span>
                        <p className="text-[11px] text-slate-500">
                          {b.warehouse_code} • {b.zone}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div>{b.lot_number}</div>
                        {b.expiry_date && (
                          <div className="text-slate-400">Exp: {String(b.expiry_date).slice(0, 10)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {b.on_hand_qty} {b.uom}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-sky-700 font-semibold">
                        {b.reserved_qty}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        <span className={b.available_qty <= 8 ? 'text-rose-600' : 'text-emerald-700'}>
                          {b.available_qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferModal(b);
                              const alt = data.locations.find((l) => l.id !== b.location_id && !l.is_locked);
                              if (alt) setToLocId(alt.id);
                              setTransferQty(Math.min(5, Math.max(1, b.available_qty)));
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustModal(b);
                              setAdjustDelta(2);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'replenishment' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Min/Max Replenishment Tasks</h3>
            <p className="text-xs text-slate-500">Auto-triggered bulk-to-pick-face stock movements</p>
            <div className="mt-4 space-y-3">
              {data.replenishmentTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{t.replen_code}</span>
                      <StatusBadge value={t.status} />
                    </div>
                    <p className="mt-1 text-slate-700">
                      Move <span className="font-bold">{t.qty} EA</span> of <span className="font-mono">{t.sku_code}</span>:{' '}
                      <span className="font-mono">{t.from_location_code}</span> →{' '}
                      <span className="font-mono font-bold text-emerald-700">{t.to_location_code}</span>
                    </p>
                  </div>
                  {t.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        runAction(
                          'EXECUTE_REPLENISHMENT',
                          { taskId: t.id },
                          `Executed replenishment ${t.replen_code}`,
                          (draft) => {
                            const target = draft.replenishmentTasks.find((x) => x.id === t.id);
                            if (target) target.status = 'COMPLETED';
                          }
                        )
                      }
                      className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Execute Move
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Recent Stock Transfers</h3>
            <p className="text-xs text-slate-500">Atomic bin-to-bin & inter-warehouse transfers</p>
            <div className="mt-4 space-y-2.5">
              {data.transfers.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No manual transfers yet — click Transfer on any Stock Balance row or execute QUBO Slotting!
                </p>
              ) : (
                data.transfers.map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{tr.transfer_number}</span> •{' '}
                      <span className="font-mono text-slate-700">{tr.sku_code}</span>
                      <p className="text-[11px] text-slate-500">
                        {tr.from_location_code} → {tr.to_location_code} ({tr.reason})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">{tr.qty} EA</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Append-Only Cryptographic Stock Ledger</h3>
              <p className="text-xs text-slate-500">
                Protected by PostgreSQL BEFORE UPDATE OR DELETE trigger (trg_immutable_inventory_ledger)
              </p>
            </div>
            <StatusBadge value="HEALTHY" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">ID / Hash</th>
                  <th className="px-4 py-2.5">Movement Type</th>
                  <th className="px-4 py-2.5">SKU & Bin</th>
                  <th className="px-4 py-2.5 text-right">Qty Delta</th>
                  <th className="px-4 py-2.5 text-right">Lock Delta</th>
                  <th className="px-4 py-2.5 text-right">Balance After</th>
                  <th className="px-4 py-2.5">Reference / Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-[11px]">
                      <div className="font-bold text-slate-800">#{l.id}</div>
                      <div className="text-slate-400">{l.tx_hash}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge value={l.movement_type} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-mono font-semibold text-slate-900">{l.sku_code}</div>
                      <div className="text-[11px] text-slate-500">{l.location_code || l.warehouse_code}</div>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums ${
                        l.qty_delta > 0 ? 'text-emerald-600' : l.qty_delta < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {l.qty_delta > 0 ? `+${l.qty_delta}` : l.qty_delta}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sky-700">
                      {l.reserved_delta > 0 ? `+${l.reserved_delta}` : l.reserved_delta}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {l.balance_after}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600">
                      <div className="font-mono font-semibold text-slate-800">
                        {l.reference_type}: {l.reference_code}
                      </div>
                      <div>{l.operator_name}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Atomic Row-Locked Stock Transfer ({transferModal.sku_code})
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              From bin <span className="font-mono font-semibold">{transferModal.location_code}</span> (Available:{' '}
              {transferModal.available_qty})
            </p>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Destination Bin</label>
                <select
                  value={toLocId}
                  onChange={(e) => setToLocId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                >
                  {data.locations
                    .filter((l) => l.id !== transferModal.location_id && !l.is_locked)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_code} ({l.warehouse_code} • {l.location_type})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Quantity to Move</label>
                <input
                  type="number"
                  min={1}
                  max={transferModal.available_qty}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferModal(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = transferModal;
                  setTransferModal(null);
                  await runAction(
                    'TRANSFER_STOCK',
                    { balanceId: target.id, toLocationId: toLocId, qty: transferQty },
                    `Transferred ${transferQty} units of ${target.sku_code}`
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Count Adjustment Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Cycle Count Adjustment ({adjustModal.sku_code})</h3>
            <p className="mt-1 text-xs text-slate-500">
              Bin <span className="font-mono font-semibold">{adjustModal.location_code}</span> • Current On-Hand:{' '}
              {adjustModal.on_hand_qty}
            </p>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Quantity Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Audit Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = adjustModal;
                  setAdjustModal(null);
                  await runAction(
                    'ADJUST_STOCK',
                    { balanceId: target.id, qtyDelta: adjustDelta, reason: adjustReason },
                    `Adjusted ${target.sku_code} by ${adjustDelta > 0 ? '+' : ''}${adjustDelta}`
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. INBOUND OPERATIONS: POs, ASN, QC INSPECTION & PUTAWAY
// ============================================================================
export function InboundView({ data, warehouseId, runAction, busyAction }: FlowProps) {
  const [showNewPo, setShowNewPo] = useState(false);
  const [supplierId, setSupplierId] = useState<number>(data.suppliers[0]?.id || 1);
  const [skuId, setSkuId] = useState<number>(data.skus[0]?.id || 1);
  const [qty, setQty] = useState<number>(30);
  const [notes, setNotes] = useState('Scheduled Inbound ASN');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Inbound Purchase Orders, ASN & Dock QC Putaway</h2>
          <p className="text-xs text-slate-500">
            Receive supplier shipments, run quality inspection, and commit atomic GRN putaway to storage bins.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewPo(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </button>
      </div>

      {/* Purchase Orders List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.purchaseOrders.map((po) => (
          <div key={po.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{po.po_number}</span>
                  <StatusBadge value={po.status} />
                </div>
                <span className="font-mono text-xs text-slate-500">{po.asn_number}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {po.supplier_name} ({po.supplier_country}) • Dock {po.warehouse_code}
              </p>
              {po.notes && <p className="mt-1 text-xs text-slate-500">{po.notes}</p>}

              <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200/70">
                {po.lines.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-800">
                      {l.sku_code} <span className="font-sans font-normal text-slate-500">— {l.sku_name}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-700">
                      {l.received_qty}/{l.ordered_qty} {l.uom}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      'RECEIVE_PO',
                      { poId: po.id, qcStatus: 'PASSED' },
                      `GRN Posted: ${po.po_number} QC Passed & Putaway Complete`,
                      (draft) => {
                        const target = draft.purchaseOrders.find((p) => p.id === po.id);
                        if (target) target.status = 'RECEIVED';
                      }
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Receive & Pass QC (Putaway)
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      'RECEIVE_PO',
                      { poId: po.id, qcStatus: 'QUARANTINE' },
                      `${po.po_number} routed to Quarantine Hold Bin`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Hold in Quarantine
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent GRN Receipts */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Goods Receipt Notes (GRN) History</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">GRN #</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Lot</th>
                <th className="px-3 py-2">QC Status</th>
                <th className="px-3 py-2">Putaway Bin</th>
                <th className="px-3 py-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.receipts.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.grn_number}</td>
                  <td className="px-3 py-2 font-mono text-slate-800">{r.sku_code}</td>
                  <td className="px-3 py-2 font-mono text-slate-500">{r.lot_number}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={r.qc_status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700">{r.putaway_location_code || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">+{r.received_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showNewPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create Inbound Purchase Order (ASN)</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">SKU to Order</label>
                <select
                  value={skuId}
                  onChange={(e) => setSkuId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sku_code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Order Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">ASN Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewPo(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNewPo(false);
                  await runAction(
                    'CREATE_PO',
                    { warehouseId, supplierId, notes, lines: [{ skuId, orderedQty: qty }] },
                    'Inbound Purchase Order & ASN Created'
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Create PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. OUTBOUND OPERATIONS: CONCURRENCY RACE SIMULATOR, ALLOCATE, PICK, PACK, SHIP
// ============================================================================
export function OutboundView({ data, warehouseId, runAction, busyAction }: FlowProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewSo, setShowNewSo] = useState(false);
  const [customerId, setCustomerId] = useState<number>(data.customers[0]?.id || 1);
  const [priority, setPriority] = useState<'CRITICAL' | 'SAME_DAY' | 'PRIORITY' | 'STANDARD'>('PRIORITY');
  const [skuId, setSkuId] = useState<number>(data.skus[0]?.id || 1);
  const [qty, setQty] = useState<number>(4);
  const [raceResult, setRaceResult] = useState<any | null>(null);

  const pendingOrders = data.salesOrders.filter((s) => s.status === 'PENDING');
  const filteredOrders = data.salesOrders.filter((s) => statusFilter === 'ALL' || s.status === statusFilter);

  const handleRunRaceTest = async () => {
    let idA = pendingOrders[0]?.id;
    let idB = pendingOrders[1]?.id;

    // Prefer SO-2026-8807 and SO-2026-8808 if both are still PENDING
    const c7 = pendingOrders.find((o) => o.so_number === 'SO-2026-8807');
    const c8 = pendingOrders.find((o) => o.so_number === 'SO-2026-8808');
    if (c7 && c8) {
      idA = c7.id;
      idB = c8.id;
    }

    if (!idA || !idB) {
      // Create two competing orders on SKU-OPT-SFP (id=12) automatically so user can test anytime!
      const r1 = await fetch('/api/wms/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SO',
          payload: { warehouseId: 1, customerId: 1, priority: 'CRITICAL', notes: 'Race Contender A', lines: [{ skuId: 12, orderedQty: 5 }] },
        }),
      }).then((r) => r.json());
      const r2 = await fetch('/api/wms/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SO',
          payload: { warehouseId: 1, customerId: 2, priority: 'CRITICAL', notes: 'Race Contender B', lines: [{ skuId: 12, orderedQty: 5 }] },
        }),
      }).then((r) => r.json());
      idA = r1.so?.id;
      idB = r2.so?.id;
    }

    const res = await runAction(
      'SIMULATE_CONCURRENT_RACE',
      { soIdA: idA, soIdB: idB },
      'Concurrent Row-Lock Contention Test Completed'
    );
    if (res?.result) {
      setRaceResult(res.result);
    }
  };

  return (
    <div className="space-y-6">
      {/* Concurrency Row-Lock Contention Simulator */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                PostgreSQL Concurrent Allocation Race Verifier (SELECT ... FOR UPDATE)
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Fires two simultaneous operator allocation transactions via Promise.all() competing for limited stock (e.g.,{' '}
              <span className="font-mono font-semibold">SKU-OPT-SFP</span>), proving zero double-allocation under contention.
            </p>
          </div>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleRunRaceTest}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            Fire Simultaneous 2-Operator Race Test
          </button>
        </div>

        {raceResult && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-indigo-100 pt-3 text-xs">
            {raceResult.results.map((r: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  r.success ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {r.operatorName} → {r.soNumber}
                  </span>
                  <StatusBadge value={r.success ? 'ALLOCATED' : 'FAILED'} />
                </div>
                <p className="mt-1 text-[11px] text-slate-700">{r.message}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">Tx Lock Time: {r.durationMs}ms</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header + Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'PENDING', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED', 'DISPATCHED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowNewSo(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          <Plus className="h-4 w-4" />
          New Sales Order
        </button>
      </div>

      {/* Sales Orders Cards */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Sales Orders in this stage"
          description="Try switching status filters or create a new customer fulfilment order."
          actionLabel="Show All Orders"
          onAction={() => setStatusFilter('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredOrders.map((so) => {
            const orderPicks = data.pickTasks.filter((pt) => pt.so_id === so.id && pt.status !== 'COMPLETED');
            return (
              <div key={so.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">{so.so_number}</span>
                      <StatusBadge value={so.priority} />
                      <StatusBadge value={so.status} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ${Number(so.total_value).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {so.customer_name} ({so.customer_city}) • {so.warehouse_code}
                  </p>
                  {so.notes && <p className="mt-0.5 text-[11px] text-slate-500">{so.notes}</p>}

                  <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200/70 text-xs">
                    {so.lines.map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-800">{l.sku_code}</span>
                        <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                          Ord: {l.ordered_qty} | Alloc: {l.allocated_qty} | Picked: {l.picked_qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifecycle Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {so.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        runAction(
                          'ALLOCATE_SO',
                          { soId: so.id, operatorName: 'Omar Farooq' },
                          `Allocated stock for ${so.so_number}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Allocate Stock (FOR UPDATE)
                    </button>
                  )}

                  {['ALLOCATED', 'PICKING'].includes(so.status) &&
                    orderPicks.map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() =>
                          runAction(
                            'COMPLETE_PICK_TASK',
                            { taskId: pt.id, operatorName: 'Picker-RF-01' },
                            `Picked ${pt.qty}x ${pt.sku_code} from ${pt.from_location_code}`,
                            (draft) => {
                              const target = draft.pickTasks.find((x) => x.id === pt.id);
                              if (target) target.status = 'COMPLETED';
                            }
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                      >
                        Pick {pt.qty}x {pt.sku_code} ({pt.from_location_code})
                      </button>
                    ))}

                  {so.status === 'PICKED' && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        runAction(
                          'PACK_SO',
                          { soId: so.id, cartonType: 'STD-BOX-M' },
                          `Packed ${so.so_number} into outbound carton`,
                          (draft) => {
                            const target = draft.salesOrders.find((x) => x.id === so.id);
                            if (target) target.status = 'PACKED';
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Pack Carton
                    </button>
                  )}

                  {so.status === 'PACKED' && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        runAction(
                          'DISPATCH_SO',
                          { soId: so.id, carrierId: 1, serviceLevel: 'EXPRESS_AIR' },
                          `Dispatched ${so.so_number} via DHL Express Air`,
                          (draft) => {
                            const target = draft.salesOrders.find((x) => x.id === so.id);
                            if (target) target.status = 'DISPATCHED';
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Manifest & Dispatch Carrier
                    </button>
                  )}

                  {so.status === 'DISPATCHED' && (
                    <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Fulfilment Complete & Dispatched
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shipments Manifest Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Transport & Carrier Shipments</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Shipment #</th>
                <th className="px-3 py-2">Sales Order</th>
                <th className="px-3 py-2">Carrier</th>
                <th className="px-3 py-2">Tracking Number</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.shipments.map((sh) => (
                <tr key={sh.id}>
                  <td className="px-3 py-2 font-mono font-bold text-slate-900">{sh.shipment_number}</td>
                  <td className="px-3 py-2 font-mono text-slate-800">{sh.so_number}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {sh.carrier_name} ({sh.service_level})
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{sh.tracking_number}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{sh.total_weight_kg} kg</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={sh.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Order Modal */}
      {showNewSo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create Outbound Sales Order</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">SLA Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="SAME_DAY">SAME DAY</option>
                  <option value="PRIORITY">PRIORITY</option>
                  <option value="STANDARD">STANDARD</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">SKU</label>
                <select
                  value={skuId}
                  onChange={(e) => setSkuId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sku_code} — {s.name} (Avail: {s.total_available})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewSo(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNewSo(false);
                  await runAction(
                    'CREATE_SO',
                    { warehouseId, customerId, priority, lines: [{ skuId, orderedQty: qty }] },
                    'Outbound Sales Order Created'
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. MASTER CATALOG & RF BARCODE SCANNER VIEW
// ============================================================================
export function CatalogScannerView({ data, runAction }: FlowProps) {
  const [scanInput, setScanInput] = useState('6291041500013');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [showNewSku, setShowNewSku] = useState(false);
  const [skuCode, setSkuCode] = useState('SKU-AMR-700');
  const [barcode, setBarcode] = useState('6291041500990');
  const [skuName, setSkuName] = useState('Autonomous Mobile Robot Docking Beacon');
  const [unitCost, setUnitCost] = useState(340);
  const [velocityClass, setVelocityClass] = useState<'A' | 'B' | 'C'>('A');

  const executeScan = async (code: string) => {
    setScanInput(code);
    const res = await fetch('/api/wms/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SCAN_BARCODE', payload: { code } }),
    }).then((r) => r.json());
    setScanResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Handheld RF Barcode Scanner Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ScanBarcode className="h-4 w-4 text-indigo-600" />
              Universal Handheld RF Barcode Scanner & Instant Lookup
            </h3>
            <p className="text-xs text-slate-500">
              Scan or click any EAN-13 SKU barcode, Location barcode, PO, or Sales Order code.
            </p>
          </div>
          <BarcodeGraphic value={scanInput || '6291041500013'} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeScan(scanInput);
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Scan EAN-13 / Code-128 barcode..."
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-xs text-slate-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            Trigger RF Scan
          </button>
        </form>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium">Quick Scan Presets:</span>
          {['6291041500013', '6291041500129', 'LOC-DXB-A01R1', 'SO-2026-8807', 'PO-2026-402'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => executeScan(preset)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
            >
              {preset}
            </button>
          ))}
        </div>

        {scanResult && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            {!scanResult.matched ? (
              <p className="text-rose-600 font-medium">{scanResult.message}</p>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    [{scanResult.entityType}] {scanResult.entity.sku_code || scanResult.entity.location_code || scanResult.entity.so_number || scanResult.entity.po_number}
                  </span>
                  <StatusBadge value={scanResult.entityType} />
                </div>
                <p className="mt-1 text-slate-700 font-medium">
                  {scanResult.entity.name || scanResult.entity.customer_name || scanResult.entity.supplier_name}
                </p>
                {scanResult.bins && (
                  <div className="mt-2 space-y-1">
                    {scanResult.bins.map((b: any) => (
                      <div key={b.id} className="flex justify-between rounded bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        <span className="font-mono font-semibold">
                          {b.warehouse_code} • {b.location_code} ({b.lot_number})
                        </span>
                        <span className="font-mono">
                          Avail: <strong className="text-emerald-700">{b.available_qty}</strong> / On-hand: {b.on_hand_qty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {scanResult.contents && (
                  <div className="mt-2 space-y-1">
                    {scanResult.contents.map((c: any) => (
                      <div key={c.id} className="flex justify-between rounded bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        <span className="font-mono font-semibold">{c.sku_code} — {c.sku_name}</span>
                        <span className="font-mono font-bold text-emerald-700">{c.available_qty} {c.uom} avail</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Master SKUs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Master SKU & Barcode Directory ({data.skus.length})</h3>
            <p className="text-xs text-slate-500">Unique constraints enforced on sku_code and EAN-13 barcode</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewSku(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Master SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">SKU Code</th>
                <th className="px-4 py-2.5">EAN-13 Barcode</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Velocity</th>
                <th className="px-4 py-2.5 text-right">Unit Cost</th>
                <th className="px-4 py-2.5 text-right">Available / Reorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.skus.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{s.sku_code}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{s.barcode}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={`CLASS ${s.velocity_class}`} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">${Number(s.unit_cost).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <span className={s.total_available <= s.reorder_point ? 'font-bold text-rose-600' : 'font-semibold text-emerald-700'}>
                      {s.total_available}
                    </span>{' '}
                    / {s.reorder_point} {s.uom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New SKU Modal */}
      {showNewSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Register Master SKU & Barcode</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">SKU Code</label>
                <input
                  type="text"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">EAN-13 / Code-128 Barcode</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Item Name</label>
                <input
                  type="text"
                  value={skuName}
                  onChange={(e) => setSkuName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">ABC Velocity</label>
                  <select
                    value={velocityClass}
                    onChange={(e) => setVelocityClass(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="A">Class A (Fast)</option>
                    <option value="B">Class B (Medium)</option>
                    <option value="C">Class C (Slow)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewSku(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNewSku(false);
                  await runAction(
                    'CREATE_SKU',
                    {
                      skuCode,
                      barcode,
                      name: skuName,
                      category: 'Robotics & Auto-ID',
                      uom: 'EA',
                      weightKg: 1.5,
                      unitCost,
                      velocityClass,
                      reorderPoint: 20,
                      maxStock: 180,
                    },
                    `Registered SKU ${skuCode}`
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Save SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. WAREHOUSES & 3D LOCATIONS VIEW
// ============================================================================
export function LocationsView({ data, warehouseId, runAction }: FlowProps) {
  const [showNewBin, setShowNewBin] = useState(false);
  const [locCode, setLocCode] = useState('DXB-A-02-R4-B1');
  const [zone, setZone] = useState('ZONE-A');
  const [xCoord, setXCoord] = useState(24);
  const [yCoord, setYCoord] = useState(26);

  return (
    <div className="space-y-6">
      {/* Multi-Warehouse Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.warehouses.map((w) => (
          <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-700">{w.warehouse_code}</span>
              <StatusBadge value={w.status} />
            </div>
            <h3 className="mt-1 text-sm font-bold text-slate-900">{w.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {w.city}, {w.country} • {Number(w.total_area_sqft).toLocaleString()} sq ft • {w.dock_doors} Docks
            </p>
          </div>
        ))}
      </div>

      {/* Locations Directory with Optimistic Lock Toggle */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Spatial Bins & Capacities ({data.locations.length})</h3>
            <p className="text-xs text-slate-500">
              Optimistic bin lock toggles immediately guard bins against concurrent allocations or transfers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewBin(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Spatial Bin
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Location Code</th>
                <th className="px-4 py-2.5">Type & Zone</th>
                <th className="px-4 py-2.5">3D Coords</th>
                <th className="px-4 py-2.5">Occupancy</th>
                <th className="px-4 py-2.5 text-right">Lock State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-slate-900">{loc.location_code}</span>
                    <div className="font-mono text-[10px] text-slate-400">{loc.barcode}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={loc.location_type} />
                    <span className="ml-2 text-slate-500">
                      {loc.warehouse_code} • {loc.zone}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    ({loc.x_coord}m, {loc.y_coord}m, Z{loc.z_coord})
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">
                    {loc.current_qty} / {loc.max_capacity}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          'TOGGLE_BIN_LOCK',
                          { locationId: loc.id, isLocked: !loc.is_locked },
                          `${loc.location_code} ${!loc.is_locked ? 'locked' : 'unlocked'}`,
                          (draft) => {
                            const target = draft.locations.find((x) => x.id === loc.id);
                            if (target) target.is_locked = !loc.is_locked;
                          }
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                        loc.is_locked
                          ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-300'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300'
                      }`}
                    >
                      {loc.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      {loc.is_locked ? 'Locked' : 'Unlocked'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create Spatial Warehouse Bin</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Location Code</label>
                <input
                  type="text"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Zone</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">X Coord (m)</label>
                  <input
                    type="number"
                    value={xCoord}
                    onChange={(e) => setXCoord(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Y Coord (m)</label>
                  <input
                    type="number"
                    value={yCoord}
                    onChange={(e) => setYCoord(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewBin(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNewBin(false);
                  await runAction(
                    'CREATE_LOCATION',
                    {
                      warehouseId,
                      locationCode: locCode,
                      zone,
                      aisle: '02',
                      rack: 'R4',
                      locationType: 'PICK_FACE',
                      xCoord,
                      yCoord,
                      maxCapacity: 180,
                    },
                    `Created spatial bin ${locCode}`
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Create Bin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. RETURNS (RMA) & DISPOSITION VIEW
// ============================================================================
export function ReturnsRmaView({ data, warehouseId, runAction, busyAction }: FlowProps) {
  const [showNewRma, setShowNewRma] = useState(false);
  const [customerId, setCustomerId] = useState<number>(data.customers[0]?.id || 1);
  const [skuId, setSkuId] = useState<number>(data.skus[0]?.id || 1);
  const [qty, setQty] = useState<number>(2);
  const [reason, setReason] = useState('Unopened customer over-order return');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Returns Management (RMA), Inspection & Disposition</h2>
          <p className="text-xs text-slate-500">
            Inspect returned items and route to RESTOCK (live inventory + ledger credit), REFURBISH, or SCRAP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewRma(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Log Customer RMA
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.rmas.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">{r.rma_number}</span>
                <StatusBadge value={r.status} />
                <StatusBadge value={r.disposition} />
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">{r.qty} EA</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-800">
              {r.sku_code} — {r.sku_name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Customer: {r.customer_name} • Grade: {r.condition_grade}
            </p>
            <p className="mt-1 text-xs text-slate-600 italic">“{r.reason}”</p>

            {r.status === 'AWAITING_INSPECTION' && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      'PROCESS_RMA',
                      { rmaId: r.id, disposition: 'RESTOCK' },
                      `${r.rma_number} Restocked to Pick Face (+${r.qty} EA)`
                    )
                  }
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Approve & Restock to Inventory
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      'PROCESS_RMA',
                      { rmaId: r.id, disposition: 'REFURBISH' },
                      `${r.rma_number} routed to Refurbish bench`
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Route to Refurbish
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction('PROCESS_RMA', { rmaId: r.id, disposition: 'SCRAP' }, `${r.rma_number} marked as Scrap`)
                  }
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Scrap
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNewRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create Return Merchandise Authorization (RMA)</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Returned SKU</label>
                <select
                  value={skuId}
                  onChange={(e) => setSkuId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sku_code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Return Qty</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Return Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRma(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowNewRma(false);
                  await runAction(
                    'CREATE_RMA',
                    { customerId, warehouseId, skuId, qty, reason, conditionGrade: 'UNOPENED_A' },
                    'RMA Created & Queued for Inspection'
                  );
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Create RMA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
