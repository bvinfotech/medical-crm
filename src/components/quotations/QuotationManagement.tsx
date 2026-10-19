import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Building2, 
  IndianRupee,
  FileCheck,
  Send,
  X
} from 'lucide-react';
import { Quotation, QuotationItem, Product } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate } from '../../utils/formatters';

export const QuotationManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { systemConfig } = useSystem();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Dynamic items inside quotation modal
  const [items, setItems] = useState<QuotationItem[]>([]);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const [qList, pList] = await Promise.all([
      getAllFromStore<Quotation>('quotations'),
      getAllFromStore<Product>('products'),
    ]);
    setQuotations(qList);
    setProducts(pList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const openNewQuoteModal = () => {
    setEditingQuote(null);
    setItems([
      {
        id: 'item-1',
        productId: products[0]?.id || '',
        productName: products[0]?.name || 'B-Vent Pro 5000 ICU Ventilator',
        model: products[0]?.modelNumber || 'B-VENT-5K',
        hsnCode: products[0]?.hsnCode || '90192000',
        quantity: 1,
        unitPrice: products[0]?.sellingPrice || 580000,
        gstRate: 12,
        discountPercent: 0,
        lineTotal: products[0]?.sellingPrice || 580000,
      },
    ]);
    setIsModalOpen(true);
  };

  const openEditQuoteModal = (quote: Quotation) => {
    setEditingQuote(quote);
    setItems(quote.items);
    setIsModalOpen(true);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prod.id,
        productName: prod.name,
        model: prod.modelNumber,
        hsnCode: prod.hsnCode,
        unitPrice: prod.sellingPrice,
        lineTotal: prod.sellingPrice * copy[index].quantity * (1 - copy[index].discountPercent / 100),
      };
      return copy;
    });
  };

  const updateItemField = (index: number, field: keyof QuotationItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      const sub = (item.unitPrice || 0) * (item.quantity || 1);
      const discount = sub * ((item.discountPercent || 0) / 100);
      item.lineTotal = sub - discount;
      copy[index] = item;
      return copy;
    });
  };

  const addNewItem = () => {
    const prod = products[0];
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        productId: prod?.id || '',
        productName: prod?.name || 'Medical Equipment',
        model: prod?.modelNumber || 'MOD-101',
        hsnCode: prod?.hsnCode || '90189099',
        quantity: 1,
        unitPrice: prod?.sellingPrice || 100000,
        gstRate: 12,
        discountPercent: 0,
        lineTotal: prod?.sellingPrice || 100000,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const calculatedDiscount = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity * (it.discountPercent / 100)), 0);
  const calculatedTax = items.reduce((acc, it) => acc + (it.lineTotal * (it.gstRate / 100)), 0);
  const calculatedGrandTotal = Math.round(calculatedSubtotal - calculatedDiscount + calculatedTax);

  const handleSaveQuotation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const quoteData: Quotation = {
      id: editingQuote ? editingQuote.id : 'quote-' + Date.now(),
      quotationNumber: editingQuote ? editingQuote.quotationNumber : `BMT-QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      revision: editingQuote ? editingQuote.revision + 1 : 1,
      date: String(formData.get('date') || new Date().toISOString().slice(0, 10)),
      validUntil: String(formData.get('validUntil') || ''),
      clientType: formData.get('clientType') as any,
      clientName: String(formData.get('clientName') || ''),
      contactPerson: String(formData.get('contactPerson') || ''),
      clientGstin: String(formData.get('clientGstin') || ''),
      billingAddress: String(formData.get('billingAddress') || ''),
      shippingAddress: String(formData.get('shippingAddress') || ''),
      items,
      subtotal: calculatedSubtotal,
      totalDiscount: calculatedDiscount,
      totalTax: calculatedTax,
      grandTotal: calculatedGrandTotal,
      status: (formData.get('status') as any) || 'Draft',
      termsAndConditions: String(formData.get('termsAndConditions') || ''),
      preparedBy: currentUser?.name || 'Sales Officer',
      createdAt: editingQuote ? editingQuote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore('quotations', quoteData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Sales',
      action: editingQuote ? 'Update Quotation' : 'Create Quotation',
      details: `${editingQuote ? 'Revised' : 'Generated'} quotation ${quoteData.quotationNumber} for ${quoteData.clientName} (${formatINR(quoteData.grandTotal)})`,
    });

    setIsModalOpen(false);
    setEditingQuote(null);
  };

  const handleDeleteQuotation = async (id: string, num: string) => {
    if (!confirm(`Delete quotation ${num}?`)) return;
    await deleteFromStore('quotations', id, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Admin',
      details: `Deleted quotation ${num}`,
    });
  };

  const filteredQuotes = quotations.filter((q) => {
    return (
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-5">
      <PrintHeader
        title="Hospital Quotations & Commercial Proposals Register"
        subtitle="Formal price bids, GST calculations, line items, and approval states"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quotations & Hospital Commercial Proposals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create professional GST-compliant quotations, technical price bids, and printable proposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton reportTitle="Medical_Equipment_Quotations_Register" />

          {hasPermission('quotations', 'create') && (
            <button
              onClick={openNewQuoteModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Generate New Quotation
            </button>
          )}
        </div>
      </div>

      {/* Search and Table */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation number, hospital, contact..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Quote Number</th>
                <th className="px-4 py-3">Hospital / Client</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Grand Total (Inc GST)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                paginatedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{quote.quotationNumber}</p>
                      <span className="text-[10px] text-slate-400">Rev: v{quote.revision}</span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{quote.clientName}</p>
                      <p className="text-[11px] text-slate-400">{quote.contactPerson}</p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatDate(quote.date)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatDate(quote.validUntil)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {quote.items?.length || 0} Products
                      </span>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(quote.grandTotal)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(quote.status)}>
                        {quote.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewQuote(quote)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          title="View & Print PDF"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        {hasPermission('quotations', 'edit') && (
                          <button
                            onClick={() => openEditQuoteModal(quote)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit Quotation"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('quotations', 'delete') && (
                          <button
                            onClick={() => handleDeleteQuotation(quote.id, quote.quotationNumber)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredQuotes.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* CREATE / EDIT QUOTATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuote ? `Revise Quotation (${editingQuote.quotationNumber})` : 'Create Medical Equipment Quotation'}
        subtitle="Automated GST, HSN code, and line item discount calculations"
        maxWidth="5xl"
      >
        <form onSubmit={handleSaveQuotation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Type *</label>
              <select
                name="clientType"
                defaultValue={editingQuote?.clientType || 'Hospital'}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Hospital">Hospital / Institution</option>
                <option value="Government">Government / GeM Buyer</option>
                <option value="Dealer">Channel Dealer</option>
                <option value="Private Clinic">Private Clinic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Client Name *</label>
              <input
                type="text"
                name="clientName"
                defaultValue={editingQuote?.clientName}
                required
                placeholder="Safdarjung Hospital, New Delhi"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attention / Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={editingQuote?.contactPerson}
                required
                placeholder="Dr. Verma (Medical Superintendent)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client GSTIN</label>
              <input
                type="text"
                name="clientGstin"
                defaultValue={editingQuote?.clientGstin}
                placeholder="07AAACS1122N1ZU"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Date</label>
              <input
                type="date"
                name="date"
                defaultValue={editingQuote?.date || new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (30 Days default)</label>
              <input
                type="date"
                name="validUntil"
                defaultValue={editingQuote?.validUntil || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={editingQuote?.status || 'Draft'}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent to Client</option>
                <option value="Approved">Approved by Client</option>
                <option value="Converted to PO">Converted to PO</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
              <input
                type="text"
                name="billingAddress"
                defaultValue={editingQuote?.billingAddress || 'Ansari Nagar, New Delhi - 110029'}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Equipment Line Items ({items.length})
              </h4>
              <button
                type="button"
                onClick={addNewItem}
                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-slate-200 transition"
              >
                <Plus className="h-3 w-3" />
                Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Medical Product</th>
                    <th className="p-2.5 w-24">HSN Code</th>
                    <th className="p-2.5 w-20">Qty</th>
                    <th className="p-2.5 w-28">Unit Price (₹)</th>
                    <th className="p-2.5 w-20">Disc %</th>
                    <th className="p-2.5 w-20">GST %</th>
                    <th className="p-2.5 w-28">Total (₹)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.modelNumber})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => updateItemField(idx, 'hsnCode', e.target.value)}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemField(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => updateItemField(idx, 'discountPercent', Number(e.target.value))}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItemField(idx, 'gstRate', Number(e.target.value))}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs"
                        >
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="5">5%</option>
                          <option value="0">0%</option>
                        </select>
                      </td>
                      <td className="p-2 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(item.lineTotal)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-72 rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatINR(calculatedSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span className="font-semibold text-rose-600">-{formatINR(calculatedDiscount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (Tax):</span>
                  <span className="font-semibold text-slate-900">{formatINR(calculatedTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total (INR):</span>
                  <span className="text-blue-700">{formatINR(calculatedGrandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commercial Terms & Warranty Conditions
            </label>
            <textarea
              name="termsAndConditions"
              rows={2}
              defaultValue={
                editingQuote?.termsAndConditions ||
                '1. Prices are FOR Destination inclusive of transit insurance.\n2. Delivery within 4-6 weeks.\n3. Warranty: 36 months comprehensive.\n4. Payment terms: 90% against delivery, 10% on commissioning.'
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingQuote ? 'Update Quotation' : 'Save & Generate Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE PDF QUOTATION MODAL */}
      <Modal
        isOpen={!!previewQuote}
        onClose={() => setPreviewQuote(null)}
        title="Quotation Document Preview & Print"
        subtitle="Official letterhead format ready for customer submission or export"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>

          {/* Letterhead Container */}
          <div className="border border-slate-200 rounded-xl bg-white p-8 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white font-black text-xl">
                  {systemConfig.systemShortName}
                </div>
                <div>
                  <h1 className="text-lg font-black text-blue-950 uppercase tracking-tight">
                    {systemConfig.companyName}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    {systemConfig.address}, {systemConfig.city}, {systemConfig.state} - {systemConfig.pincode}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    GSTIN: {systemConfig.gstin} • {systemConfig.cdscoReg} • {systemConfig.isoCert}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-900 uppercase tracking-wider border border-blue-200">
                  Commercial Quotation
                </span>
                <p className="text-xs font-bold text-slate-900 mt-2">
                  Quote No: {previewQuote?.quotationNumber}
                </p>
                <p className="text-[11px] text-slate-500">
                  Date: {formatDate(previewQuote?.date)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Valid Until: {formatDate(previewQuote?.validUntil)}
                </p>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-6 my-5 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quotation Prepared For:
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{previewQuote?.clientName}</p>
                <p className="text-slate-600 mt-0.5">Attn: {previewQuote?.contactPerson}</p>
                <p className="text-slate-500">{previewQuote?.billingAddress}</p>
                {previewQuote?.clientGstin && (
                  <p className="text-slate-600 mt-1 font-mono text-[11px]">
                    GSTIN: {previewQuote.clientGstin}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Company Bank Account Details:
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">State Bank of India (CAG New Delhi)</p>
                <p className="text-slate-600">A/C No: 40189201992 (Current Account)</p>
                <p className="text-slate-600">IFSC Code: SBIN0009988</p>
                <p className="text-slate-500 mt-1">Prepared by: {previewQuote?.preparedBy}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden my-4">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                <tr>
                  <th className="p-2.5 border-b">#</th>
                  <th className="p-2.5 border-b">Equipment Description</th>
                  <th className="p-2.5 border-b">HSN</th>
                  <th className="p-2.5 border-b text-center">Qty</th>
                  <th className="p-2.5 border-b text-right">Unit Rate (₹)</th>
                  <th className="p-2.5 border-b text-center">GST</th>
                  <th className="p-2.5 border-b text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewQuote?.items?.map((it, i) => (
                  <tr key={it.id}>
                    <td className="p-2.5 text-slate-400">{i + 1}</td>
                    <td className="p-2.5">
                      <p className="font-bold text-slate-900">{it.productName}</p>
                      <p className="text-[10px] text-slate-400">Model: {it.model}</p>
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">{it.hsnCode}</td>
                    <td className="p-2.5 text-center font-semibold">{it.quantity}</td>
                    <td className="p-2.5 text-right">{formatINR(it.unitPrice)}</td>
                    <td className="p-2.5 text-center">{it.gstRate}%</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-between items-start text-xs pt-2">
              <div className="max-w-md">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Terms & Conditions:
                </span>
                <p className="text-[11px] text-slate-600 whitespace-pre-line mt-1">
                  {previewQuote?.termsAndConditions}
                </p>
              </div>

              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(previewQuote?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total GST:</span>
                  <span>{formatINR(previewQuote?.totalTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-blue-950 pt-2 border-t-2 border-slate-900">
                  <span>Total Amount:</span>
                  <span>{formatINR(previewQuote?.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700">{systemConfig.companyName}</p>
                <p className="text-[10px]">This is a computer-generated quotation.</p>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-1"></div>
                <p className="font-bold text-slate-800">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
