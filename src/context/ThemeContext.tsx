import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, DEFAULT_THEME, PresetThemeId, PRESET_THEMES } from '../types/theme';

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  applyPreset: (presetId: PresetThemeId) => void;
  resetTheme: () => void;
}

const STORAGE_KEY = 'b3_backtest_theme_config';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME, ...parsed, borderRadius: 'modern' };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_THEME;
  });

  // Apply theme attributes to document.body whenever theme changes
  useEffect(() => {
    try {
      const body = document.body;
      const root = document.documentElement;

      body.setAttribute('data-theme', theme.presetId);
      body.setAttribute('data-font', theme.fontFamily);
      body.setAttribute('data-density', theme.density);
      body.setAttribute('data-width', theme.maxWidth);
      body.setAttribute('data-radius', theme.borderRadius);
      body.setAttribute('data-bg', theme.backgroundStyle);
      body.setAttribute('data-accent', theme.accentColor);

      root.setAttribute('data-theme', theme.presetId);
      root.setAttribute('data-font', theme.fontFamily);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetId: PresetThemeId) => {
    const preset = PRESET_THEMES.find((p) => p.id === presetId);
    if (preset) {
      setTheme({ ...preset.defaults });
    }
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, applyPreset, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
