import React from 'react';
import { PlusCircle, Sliders, Database, TrendingUp, BarChart3, ListFilter, CalendarDays, PieChart, Palette, Receipt, Trophy, Award, Wallet, Brain, Building2 } from 'lucide-react';
import { formatBRL } from '../utils/calculations';

interface HeaderProps {
  activeTab: 'dashboard' | 'graficos' | 'acoes' | 'mensal' | 'historico' | 'setups' | 'relatorios' | 'darf' | 'psicologia';
  setActiveTab: (tab: 'dashboard' | 'graficos' | 'acoes' | 'mensal' | 'historico' | 'setups' | 'relatorios' | 'darf' | 'psicologia') => void;
  onOpenNewTrade: () => void;
  onOpenSetups: () => void;
  onOpenDataBackup: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenCertificates: () => void;
  onOpenInitialCapital: () => void;
  initialCapital: number;
  achievedGoalsCount: number;
  totalTrades: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTrade,
  onOpenSetups,
  onOpenDataBackup,
  onOpenThemeCustomizer,
  onOpenCertificates,
  onOpenInitialCapital,
  initialCapital,
  achievedGoalsCount,
  totalTrades,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md w-full">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-4 lg:px-6 py-2 space-y-2">
        {/* Row 1: Wordmark & Primary Tools / Psicologia / Capital / Novo Trade */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
                  B3 Backtest
                </span>
                <span className="text-[10px] font-semibold text-emerald-400/90 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  WIN · WDO · AÇÕES
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden 2xl:block whitespace-nowrap">
                Day Trade em Mini Contratos Futuros e Ações B3
              </p>
            </div>
          </div>

          {/* Zone 2: Tools, Actions & Psicologia (posicionada nas ferramentas executivas para não sobrecarregar as abas) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Botão de Destaque Psicologia & Disciplina (removido da barra de abas para manter a navegação 100% justificada e sem transbordar no notebook) */}
            <button
              type="button"
              onClick={() => setActiveTab('psicologia')}
              title="Psicologia e Disciplina do Trader: controle emocional, ansiedade, medo e obediência ao plano"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer shadow-sm whitespace-nowrap ${
                activeTab === 'psicologia'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/20 font-bold ring-1 ring-purple-400'
                  : 'border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 hover:text-white'
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span>Psicologia</span>
              <span className="hidden xl:inline text-purple-300/80 font-normal">& Disciplina</span>
            </button>

            {/* Janela de Capital Inicial */}
            <button
              type="button"
              onClick={onOpenInitialCapital}
              title="Janela de Capital Inicial: definir e visualizar saldo inicial da conta"
              className="flex items-center justify-center py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm shadow-emerald-500/10 group whitespace-nowrap"
            >
              <Wallet className="h-3.5 w-3.5 mr-1 text-emerald-400 group-hover:text-slate-950 transition-colors" />
              <span className="hidden xl:inline mr-1 text-slate-300 group-hover:text-slate-950">Capital:</span>
              <span className="font-mono font-bold text-emerald-400 group-hover:text-slate-950 text-[11px] sm:text-xs">
                {formatBRL(initialCapital)}
              </span>
            </button>

            {/* Metas */}
            <button
              type="button"
              onClick={onOpenCertificates}
              title="Metas financeiras alcançadas e emissão de certificados oficiais"
              className="flex items-center justify-center py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm shadow-amber-500/10 whitespace-nowrap"
            >
              <Trophy className="h-3.5 w-3.5 sm:mr-1 text-amber-400" />
              <span className="hidden sm:inline">Metas</span>
              {achievedGoalsCount > 0 && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold">
                  {achievedGoalsCount}
                </span>
              )}
            </button>

            {/* Design */}
            <button
              type="button"
              onClick={onOpenThemeCustomizer}
              title="Personalização de layout, design, cores e temas"
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5 text-emerald-400" />
            </button>

            {/* Setups */}
            <button
              type="button"
              onClick={onOpenSetups}
              title="Gerenciar setups operacionais (janela de configuração)"
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-sky-400" />
            </button>

            {/* Dados */}
            <button
              type="button"
              onClick={onOpenDataBackup}
              title="Backup, exportar e importar dados"
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-slate-300" />
            </button>

            {/* Novo Trade */}
            <button
              type="button"
              onClick={onOpenNewTrade}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="font-bold">Novo Trade</span>
            </button>
          </div>
        </div>

        {/* Row 2: Barra de Navegação de Módulos 100% Justificada de Ponta a Ponta */}
        <nav className="w-full bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-8 sm:gap-1 w-full">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title="Painel geral com janelas modulares e estatísticas operacionais"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('graficos')}
              title="Central de gráficos analíticos: desempenho por setup, perdas, evolução e metas"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'graficos'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gráficos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('acoes')}
              title="Módulo dedicado a Day Trade em Ações da B3 com calculadora e histórico"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'acoes'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Ações B3</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mensal')}
              title="Resumo mensal detalhado e calendário de operações"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'mensal'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Mensal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              title="Histórico detalhado com filtros comparativos de setups"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Histórico</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-700/60 text-slate-300 font-semibold">
                {totalTrades}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('setups')}
              title="Gerenciamento e desempenho dos setups operacionais"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'setups'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Setups</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relatorios')}
              title="Relatórios analíticos e exportação em PDF"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'relatorios'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Relatórios</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('darf')}
              title="Cálculo de Imposto de Renda e emissão de DARF Day Trade (20%)"
              className={`w-full shrink-0 sm:shrink flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'darf'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              <span>DARF</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
