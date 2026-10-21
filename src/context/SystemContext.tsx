import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SystemConfig {
  systemName: string;         // Application / System Name (e.g. "Bharat MedTech")
  systemShortName: string;    // Short monogram/badge (e.g. "BM")
  systemTagline: string;      // Tagline (e.g. "Medical Equipment ERP & CRM")
  companyName: string;        // Full Legal Company Name (e.g. "Bharat MedTech Instruments Ltd.")
  plantLocation: string;      // Manufacturing Plant (e.g. "Plant: Manesar, Gurugram")
  cdscoReg: string;           // CDSCO Medical Device Reg No (e.g. "CDSCO Reg: MFG/MD/2022/000492")
  isoCert: string;            // ISO Certification (e.g. "ISO 13485:2016 Certified")
  gstin: string;              // GST Number
  address: string;            // Street / Industrial Plot
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  systemName: 'RGMPL',
  systemShortName: 'RGMPL',
  systemTagline: 'Medical Equipment ERP & CRM',
  companyName: 'RGMPL Instruments Ltd.',
  plantLocation: 'Plant: Manesar, Gurugram',
  cdscoReg: 'CDSCO Reg: MFG/MD/2022/000492',
  isoCert: 'ISO 13485:2016 Certified',
  gstin: '07AABCB1234F1Z8',
  address: 'Plot No. 44, Sector 8, IMT Manesar',
  city: 'Gurugram',
  state: 'Haryana',
  pincode: '122050',
  contactEmail: 'contact@rgmpl.in',
  contactPhone: '+91 124 4567890',
  website: 'www.rgmpl.in',
};

const SYSTEM_STORAGE_KEY = 'bmt_system_configuration';

interface SystemContextType {
  systemConfig: SystemConfig;
  updateSystemConfig: (updated: Partial<SystemConfig>) => void;
  resetSystemConfig: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    try {
      const stored = localStorage.getItem(SYSTEM_STORAGE_KEY) || localStorage.getItem('bmt_system_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.systemName || parsed.systemName === 'Bharat MedTech') {
          parsed.systemName = 'RGMPL';
          parsed.systemShortName = 'RGMPL';
          if (!parsed.companyName || parsed.companyName === 'Bharat MedTech Instruments Ltd.') {
            parsed.companyName = 'RGMPL Instruments Ltd.';
          }
        }
        return { ...DEFAULT_SYSTEM_CONFIG, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load system config from storage', e);
    }
    return DEFAULT_SYSTEM_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(systemConfig));
      localStorage.setItem('bmt_system_config', JSON.stringify(systemConfig));
      document.title = `${systemConfig.systemName} - ${systemConfig.systemTagline}`;
      
      // Keep meta description and og tags synchronized
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${systemConfig.companyName} - ${systemConfig.systemTagline}`);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${systemConfig.systemName} - ${systemConfig.systemTagline}`);
      }
    } catch (e) {
      console.error('Failed to persist system config', e);
    }
  }, [systemConfig]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === SYSTEM_STORAGE_KEY || e.key === 'bmt_system_config') && e.newValue) {
        try {
          setSystemConfig(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<SystemConfig>;
      if (customEvent.detail) {
        setSystemConfig(customEvent.detail);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bmt_system_config_updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bmt_system_config_updated', handleCustom);
    };
  }, []);

  const updateSystemConfig = (updated: Partial<SystemConfig>) => {
    setSystemConfig((prev) => {
      let shortName = updated.systemShortName !== undefined ? updated.systemShortName : prev.systemShortName;
      if (updated.systemName && updated.systemShortName === undefined) {
        const words = updated.systemName.trim().split(/\s+/).filter(Boolean);
        shortName = words.length >= 2 
          ? (words[0][0] + words[1][0]).toUpperCase() 
          : updated.systemName.slice(0, 4).toUpperCase();
      }

      // Automatically sync companyName if it was default or linked to previous systemName
      let newCompanyName = updated.companyName !== undefined ? updated.companyName : prev.companyName;
      if (
        updated.systemName &&
        (updated.companyName === undefined || updated.companyName === DEFAULT_SYSTEM_CONFIG.companyName) &&
        (prev.companyName === DEFAULT_SYSTEM_CONFIG.companyName || !prev.companyName || prev.companyName.includes('Bharat MedTech') || prev.companyName === `${prev.systemName} Instruments Ltd.`)
      ) {
        newCompanyName = `${updated.systemName.trim()} Instruments Ltd.`;
      }

      const merged: SystemConfig = {
        ...prev,
        ...updated,
        companyName: newCompanyName,
        systemShortName: shortName || prev.systemShortName,
      };

      try {
        localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem('bmt_system_config', JSON.stringify(merged));
        document.title = `${merged.systemName} - ${merged.systemTagline}`;
        window.dispatchEvent(new CustomEvent('bmt_system_config_updated', { detail: merged }));
      } catch (err) {
        console.error('Immediate write to storage failed', err);
      }

      return merged;
    });
  };

  const resetSystemConfig = () => {
    setSystemConfig(DEFAULT_SYSTEM_CONFIG);
    try {
      localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_CONFIG));
      document.title = `${DEFAULT_SYSTEM_CONFIG.systemName} - ${DEFAULT_SYSTEM_CONFIG.systemTagline}`;
      window.dispatchEvent(new CustomEvent('bmt_system_config_updated', { detail: DEFAULT_SYSTEM_CONFIG }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SystemContext.Provider value={{ systemConfig, updateSystemConfig, resetSystemConfig }}>
      {children}
    </SystemContext.Provider>
  );
};

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within SystemProvider');
  }
  return context;
}
