import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types/crm';
import { useAuth, ROLE_PORTAL_DETAILS } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';

export const LoginPortal: React.FC = () => {
  const { systemConfig } = useSystem();
  const { loginWithCredentials, roleCredentials } = useAuth();

  const [identifier, setIdentifier] = useState('admin@rgmpl.in');
  const [password, setPassword] = useState('admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleHelper, setShowRoleHelper] = useState(false);

  // Auto-detect role as the user types identifier
  const detectRoleFromIdentifier = (id: string): UserRole | null => {
    const clean = id.trim().toLowerCase();
    if (!clean) return null;
    if (clean === 'admin' || clean.startsWith('admin@')) return 'Admin';
    if (clean === 'sales' || clean.startsWith('sales@')) return 'Sales';
    if (clean === 'tender' || clean === 'tenders' || clean.startsWith('tender') || clean === 'gem') return 'Tender Manager';
    if (clean === 'warehouse' || clean === 'inventory' || clean.startsWith('warehouse') || clean.startsWith('inventory')) return 'Inventory Manager';
    if (clean === 'accounts' || clean === 'account' || clean.startsWith('account')) return 'Accounts';
    if (clean === 'hr' || clean.startsWith('hr@') || clean === 'payroll') return 'HR';
    if (clean === 'service' || clean.startsWith('service@')) return 'Service';
    return null;
  };

  const detectedRole = detectRoleFromIdentifier(identifier);
  const activePortalInfo = detectedRole ? ROLE_PORTAL_DETAILS[detectedRole] : null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await loginWithCredentials(identifier, password);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid credentials. Please check your Email and Password.');
      }
    } catch {
      setErrorMsg('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillRole = (role: UserRole) => {
    const cred = roleCredentials[role];
    if (cred) {
      setIdentifier(cred.email);
      setPassword(cred.password);
      setErrorMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-md shadow-blue-500/20">
            {systemConfig.systemShortName || 'RGMPL'}
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              {systemConfig.systemName}
            </h1>
            <p className="text-[11px] text-blue-300">
              {systemConfig.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Universal RBAC Gateway</span>
        </div>
      </div>

      {/* Center: The Single Login Card */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Card Header */}
          <div className="flex items-start justify-between pb-5 border-b border-slate-100 mb-6 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {detectedRole ? `Sign In to ${activePortalInfo?.title}` : `Sign In to ${systemConfig.systemName}`}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your department credentials below to access your role workspace.
              </p>
            </div>

            <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activePortalInfo ? activePortalInfo.department : 'Enterprise Management'}
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department Official Email / Username *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="admin@rgmpl.in or sales@rgmpl.in"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Secret Password *
                </label>
                {detectedRole && (
                  <span className="text-[11px] text-slate-400">
                    Default: <span className="font-mono font-bold text-slate-600">{roleCredentials[detectedRole]?.password}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <span>{detectedRole ? `Login to ${activePortalInfo?.title}` : `Login to ${systemConfig.systemName}`}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Footer inside card (Matching image) */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              RBAC Access Control active for 7 roles
            </span>
            <span>
              Plant: <span className="font-semibold text-slate-700">{systemConfig.plantLocation}</span>
            </span>
          </div>

          {/* Expandable Role Credentials Quick-Helper */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRoleHelper(!showRoleHelper)}
              className="w-full flex items-center justify-between py-1 px-2 rounded-lg text-[11px] font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                View All Department Credentials & Default Passwords
              </span>
              {showRoleHelper ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showRoleHelper && (
              <div className="mt-2.5 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <p className="text-[10px] text-slate-500 mb-2 font-medium">
                  Enter credentials matching your department, or click "Quick Fill" to test:
                </p>
                <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {(Object.keys(ROLE_PORTAL_DETAILS) as UserRole[]).map((role) => {
                    const cred = roleCredentials[role];
                    const portal = ROLE_PORTAL_DETAILS[role];
                    const isCurrent = detectedRole === role;

                    return (
                      <div 
                        key={role} 
                        className={`flex items-center justify-between p-2 rounded-lg border transition ${
                          isCurrent 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{portal.title}</span>
                            <span className="text-[10px] text-slate-400">({portal.department})</span>
                          </div>
                          <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                            ID: <span className="font-bold text-slate-800">{cred.email}</span> | Pass: <span className="font-bold text-blue-700">{cred.password}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickFillRole(role)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition cursor-pointer shrink-0 ml-2"
                        >
                          Quick Fill
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer System Credits */}
      <div className="max-w-4xl mx-auto w-full pt-4 text-center text-xs text-slate-500">
        <p>{systemConfig.companyName} • {systemConfig.cdscoReg} • {systemConfig.isoCert}</p>
      </div>
    </div>
  );
};
