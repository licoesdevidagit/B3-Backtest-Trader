import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { formatBRL, formatDateBR } from '../utils/calculations';
import { 
  calculateDrawdownAnalysis, 
  DEFAULT_INITIAL_CAPITAL, 
  DrawdownPoint 
} from '../utils/drawdownCalculations';
import { 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  SlidersHorizontal, 
  HelpCircle, 
  DollarSign, 
  Percent, 
  Clock, 
  Zap, 
  ShieldCheck,
  Activity,
  ArrowDownRight,
  Flame,
  Award
} from 'lucide-react';

interface MaxDrawdownWidgetProps {
  trades: Trade[];
  initialCapital?: number;
  onUpdateInitialCapital?: (capital: number) => void;
}

const STORAGE_KEY_INITIAL_CAPITAL = 'b3_drawdown_initial_capital_v1';

export const MaxDrawdownWidget: React.FC<MaxDrawdownWidgetProps> = ({ 
  trades,
  initialCapital: propInitialCapital,
  onUpdateInitialCapital,
}) => {
  // Configurable base capital for % drawdown calculations
  const [internalCapital, setInternalCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INITIAL_CAPITAL);
      if (saved) {
        const parsed = parseFloat(saved);
        if (parsed > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_INITIAL_CAPITAL;
  });

  const initialCapital = propInitialCapital ?? internalCapital;

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [tempCapitalInput, setTempCapitalInput] = useState<string>(String(initialCapital));
  const [viewUnit, setViewUnit] = useState<'financial' | 'percent'>('financial');
  const [hoveredPoint, setHoveredPoint] = useState<DrawdownPoint | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Compute full drawdown analysis
  const analysis = useMemo(() => {
    return calculateDrawdownAnalysis(trades, initialCapital);
  }, [trades, initialCapital]);

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(500, parseFloat(tempCapitalInput.replace(',', '.')) || DEFAULT_INITIAL_CAPITAL);
    setInternalCapital(val);
    onUpdateInitialCapital?.(val);
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_CAPITAL, String(val));
    } catch (e) {
      // ignore
    }
    setIsConfigOpen(false);
  };

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-white">Max Drawdown & Gestão de Risco</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Registre operações para calcular o rebaixamento máximo histórico (queda topo-ao-fundo) e determinar o capital mínimo seguro para operar.
        </p>
      </div>
    );
  }

  // SVG Chart rendering dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCount = analysis.points.length;
  // Maximum drawdown value for Y scaling
  const maxScaleVal = Math.max(
    viewUnit === 'financial' ? analysis.maxDrawdownFinancial : analysis.maxDrawdownPercent,
    viewUnit === 'financial' ? 100 : 5
  );

  const getCoordX = (index: number) => {
    if (pointsCount <= 1) return paddingX;
    return paddingX + (index / (pointsCount - 1)) * plotWidth;
  };

  const getCoordY = (value: number) => {
    // 0 drawdown is at paddingTop (top water line)
    // max drawdown is at paddingTop + plotHeight (bottom)
    const normalized = Math.min(1, Math.max(0, value / maxScaleVal));
    return paddingTop + normalized * plotHeight;
  };

  // Build SVG path for underwater chart
  let underwaterPath = '';
  let linePath = '';

  if (pointsCount > 0) {
    // Start at top-left
    underwaterPath = `M ${getCoordX(0)},${paddingTop}`;
    linePath = `M ${getCoordX(0)},${getCoordY(viewUnit === 'financial' ? analysis.points[0].drawdownFinancial : analysis.points[0].drawdownPercent)}`;

    analysis.points.forEach((p, idx) => {
      const x = getCoordX(idx);
      const val = viewUnit === 'financial' ? p.drawdownFinancial : p.drawdownPercent;
      const y = getCoordY(val);

      underwaterPath += ` L ${x},${y}`;
      if (idx > 0) {
        linePath += ` L ${x},${y}`;
      }
    });

    // Close path back to the waterline
    const lastX = getCoordX(pointsCount - 1);
    underwaterPath += ` L ${lastX},${paddingTop} Z`;
  }

  // Find the point where max drawdown occurred
  const maxDrawdownPoint = analysis.points.reduce((maxP, p) => {
    return p.drawdownFinancial > (maxP?.drawdownFinancial || 0) ? p : maxP;
  }, analysis.points[0]);

  const maxPointX = maxDrawdownPoint ? getCoordX(maxDrawdownPoint.index) : paddingX;
  const maxPointY = maxDrawdownPoint ? getCoordY(viewUnit === 'financial' ? maxDrawdownPoint.drawdownFinancial : maxDrawdownPoint.drawdownPercent) : paddingTop;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Max Drawdown & Gestão de Risco
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  analysis.riskRating === 'BAIXO'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : analysis.riskRating === 'MODERADO'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : analysis.riskRating === 'ELEVADO'
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                Risco {analysis.riskRating}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Maior perda acumulada histórica do topo ao fundo (Peak-to-Trough) e curva de rebaixamento da conta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Unit Toggle: R$ vs % */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewUnit('financial')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewUnit === 'financial'
                  ? 'bg-slate-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reais (R$)
            </button>
            <button
              type="button"
              onClick={() => setViewUnit('percent')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewUnit === 'percent'
                  ? 'bg-slate-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Percentual (%)
            </button>
          </div>

          {/* Config Capital Button */}
          <button
            type="button"
            onClick={() => {
              setTempCapitalInput(String(initialCapital));
              setIsConfigOpen((prev) => !prev);
            }}
            title="Ajustar capital inicial da conta para cálculo do drawdown relativo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Capital:</span>
            <span className="font-mono text-white">{formatBRL(initialCapital)}</span>
          </button>

          {/* Guide / Info button */}
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Entenda como funciona o Max Drawdown e a gestão de risco"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Capital Config Drawer Form (when opened) */}
      {isConfigOpen && (
        <form
          onSubmit={handleSaveCapital}
          className="rounded-xl border border-rose-500/30 bg-slate-950 p-3.5 sm:p-4 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-rose-400" />
              <span>Definir Saldo / Capital Inicial Base para Cálculo de Risco</span>
            </span>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={tempCapitalInput}
                onChange={(e) => setTempCapitalInput(e.target.value)}
                placeholder="Ex: 5000.00"
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-mono text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            >
              Salvar Capital
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Usado para calcular a porcentagem de rebaixamento da conta e dimensionar o colchão de segurança contra sequências de loss.
          </p>
        </form>
      )}

      {/* 4 Main Risk KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* KPI 1: Max Drawdown Histórico */}
        <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-slate-900 to-rose-950/20 p-4 shadow-md space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              Max Drawdown (Pior Queda)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              -{analysis.maxDrawdownPercent.toFixed(1)}%
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 tracking-tight">
            -{formatBRL(analysis.maxDrawdownFinancial)}
          </div>

          <div className="text-[11px] text-slate-400 pt-0.5 space-y-0.5">
            <div>
              Topo: <strong className="text-slate-300 font-mono">{formatDateBR(analysis.maxDrawdownPeakDate)}</strong>
            </div>
            <div>
              Fundo: <strong className="text-rose-300 font-mono">{formatDateBR(analysis.maxDrawdownTroughDate)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 2: Drawdown Atual (Estado Presente) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              Drawdown Atual da Conta
            </span>
            {analysis.isAtAllTimeHigh ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> No Topo
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                -{analysis.currentDrawdownPercent.toFixed(1)}%
              </span>
            )}
          </div>

          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
              analysis.isAtAllTimeHigh ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {analysis.isAtAllTimeHigh ? 'R$ 0,00' : `-${formatBRL(analysis.currentDrawdownFinancial)}`}
          </div>

          <div className="text-[11px] text-slate-400 pt-0.5">
            {analysis.isAtAllTimeHigh ? (
              <span className="text-emerald-400 font-medium">
                Sua conta está na máxima histórica de capital (High Water Mark).
              </span>
            ) : (
              <span>
                Faltam <strong className="text-white font-mono">{formatBRL(analysis.currentDrawdownFinancial)}</strong> para superar a máxima anterior.
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Fator de Recuperação (Recovery Factor) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              Fator de Recuperação
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Lucro ÷ Max DD</span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {analysis.recoveryFactor.toFixed(2)}x
          </div>

          <div className="text-[11px] text-slate-400 pt-0.5">
            {analysis.recoveryFactor >= 3 ? (
              <span className="text-emerald-400 font-medium">Excelente (Lucro supera o risco em 3x+)</span>
            ) : analysis.recoveryFactor >= 1.5 ? (
              <span className="text-slate-300">Saudável (Boa margem sobre rebaixamento)</span>
            ) : (
              <span className="text-amber-400">Atenção (Rebaixamento elevado para o lucro atual)</span>
            )}
          </div>
        </div>

        {/* KPI 4: Capital Mínimo Recomendado */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              Capital Mínimo Sugerido
            </span>
            <span className="text-[10px] font-mono text-sky-400/80">Margem Segura</span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {formatBRL(analysis.recommendedCapital)}
          </div>

          <div className="text-[11px] text-slate-400 pt-0.5">
            <span>
              Baseado em <strong>2.5x o Max Drawdown</strong> para suportar sequências de perdas sem risco de quebra da conta.
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Underwater Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span>Curva Underwater (Profundidade do Drawdown ao Longo do Tempo)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              ({pointsCount - 1} trades registrados)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
              <span>Topo D'Água (0 R$)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500 inline-block" />
              <span>Zona de Rebaixamento</span>
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 sm:h-52 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="underwaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
                <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guideline lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + pct * plotHeight;
              const val = pct * maxScaleVal;
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke={i === 0 ? '#10b981' : '#1e293b'}
                    strokeWidth={i === 0 ? 1.5 : 1}
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill={i === 0 ? '#10b981' : '#64748b'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {viewUnit === 'financial' ? `-${formatBRL(val)}` : `-${val.toFixed(1)}%`}
                  </text>
                </g>
              );
            })}

            {/* Underwater Area */}
            {underwaterPath && (
              <path
                d={underwaterPath}
                fill="url(#underwaterGrad)"
                className="transition-all duration-300"
              />
            )}

            {/* Drawdown Curve Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Marker on the Worst Max Drawdown Point */}
            {analysis.maxDrawdownFinancial > 0 && maxDrawdownPoint && (
              <g>
                <circle
                  cx={maxPointX}
                  cy={maxPointY}
                  r="6"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={maxPointX}
                  cy={maxPointY}
                  r="12"
                  fill="#f43f5e"
                  fillOpacity="0.2"
                />
                {/* Max DD Label tag */}
                <g transform={`translate(${Math.min(svgWidth - 110, Math.max(paddingX, maxPointX - 50))}, ${Math.max(12, maxPointY - 26)})`}>
                  <rect
                    width="100"
                    height="18"
                    rx="4"
                    fill="#881337"
                    stroke="#f43f5e"
                    strokeWidth="1"
                  />
                  <text
                    x="50"
                    y="12"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Max DD: -{viewUnit === 'financial' ? formatBRL(analysis.maxDrawdownFinancial) : `${analysis.maxDrawdownPercent.toFixed(1)}%`}
                  </text>
                </g>
              </g>
            )}

            {/* Interactive hover line and tracker */}
            {hoveredPoint && (
              <g>
                <line
                  x1={getCoordX(hoveredPoint.index)}
                  y1={paddingTop}
                  x2={getCoordX(hoveredPoint.index)}
                  y2={paddingTop + plotHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getCoordX(hoveredPoint.index)}
                  cy={getCoordY(viewUnit === 'financial' ? hoveredPoint.drawdownFinancial : hoveredPoint.drawdownPercent)}
                  r="4.5"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* Transparent hover capture rects */}
            {analysis.points.map((p, idx) => {
              const x = getCoordX(idx);
              const step = plotWidth / Math.max(1, pointsCount - 1);
              return (
                <rect
                  key={idx}
                  x={x - step / 2}
                  y={paddingTop}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>
        </div>

        {/* Hover info tooltip bar - Fixed min-height so chart and bar never jump */}
        <div className="min-h-[42px] flex items-center">
          {hoveredPoint ? (
            <div className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Trade #{hoveredPoint.index}</span>
                <span className="text-slate-400 font-mono">{formatDateBR(hoveredPoint.date)}</span>
                {hoveredPoint.tradeValue !== 0 && (
                  <span
                    className={`font-mono font-bold ${
                      hoveredPoint.tradeValue > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {hoveredPoint.tradeValue > 0 ? `+${formatBRL(hoveredPoint.tradeValue)}` : formatBRL(hoveredPoint.tradeValue)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-400">
                  Patrimônio: <strong className="text-white">{formatBRL(hoveredPoint.cumulativeEquity)}</strong>
                </span>
                <span className="text-rose-400">
                  Rebaixamento: <strong>-{formatBRL(hoveredPoint.drawdownFinancial)} (-{hoveredPoint.drawdownPercent.toFixed(1)}%)</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full text-[11px] text-slate-500 font-mono text-center py-2">
              Passe o mouse ou toque no gráfico para inspecionar cada ponto de rebaixamento histórico.
            </div>
          )}
        </div>
      </div>

      {/* Extra Institutional Details Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold">
            Duração Máxima em Drawdown:
          </span>
          <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>{analysis.longestDrawdownTrades} trades</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Maior número de trades seguidos sem bater nova máxima histórica.
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold">
            Drawdown Médio por Recuo:
          </span>
          <div className="text-base font-bold text-rose-300 font-mono flex items-center gap-1.5">
            <ArrowDownRight className="h-4 w-4 text-rose-400" />
            <span>-{formatBRL(analysis.averageDrawdownFinancial)}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Média de oscilação negativa esperada durante os ciclos de perda.
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold">
            Status da Recuperação:
          </span>
          <div className="text-base font-bold font-mono flex items-center gap-1.5">
            {analysis.isMaxDrawdownRecovered ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Recuperado
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Em Andamento
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {analysis.isMaxDrawdownRecovered
              ? `Superado em ${formatDateBR(analysis.maxDrawdownRecoveryDate || '')} (${analysis.maxDrawdownTradeCount} trades).`
              : `Pior recuo durando ${analysis.maxDrawdownTradeCount} trades.`}
          </span>
        </div>
      </div>

      {/* Info Modal / Drawer explaining Drawdown */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-2xl border border-rose-500/40 bg-slate-900 shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Guia de Max Drawdown & Risco</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white block font-sans">O que é o Max Drawdown?</strong>
                <p className="text-slate-400">
                  É a maior queda percentual ou financeira entre o topo mais alto de capital (Peak) e o fundo mais baixo subsequente (Trough), antes de uma nova máxima ser atingida. Ele mede a "pior dor" histórica que sua estratégia já provocou.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white block font-sans">Por que ele é crucial no Day Trade B3?</strong>
                <p className="text-slate-400">
                  Operar mini contratos (WIN e WDO) exige saber que sequências de loss acontecem mesmo com taxas de acerto altas (60-70%). Saber que seu Max Drawdown é de R$ 1.500 significa que você nunca deve operar essa estratégia com apenas R$ 1.500 na corretora — você quebraria no primeiro recuo normal.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white block font-sans">Fator de Recuperação (Recovery Factor):</strong>
                <p className="text-slate-400">
                  Calculado como <strong className="text-emerald-400 font-mono">Lucro Líquido ÷ Max Drawdown</strong>. Valores acima de <strong>2.0x a 3.0x</strong> indicam que a estratégia compensa com folga o risco assumido.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white block font-sans">Regra de Ouro do Capital:</strong>
                <p className="text-slate-400">
                  Recomenda-se ter pelo menos <strong className="text-sky-300 font-mono">2.5x a 3x o Max Drawdown</strong> como saldo na corretora para cada 1 contrato operado, garantindo sobrevivência estatística a longo prazo.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
