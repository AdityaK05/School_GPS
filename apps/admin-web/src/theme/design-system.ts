/**
 * School-GPS Flagship Design System
 * 
 * Principles:
 * - Clean white / light slate backgrounds
 * - Deep midnight navy sidebar for Admin Web (#0d1938)
 * - Near-black typography with high contrast
 * - Large touch targets and typography
 * - Restrained semantic colors:
 *   - Primary Blue: #2563eb
 *   - Safety Green: #059669 (Accounted / Boarded / Verified)
 *   - Warning Amber: #d97706 (Needs Attention / Grace Period)
 *   - Critical Red: #dc2626 (Exceptions / Urgent)
 *   - Fleet Purple: #7c3aed (Active Buses)
 */

export const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  sidebar: '#0d1938',
  sidebarActive: '#2563eb',
  sidebarHover: 'rgba(255, 255, 255, 0.08)',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderHover: '#cbd5e1',
  
  // Typography
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',
  
  // Brand & Semantics
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
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
};
