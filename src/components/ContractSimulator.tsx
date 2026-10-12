import React, { useState, useMemo } from 'react';
import { MonthlySummary as MonthlySummaryType, Trade } from '../types';
import { calculateTradeFinancial, formatBRL } from '../utils/calculations';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Info,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface ContractSimulatorProps {
  monthlyData: MonthlySummaryType[];
  contractsByMonth: Record<string, number>;
  onContractsChange: (updated: Record<string, number>) => void;
}

const SCALE_TICKS = [1, 5, 10, 15, 20, 25, 30, 40, 50];
const MONTH_TICKS = [1, 5, 10, 20, 30, 50];

export function getSimulatedTradeValue(trade: Trade, targetContracts: number): number {
  if (trade.points !== 0) {
    return calculateTradeFinancial(trade.asset, trade.points, targetContracts);
  }
  const basePerContract = trade.contracts > 0 ? trade.financialValue / trade.contracts : trade.financialValue;
  return Number((basePerContract * targetContracts).toFixed(2));
}

export function getSimulatedMonthValue(month: MonthlySummaryType, targetContracts: number): number {
  if (!month.trades || month.trades.length === 0) {
    return Number((month.netProfit * targetContracts).toFixed(2));
  }
  return Number(month.trades.reduce((sum, t) => sum + getSimulatedTradeValue(t, targetContracts), 0).toFixed(2));
}

