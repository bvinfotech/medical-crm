import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  Boxes, 
  UserCheck, 
  Award, 
  Truck, 
  Wrench, 
  Settings, 
  FileCheck2,
  ChevronRight,
  Database,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';

export type ActiveTab = 
  | 'dashboard'
  | 'leads'
  | 'dealers'
  | 'tenders'
  | 'quotations'
  | 'emd-pbg'
  | 'inventory'
  | 'hr'
  | 'quality'
  | 'dispatch'
  | 'service'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentUser, hasPermission, logout } = useAuth();
  const { systemConfig } = useSystem();

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Admin Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      ],
    },
    {
      title: 'COMMERCIAL & TENDERS',
      items: [
        { id: 'leads' as ActiveTab, label: 'Leads & Inquiries', icon: Users, module: 'leads' },
        { id: 'dealers' as ActiveTab, label: 'Dealer Network', icon: Briefcase, module: 'dealers' },
        { id: 'tenders' as ActiveTab, label: 'Government Tenders', icon: FileCheck2, module: 'tenders' },
        { id: 'quotations' as ActiveTab, label: 'Quotations & Bids', icon: FileText, module: 'quotations' },
        { id: 'emd-pbg' as ActiveTab, label: 'EMD & PBG Tracker', icon: ShieldCheck, module: 'emd-pbg' },
      ],
    },
    {
      title: 'MANUFACTURING & OPERATIONS',
      items: [
        { id: 'inventory' as ActiveTab, label: 'Inventory & Stock', icon: Boxes, module: 'inventory' },
        { id: 'quality' as ActiveTab, label: 'Quality & Compliance', icon: Award, module: 'quality' },
        { id: 'dispatch' as ActiveTab, label: 'Dispatch & Billing', icon: Truck, module: 'dispatch' },
      ],
    },
    {
      title: 'ENTERPRISE & SERVICE',
      items: [
        { id: 'service' as ActiveTab, label: 'After-Sales Service', icon: Wrench, module: 'service' },
        { id: 'hr' as ActiveTab, label: 'HR & Payroll', icon: UserCheck, module: 'hr' },
        { id: 'settings' as ActiveTab, label: 'Database & Settings', icon: Database, module: 'settings' },
      ],
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div
          onClick={() => {
            if (currentUser?.role === 'Admin' && hasPermission('settings', 'view')) {
              handleSelect('settings');
            }
          }}
          className={`flex h-16 shrink-0 w-full text-left items-center gap-3 border-b border-slate-800 px-6 bg-slate-950/40 ${
            currentUser?.role === 'Admin' && hasPermission('settings', 'view')
              ? 'hover:bg-slate-800/40 transition group cursor-pointer'
              : 'cursor-default'
          }`}
          title={currentUser?.role === 'Admin' ? "Click to view & edit System Name and Settings" : systemConfig.systemName}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform ${
            (systemConfig.systemShortName || '').length <= 2 
              ? 'text-base' 
              : (systemConfig.systemShortName || '').length <= 4 
                ? 'text-xs tracking-tight' 
                : 'text-[10px] tracking-tighter'
          }`}>
            {systemConfig.systemShortName || 'RGMPL'}
          </div>
          <div className="overflow-hidden flex-1">
            <h1 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-blue-300 transition-colors">
              {systemConfig.systemName}
            </h1>
            <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wider truncate">
              {systemConfig.systemTagline}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (item.id === 'dashboard' && currentUser?.role !== 'Admin') {
                return false;
              }
              return hasPermission(item.module, 'view');
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-200" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Card & Logout in Bottom of Sidebar */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/40 space-y-2">
          <div
            onClick={() => {
              if (currentUser?.role === 'Admin' && hasPermission('settings', 'view')) {
                handleSelect('settings');
              }
            }}
            className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between group ${
              currentUser?.role === 'Admin' && hasPermission('settings', 'view')
                ? 'hover:bg-slate-800/60 cursor-pointer'
                : 'cursor-default'
            }`}
            title={currentUser?.role === 'Admin' ? "Click to view System Settings" : `${currentUser?.name} (${currentUser?.role})`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white shadow-xs group-hover:scale-105 transition">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition">{currentUser?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.role}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-rose-950/40 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs font-semibold transition cursor-pointer"
            title="Log out and switch role portal"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Switch Role Portal / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
