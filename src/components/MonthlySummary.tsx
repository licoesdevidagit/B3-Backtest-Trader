import React, { useState, useMemo } from 'react';
import { MonthlySummary as MonthlySummaryType, Setup, Trade, YearlySummary } from '../types';
import { formatBRL, calculateYearlySummary } from '../utils/calculations';
import { 
  CalendarDays, 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp, 
  ListFilter,
  CheckCircle2,
  XCircle,
  Percent,
  Calendar,
  Zap,
  Calculator,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Filter,
  FileDown,
  FileText,
  BarChart3,
  LineChart,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ContractSimulator, getSimulatedMonthValue } from './ContractSimulator';
import { MonthlyPdfExportModal } from './MonthlyPdfExportModal';

interface MonthlySummaryProps {
  monthlyData: MonthlySummaryType[];
  onFilterByMonth: (monthKey: string) => void;
  trades?: Trade[];
  setups?: Setup[];
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  monthlyData,
  onFilterByMonth,
  trades = [],
  setups = [],
}) => {
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'original' | 'simulated'>('original');
  const [showGrowthLine, setShowGrowthLine] = useState<boolean>(true);

  // PDF Export Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfModalMonthKey, setPdfModalMonthKey] = useState<string>('ALL');

  const handleOpenPdfModal = (monthKey: string = 'ALL') => {
    setPdfModalMonthKey(monthKey);
    setIsPdfModalOpen(true);
  };

  // Sorting controls: 'desc' (Decrescente) or 'asc' (Crescente)
  const [sortField, setSortField] = useState<'month' | 'profit' | 'winRate' | 'trades' | 'profitFactor'>('month');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterResultType, setFilterResultType] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');
  const [selectedYear, setSelectedYear] = useState<'ALL' | number>('ALL');

  // Simulated contracts per month state (loaded from localStorage)
  const [contractsByMonth, setContractsByMonth] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('b3_simulated_contracts_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {};
  });

  const handleContractsChange = (updated: Record<string, number>) => {
    setContractsByMonth(updated);
    try {
      localStorage.setItem('b3_simulated_contracts_v1', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  if (monthlyData.length === 0) {
    return null;
  }

  // Available distinct years from monthly data
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    monthlyData.forEach((m) => set.add(m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [monthlyData]);

  // Annual summaries calculated across trades
  const yearlySummaries = useMemo(() => {
    return calculateYearlySummary(trades);
  }, [trades]);

  // Filter monthly data by chosen year
  const displayedMonthlyData = useMemo(() => {
    if (selectedYear === 'ALL') return monthlyData;
    return monthlyData.filter((m) => m.year === selectedYear);
  }, [monthlyData, selectedYear]);

  // Check if any month has simulated contracts > 1
  const isAnyMonthSimulated = Object.values(contractsByMonth).some((c) => c > 1);

  // Compute effective profit for each month depending on chartMode
  const getMonthProfit = (m: MonthlySummaryType) => {
    if (chartMode === 'simulated') {
      const contracts = contractsByMonth[m.monthKey] || 1;
      return getSimulatedMonthValue(m, contracts);
    }
    return m.netProfit;
  };

  // Aggregate KPI calculations based on displayed (year-filtered) data
  const totalMonths = displayedMonthlyData.length;
  const profitableMonths = displayedMonthlyData.filter((m) => getMonthProfit(m) > 0).length;
  const losingMonths = displayedMonthlyData.filter((m) => getMonthProfit(m) < 0).length;
  const totalAccumulatedProfit = displayedMonthlyData.reduce((acc, m) => acc + getMonthProfit(m), 0);
  const averageMonthlyProfit = totalMonths > 0 ? totalAccumulatedProfit / totalMonths : 0;

  // Best and worst months in the displayed period
  const sortedByProfit = [...displayedMonthlyData].sort((a, b) => getMonthProfit(b) - getMonthProfit(a));
  const bestMonth = sortedByProfit[0];
  const worstMonth = sortedByProfit[sortedByProfit.length - 1];

  // Recharts Monthly Data: Net Profit per Month & Cumulative Growth
  const chartData = useMemo(() => {
    let runningAccumulated = 0;
    return displayedMonthlyData.map((m) => {
      const profit = getMonthProfit(m);
      runningAccumulated += profit;
      const contracts = contractsByMonth[m.monthKey] || 1;
      return {
        monthKey: m.monthKey,
        name: m.shortLabel,
        fullLabel: m.monthLabel,
        profit: Number(profit.toFixed(2)),
        accumulated: Number(runningAccumulated.toFixed(2)),
        winRate: m.winRate,
        trades: m.totalTrades,
        wins: m.wins,
        losses: m.losses,
        breakevens: m.breakevens,
        profitFactor: m.profitFactor,
        contracts: contracts,
        isProfit: profit >= 0,
      };
    });
  }, [displayedMonthlyData, chartMode, contractsByMonth]);

  const toggleExpand = (key: string) => {
    setExpandedMonthKey((prev) => (prev === key ? null : key));
  };

  // Sorted and filtered list of months
  const sortedMonthlyData = React.useMemo(() => {
    let list = [...displayedMonthlyData];

    // Filter by result type if chosen
    if (filterResultType === 'PROFIT') {
      list = list.filter((m) => getMonthProfit(m) > 0);
    } else if (filterResultType === 'LOSS') {
      list = list.filter((m) => getMonthProfit(m) < 0);
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'month') {
        comp = a.monthKey.localeCompare(b.monthKey);
      } else if (sortField === 'profit') {
        comp = getMonthProfit(a) - getMonthProfit(b);
      } else if (sortField === 'winRate') {
        comp = a.winRate - b.winRate;
      } else if (sortField === 'trades') {
        comp = a.totalTrades - b.totalTrades;
      } else if (sortField === 'profitFactor') {
        comp = a.profitFactor - b.profitFactor;
      }
      return sortOrder === 'desc' ? -comp : comp;
    });

    return list;
  }, [displayedMonthlyData, filterResultType, sortField, sortOrder, chartMode, contractsByMonth]);

  // Helper to format currency values on the Y-Axis
  const formatYAxisBRL = (val: number) => {
    if (Math.abs(val) >= 1000) {
      const k = val / 1000;
      return `R$ ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return `R$ ${val}`;
  };

  // Custom Recharts Tooltip for detailed monthly financial breakdown
  const MonthlyChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const isPositive = data.profit >= 0;
    const isAccPositive = data.accumulated >= 0;

    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md min-w-[250px] text-xs space-y-2.5 z-50 pointer-events-none select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
          <div>
            <span className="font-bold text-white text-sm block">{data.fullLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">Chave: {data.monthKey}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isPositive ? 'Mês Lucrativo' : 'Mês Negativo'}
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: isPositive ? '#10b981' : '#f43f5e' }}
              />
              Resultado Líquido:
            </span>
            <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(data.profit)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400" />
              Crescimento Acumulado:
            </span>
            <span className={`font-bold ${isAccPositive ? 'text-sky-300' : 'text-rose-300'}`}>
              {formatBRL(data.accumulated)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-slate-400 block font-sans text-[10px]">Taxa de Acerto</span>
            <span className={`font-bold ${data.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.winRate}%
            </span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-slate-400 block font-sans text-[10px]">Fator Lucro</span>
            <span className="text-white font-bold">
              {data.profitFactor > 0 ? data.profitFactor.toFixed(2) : '-'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-slate-400 block font-sans text-[10px]">Trades</span>
            <span className="text-slate-200">
              {data.trades} ({data.wins ?? '-'}G / {data.losses ?? '-'}L)
            </span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
            <span className="text-slate-400 block font-sans text-[10px]">
              {chartMode === 'simulated' ? 'Contratos' : 'Modo'}
            </span>
            <span className="text-emerald-400 font-bold">
              {chartMode === 'simulated' ? `${data.contracts} cts` : '1 contrato'}
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 text-center font-sans">
          💡 Clique na barra para filtrar trades deste mês
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
            <span>Resumo Mensal de Desempenho</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evolução do resultado financeiro total e taxa de acerto agrupados mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenPdfModal('ALL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm cursor-pointer hover:border-emerald-500/50"
            title="Exportar histórico e performance dos meses em formato PDF"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Exportar Relatório PDF</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono pl-2 border-l border-slate-800/80">
            <span className="text-slate-400">Total acumulado:</span>
            <span
              className={`font-bold ${
                totalAccumulatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatBRL(totalAccumulatedProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Seletor de Período Anual */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Seletor de Período Anual:</span>
            </span>
            {selectedYear !== 'ALL' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 flex items-center gap-1.5">
                <span>Filtrando por:</span>
                <strong>Ano {selectedYear}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedYear('ALL')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  title="Ver todos os anos"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {selectedYear !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer font-medium"
            >
              <span>Exibir Todos os Anos</span>
            </button>
          )}
        </div>

        {/* Pílulas de Seleção Rápida de Ano */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedYear('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              selectedYear === 'ALL'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Todos os Anos</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              selectedYear === 'ALL' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>
              {monthlyData.length} {monthlyData.length === 1 ? 'mês' : 'meses'}
            </span>
          </button>

          {availableYears.map((year) => {
            const yearMonths = monthlyData.filter((m) => m.year === year);
            const yearProfit = yearMonths.reduce((acc, m) => acc + getMonthProfit(m), 0);
            const isPos = yearProfit >= 0;

            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedYear === year
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold ring-1 ring-emerald-400/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>Ano {year}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  selectedYear === year
                    ? 'bg-slate-950/20 text-slate-950'
                    : isPos
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {formatBRL(yearProfit)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Meses Positivos
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-white flex items-baseline gap-1.5">
            <span className="text-emerald-400">{profitableMonths}</span>
            <span className="text-xs text-slate-400 font-normal">de {totalMonths} meses</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {losingMonths > 0 ? `${losingMonths} mês negativo` : 'Nenhum mês negativo'}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Média Mensal
          </span>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
              averageMonthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(averageMonthlyProfit)}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {totalMonths} {totalMonths === 1 ? 'mês avaliado' : 'meses avaliados'}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Melhor Mês
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tabular-nums">
            +{formatBRL(bestMonth?.netProfit || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block truncate" title={bestMonth?.monthLabel}>
            {bestMonth?.monthLabel || '-'} ({bestMonth?.winRate}% acerto)
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Pior Mês
          </span>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
              worstMonth?.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(worstMonth?.netProfit || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block truncate" title={worstMonth?.monthLabel}>
            {worstMonth?.monthLabel || '-'} ({worstMonth?.winRate}% acerto)
          </span>
        </div>
      </div>

      {/* 1. Dedicated Position Sizing & Contract Simulator Area */}
      <ContractSimulator
        monthlyData={monthlyData}
        contractsByMonth={contractsByMonth}
        onContractsChange={handleContractsChange}
      />

      {/* Visual Chart: Gráfico de Barras Mensal com Recharts & Curva de Crescimento */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs pb-3 border-b border-slate-800/70">
          <div>
            <span className="font-semibold text-white text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>
                {selectedYear !== 'ALL'
                  ? `Evolução do Resultado Financeiro Líquido por Mês — Ano ${selectedYear}`
                  : 'Evolução do Resultado Financeiro Líquido por Mês'}
              </span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gráfico de barras mensal gerado com Recharts exibindo o resultado financeiro líquido de cada mês e curva de crescimento acumulado.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto font-sans">
            {/* Toggle Growth Curve */}
            <button
              type="button"
              onClick={() => setShowGrowthLine((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                showGrowthLine
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Exibir ou ocultar linha de crescimento acumulado"
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>{showGrowthLine ? 'Curva Acumulada Ativa' : 'Exibir Curva Acumulada'}</span>
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setChartMode('original')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  chartMode === 'original'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Realizado (1 ct)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('simulated')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  chartMode === 'simulated'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <Zap className="h-3 w-3" />
                <span>Simulado por Contratos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Monthly Bar & Growth Chart */}
        <div className="w-full h-72 sm:h-80 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: showGrowthLine ? 20 : 10, left: 10, bottom: 10 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const item = state.activePayload[0].payload;
                  if (item && item.monthKey) {
                    onFilterByMonth(item.monthKey);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="lossBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="growthLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                dy={6}
              />

              <YAxis
                yAxisId="profit"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={formatYAxisBRL}
              />

              {showGrowthLine && (
                <YAxis
                  yAxisId="accumulated"
                  orientation="right"
                  stroke="#38bdf8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisBRL}
                />
              )}

              <Tooltip content={<MonthlyChartTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.25)', radius: 6 }} />

              <ReferenceLine
                yAxisId="profit"
                y={0}
                stroke="#475569"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              <Bar
                yAxisId="profit"
                dataKey="profit"
                name="Resultado Líquido"
                radius={[4, 4, 4, 4]}
                maxBarSize={48}
                className="cursor-pointer"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`bar-${entry.monthKey}`}
                    fill={entry.profit >= 0 ? 'url(#profitBarGrad)' : 'url(#lossBarGrad)'}
                    stroke={entry.profit >= 0 ? '#34d399' : '#fb7185'}
                    strokeWidth={1}
                    className="cursor-pointer transition-opacity hover:opacity-100 opacity-90"
                  />
                ))}
              </Bar>

              {showGrowthLine && (
                <Line
                  yAxisId="accumulated"
                  type="monotone"
                  dataKey="accumulated"
                  name="Crescimento Acumulado"
                  stroke="url(#growthLineGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#020617', stroke: '#38bdf8', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-slate-300">Lucro Líquido (Mês)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded bg-rose-500" />
              <span className="text-slate-300">Prejuízo Líquido (Mês)</span>
            </span>
            {showGrowthLine && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3.5 h-0.5 bg-sky-400" />
                <span className="text-sky-300 font-medium">Curva de Crescimento Acumulado</span>
              </span>
            )}
          </div>
          <span className="text-slate-400 text-[10px] font-sans">
            💡 Dica: Clique em qualquer barra mensal para abrir o histórico correspondente.
          </span>
        </div>
      </div>

      {/* Tabela de Desempenho por Períodos Anuais (Comparativo Consolidado de Anos) */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/70">
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Desempenho por Períodos Anuais (Comparativo Consolidado de Anos)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Consolidado dos resultados acumulados de cada ano civil operado no diário.
            </p>
          </div>

          {selectedYear !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Exibir todos os anos</span>
            </button>
          )}
        </div>

        {/* Tabela de Resumo Anual */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-sans uppercase tracking-wider">
                <th className="py-2.5 px-3">Ano</th>
                <th className="py-2.5 px-3 text-right">Trades</th>
                <th className="py-2.5 px-3 text-right">Resultado Líquido</th>
                <th className="py-2.5 px-3 text-right">Taxa de Acerto</th>
                <th className="py-2.5 px-3 text-right">Fator Lucro</th>
                <th className="py-2.5 px-3 text-right">Média Mensal</th>
                <th className="py-2.5 px-3 text-center">Meses (+) / (-)</th>
                <th className="py-2.5 px-3 text-right">Melhor Mês</th>
                <th className="py-2.5 px-3 text-center font-sans">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {yearlySummaries.map((yr) => {
                const isSelected = selectedYear === yr.year;
                const isPositive = yr.netProfit >= 0;

                return (
                  <tr
                    key={yr.year}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/25 border-l-2 border-l-emerald-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white font-sans flex items-center gap-2">
                      <span className="text-sm font-semibold">Ano {yr.year}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Filtrado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {yr.totalTrades}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatBRL(yr.netProfit)}
                    </td>
                    <td className="py-3 px-3 text-right text-sky-300 font-semibold">
                      {yr.winRate}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {yr.profitFactor.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${
                      yr.avgMonthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatBRL(yr.avgMonthlyProfit)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      <span className="text-emerald-400 font-bold">{yr.profitableMonthsCount}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-rose-400 font-bold">{yr.losingMonthsCount}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 truncate max-w-[140px]">
                      {yr.bestMonth ? (
                        <span className="text-emerald-400" title={`${yr.bestMonth.monthLabel}: ${formatBRL(yr.bestMonth.netProfit)}`}>
                          {yr.bestMonth.monthLabel}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedYear(isSelected ? 'ALL' : yr.year)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Ver Todos' : 'Analisar Ano'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sorting & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-sm">
        {/* Result Filter Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span>Filtro:</span>
          </span>
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterResultType('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResultType === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({displayedMonthlyData.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterResultType('PROFIT')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResultType === 'PROFIT'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lucrativos ({profitableMonths})
            </button>
            <button
              type="button"
              onClick={() => setFilterResultType('LOSS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResultType === 'LOSS'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prejuízo ({losingMonths})
            </button>
          </div>
        </div>

        {/* Sorting Controls: Organizar por + Decrescente / Crescente */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
              <span>Organizar por:</span>
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-2.5 text-xs text-slate-200 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="month">Mês / Cronológico</option>
              <option value="profit">Resultado Financeiro (R$)</option>
              <option value="winRate">Taxa de Acerto (%)</option>
              <option value="trades">Total de Trades</option>
              <option value="profitFactor">Fator de Lucro</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setSortOrder('desc')}
              title="Ordem Decrescente (Maior para menor / Mais recentes primeiro)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'desc'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              <span>Decrescente</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOrder('asc')}
              title="Ordem Crescente (Menor para maior / Mais antigos primeiro)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'asc'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpWideNarrow className="h-3.5 w-3.5" />
              <span>Crescente</span>
            </button>
          </div>
        </div>
      </div>

      {sortedMonthlyData.length === 0 && (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          Nenhum mês encontrado para o filtro selecionado.
        </div>
      )}

      {/* Detailed Monthly Breakdown */}
      {/* Mobile & Tablet Card View (visible on < md screens) */}
      <div className="md:hidden space-y-3">
        {sortedMonthlyData.map((m) => {
          const isProfit = m.netProfit >= 0;
          const isExpanded = expandedMonthKey === m.monthKey;

          return (
            <div
              key={m.monthKey}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white text-sm">{m.monthLabel}</span>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {m.totalTrades} trades ({m.wins}G / {m.losses}L{m.breakevens > 0 ? ` / ${m.breakevens}E` : ''})
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span
                    className={`text-base font-bold ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(m.netProfit)}
                  </span>
                  {contractsByMonth[m.monthKey] && contractsByMonth[m.monthKey] > 1 && (
                    <div className="text-[11px] font-bold text-emerald-400 font-mono">
                      Simulado ({contractsByMonth[m.monthKey]} cts): {formatBRL(getSimulatedMonthValue(m, contractsByMonth[m.monthKey]))}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    <span className="text-emerald-400">+{formatBRL(m.grossGain)}</span>
                    {' / '}
                    <span className="text-rose-400">-{formatBRL(m.grossLoss)}</span>
                  </div>
                </div>
              </div>

              {/* Win Rate Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400">Taxa de Acerto:</span>
                  <span
                    className={`font-bold ${
                      m.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${m.winRate}%` }}
                    className={`h-full ${
                      m.winRate >= 60
                        ? 'bg-emerald-500'
                        : m.winRate >= 45
                        ? 'bg-blue-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Stats row: Profit factor and Points */}
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-b border-slate-800/60 py-2">
                <div>
                  <span className="text-slate-400">Fator Lucro: </span>
                  <strong className="text-white">{m.profitFactor > 0 ? m.profitFactor.toFixed(2) : '-'}</strong>
                </div>
                <div className="text-right">
                  <span>WIN: <strong>{m.pointsWIN >= 0 ? `+${m.pointsWIN}` : m.pointsWIN} pts</strong></span>
                  {' · '}
                  <span>WDO: <strong>{m.pointsWDO >= 0 ? `+${m.pointsWDO}` : m.pointsWDO} pts</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(m.monthKey)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes do mês'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenPdfModal(m.monthKey)}
                    title={`Exportar relatório em PDF de ${m.monthLabel}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFilterByMonth(m.monthKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                  >
                    <ListFilter className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Ver Trades</span>
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Melhor Trade</span>
                    <span className="text-emerald-400 font-bold">+{formatBRL(m.bestTrade)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Pior Trade</span>
                    <span className="text-rose-400 font-bold">{formatBRL(m.worstTrade)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Detailed Monthly Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th 
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (sortField === 'month') {
                    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('month');
                    setSortOrder('desc');
                  }
                }}
                title="Clique para ordenar por Mês"
              >
                Mês {sortField === 'month' && (sortOrder === 'desc' ? '▼' : '▲')}
              </th>
              <th 
                className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (sortField === 'trades') {
                    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('trades');
                    setSortOrder('desc');
                  }
                }}
                title="Clique para ordenar por Quantidade de Trades"
              >
                Trades {sortField === 'trades' && (sortOrder === 'desc' ? '▼' : '▲')}
              </th>
              <th 
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (sortField === 'winRate') {
                    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('winRate');
                    setSortOrder('desc');
                  }
                }}
                title="Clique para ordenar por Taxa de Acerto"
              >
                Taxa de Acerto {sortField === 'winRate' && (sortOrder === 'desc' ? '▼' : '▲')}
              </th>
              <th 
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (sortField === 'profit') {
                    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('profit');
                    setSortOrder('desc');
                  }
                }}
                title="Clique para ordenar por Resultado Financeiro"
              >
                Resultado Base (1 ct) {sortField === 'profit' && (sortOrder === 'desc' ? '▼' : '▲')}
              </th>
              {isAnyMonthSimulated && (
                <th className="py-2.5 px-3 text-right text-emerald-400">Simulado com Contratos</th>
              )}
              <th 
                className="py-2.5 px-2 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (sortField === 'profitFactor') {
                    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('profitFactor');
                    setSortOrder('desc');
                  }
                }}
                title="Clique para ordenar por Fator de Lucro"
              >
                Fator Lucro {sortField === 'profitFactor' && (sortOrder === 'desc' ? '▼' : '▲')}
              </th>
              <th className="py-2.5 px-3 text-right">Pontos WIN / WDO</th>
              <th className="py-2.5 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 font-mono bg-slate-900/40">
            {sortedMonthlyData.map((m) => {
              const isProfit = m.netProfit >= 0;
              const isExpanded = expandedMonthKey === m.monthKey;

              return (
                <React.Fragment key={m.monthKey}>
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    {/* Month Label */}
                    <td className="py-3 px-3 font-sans font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white">{m.monthLabel}</span>
                          <span className="block text-[10px] font-mono text-slate-400">
                            {m.wins} Gain · {m.losses} Loss{m.breakevens > 0 ? ` · ${m.breakevens} 0x0` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Trades count */}
                    <td className="py-3 px-2 text-center text-slate-200">
                      {m.totalTrades}
                    </td>

                    {/* Win Rate */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-24 h-2 rounded-full bg-slate-800 overflow-hidden shrink-0">
                          <div
                            style={{ width: `${m.winRate}%` }}
                            className={`h-full ${
                              m.winRate >= 60
                                ? 'bg-emerald-500'
                                : m.winRate >= 45
                                ? 'bg-blue-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`font-semibold ${
                            m.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Net Profit */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatBRL(m.netProfit)}
                      </span>
                      <div className="text-[10px] text-slate-400 flex items-center justify-end gap-2">
                        <span className="text-emerald-400">+{formatBRL(m.grossGain)}</span>
                        <span>/</span>
                        <span className="text-rose-400">-{formatBRL(m.grossLoss)}</span>
                      </div>
                    </td>

                    {/* Simulated Profit Column */}
                    {isAnyMonthSimulated && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-extrabold ${
                            getSimulatedMonthValue(m, contractsByMonth[m.monthKey] || 1) >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatBRL(getSimulatedMonthValue(m, contractsByMonth[m.monthKey] || 1))}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {contractsByMonth[m.monthKey] || 1} {((contractsByMonth[m.monthKey] || 1) === 1) ? 'ct' : 'cts'}
                        </span>
                      </td>
                    )}

                    {/* Profit Factor */}
                    <td className="py-3 px-2 text-right">
                      <span
                        className={
                          m.profitFactor >= 1.5
                            ? 'text-emerald-400 font-bold'
                            : m.profitFactor >= 1
                            ? 'text-blue-400'
                            : 'text-slate-400'
                        }
                      >
                        {m.profitFactor > 0 ? m.profitFactor.toFixed(2) : '-'}
                      </span>
                    </td>

                    {/* Points WIN / WDO */}
                    <td className="py-3 px-3 text-right whitespace-nowrap text-[11px]">
                      <div>
                        WIN: <span className={m.pointsWIN >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          {m.pointsWIN >= 0 ? `+${m.pointsWIN}` : m.pointsWIN} pts
                        </span>
                      </div>
                      <div>
                        WDO: <span className={m.pointsWDO >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          {m.pointsWDO >= 0 ? `+${m.pointsWDO}` : m.pointsWDO} pts
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPdfModal(m.monthKey)}
                          title={`Exportar relatório em PDF de ${m.monthLabel}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <FileDown className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onFilterByMonth(m.monthKey)}
                          title={`Ver histórico de trades de ${m.monthLabel}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                        >
                          <ListFilter className="h-3 w-3 text-emerald-400" />
                          <span>Ver Trades</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(m.monthKey)}
                          title="Detalhar mês"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Monthly Breakdown Detail */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80">
                      <td colSpan={isAnyMonthSimulated ? 8 : 7} className="p-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Melhor Operação do Mês
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-400">
                              +{formatBRL(m.bestTrade)}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Pior Operação do Mês
                            </span>
                            <div className="text-sm font-bold font-mono text-rose-400">
                              {formatBRL(m.worstTrade)}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-semibold text-slate-400">
                                Média por Trade
                              </span>
                              <div
                                className={`text-sm font-bold font-mono ${
                                  m.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {formatBRL(m.totalTrades > 0 ? m.netProfit / m.totalTrades : 0)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onFilterByMonth(m.monthKey)}
                              className="text-xs text-emerald-400 hover:underline font-semibold"
                            >
                              Filtrar {m.trades.length} operações →
                            </button>
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

      {/* Modal de Exportação de Relatório Mensal em PDF */}
      <MonthlyPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        monthlyData={monthlyData}
        trades={trades && trades.length > 0 ? trades : monthlyData.flatMap((m) => m.trades || [])}
        setups={setups}
        initialMonthKey={pdfModalMonthKey}
      />
    </div>
  );
};
