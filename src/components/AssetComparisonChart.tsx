import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Scale, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface AssetComparisonChartProps {
  trades: Trade[];
}

export const AssetComparisonChart: React.FC<AssetComparisonChartProps> = ({ trades }) => {
  const [viewMode, setViewMode] = useState<'financial' | 'winrate' | 'all'>('all');

  const stats = useMemo(() => {
    const winTrades = trades.filter((t) => t.asset === 'WIN');
    const wdoTrades = trades.filter((t) => t.asset === 'WDO');

    const calculateMetrics = (assetTrades: Trade[]) => {
      let netProfit = 0;
      let grossGain = 0;
      let grossLoss = 0;
      let wins = 0;
      let losses = 0;
      let breakevens = 0;
      let points = 0;
      let contracts = 0;

      assetTrades.forEach((t) => {
        netProfit += t.financialValue;
        if (t.financialValue > 0) grossGain += t.financialValue;
        if (t.financialValue < 0) grossLoss += Math.abs(t.financialValue);

        if (t.result === 'GAIN') wins++;
        else if (t.result === 'LOSS') losses++;
        else breakevens++;

        points += t.points;
        contracts += t.contracts;
      });

      const totalTrades = assetTrades.length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? 99 : 0;
      const avgTrade = totalTrades > 0 ? netProfit / totalTrades : 0;
      const avgWin = wins > 0 ? grossGain / wins : 0;
      const avgLoss = losses > 0 ? grossLoss / losses : 0;
      const payoff = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 99 : 0;

      return {
        totalTrades,
        wins,
        losses,
        breakevens,
        winRate,
        netProfit,
        grossGain,
        grossLoss,
        profitFactor,
        points,
        contracts,
        avgTrade,
        avgWin,
        avgLoss,
        payoff,
      };
    };

    const win = calculateMetrics(winTrades);
    const wdo = calculateMetrics(wdoTrades);
    const acoesTrades = trades.filter((t) => t.asset === 'ACOES');
    const acoes = calculateMetrics(acoesTrades);

    // Scaling calculations for bar charts
    const maxProfit = Math.max(Math.abs(win.netProfit), Math.abs(wdo.netProfit), Math.abs(acoes.netProfit), 1);
    const maxGrossGain = Math.max(win.grossGain, wdo.grossGain, acoes.grossGain, 1);
    const totalVolume = win.grossGain + win.grossLoss + wdo.grossGain + wdo.grossLoss + acoes.grossGain + acoes.grossLoss;

    // Leader analysis
    const higherProfitAsset = win.netProfit >= wdo.netProfit ? 'WIN' : 'WDO';
    const higherWinRateAsset = win.winRate >= wdo.winRate ? 'WIN' : 'WDO';

    return {
      win,
      wdo,
      acoes,
      maxProfit,
      maxGrossGain,
      totalVolume,
      higherProfitAsset,
      higherWinRateAsset,
    };
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Scale className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Comparativo de Desempenho: Mini Índice (WIN) vs Mini Dólar (WDO)</span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gráficos comparativos de volume financeiro, resultado líquido e taxa de acerto entre os dois principais contratos futuros da B3.
          </p>
        </div>

        {/* View Mode Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'all'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => setViewMode('financial')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'financial'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volume Financeiro
          </button>
          <button
            type="button"
            onClick={() => setViewMode('winrate')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'winrate'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Taxa de Acerto
          </button>
        </div>
      </div>

      {/* KPI Cards: WIN vs WDO vs AÇÕES side-by-side snapshot */}
      <div className={`grid grid-cols-1 ${stats.acoes.totalTrades > 0 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        {/* Card WIN (Mini Índice) */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-slate-950 to-slate-950 shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Mini Índice (WIN)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                R$ 0,20 / pt
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {stats.win.totalTrades} {stats.win.totalTrades === 1 ? 'trade' : 'trades'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Resultado Líquido</span>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  stats.win.netProfit >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}
              >
                {formatBRL(stats.win.netProfit)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Taxa de Acerto</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums flex items-center gap-1">
                {stats.win.winRate.toFixed(1)}%
                <span className="text-[11px] font-normal text-slate-400">
                  ({stats.win.wins}G / {stats.win.losses}L)
                </span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Pontos:{' '}
              <strong className={stats.win.points >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                {stats.win.points >= 0 ? `+${stats.win.points}` : stats.win.points} pts
              </strong>
            </span>
            <span>·</span>
            <span>
              Fator de Lucro:{' '}
              <strong className="text-slate-200">{stats.win.profitFactor.toFixed(2)}</strong>
            </span>
            <span>·</span>
            <span>
              Payoff: <strong className="text-slate-200">{stats.win.payoff.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Card WDO (Mini Dólar) */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Mini Dólar (WDO)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                R$ 10,00 / pt
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {stats.wdo.totalTrades} {stats.wdo.totalTrades === 1 ? 'trade' : 'trades'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Resultado Líquido</span>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  stats.wdo.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatBRL(stats.wdo.netProfit)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Taxa de Acerto</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums flex items-center gap-1">
                {stats.wdo.winRate.toFixed(1)}%
                <span className="text-[11px] font-normal text-slate-400">
                  ({stats.wdo.wins}G / {stats.wdo.losses}L)
                </span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Pontos:{' '}
              <strong className={stats.wdo.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {stats.wdo.points >= 0 ? `+${stats.wdo.points}` : stats.wdo.points} pts
              </strong>
            </span>
            <span>·</span>
            <span>
              Fator de Lucro:{' '}
              <strong className="text-slate-200">{stats.wdo.profitFactor.toFixed(2)}</strong>
            </span>
            <span>·</span>
            <span>
              Payoff: <strong className="text-slate-200">{stats.wdo.payoff.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Card Ações (B3) */}
        {stats.acoes.totalTrades > 0 && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-950 to-slate-950 shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Ações (B3)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Day Trade à Vista
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {stats.acoes.totalTrades} {stats.acoes.totalTrades === 1 ? 'trade' : 'trades'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Resultado Líquido</span>
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    stats.acoes.netProfit >= 0 ? 'text-purple-400' : 'text-rose-400'
                  }`}
                >
                  {formatBRL(stats.acoes.netProfit)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Taxa de Acerto</span>
                <span className="text-xl font-bold font-mono text-white tabular-nums flex items-center gap-1">
                  {stats.acoes.winRate.toFixed(1)}%
                  <span className="text-[11px] font-normal text-slate-400">
                    ({stats.acoes.wins}G / {stats.acoes.losses}L)
                  </span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Fator Lucro:{' '}
                <strong className="text-slate-200">{stats.acoes.profitFactor.toFixed(2)}</strong>
              </span>
              <span>·</span>
              <span>
                Payoff: <strong className="text-slate-200">{stats.acoes.payoff.toFixed(2)}</strong>
              </span>
              <span>·</span>
              <span>
                Méd/Trade: <strong className={stats.acoes.avgTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatBRL(stats.acoes.avgTrade)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* COMPARATIVE BAR CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* GRÁFICO 1: Comparativo de Volume Financeiro (R$) */}
        {(viewMode === 'all' || viewMode === 'financial') && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                  Volume Financeiro Líquido (R$)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Comparativo de Saldo Realizado
              </span>
            </div>

            {/* Horizontal Bar Chart for Financial Result */}
            <div className="space-y-3.5 pt-2">
              {/* WIN Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Mini Índice (WIN)</span>
                  </span>
                  <span
                    className={`font-bold ${
                      stats.win.netProfit >= 0 ? 'text-blue-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(stats.win.netProfit)}
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(6, Math.min(100, (Math.abs(stats.win.netProfit) / stats.maxProfit) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Ganhos: +{formatBRL(stats.win.grossGain)}</span>
                  <span>Perdas: -{formatBRL(stats.win.grossLoss)}</span>
                </div>
              </div>

              {/* WDO Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Mini Dólar (WDO)</span>
                  </span>
                  <span
                    className={`font-bold ${
                      stats.wdo.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(stats.wdo.netProfit)}
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(6, Math.min(100, (Math.abs(stats.wdo.netProfit) / stats.maxProfit) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Ganhos: +{formatBRL(stats.wdo.grossGain)}</span>
                  <span>Perdas: -{formatBRL(stats.wdo.grossLoss)}</span>
                </div>
              </div>
            </div>

            {/* Financial Insight Pill */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Maior Retorno Financeiro:</span>
              </span>
              <strong className="text-white font-mono">
                {stats.higherProfitAsset === 'WIN' ? 'Mini Índice (WIN)' : 'Mini Dólar (WDO)'}
              </strong>
            </div>
          </div>
        )}

        {/* GRÁFICO 2: Comparativo de Taxa de Acerto (% Win Rate) */}
        {(viewMode === 'all' || viewMode === 'winrate') && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                  Taxa de Acerto & Eficiência (%)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Assertividade em Trade
              </span>
            </div>

            {/* Horizontal Bar Gauge for Win Rate */}
            <div className="space-y-3.5 pt-2">
              {/* WIN Win Rate Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Mini Índice (WIN)</span>
                  </span>
                  <span className="text-white font-bold">{stats.win.winRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(4, Math.min(100, stats.win.winRate))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{stats.win.wins} vitórias ({stats.win.totalTrades > 0 ? ((stats.win.wins / stats.win.totalTrades) * 100).toFixed(0) : 0}%)</span>
                  <span>{stats.win.losses} derrotas</span>
                </div>
              </div>

              {/* WDO Win Rate Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Mini Dólar (WDO)</span>
                  </span>
                  <span className="text-white font-bold">{stats.wdo.winRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(4, Math.min(100, stats.wdo.winRate))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{stats.wdo.wins} vitórias ({stats.wdo.totalTrades > 0 ? ((stats.wdo.wins / stats.wdo.totalTrades) * 100).toFixed(0) : 0}%)</span>
                  <span>{stats.wdo.losses} derrotas</span>
                </div>
              </div>
            </div>

            {/* Win Rate Insight Pill */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Maior Taxa de Acerto:</span>
              </span>
              <strong className="text-white font-mono">
                {stats.higherWinRateAsset === 'WIN' ? 'Mini Índice (WIN)' : 'Mini Dólar (WDO)'} (
                {(stats.higherWinRateAsset === 'WIN' ? stats.win.winRate : stats.wdo.winRate).toFixed(1)}%)
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Comparative Ratio & Summary Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-sans">
            <strong>Proporção de Operações no Backtest:</strong>{' '}
            {stats.win.totalTrades > 0 && stats.wdo.totalTrades > 0 ? (
              <span>
                Mini Índice representa {((stats.win.totalTrades / trades.length) * 100).toFixed(0)}% das operações ({stats.win.totalTrades}) e Mini Dólar representa {((stats.wdo.totalTrades / trades.length) * 100).toFixed(0)}% ({stats.wdo.totalTrades}).
              </span>
            ) : (
              <span>
                {stats.win.totalTrades > 0 ? '100% das operações realizadas em Mini Índice.' : '100% das operações realizadas em Mini Dólar.'}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span className="text-slate-400">WIN: <strong className="text-white">{stats.win.totalTrades}</strong> ops</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-slate-400">WDO: <strong className="text-white">{stats.wdo.totalTrades}</strong> ops</span>
          </div>
        </div>
      </div>
    </div>
  );
};
