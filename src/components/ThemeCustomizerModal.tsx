import React, { useState } from 'react';
import { 
  Palette, 
  X, 
  Check, 
  Sparkles, 
  Type, 
  Layout, 
  Sliders, 
  RotateCcw, 
  Monitor, 
  Sun, 
  Moon, 
  Grid, 
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { 
  PRESET_THEMES, 
  PresetThemeId, 
  FontFamilyChoice, 
  LayoutDensity, 
  LayoutWidth, 
  BorderRadiusStyle, 
  AccentColor, 
  BackgroundStyle 
} from '../types/theme';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { theme, updateTheme, applyPreset, resetTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'presets' | 'colors' | 'typography' | 'layout'>('presets');

  if (!isOpen) return null;

  const ACCENT_COLORS: { id: AccentColor; name: string; hex: string; desc: string }[] = [
    { id: 'emerald', name: 'Verde Esmeralda', hex: '#10b981', desc: 'B3 Oficial & Alta Performance' },
    { id: 'blue', name: 'Azul Real', hex: '#3b82f6', desc: 'Mini Índice & Institucional' },
    { id: 'amber', name: 'Ouro Âmbar', hex: '#f59e0b', desc: 'Terminal Bloomberg' },
    { id: 'purple', name: 'Roxo Elétrico', hex: '#a855f7', desc: 'Futurista & Neon Desk' },
    { id: 'cyan', name: 'Ciano High-Tech', hex: '#06b6d4', desc: 'Trading Desk Digital' },
    { id: 'rose', name: 'Coral / Rose', hex: '#f43f5e', desc: 'Agulha & Alerta' },
  ];

  const FONT_CHOICES: { id: FontFamilyChoice; name: string; tag: string; desc: string; sample: string }[] = [
    { 
      id: 'inter', 
      name: 'Inter Display', 
      tag: 'Sans-Serif', 
      desc: 'Altamente legível, moderno e padrão ouro em interfaces financeiras.',
      sample: 'R$ 1.450,00 · 68.4% Win'
    },
    { 
      id: 'jetbrains', 
      name: 'JetBrains Mono', 
      tag: 'Monospace', 
      desc: 'Tipografia de código e terminais, com alinhamento numérico impecável.',
      sample: 'WINV24: +350 pts [GAIN]'
    },
    { 
      id: 'fira', 
      name: 'Fira Code', 
      tag: 'Tech Mono', 
      desc: 'Estilo técnico quantitativo, com ligaduras e proporções estritas.',
      sample: 'WDOX24: +12.5 pts · 1 ct'
    },
    { 
      id: 'space', 
      name: 'Space Grotesk', 
      tag: 'Geométrica', 
      desc: 'Geométrica e marcante, estética de hedge funds e startups fintech.',
      sample: 'B3 BACKTEST TRADING DESK'
    },
    { 
      id: 'system', 
      name: 'System Default', 
      tag: 'Nativa', 
      desc: 'Usa a fonte nativa do seu sistema operacional (Apple San Francisco ou Segoe UI).',
      sample: 'Operações Day Trade'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Personalização de Design & Layout</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Alterne entre modelos prontos, esquemas de cores, tipografia e densidade de tela.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-3.5 sm:px-4.5 py-2.5 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveCategory('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'presets'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Modelos Prontos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('colors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'colors'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="h-3.5 w-3.5 text-sky-400" />
              <span>Cores & Destaques</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('typography')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'typography'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="h-3.5 w-3.5 text-amber-400" />
              <span>Tipografia & Fontes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('layout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'layout'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="h-3.5 w-3.5 text-purple-400" />
              <span>Layout & Espaçamento</span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4 overscroll-contain">

        {/* TAB 1: MODELOS PRONTOS (PRESETS) */}
        {activeCategory === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selecione um tema pré-configurado com 1 clique:</span>
              <span className="font-mono text-emerald-400">
                Tema Ativo: {PRESET_THEMES.find((p) => p.id === theme.presetId)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {PRESET_THEMES.map((preset) => {
                const isActive = theme.presetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'border-emerald-500 bg-slate-950 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                            style={{ backgroundColor: preset.accentHex }}
                          />
                          <span className="text-sm font-bold text-white font-sans">
                            {preset.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {preset.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    {/* Visual miniature preview bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.bgHex }} />
                        <span className="truncate">{preset.subtitle}</span>
                      </div>

                      {isActive ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Check className="h-3 w-3" />
                          <span>Ativado</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 group-hover:text-slate-300">
                          Aplicar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CORES & DESTAQUES */}
        {activeCategory === 'colors' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-sans block">
                Cor de Destaque Primária (Acentos & Lucros)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ACCENT_COLORS.map((col) => {
                  const isSelected = theme.accentColor === col.id;

                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => updateTheme({ accentColor: col.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-white bg-slate-950 shadow-md ring-1 ring-white/30'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-slate-950 font-bold"
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-slate-950" />}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          {col.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {col.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-sans block">
                Textura & Estilo de Fundo
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateTheme({ backgroundStyle: 'gradient' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.backgroundStyle === 'gradient'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Gradiente Suave
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme({ backgroundStyle: 'grid' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.backgroundStyle === 'grid'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Grade Técnica (Grid)
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme({ backgroundStyle: 'solid' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.backgroundStyle === 'solid'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Preto Sólido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIPOGRAFIA & FONTES */}
        {activeCategory === 'typography' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Escolha a fonte que melhor se adapta à sua leitura gráfica e técnica:
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {FONT_CHOICES.map((f) => {
                const isSelected = theme.fontFamily === f.id;

                return (
                  <div
                    key={f.id}
                    onClick={() => updateTheme({ fontFamily: f.id })}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-slate-950 ring-1 ring-emerald-500/40 shadow-sm'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {f.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {f.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.desc}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                        {f.sample}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: LAYOUT & ESPAÇAMENTO */}
        {activeCategory === 'layout' && (
          <div className="space-y-4">
            {/* Density */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-sans block">
                Densidade de Informação na Tela
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateTheme({ density: 'compact' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    theme.density === 'compact'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-white mb-0.5">Compacta</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Mesa de operações. Máximo conteúdo por pixel sem rolagem.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme({ density: 'standard' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    theme.density === 'standard'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-white mb-0.5">Padrão</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Equilíbrio visual perfeito entre respiro e densidade.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme({ density: 'spacious' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    theme.density === 'spacious'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-white mb-0.5">Confortável</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Espaçamento generoso para monitores grandes e apresentações.
                  </span>
                </button>
              </div>
            </div>

            {/* Max Width */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-sans block">
                Largura da Área de Trabalho
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateTheme({ maxWidth: 'contained' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.maxWidth === 'contained'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Contida (Centralizada · Max 1280px)
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme({ maxWidth: 'ultrawide' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.maxWidth === 'ultrawide'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Ultrawide / 100% Tela Cheia
                </button>
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-sans block">
                Estilo dos Cantos e Bordas
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateTheme({ borderRadius: 'sharp' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.borderRadius === 'sharp'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Cantos Retos (Terminal)
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme({ borderRadius: 'rounded' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.borderRadius === 'rounded'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Bordas Suaves (8px)
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme({ borderRadius: 'modern' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme.borderRadius === 'modern'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Arredondado Moderno (16px)
                </button>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Pinned Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={resetTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Padrão B3</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md cursor-pointer"
          >
            Concluir & Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
