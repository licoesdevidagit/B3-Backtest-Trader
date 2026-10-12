import React, { useState, useMemo } from 'react';
import { AssetType, Setup, Trade } from '../types';
import { formatBRL, formatPoints, formatDateBR } from '../utils/calculations';
import { FINANCIAL_MILESTONES, Milestone } from '../utils/milestones';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Flame, 
  Sliders, 
  Filter, 
  Sparkles,
  HelpCircle,
  Eye,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

interface AnalyticsChartsViewProps {
  trades: Trade[];
  setups: Setup[];
  initialCapital?: number;
  onFilterBySetup?: (setupId: string) => void;
  onOpenNewTrade?: () => void;
}

type ChartTab = 'all' | 'setups' | 'losses' | 'equity' | 'goals';

export const AnalyticsChartsView: React.FC<AnalyticsChartsViewProps> = ({
  trades,
  setups,
  initialCapital = 1000,
  onFilterBySetup,
  onOpenNewTrade,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('all');
  const [filterAsset, setFilterAsset] = useState<'ALL' | AssetType>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'LAST30' | 'LAST90' | 'YEAR2026'>('ALL');
  const [filterSetupId, setFilterSetupId] = useState<string>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Velocity simulator state for goals
  const [simulatedDailyGain, setSimulatedDailyGain] = useState<number>(150);

  // 1. Filtered Trades based on controls
  const filteredTrades = useMemo(() => {
    let list = [...trades];

    if (filterAsset !== 'ALL') {
      list = list.filter((t) => t.asset === filterAsset);
    }

    if (filterSetupId !== 'ALL') {
      list = list.filter((t) => t.setupId === filterSetupId);
    }

    if (filterPeriod === 'YEAR2026') {
      list = list.filter((t) => t.date?.startsWith('2026'));
    } else if (filterPeriod === 'LAST30' || filterPeriod === 'LAST90') {
      const dates = Array.from(new Set(list.map((t) => t.date))).sort().reverse();
      const cutoffCount = filterPeriod === 'LAST30' ? 30 : 90;
      const allowedDates = new Set(dates.slice(0, cutoffCount));
      list = list.filter((t) => allowedDates.has(t.date));
    }

    return list.sort((a, b) => {
      const da = `${a.date} ${a.time || '00:00'}`;
      const db = `${b.date} ${b.time || '00:00'}`;
      return da.localeCompare(db);
    });
  }, [trades, filterAsset, filterPeriod, filterSetupId]);

  // Distinct dates operated
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(filteredTrades.map((t) => t.date))).filter(Boolean).sort();
  }, [filteredTrades]);

  // Overall Performance KPIs
  const kpis = useMemo(() => {
    const total = filteredTrades.length;
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let totalProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;

    filteredTrades.forEach((t) => {
      const v = t.financialValue || 0;
      totalProfit += v;
      if (t.result === 'GAIN') {
        wins++;
        grossGain += v;
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(v);
      } else {
        breakevens++;
      }
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? 99 : 0;
    const avgTrade = total > 0 ? totalProfit / total : 0;
    const daysCount = uniqueDates.length;
    const avgPerDay = daysCount > 0 ? totalProfit / daysCount : 0;

    // Calculate Max Drawdown
    let peak = initialCapital;
    let runningEquity = initialCapital;
    let maxDrawdownVal = 0;
    let maxDrawdownPct = 0;

    filteredTrades.forEach((t) => {
      runningEquity += t.financialValue || 0;
      if (runningEquity > peak) {
        peak = runningEquity;
      } else {
        const dd = peak - runningEquity;
        const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
        if (dd > maxDrawdownVal) maxDrawdownVal = dd;
        if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
      }
    });

    return {
      total,
      wins,
      losses,
      breakevens,
      winRate,
      totalProfit,
      grossGain,
      grossLoss,
      profitFactor,
      avgTrade,
      daysCount,
      avgPerDay,
      maxDrawdownVal,
      maxDrawdownPct,
    };
  }, [filteredTrades, uniqueDates, initialCapital]);

  // -------------------------------------------------------------
  // DATA 1: Desempenho por Setup
  // -------------------------------------------------------------
  const setupPerformanceData = useMemo(() => {
    return setups.map((s) => {
      const sTrades = filteredTrades.filter((t) => t.setupId === s.id);
      const wins = sTrades.filter((t) => t.result === 'GAIN');
      const losses = sTrades.filter((t) => t.result === 'LOSS');
      const profit = sTrades.reduce((acc, t) => acc + (t.financialValue || 0), 0);
      const grossWins = wins.reduce((acc, t) => acc + (t.financialValue || 0), 0);
      const grossLosses = Math.abs(losses.reduce((acc, t) => acc + (t.financialValue || 0), 0));
      const pf = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99 : 0;
      const winRate = sTrades.length > 0 ? (wins.length / sTrades.length) * 100 : 0;

      return {
        id: s.id,
        name: s.name,
        color: s.color || '#10b981',
        totalTrades: sTrades.length,
        winsCount: wins.length,
        lossesCount: losses.length,
        profit,
        winRate,
        profitFactor: pf,
        avgTrade: sTrades.length > 0 ? profit / sTrades.length : 0,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [setups, filteredTrades]);

  // -------------------------------------------------------------
  // DATA 2: Análise de Perdas & Drawdown
  // -------------------------------------------------------------
  const lossAnalysisData = useMemo(() => {
    // 2.1 Drawdown curve points
    let peak = initialCapital;
    let running = initialCapital;
    const ddPoints: { date: string; time?: string; drawdown: number; drawdownPct: number; equity: number }[] = [];

    filteredTrades.forEach((t) => {
      running += t.financialValue || 0;
      if (running > peak) {
        peak = running;
      }
      const dd = Math.max(0, peak - running);
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      ddPoints.push({
        date: t.date,
        time: t.time,
        drawdown: dd,
        drawdownPct: ddPct,
        equity: running,
      });
    });

    // 2.2 Consecutive losses distribution
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    const streakMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    filteredTrades.forEach((t) => {
      if (t.result === 'LOSS') {
        currentLossStreak++;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else if (t.result === 'GAIN') {
        if (currentLossStreak > 0) {
          const bucket = currentLossStreak >= 4 ? 4 : currentLossStreak;
          streakMap[bucket] = (streakMap[bucket] || 0) + 1;
        }
        currentLossStreak = 0;
      }
    });
    if (currentLossStreak > 0) {
      const bucket = currentLossStreak >= 4 ? 4 : currentLossStreak;
      streakMap[bucket] = (streakMap[bucket] || 0) + 1;
    }

    // 2.3 Losses by hour of day
    const hourlyLosses: Record<string, { count: number; totalLoss: number }> = {
      '09:00 - 10:00 (Abertura B3)': { count: 0, totalLoss: 0 },
      '10:00 - 12:00 (Abertura NY)': { count: 0, totalLoss: 0 },
      '12:00 - 14:00 (Almoço)': { count: 0, totalLoss: 0 },
      '14:00 - 17:00 (Tarde / Fechamento)': { count: 0, totalLoss: 0 },
    };

    filteredTrades.forEach((t) => {
      if (t.result === 'LOSS' && t.time) {
        const hour = parseInt(t.time.split(':')[0], 10);
        let key = '14:00 - 17:00 (Tarde / Fechamento)';
        if (hour === 9) key = '09:00 - 10:00 (Abertura B3)';
        else if (hour >= 10 && hour < 12) key = '10:00 - 12:00 (Abertura NY)';
        else if (hour >= 12 && hour < 14) key = '12:00 - 14:00 (Almoço)';

        hourlyLosses[key].count += 1;
        hourlyLosses[key].totalLoss += Math.abs(t.financialValue || 0);
      }
    });

    // 2.4 Worst trades
    const worstTrades = [...filteredTrades]
      .filter((t) => t.result === 'LOSS')
      .sort((a, b) => (a.financialValue || 0) - (b.financialValue || 0))
      .slice(0, 5);

    return {
      ddPoints,
      maxLossStreak,
      streakMap,
      hourlyLosses,
      worstTrades,
    };
  }, [filteredTrades, initialCapital]);

  // -------------------------------------------------------------
  // DATA 3: Resultados Diários & Curva de Patrimônio
  // -------------------------------------------------------------
  const resultsEvolutionData = useMemo(() => {
    // Group trades by date
    const dailyMap = new Map<string, { date: string; profit: number; tradesCount: number; wins: number; losses: number }>();

    filteredTrades.forEach((t) => {
      if (!t.date) return;
      const cur = dailyMap.get(t.date) || { date: t.date, profit: 0, tradesCount: 0, wins: 0, losses: 0 };
      cur.profit += t.financialValue || 0;
      cur.tradesCount++;
      if (t.result === 'GAIN') cur.wins++;
      if (t.result === 'LOSS') cur.losses++;
      dailyMap.set(t.date, cur);
    });

    const dailyList = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Cumulative equity progression
    let accum = initialCapital;
    const equityCurve = dailyList.map((d) => {
      accum += d.profit;
      return {
        date: d.date,
        dailyProfit: d.profit,
        cumulativeEquity: accum,
        netProfit: accum - initialCapital,
      };
    });

    // Results by weekday (Segunda a Sexta)
    const weekdayMap: Record<number, { name: string; profit: number; count: number; wins: number } > = {
      1: { name: 'Segunda-feira', profit: 0, count: 0, wins: 0 },
      2: { name: 'Terça-feira', profit: 0, count: 0, wins: 0 },
      3: { name: 'Quarta-feira', profit: 0, count: 0, wins: 0 },
      4: { name: 'Quinta-feira', profit: 0, count: 0, wins: 0 },
      5: { name: 'Sexta-feira', profit: 0, count: 0, wins: 0 },
    };

    filteredTrades.forEach((t) => {
      if (!t.date) return;
      const d = new Date(`${t.date}T12:00:00Z`);
      const day = d.getUTCDay();
      if (weekdayMap[day]) {
        weekdayMap[day].profit += t.financialValue || 0;
        weekdayMap[day].count++;
        if (t.result === 'GAIN') weekdayMap[day].wins++;
      }
    });

    return {
      dailyList,
      equityCurve,
      weekdayList: Object.values(weekdayMap),
    };
  }, [filteredTrades, initialCapital]);

  // -------------------------------------------------------------
  // DATA 4: Tempo até Alcançar Objetivos & Metas
  // -------------------------------------------------------------
  const timeToGoalData = useMemo(() => {
    // Track when each milestone was first hit chronologically
    let accumProfit = 0;
    const hitMap = new Map<string, { date: string; tradesCount: number; daysCount: number }>();
    const seenDates = new Set<string>();

    filteredTrades.forEach((t, idx) => {
      accumProfit += t.financialValue || 0;
      seenDates.add(t.date);

      FINANCIAL_MILESTONES.forEach((m) => {
        if (!hitMap.has(m.id) && accumProfit >= m.targetProfit) {
          hitMap.set(m.id, {
            date: t.date,
            tradesCount: idx + 1,
            daysCount: seenDates.size,
          });
        }
      });
    });

    const milestonesWithTime = FINANCIAL_MILESTONES.map((m) => {
      const hit = hitMap.get(m.id);
      const isAchieved = !!hit;
      const currentProfit = kpis.totalProfit;
      const remainingAmount = Math.max(0, m.targetProfit - currentProfit);
      const progressPercent = Math.min(100, Math.max(0, (currentProfit / m.targetProfit) * 100));

      // Calculate estimated days based on average daily profit
      const dailyVelocity = kpis.avgPerDay > 0 ? kpis.avgPerDay : simulatedDailyGain;
      const estimatedDaysRemaining = remainingAmount > 0 && dailyVelocity > 0 
        ? Math.ceil(remainingAmount / dailyVelocity) 
        : 0;

      return {
        ...m,
        isAchieved,
        achievedDate: hit?.date,
        tradesNeeded: hit?.tradesCount,
        daysNeeded: hit?.daysCount,
        remainingAmount,
        progressPercent,
        estimatedDaysRemaining,
      };
    });

    // Next pending milestone
    const nextMilestone = milestonesWithTime.find((m) => !m.isAchieved) || milestonesWithTime[milestonesWithTime.length - 1];

    return {
      milestonesWithTime,
      nextMilestone,
    };
  }, [filteredTrades, kpis.totalProfit, kpis.avgPerDay, simulatedDailyGain]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Header & Navigation Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Central de Gráficos Analíticos & Demonstrativos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    B3 Day Trade
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Visualizações intuitivas de desempenho por setup, curva de perdas, evolução de resultados e projeção de metas.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters: Ativo & Período */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Asset */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterAsset('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterAsset === 'ALL'
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterAsset('WIN')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterAsset === 'WIN'
                    ? 'bg-blue-500/20 text-sky-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                WIN
              </button>
              <button
                type="button"
                onClick={() => setFilterAsset('WDO')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterAsset === 'WDO'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                WDO
              </button>
            </div>

            {/* Filter Period */}
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="h-8 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todo o Histórico</option>
              <option value="LAST30">Últimos 30 Pregões</option>
              <option value="LAST90">Últimos 90 Pregões</option>
              <option value="YEAR2026">Ano 2026</option>
            </select>

            {/* Filter Setup */}
            <select
              value={filterSetupId}
              onChange={(e) => setFilterSetupId(e.target.value)}
              className="h-8 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">Todos os Setups</option>
              {setups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Abas de Gráficos Especializados */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1">
          <button
            type="button"
            onClick={() => setActiveChartTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeChartTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Todos os Gráficos (Visão Panorâmica)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('setups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeChartTab === 'setups'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Desempenho por Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('losses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeChartTab === 'losses'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Análise de Perdas & Drawdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('equity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeChartTab === 'equity'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Curva de Resultados & Equity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('goals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeChartTab === 'goals'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 font-bold'
                : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Tempo até Alcançar Objetivos</span>
          </button>
        </div>
      </div>

      {/* 3. Analytical KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Resultado Total</span>
          <span className={`text-base sm:text-lg font-bold font-mono ${kpis.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(kpis.totalProfit)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{kpis.total} trades operados</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Taxa de Acerto</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white">
            {kpis.winRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">{kpis.wins}G · {kpis.losses}L</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Fator de Lucro</span>
          <span className="text-base sm:text-lg font-bold font-mono text-purple-400">
            {kpis.profitFactor > 0 ? kpis.profitFactor.toFixed(2) : '-'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Payoff operacional</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Drawdown Máx.</span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
            {kpis.maxDrawdownPct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-rose-300/80 block mt-0.5">-{formatBRL(kpis.maxDrawdownVal)}</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Média / Pregão</span>
          <span className={`text-base sm:text-lg font-bold font-mono ${kpis.avgPerDay >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(kpis.avgPerDay)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{kpis.daysCount} pregões</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 block">Próxima Meta</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-400 truncate block">
            {timeToGoalData.nextMilestone.shortTitle}
          </span>
          <span className="text-[10px] text-amber-300/80 block mt-0.5">
            {timeToGoalData.nextMilestone.progressPercent.toFixed(0)}% concluído
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRÁFICO 1: DESEMPENHO COMPARATIVO POR SETUP                               */}
      {/* ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'setups') && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Gráfico de Desempenho por Setup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativo visual de lucratividade (R$), taxa de acerto (%) e eficiência por estratégia.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {setupPerformanceData.length} setups analisados
            </span>
          </div>

          {/* Gráfico de Barras Horizontais em SVG Responsivo */}
          <div className="space-y-3 pt-1">
            {setupPerformanceData.map((s) => {
              const maxAbsProfit = Math.max(...setupPerformanceData.map((x) => Math.abs(x.profit)), 500);
              const barWidth = Math.min(100, (Math.abs(s.profit) / maxAbsProfit) * 100);
              const isPositive = s.profit >= 0;

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:border-slate-700 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        ({s.totalTrades} tr · {s.winsCount}G {s.lossesCount}L)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                      <span className="text-slate-400 text-[11px] hidden md:inline">
                        Acerto: <strong>{s.winRate.toFixed(1)}%</strong>
                      </span>
                      <span className="text-slate-400 text-[11px] hidden lg:inline">
                        F.Lucro: <strong>{s.profitFactor.toFixed(2)}</strong>
                      </span>
                      <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${formatBRL(s.profit)}` : formatBRL(s.profit)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Lucro Proporcional */}
                  <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex items-center relative">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPositive 
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/30' 
                          : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-sm shadow-rose-500/30'
                      }`}
                    />
                  </div>

                  {/* Barra Secundária: Taxa de Acerto */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>Taxa de Acerto do Setup:</span>
                    <span className={s.winRate >= 50 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                      {s.winRate.toFixed(1)}% (Média/trade: {formatBRL(s.avgTrade)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRÁFICO 2: ANÁLISE DE PERDAS & DRAWDOWN                                   */}
      {/* ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'losses') && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Gráfico de Perdas & Rebaixamento (Drawdown)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Avalie os momentos de maior estresse da conta, sequências de derrotas e horários críticos.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-rose-400 font-bold">
                Drawdown Máximo: -{formatBRL(kpis.maxDrawdownVal)} ({kpis.maxDrawdownPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
            {/* Visualização de Curva de Drawdown em SVG */}
            <div className="lg:col-span-2 p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Curva de Rebaixamento ao Longo dos Trades</span>
                <span className="text-[10px] font-mono text-slate-500">0% = Topo Histórico (Sem Drawdown)</span>
              </div>

              {lossAnalysisData.ddPoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">Nenhum trade para calcular drawdown</div>
              ) : (
                <div className="relative h-44 w-full">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                    <defs>
                      <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linha Zero (Topo histórico) */}
                    <line x1="0" y1="10" x2="500" y2="10" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                    {/* Área de Drawdown */}
                    {(() => {
                      const points = lossAnalysisData.ddPoints;
                      const maxPct = Math.max(15, ...points.map((p) => p.drawdownPct));
                      const stepX = points.length > 1 ? 500 / (points.length - 1) : 500;

                      const pathCommands = points.map((p, i) => {
                        const x = i * stepX;
                        // Y ranges from 10 (0% dd) to 110 (maxPct dd)
                        const y = 10 + (p.drawdownPct / maxPct) * 100;
                        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ');

                      const areaCommands = `${pathCommands} L 500 10 L 0 10 Z`;

                      return (
                        <>
                          <path d={areaCommands} fill="url(#lossGradient)" />
                          <path d={pathCommands} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Início dos Testes</span>
                <span className="text-rose-400 font-bold">Zona de Risco Controlada (&lt; 15%)</span>
                <span>Trades Recentes</span>
              </div>
            </div>

            {/* Painel de Horários Críticos de Perda */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Onde Ocorrem as Maiores Perdas (Horários):
              </span>

              <div className="space-y-2">
                {Object.entries(lossAnalysisData.hourlyLosses).map(([slot, data]) => {
                  const totalLossAll = kpis.grossLoss > 0 ? kpis.grossLoss : 1;
                  const pct = Math.min(100, (data.totalLoss / totalLossAll) * 100);

                  return (
                    <div key={slot} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-300 truncate">{slot}</span>
                        <span className="text-rose-400 font-bold">-{formatBRL(data.totalLoss)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-rose-500 rounded-full transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block text-right font-mono">
                        {data.count} losses ({pct.toFixed(0)}% do prejuízo)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Maior sequência de perdas consecutivas: <strong>{lossAnalysisData.maxLossStreak} trades</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRÁFICO 3: RESULTADOS DIÁRIOS & CURVA DE PATRIMÔNIO (EQUITY)              */}
      {/* ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'equity') && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Gráficos de Resultados & Curva de Patrimônio (Equity)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evolução cumulativa dia a dia com capital inicial de {formatBRL(initialCapital)}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Patrimônio Atual: {formatBRL(initialCapital + kpis.totalProfit)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
            {/* Curva de Patrimônio em SVG */}
            <div className="lg:col-span-2 p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Curva Cumulativa de Capital</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {kpis.totalProfit >= 0 ? `+${formatBRL(kpis.totalProfit)} de ganho líquido` : formatBRL(kpis.totalProfit)}
                </span>
              </div>

              {resultsEvolutionData.equityCurve.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">Sem dados para curva de patrimônio</div>
              ) : (
                <div className="relative h-48 w-full">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 130">
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linha de Base: Capital Inicial */}
                    <line x1="0" y1="65" x2="500" y2="65" stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />

                    {/* Traçado da Curva */}
                    {(() => {
                      const data = resultsEvolutionData.equityCurve;
                      const equities = data.map((d) => d.cumulativeEquity);
                      const minEq = Math.min(initialCapital * 0.8, ...equities);
                      const maxEq = Math.max(initialCapital * 1.2, ...equities);
                      const range = maxEq - minEq || 1;
                      const stepX = data.length > 1 ? 500 / (data.length - 1) : 500;

                      const pathCommands = data.map((d, i) => {
                        const x = i * stepX;
                        // Y scaled from 115 (min) to 15 (max)
                        const y = 115 - ((d.cumulativeEquity - minEq) / range) * 100;
                        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ');

                      const areaCommands = `${pathCommands} L 500 120 L 0 120 Z`;

                      return (
                        <>
                          <path d={areaCommands} fill="url(#equityGradient)" />
                          <path d={pathCommands} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Início ({formatBRL(initialCapital)})</span>
                <span className="text-slate-300 font-semibold">{resultsEvolutionData.equityCurve.length} pregões registrados</span>
                <span className="text-emerald-400 font-bold">{formatBRL(initialCapital + kpis.totalProfit)}</span>
              </div>
            </div>

            {/* Distribuição por Dia da Semana */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Rentabilidade por Dia da Semana:
              </span>

              <div className="space-y-2">
                {resultsEvolutionData.weekdayList.map((w) => {
                  const isPos = w.profit >= 0;
                  const winRate = w.count > 0 ? (w.wins / w.count) * 100 : 0;

                  return (
                    <div key={w.name} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-white block">{w.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {w.count} trades · {winRate.toFixed(0)}% gain
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`font-bold block ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? `+${formatBRL(w.profit)}` : formatBRL(w.profit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRÁFICO 4: QUANTO TEMPO LEVO PARA ALCANÇAR OBJETIVOS                      */}
      {/* ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'goals') && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Gráfico: Quanto Tempo Levo para Alcançar Objetivos</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Linha do tempo real de metas atingidas e estimativa preditiva para as próximas marcas.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-300">
              <span>Ritmo Médio: <strong>{formatBRL(kpis.avgPerDay)} / pregão</strong></span>
            </div>
          </div>

          {/* Destaque da Próxima Meta com Simulador de Aceleração */}
          <div className="p-4 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-emerald-950/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{timeToGoalData.nextMilestone.badge}</span>
                  <h4 className="text-sm font-bold text-white">
                    Próximo Objetivo: {timeToGoalData.nextMilestone.title} ({formatBRL(timeToGoalData.nextMilestone.targetProfit)})
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Faltam <strong>{formatBRL(timeToGoalData.nextMilestone.remainingAmount)}</strong> para desbloquear o certificado de {timeToGoalData.nextMilestone.rank}.
                </p>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-xs text-slate-400 block">Tempo Estimado:</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  ~{timeToGoalData.nextMilestone.estimatedDaysRemaining} pregões
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (aprox. {Math.ceil(timeToGoalData.nextMilestone.estimatedDaysRemaining / 5)} semanas)
                </span>
              </div>
            </div>

            {/* Barra de Progresso com Percentual */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Progresso do Objetivo:</span>
                <span className="text-purple-300 font-bold">{timeToGoalData.nextMilestone.progressPercent.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  style={{ width: `${timeToGoalData.nextMilestone.progressPercent}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-sm shadow-purple-500/50"
                />
              </div>
            </div>

            {/* Simulador Interativo de Velocidade */}
            <div className="pt-2 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  Simular com meta diária diferente de lucro:
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[100, 150, 250, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimulatedDailyGain(val)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      simulatedDailyGain === val
                        ? 'bg-purple-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    R$ {val}/dia
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline de Metas (Histórico demonstrativo de tempo) */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-semibold text-slate-300 block">
              Marcos Financeiros & Histórico de Tempo para Conquista:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeToGoalData.milestonesWithTime.map((m) => {
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      m.isAchieved
                        ? 'border-emerald-500/40 bg-emerald-950/20 shadow-sm'
                        : 'border-slate-800 bg-slate-950/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{m.badge}</span>
                        <div>
                          <span className="text-xs font-bold text-white block truncate">{m.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{m.rank}</span>
                        </div>
                      </div>

                      {m.isAchieved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          Conquistado!
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-400 shrink-0">
                          {m.progressPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800/60">
                      {m.isAchieved ? (
                        <div className="space-y-0.5 text-emerald-300/90">
                          <div>📅 Alcançado em: <strong>{formatDateBR(m.achievedDate)}</strong></div>
                          <div>⏱️ Tempo gasto: <strong>{m.daysNeeded} pregões</strong> ({m.tradesNeeded} trades)</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-slate-400">
                          <div>Faltam: <strong className="text-amber-300">{formatBRL(m.remainingAmount)}</strong></div>
                          <div>Previsão: <strong>~{m.estimatedDaysRemaining} pregões</strong> no ritmo atual</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
