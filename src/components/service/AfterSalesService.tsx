import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Phone, 
  Calendar,
  Building2,
  UserCheck
} from 'lucide-react';
import { ServiceTicket, AmcContract } from '../../types/crm';
import { getAllFromStore, putToStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';

export const AfterSalesService: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { systemConfig } = useSystem();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [activeTab, setActiveTab] = useState<'tickets' | 'amc'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicketForResolution, setSelectedTicketForResolution] = useState<ServiceTicket | null>(null);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const [tList, cList] = await Promise.all([
      getAllFromStore<ServiceTicket>('serviceTickets'),
      getAllFromStore<AmcContract>('amcContracts'),
    ]);
    setTickets(tList);
    setContracts(cList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const openTickets = tickets.filter((t) => t.stage !== 'Resolved' && t.stage !== 'Closed');
  const criticalTickets = tickets.filter((t) => t.priority.includes('Critical') && t.stage !== 'Resolved');

  const filteredTickets = tickets.filter((t) => {
    return (
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSaveTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const ticket: ServiceTicket = {
      id: 'srv-' + Date.now(),
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: String(formData.get('customerName') || ''),
      hospitalName: String(formData.get('hospitalName') || ''),
      contactPhone: String(formData.get('contactPhone') || ''),
      city: String(formData.get('city') || ''),
      productName: String(formData.get('productName') || ''),
      model: String(formData.get('model') || ''),
      serialNumber: String(formData.get('serialNumber') || ''),
      warrantyStatus: formData.get('warrantyStatus') as any,
      complaintDetails: String(formData.get('complaintDetails') || ''),
      priority: formData.get('priority') as any,
      assignedTechnician: String(formData.get('assignedTechnician') || 'Suresh Chauhan (Sr. Engineer)'),
      stage: 'Open',
      dateReported: new Date().toISOString(),
    };

    await putToStore('serviceTickets', ticket, {
      user: currentUser?.name || 'Service Engg',
      role: currentUser?.role || 'Service',
      action: 'Log Service Ticket',
      details: `Created breakdown ticket ${ticket.ticketNumber} for ${ticket.hospitalName} (${ticket.productName} S/N: ${ticket.serialNumber})`,
    });

    setIsTicketModalOpen(false);
  };

  const handleResolveTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTicketForResolution) return;

    const formData = new FormData(e.currentTarget);
    const updated: ServiceTicket = {
      ...selectedTicketForResolution,
      stage: 'Resolved',
      resolvedDate: new Date().toISOString(),
      resolutionNotes: String(formData.get('resolutionNotes') || ''),
    };

    await putToStore('serviceTickets', updated, {
      user: currentUser?.name || 'Service Engg',
      role: currentUser?.role || 'Service',
      action: 'Resolve Ticket',
      details: `Resolved ticket ${updated.ticketNumber}. S/N: ${updated.serialNumber}`,
    });

    setSelectedTicketForResolution(null);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title={
          activeTab === 'tickets'
            ? 'Hospital Breakdown Service Complaints & Resolution Register'
            : 'Annual Maintenance Contracts (AMC/CMC) & Equipment Directory'
        }
        subtitle={`${systemConfig.companyName} • Biomedical Technical Engineering Division`}
      />

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Biomedical After-Sales Service & AMC Maintenance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer breakdowns, ICU emergency engineer dispatch, calibration renewal, and Comprehensive Maintenance Contracts (CMC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            reportTitle={
              activeTab === 'tickets'
                ? 'Breakdown_Service_Tickets'
                : 'AMC_CMC_Contracts_Directory'
            }
          />

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Breakdown Complaints ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('amc')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'amc' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AMC / CMC Contracts ({contracts.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Service Tickets</span>
          <h4 className="mt-1 text-xl font-bold text-slate-900">{openTickets.length} Pending</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Under technician assignment or parts transit</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Critical ICU / OT Calls</span>
          <h4 className="mt-1 text-xl font-bold text-rose-900">{criticalTickets.length} Critical</h4>
          <p className="text-[11px] text-rose-700 mt-0.5">Requires immediate &lt;4 hour response SLA</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Under Warranty / AMC</span>
          <h4 className="mt-1 text-xl font-bold text-emerald-900">
            {contracts.filter((c) => c.status === 'Active').length} Active Contracts
          </h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">Annual preventive visits scheduled</p>
        </div>
      </div>

      {/* TAB 1: SERVICE TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, hospital, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {hasPermission('service', 'create') && (
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Log Hospital Complaint
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Hospital / Client</th>
                  <th className="px-4 py-3">Equipment & Serial #</th>
                  <th className="px-4 py-3">Reported Issue</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Warranty State</th>
                  <th className="px-4 py-3">Assigned Technician</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {t.ticketNumber}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{t.hospitalName}</p>
                      <p className="text-[10px] text-slate-400">{t.city} • {t.contactPhone}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{t.productName}</p>
                      <p className="font-mono text-[10px] text-slate-400">S/N: {t.serialNumber}</p>
                    </td>

                    <td className="px-4 py-3 max-w-xs text-slate-700 line-clamp-2" title={t.complaintDetails}>
                      {t.complaintDetails}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        t.priority.includes('Critical') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700">{t.warrantyStatus}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {t.assignedTechnician}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={t.stage === 'Resolved' || t.stage === 'Closed' ? 'success' : 'warning'}>
                        {t.stage}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {t.stage !== 'Resolved' && t.stage !== 'Closed' && (
                        <button
                          onClick={() => setSelectedTicketForResolution(t)}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: AMC / CMC CONTRACTS */}
      {activeTab === 'amc' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-4 py-3">Contract #</th>
                <th className="px-4 py-3">Hospital Customer</th>
                <th className="px-4 py-3">Equipment & Serial #</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Annual Value</th>
                <th className="px-4 py-3">PM Visits Done / Year</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.contractNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{c.customerName}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{c.productName}</p>
                    <p className="font-mono text-[10px] text-slate-400">S/N: {c.serialNumber}</p>
                  </td>
                  <td className="px-4 py-3">{c.contractType}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatINR(c.contractValue)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{c.visitsCompleted}</span> of {c.preventiveMaintenanceVisitsPerYear} visits
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatDate(c.endDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'Active' ? 'success' : 'warning'}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Log Customer Equipment Complaint"
        subtitle="Dispatch service engineer and trigger SLA tracking"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Customer Name *</label>
              <input
                type="text"
                name="hospitalName"
                placeholder="Safdarjung Hospital Emergency"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                name="contactPhone"
                placeholder="+91 98XXX XXXXX"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
              <input
                type="text"
                name="city"
                defaultValue="New Delhi"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                name="productName"
                defaultValue="B-Vent Pro 5000 ICU Ventilator"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                name="serialNumber"
                placeholder="BV5K-26101"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Status</label>
              <select
                name="warrantyStatus"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Under Warranty">Under Warranty (Free Service)</option>
                <option value="Under AMC/CMC">Under AMC/CMC Contract</option>
                <option value="Out of Warranty">Out of Warranty (Chargeable)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level *</label>
              <select
                name="priority"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Critical (ICU/OT)">Critical (ICU / OT Machine Down)</option>
                <option value="High">High (Ward Patient Monitor)</option>
                <option value="Medium">Medium (Routine check / Spares)</option>
                <option value="Low">Low (Scheduled maintenance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Service Engineer</label>
              <input
                type="text"
                name="assignedTechnician"
                defaultValue="Suresh Chauhan (Sr. Engineer)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Complaint Symptoms / Doctor Report *</label>
              <textarea
                name="complaintDetails"
                rows={2}
                required
                placeholder="Describe error code, sensor issue, power supply symptoms..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(false)}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Register & Dispatch Engineer
            </button>
          </div>
        </form>
      </Modal>

      {/* RESOLVE TICKET MODAL */}
      <Modal
        isOpen={!!selectedTicketForResolution}
        onClose={() => setSelectedTicketForResolution(null)}
        title="Resolve Service Ticket"
        subtitle={`Ticket: ${selectedTicketForResolution?.ticketNumber} • ${selectedTicketForResolution?.hospitalName}`}
        maxWidth="md"
      >
        <form onSubmit={handleResolveTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Action Taken & Spares Replaced *</label>
            <textarea
              name="resolutionNotes"
              rows={3}
              required
              placeholder="e.g. Replaced O2 sensor membrane kit. Performed pressure calibration with VT650 analyzer. Doctor signed satisfactory report."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setSelectedTicketForResolution(null)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Mark Ticket as Resolved
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
