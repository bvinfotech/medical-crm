import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Download, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Printer, 
  FileText,
  Lock,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { Employee, AttendanceRecord, PayrollRecord } from '../../types/crm';
import { getAllFromStore, putToStore, subscribeToDatabase } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PrintButton, PrintHeader } from '../common/PrintButton';
import { formatINR, formatDate } from '../../utils/formatters';

export const HrPayroll: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { systemConfig } = useSystem();
  const isHrOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'HR' || currentUser?.role === 'Accounts';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Payslip modal
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);

  // Attendance log modal
  const [isLogAttendanceOpen, setIsLogAttendanceOpen] = useState(false);

  // Add Employee modal
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const PAGE_SIZE = 8;

  const loadData = async () => {
    const [eList, aList] = await Promise.all([
      getAllFromStore<Employee>('employees'),
      getAllFromStore<AttendanceRecord>('attendance'),
    ]);
    setEmployees(eList);
    setAttendance(aList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDatabase(() => loadData());
    return () => unsub();
  }, []);

  if (!isHrOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="rounded-full bg-rose-50 p-3 text-rose-600 mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Restricted Access Module</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Confidential HR payroll compensation and personnel records are restricted to HR Department and Senior Admin accounts.
        </p>
      </div>
    );
  }

  const filteredEmployees = employees.filter((e) => {
    return (
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleLogAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const empId = formData.get('employeeId') as string;
    const emp = employees.find((x) => x.employeeId === empId);

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: empId,
      employeeName: emp?.name || 'Employee',
      date: String(formData.get('date') || new Date().toISOString().slice(0, 10)),
      status: formData.get('status') as any,
      checkIn: String(formData.get('checkIn') || '09:00'),
      checkOut: String(formData.get('checkOut') || '18:00'),
      hoursWorked: Number(formData.get('hoursWorked') || 9),
      remarks: String(formData.get('remarks') || ''),
    };

    await putToStore('attendance', record, {
      user: currentUser?.name || 'HR',
      role: currentUser?.role || 'HR',
      action: 'Log Attendance',
      details: `Logged ${record.status} for ${record.employeeName} on ${record.date}`,
    });

    setIsLogAttendanceOpen(false);
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const basic = Number(formData.get('basic') || 50000);
    const hra = Math.round(basic * 0.4);
    const medical = 5000;
    const conveyance = 4000;
    const pf = Math.round(basic * 0.12);
    const tds = Number(formData.get('tds') || 3000);

    const newEmp: Employee = {
      id: 'emp-' + Date.now(),
      employeeId: `BMT-EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: String(formData.get('name') || ''),
      designation: String(formData.get('designation') || ''),
      department: formData.get('department') as any,
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      dateOfJoining: String(formData.get('dateOfJoining') || new Date().toISOString().slice(0, 10)),
      status: 'Active',
      salary: {
        basic,
        hra,
        medicalAllowance: medical,
        conveyance,
        pfDeduction: pf,
        esiDeduction: 0,
        tds,
      },
    };

    await putToStore('employees', newEmp, {
      user: currentUser?.name || 'HR',
      role: currentUser?.role || 'HR',
      action: 'Add Employee Profile',
      details: `Enrolled employee ${newEmp.name} (${newEmp.employeeId}) in ${newEmp.department}`,
    });

    setIsAddEmployeeOpen(false);
  };

  return (
    <div className="space-y-5">
      <PrintHeader
        title={
          activeTab === 'employees'
            ? 'Plant Personnel Directory & Compensation Register'
            : activeTab === 'attendance'
            ? 'Daily Shift Attendance Muster Log'
            : 'Monthly Factory Payroll Sheet & Statutory Deductions'
        }
        subtitle={`${systemConfig.companyName} • Human Resources & Accounts Division`}
      />

      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Plant Personnel Attendance & Payroll Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manpower records, shift logs, EPF/ESI statutory deductions, and monthly salary slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            reportTitle={
              activeTab === 'employees'
                ? 'Personnel_Directory'
                : activeTab === 'attendance'
                ? 'Attendance_Muster_Log'
                : 'Monthly_Payroll_Sheet'
            }
          />

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('employees')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'employees' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payroll
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, ID, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {hasPermission('hr', 'create') && (
              <button
                onClick={() => setIsAddEmployeeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Add Employee Profile
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee ID & Name</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Contact Details</th>
                    <th className="px-4 py-3">Date of Joining</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((emp) => {
                    const gross =
                      emp.salary.basic +
                      emp.salary.hra +
                      emp.salary.medicalAllowance +
                      emp.salary.conveyance;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{emp.employeeId}</p>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {emp.designation}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {emp.department}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-slate-700">{emp.phone}</p>
                          <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatDate(emp.dateOfJoining)}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(gross)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="success">{emp.status}</Badge>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedEmployeeForPayslip(emp)}
                            className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredEmployees.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700">
              Shift Records for: <span className="font-bold text-blue-700">{formatDate(new Date().toISOString())}</span>
            </span>
            <button
              onClick={() => setIsLogAttendanceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Clock className="h-3.5 w-3.5" />
              Log Attendance Entry
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Hours Logged</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatDate(att.date)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{att.employeeName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{att.employeeId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={att.status === 'Present' || att.status === 'On-Duty' ? 'success' : 'danger'}>
                        {att.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{att.checkIn || '-'}</td>
                    <td className="px-4 py-3">{att.checkOut || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{att.hoursWorked || 0} hrs</td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{att.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Month Plant Payroll Sheet (October 2026)</h3>
              <p className="text-xs text-slate-500">Statutory PF deduction (12%), ESI, and TDS compliance calculation</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              Print Payroll Sheet
            </button>
          </div>

          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
              <tr>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Basic Pay</th>
                <th className="p-3">HRA</th>
                <th className="p-3">Allowances</th>
                <th className="p-3">Gross Salary</th>
                <th className="p-3">PF Deduct (12%)</th>
                <th className="p-3">TDS Deduct</th>
                <th className="p-3 text-right">Net Take-Home</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const gross = emp.salary.basic + emp.salary.hra + emp.salary.medicalAllowance + emp.salary.conveyance;
                const deductions = emp.salary.pfDeduction + emp.salary.esiDeduction + emp.salary.tds;
                const net = gross - deductions;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-3">{emp.designation}</td>
                    <td className="p-3">{formatINR(emp.salary.basic)}</td>
                    <td className="p-3">{formatINR(emp.salary.hra)}</td>
                    <td className="p-3">{formatINR(emp.salary.medicalAllowance + emp.salary.conveyance)}</td>
                    <td className="p-3 font-semibold text-slate-900">{formatINR(gross)}</td>
                    <td className="p-3 text-rose-600">-{formatINR(emp.salary.pfDeduction)}</td>
                    <td className="p-3 text-rose-600">-{formatINR(emp.salary.tds)}</td>
                    <td className="p-3 text-right font-bold text-blue-700">{formatINR(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYSLIP MODAL */}
      <Modal
        isOpen={!!selectedEmployeeForPayslip}
        onClose={() => setSelectedEmployeeForPayslip(null)}
        title="Official Monthly Salary Slip"
        subtitle={`${systemConfig.companyName} • Payroll Division`}
        maxWidth="2xl"
      >
        {selectedEmployeeForPayslip && (() => {
          const emp = selectedEmployeeForPayslip;
          const gross = emp.salary.basic + emp.salary.hra + emp.salary.medicalAllowance + emp.salary.conveyance;
          const deductions = emp.salary.pfDeduction + emp.salary.esiDeduction + emp.salary.tds;
          const net = gross - deductions;

          return (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Payslip
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase">{systemConfig.companyName}</h3>
                    <p className="text-[11px] text-slate-500">{systemConfig.plantLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-800">Payslip: October 2026</span>
                    <p className="text-[10px] text-slate-400">Generated on: 16-Oct-2026</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400">Employee Name:</span>
                    <p className="font-bold text-slate-900">{emp.name}</p>
                    <span className="text-slate-400 mt-1 block">Designation:</span>
                    <p className="font-semibold text-slate-800">{emp.designation}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Employee ID:</span>
                    <p className="font-mono font-bold text-slate-900">{emp.employeeId}</p>
                    <span className="text-slate-400 mt-1 block">Department:</span>
                    <p className="font-semibold text-slate-800">{emp.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Earnings */}
                  <div>
                    <h5 className="font-bold text-slate-900 border-b pb-1 text-[11px]">EARNINGS (₹)</h5>
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between"><span>Basic Pay:</span><span className="font-semibold">{formatINR(emp.salary.basic)}</span></div>
                      <div className="flex justify-between"><span>HRA (40%):</span><span className="font-semibold">{formatINR(emp.salary.hra)}</span></div>
                      <div className="flex justify-between"><span>Medical Allowance:</span><span className="font-semibold">{formatINR(emp.salary.medicalAllowance)}</span></div>
                      <div className="flex justify-between"><span>Conveyance:</span><span className="font-semibold">{formatINR(emp.salary.conveyance)}</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t text-slate-900">
                        <span>Total Gross:</span>
                        <span>{formatINR(gross)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h5 className="font-bold text-slate-900 border-b pb-1 text-[11px]">DEDUCTIONS (₹)</h5>
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between"><span>Provident Fund (12%):</span><span className="font-semibold text-rose-600">{formatINR(emp.salary.pfDeduction)}</span></div>
                      <div className="flex justify-between"><span>Income Tax (TDS):</span><span className="font-semibold text-rose-600">{formatINR(emp.salary.tds)}</span></div>
                      <div className="flex justify-between"><span>ESI / Insurance:</span><span className="font-semibold">₹0</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t text-rose-700">
                        <span>Total Deductions:</span>
                        <span>{formatINR(deductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 flex justify-between items-center text-sm font-bold text-blue-950 mt-4">
                  <span>Net Take-Home Salary:</span>
                  <span className="text-lg text-blue-800">{formatINR(net)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* LOG ATTENDANCE MODAL */}
      <Modal
        isOpen={isLogAttendanceOpen}
        onClose={() => setIsLogAttendanceOpen(false)}
        title="Log Employee Attendance"
        subtitle="Daily shift muster record"
        maxWidth="md"
      >
        <form onSubmit={handleLogAttendance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employee *</label>
            <select
              name="employeeId"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            >
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name} ({e.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              name="status"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            >
              <option value="Present">Present (Full Day)</option>
              <option value="On-Duty">On-Duty (Hospital Client Visit)</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Leave">Sanctioned Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check In</label>
              <input
                type="text"
                name="checkIn"
                defaultValue="09:00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check Out</label>
              <input
                type="text"
                name="checkOut"
                defaultValue="18:00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              name="remarks"
              placeholder="e.g. On-site installation at PGIMER"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsLogAttendanceOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD EMPLOYEE MODAL */}
      <Modal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        title="Enroll Employee Profile"
        subtitle="Human Resources Department record"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
              <input
                type="text"
                name="designation"
                required
                placeholder="Senior Biomedical Engineer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                name="department"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Production">Production & Assembly</option>
                <option value="Quality Control">Quality Control & Regulatory</option>
                <option value="Sales & Tenders">Sales & Tenders</option>
                <option value="Service Engineering">Service Engineering</option>
                <option value="Warehouse">Warehouse & Logistics</option>
                <option value="Accounts">Accounts & Finance</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                name="email"
                placeholder="employee@bharatmedtech.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="+91 98XXX XXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Joining</label>
              <input
                type="date"
                name="dateOfJoining"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Basic Pay (₹) *</label>
              <input
                type="number"
                name="basic"
                defaultValue={45000}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly TDS Deduction (₹)</label>
              <input
                type="number"
                name="tds"
                defaultValue={3500}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(false)}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Enroll Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
