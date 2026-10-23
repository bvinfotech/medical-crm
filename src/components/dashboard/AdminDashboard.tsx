import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileCheck2, 
  ShieldAlert, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Briefcase,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  Lead, Dealer, Tender, EmdPbgRecord, Product, Invoice, AuditLog 
} from '../../types/crm';
import { getAllFromStore, subscribeToDatabase } from '../../services/db';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { formatINR, formatDate } from '../../utils/formatters';
import { round2, isOpenTender, isEmdLocked, isPbgLive, sumAmount, totalReceivables } from '../../utils/finance';
import { ActiveTab } from '../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';

interface AdminDashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const { systemConfig } = useSystem();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [emdPbg, setEmdPbg] = useState<EmdPbgRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [l, d, t, ep, p, inv, logs] = await Promise.all([
        getAllFromStore<Lead>('leads'),
        getAllFromStore<Dealer>('dealers'),
        getAllFromStore<Tender>('tenders'),
        getAllFromStore<EmdPbgRecord>('emdPbg'),
        getAllFromStore<Product>('products'),
        getAllFromStore<Invoice>('invoices'),
        getAllFromStore<AuditLog>('auditLogs'),
      ]);

      setLeads(l);
      setDealers(d);
      setTenders(t);
      setEmdPbg(ep);
      setProducts(p);
      setInvoices(inv);
      setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(() => loadData());
    return () => unsubscribe();
  }, []);

  // Real calculations
  const totalLeads = leads.length;
  const activeDealers = dealers.filter((d) => d.status === 'Active').length;
  const openTenders = tenders.filter(isOpenTender);
  const totalTenders = openTenders.length;
  const openPipelineValue = round2(openTenders.reduce((acc, t) => acc + (t.estimatedValue || 0), 0));

  // Upcoming deadlines (within next 14 days, open tenders only)
  const now = new Date();
  const upcomingTenders = openTenders.filter((t) => {
    const deadline = new Date(t.submissionDeadline);
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 14;
  });

  const wonTenders = tenders.filter((t) => t.stage === 'Awarded' || t.awardStatus === 'Won').length;
  const lostTenders = tenders.filter((t) => t.stage === 'Lost' || t.awardStatus === 'Lost').length;

  // Inventory value & low stock
  const totalInventoryValue = round2(products.reduce((acc, p) => acc + (p.quantity || 0) * (p.purchaseCost || 0), 0));
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStockLevel);

  // EMD & PBG tracking
  const pendingEmdRefunds = emdPbg.filter(
    (e) => e.category === 'EMD' && (e.status === 'Refund Requested' || e.status === 'Expiring Soon')
  );
  const totalPendingEmdAmount = sumAmount(pendingEmdRefunds);
  const lockedEmdAmount = sumAmount(emdPbg.filter(isEmdLocked));
  const livePbgCount = emdPbg.filter(isPbgLive).length;

  const upcomingPbgExpiries = emdPbg.filter((e) => {
    if (!isPbgLive(e)) return false;
    const exp = new Date(e.expiryDate);
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 60;
  });

  // Outstanding payments
  const outstandingPayments = totalReceivables(invoices);

  // Lead Conversion rate
  const wonLeads = leads.filter((l) => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  // Tender Pipeline Stages counts
  const stageCounts: Record<string, number> = {
    Identified: 0,
    'Under Review': 0,
    'Bid Submitted': 0,
    'Financial Evaluation': 0,
    Awarded: 0,
    Lost: 0,
  };
  tenders.forEach((t) => {
    if (stageCounts[t.stage] !== undefined) {
      stageCounts[t.stage] += 1;
    } else {
      stageCounts['Bid Submitted'] = (stageCounts['Bid Submitted'] || 0) + 1;
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Activity className="h-5 w-5 animate-spin text-blue-600" />
          <span>Loading Enterprise Manufacturing Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {systemConfig.systemName} • Executive Dashboard
            </h2>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {systemConfig.companyName}
            </span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-md border border-blue-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Click to edit System Name and Admin Profile"
            >
              <span>✏️ Edit System & Admin Name</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <span className="font-bold text-slate-800">{currentUser?.name || 'Administrator'}</span> ({currentUser?.role || 'Admin'}) • {systemConfig.plantLocation} • Real-time KPIs for GeM bids, hospital supply orders, EMD deposits, and assembly stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tenders')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition cursor-pointer"
          >
            <FileCheck2 className="h-4 w-4" />
            View Tender Register
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            Create Quotation
          </button>
        </div>
      </div>

      {/* Row 1: Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Government Bids"
          value={totalTenders}
          subtitle={`${upcomingTenders.length} submission due within 14 days`}
          icon={<FileCheck2 className="h-5 w-5" />}
          colorScheme="blue"
          onClick={() => setActiveTab('tenders')}
        />

        <StatCard
          title="Leads & Inquiries"
          value={totalLeads}
          subtitle={`${activeDealers} active channel dealers`}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: `${conversionRate}% conversion`, isPositive: true }}
          colorScheme="indigo"
          onClick={() => setActiveTab('leads')}
        />

        <StatCard
          title="Pending EMD Refunds"
          value={formatINR(totalPendingEmdAmount, true)}
          subtitle={`${pendingEmdRefunds.length} earnest deposit follow-ups`}
          icon={<ShieldAlert className="h-5 w-5" />}
          colorScheme="amber"
          onClick={() => setActiveTab('emd-pbg')}
        />

        <StatCard
          title="Outstanding Receivables"
          value={formatINR(outstandingPayments, true)}
          subtitle="Hospital & dealer billing balance"
          icon={<IndianRupee className="h-5 w-5" />}
          colorScheme="rose"
          onClick={() => setActiveTab('dispatch')}
        />
      </div>

      {/* Row 2: Secondary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tenders Awarded</p>
              <h4 className="text-lg font-bold text-slate-900">{wonTenders} Won</h4>
            </div>
          </div>
          <span className="text-xs text-slate-400">vs {lostTenders} Lost</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700 border border-amber-200">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Warehouse Inventory</p>
              <h4 className="text-lg font-bold text-slate-900">{formatINR(totalInventoryValue, true)}</h4>
            </div>
          </div>
          {lowStockProducts.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertTriangle className="h-3 w-3" />
              {lowStockProducts.length} Low Stock
            </span>
          ) : (
            <span className="text-xs text-emerald-600 font-medium">Stock Healthy</span>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 border border-blue-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PBG Guarantees Active</p>
              <h4 className="text-lg font-bold text-slate-900">
                {livePbgCount} Active
              </h4>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {upcomingPbgExpiries.length} renewals soon
          </span>
        </div>
      </div>

      {/* Row 3: Interactive Analytics & Visual Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tender Pipeline Funnel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Government Tender Lifecycle Pipeline</h3>
              <p className="text-xs text-slate-500">Distribution across evaluation and award stages</p>
            </div>
            <button
              onClick={() => setActiveTab('tenders')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Tender Details <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {Object.entries(stageCounts).map(([stage, count]) => {
              const total = tenders.length || 1;
              const percent = Math.round((count / total) * 100);
              let barColor = 'bg-blue-600';
              if (stage === 'Awarded') barColor = 'bg-emerald-600';
              if (stage === 'Lost') barColor = 'bg-slate-400';
              if (stage === 'Under Review') barColor = 'bg-amber-500';

              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{stage}</span>
                    <span className="text-slate-500">
                      <span className="font-bold text-slate-900">{count} bids</span> ({percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick summary strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Pipeline Value</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {formatINR(openPipelineValue, true)}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Locked EMD Capital</span>
              <p className="text-sm font-bold text-amber-700 mt-0.5">
                {formatINR(lockedEmdAmount, true)}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase">GeM Platform Share</span>
              <p className="text-sm font-bold text-blue-700 mt-0.5">
                {Math.round((tenders.filter((t) => t.portalName === 'GeM').length / (tenders.length || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Next 14 Days
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingTenders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No tenders due in the next 14 days.</p>
            ) : (
              upcomingTenders.map((tender) => {
                const deadline = new Date(tender.submissionDeadline);
                const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
                return (
                  <div
                    key={tender.id}
                    onClick={() => setActiveTab('tenders')}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{tender.tenderTitle}</p>
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                      {tender.governmentDepartment}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold text-blue-700">{tender.portalName}</span>
                      <span>Est: {formatINR(tender.estimatedValue, true)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Low Stock Alerts & Recent Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Low Stock Medical Equipment */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Low Stock & Reorder Alerts</h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Stock Register <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                All finished equipment and raw materials are above minimum stock limits.
              </p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{p.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      Code: {p.productCode} • Warehouse: {p.warehouse}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600">
                      {p.quantity} {p.unit}
                    </span>
                    <p className="text-[10px] text-slate-400">Min: {p.minStockLevel} {p.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time System Audit Trail */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Enterprise Activity Log</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Logged securely</span>
          </div>

          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity logs.</p>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      By <span className="font-semibold text-slate-700">{log.user}</span> ({log.role}) • Module: {log.module}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
