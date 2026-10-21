import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Download, 
  IndianRupee, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import { Invoice, DispatchChallan } from '../../types/crm';
import { getAllFromStore, putToStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

export const DispatchBilling: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { systemConfig } = useSystem();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [challans, setChallans] = useState<DispatchChallan[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'challans'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const [invList, dcList] = await Promise.all([
      getAllFromStore<Invoice>('invoices'),
      getAllFromStore<DispatchChallan>('dispatchChallans'),
    ]);
    setInvoices(invList);
    setChallans(dcList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.orderReference.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const subtotal = Number(formData.get('subtotal') || 100000);
    const gstRate = Number(formData.get('gstRate') || 12);
    const isInterstate = formData.get('isInterstate') === 'yes';

    const taxAmount = (subtotal * gstRate) / 100;
    const cgst = isInterstate ? 0 : taxAmount / 2;
    const sgst = isInterstate ? 0 : taxAmount / 2;
    const igst = isInterstate ? taxAmount : 0;
    const total = subtotal + taxAmount;

    const inv: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: `BMT-INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: String(formData.get('date') || new Date().toISOString().slice(0, 10)),
      dueDate: String(formData.get('dueDate') || ''),
      clientName: String(formData.get('clientName') || ''),
      clientGstin: String(formData.get('clientGstin') || ''),
      orderReference: String(formData.get('orderReference') || ''),
      tenderReference: String(formData.get('tenderReference') || ''),
      items: [
        {
          name: String(formData.get('itemName') || 'Medical Equipment Supply'),
          hsn: String(formData.get('hsn') || '90192000'),
          qty: Number(formData.get('qty') || 1),
          rate: subtotal,
          gstRate,
          amount: subtotal,
        },
      ],
      subtotal,
      cgst,
      sgst,
      igst,
      totalAmount: total,
      amountPaid: 0,
      balanceDue: total,
      paymentStatus: 'Unpaid',
      dispatchChallanNo: String(formData.get('dispatchChallanNo') || ''),
    };

    await putToStore('invoices', inv, {
      user: currentUser?.name || 'Accounts',
      role: currentUser?.role || 'Accounts',
      action: 'Generate GST Tax Invoice',
      details: `Generated invoice ${inv.invoiceNumber} for ${inv.clientName} (${formatINR(inv.totalAmount)})`,
    });

    setIsInvoiceModalOpen(false);
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const formData = new FormData(e.currentTarget);
    const payment = Number(formData.get('amount') || 0);

    const newAmountPaid = (selectedInvoiceForPayment.amountPaid || 0) + payment;
    const newBalanceDue = Math.max(0, selectedInvoiceForPayment.totalAmount - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'Paid' : 'Partially Paid';

    const updated: Invoice = {
      ...selectedInvoiceForPayment,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      paymentStatus: newStatus,
    };

    await putToStore('invoices', updated, {
      user: currentUser?.name || 'Accounts',
      role: currentUser?.role || 'Accounts',
      action: 'Payment Receipt',
      details: `Received payment of ${formatINR(payment)} for invoice ${updated.invoiceNumber}. Balance: ${formatINR(newBalanceDue)}`,
    });

    setIsRecordPaymentModalOpen(false);
    setSelectedInvoiceForPayment(null);
  };

  const handleCreateChallan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const dc: DispatchChallan = {
      id: 'dc-' + Date.now(),
      challanNumber: `DC-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: String(formData.get('invoiceNumber') || ''),
      date: String(formData.get('date') || new Date().toISOString().slice(0, 10)),
      consigneeName: String(formData.get('consigneeName') || ''),
      shippingAddress: String(formData.get('shippingAddress') || ''),
      vehicleNumber: String(formData.get('vehicleNumber') || ''),
      transporterName: String(formData.get('transporterName') || ''),
      lrNumber: String(formData.get('lrNumber') || ''),
      packagesCount: Number(formData.get('packagesCount') || 1),
      itemsSummary: String(formData.get('itemsSummary') || ''),
      status: 'In Transit',
    };

    await putToStore('dispatchChallans', dc, {
      user: currentUser?.name || 'Inventory Mgr',
      role: currentUser?.role || 'Inventory Manager',
      action: 'Issue Dispatch Challan',
      details: `Dispatched equipment under Challan ${dc.challanNumber} to ${dc.consigneeName} via ${dc.transporterName}`,
    });

    setIsChallanModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title={
          activeTab === 'invoices'
            ? 'GST Tax Invoice Register & Payment Balances'
            : 'Consignment Dispatch Challans & Logistics Register'
        }
        subtitle={`${systemConfig.companyName} • Commercial Accounts & Warehouse Logistics`}
      />

      {/* Tally / BUSY Integration Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 shadow-2xs">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold">Accounting Software Integration Notice:</span> Direct automatic sync with Tally Prime / BUSY ERP requires the enterprise XML/ODBC sync gateway. Current invoices generate full GST breakdown (CGST, SGST, IGST) and can be exported as CSV/ledger for import into your accounts system.
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Dispatch Challans, Invoicing & Payment Receipts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log physical consignments, transport LR numbers, GST invoices, and hospital receivables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            reportTitle={activeTab === 'invoices' ? 'GST_Invoices_Register' : 'Dispatch_Challans_Log'}
          />

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GST Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('challans')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'challans' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispatch Challans ({challans.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Invoiced</span>
          <h4 className="mt-1 text-xl font-bold text-slate-900">{formatINR(totalBilled, true)}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Commercial billings across fiscal period</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Outstanding Receivables</span>
          <h4 className="mt-1 text-xl font-bold text-rose-900">{formatINR(totalOutstanding, true)}</h4>
          <p className="text-[11px] text-rose-700 mt-0.5">Pending payment from hospitals & dealers</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Equipment in Transit</span>
          <h4 className="mt-1 text-xl font-bold text-blue-900">
            {challans.filter((c) => c.status === 'In Transit').length} Consignments
          </h4>
          <p className="text-[11px] text-blue-700 mt-0.5">Under courier / medical road logistics</p>
        </div>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, client, PO ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {hasPermission('dispatch', 'create') && (
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Generate GST Invoice
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Hospital / Client</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {inv.invoiceNumber}
                      <p className="text-[10px] text-slate-400 font-normal">PO: {inv.orderReference}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{inv.clientName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{inv.clientGstin}</p>
                    </td>

                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(inv.dueDate)}</td>

                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">{formatINR(inv.amountPaid)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600 whitespace-nowrap">{formatINR(inv.balanceDue)}</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(inv.paymentStatus)}>
                        {inv.paymentStatus}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                        title="View & Print Official GST Tax Invoice"
                      >
                        <Printer className="h-3 w-3 text-slate-500" />
                        Invoice
                      </button>
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPayment(inv);
                            setIsRecordPaymentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <IndianRupee className="h-3 w-3" />
                          Record Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredInvoices.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCH CHALLANS */}
      {activeTab === 'challans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700">Official Delivery Challans & Transporter Consignments</span>
            {hasPermission('dispatch', 'create') && (
              <button
                onClick={() => setIsChallanModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Create Delivery Challan
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Challan #</th>
                  <th className="px-4 py-3">Consignee Hospital</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Transporter & Vehicle</th>
                  <th className="px-4 py-3">LR / Docket #</th>
                  <th className="px-4 py-3">Packages</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.challanNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{c.consigneeName}</p>
                      <p className="text-[10px] text-slate-400">{c.shippingAddress}</p>
                    </td>
                    <td className="px-4 py-3">{formatDate(c.date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{c.transporterName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{c.vehicleNumber}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{c.lrNumber || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.packagesCount} Nos.</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'Delivered' ? 'success' : 'primary'}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate GST Tax Invoice"
        subtitle="Tax compliance under Indian GST Rules"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Buyer Name *</label>
              <input
                type="text"
                name="clientName"
                placeholder="AIIMS Delhi / Max Hospital"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer GSTIN</label>
              <input
                type="text"
                name="clientGstin"
                placeholder="07AAACS1122N1ZU"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO / Contract Number *</label>
              <input
                type="text"
                name="orderReference"
                placeholder="PO-2026-9921"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GeM Tender Reference</label>
              <input
                type="text"
                name="tenderReference"
                placeholder="GEM/2026/B/XXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                defaultValue={new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal (Taxable Amount ₹) *</label>
              <input
                type="number"
                name="subtotal"
                defaultValue={500000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate</label>
              <select
                name="gstRate"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="12">12% (Medical Equipment standard)</option>
                <option value="18">18% (Diagnostic & Spares)</option>
                <option value="5">5%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inter-State Supply (IGST)?</label>
              <select
                name="isInterstate"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="yes">Yes (IGST applied - Out of Haryana)</option>
                <option value="no">No (CGST + SGST applied - Intra Haryana)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Challan Number</label>
              <input
                type="text"
                name="dispatchChallanNo"
                placeholder="DC-2026-781"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT RECEIPT MODAL */}
      <Modal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        title="Record Customer Payment Receipt"
        subtitle={`Invoice: ${selectedInvoiceForPayment?.invoiceNumber} • Outstanding: ${formatINR(selectedInvoiceForPayment?.balanceDue)}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              name="amount"
              defaultValue={selectedInvoiceForPayment?.balanceDue}
              max={selectedInvoiceForPayment?.balanceDue}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden">
              <option>RTGS / NEFT Online Transfer</option>
              <option>GeM Portal Direct Disbursal</option>
              <option>Cheque / Demand Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. UTR-SBI-982141992"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsRecordPaymentModalOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Post Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE DELIVERY CHALLAN MODAL */}
      <Modal
        isOpen={isChallanModalOpen}
        onClose={() => setIsChallanModalOpen(false)}
        title="Issue Dispatch Delivery Challan"
        subtitle="Official gate pass and transport LR documentation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateChallan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consignee / Hospital Name *</label>
              <input
                type="text"
                name="consigneeName"
                placeholder="PGIMER Chandigarh, Trauma Centre"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number (if billed)</label>
              <input
                type="text"
                name="invoiceNumber"
                placeholder="BMT-INV-2026-108"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transporter Name *</label>
              <input
                type="text"
                name="transporterName"
                defaultValue="Safexpress Medical Logistics"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number *</label>
              <input
                type="text"
                name="vehicleNumber"
                placeholder="HR-55-AN-8921"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LR / Lorry Receipt Number</label>
              <input
                type="text"
                name="lrNumber"
                placeholder="SFX-9018241"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Packages Count</label>
              <input
                type="number"
                name="packagesCount"
                defaultValue={10}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Shipping Address *</label>
              <input
                type="text"
                name="shippingAddress"
                placeholder="Stores Department, Sector 12, Chandigarh - 160012"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Summary</label>
              <input
                type="text"
                name="itemsSummary"
                defaultValue="10 Nos. Biphasic Defibrillators DF-300 with accessories"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsChallanModalOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Issue Challan
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW & PRINT TAX INVOICE MODAL */}
      <Modal
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        title={`Tax Invoice: ${selectedInvoiceForView?.invoiceNumber || ''}`}
        subtitle={`Issued by ${systemConfig.companyName}`}
        maxWidth="3xl"
      >
        {selectedInvoiceForView && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print / Save as PDF
              </button>
            </div>

            {/* Letterhead Container */}
            <div className="border border-slate-200 rounded-xl bg-white p-6 sm:p-8 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white font-black text-xl shadow-xs">
                    {systemConfig.systemShortName || 'BM'}
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-blue-950 uppercase tracking-tight">
                      {systemConfig.companyName}
                    </h1>
                    <p className="text-[11px] text-slate-500">
                      {systemConfig.address}, {systemConfig.city}, {systemConfig.state} - {systemConfig.pincode}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      GSTIN: <span className="font-mono font-bold text-slate-800">{systemConfig.gstin}</span> • {systemConfig.cdscoReg} • {systemConfig.isoCert}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-900 uppercase tracking-wider border border-blue-200">
                    TAX INVOICE
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-2 font-mono">
                    {selectedInvoiceForView.invoiceNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {formatDate(selectedInvoiceForView.date)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Due: {formatDate(selectedInvoiceForView.dueDate)}
                  </p>
                </div>
              </div>

              {/* Bill To & Dispatch Details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Billed & Dispatched To:
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{selectedInvoiceForView.clientName}</p>
                  <p className="font-mono text-slate-600 mt-0.5">GSTIN: {selectedInvoiceForView.clientGstin || 'Unregistered / Exempt'}</p>
                  <p className="text-slate-500 mt-1">Order Ref / PO: <span className="font-mono font-semibold">{selectedInvoiceForView.orderReference}</span></p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-right space-y-1">
                  <p className="text-slate-600">Dispatch Challan: <span className="font-mono font-semibold">{selectedInvoiceForView.dispatchChallanNo || 'N/A'}</span></p>
                  <p className="text-slate-600">Plant of Origin: <span className="font-semibold">{systemConfig.plantLocation}</span></p>
                  <p className="text-slate-600">Tax Mechanism: <span className="font-semibold">Forward Charge</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3">HSN Code</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Rate</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoiceForView.items && selectedInvoiceForView.items.length > 0 ? (
                      selectedInvoiceForView.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{item.hsn}</td>
                          <td className="py-2.5 px-3 text-right">{item.qty}</td>
                          <td className="py-2.5 px-3 text-right">{formatINR(item.rate)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{formatINR(item.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">Medical Equipment Supply as per PO {selectedInvoiceForView.orderReference}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">9018</td>
                        <td className="py-2.5 px-3 text-right">1 Lot</td>
                        <td className="py-2.5 px-3 text-right">{formatINR(selectedInvoiceForView.subtotal)}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{formatINR(selectedInvoiceForView.subtotal)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end border-t border-slate-200 pt-3">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span>{formatINR(selectedInvoiceForView.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax (CGST+SGST/IGST):</span>
                    <span>{formatINR(selectedInvoiceForView.cgst + selectedInvoiceForView.sgst + selectedInvoiceForView.igst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-b border-slate-900 py-1.5">
                    <span>Invoice Grand Total:</span>
                    <span className="text-blue-900">{formatINR(selectedInvoiceForView.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatINR(selectedInvoiceForView.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>{formatINR(selectedInvoiceForView.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Bank & Signature */}
              <div className="mt-8 border-t border-slate-200 pt-4 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700 uppercase">Bank Remittance RTGS/NEFT Details:</p>
                  <p>A/c Name: <span className="font-bold text-slate-800">{systemConfig.companyName}</span></p>
                  <p>Bank: State Bank of India • Branch: Industrial Finance Branch</p>
                  <p>A/c No: 409182390192 • IFSC: SBIN0004921</p>
                  <p className="mt-2 text-slate-400">Computer generated GST invoice in accordance with CGST Rules 2017.</p>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <p className="font-bold text-slate-800 uppercase">For {systemConfig.companyName}</p>
                  <div className="mt-6 border-b border-slate-400 w-44"></div>
                  <p className="text-[10px] text-slate-600 mt-1">Authorized Finance & Dispatch Signatory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