export const ContractSimulator: React.FC<ContractSimulatorProps> = ({
  monthlyData,
  contractsByMonth,
  onContractsChange,
}) => {
  // Global slider value (defaults to first month's contracts or 5)
  const [globalSliderValue, setGlobalSliderValue] = useState<number>(() => {
    const firstKey = monthlyData[0]?.monthKey;
    return firstKey ? (contractsByMonth[firstKey] || 5) : 5;
  });

  // Set contracts for a specific month
  const handleSetMonthContracts = (monthKey: string, newContracts: number) => {
    const valid = Math.max(1, Math.min(100, Math.round(newContracts) || 1));
    onContractsChange({
      ...contractsByMonth,
      [monthKey]: valid,
    });
  };

  // Step contracts for a specific month (+ or -)
  const stepMonthContracts = (monthKey: string, delta: number) => {
    const current = contractsByMonth[monthKey] || 1;
    handleSetMonthContracts(monthKey, current + delta);
  };

  // Apply a contract count to all months
  const applyToAllMonths = (count: number) => {
    const valid = Math.max(1, Math.min(100, Math.round(count) || 1));
    setGlobalSliderValue(valid);
    const updated: Record<string, number> = {};
    monthlyData.forEach((m) => {
      updated[m.monthKey] = valid;
    });
    onContractsChange(updated);
  };

  // Reset all months to 1 contract (base)
  const resetToSingleContract = () => {
    applyToAllMonths(1);
  };

  // Calculate cumulative original vs simulated values
  const totals = useMemo(() => {
    let originalTotal = 0;
    let simulatedTotal = 0;

    monthlyData.forEach((m) => {
      originalTotal += m.netProfit;
      const contracts = contractsByMonth[m.monthKey] || 1;
      simulatedTotal += getSimulatedMonthValue(m, contracts);
    });

    const diff = simulatedTotal - originalTotal;
    const multiplier = originalTotal !== 0 ? simulatedTotal / originalTotal : 0;
    const avgOriginal = monthlyData.length > 0 ? originalTotal / monthlyData.length : 0;
    const avgSimulated = monthlyData.length > 0 ? simulatedTotal / monthlyData.length : 0;

    return {
      originalTotal,
      simulatedTotal,
      diff,
      multiplier,
      avgOriginal,
      avgSimulated,
    };
  }, [monthlyData, contractsByMonth]);

  // Aggregate trade and points stats across all months
  const aggregateStats = useMemo(() => {
    let trades = 0;
    let wins = 0;
    let losses = 0;
    let pointsWIN = 0;
    let pointsWDO = 0;

    monthlyData.forEach((m) => {
      trades += m.totalTrades;
      wins += m.wins;
      losses += m.losses;
      pointsWIN += m.pointsWIN;
      pointsWDO += m.pointsWDO;
    });

    const winRate = trades > 0 ? (wins / trades) * 100 : 0;

    return {
      trades,
      wins,
      losses,
      pointsWIN,
      pointsWDO,
      winRate,
    };
  }, [monthlyData]);

  if (monthlyData.length === 0) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-lg space-y-5 relative overflow-hidden">
      {/* Decorative subtle backdrop highlight */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Simulador de Alavancagem por Contratos</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Barra Intuitiva
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Arraste a barra para alterar a quantidade de contratos em tempo real e visualizar a escala de lucro potencial.
            </p>
          </div>
        </div>

        {/* Global Reset */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto font-sans">
          <button
            type="button"
            onClick={resetToSingleContract}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Redefinir todos os meses para 1 contrato"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Resetar (1 ct)</span>
          </button>
        </div>
      </div>

      {/* 1. Global Intuitive Contract Slider Bar (Barra Intuitiva Principal) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-inner space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-white font-sans">
              Barra Interativa de Contratos (Todos os Meses):
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Simulando com:</span>
            <div className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs sm:text-sm font-mono font-extrabold shadow-sm flex items-center gap-1.5 animate-pulse">
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              <span>{globalSliderValue} {globalSliderValue === 1 ? 'CONTRATO' : 'CONTRATOS'}</span>
            </div>
          </div>
        </div>

        {/* Range Slider Track with dynamic gradient fill and proportional scale */}
        {(() => {
          const fillPercent = Math.min(100, Math.max(0, ((globalSliderValue - 1) / 49) * 100));

          return (
            <div className="space-y-2 pt-6 pb-1">
              <div className="relative flex items-center">
                {/* Floating Pointer Indicator Bubble above the thumb */}
                <div
                  className="absolute -top-7 transition-all duration-75 pointer-events-none -translate-x-1/2 flex flex-col items-center z-10"
                  style={{ left: `${fillPercent}%` }}
                >
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono font-extrabold text-[11px] shadow-md shadow-emerald-500/20 whitespace-nowrap">
                    {globalSliderValue} ct{globalSliderValue > 1 ? 's' : ''}
                  </span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rotate-45 -mt-0.5" />
                </div>

                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={globalSliderValue}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    applyToAllMonths(val);
                  }}
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${fillPercent}%, #1e293b ${fillPercent}%, #1e293b 100%)`,
                  }}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Exact Proportional Scale Marks matching pointer positions with 100% precision */}
              <div className="relative w-full h-6 mt-1 select-none">
                {SCALE_TICKS.map((tick) => {
                  const pct = ((tick - 1) / 49) * 100;
                  const isCurrent = globalSliderValue === tick;
                  return (
                    <div
                      key={tick}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${pct}%` }}
                    >
                      {/* Visual Tick Mark Notch */}
                      <div
                        className={`w-0.5 mb-1 rounded-full transition-all ${
                          isCurrent ? 'bg-emerald-400 h-2 w-1' : 'bg-slate-700 h-1.5'
                        }`}
                      />
                      {/* Clickable Tick Label */}
                      <button
                        type="button"
                        onClick={() => applyToAllMonths(tick)}
                        className={`text-[10px] font-mono transition-all hover:text-white ${
                          isCurrent
                            ? 'text-emerald-400 font-extrabold scale-110'
                            : 'text-slate-500'
                        }`}
                        title={`Ajustar para ${tick} contratos`}
                      >
                        {tick}ct
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2. Aggregate Simulation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Base Result */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="uppercase font-semibold tracking-wider">Resultado Base (Realizado)</span>
            <span className="font-mono font-bold text-slate-400">1 ct padrão</span>
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              totals.originalTotal >= 0 ? 'text-slate-200' : 'text-rose-400'
            }`}
          >
            {formatBRL(totals.originalTotal)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            Média: {formatBRL(totals.avgOriginal)} / mês
          </span>
        </div>

        {/* Card 2: Simulated Result */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-slate-950/80 border border-emerald-500/40 shadow-sm space-y-1 relative">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
              <span>Resultado Simulado</span>
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              {totals.multiplier > 0 ? `${totals.multiplier.toFixed(1)}x` : '-'}
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold font-mono tabular-nums ${
              totals.simulatedTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(totals.simulatedTotal)}
          </div>
          <span className="text-[11px] text-emerald-300/80 font-mono block">
            Média Simulada: {formatBRL(totals.avgSimulated)} / mês
          </span>
        </div>

        {/* Card 3: Difference / Additional Return */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="uppercase font-semibold tracking-wider">Diferença de Alavancagem</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              totals.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totals.diff >= 0 ? `+${formatBRL(totals.diff)}` : formatBRL(totals.diff)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            Lucro adicional potencial pela escala de lotes
          </span>
        </div>
      </div>

      {/* 3. Month by Month Interactive Table / Cards with Individual Sliders */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-sans">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gestão de Contratos Mês a Mês</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Ajuste cada mês individualmente e acompanhe o saldo total somado em tempo real
            </span>
          </div>

          {/* Quick Saldo Total Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-emerald-500/40 self-start sm:self-auto shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wider">
              Saldo Total Somado:
            </span>
            <span
              className={`text-sm font-extrabold font-mono tabular-nums ${
                totals.simulatedTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatBRL(totals.simulatedTotal)}
            </span>
          </div>
        </div>

        {/* Month Rows */}
        <div className="space-y-2.5">
          {monthlyData.map((m) => {
            const currentContracts = contractsByMonth[m.monthKey] || 1;
            const originalVal = m.netProfit;
            const simulatedVal = getSimulatedMonthValue(m, currentContracts);
            const diff = simulatedVal - originalVal;
            const isProfit = simulatedVal >= 0;

            return (
              <div
                key={m.monthKey}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Month Info & Base Result */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white font-sans">
                      {m.monthLabel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {m.totalTrades} {m.totalTrades === 1 ? 'trade' : 'trades'} ({m.wins}G / {m.losses}L)
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {m.winRate}% acerto
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>
                      Original (1 ct):{' '}
                      <strong className={originalVal >= 0 ? 'text-white' : 'text-rose-400'}>
                        {formatBRL(originalVal)}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Pontos WIN:{' '}
                      <strong className={m.pointsWIN >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.pointsWIN >= 0 ? `+${m.pointsWIN}` : m.pointsWIN} pts
                      </strong>
                    </span>
                    {m.pointsWDO !== 0 && (
                      <>
                        <span>·</span>
                        <span>
                          WDO:{' '}
                          <strong className={m.pointsWDO >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {m.pointsWDO >= 0 ? `+${m.pointsWDO}` : m.pointsWDO} pts
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Intuitive Slider Bar for this specific month */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  {(() => {
                    const monthFill = Math.min(100, Math.max(0, ((currentContracts - 1) / 49) * 100));

                    return (
                      <div className="w-full sm:w-60 space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Contratos:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => stepMonthContracts(m.monthKey, -1)}
                              disabled={currentContracts <= 1}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center transition-colors"
                              title="Diminuir 1 contrato"
                            >
                              -
                            </button>
                            <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs">
                              {currentContracts} {currentContracts === 1 ? 'ct' : 'cts'}
                            </span>
                            <button
                              type="button"
                              onClick={() => stepMonthContracts(m.monthKey, 1)}
                              disabled={currentContracts >= 50}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center transition-colors"
                              title="Aumentar 1 contrato"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={currentContracts}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onChange={(e) => handleSetMonthContracts(m.monthKey, parseInt(e.target.value) || 1)}
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${monthFill}%, #1e293b ${monthFill}%, #1e293b 100%)`,
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 focus:outline-none transition-all"
                        />

                        {/* Proportional Scale Notches */}
                        <div className="relative w-full h-4 select-none">
                          {MONTH_TICKS.map((tick) => {
                            const pct = ((tick - 1) / 49) * 100;
                            const isCurrent = currentContracts === tick;
                            return (
                              <button
                                key={tick}
                                type="button"
                                onClick={() => handleSetMonthContracts(m.monthKey, tick)}
                                className={`absolute -translate-x-1/2 text-[9px] font-mono transition-all hover:text-white ${
                                  isCurrent
                                    ? 'text-emerald-400 font-extrabold scale-110'
                                    : 'text-slate-500'
                                }`}
                                style={{ left: `${pct}%` }}
                                title={`Definir ${tick} contratos`}
                              >
                                {tick}c
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Simulated Value Display for this month */}
                  <div className="text-left sm:text-right font-mono min-w-[140px] pt-1 sm:pt-0">
                    <span className="text-[10px] text-slate-400 uppercase font-sans block">
                      Resultado com {currentContracts} {currentContracts === 1 ? 'ct' : 'cts'}:
                    </span>
                    <div
                      className={`text-base sm:text-lg font-bold tabular-nums ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatBRL(simulatedVal)}
                    </div>
                    {currentContracts > 1 && (
                      <span className="text-[10px] text-emerald-400 font-mono block">
                        +{formatBRL(diff)} ({currentContracts}x)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Destaque: Card de Saldo Total Somando Todos os Meses */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-r from-slate-900 via-emerald-950/25 to-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shrink-0">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                    <span>Saldo Total Acumulado (Todos os Meses)</span>
                    <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    Soma consolidada de todos os {monthlyData.length} meses com a quantidade de contratos configurada para cada mês.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-1 flex-wrap">
                <span>
                  Base (1 ct):{' '}
                  <strong className={totals.originalTotal >= 0 ? 'text-white' : 'text-rose-400'}>
                    {formatBRL(totals.originalTotal)}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Trades Totais:{' '}
                  <strong className="text-slate-200">
                    {aggregateStats.trades} ({aggregateStats.wins}G / {aggregateStats.losses}L · {aggregateStats.winRate.toFixed(1)}%)
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Pontos WIN:{' '}
                  <strong className={aggregateStats.pointsWIN >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {aggregateStats.pointsWIN >= 0 ? `+${aggregateStats.pointsWIN}` : aggregateStats.pointsWIN} pts
                  </strong>
                </span>
                {aggregateStats.pointsWDO !== 0 && (
                  <>
                    <span>·</span>
                    <span>
                      WDO:{' '}
                      <strong className={aggregateStats.pointsWDO >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {aggregateStats.pointsWDO >= 0 ? `+${aggregateStats.pointsWDO}` : aggregateStats.pointsWDO} pts
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Saldo Total Destacado */}
            <div className="text-left md:text-right font-mono bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 shrink-0 md:min-w-[240px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-sans">
                Saldo Total com Contratos:
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
                  totals.simulatedTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatBRL(totals.simulatedTotal)}
              </div>
              <div className="text-xs font-mono text-emerald-300 font-semibold mt-0.5">
                {totals.diff >= 0 ? `+${formatBRL(totals.diff)}` : formatBRL(totals.diff)}
                {totals.multiplier > 0 && ` (${totals.multiplier.toFixed(1)}x alavancado)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational / Risk Disclaimer Note */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Gerenciamento de Risco:</strong> Ao deslizar a barra para cima, tanto os ganhos quanto os rebaixamentos aumentam na mesma proporção matemática dos pontos do backtest. Verifique sua margem de garantia na corretora antes de aumentar a alavancagem em conta real.
        </p>
      </div>
    </div>
  );
};
