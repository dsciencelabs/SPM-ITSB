
import { createContext, useState, useContext, ReactNode, useEffect, FC } from 'react';
import { AuditStandard } from './types';

export interface SystemSettings {
  appName: string;
  appDescription: string;
  logoUrl: string | null; // Base64 string
  themeColor: string; // Hex code
  auditPeriod: string;
  defaultStandard: AuditStandard;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'SPM~ITSB',
  appDescription: 'Smart Audit Mutu Internal',
  logoUrl: null,
  themeColor: '#2563eb', // Default Blue-600
  auditPeriod: new Date().getFullYear().toString(),
  defaultStandard: AuditStandard.PERMENDIKTISAINTEK_2025
};

const STORAGE_KEY = 'ami_system_settings_v1';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};