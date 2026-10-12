import React, { useState, useMemo } from 'react';
import { AssetType, Setup, Trade } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  calculateRiskRewardAnalysis, 
  SetupRiskRewardStat, 
  EfficiencyTier 
} from '../utils/riskRewardCalculations';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  HelpCircle, 
  X, 
  Target, 
  Award, 
  Sliders, 
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Cell
} from 'recharts';

interface RiskRewardAnalysisWidgetProps {
  trades: Trade[];
  setups: Setup[];
  onFilterBySetup?: (setupId: string) => void;
  onOpenNewTrade?: () => void;
}

export const RiskRewardAnalysisWidget: React.FC<RiskRewardAnalysisWidgetProps> = ({
  trades,
  setups,
  onFilterBySetup,
}) => {
  // Filtro de Ativo local no widget
  const [assetFilter, setAssetFilter] = useState<'ALL' | AssetType>('ALL');
  // Ordenação da tabela de setups
  const [sortBy, setSortBy] = useState<'ev' | 'rr' | 'winRate' | 'trades'>('ev');
  // Modal de ajuda / guia conceitual
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  // Setup selecionado para detalhes
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);

  // Análise completa
  const analysis = useMemo(() => {
    return calculateRiskRewardAnalysis(trades, setups, assetFilter);
  }, [trades, setups, assetFilter]);

  const { global: g, setupsStats } = analysis;

  // Setups ordenados conforme critério selecionado
  const sortedSetups = useMemo(() => {
    const list = [...setupsStats];
    switch (sortBy) {
      case 'rr':
        return list.sort((a, b) => b.riskRewardRatio - a.riskRewardRatio);
      case 'winRate':
        return list.sort((a, b) => b.winRate - a.winRate);
      case 'trades':
        return list.sort((a, b) => b.totalTrades - a.totalTrades);
      case 'ev':
      default:
        return list.sort((a, b) => b.expectedValue - a.expectedValue);
    }
  }, [setupsStats, sortBy]);

  // Dados para o Gráfico Recharts (Ganho Médio vs Risco Médio por Setup)
  const chartData = useMemo(() => {
    return setupsStats.map((s) => ({
      name: s.setupName,
      setupId: s.setupId,
      avgGain: s.avgGain,
      avgLoss: s.avgLoss, // positivo para comparação de barras
      rr: s.riskRewardRatio,
      rrFormatted: s.riskRewardFormatted,
      ev: s.expectedValue,
      trades: s.totalTrades,
      winRate: s.winRate,
      color: s.setupColor,
    }));
  }, [setupsStats]);

  // Helper de badges para o Tier de Eficiência
  const renderTierBadge = (tier: EfficiencyTier, label: string) => {
    switch (tier) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>{label}</span>
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="h-3 w-3 text-sky-400" />
            <span>{label}</span>
          </span>
        );
      case 'INVERSE_ASYMMETRY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>{label}</span>
          </span>
        );
      case 'CRITICAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            <span>{label}</span>
          </span>
        );
    }
  };

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <Scale className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-white">Análise de Risco por Trade & Relação Risco/Retorno</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Cadastre suas operações para calcular a relação risco/retorno média (Payoff), a expectativa matemática por trade e identificar quais setups entregam a maior eficiência estatística.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Análise de Risco por Trade</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                R:R Médio & Eficiência
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Relação Risco/Retorno (Payoff), valor esperado por operação (EV) e taxa mínima de acerto para setups lucrativos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro de Ativo Rápido */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => setAssetFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                assetFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({trades.length})
            </button>
            <button
              type="button"
              onClick={() => setAssetFilter('WIN')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                assetFilter === 'WIN'
                  ? 'bg-blue-600/30 text-sky-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WIN
            </button>
            <button
              type="button"
              onClick={() => setAssetFilter('WDO')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                assetFilter === 'WDO'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WDO
            </button>
          </div>

          {/* Botão Guia Educativo */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Entenda as métricas de Risco/Retorno e Expectativa Matemática"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Como Funciona?</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas Chave Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Relação Risco / Retorno Média Global */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-emerald-400" />
              <span>R:R Médio (Payoff)</span>
            </span>
            {renderTierBadge(g.efficiencyTier, g.efficiencyLabel)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {g.riskRewardFormatted}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {g.riskRewardRatio >= 1.0 ? '(Assimetria Favorável)' : '(Assimetria Desfavorável)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Para cada <strong className="text-rose-400">R$ 1,00</strong> de risco nos stops, você busca <strong className="text-emerald-400">R$ {g.riskRewardRatio.toFixed(2)}</strong> de retorno nos alvos.
            </p>
          </div>
        </div>

        {/* Card 2: Ganho Médio vs Risco Médio nos Trades */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-sky-400" />
              <span>Alvo vs Stop Médio</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Médias Realizadas</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ganho Médio:</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{formatBRL(g.avgGain)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                <span>Risco/Perda Média:</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                -{formatBRL(g.avgLoss)}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>WIN: +{g.avgPtsWinGain} / -{g.avgPtsWinLoss} pts</span>
              <span>WDO: +{g.avgPtsWdoGain} / -{g.avgPtsWdoLoss} pts</span>
            </div>
          </div>
        </div>

        {/* Card 3: Expectativa Matemática (EV por Trade) */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Expectativa Matemática (EV)</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              g.expectedValue >= 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {g.expectedValue >= 0 ? 'Lucrativo' : 'Prejuízo Estatístico'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono tracking-tight ${
                g.expectedValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {g.expectedValue >= 0 ? `+${formatBRL(g.expectedValue)}` : formatBRL(g.expectedValue)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ trade</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Valor líquido gerado probabilisticamente por cada operação aberta no sistema.
            </p>
          </div>
        </div>

        {/* Card 4: Taxa de Acerto de Equilíbrio (Breakeven) */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-purple-400" />
              <span>Taxa Mínima Requerida</span>
            </span>
            <span className={`text-[10px] font-mono font-bold ${
              g.safetyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              Margem: {g.safetyMargin >= 0 ? `+${g.safetyMargin}%` : `${g.safetyMargin}%`}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-slate-400">Mínima p/ 0x0:</span>
              <span className="text-sm font-bold text-white">{g.breakevenWinRate}%</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-slate-400">Sua Taxa Real:</span>
              <span className="text-sm font-bold text-emerald-400">{g.winRate}%</span>
            </div>

            {/* Visual Safety Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative mt-1.5">
              <div 
                className="h-full bg-slate-600 absolute left-0 top-0"
                style={{ width: `${Math.min(100, g.breakevenWinRate)}%` }}
                title={`Mínimo: ${g.breakevenWinRate}%`}
              />
              <div 
                className={`h-full absolute left-0 top-0 transition-all ${
                  g.winRate >= g.breakevenWinRate ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, g.winRate)}%` }}
                title={`Taxa Real: ${g.winRate}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Destaques e Recomendações Automáticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Destaque 1: Setup Mais Eficiente */}
        {g.mostEfficientSetup && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Setup Mais Eficiente</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                Score: {g.mostEfficientSetup.efficiencyScore}/100
              </span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: g.mostEfficientSetup.setupColor }}
              />
              <span>{g.mostEfficientSetup.setupName}</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {g.mostEfficientSetup.recommendation}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/90 pt-1 border-t border-emerald-500/20">
              <span>R:R: {g.mostEfficientSetup.riskRewardFormatted}</span>
              <span>EV: +{formatBRL(g.mostEfficientSetup.expectedValue)} / trade</span>
            </div>
          </div>
        )}

        {/* Destaque 2: Melhor Assimetria (R:R Ratio) */}
        {g.bestSetup && (
          <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-sky-400" />
                <span>Maior Assimetria (R:R)</span>
              </span>
              <span className="text-xs font-mono font-bold text-sky-300">
                {g.bestSetup.riskRewardFormatted}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: g.bestSetup.setupColor }}
              />
              <span>{g.bestSetup.setupName}</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Ganho médio de <strong className="text-emerald-400">+{formatBRL(g.bestSetup.avgGain)}</strong> contra risco médio de <strong className="text-rose-400">-{formatBRL(g.bestSetup.avgLoss)}</strong>.
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-sky-400/90 pt-1 border-t border-sky-500/20">
              <span>Exige só {g.bestSetup.breakevenWinRate}% de acerto</span>
              <span>Acerto Real: {g.bestSetup.winRate}%</span>
            </div>
          </div>
        )}

        {/* Destaque 3: Setup que Requer Atenção / Calibragem */}
        {g.attentionSetup && g.attentionSetup.setupId !== g.mostEfficientSetup?.setupId && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Ponto de Calibragem</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {g.attentionSetup.efficiencyLabel}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: g.attentionSetup.setupColor }}
              />
              <span>{g.attentionSetup.setupName}</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {g.attentionSetup.recommendation}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/90 pt-1 border-t border-amber-500/20">
              <span>R:R: {g.attentionSetup.riskRewardFormatted}</span>
              <span>EV: {formatBRL(g.attentionSetup.expectedValue)} / trade</span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Visual Recharts: Ganho Médio vs Risco Médio por Setup */}
      {chartData.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <span>Comparativo Visual de Risco x Retorno por Setup (R$)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Barras verdes indicam o Ganho Médio; barras vermelhas indicam o Risco Médio assumido nos stops.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Ganho Médio (R$)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                <span>Risco Médio / Stop (R$)</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  interval={0}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => `R$ ${val}`}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{data.name}</span>
                            <span className="font-mono text-emerald-400">{data.rrFormatted}</span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between text-emerald-400">
                              <span>Ganho Médio:</span>
                              <span className="font-bold">+{formatBRL(data.avgGain)}</span>
                            </div>
                            <div className="flex justify-between text-rose-400">
                              <span>Risco Médio:</span>
                              <span className="font-bold">-{formatBRL(data.avgLoss)}</span>
                            </div>
                            <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                              <span>Expectativa (EV):</span>
                              <span className="font-bold">+{formatBRL(data.ev)}/trade</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Taxa de Acerto:</span>
                              <span>{data.winRate}% ({data.trades} trades)</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgGain" fill="#10b981" radius={[4, 4, 0, 0]} name="Ganho Médio" />
                <Bar dataKey="avgLoss" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Risco Médio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Ranking e Eficiência Detalhada por Setup */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Ranking de Eficiência dos Setups</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Identifique quais estratégias oferecem a melhor assimetria matemática e margem de segurança.
            </p>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="ev">Expectativa (EV / Trade)</option>
              <option value="rr">Maior R:R (Payoff)</option>
              <option value="winRate">Taxa de Acerto (%)</option>
              <option value="trades">Mais Operações</option>
            </select>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Setup</th>
                <th className="py-2.5 px-3">R:R Realizado</th>
                <th className="py-2.5 px-3 text-right">Ganho Médio</th>
                <th className="py-2.5 px-3 text-right">Risco Médio</th>
                <th className="py-2.5 px-3 text-center">Acerto Real vs Mínimo</th>
                <th className="py-2.5 px-3 text-right">Expectativa (EV)</th>
                <th className="py-2.5 px-3 text-center">Classificação</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sortedSetups.map((s) => {
                const isSelected = selectedSetupId === s.setupId;

                return (
                  <React.Fragment key={s.setupId}>
                    <tr 
                      className={`hover:bg-slate-900/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-900/70' : ''
                      }`}
                      onClick={() => setSelectedSetupId(isSelected ? null : s.setupId)}
                    >
                      {/* Setup Name & Color */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: s.setupColor }}
                          />
                          <div>
                            <span className="font-bold text-white block">{s.setupName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.totalTrades} {s.totalTrades === 1 ? 'trade' : 'trades'} ({s.wins}W / {s.losses}L)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* R:R Realizado */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${
                            s.riskRewardRatio >= 1.5 
                              ? 'text-emerald-400' 
                              : s.riskRewardRatio >= 1.0 
                              ? 'text-sky-300' 
                              : 'text-amber-400'
                          }`}>
                            {s.riskRewardFormatted}
                          </span>
                        </div>
                        {s.plannedRRFormatted && (
                          <span className="text-[10px] text-slate-500 block">
                            Planejado: {s.plannedRRFormatted}
                          </span>
                        )}
                      </td>

                      {/* Ganho Médio */}
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                        +{formatBRL(s.avgGain)}
                        {s.ptsWinGain > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            +{s.ptsWinGain} pts
                          </span>
                        )}
                      </td>

                      {/* Risco Médio */}
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">
                        -{formatBRL(s.avgLoss)}
                        {s.ptsWinLoss > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            -{s.ptsWinLoss} pts
                          </span>
                        )}
                      </td>

                      {/* Acerto Real vs Mínimo */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-block font-mono">
                          <div className="flex items-center justify-center gap-1 text-[11px]">
                            <strong className="text-white">{s.winRate}%</strong>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-400" title="Mínimo necessário">{s.breakevenWinRate}%</span>
                          </div>
                          <span className={`text-[10px] font-bold block ${
                            s.safetyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {s.safetyMargin >= 0 ? `+${s.safetyMargin}% folga` : `${s.safetyMargin}% déficit`}
                          </span>
                        </div>
                      </td>

                      {/* Expectativa Matemática (EV) */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={`font-bold text-sm block ${
                          s.expectedValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {s.expectedValue >= 0 ? `+${formatBRL(s.expectedValue)}` : formatBRL(s.expectedValue)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">por trade</span>
                      </td>

                      {/* Classificação */}
                      <td className="py-2.5 px-3 text-center">
                        {renderTierBadge(s.efficiencyTier, s.efficiencyLabel)}
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-right">
                        {onFilterBySetup && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFilterBySetup(s.setupId);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                            title="Filtrar trades deste setup no histórico"
                          >
                            <span>Trades</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Linha Expandida com Análise e Recomendações */}
                    {isSelected && (
                      <tr className="bg-slate-900/90 border-b border-slate-800">
                        <td colSpan={8} className="p-3.5 space-y-2">
                          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-white">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Diagnóstico Estatístico: {s.setupName}</span>
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                Eficiência: {s.efficiencyScore}/100
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {s.recommendation}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                              <div>
                                <span className="text-slate-500 block">Lucro Líquido:</span>
                                <strong className={s.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {formatBRL(s.totalProfit)}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Ganhos Brutos:</span>
                                <strong className="text-emerald-400">{formatBRL(s.grossGain)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Prejuízos Brutos:</span>
                                <strong className="text-rose-400">{formatBRL(s.grossLoss)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Fator de Lucro:</span>
                                <strong className="text-white">
                                  {s.grossLoss > 0 ? (s.grossGain / s.grossLoss).toFixed(2) : '99.9'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Educativo: Entenda a Relação Risco x Retorno */}
      {isHelpModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl space-y-4 overscroll-contain text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Guia de Análise de Risco x Retorno</h3>
                  <p className="text-xs text-slate-400">Como identificar e calibrar seus setups mais eficientes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">1.</span> O que é a Relação Risco / Retorno (Payoff)?
                </h4>
                <p>
                  É a proporção entre o <strong>ganho financeiro médio</strong> das operações vencedoras e a <strong>perda média</strong> das operações perdedoras.
                  Por exemplo, um R:R de <strong>1 : 2.0</strong> significa que a cada R$ 1,00 que você arrisca no stop, você coloca em média R$ 2,00 no bolso quando acerta.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">2.</span> Taxa de Acerto de Equilíbrio (Breakeven Win Rate)
                </h4>
                <p>
                  Calculada pela fórmula <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">1 / (1 + RR)</code>. Revela a taxa de acerto mínima que você precisa ter para <strong>não perder dinheiro</strong>:
                </p>
                <ul className="list-disc list-inside space-y-0.5 pt-1 text-slate-400 font-mono text-[11px]">
                  <li>R:R de 1 : 1.0 → Exige 50.0% de acerto</li>
                  <li>R:R de 1 : 1.5 → Exige 40.0% de acerto</li>
                  <li>R:R de 1 : 2.0 → Exige apenas 33.3% de acerto!</li>
                  <li>R:R de 1 : 0.5 (arrisca 2 p/ ganhar 1) → Exige 66.7% de acerto!</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">3.</span> Expectativa Matemática (EV por Trade)
                </h4>
                <p>
                  É o valor médio real que cada clique no mouse deposita na sua conta. Se um setup tem EV de <strong>+R$ 45,00</strong>, mesmo que você tome stops normais, no longo prazo cada operação executada de acordo com o plano gera R$ 45,00 de patrimônio líquido.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">4.</span> Alerta: O Perigo da Assimetria Inversa
                </h4>
                <p>
                  Ocorre quando o trader tem uma taxa de acerto alta (ex: 75%), mas ganha pouco por trade (R$ 50) e deixa o stop correr (perdendo R$ 250). Uma sequência de apenas 2 perdas pode apagar uma semana inteira de ganhos. Setups com assimetria favorável (&gt; 1:1.5) protegem a sua mente e seu capital.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
