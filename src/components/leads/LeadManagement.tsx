import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Calendar, 
  Phone, 
  Mail, 
  IndianRupee,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  Tag
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

const STAGES: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Quotation Sent',
  'Negotiation',
  'Won',
  'Lost',
];

const SOURCES = [
  'All',
  'GeM',
  'Hospital Visit',
  'Dealer Referral',
  'Direct Tender',
  'Website',
  'Exhibition',
] as const;

export const LeadManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<string>('All');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('All');
  const [leadPage, setLeadPage] = useState(1);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const l = await getAllFromStore<Lead>('leads');
    setLeads(l);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  // Real KPI calculations
  const totalLeads = leads.length;
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.expectedValue || 0), 0);
  const activeNegotiations = leads.filter((l) => l.status === 'Negotiation' || l.status === 'Quotation Sent').length;
  const wonOrdersValue = leads
    .filter((l) => l.status === 'Won')
    .reduce((acc, l) => acc + (l.expectedValue || 0), 0);

  const now = new Date();

  // Filtered Leads
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.companyName.toLowerCase().includes(leadSearch.toLowerCase()) ||
      item.contactPerson.toLowerCase().includes(leadSearch.toLowerCase()) ||
      item.leadCode.toLowerCase().includes(leadSearch.toLowerCase()) ||
      item.city.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesStage = leadStageFilter === 'All' || item.status === leadStageFilter;
    const matchesSource = leadSourceFilter === 'All' || item.source === leadSourceFilter;
    return matchesSearch && matchesStage && matchesSource;
  });

  const paginatedLeads = filteredLeads.slice(
    (leadPage - 1) * PAGE_SIZE,
    leadPage * PAGE_SIZE
  );

  // Handle Save Lead
  const handleSaveLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const leadData: Lead = {
      id: editingLead ? editingLead.id : 'lead-' + Date.now(),
      leadCode: editingLead ? editingLead.leadCode : `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      companyName: String(formData.get('companyName') || ''),
      contactPerson: String(formData.get('contactPerson') || ''),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      address: String(formData.get('address') || ''),
      city: String(formData.get('city') || ''),
      state: String(formData.get('state') || ''),
      source: formData.get('source') as any,
      productInterest: String(formData.get('productInterest') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assignedEmployee: String(formData.get('assignedEmployee') || ''),
      expectedValue: Number(formData.get('expectedValue') || 0),
      nextFollowUpDate: String(formData.get('nextFollowUpDate') || ''),
      status: formData.get('status') as LeadStatus,
      notes: String(formData.get('notes') || ''),
      createdAt: editingLead ? editingLead.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore('leads', leadData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Sales',
      action: editingLead ? 'Update Lead' : 'Create Lead',
      details: `${editingLead ? 'Updated' : 'Added'} lead ${leadData.companyName} (${leadData.leadCode})`,
    });

    setIsLeadModalOpen(false);
    setEditingLead(null);
  };

  // Handle Delete Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead for ${name}?`)) return;
    await deleteFromStore('leads', id, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Admin',
      details: `Deleted lead ${name}`,
    });
  };

  // Export Leads to CSV
  const handleExportLeads = () => {
    const exportRows = filteredLeads.map((l) => ({
      Lead_ID: l.leadCode,
      Hospital_Institution: l.companyName,
      Contact_Person: l.contactPerson,
      Phone: l.phone,
      Email: l.email,
      Location: `${l.city}, ${l.state}`,
      Source: l.source,
      Interested_Equipment: l.productInterest.join('; '),
      Expected_Value_INR: l.expectedValue,
      Stage: l.status,
      Next_FollowUp: l.nextFollowUpDate,
      Assigned_Officer: l.assignedEmployee,
    }));
    exportToCSV('Medical_Equipment_Hospital_Leads', exportRows);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title="Hospital Medical Equipment Leads & Inquiries Register"
        subtitle="Institutional buyer pipeline, equipment interest, expected deal values, and scheduled follow-ups"
      />

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Hospital Leads & Institutional Inquiries
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              હોસ્પિટલ ઇન્ક્વાયરી પાઇપલાઇન (Direct Hospital Orders)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track direct hospital inquiries, doctor consultations, quotation stages, and commercial deal values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLeads}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>

          <PrintButton reportTitle="Hospital_Medical_Equipment_Leads" />

          {hasPermission('leads', 'create') && (
            <button
              onClick={() => {
                setEditingLead(null);
                setIsLeadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Hospital Lead
            </button>
          )}
        </div>
      </div>

      {/* Lead Pipeline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Active Leads</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Users className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-slate-900">{totalLeads}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Healthcare institutions</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pipeline Deal Value</span>
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><TrendingUp className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-slate-900">{formatINR(totalPipelineValue, true)}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Cumulative expected pipeline</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Quotes & Negotiations</span>
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg"><Clock className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-amber-900">{activeNegotiations} Deals</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">High probability closing</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Won Hospital Orders</span>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg"><CheckCircle className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-emerald-900">{formatINR(wonOrdersValue, true)}</h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">Converted into purchase contracts</p>
        </div>
      </div>

      {/* Controls: Search, Stage Filter, Source Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospital, contact, lead ID, city..."
            value={leadSearch}
            onChange={(e) => {
              setLeadSearch(e.target.value);
              setLeadPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500">Stage:</span>
            <select
              value={leadStageFilter}
              onChange={(e) => {
                setLeadStageFilter(e.target.value);
                setLeadPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              <option value="All">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Source:</span>
            <select
              value={leadSourceFilter}
              onChange={(e) => {
                setLeadSourceFilter(e.target.value);
                setLeadPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
            >
              {SOURCES.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Lead ID</th>
                <th className="px-4 py-3">Hospital / Institution</th>
                <th className="px-4 py-3">Key Contact</th>
                <th className="px-4 py-3">Equipment Interest</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Expected Deal Value</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Next Follow-Up</th>
                <th className="px-4 py-3">Assigned Lead</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    No hospital leads found matching current search and filters.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((item) => {
                  const followUp = new Date(item.nextFollowUpDate);
                  const isDueSoon = (followUp.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 3 && item.status !== 'Won' && item.status !== 'Lost';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {item.leadCode}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{item.companyName}</p>
                        <p className="text-[11px] text-slate-400">{item.city}, {item.state}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{item.contactPerson}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.phone}</p>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.productInterest.map((prod, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.2 rounded border border-blue-100">
                              {prod}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {item.source}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(item.expectedValue)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3 w-3 ${isDueSoon ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className={isDueSoon ? 'font-bold text-amber-700' : 'text-slate-700'}>
                            {formatDate(item.nextFollowUpDate)}
                          </span>
                        </div>
                        {isDueSoon && <span className="text-[9px] text-amber-700 font-bold block mt-0.5">Due Soon</span>}
                      </td>

                      <td className="px-4 py-3 text-[11px] text-slate-700 whitespace-nowrap">
                        {item.assignedEmployee}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('leads', 'edit') && (
                            <button
                              onClick={() => {
                                setEditingLead(item);
                                setIsLeadModalOpen(true);
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="Edit Lead"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasPermission('leads', 'delete') && (
                            <button
                              onClick={() => handleDeleteLead(item.id, item.companyName)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                              title="Delete Lead"
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
          currentPage={leadPage}
          totalItems={filteredLeads.length}
          pageSize={PAGE_SIZE}
          onPageChange={setLeadPage}
        />
      </div>

      {/* LEAD MODAL (Create / Edit) */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
        }}
        title={editingLead ? `Edit Lead: ${editingLead.companyName}` : 'Register New Hospital Inquiry'}
        subtitle="Record institutional healthcare buyer requirements, budget, and follow-ups"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Institution Name *
              </label>
              <input
                type="text"
                name="companyName"
                defaultValue={editingLead?.companyName}
                placeholder="e.g. AIIMS Rishikesh / Apollo Hospitals"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Key Contact Person & Designation *
              </label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={editingLead?.contactPerson}
                placeholder="e.g. Dr. Rajesh Kumar (HOD CCU)"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={editingLead?.phone}
                placeholder="+91 98XXX XXXXX"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={editingLead?.email}
                placeholder="procurement@hospital.org"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                defaultValue={editingLead?.city}
                placeholder="e.g. New Delhi"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                defaultValue={editingLead?.state}
                placeholder="e.g. Delhi NCR"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                name="source"
                defaultValue={editingLead?.source || 'GeM'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="GeM">GeM Portal</option>
                <option value="Hospital Visit">Hospital Visit / Doctor Meeting</option>
                <option value="Dealer Referral">Dealer Referral</option>
                <option value="Direct Tender">Direct Government Tender</option>
                <option value="Exhibition">Medical Fair / Exhibition</option>
                <option value="Website">Website Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
              <select
                name="status"
                defaultValue={editingLead?.status || 'New'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Deal Value (INR ₹) *
              </label>
              <input
                type="number"
                name="expectedValue"
                defaultValue={editingLead?.expectedValue || 1500000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-Up Date *
              </label>
              <input
                type="date"
                name="nextFollowUpDate"
                defaultValue={editingLead?.nextFollowUpDate || new Date().toISOString().slice(0, 10)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Interest (comma-separated)
              </label>
              <input
                type="text"
                name="productInterest"
                defaultValue={editingLead?.productInterest?.join(', ') || 'B-Vent Pro 5000 ICU Ventilator, CardioPulse Monitor'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Sales Executive
              </label>
              <input
                type="text"
                name="assignedEmployee"
                defaultValue={editingLead?.assignedEmployee || currentUser?.name || 'Amitabh Sen'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Activity History
              </label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={editingLead?.notes}
                placeholder="Doctor preferences, CCU bed capacity, demonstration date..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsLeadModalOpen(false);
                setEditingLead(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingLead ? 'Update Lead' : 'Save Hospital Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
