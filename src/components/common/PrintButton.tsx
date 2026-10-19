import React from 'react';
import { Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';

interface PrintButtonProps {
  label?: string;
  reportTitle?: string;
  className?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  label = 'Print / PDF',
  reportTitle,
  className = '',
}) => {
  const { systemConfig } = useSystem();

  const handlePrint = () => {
    const originalTitle = document.title;
    if (reportTitle) {
      document.title = `${reportTitle} - ${systemConfig.systemName} CRM`;
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs ${className}`}
      title="Print table or save directly as PDF"
    >
      <Printer className="h-3.5 w-3.5 text-slate-500" />
      <span>{label}</span>
    </button>
  );
};

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ title, subtitle }) => {
  const { currentUser } = useAuth();
  const { systemConfig } = useSystem();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="hidden print:block print-header-banner">
      <div className="flex justify-between items-start border-b border-slate-900 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-blue-900 uppercase tracking-tight">
              {systemConfig.companyName}
            </span>
            <span className="text-[10px] text-slate-500">
              | {systemConfig.plantLocation}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">{title}</h2>
          {subtitle && <p className="text-[10px] text-slate-600">{subtitle}</p>}
        </div>

        <div className="text-right text-[9pt] text-slate-600">
          <p className="font-semibold text-slate-900">Official Enterprise System Report</p>
          <p>Generated: {currentDate}</p>
          <p>User: {currentUser?.name || 'Authorized Staff'} ({currentUser?.role || 'Admin'})</p>
          <p className="text-[8pt] text-slate-500">{systemConfig.cdscoReg} • {systemConfig.isoCert}</p>
        </div>
      </div>
    </div>
  );
};
