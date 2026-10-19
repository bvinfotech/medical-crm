import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Building2, 
  FileText, 
  Edit, 
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { EmdPbgRecord, InstrumentType, EmdPbgCategory, EmdPbgStatus } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

const INSTRUMENT_TYPES: InstrumentType[] = [
  'Bank Guarantee',
  'Fixed Deposit Receipt',
  'Demand Draft',
  'GeM e-PBG',
  'Online Transfer',
];

const STATUS_OPTIONS: EmdPbgStatus[] = [
  'Active',
  'Expiring Soon',
  'Refund Requested',
  'Refunded',
  'Released',
  'Forfeited',
];

export const EmdPbgTracker: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [records, setRecords] = useState<EmdPbgRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'EMD' | 'PBG'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmdPbgRecord | null>(null);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const list = await getAllFromStore<EmdPbgRecord>('emdPbg');
    setRecords(list);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const now = new Date();

  // Metrics
  const totalEmdAmount = records
    .filter((r) => r.category === 'EMD' && r.status !== 'Refunded')
    .reduce((acc, r) => acc + r.amount, 0);

  const totalPbgAmount = records
    .filter((r) => r.category === 'PBG' && r.status === 'Active')
    .reduce((acc, r) => acc + r.amount, 0);

  const pendingRefunds = records.filter(
    (r) => r.category === 'EMD' && (r.status === 'Refund Requested' || r.status === 'Expiring Soon')
  );

  const expiringGuarantees = records.filter((r) => {
    if (r.status === 'Refunded' || r.status === 'Released') return false;
    const exp = new Date(r.expiryDate);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 30;
  });

  const filteredRecords = records.filter((r) => {
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch =
      r.tenderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.instrumentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSaveRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const recordData: EmdPbgRecord = {
      id: editingRecord ? editingRecord.id : 'ep-' + Date.now(),
      category: formData.get('category') as EmdPbgCategory,
      tenderReference: String(formData.get('tenderReference') || ''),
      tenderTitle: String(formData.get('tenderTitle') || ''),
      beneficiary: String(formData.get('beneficiary') || ''),
      instrumentType: formData.get('instrumentType') as InstrumentType,
      amount: Number(formData.get('amount') || 0),
      bankName: String(formData.get('bankName') || ''),
      branch: String(formData.get('branch') || ''),
      instrumentNumber: String(formData.get('instrumentNumber') || ''),
      issueDate: String(formData.get('issueDate') || ''),
      expiryDate: String(formData.get('expiryDate') || ''),
      claimExpiryDate: String(formData.get('claimExpiryDate') || ''),
      refundRequestedDate: String(formData.get('refundRequestedDate') || ''),
      refundReceivedDate: String(formData.get('refundReceivedDate') || ''),
      status: formData.get('status') as EmdPbgStatus,
      remarks: String(formData.get('remarks') || ''),
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    await putToStore('emdPbg', recordData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Accounts',
      action: editingRecord ? 'Update EMD/PBG' : 'Create EMD/PBG',
      details: `${editingRecord ? 'Updated' : 'Logged'} ${recordData.category} (${recordData.instrumentType}) of ${formatINR(recordData.amount)} for ${recordData.beneficiary}`,
    });

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = async (id: string, num: string) => {
    if (!confirm(`Delete record ${num}?`)) return;
    await deleteFromStore('emdPbg', id, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Admin',
      details: `Deleted instrument record ${num}`,
    });
  };

  const handleExportCSV = () => {
    const rows = filteredRecords.map((r) => ({
      Category: r.category,
      Tender_Ref: r.tenderReference,
      Beneficiary: r.beneficiary,
      Type: r.instrumentType,
      Amount_INR: r.amount,
      Bank: r.bankName,
      Instrument_No: r.instrumentNumber,
      Issue_Date: r.issueDate,
      Expiry_Date: r.expiryDate,
      Refund_Requested: r.refundRequestedDate || 'N/A',
      Status: r.status,
    }));
    exportToCSV('EMD_PBG_Guarantees_Ledger', rows);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title="EMD & Performance Bank Guarantee (PBG) Tracker"
        subtitle="Earnest money deposits, bank guarantees, expiry milestones, and hospital refund follow-ups"
      />

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            EMD & Performance Bank Guarantee (PBG) Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor tender earnest money deposits, bank guarantees, claim expiry dates, and hospital refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export Ledger
          </button>

          <PrintButton reportTitle="EMD_PBG_Guarantees_Ledger" />

          {hasPermission('emd-pbg', 'create') && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Log EMD / PBG Instrument
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active EMD Capital Blocked
          </span>
          <h4 className="mt-1 text-xl font-bold text-slate-900">{formatINR(totalEmdAmount, true)}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">In public tender bids</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Active PBG Guarantees
          </span>
          <h4 className="mt-1 text-xl font-bold text-blue-700">{formatINR(totalPbgAmount, true)}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Warranty & performance security</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Pending EMD Refunds
          </span>
          <h4 className="mt-1 text-xl font-bold text-amber-900">{pendingRefunds.length} Records</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">Urgent hospital follow-ups required</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Expiring in 30 Days
          </span>
          <h4 className="mt-1 text-xl font-bold text-rose-900">{expiringGuarantees.length} Instruments</h4>
          <p className="text-[11px] text-rose-700 mt-0.5">Action before claim period lapses</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tender ref, hospital, bank, BG no..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
            {(['All', 'EMD', 'PBG'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setCurrentPage(1);
                }}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  categoryFilter === cat ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'All' ? 'All Types' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Tender Ref & Hospital</th>
                <th className="px-4 py-3">Instrument Type</th>
                <th className="px-4 py-3">Bank & Instrument #</th>
                <th className="px-4 py-3">Amount (INR)</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No EMD or PBG records matching current filter.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const expDate = new Date(record.expiryDate);
                  const isExpiringSoon = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30 && record.status !== 'Refunded';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          record.category === 'EMD' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {record.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{record.tenderReference}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{record.beneficiary}</p>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {record.instrumentType}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{record.bankName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{record.instrumentNumber}</p>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(record.amount)}
                      </td>

                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {formatDate(record.issueDate)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isExpiringSoon ? 'font-bold text-rose-600' : 'text-slate-700'}>
                          {formatDate(record.expiryDate)}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('emd-pbg', 'edit') && (
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setIsModalOpen(true);
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                              title="Edit Record"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasPermission('emd-pbg', 'delete') && (
                            <button
                              onClick={() => handleDeleteRecord(record.id, record.instrumentNumber)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredRecords.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* CREATE / EDIT EMD & PBG MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? 'Edit EMD / PBG Instrument' : 'Log EMD / PBG Security Deposit'}
        subtitle="Record bank guarantee issuance, claim deadlines, and refund requests"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument Category *
              </label>
              <select
                name="category"
                defaultValue={editingRecord?.category || 'EMD'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="EMD">Earnest Money Deposit (EMD)</option>
                <option value="PBG">Performance Bank Guarantee (PBG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument Type *
              </label>
              <select
                name="instrumentType"
                defaultValue={editingRecord?.instrumentType || 'Bank Guarantee'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                {INSTRUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deposit Amount (INR ₹) *
              </label>
              <input
                type="number"
                name="amount"
                defaultValue={editingRecord?.amount || 250000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Reference / Bid Number *
              </label>
              <input
                type="text"
                name="tenderReference"
                defaultValue={editingRecord?.tenderReference}
                required
                placeholder="e.g. GEM/2026/B/8940122"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issuing Bank Name *
              </label>
              <input
                type="text"
                name="bankName"
                defaultValue={editingRecord?.bankName || 'State Bank of India'}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiary Name (Hospital / Dept) *
              </label>
              <input
                type="text"
                name="beneficiary"
                defaultValue={editingRecord?.beneficiary}
                required
                placeholder="e.g. Director, All India Institute of Medical Sciences"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Branch
              </label>
              <input
                type="text"
                name="branch"
                defaultValue={editingRecord?.branch || 'CAG Branch, New Delhi'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument / BG / DD Number *
              </label>
              <input
                type="text"
                name="instrumentNumber"
                defaultValue={editingRecord?.instrumentNumber}
                required
                placeholder="e.g. BG-SBI-2026-99018"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Issue *
              </label>
              <input
                type="date"
                name="issueDate"
                defaultValue={editingRecord?.issueDate || new Date().toISOString().slice(0, 10)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                defaultValue={editingRecord?.expiryDate || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Claim Expiry Date (BG Grace Period)
              </label>
              <input
                type="date"
                name="claimExpiryDate"
                defaultValue={editingRecord?.claimExpiryDate}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Status *
              </label>
              <select
                name="status"
                defaultValue={editingRecord?.status || 'Active'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Requested Date
              </label>
              <input
                type="date"
                name="refundRequestedDate"
                defaultValue={editingRecord?.refundRequestedDate}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Received Date
              </label>
              <input
                type="date"
                name="refundReceivedDate"
                defaultValue={editingRecord?.refundReceivedDate}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks / Follow-Up History
              </label>
              <textarea
                name="remarks"
                rows={2}
                defaultValue={editingRecord?.remarks}
                placeholder="Bank confirmation copy, refund follow-up letter dispatched, hospital store ack..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRecord(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingRecord ? 'Update Instrument' : 'Save Instrument'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
