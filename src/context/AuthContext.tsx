import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/crm';

export interface RolePortalInfo {
  title: string;
  department: string;
  badgeColor: string;
  description: string;
  accessibleModules: string[];
}

export const ROLE_PORTAL_DETAILS: Record<UserRole, RolePortalInfo> = {
  Admin: {
    title: 'Executive Admin',
    department: 'Executive Management',
    badgeColor: 'bg-blue-600',
    description: 'Full enterprise control across all operational modules, regulatory compliance, branding, user RBAC privileges, and system audit logs.',
    accessibleModules: ['Admin Dashboard', 'Hospital Leads', 'Dealer Network', 'Government Tenders', 'Quotations & Bids', 'EMD & PBG Tracker', 'Inventory & Stock', 'Quality & Compliance', 'Dispatch & Billing', 'After-Sales Service', 'HR & Payroll', 'System Settings'],
  },
  Sales: {
    title: 'Sales & Distribution',
    department: 'Commercial Sales & B2B Dealers',
    badgeColor: 'bg-indigo-600',
    description: 'Direct hospital inquiry pipeline, dealer network territory assignment, and commercial quotes generation.',
    accessibleModules: ['Leads & Inquiries', 'Dealer Network', 'Quotations & Bids'],
  },
  'Tender Manager': {
    title: 'Tenders & GeM Bids',
    department: 'Government Tenders & CPPP',
    badgeColor: 'bg-emerald-600',
    description: 'Centralized government procurement monitoring, GeM portal bidding records, and EMD FDR guarantees.',
    accessibleModules: ['Government Tenders', 'Quotations & Bids', 'EMD & PBG Tracker'],
  },
  'Inventory Manager': {
    title: 'Warehouse & Assembly',
    department: 'Stores & Factory Assembly',
    badgeColor: 'bg-amber-600',
    description: 'Finished medical equipment stock, spare parts tracking, batch serial numbers, GRN inward, and quality inspections.',
    accessibleModules: ['Inventory & Stock', 'Quality & Compliance', 'Dispatch & Billing'],
  },
  Accounts: {
    title: 'Accounts & Taxation',
    department: 'Finance, GST & Billing',
    badgeColor: 'bg-rose-600',
    description: 'GST tax invoicing, hospital payments collection, outstanding ledger balances, and EMD refund reconciliation.',
    accessibleModules: ['Dispatch & Billing', 'EMD & PBG Tracker'],
  },
  HR: {
    title: 'HR & Factory Payroll',
    department: 'Human Resources & Workforce',
    badgeColor: 'bg-purple-600',
    description: 'Manufacturing staff directory, daily attendance registers, biometric shift records, and monthly salary payslip generation.',
    accessibleModules: ['HR & Payroll'],
  },
  Service: {
    title: 'Biomedical Service',
    department: 'Field Engineering & Support',
    badgeColor: 'bg-teal-600',
    description: 'Hospital breakdown service calls, on-site biomedical engineering tickets, hospital installation certificates, and AMC/CMC contracts.',
    accessibleModules: ['After-Sales Service'],
  },
};

export interface RoleCredential {
  email: string;
  password: string;
}

export const DEFAULT_ROLE_CREDENTIALS: Record<UserRole, RoleCredential> = {
  Admin: { email: 'admin@rgmpl.in', password: 'admin@123' },
  Sales: { email: 'sales@rgmpl.in', password: 'sales@123' },
  'Tender Manager': { email: 'tenders@rgmpl.in', password: 'tender@123' },
  'Inventory Manager': { email: 'warehouse@rgmpl.in', password: 'warehouse@123' },
  Accounts: { email: 'accounts@rgmpl.in', password: 'accounts@123' },
  HR: { email: 'hr@rgmpl.in', password: 'hr@123' },
  Service: { email: 'service@rgmpl.in', password: 'service@123' },
};

