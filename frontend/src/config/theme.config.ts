export type PaletteId =
  | 'cyber-indigo'
  | 'emerald-jade'
  | 'electric-cyan'
  | 'solar-amber'
  | 'neon-rose';

export interface ColorPalette {
  id: PaletteId;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentGradient: string;
  glowColor: string;
  description: string;
}

export const COLOR_PALETTES: Record<PaletteId, ColorPalette> = {
  'cyber-indigo': {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    tagline: 'Indigo & Violet',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentGradient: 'from-indigo-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    description: 'Deep high-tech indigo with violet neon glows',
  },
  'emerald-jade': {
    id: 'emerald-jade',
    name: 'Emerald Jade',
    tagline: 'Emerald & Teal',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    accentGradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    description: 'Matrix-inspired organic emerald and cyber teal accents',
  },
  'electric-cyan': {
    id: 'electric-cyan',
    name: 'Electric Cyan',
    tagline: 'Cyan & Neo-Blue',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    accentGradient: 'from-cyan-400 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    description: 'Vibrant futuristic cyan with deep neo-blue aura',
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Amber',
    tagline: 'Amber & Flare Orange',
    primaryColor: '#f59e0b',
    secondaryColor: '#ea580c',
    accentGradient: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    description: 'Warm solar flare, high-contrast energetic amber',
  },
  'neon-rose': {
    id: 'neon-rose',
    name: 'Neon Rose',
    tagline: 'Synthwave Rose & Fuchsia',
    primaryColor: '#f43f5e',
    secondaryColor: '#ec4899',
    accentGradient: 'from-rose-500 to-pink-600',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    description: 'Cyberpunk synthwave rose and electric fuchsia',
  },
};

export const PALETTE_LIST: ColorPalette[] = Object.values(COLOR_PALETTES);

export const THEME_STORAGE_KEY = 'devats_active_palette';

export interface ThemeConfig {
  defaultPalette: PaletteId;
  showThemePicker: boolean;
  allowThemeCustomization: boolean;
}

const parseEnvBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (value === 'false' || value === false) return false;
  if (value === 'true' || value === true) return true;
  return defaultValue;
};

const resolveDefaultPalette = (): PaletteId => {
  const envTheme = import.meta.env.VITE_APP_THEME?.trim()?.toLowerCase();
  if (envTheme && envTheme in COLOR_PALETTES) {
    return envTheme as PaletteId;
  }
  return 'cyber-indigo';
};

export const themeConfig: ThemeConfig = {
  defaultPalette: resolveDefaultPalette(),
  showThemePicker: parseEnvBoolean(import.meta.env.VITE_APP_SHOW_THEME_PICKER, true),
  allowThemeCustomization: parseEnvBoolean(import.meta.env.VITE_APP_ALLOW_THEME_CUSTOMIZATION, true),
};
