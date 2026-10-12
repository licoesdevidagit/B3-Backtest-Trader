import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  PlusCircle, 
  Calculator, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Layers, 
  Sliders, 
  BarChart3, 
  Clock, 
  Briefcase, 
  Zap, 
  Filter, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Trade, Setup, TradeResult } from '../types';
import { 
  formatBRL, 
  formatDateBR, 
  B3_POPULAR_STOCKS, 
  calculateAcoesTradeDetails, 
  B3StockInfo 
} from '../utils/calculations';

interface AcoesDayTradeViewProps {
  trades: Trade[];
  setups: Setup[];
  onOpenNewTrade: (initialData?: Partial<Trade>) => void;
  onEditTrade: (trade: Trade) => void;
  onNavigateToHistory: (ticker?: string) => void;
}

export const AcoesDayTradeView: React.FC<AcoesDayTradeViewProps> = ({
  trades,
  setups,
  onOpenNewTrade,
  onEditTrade,
  onNavigateToHistory,
}) => {
  // Filter only equity day trades
  const acoesTrades = useMemo(() => {
    return trades.filter((t) => t.asset === 'ACOES');
  }, [trades]);

  // Selected ticker filter for detailed view
  const [selectedTickerFilter, setSelectedTickerFilter] = useState<string>('ALL');

  // Simulator State
  const [simTicker, setSimTicker] = useState<string>('PETR4');
  const [simDirection, setSimDirection] = useState<'COMPRA' | 'VENDA'>('COMPRA');
  const [simQuantity, setSimQuantity] = useState<number>(500);
  const [simEntryPrice, setSimEntryPrice] = useState<number>(38.50);
  const [simExitPrice, setSimExitPrice] = useState<number>(39.10);
  const [simLeverage, setSimLeverage] = useState<number>(20); // 20x alavancagem intraday padrão B3

  // Simulated calculations
  const simResult = useMemo(() => {
    return calculateAcoesTradeDetails(
      simDirection,
      simQuantity,
      simEntryPrice,
      simExitPrice
    );
  }, [simDirection, simQuantity, simEntryPrice, simExitPrice]);

  const simRequiredMargin = useMemo(() => {
    const totalOrderValue = simEntryPrice * simQuantity;
    return simLeverage > 0 ? totalOrderValue / simLeverage : totalOrderValue;
  }, [simEntryPrice, simQuantity, simLeverage]);

  // Overall statistics for equities
  const metrics = useMemo(() => {
    let totalTrades = acoesTrades.length;
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let totalProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;
    let totalVolume = 0;
    let totalB3Fees = 0;
    let totalShares = 0;

    const tickerMap = new Map<string, {
      ticker: string;
      trades: number;
      wins: number;
      losses: number;
      profit: number;
      grossGain: number;
      grossLoss: number;
      totalShares: number;
      totalVolume: number;
    }>();

    acoesTrades.forEach((t) => {
      totalProfit += t.financialValue;
      const shares = t.quantity || t.contracts || 100;
      totalShares += shares;
      
      const vol = t.financialVolume || ((t.entryPrice || 35) * shares * 2);
      totalVolume += vol;

      const fee = t.b3Fees || (vol * 0.00025);
      totalB3Fees += fee;

      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
      } else {
        breakevens++;
      }

      // Group by ticker
      const tk = (t.ticker || 'B3').toUpperCase();
      const existing = tickerMap.get(tk) || {
        ticker: tk,
        trades: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        grossGain: 0,
        grossLoss: 0,
        totalShares: 0,
        totalVolume: 0,
      };

      existing.trades++;
      existing.profit += t.financialValue;
      existing.totalShares += shares;
      existing.totalVolume += vol;

      if (t.result === 'GAIN') {
        existing.wins++;
        existing.grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        existing.losses++;
        existing.grossLoss += Math.abs(Math.min(0, t.financialValue));
      }

      tickerMap.set(tk, existing);
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? 99.9 : 0;
    const avgTrade = totalTrades > 0 ? totalProfit / totalTrades : 0;
    const avgWin = wins > 0 ? grossGain / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const payoff = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

    const winDecimal = totalTrades > 0 ? wins / totalTrades : 0;
    const lossDecimal = totalTrades > 0 ? losses / totalTrades : 0;
    const mathematicalExpectancy = totalTrades > 0
      ? (winDecimal * avgWin) - (lossDecimal * avgLoss)
      : 0;

    const tickersList = Array.from(tickerMap.values())
      .map((item) => ({
        ...item,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
        profitFactor: item.grossLoss > 0 ? item.grossGain / item.grossLoss : item.grossGain > 0 ? 99.9 : 0,
      }))
      .sort((a, b) => b.trades - a.trades || b.profit - a.profit);

    return {
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      lossRate,
      totalProfit,
      grossGain,
      grossLoss,
      profitFactor,
      avgTrade,
      avgWin,
      avgLoss,
      payoff,
      mathematicalExpectancy,
      totalVolume,
      totalB3Fees,
      totalShares,
      tickersList,
    };
  }, [acoesTrades]);

  // Filtered trades list by selected ticker
  const displayTrades = useMemo(() => {
    if (selectedTickerFilter === 'ALL') return acoesTrades;
    return acoesTrades.filter((t) => (t.ticker || '').toUpperCase() === selectedTickerFilter.toUpperCase());
  }, [acoesTrades, selectedTickerFilter]);

  const handleLaunchSimulatorTrade = () => {
    onOpenNewTrade({
      asset: 'ACOES',
      ticker: simTicker.toUpperCase(),
      direction: simDirection,
      quantity: simQuantity,
      contracts: simQuantity,
      entryPrice: simEntryPrice,
      exitPrice: simExitPrice,
      points: simResult.priceDiff,
      financialValue: simResult.grossFinancial,
      result: simResult.grossFinancial > 0 ? 'GAIN' : simResult.grossFinancial < 0 ? 'LOSS' : 'BREAKEVEN',
      financialVolume: simResult.financialVolume,
      b3Fees: simResult.estimatedB3Fees,
      netFinancialValue: simResult.netFinancial,
      notes: `Trade em ${simTicker.toUpperCase()} (${simDirection}) via Simulador de Ações.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Executive Overview */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Day Trade em Ações da B3
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Mercado à Vista B3
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Módulo completo para controle operacional, ranking por ticker, calculadora com margem intraday e taxas B3.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Clock className="h-3 w-3 text-indigo-400" />
                Horário: 10:00 às 17:00
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Briefcase className="h-3 w-3 text-indigo-400" />
                Lote Padrão: 100 ações
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Percent className="h-3 w-3 text-amber-400" />
                IR Day Trade: 20% (IRRF 1%)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Scale className="h-3 w-3 text-emerald-400" />
                Emolumentos B3: ~0,025%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenNewTrade({ asset: 'ACOES', ticker: 'PETR4', quantity: 200 })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Novo Trade em Ações</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIs Exclusivos de Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Resultado Financeiro Ações */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
                Resultado Ações B3
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {metrics.totalTrades} {metrics.totalTrades === 1 ? 'trade' : 'trades'}
              </span>
            </div>

            <div className="mt-2.5">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                metrics.totalProfit > 0 
                  ? 'text-emerald-400' 
                  : metrics.totalProfit < 0 
                  ? 'text-rose-400' 
                  : 'text-white'
              }`}>
                {formatBRL(metrics.totalProfit)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Gains: <strong className="text-emerald-400">+{formatBRL(metrics.grossGain)}</strong></span>
            <span>Losses: <strong className="text-rose-400">-{formatBRL(metrics.grossLoss)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Taxa de Acerto & Fator de Lucro */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Percent className="h-3.5 w-3.5 text-emerald-400" />
                Taxa de Acerto em Ações
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                PF: <strong className="text-white">{metrics.profitFactor > 0 ? metrics.profitFactor.toFixed(2) : '-'}</strong>
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {metrics.winRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                ({metrics.wins}W / {metrics.losses}L / {metrics.breakevens}BE)
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Payoff: <strong className="text-indigo-400">{metrics.payoff > 0 ? `${metrics.payoff.toFixed(2)}x` : '-'}</strong></span>
            <span>Expectativa: <strong className={metrics.mathematicalExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatBRL(metrics.mathematicalExpectancy)}
            </strong></span>
          </div>
        </div>

        {/* KPI 3: Volume Financeiro & Emolumentos B3 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Volume Movimentado
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Giro B3
              </span>
            </div>

            <div className="mt-2.5">
              <div className="text-2xl font-bold font-mono tracking-tight text-cyan-300">
                {formatBRL(metrics.totalVolume)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Taxas B3 Est.: <strong className="text-amber-400">-{formatBRL(metrics.totalB3Fees)}</strong></span>
            <span>Ações: <strong className="text-slate-200">{metrics.totalShares.toLocaleString('pt-BR')}</strong></span>
          </div>
        </div>

        {/* KPI 4: Ticket Médio & Projeção */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Ticket Médio por Operação
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Méd. Trade
              </span>
            </div>

            <div className="mt-2.5">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                metrics.avgTrade > 0 ? 'text-emerald-400' : metrics.avgTrade < 0 ? 'text-rose-400' : 'text-white'
              }`}>
                {metrics.avgTrade > 0 ? `+${formatBRL(metrics.avgTrade)}` : formatBRL(metrics.avgTrade)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Ganho Médio: <strong className="text-emerald-400">+{formatBRL(metrics.avgWin)}</strong></span>
            <span>Perda Média: <strong className="text-rose-400">-{formatBRL(metrics.avgLoss)}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Grid Principal: Simulador Interativo + Ranking por Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Simulador e Calculadora de Ações B3 (7 Colunas) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Calculadora & Simulador Day Trade em Ações</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  Simule alavancagem intraday, margem necessária na corretora, custos de emolumentos B3 e lucro líquido real.
                </p>
              </div>
            </div>
          </div>

          {/* Atalhos de Tickers Populares da B3 */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Ações Líquidas Mais Negociadas na B3 (Clique para selecionar):
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {B3_POPULAR_STOCKS.slice(0, 10).map((stk) => (
                <button
                  key={stk.ticker}
                  type="button"
                  onClick={() => setSimTicker(stk.ticker)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    simTicker.toUpperCase() === stk.ticker
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`${stk.name} - ${stk.sector}`}
                >
                  {stk.ticker}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs do Simulador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {/* Ticker Livre & Direção */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Ticker da Ação B3
              </label>
              <input
                type="text"
                value={simTicker}
                onChange={(e) => setSimTicker(e.target.value.toUpperCase())}
                placeholder="Ex: PETR4, VALE3"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Direção Operacional
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimDirection('COMPRA')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border flex items-center justify-center gap-1.5 ${
                    simDirection === 'COMPRA'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>COMPRA (Long)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimDirection('VENDA')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border flex items-center justify-center gap-1.5 ${
                    simDirection === 'VENDA'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>VENDA (Short)</span>
                </button>
              </div>
            </div>

            {/* Quantidade de Ações & Atalhos de Lote */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Quantidade (Ações)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Lote: {Math.floor(simQuantity / 100)} lotes
                </span>
              </div>
              <input
                type="number"
                min={1}
                step={100}
                value={simQuantity}
                onChange={(e) => setSimQuantity(Math.max(1, parseInt(e.target.value, 10) || 100))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {[100, 200, 500, 1000, 2000].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSimQuantity(qty)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      simQuantity === qty
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Alavancagem Intraday da Corretora */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Alavancagem Intraday (Margem)
                </label>
                <span className="text-[10px] text-indigo-400 font-mono font-bold">
                  {simLeverage}x
                </span>
              </div>
              <select
                value={simLeverage}
                onChange={(e) => setSimLeverage(parseInt(e.target.value, 10) || 20)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1x (Sem alavancagem - 100% de garantia)</option>
                <option value={5}>5x (Margem de 20%)</option>
                <option value={10}>10x (Margem de 10%)</option>
                <option value={20}>20x (Margem de 5% - Padrão XP/Clear/Rico)</option>
                <option value={30}>30x (Margem de 3,3%)</option>
                <option value={50}>50x (Margem de 2% - Ações Alta Liquidez)</option>
              </select>
            </div>

            {/* Preço de Entrada */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Preço de Entrada (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={simEntryPrice}
                  onChange={(e) => setSimEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Preço de Saída */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Preço de Saída / Stop (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={simExitPrice}
                  onChange={(e) => setSimExitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Card com Resultados da Simulação em Tempo Real */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-indigo-400" />
                Resultado Projetado da Operação
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                simResult.priceDiff >= 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {simResult.priceDiff >= 0 ? '+' : ''}{simResult.priceDiff.toFixed(2)} R$/ação ({simResult.priceChangePercent >= 0 ? '+' : ''}{simResult.priceChangePercent.toFixed(2)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Lucro Bruto</span>
                <span className={`text-sm sm:text-base font-bold ${
                  simResult.grossFinancial >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatBRL(simResult.grossFinancial)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Taxas B3 Est.</span>
                <span className="text-sm sm:text-base font-bold text-amber-400">
                  -{formatBRL(simResult.estimatedB3Fees)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Lucro Líquido</span>
                <span className={`text-sm sm:text-base font-bold ${
                  simResult.netFinancial >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatBRL(simResult.netFinancial)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Margem Necessária</span>
                <span className="text-sm sm:text-base font-bold text-cyan-400">
                  {formatBRL(simRequiredMargin)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="text-[11px]">
                Volume total negociado: <strong className="text-white font-mono">{formatBRL(simResult.financialVolume)}</strong> (comprado e vendido).
              </span>

              <button
                type="button"
                onClick={handleLaunchSimulatorTrade}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm transition-colors cursor-pointer"
              >
                <span>Registrar este Trade</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ranking e Desempenho por Ticker da B3 (5 Colunas) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Ranking de Ativos Operados (B3)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Desempenho consolidado por ticker de ação.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista dos Tickers Operados */}
            <div className="mt-3 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {metrics.tickersList.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400">
                  <Building2 className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Nenhum trade de ação registrado ainda</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cadastre suas operações de Day Trade em ações da B3 ou use os dados de amostra para visualizar o ranking.
                  </p>
                </div>
              ) : (
                metrics.tickersList.map((item, idx) => (
                  <div
                    key={item.ticker}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold font-mono text-white text-sm">
                              {item.ticker}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.trades} {item.trades === 1 ? 'trade' : 'trades'})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {item.totalShares.toLocaleString('pt-BR')} ações negociadas
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`text-sm font-bold ${
                          item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {item.profit >= 0 ? `+${formatBRL(item.profit)}` : formatBRL(item.profit)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Acerto: <strong className="text-white">{item.winRate.toFixed(0)}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">
                        Gains: <span className="text-emerald-400">{item.wins}</span> • Losses: <span className="text-rose-400">{item.losses}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToHistory(item.ticker)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Ver no Histórico</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dica Operacional Rápida */}
          <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Info className="h-3.5 w-3.5" />
              <span>Diferencial do Day Trade em Ações na B3</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Diferente de futuros (WIN e WDO), em ações você tem dezenas de papéis com dinâmicas e betas diferentes, permitindo escolher os melhores setups do dia (ativos em tendência forte, rompimento pós-leilão ou notícias).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Tabela de Operações de Ações */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Diário Exclusivo de Trades em Ações
              </h3>
              <p className="text-xs text-slate-400">
                Histórico filtrado de todas as operações realizadas no mercado de ações B3.
              </p>
            </div>
          </div>

          {/* Filtro por Ticker */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedTickerFilter}
              onChange={(e) => setSelectedTickerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos os Tickers ({acoesTrades.length})</option>
              {metrics.tickersList.map((tk) => (
                <option key={tk.ticker} value={tk.ticker}>
                  {tk.ticker} ({tk.trades})
                </option>
              ))}
            </select>
          </div>
        </div>

        {displayTrades.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl text-slate-400 space-y-3">
            <Building2 className="h-10 w-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Nenhum trade encontrado para o filtro selecionado</p>
            <button
              type="button"
              onClick={() => onOpenNewTrade({ asset: 'ACOES' })}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer"
            >
              Registrar Primeiro Trade de Ação
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Ticker</th>
                  <th className="py-2.5 px-3">Direção</th>
                  <th className="py-2.5 px-3">Setup</th>
                  <th className="py-2.5 px-3 text-right">Qtd. Ações</th>
                  <th className="py-2.5 px-3 text-right">Entrada / Saída</th>
                  <th className="py-2.5 px-3 text-right">Variação</th>
                  <th className="py-2.5 px-3 text-right">Resultado (R$)</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {displayTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      <span>{formatDateBR(t.date)}</span>
                      {t.time && <span className="text-[10px] text-slate-500 ml-1.5">{t.time}</span>}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        {t.ticker || 'B3'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.direction === 'COMPRA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.direction}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-300 max-w-[180px] truncate">
                      {t.setupName || 'Setup Geral'}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {(t.quantity || t.contracts || 100).toLocaleString('pt-BR')} ações
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      {t.entryPrice && t.exitPrice ? (
                        <span>
                          R$ {t.entryPrice.toFixed(2)} → R$ {t.exitPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={t.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.points >= 0 ? '+' : ''}{t.points.toFixed(2)} R$/ação
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                      <span className={t.financialValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.financialValue >= 0 ? `+${formatBRL(t.financialValue)}` : formatBRL(t.financialValue)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditTrade(t)}
                        className="px-2 py-1 rounded text-[11px] font-sans font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Guia Operacional e Regras B3 para Day Trade de Ações */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
          <Briefcase className="h-4 w-4 text-indigo-400" />
          <span>Manual Prático de Regras & Boas Práticas: Day Trade em Ações B3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
            <span className="font-bold text-indigo-300 block">1. Lotes & Códigos de Negociação</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              O lote padrão na B3 é de <strong>100 ações</strong> (ex: PETR4, VALE3). Operações entre 1 e 99 ações ocorrem no mercado fracionário (ex: PETR4F). Para day trade, sempre dê preferência ao lote padrão pela liquidez imediata e menor spread no book.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
            <span className="font-bold text-indigo-300 block">2. Venda a Descoberto (Short Intraday)</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              No day trade é possível vender primeiro e recomprar depois sem pagar taxa de aluguel de ações (BTC), contanto que a posição seja zerada antes do fechamento do pregão (às 17h ou 18h no horário de verão).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
            <span className="font-bold text-indigo-300 block">3. Tributação: Sem Isenção de R$ 20k</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              <strong>Atenção:</strong> A isenção mensal de R$ 20.000 em vendas de ações só existe para Swing Trade! No Day Trade de ações, <strong>todo lucro líquido paga 20% de IR via DARF</strong>, com retenção prévia de 1% (IRRF) pela corretora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
