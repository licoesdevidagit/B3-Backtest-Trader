import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Award, Layers, Percent, Flame, Calculator, Wallet, Edit3, Check, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardMetrics } from '../types';
import { formatBRL } from '../utils/calculations';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  onOpenNewTrade: () => void;
  initialCapital?: number;
  onUpdateInitialCapital?: (capital: number) => void;
  onOpenInitialCapitalModal?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  metrics,
  onOpenNewTrade,
  initialCapital = 1000,
  onUpdateInitialCapital,
  onOpenInitialCapitalModal,
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [capitalInput, setCapitalInput] = useState<string>(() => String(initialCapital));

  useEffect(() => {
    setCapitalInput(String(initialCapital));
  }, [initialCapital]);

  const handleSaveCapital = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = capitalInput.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    const finalVal = isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100) / 100;
    onUpdateInitialCapital?.(finalVal);
    setIsEditingCapital(false);
  };

  const handleSelectPreset = (amount: number) => {
    setCapitalInput(String(amount));
    onUpdateInitialCapital?.(amount);
    setIsEditingCapital(false);
  };

  const {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    lossRate,
    totalProfit,
    totalPointsWIN,
    totalPointsWDO,
    grossGain,
    grossLoss,
    profitFactor,
    payoff,
    avgGain,
    avgLoss,
    mathematicalExpectancy,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    winStats,
    wdoStats,
    acoesStats,
  } = metrics;

  const currentCapital = initialCapital;
  const totalAccountBalance = currentCapital + totalProfit;
  const returnPercentage = currentCapital > 0 ? (totalProfit / currentCapital) * 100 : 0;

  const winPercent = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const lossPercent = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
  const bePercent = totalTrades > 0 ? (breakevens / totalTrades) * 100 : 0;

  // Render Account Capital Management Panel
  const renderCapitalManagementCard = () => (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 p-4 sm:p-5 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Capital Inicial & Saldo da Conta
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Gestão Financeira B3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina seu aporte inicial para calcular o saldo total da conta e rentabilidade acumulada do backtest.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenInitialCapitalModal && (
            <button
              type="button"
              onClick={onOpenInitialCapitalModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm"
              title="Abrir Janela de Capital Inicial"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Janela de Capital</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsEditingCapital(!isEditingCapital);
              setCapitalInput(String(currentCapital));
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isEditingCapital
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditingCapital ? 'Fechar' : 'Editar Rápido'}</span>
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditingCapital && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>Investimento / Capital Inicial da Conta (R$):</span>
            </label>
            <span className="text-slate-400 text-[11px] font-mono">
              Exemplo: R$ 1.000 para começar
            </span>
          </div>

          <form onSubmit={handleSaveCapital} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="50"
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder="1000"
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Salvar Capital</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingCapital(false)}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 mr-1 font-medium">Atalhos Rápidos:</span>
            {[1000, 2000, 5000, 10000, 20000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                  currentCapital === preset
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {formatBRL(preset)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3 Overview Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
        {/* Card 1: Capital Inicial */}
        <div 
          onClick={() => {
            if (onOpenInitialCapitalModal) {
              onOpenInitialCapitalModal();
            } else {
              setIsEditingCapital(true);
              setCapitalInput(String(currentCapital));
            }
          }}
          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="h-3.5 w-3.5 text-blue-400" />
              Capital Inicial
            </span>
            <span className="text-[10px] text-emerald-400 group-hover:underline flex items-center gap-0.5">
              <Edit3 className="h-2.5 w-2.5" />
              Editar
            </span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            {formatBRL(currentCapital)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Aporte / margem inicial da conta
          </div>
        </div>

        {/* Card 2: Resultado Líquido */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Resultado Líquido
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                totalProfit >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {totalProfit >= 0 ? 'Lucro' : 'Prejuízo'}
            </span>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
              totalProfit > 0
                ? 'text-emerald-400'
                : totalProfit < 0
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {totalProfit > 0 ? `+${formatBRL(totalProfit)}` : formatBRL(totalProfit)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>+{formatBRL(grossGain)}</span>
            <span>-{formatBRL(grossLoss)}</span>
          </div>
        </div>

        {/* Card 3: Saldo Total da Conta */}
        <div className={`p-3.5 rounded-xl bg-slate-950/60 border transition-all ${
          totalProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Saldo Total da Conta
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                returnPercentage >= 0
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {returnPercentage >= 0 ? `+${returnPercentage.toFixed(1)}%` : `${returnPercentage.toFixed(1)}%`}
            </span>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
              totalAccountBalance >= currentCapital
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {formatBRL(totalAccountBalance)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {formatBRL(currentCapital)} {totalProfit >= 0 ? '+' : '-'} {formatBRL(Math.abs(totalProfit))}
          </div>
        </div>
      </div>
    </div>
  );

  if (totalTrades === 0) {
    return (
      <div className="space-y-4">
        {renderCapitalManagementCard()}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhum trade registrado ainda</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Seu saldo inicial está configurado em {formatBRL(currentCapital)}. Comece registrando suas operações passadas no Mini Índice (WIN) ou Mini Dólar (WDO) para acompanhar o saldo em tempo real.
          </p>
          <button
            type="button"
            onClick={onOpenNewTrade}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
          >
            Registrar Primeiro Trade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account Capital & Balance Card */}
      {renderCapitalManagementCard()}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
        {/* KPI 1: Taxa de Acerto (Win Rate) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-emerald-400" />
                Taxa de Acerto
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {totalTrades} {totalTrades === 1 ? 'trade' : 'trades'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tracking-tight tabular-nums">
                {winRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({wins}G / {losses}L{breakevens > 0 ? ` / ${breakevens}E` : ''})
              </span>
            </div>
          </div>

          {/* Visual Win/Loss bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${winPercent}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Gain: ${wins} (${winPercent.toFixed(1)}%)`}
              />
              <div
                style={{ width: `${bePercent}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`0x0: ${breakevens} (${bePercent.toFixed(1)}%)`}
              />
              <div
                style={{ width: `${lossPercent}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Loss: ${losses} (${lossPercent.toFixed(1)}%)`}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400">{wins} Gain</span>
              {breakevens > 0 && <span className="text-amber-400">{breakevens} 0x0</span>}
              <span className="text-rose-400">{losses} Loss</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Lucro Líquido (R$) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Resultado Líquido
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  totalProfit >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {totalProfit >= 0 ? 'Lucro' : 'Prejuízo'}
              </span>
            </div>

            <div className="mt-2">
              <div
                className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
                  totalProfit > 0
                    ? 'text-emerald-400'
                    : totalProfit < 0
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                {formatBRL(totalProfit)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="grid grid-cols-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Ganhos:</span>
                <span className="text-emerald-400">+{formatBRL(grossGain)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Perdas:</span>
                <span className="text-rose-400">-{formatBRL(grossLoss)}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Saldo c/ Capital:</span>
              <span className={`font-semibold ${totalAccountBalance >= currentCapital ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(totalAccountBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Fator de Lucro & Payoff */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-blue-400" />
                Fator de Lucro
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Payoff: {payoff > 0 ? `${payoff.toFixed(2)}x` : '-'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${
                  profitFactor >= 2
                    ? 'text-emerald-400'
                    : profitFactor >= 1.2
                    ? 'text-blue-400'
                    : profitFactor > 0
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {profitFactor > 0 ? profitFactor.toFixed(2) : '-'}
              </span>
              <span className="text-xs text-slate-400">
                {profitFactor >= 1.5 ? 'Excelente' : profitFactor >= 1 ? 'Positivo' : 'Negativo'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Méd. Gain: <span className="text-emerald-400">+{formatBRL(avgGain)}</span></span>
            <span>Méd. Loss: <span className="text-rose-400">-{formatBRL(avgLoss)}</span></span>
          </div>
        </div>

        {/* KPI 4: Expectativa Matemática (EM) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-indigo-400" />
                Expectativa Matemática
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  mathematicalExpectancy > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : mathematicalExpectancy === 0
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {mathematicalExpectancy > 0 ? 'Edge +' : mathematicalExpectancy === 0 ? '0x0' : 'Edge -'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
                  mathematicalExpectancy > 0
                    ? 'text-emerald-400'
                    : mathematicalExpectancy < 0
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                {mathematicalExpectancy > 0 ? `+${formatBRL(mathematicalExpectancy)}` : formatBRL(mathematicalExpectancy)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / trade
              </span>
            </div>

            <div className="mt-1 text-[10px] font-mono text-slate-400 truncate" title="EM = (Taxa de Acerto × Ganho Médio) - (Taxa de Erro × Perda Média)">
              EM = (Acerto × Gain) - (Erro × Loss)
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between text-[10px]">
              <span>Acerto: <strong className="text-emerald-400">+{formatBRL((winRate / 100) * avgGain)}</strong></span>
              <span>Erro: <strong className="text-rose-400">-{formatBRL((lossRate / 100) * avgLoss)}</strong></span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 border-t border-slate-800/40">
              <span>Projeção 100T:</span>
              <span className={`font-semibold ${mathematicalExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mathematicalExpectancy >= 0 ? `+${formatBRL(mathematicalExpectancy * 100)}` : formatBRL(mathematicalExpectancy * 100)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 5: Sequências e Pontos */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                Sequência Máxima
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Gains vs Losses
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Gains Seguidos</span>
                <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {maxConsecutiveWins}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Losses Seguidos</span>
                <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
                  {maxConsecutiveLosses}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>WIN: <span className="text-white font-semibold">{totalPointsWIN >= 0 ? `+${totalPointsWIN}` : totalPointsWIN} pts</span></span>
              <span>WDO: <span className="text-white font-semibold">{totalPointsWDO >= 0 ? `+${totalPointsWDO}` : totalPointsWDO} pts</span></span>
              {acoesStats && acoesStats.trades > 0 && (
                <span>Ações: <span className="text-purple-300 font-semibold">{acoesStats.trades} op</span></span>
              )}
            </div>

            {metrics.maxDrawdown > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Max Drawdown:</span>
                <span className="text-rose-400 font-bold">-{formatBRL(metrics.maxDrawdown)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Breakdown Cards: WIN vs WDO vs AÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Mini Índice (WIN) */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              WIN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Mini Índice</span>
                <span className="text-xs text-slate-400 font-mono">
                  {winStats.trades} {winStats.trades === 1 ? 'operação' : 'operações'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Acerto: <span className="text-white font-semibold">{winStats.winRate}%</span>
                {' · '}
                Saldo: <span className={winStats.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {winStats.points >= 0 ? `+${winStats.points}` : winStats.points} pts
                </span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">Financeiro WIN</span>
            <span className={`text-base font-bold ${winStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(winStats.profit)}
            </span>
          </div>
        </div>

        {/* Mini Dólar (WDO) */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
              WDO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Mini Dólar</span>
                <span className="text-xs text-slate-400 font-mono">
                  {wdoStats.trades} {wdoStats.trades === 1 ? 'operação' : 'operações'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Acerto: <span className="text-white font-semibold">{wdoStats.winRate}%</span>
                {' · '}
                Saldo: <span className={wdoStats.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {wdoStats.points >= 0 ? `+${wdoStats.points}` : wdoStats.points} pts
                </span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">Financeiro WDO</span>
            <span className={`text-base font-bold ${wdoStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(wdoStats.profit)}
            </span>
          </div>
        </div>

        {/* Ações B3 */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
              AÇÕES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Ações B3</span>
                <span className="text-xs text-slate-400 font-mono">
                  {(acoesStats?.trades || 0)} {(acoesStats?.trades || 0) === 1 ? 'operação' : 'operações'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Acerto: <span className="text-white font-semibold">{acoesStats?.winRate || 0}%</span>
                {' · '}
                <span>{acoesStats?.totalShares ? `${acoesStats.totalShares.toLocaleString('pt-BR')} ações` : 'Day Trade à Vista'}</span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">Financeiro Ações</span>
            <span className={`text-base font-bold ${(acoesStats?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(acoesStats?.profit || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
