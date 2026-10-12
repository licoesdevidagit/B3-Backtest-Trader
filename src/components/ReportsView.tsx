import React, { useState, useMemo } from 'react';
import { Setup, Trade, MonthlySummary } from '../types';
import { formatBRL, calculateMonthlySummary } from '../utils/calculations';
import { AssetComparisonChart } from './AssetComparisonChart';
import { MonthlyPdfExportModal } from './MonthlyPdfExportModal';
import { TradesScatterPlotWidget } from './TradesScatterPlotWidget';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  ListFilter,
  Layers,
  Sparkles,
  ShieldAlert,
  BarChart3,
  FileDown,
  X
} from 'lucide-react';

interface ReportsViewProps {
  trades: Trade[];
  setups: Setup[];
  monthlyData?: MonthlySummary[];
  onFilterByDate: (date: string) => void;
  onFilterBySetup: (setupId: string) => void;
}

const PIE_COLORS = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#f97316', // orange
  '#14b8a6', // teal
  '#e11d48', // rose
];

const WEEKDAYS_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

interface DayPerformance {
  date: string;
  formattedDate: string;
  weekday: string;
  netProfit: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  pointsWIN: number;
  pointsWDO: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  trades,
  setups,
  monthlyData,
  onFilterByDate,
  onFilterBySetup,
}) => {
  const [hoveredSetupId, setHoveredSetupId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<'ALL' | string>('ALL');

  // Available distinct years
  const availableYears = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach((t) => {
      if (!t.date) return;
      const y = t.date.slice(0, 4);
      if (y) map.set(y, (map.get(y) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, count]) => ({ year, count }));
  }, [trades]);

  // Filtered trades by selected year
  const displayedTrades = useMemo(() => {
    if (selectedYear === 'ALL') return trades;
    return trades.filter((t) => t.date?.startsWith(selectedYear));
  }, [trades, selectedYear]);

  const calculatedMonthlyData = useMemo(
    () => (selectedYear === 'ALL' && monthlyData && monthlyData.length > 0 ? monthlyData : calculateMonthlySummary(displayedTrades)),
    [monthlyData, displayedTrades, selectedYear]
  );

  // 1. Group trades by setup for the Pie/Donut Chart
  const setupDistribution = useMemo(() => {
    const totalTradesCount = displayedTrades.length;
    if (totalTradesCount === 0) return [];

    const map = new Map<string, {
      id: string;
      name: string;
      count: number;
      wins: number;
      losses: number;
      profit: number;
    }>();

    // Map existing setups
    setups.forEach((s) => {
      map.set(s.id, {
        id: s.id,
        name: s.name,
        count: 0,
        wins: 0,
        losses: 0,
        profit: 0,
      });
    });

    // Populate with trades
    displayedTrades.forEach((t) => {
      let entry = map.get(t.setupId);
      if (!entry) {
        entry = {
          id: t.setupId,
          name: t.setupName || 'Setup Desconhecido',
          count: 0,
          wins: 0,
          losses: 0,
          profit: 0,
        };
        map.set(t.setupId, entry);
      }
      entry.count++;
      entry.profit += t.financialValue;
      if (t.result === 'GAIN') entry.wins++;
      else if (t.result === 'LOSS') entry.losses++;
    });

    const activeSetups = Array.from(map.values())
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

    return activeSetups.map((s, index) => {
      const percentage = (s.count / totalTradesCount) * 100;
      const winRate = s.count > 0 ? (s.wins / s.count) * 100 : 0;
      return {
        ...s,
        percentage: Number(percentage.toFixed(1)),
        winRate: Number(winRate.toFixed(1)),
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });
  }, [displayedTrades, setups]);

  // 2. Group trades by date to find best and worst days
  const dailyPerformances = useMemo<DayPerformance[]>(() => {
    const map = new Map<string, {
      trades: Trade[];
      netProfit: number;
      wins: number;
      losses: number;
      breakevens: number;
      pointsWIN: number;
      pointsWDO: number;
    }>();

    displayedTrades.forEach((t) => {
      let d = map.get(t.date);
      if (!d) {
        d = {
          trades: [],
          netProfit: 0,
          wins: 0,
          losses: 0,
          breakevens: 0,
          pointsWIN: 0,
          pointsWDO: 0,
        };
        map.set(t.date, d);
      }
      d.trades.push(t);
      d.netProfit += t.financialValue;
      if (t.result === 'GAIN') d.wins++;
      else if (t.result === 'LOSS') d.losses++;
      else d.breakevens++;

      if (t.asset === 'WIN') d.pointsWIN += t.points;
      else if (t.asset === 'WDO') d.pointsWDO += t.points;
    });

    const list: DayPerformance[] = [];
    map.forEach((data, dateStr) => {
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const weekday = !isNaN(dateObj.getTime())
        ? WEEKDAYS_PT[dateObj.getDay()]
        : '';
      const tradesCount = data.trades.length;
      const winRate = tradesCount > 0 ? (data.wins / tradesCount) * 100 : 0;

      list.push({
        date: dateStr,
        formattedDate: `${d}/${m}/${y}`,
        weekday,
        netProfit: Number(data.netProfit.toFixed(2)),
        tradesCount,
        wins: data.wins,
        losses: data.losses,
        breakevens: data.breakevens,
        winRate: Number(winRate.toFixed(1)),
        pointsWIN: data.pointsWIN,
        pointsWDO: Number(data.pointsWDO.toFixed(1)),
      });
    });

    return list;
  }, [displayedTrades]);

  // Top 5 Best Days (highest net profit)
  const top5BestDays = useMemo(() => {
    return [...dailyPerformances]
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5);
  }, [dailyPerformances]);

  // Top 5 Worst Days (lowest net profit)
  const top5WorstDays = useMemo(() => {
    return [...dailyPerformances]
      .sort((a, b) => a.netProfit - b.netProfit)
      .slice(0, 5);
  }, [dailyPerformances]);

  // Summary statistics for best and worst
  const bestDaysAvg = useMemo(() => {
    if (top5BestDays.length === 0) return 0;
    const sum = top5BestDays.reduce((acc, d) => acc + d.netProfit, 0);
    return sum / top5BestDays.length;
  }, [top5BestDays]);

  const worstDaysAvg = useMemo(() => {
    if (top5WorstDays.length === 0) return 0;
    const sum = top5WorstDays.reduce((acc, d) => acc + d.netProfit, 0);
    return sum / top5WorstDays.length;
  }, [top5WorstDays]);

  // Empty state guard
  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <PieChartIcon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Nenhum dado para relatórios</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Registre suas operações de backtest para gerar o gráfico de distribuição de setups e o ranking dos melhores e piores dias financeiros.
        </p>
      </div>
    );
  }

  // Donut SVG Calculations
  const size = 220;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-400" />
              <span>Relatórios Operacionais Avançados</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Análise de distribuição por setup e ranking dos dias mais expressivos do backtest.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm cursor-pointer hover:border-emerald-500/50"
              title="Exportar relatório de performance em PDF"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Exportar Relatório PDF</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Total de Pregões:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {dailyPerformances.length} dias operados
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans block">Média Top 5 Melhores</span>
            <span className="text-base font-bold text-emerald-400">
              +{formatBRL(bestDaysAvg)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans block">Média Top 5 Piores</span>
            <span className="text-base font-bold text-rose-400">
              {formatBRL(worstDaysAvg)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans block">Setup Mais Frequente</span>
            <span className="text-xs font-bold text-white truncate block" title={setupDistribution[0]?.name}>
              {setupDistribution[0]?.name || '-'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans block">Razão Top Ganho/Perda</span>
            <span className="text-base font-bold text-sky-400">
              {worstDaysAvg !== 0 ? Math.abs(bestDaysAvg / worstDaysAvg).toFixed(2) : '-'}x
            </span>
          </div>
        </div>

        {/* Seletor de Período Anual */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Filtrar Relatório por Ano:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedYear === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos os Anos ({trades.length})
            </button>

            {availableYears.map(({ year, count }) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedYear === year
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Ano {year}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  selectedYear === year ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {selectedYear !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <X className="h-3 w-3" />
              <span>Limpar filtro anual</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION: Comparativo de Desempenho WIN vs WDO (Gráfico de Barras Financeiro e Taxa de Acerto) */}
      <AssetComparisonChart trades={displayedTrades} />

      {/* SECTION: Gráfico de Dispersão Ganho x Perda por Trade (Assimetria dos Setups) */}
      <TradesScatterPlotWidget
        trades={displayedTrades}
        setups={setups}
        onFilterBySetup={onFilterBySetup}
      />

      {/* SECTION 1: Gráfico de Pizza - Distribuição de Trades por Setup */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Distribuição de Operações por Setup (Gráfico Donut)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporção de execuções de cada estratégia sobre o total de {displayedTrades.length} operações realizadas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 relative">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                {/* Background base track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />

                {/* Slices */}
                {setupDistribution.map((item) => {
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += item.percentage;
                  const isHovered = hoveredSetupId === item.id;

                  return (
                    <circle
                      key={item.id}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredSetupId(item.id)}
                      onMouseLeave={() => setHoveredSetupId(null)}
                      onClick={() => onFilterBySetup(item.id)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Hole Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                  {trades.length}
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono">
                  {trades.length === 1 ? 'Trade' : 'Trades'}
                </span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 mt-2 font-mono">
              Passe o mouse ou clique no setup para filtrar
            </span>
          </div>

          {/* Setups Breakdown Legend List */}
          <div className="lg:col-span-7 space-y-2">
            {setupDistribution.map((item) => {
              const isHovered = hoveredSetupId === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredSetupId(item.id)}
                  onMouseLeave={() => setHoveredSetupId(null)}
                  onClick={() => onFilterBySetup(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isHovered
                      ? 'border-slate-600 bg-slate-800/80 shadow-md ring-1 ring-slate-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.count} {item.count === 1 ? 'trade' : 'trades'} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-32 sm:w-48 h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
                        <div
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-slate-400">
                      Acerto: <strong className={item.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{item.winRate}%</strong>
                    </span>
                    <span className={`font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatBRL(item.profit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Ranking dos 5 Melhores e 5 Piores Dias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP 5 MELHORES DIAS */}
        <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Top 5 Melhores Dias Financeiros</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </h3>
                <span className="text-[11px] text-slate-400">Pregões de maior lucratividade</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Dias Positivos
            </span>
          </div>

          <div className="space-y-2.5">
            {top5BestDays.map((day, idx) => {
              const isFirst = idx === 0;

              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isFirst
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-slate-900/90 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isFirst
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {idx + 1}º
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {day.formattedDate}
                        </span>
                        {day.weekday && (
                          <span className="text-[11px] text-slate-400">
                            ({day.weekday})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {day.tradesCount} {day.tradesCount === 1 ? 'trade' : 'trades'} · {day.wins}G / {day.losses}L · {day.winRate}% acerto
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-sm font-bold text-emerald-400 block">
                        +{formatBRL(day.netProfit)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {day.pointsWIN !== 0 && `${day.pointsWIN > 0 ? '+' : ''}${day.pointsWIN} pts WIN`}
                        {day.pointsWIN !== 0 && day.pointsWDO !== 0 && ' · '}
                        {day.pointsWDO !== 0 && `${day.pointsWDO > 0 ? '+' : ''}${day.pointsWDO} pts WDO`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFilterByDate(day.date)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={`Ver histórico de trades de ${day.formattedDate}`}
                    >
                      <ListFilter className="h-4 w-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP 5 PIORES DIAS */}
        <div className="rounded-xl border border-rose-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Top 5 Piores Dias Financeiros</span>
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                </h3>
                <span className="text-[11px] text-slate-400">Pregões de maior rebaixamento</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              Controle de Stop
            </span>
          </div>

          <div className="space-y-2.5">
            {top5WorstDays.map((day, idx) => {
              const isFirst = idx === 0;

              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isFirst && day.netProfit < 0
                      ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 to-slate-900/90 shadow-sm ring-1 ring-rose-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {idx + 1}º
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {day.formattedDate}
                        </span>
                        {day.weekday && (
                          <span className="text-[11px] text-slate-400">
                            ({day.weekday})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {day.tradesCount} {day.tradesCount === 1 ? 'trade' : 'trades'} · {day.wins}G / {day.losses}L · {day.winRate}% acerto
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right font-mono">
                      <span className={`text-sm font-bold block ${day.netProfit < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {formatBRL(day.netProfit)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {day.pointsWIN !== 0 && `${day.pointsWIN > 0 ? '+' : ''}${day.pointsWIN} pts WIN`}
                        {day.pointsWIN !== 0 && day.pointsWDO !== 0 && ' · '}
                        {day.pointsWDO !== 0 && `${day.pointsWDO > 0 ? '+' : ''}${day.pointsWDO} pts WDO`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFilterByDate(day.date)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={`Auditar histórico de trades de ${day.formattedDate}`}
                    >
                      <ListFilter className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Exportação de Relatório Mensal em PDF */}
      <MonthlyPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        monthlyData={calculatedMonthlyData}
        trades={trades}
        setups={setups}
        initialMonthKey="ALL"
      />
    </div>
  );
};
