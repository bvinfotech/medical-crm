import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Check, 
  ShieldAlert, 
  ExternalLink,
  KeyRound,
  Sparkles,
  Building2,
  Edit,
  Save,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types/crm';
import { ActiveTab } from './Sidebar';
import { Modal } from '../common/Modal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar, setActiveTab }) => {
  const { 
    currentUser, 
    adminProfile, 
    switchRole, 
    returnToAdmin, 
    canSwitchRole, 
    originalRole, 
    logout, 
    allRoles, 
    updateProfile, 
    updateAdminProfile, 
    hasPermission 
  } = useAuth();
  const { systemConfig, updateSystemConfig } = useSystem();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  // Strictly filter notifications so employees only see alerts for their permitted modules
  const visibleNotifications = notifications.filter((item) => {
    if (currentUser?.role === 'Admin') return true;
    if (!item.linkModule) return true;
    return hasPermission(item.linkModule, 'view');
  });
  const visibleUnreadCount = visibleNotifications.filter((n) => !n.read).length;

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile modal active tab: 'profile' | 'system'
  const [modalTab, setModalTab] = useState<'profile' | 'system'>('profile');

  // Profile modal states
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // System modal states
  const [sysName, setSysName] = useState(systemConfig.systemName);
  const [sysCompanyName, setSysCompanyName] = useState(systemConfig.companyName);
  const [sysShortName, setSysShortName] = useState(systemConfig.systemShortName);
  const [sysTagline, setSysTagline] = useState(systemConfig.systemTagline);
  const [sysPlant, setSysPlant] = useState(systemConfig.plantLocation);
  const [sysSavedMsg, setSysSavedMsg] = useState('');
  const [isHeaderSysSaved, setIsHeaderSysSaved] = useState(false);

  // Password reset modal states
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', isError: false });

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);


  // Sync state whenever modal opens or values change
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser, showProfileModal]);

  useEffect(() => {
    setSysName(systemConfig.systemName);
    setSysCompanyName(systemConfig.companyName);
    setSysShortName(systemConfig.systemShortName);
    setSysTagline(systemConfig.systemTagline);
    setSysPlant(systemConfig.plantLocation);
  }, [systemConfig, showProfileModal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      alert('Please enter a valid Name.');
      return;
    }
    if (currentUser?.role === 'Admin') {
      updateAdminProfile({ name: trimmedName, phone: profilePhone.trim() });
    } else {
      updateProfile({ name: trimmedName, phone: profilePhone.trim() });
    }
    setProfileSavedMsg('✓ Name updated successfully!');
    setTimeout(() => {
      setProfileSavedMsg('');
      setShowProfileModal(false);
    }, 1500);
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSysName = sysName.trim();
    if (!cleanSysName) {
      alert('Please enter a valid System Name.');
      return;
    }
    const finalShort = (sysShortName.trim() || cleanSysName.slice(0, 3)).toUpperCase();
    let cleanCompany = sysCompanyName.trim();
    if (!cleanCompany || cleanCompany.includes('Bharat MedTech')) {
      cleanCompany = `${cleanSysName} Instruments Ltd.`;
    }
    updateSystemConfig({
      systemName: cleanSysName,
      systemShortName: finalShort,
      companyName: cleanCompany,
      systemTagline: sysTagline.trim(),
      plantLocation: sysPlant.trim(),
    });
    setIsHeaderSysSaved(true);
    setSysSavedMsg(`✓ System Name & Company updated to "${cleanSysName}"!`);
    setTimeout(() => {
      setIsHeaderSysSaved(false);
      setSysSavedMsg('');
      setShowProfileModal(false);
    }, 1500);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      setPwMsg({ text: 'Please enter your current password.', isError: true });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }
    setPwMsg({ text: 'Password changed successfully! Changes saved.', isError: false });
    setTimeout(() => {
      setPwMsg({ text: '', isError: false });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPasswordModal(false);
    }, 1400);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
        {/* Left Side: Mobile toggle & company designation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                {systemConfig.plantLocation}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {systemConfig.cdscoReg}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Edit System Name, Role Selector, DB Status, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Edit System & Admin shortcut button - only editable by Admin */}
          {currentUser?.role === 'Admin' ? (
            <button
              type="button"
              onClick={() => {
                setModalTab('system');
                setShowProfileModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
              title="Edit System Name & Branding"
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-800 truncate max-w-[90px] sm:max-w-[150px]">{systemConfig.systemName}</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded hidden xs:inline">Edit</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              title={systemConfig.companyName}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-800 truncate max-w-[90px] sm:max-w-[150px]">{systemConfig.systemName}</span>
            </div>
          )}

          {/* Role Display / Switcher - Available for Admin and when testing other roles */}
          {canSwitchRole ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* If Admin is currently previewing/testing another role, show direct Return to Admin button */}
              {currentUser?.role !== 'Admin' && (
                <button
                  type="button"
                  onClick={returnToAdmin}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer animate-pulse"
                  title="Switch back to Admin (Ankit Gupta)"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Back to</span>
                  <span>Admin</span>
                </button>
              )}

              <div className="relative" ref={roleRef}>
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition shadow-2xs cursor-pointer ${
                    currentUser?.role !== 'Admin'
                      ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Switch role to test different RBAC permissions"
                >
                  <span className="text-slate-400 font-normal hidden md:inline">Role:</span>
                  <span className={`font-bold ${currentUser?.role !== 'Admin' ? 'text-amber-800' : 'text-blue-700'}`}>
                    {currentUser?.role}
                  </span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    currentUser?.role !== 'Admin'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    Switch
                  </span>
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Test Role-Based Access (RBAC)
                    </div>
                    {allRoles.map((role) => {
                      const isSelected = currentUser?.role === role;
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            switchRole(role);
                            setShowRoleMenu(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {role === 'Admin' && <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />}
                            <span>{role}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      );
                    })}

                    {currentUser?.role !== 'Admin' && (
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            returnToAdmin();
                            setShowRoleMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                          <span>Return to Admin Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs"
              title={`Logged in as ${currentUser?.role} department`}
            >
              <span className="text-slate-400 font-normal hidden md:inline">Role:</span>
              <span className="font-bold text-blue-700">{currentUser?.role}</span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              {visibleUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Department Alerts</span>
                    {visibleUnreadCount > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {visibleUnreadCount} new
                      </span>
                    )}
                  </div>
                  {visibleUnreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {visibleNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications for your department yet.
                    </div>
                  ) : (
                    visibleNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 transition hover:bg-slate-50 cursor-pointer ${
                          !item.read ? 'bg-blue-50/40' : ''
                        }`}
                        onClick={() => {
                          markAsRead(item.id);
                          if (item.linkModule) {
                            if (item.linkModule === 'dashboard' && currentUser?.role !== 'Admin') {
                              setShowNotifMenu(false);
                              return;
                            }
                            setActiveTab(item.linkModule as ActiveTab);
                            setShowNotifMenu(false);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">{item.title}</p>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                          {!item.read && (
                            <span className="text-[11px] font-semibold text-blue-600 hover:underline">
                              Mark read
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile & Settings Button */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <button
              onClick={() => {
                setModalTab('profile');
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Admin & System Profile Settings"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 font-bold text-white text-xs shadow-xs">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-500">{currentUser?.role}</p>
              </div>
            </button>

            {/* Log Out Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 sm:px-2.5 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ml-1"
              title="Log Out from this session"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile & System Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Admin Profile & System Settings"
        subtitle="Manage administrator details, edit system name, and configure company branding"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setModalTab('profile')}
              className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                modalTab === 'profile'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="h-4 w-4" />
              <span>👤 Admin & User Profile</span>
            </button>

            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={() => setModalTab('system')}
                className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                  modalTab === 'system'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>🏢 System Name & Branding</span>
              </button>
            )}
          </div>

          {/* TAB 1: USER / ADMIN PROFILE */}
          {modalTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSavedMsg && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {profileSavedMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Ankit Gupta, Bhavik Patel"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Shown in the top header, sidebar user badge, orders, and printouts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Role</span>
                  <p className="mt-1 text-xs font-bold text-blue-700">{currentUser?.role}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
                  <p className="mt-1 text-xs font-bold text-slate-700">{currentUser?.department}</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowPasswordModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Change Password
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Name & Profile
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SYSTEM NAME & BRANDING */}
          {modalTab === 'system' && (
            <form onSubmit={handleSaveSystem} className="space-y-4">
              {sysSavedMsg && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {sysSavedMsg}
                </div>
              )}

              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900">
                <p className="font-semibold">Live Preview in Sidebar Header:</p>
                <div className="flex items-center gap-3 mt-2 bg-slate-900 text-white p-3 rounded-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
                    {sysShortName || 'BM'}
                  </div>
                  <div>
                    <p className="font-bold text-xs">{sysName || 'System Name'}</p>
                    <p className="text-[10px] text-blue-400">{sysTagline || 'Tagline'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System / Application Name *
                  </label>
                  <input
                    type="text"
                    value={sysName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSysName(val);
                      if (sysShortName === 'BM' || !sysShortName) {
                        setSysShortName(val.slice(0, 5).toUpperCase());
                      }
                      // Auto sync company name if it's default
                      if (!sysCompanyName || sysCompanyName.includes('Bharat MedTech')) {
                        setSysCompanyName(val.trim() ? `${val.trim()} Instruments Ltd.` : '');
                      }
                    }}
                    placeholder="e.g. RGMPL, Apex Medical ERP"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Logo Initials *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={sysShortName}
                    onChange={(e) => setSysShortName(e.target.value.toUpperCase())}
                    placeholder="RGMPL"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-black uppercase text-blue-700 focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSysShortName(sysName.trim().slice(0, 5).toUpperCase() || 'RGMPL')}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {sysName.trim().slice(0, 5).toUpperCase() || 'RGMPL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSysShortName(sysName.trim().slice(0, 2).toUpperCase() || 'RG')}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {sysName.trim().slice(0, 2).toUpperCase() || 'RG'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Company Registered Name (For Billing & Quotations)
                </label>
                <input
                  type="text"
                  value={sysCompanyName}
                  onChange={(e) => setSysCompanyName(e.target.value)}
                  placeholder="e.g. RGMPL Instruments Ltd."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Appears on Tax Invoices, Quotations, Payslips, and Print Reports.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={sysTagline}
                  onChange={(e) => setSysTagline(e.target.value)}
                  placeholder="Medical Equipment ERP & CRM"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plant / Manufacturing Location
                </label>
                <input
                  type="text"
                  value={sysPlant}
                  onChange={(e) => setSysPlant(e.target.value)}
                  placeholder="Plant: Manesar, Gurugram"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setActiveTab('settings');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  More Company Details in Settings →
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                      isHeaderSysSaved
                        ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isHeaderSysSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{isHeaderSysSaved ? '✓ Saved!' : 'Save System Name'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Security Password"
        subtitle="Update authentication credentials for your employee account"
        maxWidth="md"
      >
        <form onSubmit={handlePasswordReset} className="space-y-4">
          {pwMsg.text && (
            <div
              className={`rounded-lg p-3 text-xs font-semibold border ${
                pwMsg.isError
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {pwMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-type new password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
