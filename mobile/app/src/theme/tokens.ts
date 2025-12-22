/**
 * Design Tokens — CRM PLUS Mobile
 * Dark Neon Theme
 */

export const colors = {
  // Background
  background: {
    primary: '#0B0B0D',
    secondary: '#12141A',
    tertiary: '#1A1D28',
    gradient: ['#0B0B0D', '#12141A'],
  },

  // Brand Colors (Neon)
  brand: {
    cyan: '#00D9FF',
    cyanLight: '#33E3FF',
    cyanDark: '#00A8CC',
    magenta: '#E946D5',
    magentaLight: '#F270E3',
    magentaDark: '#C830B0',
    purple: '#A855F7',
    purpleLight: '#C084FC',
    purpleDark: '#9333EA',
  },

  // Semantic Colors
  primary: '#00D9FF',
  secondary: '#E946D5',
  accent: '#A855F7',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Text
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    disabled: '#64748B',
    inverse: '#0B0B0D',
  },

  // Borders
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    accent: 'rgba(0, 217, 255, 0.3)',
    magenta: 'rgba(233, 70, 213, 0.3)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    medium: 'rgba(0, 0, 0, 0.7)',
    dark: 'rgba(0, 0, 0, 0.9)',
  },

  // Card backgrounds
  card: {
    primary: 'rgba(26, 29, 40, 0.8)',
    secondary: 'rgba(30, 34, 48, 0.6)',
    elevated: 'rgba(34, 38, 54, 0.9)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

export const glow = {
  cyan: {
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  magenta: {
    shadowColor: '#E946D5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  purple: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  sectionSpacing: spacing['2xl'],
  itemSpacing: spacing.md,
} as const;
