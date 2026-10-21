import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { Dealer } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

export const DealerManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);

  const PAGE_SIZE = 8;

  const loadDealers = async () => {
    const list = await getAllFromStore<Dealer>('dealers');
    setDealers(list);
  };

  useEffect(() => {
    loadDealers();
    const unsub = subscribeToDatabase(() => loadDealers());
    return () => unsub();
  }, []);

  // Metrics
  const totalDealers = dealers.length;
  const activeDealers = dealers.filter((d) => d.status === 'Active').length;
  const totalCreditLimit = dealers.reduce((acc, d) => acc + (d.creditLimit || 0), 0);
  const totalOutstanding = dealers.reduce((acc, d) => acc + (d.outstandingBalance || 0), 0);

  // Extract unique territories
  const uniqueTerritories = Array.from(new Set(dealers.map((d) => d.territory))).filter(Boolean);

  const filteredDealers = dealers.filter((d) => {
    const matchesSearch =
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.dealerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerritory = territoryFilter === 'All' || d.territory === territoryFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesTerritory && matchesStatus;
  });

  const paginatedDealers = filteredDealers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSaveDealer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const dealerData: Dealer = {
      id: editingDealer ? editingDealer.id : 'dealer-' + Date.now(),
      dealerCode: editingDealer ? editingDealer.dealerCode : `DLR-2026-${Math.floor(100 + Math.random() * 900)}`,
      companyName: String(formData.get('companyName') || ''),
      contactPerson: String(formData.get('contactPerson') || ''),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      territory: String(formData.get('territory') || ''),
      gstin: String(formData.get('gstin') || '').toUpperCase(),
      address: String(formData.get('address') || ''),
      products: String(formData.get('products') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      creditLimit: Number(formData.get('creditLimit') || 0),
      outstandingBalance: Number(formData.get('outstandingBalance') || (editingDealer ? editingDealer.outstandingBalance : 0)),
      status: (formData.get('status') as 'Active' | 'Inactive') || 'Active',
      createdAt: editingDealer ? editingDealer.createdAt : new Date().toISOString(),
    };

    await putToStore('dealers', dealerData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Sales',
      action: editingDealer ? 'Update Dealer' : 'Create Dealer',
      details: `${editingDealer ? 'Updated' : 'Enrolled'} authorized dealer ${dealerData.companyName} (${dealerData.dealerCode}) for ${dealerData.territory}`,
    });

    setIsModalOpen(false);
    setEditingDealer(null);
  };

  const handleDeleteDealer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove dealer agreement for ${name}?`)) return;
    await deleteFromStore('dealers', id, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Admin',
      details: `Removed channel dealer ${name}`,
    });
  };

  const handleExportCSV = () => {
    const exportRows = filteredDealers.map((d) => ({
      Dealer_Code: d.dealerCode,
      Company_Name: d.companyName,
      Contact_Person: d.contactPerson,
      Phone: d.phone,
      Email: d.email,
      Territory: d.territory,
      GSTIN: d.gstin,
      Authorized_Products: d.products.join('; '),
      Credit_Limit_INR: d.creditLimit,
      Outstanding_Balance_INR: d.outstandingBalance,
      Credit_Utilization: d.creditLimit > 0 ? `${Math.round((d.outstandingBalance / d.creditLimit) * 100)}%` : '0%',
      Status: d.status,
    }));
    exportToCSV('Authorized_Channel_Dealers_Network', exportRows);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title="Authorized Channel Distribution Network"
        subtitle="Regional medical equipment distributors, territory allocation, credit exposure, and GSTIN records"
      />

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Authorized Channel Dealer Network
            </h2>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Regional B2B Distributors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized regional distributors, territory exclusivity, GST compliance, and wholesale credit lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>

          <PrintButton reportTitle="Authorized_Channel_Dealers_Network" />

          {hasPermission('dealers', 'create') && (
            <button
              onClick={() => {
                setEditingDealer(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Enroll Authorized Dealer
            </button>
          )}
        </div>
      </div>

      {/* Dealer KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Channel Partners</span>
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><Briefcase className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-slate-900">{totalDealers}</h4>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{activeDealers} Active Across States</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Credit Facility</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg"><CreditCard className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-slate-900">{formatINR(totalCreditLimit, true)}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved distributor revolving limit</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Dealer Outstanding Balance</span>
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg"><IndianRupee className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-amber-900">{formatINR(totalOutstanding, true)}</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {totalCreditLimit > 0 ? `${Math.round((totalOutstanding / totalCreditLimit) * 100)}% credit utilized` : '0% utilized'}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Available Headroom</span>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg"><ShieldCheck className="h-4 w-4" /></span>
          </div>
          <h4 className="mt-1 text-2xl font-bold text-emerald-900">{formatINR(Math.max(0, totalCreditLimit - totalOutstanding), true)}</h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">Safe limit for dispatch clearance</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, dealer code, contact, GSTIN..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500">Territory:</span>
            <select
              value={territoryFilter}
              onChange={(e) => {
                setTerritoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="All">All Territories</option>
              {uniqueTerritories.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dealers Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Dealer Code</th>
                <th className="px-4 py-3">Distributor Company</th>
                <th className="px-4 py-3">Assigned Territory</th>
                <th className="px-4 py-3">Key Contact & Phone</th>
                <th className="px-4 py-3">GSTIN Number</th>
                <th className="px-4 py-3">Product Portfolio</th>
                <th className="px-4 py-3">Credit Limit & Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDealers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No authorized dealers found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedDealers.map((d) => {
                  const utilPercent = d.creditLimit > 0 ? Math.min(100, Math.round((d.outstandingBalance / d.creditLimit) * 100)) : 0;
                  const isHighExposure = utilPercent > 70;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {d.dealerCode}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{d.companyName}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{d.address}</p>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="h-3 w-3 text-indigo-500" />
                          {d.territory}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{d.contactPerson}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" /> {d.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <FileCheck2 className="h-3 w-3 text-emerald-600" />
                          {d.gstin}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {d.products.map((p, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 text-[10px] font-medium px-1.5 py-0.2 rounded border border-indigo-100">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium">Limit: {formatINR(d.creditLimit, true)}</span>
                          <span className={`font-bold ${isHighExposure ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatINR(d.outstandingBalance, true)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHighExposure ? 'bg-rose-500' : utilPercent > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 block">{utilPercent}% credit drawn</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={d.status === 'Active' ? 'success' : 'neutral'}>
                          {d.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('dealers', 'edit') && (
                            <button
                              onClick={() => {
                                setEditingDealer(d);
                                setIsModalOpen(true);
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                              title="Edit Dealer Agreement"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasPermission('dealers', 'delete') && (
                            <button
                              onClick={() => handleDeleteDealer(d.id, d.companyName)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                              title="Delete Dealer"
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
          totalItems={filteredDealers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* DEALER MODAL (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDealer(null);
        }}
        title={editingDealer ? `Edit Dealer: ${editingDealer.companyName}` : 'Enroll Authorized Regional Dealer'}
        subtitle="Channel partner distribution contract, territory exclusivity, and financial credit limits"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveDealer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distributor Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                defaultValue={editingDealer?.companyName}
                required
                placeholder="e.g. Apex Medicare Solutions Pvt Ltd"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN Number *
              </label>
              <input
                type="text"
                name="gstin"
                defaultValue={editingDealer?.gstin}
                placeholder="07AAACA2345N1Z5"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Contact Person *
              </label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={editingDealer?.contactPerson}
                required
                placeholder="Sunil Manchanda (Managing Partner)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                name="phone"
                defaultValue={editingDealer?.phone}
                placeholder="+91 98XXX XXXXX"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                name="email"
                defaultValue={editingDealer?.email}
                placeholder="orders@apexmedicare.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Territory / Region *
              </label>
              <input
                type="text"
                name="territory"
                defaultValue={editingDealer?.territory}
                placeholder="e.g. Delhi NCR & Western UP"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit Limit (INR ₹) *
              </label>
              <input
                type="number"
                name="creditLimit"
                defaultValue={editingDealer?.creditLimit || 5000000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Outstanding Balance (INR ₹)
              </label>
              <input
                type="number"
                name="outstandingBalance"
                defaultValue={editingDealer?.outstandingBalance || 0}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Status</label>
              <select
                name="status"
                defaultValue={editingDealer?.status || 'Active'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="Active">Active Authorized Dealer</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Product Lines (comma-separated)
              </label>
              <input
                type="text"
                name="products"
                defaultValue={editingDealer?.products?.join(', ') || 'Ventilators, Patient Monitors, Infusion Pumps, Defibrillators'}
                placeholder="Ventilators, Monitors, Defibrillators"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Office Address
              </label>
              <input
                type="text"
                name="address"
                defaultValue={editingDealer?.address}
                placeholder="302 Vikas Surya Tower, Rohini Sec 9, New Delhi - 110085"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingDealer(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
            >
              {editingDealer ? 'Update Agreement' : 'Enroll Dealer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
