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

function MainAppLayout() {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Set default permitted active tab whenever role changes or guard against unauthorized module access
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'Admin' && (!hasPermission(activeTab, 'view') || activeTab === 'dashboard')) {
        switch (currentUser.role) {
          case 'Sales':
            setActiveTab('leads');
            break;
          case 'Tender Manager':
            setActiveTab('tenders');
            break;
          case 'Inventory Manager':
            setActiveTab('inventory');
            break;
          case 'Accounts':
            setActiveTab('dispatch');
            break;
          case 'HR':
            setActiveTab('hr');
            break;
          case 'Service':
            setActiveTab('service');
            break;
          default:
            setActiveTab('leads');
        }
        return;
      }

      switch (currentUser.role) {
        case 'Admin':
          setActiveTab('dashboard');
          break;
        case 'Sales':
          setActiveTab('leads');
          break;
        case 'Tender Manager':
          setActiveTab('tenders');
          break;
        case 'Inventory Manager':
          setActiveTab('inventory');
          break;
        case 'Accounts':
          setActiveTab('dispatch');
          break;
        case 'HR':
          setActiveTab('hr');
          break;
        case 'Service':
          setActiveTab('service');
          break;
        default:
          setActiveTab('leads');
      }
    }
  }, [currentUser?.role, activeTab]);

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
