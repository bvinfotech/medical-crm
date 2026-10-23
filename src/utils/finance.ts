import { Invoice, Tender, EmdPbgRecord } from '../types/crm';

// Single source of truth for money figures shown across modules.

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// Balance is always derived from total - paid so it can never drift from stored values.
export function invoiceBalance(inv: Pick<Invoice, 'totalAmount' | 'amountPaid'>): number {
  return Math.max(0, round2((inv.totalAmount || 0) - (inv.amountPaid || 0)));
}

export function totalReceivables(invoices: Invoice[]): number {
  return round2(invoices.reduce((acc, inv) => acc + invoiceBalance(inv), 0));
}

export function sumBilled(invoices: Invoice[]): number {
  return round2(invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0));
}

// A tender is "open" until it is awarded, lost or cancelled.
export function isOpenTender(t: Tender): boolean {
  if (t.stage === 'Awarded' || t.stage === 'Lost' || t.stage === 'Cancelled') return false;
  if (t.awardStatus === 'Won' || t.awardStatus === 'Lost' || t.awardStatus === 'Cancelled') return false;
  return true;
}

// EMD money still held by the buyer (not yet refunded, released or forfeited).
export function isEmdLocked(r: EmdPbgRecord): boolean {
  return r.category === 'EMD' && (r.status === 'Active' || r.status === 'Expiring Soon' || r.status === 'Refund Requested');
}

export function isPbgLive(r: EmdPbgRecord): boolean {
  return r.category === 'PBG' && (r.status === 'Active' || r.status === 'Expiring Soon');
}

export function sumAmount(records: EmdPbgRecord[]): number {
  return round2(records.reduce((acc, r) => acc + (r.amount || 0), 0));
}
