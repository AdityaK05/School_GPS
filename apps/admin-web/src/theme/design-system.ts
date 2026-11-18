/**
 * School-GPS Flagship Design System
 * 
 * Principles:
 * - Minimalistic + flagship + trustworthy + extremely easy to understand
 * - Purpose-built school transportation safety & accountability OS
 * - Student -> Journey -> Bus -> Stop -> Event -> Safety
 * - Subtle restrained contrast, reduced border radii, no decorative emojis
 * - Premium light and dark modes
 */

export * from './ThemeContext';
import { lightColors } from './ThemeContext';

export const colors = lightColors;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
  none: 'none',
};

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '16px',
  full: '9999px',
};
