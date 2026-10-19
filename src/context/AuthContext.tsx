import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/crm';

interface AuthContextType {
  currentUser: UserProfile | null;
  adminProfile: UserProfile;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  updateAdminProfile: (updated: Partial<UserProfile>) => void;
  resetAdminProfile: () => void;
  hasPermission: (module: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  allRoles: UserRole[];
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  Admin: {
    id: 'usr-admin',
    name: 'Vikramaditya Roy',
    email: 'admin@bharatmedtech.in',
    role: 'Admin',
    department: 'Executive Management',
    phone: '+91 98100 11223',
    createdAt: '2024-01-01T00:00:00Z',
  },
  Sales: {
    id: 'usr-sales',
    name: 'Amitabh Sen',
    email: 'sales@bharatmedtech.in',
    role: 'Sales',
    department: 'Sales & Marketing',
    phone: '+91 98110 44231',
    createdAt: '2024-03-01T00:00:00Z',
  },
  'Tender Manager': {
    id: 'usr-tender',
    name: 'Rahul Kapoor',
    email: 'tenders@bharatmedtech.in',
    role: 'Tender Manager',
    department: 'Government Tenders & GeM',
    phone: '+91 98118 77234',
    createdAt: '2024-02-15T00:00:00Z',
  },
  'Inventory Manager': {
    id: 'usr-inventory',
    name: 'Dinesh Kumar',
    email: 'warehouse@bharatmedtech.in',
    role: 'Inventory Manager',
    department: 'Stores & Logistics',
    phone: '+91 98711 66543',
    createdAt: '2024-04-10T00:00:00Z',
  },
  HR: {
    id: 'usr-hr',
    name: 'Ananya Deshmukh',
    email: 'hr@bharatmedtech.in',
    role: 'HR',
    department: 'Human Resources',
    phone: '+91 98102 99881',
    createdAt: '2024-01-20T00:00:00Z',
  },
  Accounts: {
    id: 'usr-accounts',
    name: 'Rajesh Agrawal',
    email: 'accounts@bharatmedtech.in',
    role: 'Accounts',
    department: 'Finance & Taxation',
    phone: '+91 98115 66778',
    createdAt: '2024-02-01T00:00:00Z',
  },
  Service: {
    id: 'usr-service',
    name: 'Suresh Chauhan',
    email: 'service@bharatmedtech.in',
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
    dashboard: ['view'],
    leads: ['view', 'create', 'edit'],
    dealers: ['view', 'create', 'edit'],
    tenders: ['view'],
    quotations: ['view', 'create', 'edit'],
    'emd-pbg': ['view'],
    inventory: ['view'],
    hr: [],
    quality: ['view'],
    dispatch: ['view'],
    service: ['view'],
    settings: [],
  },
  'Tender Manager': {
    dashboard: ['view'],
    leads: ['view'],
    dealers: ['view'],
    tenders: ['view', 'create', 'edit', 'delete'],
    quotations: ['view', 'create', 'edit'],
    'emd-pbg': ['view', 'create', 'edit'],
    inventory: ['view'],
    hr: [],
    quality: ['view'],
    dispatch: ['view'],
    service: [],
    settings: [],
  },
  'Inventory Manager': {
    dashboard: ['view'],
    leads: [],
    dealers: [],
    tenders: ['view'],
    quotations: ['view'],
    'emd-pbg': [],
    inventory: ['view', 'create', 'edit', 'delete'],
    hr: [],
    quality: ['view', 'create'],
    dispatch: ['view', 'create', 'edit'],
    service: ['view'],
    settings: [],
  },
  HR: {
    dashboard: ['view'],
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
    dashboard: ['view'],
    leads: ['view'],
    dealers: ['view'],
    tenders: ['view'],
    quotations: ['view'],
    'emd-pbg': ['view', 'create', 'edit'],
    inventory: ['view'],
    hr: ['view'], // can view payroll
    quality: [],
    dispatch: ['view', 'create', 'edit'],
    service: ['view'],
    settings: [],
  },
  Service: {
    dashboard: ['view'],
    leads: [],
    dealers: [],
    tenders: [],
    quotations: [],
    'emd-pbg': [],
    inventory: ['view'], // check spare parts
    hr: [],
    quality: ['view'],
    dispatch: ['view'],
    service: ['view', 'create', 'edit'],
    settings: [],
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfiles, setUserProfiles] = useState<Record<UserRole, UserProfile>>(() => {
    try {
      const stored = localStorage.getItem('bmt_user_profiles_v1');
      if (stored) {
        return { ...DEFAULT_USERS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load user profiles', e);
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem('bmt_active_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    // Default to stored Admin profile so user can immediately evaluate all modules
    try {
      const storedProfiles = localStorage.getItem('bmt_user_profiles_v1');
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        if (parsed.Admin) return parsed.Admin;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS.Admin;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bmt_user_profiles_v1', JSON.stringify(userProfiles));
    } catch (e) {
      console.error('Failed to save user profiles', e);
    }
  }, [userProfiles]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('bmt_active_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('bmt_active_user');
    }
  }, [currentUser]);

  const login = async (email: string, selectedRole: UserRole = 'Admin') => {
    const user = userProfiles[selectedRole] || {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0],
      email: email,
      role: selectedRole,
      department: 'Medical Equipment Division',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(user);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = userProfiles[newRole] || DEFAULT_USERS[newRole];
    setCurrentUser(targetUser);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updated };
      setCurrentUser(updatedUser);
      setUserProfiles((prev) => ({
        ...prev,
        [currentUser.role]: updatedUser,
      }));
    }
  };

  const updateAdminProfile = (updated: Partial<UserProfile>) => {
    setUserProfiles((prev) => {
      const updatedAdmin = { ...prev.Admin, ...updated };
      if (currentUser?.role === 'Admin') {
        setCurrentUser(updatedAdmin);
      }
      return {
        ...prev,
        Admin: updatedAdmin,
      };
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
        login,
        logout,
        switchRole,
        updateProfile,
        updateAdminProfile,
        resetAdminProfile,
        hasPermission,
        allRoles: ['Admin', 'Sales', 'Tender Manager', 'Inventory Manager', 'HR', 'Accounts', 'Service'],
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
