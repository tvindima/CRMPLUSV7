/**
 * Context de tema da aplicação
 * Permite trocar entre diferentes temas visuais
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  // Backgrounds
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
  };
  // Brand/Accent colors
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Border colors
  border: {
    primary: string;
    secondary: string;
  };
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const THEMES: Record<string, AppTheme> = {
  futuristic: {
    id: 'futuristic',
    name: 'Futurista',
    colors: {
      background: {
        primary: '#0a0e1a',
        secondary: '#12141A',
        tertiary: '#1a1d2e',
        card: '#151820',
      },
      brand: {
        primary: '#00d9ff',
        secondary: '#8b5cf6',
        accent: '#d946ef',
      },
      text: {
        primary: '#ffffff',
        secondary: '#9ca3af',
        muted: '#6b7280',
        inverse: '#000000',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      border: {
        primary: '#2A2A2E',
        secondary: '#3f3f46',
      },
    },
  },
  professional: {
    id: 'professional',
    name: 'Profissional',
    colors: {
      background: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151',
        card: '#1f2937',
      },
      brand: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#60a5fa',
      },
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
        muted: '#9ca3af',
        inverse: '#000000',
      },
      status: {
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        info: '#0ea5e9',
      },
      border: {
        primary: '#374151',
        secondary: '#4b5563',
      },
    },
  },
  luxury: {
    id: 'luxury',
    name: 'Luxuoso',
    colors: {
      background: {
        primary: '#0c0a09',
        secondary: '#1c1917',
        tertiary: '#292524',
        card: '#1c1917',
      },
      brand: {
        primary: '#d4af37',
        secondary: '#b8860b',
        accent: '#ffd700',
      },
      text: {
        primary: '#fafaf9',
        secondary: '#d6d3d1',
        muted: '#a8a29e',
        inverse: '#0c0a09',
      },
      status: {
        success: '#84cc16',
        warning: '#f59e0b',
        error: '#dc2626',
        info: '#0284c7',
      },
      border: {
        primary: '#44403c',
        secondary: '#57534e',
      },
    },
  },
  feminine: {
    id: 'feminine',
    name: 'Elegante Rosa',
    colors: {
      background: {
        primary: '#1a0a14',
        secondary: '#2d1221',
        tertiary: '#3d1a2e',
        card: '#2d1221',
      },
      brand: {
        primary: '#ec4899',
        secondary: '#db2777',
        accent: '#f472b6',
      },
      text: {
        primary: '#fdf2f8',
        secondary: '#f9a8d4',
        muted: '#f472b6',
        inverse: '#1a0a14',
      },
      status: {
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#38bdf8',
      },
      border: {
        primary: '#4a1942',
        secondary: '#6b2158',
      },
    },
  },
  nature: {
    id: 'nature',
    name: 'Natureza',
    colors: {
      background: {
        primary: '#052e16',
        secondary: '#14532d',
        tertiary: '#166534',
        card: '#14532d',
      },
      brand: {
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#4ade80',
      },
      text: {
        primary: '#f0fdf4',
        secondary: '#bbf7d0',
        muted: '#86efac',
        inverse: '#052e16',
      },
      status: {
        success: '#34d399',
        warning: '#fcd34d',
        error: '#f87171',
        info: '#38bdf8',
      },
      border: {
        primary: '#166534',
        secondary: '#15803d',
      },
    },
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    colors: {
      background: {
        primary: '#18181b',
        secondary: '#27272a',
        tertiary: '#3f3f46',
        card: '#27272a',
      },
      brand: {
        primary: '#f4f4f5',
        secondary: '#a1a1aa',
        accent: '#ffffff',
      },
      text: {
        primary: '#fafafa',
        secondary: '#a1a1aa',
        muted: '#71717a',
        inverse: '#18181b',
      },
      status: {
        success: '#4ade80',
        warning: '#facc15',
        error: '#f87171',
        info: '#60a5fa',
      },
      border: {
        primary: '#3f3f46',
        secondary: '#52525b',
      },
    },
  },
};

interface ThemeContextData {
  theme: AppTheme;
  themeId: string;
  colors: ThemeColors;
  setTheme: (themeId: string) => Promise<void>;
  availableThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextData>({
  theme: THEMES.futuristic,
  themeId: 'futuristic',
  colors: THEMES.futuristic.colors,
  setTheme: async () => {},
  availableThemes: Object.values(THEMES),
});

const STORAGE_KEY = '@crm_plus_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>('futuristic');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Carregar das settings gerais
      const settingsStr = await AsyncStorage.getItem('@crm_plus_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.theme && THEMES[settings.theme]) {
          setThemeId(settings.theme);
          return;
        }
      }
      
      // Fallback para storage específico
      const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTheme && THEMES[storedTheme]) {
        setThemeId(storedTheme);
      }
    } catch (error) {
      console.warn('[Theme] Erro ao carregar tema:', error);
    }
  };

  const setTheme = useCallback(async (newThemeId: string) => {
    if (!THEMES[newThemeId]) {
      console.warn('[Theme] Tema não encontrado:', newThemeId);
      return;
    }
    
    setThemeId(newThemeId);
    
    // Salvar em ambos os locais para compatibilidade
    await AsyncStorage.setItem(STORAGE_KEY, newThemeId);
    
    // Atualizar também nas settings gerais
    try {
      const settingsStr = await AsyncStorage.getItem('@crm_plus_settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      settings.theme = newThemeId;
      await AsyncStorage.setItem('@crm_plus_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('[Theme] Erro ao salvar tema nas settings:', error);
    }
    
    console.log('[Theme] Tema alterado para:', newThemeId);
  }, []);

  const theme = THEMES[themeId] || THEMES.futuristic;
  const colors = theme.colors;
  const availableThemes = Object.values(THEMES);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeId, 
      colors, 
      setTheme, 
      availableThemes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
