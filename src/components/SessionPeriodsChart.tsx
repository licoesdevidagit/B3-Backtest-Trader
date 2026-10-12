import React, { useState } from 'react';
import { SessionPeriodStat } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  Clock, 
  TrendingUp, 
  Sun, 
  SunMedium, 
  Sunset, 
  Award, 
  CheckCircle2, 
  XCircle,
  Percent,
  ListFilter,
  Flame,
  HelpCircle
} from 'lucide-react';

interface SessionPeriodsChartProps {
  periods: SessionPeriodStat[];
  onFilterByPeriod?: (periodKey: string) => void;
}

export const SessionPeriodsChart: React.FC<SessionPeriodsChartProps> = ({
  periods,
  onFilterByPeriod,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Filter periods with at least 1 trade or valid time
  const validPeriods = periods.filter((p) => p.totalTrades > 0 || p.periodKey !== 'sem_horario');

  if (validPeriods.length === 0) {
    return null;
  }

  // Find best performing period (by profit, then by winRate)
  const bestPeriod = [...validPeriods]
    .filter((p) => p.totalTrades > 0)
    .sort((a, b) => b.netProfit - a.netProfit || b.winRate - a.winRate)[0];

  // Highest absolute profit for bar scaling
  const maxAbsProfit = Math.max(
    ...validPeriods.map((p) => Math.abs(p.netProfit)),
    100
  );

  // SVG Chart dimensions
  const chartWidth = 600;
  const chartHeight = 195;
  const paddingX = 40;
  const zeroY = 110;
  const maxBarHeight = 55;
  const availableWidth = chartWidth - paddingX * 2;
  const barSpacing = availableWidth / validPeriods.length;
  const barWidth = Math.min(52, barSpacing * 0.55);

  const getPeriodIcon = (key: string) => {
    switch (key) {
      case 'inicio':
        return <Sun className="h-4 w-4 text-amber-400" />;
      case 'meio':
        return <SunMedium className="h-4 w-4 text-sky-400" />;
      case 'fim':
        return <Sunset className="h-4 w-4 text-indigo-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Desempenho por Período do Dia (Melhores Horários)</span>
            </h3>
            {bestPeriod && bestPeriod.netProfit > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                <Award className="h-3 w-3 text-emerald-400" />
                Melhor Horário: {bestPeriod.shortName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Analise a taxa de acerto e o retorno financeiro agrupados por fase do pregão (Início, Meio e Fim da sessão).
          </p>
        </div>

        {bestPeriod && (
          <div className="text-left sm:text-right font-mono text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Horário Mais Lucrativo
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              {bestPeriod.name} ({bestPeriod.timeRange})
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart Comparison: Net Profit & Win Rate */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            Resultado Financeiro (Barras) e Taxa de Acerto (Percentual)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Escala máxima: ±{formatBRL(maxAbsProfit)}
          </span>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40 sm:h-48 overflow-visible select-none"
          >
            {/* Zero Axis Line */}
            <line
              x1={paddingX - 10}
              y1={zeroY}
              x2={chartWidth - paddingX + 10}
              y2={zeroY}
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Zero Label */}
            <text
              x={paddingX - 12}
              y={zeroY + 3}
              textAnchor="end"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              R$ 0
            </text>

            {/* Period Bars & Labels */}
            {validPeriods.map((p, idx) => {
              const centerX = paddingX + idx * barSpacing + barSpacing / 2;
              const hasTrades = p.totalTrades > 0;
              const barHeight = hasTrades
                ? Math.max(4, (Math.abs(p.netProfit) / maxAbsProfit) * maxBarHeight)
                : 2;
              const isProfit = p.netProfit >= 0;
              const barY = isProfit ? zeroY - barHeight : zeroY;
              const isHovered = hoveredKey === p.periodKey;
              const isBest = bestPeriod?.periodKey === p.periodKey && p.netProfit > 0;

              return (
                <g
                  key={p.periodKey}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredKey(p.periodKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  {/* Background highlight rect */}
                  <rect
                    x={centerX - barSpacing / 2 + 3}
                    y={10}
                    width={barSpacing - 6}
                    height={chartHeight - 20}
                    fill={isHovered ? '#1e293b' : 'transparent'}
                    rx="6"
                    className="transition-colors"
                  />

                  {/* Best period golden/emerald halo highlight */}
                  {isBest && (
                    <rect
                      x={centerX - barWidth / 2 - 3}
                      y={barY - 3}
                      width={barWidth + 6}
                      height={barHeight + 6}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      rx="6"
                    />
                  )}

                  {/* Financial Bar */}
                  <rect
                    x={centerX - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={hasTrades ? (isProfit ? '#10b981' : '#f43f5e') : '#475569'}
                    rx="4"
                    className="transition-all duration-200"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Profit Value on top/bottom of bar */}
                  <text
                    x={centerX}
                    y={isProfit ? barY - 7 : barY + barHeight + 13}
                    textAnchor="middle"
                    fill={hasTrades ? (isProfit ? '#34d399' : '#fb7185') : '#94a3b8'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hasTrades ? formatBRL(p.netProfit) : 'Sem trades'}
                  </text>

                  {/* Win rate indicator badge on top zone with pill background */}
                  <rect
                    x={centerX - 24}
                    y={10}
                    width={48}
                    height={16}
                    rx={4}
                    fill="#020617"
                    stroke={hasTrades ? (p.winRate >= 50 ? '#0284c7' : '#e11d48') : '#334155'}
                    strokeWidth="1"
                    className="transition-all"
                  />
                  <text
                    x={centerX}
                    y={22}
                    textAnchor="middle"
                    fill={hasTrades ? '#38bdf8' : '#64748b'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hasTrades ? `${p.winRate.toFixed(1)}%` : '-'}
                  </text>

                  {/* Period label below */}
                  <text
                    x={centerX}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {p.shortName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" />
            Lucro Líquido (R$)
            <span className="inline-block w-2.5 h-2.5 rounded bg-rose-500 ml-2" />
            Prejuízo Líquido (R$)
          </span>
          <span className="text-sky-400">Percentuais no topo = Taxa de Acerto (%)</span>
        </div>
      </div>

      {/* Period Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {validPeriods.map((p) => {
          const isBest = bestPeriod?.periodKey === p.periodKey && p.netProfit > 0;
          const isProfit = p.netProfit >= 0;
          const hasTrades = p.totalTrades > 0;

          return (
            <div
              key={p.periodKey}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isBest
                  ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-md ring-1 ring-emerald-500/20'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPeriodIcon(p.periodKey)}
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {p.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {p.timeRange}
                      </span>
                    </div>
                  </div>

                  {isBest && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      ★ TOP HORÁRIO
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {p.description}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 font-mono">
                {/* Win Rate */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Taxa de Acerto:</span>
                    <span
                      className={`font-bold ${
                        !hasTrades
                          ? 'text-slate-500'
                          : p.winRate >= 50
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {hasTrades ? `${p.winRate.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${hasTrades ? p.winRate : 0}%` }}
                      className={`h-full ${
                        p.winRate >= 60
                          ? 'bg-emerald-500'
                          : p.winRate >= 45
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Net Profit & Trades */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Resultado Líquido:</span>
                  <span
                    className={`font-bold text-sm ${
                      !hasTrades
                        ? 'text-slate-500'
                        : isProfit
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {hasTrades ? formatBRL(p.netProfit) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Operações: <strong className="text-slate-200">{p.totalTrades}</strong> ({p.wins}G / {p.losses}L)</span>
                  <span>Fator Lucro: <strong className="text-slate-200">{p.profitFactor > 0 ? p.profitFactor.toFixed(2) : '-'}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
