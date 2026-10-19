import React, { useState } from 'react';
import { SystemProvider } from './context/SystemContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { LeadManagement } from './components/leads/LeadManagement';
import { DealerManagement } from './components/dealers/DealerManagement';
import { TenderManagement } from './components/tenders/TenderManagement';
import { QuotationManagement } from './components/quotations/QuotationManagement';
import { EmdPbgTracker } from './components/emd/EmdPbgTracker';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { HrPayroll } from './components/hr/HrPayroll';
import { QualityCompliance } from './components/quality/QualityCompliance';
import { DispatchBilling } from './components/dispatch/DispatchBilling';
import { AfterSalesService } from './components/service/AfterSalesService';
import { SettingsAndConfig } from './components/settings/SettingsAndConfig';

function MainAppLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && <AdminDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'leads' && <LeadManagement />}
            {activeTab === 'dealers' && <DealerManagement />}
            {activeTab === 'tenders' && <TenderManagement />}
            {activeTab === 'quotations' && <QuotationManagement />}
            {activeTab === 'emd-pbg' && <EmdPbgTracker />}
            {activeTab === 'inventory' && <InventoryManagement />}
            {activeTab === 'quality' && <QualityCompliance />}
            {activeTab === 'dispatch' && <DispatchBilling />}
            {activeTab === 'service' && <AfterSalesService />}
            {activeTab === 'hr' && <HrPayroll />}
            {activeTab === 'settings' && <SettingsAndConfig />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainAppLayout />
        </NotificationProvider>
      </AuthProvider>
    </SystemProvider>
  );
}
