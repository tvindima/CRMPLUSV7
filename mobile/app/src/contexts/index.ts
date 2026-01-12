/**
 * Exportação central de todos os contexts
 */

export { AuthProvider, useAuth } from './AuthContext';
export type { AuthContextData } from './AuthContext';

export { AgentProvider, useAgent } from './AgentContext';

export { ThemeProvider, useTheme, THEMES } from './ThemeContext';
export type { ThemeColors, AppTheme } from './ThemeContext';

export { TerminologyProvider, useTerminology } from './TerminologyContext';
export type { Terminology, Sector } from './TerminologyContext';
