import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode,
  Copy,
  Check,
  Server,
  Cloud,
  Building2,
  User,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  RefreshCw,
  Save,
  CheckCircle
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  testFirestoreConnection 
} from '../../services/firebaseClient';
import { exportFullDatabase, importFullDatabase, resetDatabaseToSeed } from '../../services/db';
import { FirebaseConnectionConfig } from '../../types/crm';
import { useAuth } from '../../context/AuthContext';
import { useSystem, SystemConfig, DEFAULT_SYSTEM_CONFIG } from '../../context/SystemContext';

function generateMonogramSuggestions(name: string, company: string): string[] {
  const suggestions = new Set<string>();
  
  if (name && name.trim()) {
    const clean = name.trim();
    // 1. Acronym or short name directly (e.g. RGMPL)
    if (clean.length <= 6 && !clean.includes(' ')) {
      suggestions.add(clean.toUpperCase());
    }
    // 2. First 2 characters
    if (clean.length >= 2) {
      suggestions.add(clean.slice(0, 2).toUpperCase());
    }
    // 3. First letters of each word
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      suggestions.add(words.map(w => w[0]).join('').slice(0, 5).toUpperCase());
    }
  }

  if (company && company.trim()) {
    const compWords = company.trim().split(/\s+/).filter(w => 
      !['ltd', 'pvt', 'private', 'limited', 'inc', 'corp', 'and', '&', 'the'].includes(w.toLowerCase())
    );
    if (compWords.length >= 2) {
      suggestions.add(compWords.map(w => w[0]).join('').slice(0, 5).toUpperCase());
    }
  }

  suggestions.add('BM');
  return Array.from(suggestions).filter(s => s.length > 0 && s.length <= 6).slice(0, 5);
}

