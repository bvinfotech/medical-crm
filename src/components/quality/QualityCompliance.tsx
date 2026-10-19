import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  ShieldCheck, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { QualityInspection, CalibrationCertificate, ComplianceDocument } from '../../types/crm';
import { getAllFromStore, putToStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatDate } from '../../utils/formatters';

export const QualityCompliance: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { systemConfig } = useSystem();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationCertificate[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'inspections' | 'calibration' | 'regulatory'>('inspections');

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isCalibModalOpen, setIsCalibModalOpen] = useState(false);

  const loadData = async () => {
    const [iList, cList, dList] = await Promise.all([
      getAllFromStore<QualityInspection>('qualityInspections'),
      getAllFromStore<CalibrationCertificate>('calibrationCerts'),
      getAllFromStore<ComplianceDocument>('complianceDocs'),
    ]);
    setInspections(iList);
    setCalibrations(cList);
    setComplianceDocs(dList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  const handleSaveInspection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inspected = Number(formData.get('quantityInspected') || 10);
    const passed = Number(formData.get('passedQuantity') || 10);
    const failed = Math.max(0, inspected - passed);

    const record: QualityInspection = {
      id: 'qc-' + Date.now(),
      reportNumber: `QC-REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: 'prod-custom',
      productName: String(formData.get('productName') || ''),
      batchNumber: String(formData.get('batchNumber') || ''),
      quantityInspected: inspected,
      passedQuantity: passed,
      failedQuantity: failed,
      inspectorName: currentUser?.name || 'Dr. Neha Swaminathan',
      date: String(formData.get('date') || new Date().toISOString().slice(0, 10)),
      standardsChecked: String(formData.get('standardsChecked') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      result: (formData.get('result') as any) || 'Accepted',
      ncrNumber: failed > 0 ? `NCR-2026-${Math.floor(100 + Math.random() * 900)}` : undefined,
      notes: String(formData.get('notes') || ''),
    };

    await putToStore('qualityInspections', record, {
      user: currentUser?.name || 'Quality Lead',
      role: currentUser?.role || 'Quality Control',
      action: 'Log QC Inspection',
      details: `Logged batch test for ${record.productName} (${record.batchNumber}) - Result: ${record.result}`,
    });

    setIsInspectionModalOpen(false);
  };

  const handleSaveCalib = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const record: CalibrationCertificate = {
      id: 'cal-' + Date.now(),
      certificateNumber: String(formData.get('certificateNumber') || ''),
      equipmentName: String(formData.get('equipmentName') || ''),
      serialNumber: String(formData.get('serialNumber') || ''),
      calibratedBy: String(formData.get('calibratedBy') || ''),
      calibrationDate: String(formData.get('calibrationDate') || ''),
      expiryDate: String(formData.get('expiryDate') || ''),
      status: 'Valid',
      standardReference: String(formData.get('standardReference') || 'ISO/IEC 17025 Reference'),
    };

    await putToStore('calibrationCerts', record, {
      user: currentUser?.name || 'Quality Lead',
      role: currentUser?.role || 'Quality Control',
      action: 'Add Calibration Certificate',
      details: `Added NABL calibration cert ${record.certificateNumber} for ${record.equipmentName}`,
    });

    setIsCalibModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title={
          activeTab === 'inspections'
            ? 'Medical Device Pre-Dispatch & Batch QA Inspection Log'
            : activeTab === 'calibration'
            ? 'NABL Accredited Testing Equipment Calibration Register'
            : 'CDSCO MDR 2017 & ISO 13485:2016 Regulatory Licenses'
        }
        subtitle={`${systemConfig.companyName} • Quality Assurance & Regulatory Affairs Division`}
      />

      {/* Regulatory Notice Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 shadow-2xs">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold">Medical Device Quality & Regulatory Notice:</span> Regulatory compliance with CDSCO Medical Device Rules (MDR 2017) and ISO 13485:2016 requires maintaining physical signed batch records, DHF (Device Master File), and NABL-traceable lab calibration certificates. This module tracks audit logs and expiry milestones.
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quality Assurance & Regulatory Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Batch release inspections, Non-Conformance Reports (NCR), master calibration instruments, and ISO 13485 licenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            reportTitle={
              activeTab === 'inspections'
                ? 'Batch_Inspection_Reports'
                : activeTab === 'calibration'
                ? 'Calibration_Certificates_Register'
                : 'CDSCO_ISO_Licenses'
            }
          />

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'inspections' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch Inspections ({inspections.length})
            </button>
            <button
              onClick={() => setActiveTab('calibration')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'calibration' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Calibration ({calibrations.length})
            </button>
            <button
              onClick={() => setActiveTab('regulatory')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'regulatory' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CDSCO & ISO Licenses ({complianceDocs.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BATCH INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pre-Dispatch & Batch Inspection Reports
              </h4>
              <p className="text-xs text-slate-500">Every ventilator and critical care unit requires functional electrical safety test signoff</p>
            </div>
            {hasPermission('quality', 'create') && (
              <button
                onClick={() => setIsInspectionModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Log Batch Inspection
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Report Number</th>
                  <th className="px-4 py-3">Product Name & Batch</th>
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">Sample Tested</th>
                  <th className="px-4 py-3">Pass / Fail</th>
                  <th className="px-4 py-3">Applicable Standards</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((qc) => (
                  <tr key={qc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{qc.reportNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{qc.productName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{qc.batchNumber}</p>
                    </td>
                    <td className="px-4 py-3">{formatDate(qc.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{qc.quantityInspected} units</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-700 font-semibold">{qc.passedQuantity} Pass</span>
                      {qc.failedQuantity > 0 && (
                        <span className="text-rose-600 font-semibold ml-2">({qc.failedQuantity} Fail)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs text-[11px] text-slate-600">
                      {qc.standardsChecked.join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={qc.result === 'Accepted' ? 'success' : 'warning'}>
                        {qc.result}
                      </Badge>
                      {qc.ncrNumber && (
                        <p className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5">
                          {qc.ncrNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{qc.inspectorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER CALIBRATION */}
      {activeTab === 'calibration' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Testing Tools & Calibration Register
              </h4>
              <p className="text-xs text-slate-500">NABL / NPL accredited calibration validity tracking</p>
            </div>
            {hasPermission('quality', 'create') && (
              <button
                onClick={() => setIsCalibModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Add Calibration Certificate
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Certificate #</th>
                  <th className="px-4 py-3">Master Equipment Name</th>
                  <th className="px-4 py-3">Serial #</th>
                  <th className="px-4 py-3">Accredited Laboratory</th>
                  <th className="px-4 py-3">Calibrated On</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calibrations.map((cal) => (
                  <tr key={cal.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cal.certificateNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{cal.equipmentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{cal.serialNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{cal.calibratedBy}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(cal.calibrationDate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatDate(cal.expiryDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cal.status === 'Valid' ? 'success' : 'warning'}>
                        {cal.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CDSCO & ISO LICENSES */}
      {activeTab === 'regulatory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {complianceDocs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                  {doc.regulatoryBody}
                </span>
                <Badge variant={doc.status === 'Active' ? 'success' : 'warning'}>{doc.status}</Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                <p className="font-mono text-xs text-blue-700 mt-1">Licence: {doc.certificateNumber}</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{doc.scope}</p>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-xs text-slate-500">
                <span>Issued: {formatDate(doc.issueDate)}</span>
                <span className="font-bold text-slate-800">Valid Till: {formatDate(doc.validUntil)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: LOG INSPECTION */}
      <Modal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        title="Record Batch Inspection & QA Signoff"
        subtitle="Verification against IEC 60601-1 and ISO 13485 standards"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveInspection} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                name="productName"
                placeholder="B-Vent Pro 5000 ICU Ventilator"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Production Batch No. *</label>
              <input
                type="text"
                name="batchNumber"
                placeholder="BATCH-2026-V10"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Units Tested *</label>
              <input
                type="number"
                name="quantityInspected"
                defaultValue={10}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Units Passed *</label>
              <input
                type="number"
                name="passedQuantity"
                defaultValue={10}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Overall QA Result</label>
              <select
                name="result"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Accepted">Accepted (Passed QA)</option>
                <option value="Rework Required">Rework Required</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Date</label>
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standards Evaluated (comma-separated)</label>
              <input
                type="text"
                name="standardsChecked"
                defaultValue="ISO 13485:2016, IEC 60601-1 Electrical Safety, ISO 80601-2-12 Pressure Linearity"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Test Observations</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Pressure calibration curve verification, 48-hr endurance test completed..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsInspectionModalOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Sign & Save Inspection
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CALIBRATION CERTIFICATE */}
      <Modal
        isOpen={isCalibModalOpen}
        onClose={() => setIsCalibModalOpen(false)}
        title="Add NABL Calibration Certificate"
        subtitle="Testing instruments master trace register"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCalib} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate No. *</label>
              <input
                type="text"
                name="certificateNumber"
                placeholder="NABL/CAL/2026/XXXX"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                name="equipmentName"
                placeholder="Fluke Gas Flow Analyzer VT650"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                name="serialNumber"
                placeholder="FLK-499120"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Accredited Laboratory</label>
              <input
                type="text"
                name="calibratedBy"
                defaultValue="ERTL North (Govt of India)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Calibration Date</label>
              <input
                type="date"
                name="calibrationDate"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                defaultValue={new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCalibModalOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