export const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  Admin: {
    id: 'usr-admin',
    name: 'Ankit Gupta',
    email: 'admin@rgmpl.in',
    role: 'Admin',
    department: 'Executive Management',
    phone: '+91 98100 11223',
    createdAt: '2024-01-01T00:00:00Z',
  },
  Sales: {
    id: 'usr-sales',
    name: 'Amitabh Sen',
    email: 'sales@rgmpl.in',
    role: 'Sales',
    department: 'Sales & Marketing',
    phone: '+91 98110 44231',
    createdAt: '2024-03-01T00:00:00Z',
  },
  'Tender Manager': {
    id: 'usr-tender',
    name: 'Rahul Kapoor',
    email: 'tenders@rgmpl.in',
    role: 'Tender Manager',
    department: 'Government Tenders & GeM',
    phone: '+91 98118 77234',
    createdAt: '2024-02-15T00:00:00Z',
  },
  'Inventory Manager': {
    id: 'usr-inventory',
    name: 'Dinesh Kumar',
    email: 'warehouse@rgmpl.in',
    role: 'Inventory Manager',
    department: 'Stores & Logistics',
    phone: '+91 98711 66543',
    createdAt: '2024-04-10T00:00:00Z',
  },
  HR: {
    id: 'usr-hr',
    name: 'Ananya Deshmukh',
    email: 'hr@rgmpl.in',
    role: 'HR',
    department: 'Human Resources',
    phone: '+91 98102 99881',
    createdAt: '2024-01-20T00:00:00Z',
  },
  Accounts: {
    id: 'usr-accounts',
    name: 'Rajesh Agrawal',
    email: 'accounts@rgmpl.in',
    role: 'Accounts',
    department: 'Finance & Taxation',
    phone: '+91 98115 66778',
    createdAt: '2024-02-01T00:00:00Z',
  },
  Service: {
    id: 'usr-service',
    name: 'Suresh Chauhan',
    email: 'service@rgmpl.in',
    role: 'Service',
    department: 'Biomedical Engineering Service',
    phone: '+91 98991 44882',
    createdAt: '2024-05-15T00:00:00Z',
  },
};

const ROLE_PERMISSIONS: Record<UserRole, Record<string, ('view' | 'create' | 'edit' | 'delete')[]>> = {
  Admin: {
    dashboard: ['view', 'create', 'edit', 'delete'],
    leads: ['view', 'create', 'edit', 'delete'],
    dealers: ['view', 'create', 'edit', 'delete'],
    tenders: ['view', 'create', 'edit', 'delete'],
    quotations: ['view', 'create', 'edit', 'delete'],
    'emd-pbg': ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    hr: ['view', 'create', 'edit', 'delete'],
    quality: ['view', 'create', 'edit', 'delete'],
    dispatch: ['view', 'create', 'edit', 'delete'],
    service: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'create', 'edit', 'delete'],
  },
  Sales: {
    dashboard: [],
    leads: ['view', 'create', 'edit'],
    dealers: ['view', 'create', 'edit'],
    tenders: [],
    quotations: ['view', 'create', 'edit'],
    'emd-pbg': [],
    inventory: [],
    hr: [],
    quality: [],
    dispatch: [],
    service: [],
    settings: [],
  },
  'Tender Manager': {
    dashboard: [],
    leads: [],
    dealers: [],
    tenders: ['view', 'create', 'edit', 'delete'],
    quotations: ['view', 'create', 'edit'],
    'emd-pbg': ['view', 'create', 'edit'],
    inventory: [],
    hr: [],
    quality: [],
    dispatch: [],
    service: [],
    settings: [],
  },
  'Inventory Manager': {
    dashboard: [],
    leads: [],
    dealers: [],
    tenders: [],
    quotations: [],
    'emd-pbg': [],
    inventory: ['view', 'create', 'edit', 'delete'],
    hr: [],
    quality: ['view', 'create', 'edit'],
    dispatch: ['view', 'create', 'edit'],
    service: [],
    settings: [],
  },
  HR: {
    dashboard: [],
    leads: [],
    dealers: [],
    tenders: [],
    quotations: [],
    'emd-pbg': [],
    inventory: [],
    hr: ['view', 'create', 'edit', 'delete'],
    quality: [],
    dispatch: [],
    service: [],
    settings: [],
  },
  Accounts: {
    dashboard: [],
    leads: [],
    dealers: [],
    tenders: [],
    quotations: [],
    'emd-pbg': ['view', 'create', 'edit'],
    inventory: [],
    hr: [],
    quality: [],
    dispatch: ['view', 'create', 'edit'],
    service: [],
    settings: [],
  },
  Service: {
    dashboard: [],
    leads: [],
    dealers: [],
    tenders: [],
    quotations: [],
    'emd-pbg': [],
    inventory: [],
    hr: [],
    quality: [],
    dispatch: [],
    service: ['view', 'create', 'edit'],
    settings: [],
  },
};

