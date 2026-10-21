import React, { useState, useEffect } from 'react';
import { SystemProvider } from './context/SystemContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPortal } from './components/auth/LoginPortal';
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

import { UserRole } from './types/crm';

const getDefaultTabForRole = (role: UserRole): ActiveTab => {
  switch (role) {
    case 'Admin':
      return 'dashboard';
    case 'Sales':
      return 'leads';
    case 'Tender Manager':
      return 'tenders';
    case 'Inventory Manager':
      return 'inventory';
    case 'Accounts':
      return 'dispatch';
    case 'HR':
      return 'hr';
    case 'Service':
      return 'service';
    default:
      return 'leads';
  }
};

function MainAppLayout() {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const prevRoleRef = React.useRef<string | null>(null);

  // Sync default tab ONLY when role changes (login or role switch)
  useEffect(() => {
    if (!currentUser) {
      prevRoleRef.current = null;
      return;
    }

    // When role changes (e.g. login or role switch), set initial default tab for that role
    if (prevRoleRef.current !== currentUser.role) {
      prevRoleRef.current = currentUser.role;
      setActiveTab(getDefaultTabForRole(currentUser.role));
      return;
    }

    // Role has not changed. Guard against non-admin accessing unauthorized tab or Admin Dashboard
    if (currentUser.role !== 'Admin') {
      if (activeTab === 'dashboard' || !hasPermission(activeTab, 'view')) {
        setActiveTab(getDefaultTabForRole(currentUser.role));
      }
    }
  }, [currentUser?.role, activeTab, hasPermission]);

  // If not logged in, show dedicated multi-role login portal
  if (!currentUser) {
    return <LoginPortal />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Navigation with Role Filtering */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header with Role Portal Badge & Quick Controls */}
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Page View based on Role Permissions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && currentUser?.role === 'Admin' && hasPermission('dashboard', 'view') && (
              <AdminDashboard setActiveTab={setActiveTab} />
            )}
            {activeTab === 'leads' && hasPermission('leads', 'view') && (
              <LeadManagement />
            )}
            {activeTab === 'dealers' && hasPermission('dealers', 'view') && (
              <DealerManagement />
            )}
            {activeTab === 'tenders' && hasPermission('tenders', 'view') && (
              <TenderManagement />
            )}
            {activeTab === 'quotations' && hasPermission('quotations', 'view') && (
              <QuotationManagement />
            )}
            {activeTab === 'emd-pbg' && hasPermission('emd-pbg', 'view') && (
              <EmdPbgTracker />
            )}
            {activeTab === 'inventory' && hasPermission('inventory', 'view') && (
              <InventoryManagement />
            )}
            {activeTab === 'quality' && hasPermission('quality', 'view') && (
              <QualityCompliance />
            )}
            {activeTab === 'dispatch' && hasPermission('dispatch', 'view') && (
              <DispatchBilling />
            )}
            {activeTab === 'service' && hasPermission('service', 'view') && (
              <AfterSalesService />
            )}
            {activeTab === 'hr' && hasPermission('hr', 'view') && (
              <HrPayroll />
            )}
            {activeTab === 'settings' && hasPermission('settings', 'view') && (
              <SettingsAndConfig />
            )}
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
