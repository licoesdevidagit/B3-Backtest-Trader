export type PresetThemeId = 
  | 'b3-pro' 
  | 'bloomberg-gold' 
  | 'matrix-emerald' 
  | 'midnight-sapphire' 
  | 'cyberpunk-neon' 
  | 'clean-minimal';

export type FontFamilyChoice = 
  | 'system' 
  | 'inter' 
  | 'jetbrains' 
  | 'fira' 
  | 'space';

export type LayoutDensity = 'compact' | 'standard' | 'spacious';
export type LayoutWidth = 'contained' | 'ultrawide';
export type BorderRadiusStyle = 'sharp' | 'rounded' | 'modern';
export type AccentColor = 'emerald' | 'blue' | 'amber' | 'purple' | 'cyan' | 'rose';
export type BackgroundStyle = 'gradient' | 'grid' | 'solid';

export interface ThemeConfig {
  presetId: PresetThemeId;
  accentColor: AccentColor;
  fontFamily: FontFamilyChoice;
  density: LayoutDensity;
  maxWidth: LayoutWidth;
  borderRadius: BorderRadiusStyle;
  backgroundStyle: BackgroundStyle;
}

export interface PresetThemeInfo {
  id: PresetThemeId;
  name: string;
  subtitle: string;
  description: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  accentName: string;
  badge: string;
  defaults: ThemeConfig;
}

export const PRESET_THEMES: PresetThemeInfo[] = [
  {
    id: 'b3-pro',
    name: 'B3 Profissional',
    subtitle: 'Padrão Oficial B3',
    description: 'Interface escura balanceada com acentos esmeralda B3 e slate institucional. Otimizada para longas horas de tela.',
    bgHex: '#020617',
    cardHex: '#0f172a',
    accentHex: '#10b981',
    accentName: 'Esmeralda',
    badge: 'PADRÃO',
    defaults: {
      presetId: 'b3-pro',
      accentColor: 'emerald',
      fontFamily: 'inter',
      density: 'standard',
      maxWidth: 'contained',
      borderRadius: 'modern',
      backgroundStyle: 'gradient',
    },
  },
  {
    id: 'bloomberg-gold',
    name: 'Terminal Bloomberg',
    subtitle: 'Cyber Gold & Preto Puro',
    description: 'Estilo terminal financeiro com fundo ultra-escuro, números em alto contraste e acentos em ouro âmbar.',
    bgHex: '#050505',
    cardHex: '#101014',
    accentHex: '#f59e0b',
    accentName: 'Ouro Âmbar',
    badge: 'TERMINAL',
    defaults: {
      presetId: 'bloomberg-gold',
      accentColor: 'amber',
      fontFamily: 'jetbrains',
      density: 'compact',
      maxWidth: 'contained',
      borderRadius: 'modern',
      backgroundStyle: 'solid',
    },
  },
  {
    id: 'matrix-emerald',
    name: 'Matrix Obsidian',
    subtitle: 'Emerald Institucional',
    description: 'Tons de verde neon e grafite profundo. Sensação de mesa quantitativa e algoritmos de alta frequência.',
    bgHex: '#010804',
    cardHex: '#031709',
    accentHex: '#10b981',
    accentName: 'Verde Matrix',
    badge: 'QUANT',
    defaults: {
      presetId: 'matrix-emerald',
      accentColor: 'emerald',
      fontFamily: 'fira',
      density: 'compact',
      maxWidth: 'ultrawide',
      borderRadius: 'rounded',
      backgroundStyle: 'grid',
    },
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    subtitle: 'Wall Street Blue',
    description: 'Azul marinho profundo com destaques em azul royal e ciano elétrico. Inspirado em dashboards de hedge funds.',
    bgHex: '#020617',
    cardHex: '#0a152e',
    accentHex: '#38bdf8',
    accentName: 'Safira Ciano',
    badge: 'WALL ST',
    defaults: {
      presetId: 'midnight-sapphire',
      accentColor: 'blue',
      fontFamily: 'space',
      density: 'standard',
      maxWidth: 'contained',
      borderRadius: 'modern',
      backgroundStyle: 'gradient',
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Tokyo Cyberpunk',
    subtitle: 'Neon Violet & Magenta',
    description: 'Tema futurista com violeta escuro e gradientes luminosos neon para quem busca um design arrojado e moderno.',
    bgHex: '#090314',
    cardHex: '#16082b',
    accentHex: '#c084fc',
    accentName: 'Neon Violet',
    badge: 'NEON',
    defaults: {
      presetId: 'cyberpunk-neon',
      accentColor: 'purple',
      fontFamily: 'inter',
      density: 'standard',
      maxWidth: 'contained',
      borderRadius: 'modern',
      backgroundStyle: 'gradient',
    },
  },
  {
    id: 'clean-minimal',
    name: 'Clean Studio',
    subtitle: 'Off-White / Modo Claro',
    description: 'Ambiente diurno limpo com fundo suave off-white e cartões brancos com alta legibilidade para ambientes claros.',
    bgHex: '#f1f5f9',
    cardHex: '#ffffff',
    accentHex: '#059669',
    accentName: 'Verde Studio',
    badge: 'CLARO',
    defaults: {
      presetId: 'clean-minimal',
      accentColor: 'emerald',
      fontFamily: 'inter',
      density: 'standard',
      maxWidth: 'contained',
      borderRadius: 'rounded',
      backgroundStyle: 'solid',
    },
  },
];

export const DEFAULT_THEME: ThemeConfig = {
  presetId: 'b3-pro',
  accentColor: 'emerald',
  fontFamily: 'inter',
  density: 'standard',
  maxWidth: 'contained',
  borderRadius: 'modern',
  backgroundStyle: 'gradient',
};