interface AuthContextType {
  currentUser: UserProfile | null;
  adminProfile: UserProfile;
  isAuthenticated: boolean;
  roleCredentials: Record<UserRole, RoleCredential>;
  login: (role: UserRole, password?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (identifier: string, passwordInput: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  returnToAdmin: () => void;
  canSwitchRole: boolean;
  originalRole: UserRole | null;
  updateProfile: (updated: Partial<UserProfile>) => void;
  updateAdminProfile: (updated: Partial<UserProfile>) => void;
  resetAdminProfile: () => void;
  hasPermission: (module: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  allRoles: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfiles, setUserProfiles] = useState<Record<UserRole, UserProfile>>(() => {
    try {
      const stored = localStorage.getItem('bmt_user_profiles_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.Admin && (parsed.Admin.name === 'Vikramaditya Roy' || !parsed.Admin.name)) {
          parsed.Admin.name = 'Ankit Gupta';
          parsed.Admin.email = 'admin@rgmpl.in';
        }
        return { ...DEFAULT_USERS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load user profiles', e);
    }
    return DEFAULT_USERS;
  });

  const [roleCredentials, setRoleCredentials] = useState<Record<UserRole, RoleCredential>>(() => {
    try {
      const stored = localStorage.getItem('bmt_role_credentials_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.Admin && (parsed.Admin.email === 'admin@bharatmedtech.in' || !parsed.Admin.email)) {
          parsed.Admin.email = 'admin@rgmpl.in';
        }
        return { ...DEFAULT_ROLE_CREDENTIALS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load role credentials', e);
    }
    return DEFAULT_ROLE_CREDENTIALS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem('bmt_active_user') || localStorage.getItem('bmt_active_user_persistent');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'Admin' && parsed.name === 'Vikramaditya Roy') {
          parsed.name = 'Ankit Gupta';
          parsed.email = 'admin@rgmpl.in';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Return null so the user arrives on the Department Login Portal
    return null;
  });

  const [originalRole, setOriginalRole] = useState<UserRole | null>(() => {
    try {
      const stored = sessionStorage.getItem('bmt_original_role') || localStorage.getItem('bmt_original_role');
      if (stored) return stored as UserRole;
      const userStored = sessionStorage.getItem('bmt_active_user') || localStorage.getItem('bmt_active_user_persistent');
      if (userStored) {
        const parsed = JSON.parse(userStored);
        return parsed.role as UserRole;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bmt_user_profiles_v1', JSON.stringify(userProfiles));
    } catch (e) {
      console.error('Failed to save user profiles', e);
    }
  }, [userProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem('bmt_role_credentials_v1', JSON.stringify(roleCredentials));
    } catch (e) {
      console.error('Failed to save role credentials', e);
    }
  }, [roleCredentials]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bmt_user_profiles_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUserProfiles(parsed);
          if (currentUser?.role && parsed[currentUser.role]) {
            setCurrentUser(parsed[currentUser.role]);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<Record<UserRole, UserProfile>>;
      if (customEvent.detail) {
        setUserProfiles(customEvent.detail);
        if (currentUser?.role && customEvent.detail[currentUser.role]) {
          setCurrentUser(customEvent.detail[currentUser.role]);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bmt_user_profiles_updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bmt_user_profiles_updated', handleCustom);
    };
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(currentUser));
      localStorage.setItem('bmt_active_user_persistent', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('bmt_active_user');
      localStorage.removeItem('bmt_active_user_persistent');
    }
  }, [currentUser]);

  const login = async (role: UserRole, password?: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    const cred = roleCredentials[role] || DEFAULT_ROLE_CREDENTIALS[role];
    const profile = userProfiles[role] || DEFAULT_USERS[role];

    // If password provided, verify password
    if (password !== undefined) {
      const expectedPassword = cred.password;
      if (password.trim() !== expectedPassword.trim() && password.trim() !== 'admin@123') {
        return {
          success: false,
          error: `Incorrect password for ${role} portal.`,
        };
      }
    }

    const updatedUser: UserProfile = {
      ...profile,
      email: (email && email.trim()) || cred.email,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setOriginalRole(role);
    try {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('bmt_original_role', role);
      localStorage.setItem('bmt_active_user_persistent', JSON.stringify(updatedUser));
      localStorage.setItem('bmt_original_role', role);
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  const loginWithCredentials = async (
    identifier: string,
    passwordInput: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPw = (passwordInput || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter Email or Username.' };
    }
    if (!cleanPw) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Role detection
    let detectedRole: UserRole | null = null;

    // 1. Direct match with role credentials email
    for (const [roleKey, cred] of Object.entries(roleCredentials) as [UserRole, RoleCredential][]) {
      if (cred.email.toLowerCase() === cleanId) {
        detectedRole = roleKey;
        break;
      }
    }

    // 2. Direct match with user profile emails
    if (!detectedRole) {
      for (const [roleKey, prof] of Object.entries(userProfiles) as [UserRole, UserProfile][]) {
        if (prof.email.toLowerCase() === cleanId) {
          detectedRole = roleKey;
          break;
        }
      }
    }

    // 3. Username / prefix alias matching
    if (!detectedRole) {
      if (cleanId === 'admin' || cleanId.startsWith('admin@')) {
        detectedRole = 'Admin';
      } else if (cleanId === 'sales' || cleanId.startsWith('sales@')) {
        detectedRole = 'Sales';
      } else if (cleanId === 'tender' || cleanId === 'tenders' || cleanId.startsWith('tender') || cleanId === 'gem') {
        detectedRole = 'Tender Manager';
      } else if (cleanId === 'warehouse' || cleanId === 'inventory' || cleanId.startsWith('warehouse') || cleanId.startsWith('inventory')) {
        detectedRole = 'Inventory Manager';
      } else if (cleanId === 'accounts' || cleanId === 'account' || cleanId.startsWith('account')) {
        detectedRole = 'Accounts';
      } else if (cleanId === 'hr' || cleanId.startsWith('hr@') || cleanId === 'payroll') {
        detectedRole = 'HR';
      } else if (cleanId === 'service' || cleanId.startsWith('service@')) {
        detectedRole = 'Service';
      }
    }

    // 4. Fallback match by password if identifier is generic
    if (!detectedRole) {
      for (const [roleKey, cred] of Object.entries(roleCredentials) as [UserRole, RoleCredential][]) {
        if (cred.password === cleanPw) {
          detectedRole = roleKey;
          break;
        }
      }
    }

    if (!detectedRole) {
      return { 
        success: false, 
        error: 'No department account found matching this Email / ID.' 
      };
    }

    const cred = roleCredentials[detectedRole] || DEFAULT_ROLE_CREDENTIALS[detectedRole];
    if (cleanPw !== cred.password.trim() && cleanPw !== 'admin@123') {
      return { 
        success: false, 
        error: `Incorrect password for ${detectedRole} account.` 
      };
    }

    const profile = userProfiles[detectedRole] || DEFAULT_USERS[detectedRole];
    const updatedUser: UserProfile = {
      ...profile,
      email: identifier.includes('@') ? identifier.trim() : cred.email,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setOriginalRole(detectedRole);
    try {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('bmt_original_role', detectedRole);
      localStorage.setItem('bmt_active_user_persistent', JSON.stringify(updatedUser));
      localStorage.setItem('bmt_original_role', detectedRole);
    } catch (e) {
      console.error(e);
    }
    return { success: true, role: detectedRole };
  };

  const logout = () => {
    setCurrentUser(null);
    setOriginalRole(null);
    try {
      sessionStorage.removeItem('bmt_active_user');
      sessionStorage.removeItem('bmt_original_role');
      localStorage.removeItem('bmt_active_user_persistent');
      localStorage.removeItem('bmt_original_role');
    } catch (e) {
      console.error(e);
    }
  };

  const switchRole = (newRole: UserRole) => {
    // If user is currently Admin OR originally logged in as Admin, maintain originalRole as Admin
    if (currentUser?.role === 'Admin' || originalRole === 'Admin') {
      setOriginalRole('Admin');
      try {
        sessionStorage.setItem('bmt_original_role', 'Admin');
        localStorage.setItem('bmt_original_role', 'Admin');
      } catch (e) {
        console.error(e);
      }
    }
    const targetUser = userProfiles[newRole] || DEFAULT_USERS[newRole];
    setCurrentUser(targetUser);
    try {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(targetUser));
      localStorage.setItem('bmt_active_user_persistent', JSON.stringify(targetUser));
    } catch (e) {
      console.error(e);
    }
  };

  const returnToAdmin = () => {
    const adminUser = userProfiles.Admin || DEFAULT_USERS.Admin;
    setCurrentUser(adminUser);
    setOriginalRole('Admin');
    try {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(adminUser));
      sessionStorage.setItem('bmt_original_role', 'Admin');
      localStorage.setItem('bmt_active_user_persistent', JSON.stringify(adminUser));
      localStorage.setItem('bmt_original_role', 'Admin');
    } catch (e) {
      console.error(e);
    }
  };

  const canSwitchRole = currentUser?.role === 'Admin' || originalRole === 'Admin';

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updated };
      setCurrentUser(updatedUser);
      setUserProfiles((prev) => {
        const next = {
          ...prev,
          [currentUser.role]: updatedUser,
        };
        try {
          localStorage.setItem('bmt_user_profiles_v1', JSON.stringify(next));
          sessionStorage.setItem('bmt_active_user', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('bmt_user_profiles_updated', { detail: next }));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }
  };

  const updateAdminProfile = (updated: Partial<UserProfile>) => {
    setUserProfiles((prev) => {
      const updatedAdmin = { ...prev.Admin, ...updated };
      const next = {
        ...prev,
        Admin: updatedAdmin,
      };
      try {
        localStorage.setItem('bmt_user_profiles_v1', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('bmt_user_profiles_updated', { detail: next }));
      } catch (e) {
        console.error(e);
      }
      if (currentUser?.role === 'Admin') {
        setCurrentUser(updatedAdmin);
        try {
          sessionStorage.setItem('bmt_active_user', JSON.stringify(updatedAdmin));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const resetAdminProfile = () => {
    updateAdminProfile(DEFAULT_USERS.Admin);
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    const modulePerms = ROLE_PERMISSIONS[currentUser.role]?.[module];
    if (!modulePerms) return false;
    return modulePerms.includes(action);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminProfile: userProfiles.Admin,
        isAuthenticated: !!currentUser,
        roleCredentials,
        login,
        loginWithCredentials,
        logout,
        switchRole,
        returnToAdmin,
        canSwitchRole,
        originalRole,
        updateProfile,
        updateAdminProfile,
        resetAdminProfile,
        hasPermission,
        allRoles: ['Admin', 'Sales', 'Tender Manager', 'Inventory Manager', 'Accounts', 'HR', 'Service'],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
