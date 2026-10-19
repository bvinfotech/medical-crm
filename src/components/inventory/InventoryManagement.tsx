import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Layers, 
  Edit, 
  Trash2, 
  History, 
  CheckCircle2,
  Package
} from 'lucide-react';
import { Product, StockMovement, ProductCategory } from '../../types/crm';
import { getAllFromStore, putToStore, deleteFromStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate, formatDateTime, exportToCSV } from '../../utils/formatters';

const CATEGORIES: ProductCategory[] = [
  'ICU Equipment',
  'Patient Monitoring',
  'Operation Theatre',
  'Respiratory Care',
  'Raw Material',
  'Spares',
];

export const InventoryManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'ledger'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const [pList, mList] = await Promise.all([
      getAllFromStore<Product>('products'),
      getAllFromStore<StockMovement>('stockMovements'),
    ]);
    setProducts(pList);
    setMovements(mList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const paginatedMovements = movements.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const qty = Number(formData.get('quantity') || 0);
    const minStock = Number(formData.get('minStockLevel') || 10);

    const prodData: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      productCode: String(formData.get('productCode') || ''),
      name: String(formData.get('name') || ''),
      category: formData.get('category') as ProductCategory,
      modelNumber: String(formData.get('modelNumber') || ''),
      hsnCode: String(formData.get('hsnCode') || ''),
      type: formData.get('type') as any,
      warehouse: String(formData.get('warehouse') || ''),
      quantity: qty,
      unit: (formData.get('unit') as any) || 'Units',
      purchaseCost: Number(formData.get('purchaseCost') || 0),
      sellingPrice: Number(formData.get('sellingPrice') || 0),
      minStockLevel: minStock,
      currentBatchNumber: String(formData.get('currentBatchNumber') || ''),
      cdscoClassification: formData.get('cdscoClassification') as any,
      status: qty <= 0 ? 'Out of Stock' : qty <= minStock ? 'Low Stock' : 'In Stock',
      lastRestocked: new Date().toISOString().slice(0, 10),
    };

    await putToStore('products', prodData, {
      user: currentUser?.name || 'User',
      role: currentUser?.role || 'Inventory Manager',
      action: editingProduct ? 'Update Product' : 'Create Product',
      details: `${editingProduct ? 'Updated' : 'Added'} item ${prodData.name} (${prodData.productCode}) in ${prodData.warehouse}`,
    });

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleStockMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductForMovement) return;

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as StockMovement['type'];
    const qty = Number(formData.get('quantity') || 0);

    if (qty <= 0) {
      alert('Movement quantity must be greater than zero.');
      return;
    }

    // Validate that outward movement doesn't cause negative stock
    if (type === 'Outward (Dispatch)' && selectedProductForMovement.quantity < qty) {
      alert(`Cannot dispatch ${qty} units. Current available stock is only ${selectedProductForMovement.quantity} units.`);
      return;
    }

    // Calculate new stock quantity
    let newQty = selectedProductForMovement.quantity;
    if (type === 'Inward (GRN)') {
      newQty += qty;
    } else if (type === 'Outward (Dispatch)') {
      newQty -= qty;
    } else if (type === 'Adjustment') {
      newQty = qty; // direct adjustment
    }

    const movement: StockMovement = {
      id: 'sm-' + Date.now(),
      productId: selectedProductForMovement.id,
      productCode: selectedProductForMovement.productCode,
      productName: selectedProductForMovement.name,
      type,
      quantity: qty,
      unit: selectedProductForMovement.unit,
      batchNumber: String(formData.get('batchNumber') || selectedProductForMovement.currentBatchNumber || ''),
      fromLocation: String(formData.get('fromLocation') || ''),
      toLocation: String(formData.get('toLocation') || ''),
      referenceNumber: String(formData.get('referenceNumber') || ''),
      performedBy: currentUser?.name || 'Inventory Manager',
      date: new Date().toISOString(),
      reason: String(formData.get('reason') || ''),
    };

    const updatedProduct: Product = {
      ...selectedProductForMovement,
      quantity: newQty,
      status: newQty <= 0 ? 'Out of Stock' : newQty <= selectedProductForMovement.minStockLevel ? 'Low Stock' : 'In Stock',
      lastRestocked: type === 'Inward (GRN)' ? new Date().toISOString().slice(0, 10) : selectedProductForMovement.lastRestocked,
    };

    await Promise.all([
      putToStore('stockMovements', movement),
      putToStore('products', updatedProduct, {
        user: currentUser?.name || 'User',
        role: currentUser?.role || 'Inventory Manager',
        action: `Stock ${type}`,
        details: `${type} of ${qty} ${selectedProductForMovement.unit} for ${selectedProductForMovement.name}. Ref: ${movement.referenceNumber}`,
      }),
    ]);

    setIsMovementModalOpen(false);
    setSelectedProductForMovement(null);
  };

  const handleExportProducts = () => {
    const rows = filteredProducts.map((p) => ({
      Product_Code: p.productCode,
      Name: p.name,
      Category: p.category,
      Model: p.modelNumber,
      HSN_Code: p.hsnCode,
      Warehouse: p.warehouse,
      Current_Stock: p.quantity,
      Unit: p.unit,
      Min_Stock_Alert: p.minStockLevel,
      Cost_Price_INR: p.purchaseCost,
      Selling_Price_INR: p.sellingPrice,
      CDSCO_Class: p.cdscoClassification,
      Status: p.status,
    }));
    exportToCSV('Medical_Equipment_Inventory', rows);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title={activeSubTab === 'catalog' ? 'Medical Equipment Warehouse Stock Inventory' : 'Stock Movements & Traceability Ledger'}
        subtitle={activeSubTab === 'catalog' ? 'Finished medical electronics, raw materials, batch numbers, and reorder levels' : 'Inward GRN receipts, outward dispatches, and location transfers'}
      />

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Medical Equipment Inventory & Finished Goods
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assembly plant warehouse tracking, batch traceability, Good Receipt Notes (GRN), and dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => {
                setActiveSubTab('catalog');
                setCurrentPage(1);
              }}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeSubTab === 'catalog' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Register ({products.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('ledger');
                setCurrentPage(1);
              }}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeSubTab === 'ledger' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movement Ledger ({movements.length})
            </button>
          </div>

          <button
            onClick={handleExportProducts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export
          </button>

          <PrintButton reportTitle={activeSubTab === 'catalog' ? 'Equipment_Stock_Register' : 'Stock_Movements_Ledger'} />

          {hasPermission('inventory', 'create') && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'catalog' ? (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search equipment name, code, warehouse..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Code & Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Warehouse Location</th>
                    <th className="px-4 py-3">Available Quantity</th>
                    <th className="px-4 py-3">Min Level</th>
                    <th className="px-4 py-3">Cost Price</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                        No products found matching query.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {p.productCode} • HSN: {p.hsnCode}
                          </p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {p.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-700 line-clamp-1 max-w-xs">
                          {p.warehouse}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            p.quantity <= p.minStockLevel ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                            {p.quantity} {p.unit}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {p.minStockLevel} {p.unit}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatINR(p.purchaseCost)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                          {formatINR(p.sellingPrice)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={p.status === 'In Stock' ? 'success' : p.status === 'Low Stock' ? 'warning' : 'danger'}>
                            {p.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedProductForMovement(p);
                                setIsMovementModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                              title="Record GRN Inward / Dispatch Outward"
                            >
                              In/Out
                            </button>
                            {hasPermission('inventory', 'edit') && (
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                title="Edit Product"
                              >
                                <Edit className="h-3.5 w-3.5" />
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
              totalItems={filteredProducts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        /* STOCK MOVEMENTS LEDGER */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product Description</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Source & Destination</th>
                  <th className="px-4 py-3">Reference (PO/GRN/DC)</th>
                  <th className="px-4 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {formatDateTime(m.date)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          m.type.includes('Inward') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.type.includes('Inward') ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {m.type}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{m.productName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{m.productCode}</p>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {m.quantity} {m.unit}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {m.batchNumber || '-'}
                      </td>

                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        <span>{m.fromLocation || 'Stores'}</span> → <span className="font-semibold text-slate-900">{m.toLocation}</span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">
                        {m.referenceNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {m.performedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={movements.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Medical Equipment' : 'Catalog New Medical Equipment'}
        subtitle="Maintain CDSCO classification, HSN, batching, and reorder levels"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code *</label>
              <input
                type="text"
                name="productCode"
                defaultValue={editingProduct?.productCode}
                placeholder="MED-VENT-5000"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={editingProduct?.name}
                placeholder="B-Vent Pro 5000 ICU Ventilator"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                name="category"
                defaultValue={editingProduct?.category || 'ICU Equipment'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Number</label>
              <input
                type="text"
                name="modelNumber"
                defaultValue={editingProduct?.modelNumber}
                placeholder="B-VENT-5K"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                name="hsnCode"
                defaultValue={editingProduct?.hsnCode || '90192000'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse / Bay</label>
              <input
                type="text"
                name="warehouse"
                defaultValue={editingProduct?.warehouse || 'Main Assembly Plant - Manesar (Bay A)'}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                name="quantity"
                defaultValue={editingProduct?.quantity || 10}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <select
                name="unit"
                defaultValue={editingProduct?.unit || 'Units'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Units">Units</option>
                <option value="Pieces">Pieces</option>
                <option value="Sets">Sets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Reorder Level *</label>
              <input
                type="number"
                name="minStockLevel"
                defaultValue={editingProduct?.minStockLevel || 5}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase / BOM Cost (₹)</label>
              <input
                type="number"
                name="purchaseCost"
                defaultValue={editingProduct?.purchaseCost || 250000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catalogue Price (₹)</label>
              <input
                type="number"
                name="sellingPrice"
                defaultValue={editingProduct?.sellingPrice || 450000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CDSCO Medical Classification</label>
              <select
                name="cdscoClassification"
                defaultValue={editingProduct?.cdscoClassification || 'Class C'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Class A">Class A (Low Risk)</option>
                <option value="Class B">Class B (Low-Moderate Risk)</option>
                <option value="Class C">Class C (Moderate-High Risk)</option>
                <option value="Class D">Class D (High Risk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active Batch Number</label>
              <input
                type="text"
                name="currentBatchNumber"
                defaultValue={editingProduct?.currentBatchNumber || 'BATCH-2026-V10'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK INWARD / OUTWARD MOVEMENT MODAL */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedProductForMovement(null);
        }}
        title={`Stock Transaction: ${selectedProductForMovement?.name}`}
        subtitle={`Current Available: ${selectedProductForMovement?.quantity} ${selectedProductForMovement?.unit}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleStockMovement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type *</label>
              <select
                name="type"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Inward (GRN)">Inward (GRN - Production / Supplier)</option>
                <option value="Outward (Dispatch)">Outward (Dispatch to Hospital / Dealer)</option>
                <option value="Adjustment">Stock Audit Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                name="quantity"
                defaultValue={1}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number</label>
              <input
                type="text"
                name="batchNumber"
                defaultValue={selectedProductForMovement?.currentBatchNumber || 'BATCH-2026-V10'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number *</label>
              <input
                type="text"
                name="referenceNumber"
                placeholder="GRN-2026-XXXX / DC-2026-XXXX / PO-XXXX"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Location</label>
              <input
                type="text"
                name="fromLocation"
                placeholder="e.g. Testing Line / Warehouse A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Location</label>
              <input
                type="text"
                name="toLocation"
                placeholder="e.g. AIIMS New Delhi / Finished Bay"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason</label>
              <textarea
                name="reason"
                rows={2}
                placeholder="Reason for adjustment, hospital delivery confirmation..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsMovementModalOpen(false);
                setSelectedProductForMovement(null);
              }}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              Commit Stock Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
