import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  canvasBg: string;
  card: string;
  cardHover: string;
  sidebar: string;
  sidebarActive: string;
  sidebarActiveText: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarBorder: string;
  border: string;
  borderLight: string;
  borderHover: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;

  success: string;
  successLight: string;
  successBorder: string;
  
  warning: string;
  warningLight: string;
  warningBorder: string;

  danger: string;
  dangerLight: string;
  dangerBorder: string;

  purple: string;
  purpleLight: string;
  purpleBorder: string;

  badgeBg: string;
  badgeBorder: string;
  mapBg: string;
}

export const lightColors: ThemeColors = {
  bg: '#f8fafc',
  canvasBg: '#f8fafc',
  card: '#ffffff',
  cardHover: '#f1f5f9',
  sidebar: '#0d1938',
  sidebarActive: 'rgba(37, 99, 235, 0.14)',
  sidebarActiveText: '#60a5fa',
  sidebarText: '#e2e8f0',
  sidebarTextMuted: '#94a3b8',
  sidebarBorder: 'rgba(255, 255, 255, 0.08)',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderHover: '#cbd5e1',
  
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',
  
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',

  success: '#059669',
  successLight: '#ecfdf5',
  successBorder: '#a7f3d0',
  
  warning: '#d97706',
  warningLight: '#fffbeb',
  warningBorder: '#fde68a',

  danger: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',

  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  purpleBorder: '#ddd6fe',

  badgeBg: '#f1f5f9',
  badgeBorder: '#e2e8f0',
  mapBg: '#f8fafc',
};

export const darkColors: ThemeColors = {
  bg: '#0b0f19',
  canvasBg: '#0b0f19',
  card: '#111827',
  cardHover: '#1f2937',
  sidebar: '#080d1a',
  sidebarActive: 'rgba(59, 130, 246, 0.18)',
  sidebarActiveText: '#93c5fd',
  sidebarText: '#f1f5f9',
  sidebarTextMuted: '#64748b',
  sidebarBorder: 'rgba(255, 255, 255, 0.06)',
  border: '#1f2937',
  borderLight: '#1e293b',
  borderHover: '#374151',
  
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textWhite: '#ffffff',
  
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: 'rgba(59, 130, 246, 0.12)',
  primaryBorder: '#1e40af',

  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.12)',
  successBorder: '#065f46',
  
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  warningBorder: '#92400e',

  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: '#991b1b',

  purple: '#8b5cf6',
  purpleLight: 'rgba(139, 92, 246, 0.12)',
  purpleBorder: '#5b21b6',

  badgeBg: '#1e293b',
  badgeBorder: '#334155',
  mapBg: '#0f172a',
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  colors: lightColors,
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('school_gps_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'light'; // Default to flagship light as primary pitch experience
      }
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('school_gps_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = darkColors.bg;
        document.body.style.color = darkColors.textPrimary;
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = lightColors.bg;
        document.body.style.color = lightColors.textPrimary;
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const currentColors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        colors: currentColors,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
