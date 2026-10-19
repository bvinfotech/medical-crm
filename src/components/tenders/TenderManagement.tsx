import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  Clock, 
  Paperclip, 
  AlertCircle, 
  Info,
  CheckCircle2,
  ExternalLink,
  Building2,
  FileText
} from 'lucide-react';
import { Tender, TenderStage, TenderDocument } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, formatDateTime, exportToCSV } from '../../utils/formatters';

const TENDER_STAGES: TenderStage[] = [
  'Identified',
  'Under Review',
  'Documents Pending',
  'Bid Submitted',
  'Technical Qualified',
  'Financial Evaluation',
  'L1',
  'Awarded',
  'Lost',
  'Cancelled',
];

export const TenderManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [portalFilter, setPortalFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [selectedDocTender, setSelectedDocTender] = useState<Tender | null>(null);

  // New doc form states for checklist modal
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<TenderDocument['category']>('Technical Bid');

  const PAGE_SIZE = 8;

  const loadTenders = async () => {
    const list = await getAllFromStore<Tender>('tenders');
    setTenders(list);
  };

  useEffect(() => {
    loadTenders();
    const unsub = subscribeToDatabase(() => loadTenders());
    return () => unsub();
  }, []);

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch =
      t.tenderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.governmentDepartment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'All' || t.stage === stageFilter;
    const matchesPortal = portalFilter === 'All' || t.portalName === portalFilter;
    return matchesSearch && matchesStage && matchesPortal;
  });

  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSaveTender = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const tenderData: Tender = {
      id: editingTender ? editingTender.id : 'tender-' + Date.now(),
      tenderNumber: String(formData.get('tenderNumber') || ''),
      tenderTitle: String(formData.get('tenderTitle') || ''),
      governmentDepartment: String(formData.get('governmentDepartment') || ''),
      buyerName: String(formData.get('buyerName') || ''),
      portalName: formData.get('portalName') as any,
      gemReference: String(formData.get('gemReference') || ''),
      publicationDate: String(formData.get('publicationDate') || ''),
      submissionDeadline: String(formData.get('submissionDeadline') || ''),
      estimatedValue: Number(formData.get('estimatedValue') || 0),
      emdAmount: Number(formData.get('emdAmount') || 0),
      tenderFee: Number(formData.get('tenderFee') || 0),
      stage: formData.get('stage') as TenderStage,
      technicalBidStatus: formData.get('technicalBidStatus') as any,
      financialBidStatus: formData.get('financialBidStatus') as any,
      l1Status: formData.get('l1Status') as any,
      awardStatus: formData.get('awardStatus') as any,
      purchaseOrderNumber: String(formData.get('purchaseOrderNumber') || ''),
      assignedEmployee: String(formData.get('assignedEmployee') || currentUser?.name || 'Rahul Kapoor'),
      notes: String(formData.get('notes') || ''),
      documents: editingTender ? editingTender.documents : [
        { id: 'doc-auto-1', title: 'Technical Compliance Sheet', category: 'Technical Bid', fileName: 'Compliance_Draft.pdf', status: 'Pending' },
        { id: 'doc-auto-2', title: 'Make In India (MII) Local Content Certificate', category: 'Compliance Matrix', fileName: 'MII_Declaration.pdf', status: 'Pending' }
      ],
      createdAt: editingTender ? editingTender.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore('tenders', tenderData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Tender Manager',
      action: editingTender ? 'Update Tender' : 'Create Tender',
      details: `${editingTender ? 'Updated' : 'Created'} tender ${tenderData.tenderNumber} (${tenderData.governmentDepartment})`,
    });

    setIsModalOpen(false);
    setEditingTender(null);
  };

  const handleDeleteTender = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to delete tender ${num}?`)) return;
    await deleteFromStore('tenders', id, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Admin',
      details: `Deleted tender record ${num}`,
    });
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocTender || !docTitle) return;

    const newDoc: TenderDocument = {
      id: 'doc-' + Date.now(),
      title: docTitle,
      category: docCategory,
      fileName: `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      status: 'Uploaded',
      uploadedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = {
      ...selectedDocTender,
      documents: [...(selectedDocTender.documents || []), newDoc],
      updatedAt: new Date().toISOString(),
    };

    await putToStore('tenders', updated, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Tender Manager',
      action: 'Document Upload',
      details: `Added document ${docTitle} to tender ${updated.tenderNumber}`,
    });

    setSelectedDocTender(updated);
    setDocTitle('');
  };

  const handleExportCSV = () => {
    const rows = filteredTenders.map((t) => ({
      Tender_Number: t.tenderNumber,
      Department: t.governmentDepartment,
      Title: t.tenderTitle,
      Portal: t.portalName,
      Deadline: t.submissionDeadline,
      Estimated_Value_INR: t.estimatedValue,
      EMD_INR: t.emdAmount,
      Stage: t.stage,
      Tech_Status: t.technicalBidStatus,
      L1_Status: t.l1Status,
      Award: t.awardStatus,
      Assigned_Officer: t.assignedEmployee,
    }));
    exportToCSV('Government_Tenders_Summary', rows);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title="Government Tender & GeM Bids Register"
        subtitle="Institutional hospital bids, technical qualifications, L1 evaluations, and awards"
      />

      {/* GeM Integration Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-2xs">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold">Government e-Marketplace (GeM) & CPPP Integration Notice:</span> Direct automated API synchronization with GeM / CPPP portal servers is pending official government API client keys. Current bids, technical compliance, and EMD documents are actively tracked and validated through this internal company register.
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Government Tender & GeM Bids Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track public hospital tenders, technical qualifications, L1 bid comparisons, and contract awards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export Tenders
          </button>

          <PrintButton reportTitle="Government_Tenders_Register" />

          {hasPermission('tenders', 'create') && (
            <button
              onClick={() => {
                setEditingTender(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Register Tender Bid
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tender number, hospital, or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              <option value="All">All Stages</option>
              {TENDER_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Portal:</span>
            <select
              value={portalFilter}
              onChange={(e) => {
                setPortalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              <option value="All">All Portals</option>
              <option value="GeM">GeM</option>
              <option value="CPPP">CPPP</option>
              <option value="State e-Procurement">State e-Procurement</option>
              <option value="Defence/MES">Defence / MES</option>
              <option value="Railways">Railways</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenders Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tender Ref & Portal</th>
                <th className="px-4 py-3">Hospital / Dept</th>
                <th className="px-4 py-3">Tender Title</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Estimated Value</th>
                <th className="px-4 py-3">EMD Amount</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">L1 / Award</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTenders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    No tenders found matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedTenders.map((tender) => {
                  const deadline = new Date(tender.submissionDeadline);
                  const isUpcoming = deadline.getTime() > Date.now();
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 3600 * 24));

                  return (
                    <tr key={tender.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{tender.tenderNumber}</p>
                        <span className="inline-block mt-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                          {tender.portalName}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 line-clamp-1">{tender.governmentDepartment}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{tender.buyerName}</p>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 line-clamp-2" title={tender.tenderTitle}>
                          {tender.tenderTitle}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3 w-3 ${isUpcoming && daysLeft <= 7 ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={isUpcoming && daysLeft <= 7 ? 'font-bold text-rose-600' : 'text-slate-700'}>
                            {formatDateTime(tender.submissionDeadline)}
                          </span>
                        </div>
                        {isUpcoming && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ({daysLeft} days remaining)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(tender.estimatedValue)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-amber-800 whitespace-nowrap">
                        {formatINR(tender.emdAmount)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(tender.stage)}>
                          {tender.stage}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {tender.awardStatus === 'Won' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Won (L1)
                          </span>
                        ) : tender.l1Status === 'Yes' ? (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            L1 Confirmed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {tender.awardStatus || 'Awaited'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDocTender(tender)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {tender.documents?.length || 0} Docs
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('tenders', 'edit') && (
                            <button
                              onClick={() => {
                                setEditingTender(tender);
                                setIsModalOpen(true);
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                              title="Edit Tender"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasPermission('tenders', 'delete') && (
                            <button
                              onClick={() => handleDeleteTender(tender.id, tender.tenderNumber)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                              title="Delete Tender"
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
          totalItems={filteredTenders.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* CREATE / EDIT TENDER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTender(null);
        }}
        title={editingTender ? 'Edit Government Tender Record' : 'Register New Government Tender'}
        subtitle="Record complete bid specifications, EMD security requirements, and deadlines"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveTender} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Number / GeM Bid No. *
              </label>
              <input
                type="text"
                name="tenderNumber"
                defaultValue={editingTender?.tenderNumber}
                required
                placeholder="GEM/2026/B/8940122"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Government Portal *
              </label>
              <select
                name="portalName"
                defaultValue={editingTender?.portalName || 'GeM'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="GeM">GeM (Government e-Marketplace)</option>
                <option value="CPPP">CPPP (Central Public Procurement Portal)</option>
                <option value="State e-Procurement">State e-Procurement Portal</option>
                <option value="Defence/MES">Defence / Military Engineer Services</option>
                <option value="Railways">Indian Railways e-Procurement (IREPS)</option>
                <option value="Other">Other Institutional Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GeM / NIT Reference
              </label>
              <input
                type="text"
                name="gemReference"
                defaultValue={editingTender?.gemReference}
                placeholder="GEM-2026-ICU-VENT"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Title / Equipment Description *
              </label>
              <input
                type="text"
                name="tenderTitle"
                defaultValue={editingTender?.tenderTitle}
                required
                placeholder="Supply, Installation & Commissioning of ICU Ventilators..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Government Department / Hospital *
              </label>
              <input
                type="text"
                name="governmentDepartment"
                defaultValue={editingTender?.governmentDepartment}
                required
                placeholder="All India Institute of Medical Sciences (AIIMS)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer / Officer Designation
              </label>
              <input
                type="text"
                name="buyerName"
                defaultValue={editingTender?.buyerName}
                placeholder="Senior Stores Officer (Hospital)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Date
              </label>
              <input
                type="date"
                name="publicationDate"
                defaultValue={editingTender?.publicationDate || new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Submission Deadline *
              </label>
              <input
                type="datetime-local"
                name="submissionDeadline"
                defaultValue={editingTender?.submissionDeadline || '2026-10-31T15:00'}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Value (INR ₹) *
              </label>
              <input
                type="number"
                name="estimatedValue"
                defaultValue={editingTender?.estimatedValue || 5000000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMD Amount (INR ₹)
              </label>
              <input
                type="number"
                name="emdAmount"
                defaultValue={editingTender?.emdAmount || 100000}
                placeholder="2% of tender value"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Fee (INR ₹)
              </label>
              <input
                type="number"
                name="tenderFee"
                defaultValue={editingTender?.tenderFee || 0}
                placeholder="0 if GeM exempt"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stage</label>
              <select
                name="stage"
                defaultValue={editingTender?.stage || 'Identified'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                {TENDER_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Bid Status</label>
              <select
                name="technicalBidStatus"
                defaultValue={editingTender?.technicalBidStatus || 'Pending'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Pending">Pending Evaluation</option>
                <option value="Compliant">Technically Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Disqualified">Disqualified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Bid Status</label>
              <select
                name="financialBidStatus"
                defaultValue={editingTender?.financialBidStatus || 'Pending'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Pending">Pending Financial Opening</option>
                <option value="Opened">Financial Bid Opened</option>
                <option value="Under Review">Under Price Evaluation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">L1 Position</label>
              <select
                name="l1Status"
                defaultValue={editingTender?.l1Status || 'Awaited'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Awaited">Awaited</option>
                <option value="Yes">Yes (L1 Lowest Bidder)</option>
                <option value="No">No (L2 or higher)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Final Award Status</label>
              <select
                name="awardStatus"
                defaultValue={editingTender?.awardStatus || 'Awaited'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Awaited">Awaited</option>
                <option value="Won">Awarded / Won</option>
                <option value="Lost">Lost</option>
                <option value="Cancelled">Cancelled / Retendered</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Order / Contract No.
              </label>
              <input
                type="text"
                name="purchaseOrderNumber"
                defaultValue={editingTender?.purchaseOrderNumber}
                placeholder="PO-2026-XXXX (if awarded)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Tender Manager
              </label>
              <input
                type="text"
                name="assignedEmployee"
                defaultValue={editingTender?.assignedEmployee || currentUser?.name || 'Rahul Kapoor'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bid Notes, Pre-Bid Meeting Clarifications & Criteria
              </label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editingTender?.notes}
                placeholder="Required certificates (ISO 13485, CE, CDSCO), warranty requirements, delivery schedule..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTender(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingTender ? 'Update Tender' : 'Register Tender'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT CHECKLIST MODAL */}
      <Modal
        isOpen={!!selectedDocTender}
        onClose={() => setSelectedDocTender(null)}
        title={`Bid Document Checklist: ${selectedDocTender?.tenderNumber}`}
        subtitle={`${selectedDocTender?.governmentDepartment}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Add doc form */}
          <form onSubmit={handleAddDocument} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <input
              type="text"
              placeholder="Document name (e.g. Turn-over Certificate, EMD BG copy)"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
              required
            />
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              <option value="Technical Bid">Technical Bid</option>
              <option value="Financial Bid">Financial Bid</option>
              <option value="EMD Receipt">EMD Receipt / BG</option>
              <option value="Compliance Matrix">Compliance Matrix</option>
              <option value="Authorization">Manufacturer Auth</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shrink-0"
            >
              Attach Document
            </button>
          </form>

          {/* Document List */}
          <div className="space-y-2">
            {!selectedDocTender?.documents || selectedDocTender.documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No documents recorded for this bid.</p>
            ) : (
              selectedDocTender.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {doc.fileName} • Category: <span className="font-semibold text-slate-600">{doc.category}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={() => setSelectedDocTender(null)}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
