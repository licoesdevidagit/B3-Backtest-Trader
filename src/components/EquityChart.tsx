import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { formatBRL } from '../utils/calculations';
import { TrendingUp, Activity, HelpCircle, Calendar, X, Wallet, DollarSign, Edit3, Check } from 'lucide-react';

interface EquityChartProps {
  trades: Trade[];
  initialCapital?: number;
  onUpdateInitialCapital?: (capital: number) => void;
}

export const EquityChart: React.FC<EquityChartProps> = ({ 
  trades,
  initialCapital = 1000,
  onUpdateInitialCapital,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'equity' | 'profit' | 'winrate'>('equity');
  const [selectedYear, setSelectedYear] = useState<'ALL' | string>('ALL');
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [tempCapitalInput, setTempCapitalInput] = useState<string>(() => String(initialCapital));

  const cap = initialCapital;

  const handleSaveCapital = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = tempCapitalInput.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    const finalVal = isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100) / 100;
    onUpdateInitialCapital?.(finalVal);
    setIsEditingCapital(false);
  };

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

  // Filter trades by selected year
  const displayedTrades = useMemo(() => {
    if (selectedYear === 'ALL') return trades;
    return trades.filter((t) => t.date?.startsWith(selectedYear));
  }, [trades, selectedYear]);

  // Sort trades chronologically
  const sortedTrades = useMemo(() => {
    return [...displayedTrades].sort((a, b) => {
      const da = `${a.date} ${a.time || '00:00'}`;
      const db = `${b.date} ${b.time || '00:00'}`;
      return da.localeCompare(db);
    });
  }, [displayedTrades]);

  // Period stats
  const periodStats = useMemo(() => {
    const total = sortedTrades.length;
    let net = 0;
    let wins = 0;
    sortedTrades.forEach((t) => {
      net += t.financialValue;
      if (t.result === 'GAIN') wins++;
    });
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
    const finalEquity = cap + net;
    const returnPct = cap > 0 ? ((net / cap) * 100).toFixed(1) : '0';
    return { total, net, winRate, finalEquity, returnPct };
  }, [sortedTrades, cap]);

  // Compute cumulative series
  const dataPoints = useMemo(() => {
    let cumulativeFin = 0;
    let winCount = 0;

    const points = [
      {
        index: 0,
        date: 'Início',
        time: '',
        asset: '',
        setup: '',
        result: '',
        points: 0,
        tradeVal: 0,
        netProfit: 0,
        totalEquity: cap,
        cumulativeFin: viewMode === 'profit' ? 0 : cap,
        cumulativeWinRate: 0,
      }
    ];

    sortedTrades.forEach((t, i) => {
      cumulativeFin += t.financialValue;
      if (t.result === 'GAIN') winCount++;
      const currentWinRate = ((winCount / (i + 1)) * 100);

      points.push({
        index: i + 1,
        date: t.date,
        time: t.time || '',
        asset: t.asset,
        setup: t.setupName || 'Setup',
        result: t.result,
        points: t.points,
        tradeVal: t.financialValue,
        netProfit: cumulativeFin,
        totalEquity: cap + cumulativeFin,
        cumulativeFin: viewMode === 'profit' ? cumulativeFin : (cap + cumulativeFin),
        cumulativeWinRate: Number(currentWinRate.toFixed(1)),
      });
    });

    return points;
  }, [sortedTrades, cap, viewMode]);

  if (trades.length < 2) {
    return null;
  }

  // Dimensions
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  // Extract min/max based on viewMode
  const values = dataPoints.map(p => {
    if (viewMode === 'equity') return p.totalEquity;
    if (viewMode === 'profit') return p.netProfit;
    return p.cumulativeWinRate;
  });

  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (viewMode === 'winrate') {
    minVal = 0;
    maxVal = 100;
  } else if (viewMode === 'equity') {
    // Financial equity: ensure starting capital is in bounds
    if (minVal > cap) minVal = cap;
    if (maxVal < cap) maxVal = cap;
    const span = maxVal - minVal || 100;
    minVal -= span * 0.05;
    maxVal += span * 0.05;
  } else {
    // Pure profit: ensure 0 is in visible bounds
    if (minVal > 0) minVal = 0;
    if (maxVal < 0) maxVal = 0;
    const span = maxVal - minVal || 100;
    minVal -= span * 0.05;
    maxVal += span * 0.05;
  }

  const range = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (dataPoints.length <= 1) return paddingX;
    return paddingX + (idx / (dataPoints.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / range;
    return height - paddingY - norm * (height - paddingY * 2);
  };

  const baselineVal = viewMode === 'equity' ? cap : 0;
  const baselineY = getY(baselineVal);

  // Generate SVG path string
  const pathD = dataPoints.reduce((acc, p, idx) => {
    const x = getX(idx);
    const plotVal = viewMode === 'equity' 
      ? p.totalEquity 
      : viewMode === 'profit' 
      ? p.netProfit 
      : p.cumulativeWinRate;
    const y = getY(plotVal);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  // Fill area under path
  const firstX = getX(0);
  const lastX = getX(dataPoints.length - 1);
  const baselineClamped = Math.min(height - paddingY, Math.max(paddingY, baselineY));
  const areaD = `${pathD} L ${lastX},${baselineClamped} L ${firstX},${baselineClamped} Z`;

  const hoveredPoint = hoverIndex !== null ? dataPoints[hoverIndex] : null;

  const currentTotal = values[values.length - 1];
  const isPositive = viewMode === 'equity' ? currentTotal >= cap : currentTotal >= 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Curva de Capital e Saldo da Conta</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              ({sortedTrades.length} de {trades.length} trades)
            </span>
            {selectedYear !== 'ALL' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <span>Ano:</span>
                <strong>{selectedYear}</strong>
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
          <p className="text-xs text-slate-400 mt-0.5">
            Evolução do saldo total em reais considerando o aporte inicial de {formatBRL(cap)}.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('equity')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'equity'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Saldo Total (R$)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('profit')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'profit'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lucro Líquido (R$)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('winrate')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'winrate'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Taxa de Acerto (%)
          </button>
        </div>
      </div>

      {/* Capital Status & Year Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 py-2 px-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Calendar className="h-3.5 w-3.5 text-purple-400" />
            <span>Ano:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedYear('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === 'ALL'
                ? 'bg-purple-600/25 text-purple-200 border border-purple-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({trades.length})
          </button>

          {availableYears.map(({ year, count }) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedYear === year
                  ? 'bg-purple-600/30 text-white border border-purple-400 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{year}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${
                selectedYear === year ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Period Stats Banner */}
        <div className="flex items-center gap-3 font-mono text-xs self-start lg:self-auto border-t lg:border-t-0 pt-1.5 lg:pt-0 border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Capital Base:</span>
            <span className="text-white font-semibold">{formatBRL(cap)}</span>
            {onUpdateInitialCapital && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingCapital(!isEditingCapital);
                  setTempCapitalInput(String(cap));
                }}
                className="text-slate-400 hover:text-emerald-400 cursor-pointer ml-0.5"
                title="Ajustar capital inicial"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-slate-600">•</span>
          <div>
            <span className="text-slate-400 mr-1">Saldo Atual:</span>
            <span className={`font-bold ${periodStats.finalEquity >= cap ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(periodStats.finalEquity)}
            </span>
          </div>
          <span className="text-slate-600">•</span>
          <div>
            <span className="text-slate-400 mr-1">Resultado:</span>
            <span className={`font-semibold ${periodStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {periodStats.net >= 0 ? `+${formatBRL(periodStats.net)}` : formatBRL(periodStats.net)}
              {' '}({periodStats.net >= 0 ? `+${periodStats.returnPct}%` : `${periodStats.returnPct}%`})
            </span>
          </div>
        </div>
      </div>

      {/* Quick Capital Edit Inline Drawer */}
      {isEditingCapital && (
        <form onSubmit={handleSaveCapital} className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ajustar Capital Inicial:</span>
          </span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-[11px]">
              R$
            </span>
            <input
              type="number"
              min="0"
              step="50"
              value={tempCapitalInput}
              onChange={(e) => setTempCapitalInput(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs w-28 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Check className="h-3 w-3" />
            <span>Salvar</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditingCapital(false)}
            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-1 ml-auto">
            {[1000, 2000, 5000, 10000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setTempCapitalInput(String(val));
                  onUpdateInitialCapital?.(val);
                  setIsEditingCapital(false);
                }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-mono text-[10px] cursor-pointer"
              >
                {formatBRL(val)}
              </button>
            ))}
          </div>
        </form>
      )}

      {/* SVG Canvas or Not Enough Data Notice */}
      {sortedTrades.length < 2 ? (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/40 space-y-2">
          <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">
            Poucos trades registrados em {selectedYear} para traçar a curva de capital
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            São necessários pelo menos 2 trades neste ano para calcular a evolução gráfica.
          </p>
          <button
            type="button"
            onClick={() => setSelectedYear('ALL')}
            className="mt-2 px-3 py-1 text-xs rounded bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition-colors"
          >
            Ver Todos os Anos
          </button>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 sm:h-56 overflow-visible select-none"
          >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? '#10b981' : '#f43f5e'}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={isPositive ? '#10b981' : '#f43f5e'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          {/* Baseline reference (Initial Capital in equity mode, or 0 in profit mode) */}
          {baselineY >= paddingY && baselineY <= height - paddingY && viewMode !== 'winrate' && (
            <g>
              <line
                x1={paddingX}
                y1={baselineY}
                x2={width - paddingX}
                y2={baselineY}
                stroke="#475569"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <text
                x={width - paddingX}
                y={baselineY - 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
              >
                {viewMode === 'equity' ? `Capital Inicial: ${formatBRL(cap)}` : '0 R$ (Breakeven)'}
              </text>
            </g>
          )}

          {/* Area fill */}
          <path d={areaD} fill="url(#equityGradient)" />

          {/* Equity Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isPositive ? '#10b981' : '#f43f5e'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Trade point dots & hover triggers */}
          {dataPoints.map((p, idx) => {
            const cx = getX(idx);
            const plotVal = viewMode === 'equity' 
              ? p.totalEquity 
              : viewMode === 'profit' 
              ? p.netProfit 
              : p.cumulativeWinRate;
            const cy = getY(plotVal);
            const isHovered = hoverIndex === idx;

            return (
              <g key={idx}>
                {idx > 0 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 2.5}
                    className="transition-all"
                    fill={
                      p.result === 'GAIN'
                        ? '#10b981'
                        : p.result === 'LOSS'
                        ? '#ef4444'
                        : '#f59e0b'
                    }
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}
                {/* Hit target */}
                <rect
                  x={cx - 10}
                  y={0}
                  width={20}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}

          {/* Active hover vertical cursor */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingY}
              x2={getX(hoverIndex)}
              y2={height - paddingY}
              stroke="#64748b"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoverIndex !== null && hoverIndex > 0 && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none rounded-lg border border-slate-700 bg-slate-950/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-sm min-w-56"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1 mb-1 font-mono text-[11px]">
              <span className="text-slate-300 font-semibold">
                Trade #{hoveredPoint.index} ({hoveredPoint.asset})
              </span>
              <span className="text-slate-400">
                {hoveredPoint.date} {hoveredPoint.time}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="text-slate-400">Setup: {hoveredPoint.setup}</span>
              <span
                className={`font-bold ${
                  hoveredPoint.result === 'GAIN'
                    ? 'text-emerald-400'
                    : hoveredPoint.result === 'LOSS'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {hoveredPoint.result} ({hoveredPoint.points > 0 ? `+${hoveredPoint.points}` : hoveredPoint.points} pts)
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs font-mono mt-0.5">
              <span className="text-slate-400">Resultado do Trade:</span>
              <span className={`font-semibold ${hoveredPoint.tradeVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredPoint.tradeVal >= 0 ? `+${formatBRL(hoveredPoint.tradeVal)}` : formatBRL(hoveredPoint.tradeVal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t border-slate-800/80 font-mono text-xs">
              <span className="text-slate-300 font-medium">Saldo Total da Conta:</span>
              <span className="font-bold text-white">
                {formatBRL(hoveredPoint.totalEquity)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 font-mono text-[11px]">
              <span className="text-slate-400">Lucro Líquido Acum.:</span>
              <span className={`font-semibold ${hoveredPoint.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredPoint.netProfit >= 0 ? `+${formatBRL(hoveredPoint.netProfit)}` : formatBRL(hoveredPoint.netProfit)}
                {cap > 0 && ` (${((hoveredPoint.netProfit / cap) * 100).toFixed(1)}%)`}
              </span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Axis legend */}
      <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/50">
        <span>
          Início: {viewMode === 'equity' ? formatBRL(cap) : viewMode === 'profit' ? '0 R$' : '0%'}
        </span>
        <span>
          Saldo Final:{' '}
          <strong className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {viewMode === 'equity' ? formatBRL(periodStats.finalEquity) : viewMode === 'profit' ? formatBRL(periodStats.net) : `${currentTotal}%`}
          </strong>
        </span>
      </div>
    </div>
  );
};
