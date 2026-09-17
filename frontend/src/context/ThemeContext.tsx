import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  PaletteId,
  ColorPalette,
  COLOR_PALETTES,
  THEME_STORAGE_KEY,
  themeConfig,
} from '../config/theme.config';

interface ThemeContextType {
  activePalette: ColorPalette;
  activePaletteId: PaletteId;
  setPalette: (id: PaletteId) => void;
  showThemePicker: boolean;
  allowThemeCustomization: boolean;
  availablePalettes: ColorPalette[];
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePaletteId, setActivePaletteId] = useState<PaletteId>(() => {
    if (typeof window === 'undefined') return themeConfig.defaultPalette;

    if (themeConfig.allowThemeCustomization) {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as PaletteId | null;
        if (stored && stored in COLOR_PALETTES) {
          return stored;
        }
      } catch (err) {
        console.warn('Unable to read theme from localStorage:', err);
      }
    }

    return themeConfig.defaultPalette;
  });

  // Sync with document element data-theme attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activePaletteId);
      // Ensure dark class remains present
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      }
    }
  }, [activePaletteId]);

  const setPalette = useCallback((id: PaletteId) => {
    if (!(id in COLOR_PALETTES)) return;

    setActivePaletteId(id);

    if (themeConfig.allowThemeCustomization) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, id);
      } catch (err) {
        console.warn('Unable to persist theme to localStorage:', err);
      }
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setPalette(themeConfig.defaultPalette);
    if (themeConfig.allowThemeCustomization) {
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch (err) {
        console.warn('Unable to clear theme from localStorage:', err);
      }
    }
  }, [setPalette]);

  const activePalette = useMemo(() => COLOR_PALETTES[activePaletteId], [activePaletteId]);
  const availablePalettes = useMemo(() => Object.values(COLOR_PALETTES), []);

  const value = useMemo(
    () => ({
      activePalette,
      activePaletteId,
      setPalette,
      showThemePicker: themeConfig.showThemePicker,
      allowThemeCustomization: themeConfig.allowThemeCustomization,
      availablePalettes,
      resetToDefault,
    }),
    [activePalette, activePaletteId, setPalette, availablePalettes, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