export const SettingsAndConfig: React.FC = () => {
  const { currentUser, adminProfile, updateAdminProfile, resetAdminProfile } = useAuth();
  const { systemConfig, updateSystemConfig, resetSystemConfig } = useSystem();

  const [activeTab, setActiveTab] = useState<'branding' | 'admin' | 'database'>('branding');

  // System Config Form State
  const [sysForm, setSysForm] = useState(systemConfig);
  const [sysSavedMsg, setSysSavedMsg] = useState('');
  const [isSysSaved, setIsSysSaved] = useState(false);

  // Admin Profile Form State
  const [adminForm, setAdminForm] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
    phone: adminProfile.phone || '',
    department: adminProfile.department || '',
  });
  const [adminSavedMsg, setAdminSavedMsg] = useState('');
  const [isAdminSaved, setIsAdminSaved] = useState(false);

  // Floating Toast State
  const [toast, setToast] = useState<{ title: string; desc: string; icon?: string } | null>(null);

  // Firebase Config State
  const [config, setConfig] = useState<FirebaseConnectionConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [savedConfigActive, setSavedConfigActive] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  // Sync state if context changes externally
  useEffect(() => {
    setSysForm(systemConfig);
  }, [systemConfig]);

  useEffect(() => {
    setAdminForm({
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone || '',
      department: adminProfile.department || '',
    });
  }, [adminProfile]);

  useEffect(() => {
    const existing = getStoredFirebaseConfig();
    if (existing) {
      setConfig(existing);
      setSavedConfigActive(true);
    }
  }, []);

  const triggerToast = (title: string, desc: string, icon = '✓') => {
    setToast({ title, desc, icon });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle System Name Input Change with Smart Monogram Generation and Company Name Auto-Sync
  const handleSystemNameChange = (newName: string) => {
    setSysForm(prev => {
      // Auto-generate monogram if monogram is empty or default 'BM'
      const isDefaultOrEmpty = !prev.systemShortName || prev.systemShortName === 'BM';
      let nextShort = prev.systemShortName;
      if (isDefaultOrEmpty && newName.trim().length > 0) {
        const words = newName.trim().split(/\s+/).filter(Boolean);
        nextShort = words.length >= 2 
          ? (words[0][0] + words[1][0]).toUpperCase() 
          : newName.trim().slice(0, 4).toUpperCase();
      }

      // Automatically sync companyName if it was default or linked to previous systemName
      let nextCompanyName = prev.companyName;
      if (
        !prev.companyName || 
        prev.companyName === DEFAULT_SYSTEM_CONFIG.companyName || 
        prev.companyName.includes('Bharat MedTech') ||
        prev.companyName === `${prev.systemName} Instruments Ltd.` ||
        prev.companyName === `${prev.systemName} Ltd.`
      ) {
        nextCompanyName = newName.trim() ? `${newName.trim()} Instruments Ltd.` : '';
      }

      return {
        ...prev,
        systemName: newName,
        systemShortName: nextShort,
        companyName: nextCompanyName,
      };
    });
  };

  // System form save handler - robust, non-blocking, works from any button
  const handleSaveSystemConfig = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanSysName = (sysForm.systemName || '').trim();
    if (!cleanSysName) {
      alert('Please enter a valid System / Application Name.');
      return;
    }
    const finalShort = ((sysForm.systemShortName || '').trim() || cleanSysName.slice(0, 3)).toUpperCase();
    let cleanCompanyName = (sysForm.companyName || '').trim();
    if (!cleanCompanyName || cleanCompanyName === DEFAULT_SYSTEM_CONFIG.companyName || cleanCompanyName.includes('Bharat MedTech')) {
      cleanCompanyName = `${cleanSysName} Instruments Ltd.`;
    }

    const finalForm: SystemConfig = {
      ...sysForm,
      systemName: cleanSysName,
      systemShortName: finalShort,
      companyName: cleanCompanyName,
      plantLocation: (sysForm.plantLocation || '').trim() || 'Plant: Manesar, Gurugram',
    };

    updateSystemConfig(finalForm);
    setIsSysSaved(true);
    setSysSavedMsg(`✓ System Name & Branding successfully updated to "${finalForm.systemName}"!`);
    triggerToast(
      'System Branding Saved!', 
      `"${finalForm.systemName}" (${finalForm.systemShortName}) is active across all 12 modules.`,
      finalForm.systemShortName
    );

    setTimeout(() => {
      setIsSysSaved(false);
    }, 4500);
    setTimeout(() => {
      setSysSavedMsg('');
    }, 6000);
  };

  const handleResetSystemConfig = () => {
    if (confirm('Reset system name and company branding back to default values?')) {
      resetSystemConfig();
      setIsSysSaved(true);
      setSysSavedMsg('System configuration reset to RGMPL defaults!');
      triggerToast('Reset to Defaults', 'System name reset to RGMPL.');
      setTimeout(() => {
        setIsSysSaved(false);
        setSysSavedMsg('');
      }, 3500);
    }
  };

  // Admin form save handler - robust, non-blocking
  const handleSaveAdminProfile = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanAdminName = (adminForm.name || '').trim();
    if (!cleanAdminName) {
      alert('Please enter an Admin Name.');
      return;
    }
    const updated = {
      name: cleanAdminName,
      phone: (adminForm.phone || '').trim(),
      department: (adminForm.department || '').trim() || 'Executive Management',
    };
    updateAdminProfile(updated);
    setIsAdminSaved(true);
    setAdminSavedMsg(`✓ Admin profile successfully updated to "${updated.name}"!`);
    triggerToast('Admin Profile Saved!', `Administrator name changed to "${updated.name}".`);

    setTimeout(() => {
      setIsAdminSaved(false);
    }, 4500);
    setTimeout(() => {
      setAdminSavedMsg('');
    }, 6000);
  };

  const handleResetAdminProfile = () => {
    if (confirm('Reset Admin name and profile back to system default?')) {
      resetAdminProfile();
      setIsAdminSaved(true);
      setAdminSavedMsg('Admin profile reset to Vikramaditya Roy default!');
      setTimeout(() => {
        setIsAdminSaved(false);
        setAdminSavedMsg('');
      }, 3500);
    }
  };

  // Firebase Handlers
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSavedConfigActive(true);
    setTestResult({ success: true, message: 'Firebase configuration saved in browser storage!' });
    triggerToast('Firebase Saved', 'Cloud Firestore configuration saved.');
  };

  const handleClearConfig = () => {
    clearFirebaseConfig();
    setConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    });
    setSavedConfigActive(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const res = await testFirestoreConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleExportBackup = async () => {
    const json = await exportFullDatabase({
      systemName: systemConfig.systemName,
      companyName: systemConfig.companyName,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = (systemConfig.systemName || 'CRM').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${sanitizedName}_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBackupMsg('Complete database exported to JSON file successfully!');
    triggerToast('Backup Exported', 'Full JSON database backup downloaded.');
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await importFullDatabase(content);
      if (res.success) {
        setBackupMsg('Database restored successfully from backup file!');
        triggerToast('Database Restored', 'All business records successfully restored.');
      } else {
        alert(res.message);
      }
      setTimeout(() => setBackupMsg(''), 4000);
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('Warning: This will reset all 12 modules back to the initial manufacturing factory seed data. Any newly entered items will be overwritten. Proceed?')) {
      await resetDatabaseToSeed();
      setBackupMsg('Database reset to authentic Indian Medical Manufacturing factory seed records!');
      triggerToast('Factory Reset', 'Database reset to initial factory sample records.');
      setTimeout(() => setBackupMsg(''), 4000);
    }
  };

  const monogramSuggestions = generateMonogramSuggestions(sysForm.systemName, sysForm.companyName);

  return (
    <div className="space-y-6 max-w-5xl relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-black text-xs shadow-sm">
            {toast.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{toast.title}</p>
            <p className="text-[11px] text-slate-300">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          System & Enterprise Administration Center
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize System Name & Branding, update Admin profile credentials, and configure database persistence.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'branding'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>🏢 System Name & Company Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'admin'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <User className="h-4 w-4" />
          <span>👤 Admin Profile & Name Settings</span>
        </button>

        {/* Temporarily hidden: Database & Cloud Sync tab. Remove the `false &&` to restore. */}
        {false && (
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'database'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Cloud className="h-4 w-4" />
            <span>☁️ Database & Cloud Sync</span>
          </button>
        )}
      </div>

      {/* TAB 1: SYSTEM NAME & BRANDING */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {sysSavedMsg && (
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{sysSavedMsg}</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2.5 py-1 rounded-md font-bold uppercase">
                Active in All Views
              </span>
            </div>
          )}

          {/* Live Preview Card with Top Save Button */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-900 to-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-blue-800/80 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Live Branding Preview (Sidebar, Top Bar & Quotations)
              </span>
              <span className="text-[10px] bg-blue-800/60 px-2 py-0.5 rounded text-blue-200 font-semibold">
                Updates in real-time
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30 ${
                  (sysForm.systemShortName || '').length <= 2 
                    ? 'text-xl' 
                    : (sysForm.systemShortName || '').length <= 4 
                      ? 'text-sm tracking-tight' 
                      : 'text-xs tracking-tighter'
                }`}>
                  {sysForm.systemShortName || 'BM'}
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="text-lg font-black tracking-tight text-white truncate">
                    {sysForm.systemName || 'Your System Name'}
                  </h3>
                  <p className="text-xs text-blue-300 font-medium truncate">
                    {sysForm.systemTagline || 'Medical Equipment ERP & CRM'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-300 mt-1.5">
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {sysForm.plantLocation}
                    </span>
                    <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-semibold">
                      {sysForm.cdscoReg}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Top Save Button */}
              <button
                type="button"
                onClick={handleSaveSystemConfig}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer shrink-0 ${
                  isSysSaved
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'
                }`}
              >
                {isSysSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span>{isSysSaved ? '✓ Saved!' : 'Save System Name & Branding'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <form onSubmit={handleSaveSystemConfig} className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Application Branding & Identification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These names appear on the top navigation bar, left sidebar, browser title, and printed paperwork.
                  </p>
                </div>
                {isSysSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System / Application Name *
                  </label>
                  <input
                    type="text"
                    value={sysForm.systemName}
                    onChange={(e) => handleSystemNameChange(e.target.value)}
                    placeholder="e.g. RGMPL, Bharat MedTech, Apex Medical ERP"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Displayed prominently on sidebar, browser title, and notifications.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Monogram / Initials (Logo Badge) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={sysForm.systemShortName}
                    onChange={(e) => setSysForm({ ...sysForm, systemShortName: e.target.value.toUpperCase() })}
                    placeholder="RGMPL"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-black uppercase text-blue-700 focus:border-blue-600 focus:outline-hidden"
                  />
                  
                  {/* Clickable Monogram Suggestions */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Quick Pick:</span>
                    {monogramSuggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSysForm(prev => ({ ...prev, systemShortName: s }))}
                        className={`px-2 py-0.5 text-[10px] font-black rounded border transition cursor-pointer ${
                          sysForm.systemShortName === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title={`Set monogram to "${s}"`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={sysForm.systemTagline}
                    onChange={(e) => setSysForm({ ...sysForm, systemTagline: e.target.value })}
                    placeholder="Medical Equipment ERP & CRM"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Manufacturing Company & Statutory Details
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Used on official quotation letterheads, delivery challans, and printed reports.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Legal Registered Entity Name
                    </label>
                    <input
                      type="text"
                      value={sysForm.companyName}
                      onChange={(e) => setSysForm({ ...sysForm, companyName: e.target.value })}
                      placeholder="e.g. Rishigyan Medtech Private Limited"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={sysForm.gstin}
                      onChange={(e) => setSysForm({ ...sysForm, gstin: e.target.value })}
                      placeholder="07AABCB1234F1Z8"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Manufacturing Plant Location
                    </label>
                    <input
                      type="text"
                      value={sysForm.plantLocation}
                      onChange={(e) => setSysForm({ ...sysForm, plantLocation: e.target.value })}
                      placeholder="Plant: Manesar, Gurugram"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CDSCO Medical Device Reg No.
                    </label>
                    <input
                      type="text"
                      value={sysForm.cdscoReg}
                      onChange={(e) => setSysForm({ ...sysForm, cdscoReg: e.target.value })}
                      placeholder="CDSCO Reg: MFG/MD/2022/000492"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Factory / Office Street Address
                    </label>
                    <input
                      type="text"
                      value={sysForm.address}
                      onChange={(e) => setSysForm({ ...sysForm, address: e.target.value })}
                      placeholder="Plot No. 44, Sector 8, IMT Manesar"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={sysForm.city}
                        onChange={(e) => setSysForm({ ...sysForm, city: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={sysForm.state}
                        onChange={(e) => setSysForm({ ...sysForm, state: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={sysForm.pincode}
                        onChange={(e) => setSysForm({ ...sysForm, pincode: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="text"
                      value={sysForm.contactEmail}
                      onChange={(e) => setSysForm({ ...sysForm, contactEmail: e.target.value })}
                      placeholder="contact@bharatmedtech.in"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telephone / Support Line
                    </label>
                    <input
                      type="text"
                      value={sysForm.contactPhone}
                      onChange={(e) => setSysForm({ ...sysForm, contactPhone: e.target.value })}
                      placeholder="+91 124 4567890"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer with Live Inline Status */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetSystemConfig}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to System Defaults
                </button>

                <div className="flex items-center gap-3">
                  {isSysSaved && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-in fade-in">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Saved Successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    onClick={handleSaveSystemConfig}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                      isSysSaved
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-2 ring-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    }`}
                  >
                    {isSysSaved ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>✓ Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save System Name & Branding</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN PROFILE & NAME SETTINGS */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {adminSavedMsg && (
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{adminSavedMsg}</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2.5 py-1 rounded-md font-bold uppercase">
                Active in All Views
              </span>
            </div>
          )}

          {/* Current Admin Badge Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white font-black text-lg shadow-sm">
                {adminProfile.name.charAt(0) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{adminProfile.name}</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500">{adminProfile.email} • {adminProfile.department}</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Full 12-Module Unrestricted Access
              </span>
            </div>
          </div>

          {/* Admin Edit Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <form onSubmit={handleSaveAdminProfile} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Admin Name & Profile Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update the official administrator display name, phone, and department. Changes persist permanently across sessions.
                  </p>
                </div>
                {isAdminSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Ankit Gupta, Bhavik Patel, Vikramaditya Roy"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This name is displayed in the top header, sidebar user badge, audit logs, and on official system printouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    System login identifier for Admin role.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                    placeholder="+91 98100 11223"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Department
                </label>
                <input
                  type="text"
                  value={adminForm.department}
                  onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                  placeholder="Executive Management & Plant Operations"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAdminProfile}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Admin Name to Default
                </button>
                <div className="flex items-center gap-3">
                  {isAdminSaved && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-in fade-in">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Saved Successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    onClick={handleSaveAdminProfile}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                      isAdminSaved
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-2 ring-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    }`}
                  >
                    {isAdminSaved ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>✓ Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Admin Name & Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & CLOUD SYNC */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {backupMsg && (
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Firebase Config Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Cloud Firestore Integration</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  savedConfigActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {savedConfigActive ? 'Configured' : 'Local Storage Mode'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                To connect this CRM to your own Google Cloud / Firebase account for multi-computer online access, create a project at{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5">
                  console.firebase.google.com <ExternalLink className="h-3 w-3" />
                </a>
                , add a Web App, and paste the credentials below.
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Auth Domain</label>
                    <input
                      type="text"
                      placeholder="project.firebaseapp.com"
                      value={config.authDomain}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Project ID</label>
                    <input
                      type="text"
                      placeholder="medical-crm-prod"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Storage Bucket</label>
                    <input
                      type="text"
                      placeholder="project.firebasestorage.app"
                      value={config.storageBucket}
                      onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">App ID</label>
                    <input
                      type="text"
                      placeholder="1:123456:web:abcd"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs font-medium border ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {testResult.message}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    Save Credentials
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>

                  {savedConfigActive && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Local Storage & Backup Engine */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Database Backup & Recovery</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  IndexedDB Active
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                All 12 modules store genuine records in browser transactional IndexedDB with audit logs. You can export a complete JSON snapshot or restore previous records at any time.
              </p>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Export Full Database Backup</p>
                      <p className="text-[11px] text-slate-500">Download complete business JSON snapshot</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600">Download JSON</span>
                </button>

                <label className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Restore Database from Backup</p>
                      <p className="text-[11px] text-slate-500">Import previously saved company data file</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Select File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex w-full items-center justify-between rounded-xl border border-red-200 p-3 bg-red-50/30 hover:bg-red-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-red-900">Reset Factory Seed Data</p>
                      <p className="text-[11px] text-red-600">Restore factory sample records for demonstration</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-700">Reset Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
