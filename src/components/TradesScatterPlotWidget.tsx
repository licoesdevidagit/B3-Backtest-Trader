import React, { useState, useMemo } from 'react';
import { AssetType, Setup, Trade } from '../types';
import { formatBRL, formatPoints, formatDateBR, calculateTradeFinancial } from '../utils/calculations';
import { 
  Sparkles, 
  HelpCircle, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  Scale, 
  Info, 
  X,
  Target,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  Eye,
  Award
} from 'lucide-react';

interface TradesScatterPlotWidgetProps {
  trades: Trade[];
  setups: Setup[];
  onFilterBySetup?: (setupId: string) => void;
  onOpenNewTrade?: () => void;
}

interface ScatterPoint {
  id: string;
  trade: Trade;
  setupName: string;
  setupColor: string;
  setupId: string;
  asset: AssetType;
  contracts: number;
  date: string;
  time?: string;
  result: 'GAIN' | 'LOSS' | 'BREAKEVEN';
  notes?: string;
  // Valores numéricos
  riskFinancial: number; // Eixo X em R$ (Risco assumido / perda)
  gainFinancial: number; // Eixo Y em R$ (Ganho realizado / retorno)
  riskPoints: number; // Eixo X em pontos
  gainPoints: number; // Eixo Y em pontos
  ratio: number; // gain / risk
  isPositiveAsymmetry: boolean; // ratio >= 1.0
  ratioLabel: string; // Ex: "1 : 2.4"
}

interface SetupAggregatedPoint {
  setupId: string;
  setupName: string;
  setupColor: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgGainFinancial: number;
  avgLossFinancial: number;
  avgGainPoints: number;
  avgLossPoints: number;
  ratio: number;
  isPositiveAsymmetry: boolean;
  ratioLabel: string;
}

export const TradesScatterPlotWidget: React.FC<TradesScatterPlotWidgetProps> = ({
  trades,
  setups,
  onFilterBySetup,
}) => {
  // Configurações do widget
  const [viewMode, setViewMode] = useState<'individual' | 'aggregated'>('individual');
  const [unitMode, setUnitMode] = useState<'financial' | 'points'>('financial');
  const [assetFilter, setAssetFilter] = useState<'ALL' | AssetType>('ALL');
  const [selectedSetupId, setSelectedSetupId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<'ALL' | string>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'GAIN' | 'LOSS'>('ALL');
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Mapeamento de setups
  const setupMap = useMemo(() => {
    const map = new Map<string, Setup>();
    setups.forEach((s) => map.set(s.id, s));
    return map;
  }, [setups]);

  // Anos disponíveis
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

  // Filtragem inicial dos trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (assetFilter !== 'ALL' && t.asset !== assetFilter) return false;
      if (selectedSetupId !== 'ALL' && t.setupId !== selectedSetupId) return false;
      if (selectedYear !== 'ALL' && !t.date?.startsWith(selectedYear)) return false;
      if (resultFilter !== 'ALL' && t.result !== resultFilter) return false;
      return true;
    });
  }, [trades, assetFilter, selectedSetupId, selectedYear, resultFilter]);

  // Geração dos pontos de dispersão individuais
  const scatterPoints = useMemo<ScatterPoint[]>(() => {
    return filteredTrades.map((t) => {
      const s = setupMap.get(t.setupId);
      const setupName = s?.name || t.setupName || 'Setup Padrão';
      const setupColor = s?.color || '#3b82f6';

      // Parâmetros do setup
      const defaultStopPts = s?.defaultLossPts || (t.asset === 'WIN' ? 150 : 6);
      const defaultTargetPts = s?.defaultGainPts || (t.asset === 'WIN' ? 250 : 10);

      let riskFin = 0;
      let gainFin = 0;
      let riskPts = 0;
      let gainPts = 0;

      if (t.result === 'GAIN') {
        // Trade vencedor: ganho realizado vs risco que foi assumido
        gainFin = Math.max(0, t.financialValue);
        gainPts = Math.max(0, t.points);

        riskPts = defaultStopPts;
        riskFin = Math.abs(calculateTradeFinancial(t.asset, defaultStopPts, t.contracts));
      } else if (t.result === 'LOSS') {
        // Trade perdedor: perda realizada vs alvo que se buscava
        riskFin = Math.abs(t.financialValue);
        riskPts = Math.abs(t.points);

        gainPts = defaultTargetPts;
        gainFin = Math.abs(calculateTradeFinancial(t.asset, defaultTargetPts, t.contracts));
      } else {
        // Breakeven
        riskPts = defaultStopPts;
        riskFin = Math.abs(calculateTradeFinancial(t.asset, defaultStopPts, t.contracts));
        gainPts = defaultTargetPts;
        gainFin = 0;
      }

      // Evitar divisão por zero
      const safeRisk = riskFin > 0 ? riskFin : 1;
      const ratio = Number((gainFin / safeRisk).toFixed(2));
      const isPositiveAsymmetry = ratio >= 1.0;
      const ratioLabel = `1 : ${ratio.toFixed(1)}`;

      return {
        id: t.id,
        trade: t,
        setupName,
        setupColor,
        setupId: t.setupId,
        asset: t.asset,
        contracts: t.contracts,
        date: t.date,
        time: t.time,
        result: t.result,
        notes: t.notes,
        riskFinancial: riskFin,
        gainFinancial: gainFin,
        riskPoints: riskPts,
        gainPoints: gainPts,
        ratio,
        isPositiveAsymmetry,
        ratioLabel,
      };
    });
  }, [filteredTrades, setupMap]);

  // Geração dos pontos consolidados por setup
  const aggregatedPoints = useMemo<SetupAggregatedPoint[]>(() => {
    const map = new Map<string, {
      setup: Setup | undefined;
      trades: Trade[];
    }>();

    filteredTrades.forEach((t) => {
      let group = map.get(t.setupId);
      if (!group) {
        group = { setup: setupMap.get(t.setupId), trades: [] };
        map.set(t.setupId, group);
      }
      group.trades.push(t);
    });

    const list: SetupAggregatedPoint[] = [];

    map.forEach((data, sId) => {
      const s = data.setup;
      const sTrades = data.trades;
      const totalTrades = sTrades.length;
      if (totalTrades === 0) return;

      const wins = sTrades.filter((t) => t.result === 'GAIN');
      const losses = sTrades.filter((t) => t.result === 'LOSS');

      const sumGainFin = wins.reduce((acc, t) => acc + t.financialValue, 0);
      const sumLossFin = losses.reduce((acc, t) => acc + Math.abs(t.financialValue), 0);
      const sumGainPts = wins.reduce((acc, t) => acc + Math.max(0, t.points), 0);
      const sumLossPts = losses.reduce((acc, t) => acc + Math.abs(Math.min(0, t.points)), 0);

      const defaultStop = s?.defaultLossPts || (sTrades[0]?.asset === 'WIN' ? 150 : 6);
      const defaultTarget = s?.defaultGainPts || (sTrades[0]?.asset === 'WIN' ? 250 : 10);

      // Médias
      const avgGainFin = wins.length > 0 
        ? sumGainFin / wins.length 
        : calculateTradeFinancial(sTrades[0]?.asset || 'WIN', defaultTarget, 1);

      const avgLossFin = losses.length > 0 
        ? sumLossFin / losses.length 
        : calculateTradeFinancial(sTrades[0]?.asset || 'WIN', defaultStop, 1);

      const avgGainPts = wins.length > 0 ? sumGainPts / wins.length : defaultTarget;
      const avgLossPts = losses.length > 0 ? sumLossPts / losses.length : defaultStop;

      const safeLoss = avgLossFin > 0 ? avgLossFin : 1;
      const ratio = Number((avgGainFin / safeLoss).toFixed(2));
      const winRate = Number(((wins.length / totalTrades) * 100).toFixed(1));

      list.push({
        setupId: sId,
        setupName: s?.name || sTrades[0]?.setupName || 'Setup',
        setupColor: s?.color || '#3b82f6',
        totalTrades,
        wins: wins.length,
        losses: losses.length,
        winRate,
        avgGainFinancial: Number(avgGainFin.toFixed(2)),
        avgLossFinancial: Number(avgLossFin.toFixed(2)),
        avgGainPoints: Number(avgGainPts.toFixed(1)),
        avgLossPoints: Number(avgLossPts.toFixed(1)),
        ratio,
        isPositiveAsymmetry: ratio >= 1.0,
        ratioLabel: `1 : ${ratio.toFixed(1)}`,
      });
    });

    return list.sort((a, b) => b.ratio - a.ratio);
  }, [filteredTrades, setupMap]);

  // Estatísticas de assimetria dos trades exibidos
  const asymmetryStats = useMemo(() => {
    if (scatterPoints.length === 0) {
      return {
        total: 0,
        positiveCount: 0,
        positivePercent: 0,
        negativeCount: 0,
        negativePercent: 0,
        avgRatio: 0,
        bestTrade: null,
        bestSetup: null,
      };
    }

    const total = scatterPoints.length;
    const positiveCount = scatterPoints.filter((p) => p.isPositiveAsymmetry).length;
    const negativeCount = total - positiveCount;
    const positivePercent = Number(((positiveCount / total) * 100).toFixed(1));
    const negativePercent = Number(((negativeCount / total) * 100).toFixed(1));

    const sumRatio = scatterPoints.reduce((acc, p) => acc + p.ratio, 0);
    const avgRatio = Number((sumRatio / total).toFixed(2));

    const sortedByRatio = [...scatterPoints].sort((a, b) => b.ratio - a.ratio);
    const bestTrade = sortedByRatio[0] || null;

    const bestSetup = aggregatedPoints.length > 0 ? aggregatedPoints[0] : null;

    return {
      total,
      positiveCount,
      positivePercent,
      negativeCount,
      negativePercent,
      avgRatio,
      bestTrade,
      bestSetup,
    };
  }, [scatterPoints, aggregatedPoints]);

  // Limites do Gráfico SVG
  const chartBounds = useMemo(() => {
    if (viewMode === 'individual') {
      if (scatterPoints.length === 0) return { maxRisk: 500, maxGain: 500 };
      const risks = scatterPoints.map((p) => unitMode === 'financial' ? p.riskFinancial : p.riskPoints);
      const gains = scatterPoints.map((p) => unitMode === 'financial' ? p.gainFinancial : p.gainPoints);
      const maxR = Math.max(...risks, 50);
      const maxG = Math.max(...gains, 50);
      // Manter proporção amigável
      const limit = Math.max(maxR, maxG) * 1.15;
      return { maxRisk: limit, maxGain: limit };
    } else {
      if (aggregatedPoints.length === 0) return { maxRisk: 500, maxGain: 500 };
      const risks = aggregatedPoints.map((p) => unitMode === 'financial' ? p.avgLossFinancial : p.avgLossPoints);
      const gains = aggregatedPoints.map((p) => unitMode === 'financial' ? p.avgGainFinancial : p.avgGainPoints);
      const maxR = Math.max(...risks, 50);
      const maxG = Math.max(...gains, 50);
      const limit = Math.max(maxR, maxG) * 1.2;
      return { maxRisk: limit, maxGain: limit };
    }
  }, [viewMode, unitMode, scatterPoints, aggregatedPoints]);

  // Dimensões do Canvas SVG
  const svgWidth = 840;
  const svgHeight = 440;
  const padLeft = 70;
  const padRight = 40;
  const padBottom = 60;
  const padTop = 35;

  const chartInnerWidth = svgWidth - padLeft - padRight;
  const chartInnerHeight = svgHeight - padTop - padBottom;

  // Funções de conversão para coordenadas de pixels
  const getXCoord = (riskVal: number) => {
    const norm = Math.min(1, Math.max(0, riskVal / chartBounds.maxRisk));
    return padLeft + norm * chartInnerWidth;
  };

  const getYCoord = (gainVal: number) => {
    const norm = Math.min(1, Math.max(0, gainVal / chartBounds.maxGain));
    return padTop + chartInnerHeight - norm * chartInnerHeight;
  };

  // Coordenadas da linha diagonal 1:1 (Simetria Neutra)
  const line11 = {
    x1: getXCoord(0),
    y1: getYCoord(0),
    x2: getXCoord(chartBounds.maxRisk),
    y2: getYCoord(chartBounds.maxGain),
  };

  // Coordenadas da linha 2:1 (Ganho = 2 * Risco)
  const line21 = {
    x1: getXCoord(0),
    y1: getYCoord(0),
    x2: getXCoord(chartBounds.maxRisk / 2),
    y2: getYCoord(chartBounds.maxGain),
  };

  // Coordenadas da linha 3:1 (Ganho = 3 * Risco)
  const line31 = {
    x1: getXCoord(0),
    y1: getYCoord(0),
    x2: getXCoord(chartBounds.maxRisk / 3),
    y2: getYCoord(chartBounds.maxGain),
  };

  // Área sombreada verde da Zona Assimétrica Positiva (Y >= X)
  const positiveAreaPoints = `
    ${padLeft},${padTop + chartInnerHeight} 
    ${line11.x2},${line11.y2} 
    ${padLeft},${padTop}
  `;

  // Objeto do ponto atualmente com hover
  const hoveredPoint = useMemo(() => {
    if (!hoveredPointId) return null;
    if (viewMode === 'individual') {
      return scatterPoints.find((p) => p.id === hoveredPointId) || null;
    }
    return aggregatedPoints.find((p) => p.setupId === hoveredPointId) || null;
  }, [hoveredPointId, viewMode, scatterPoints, aggregatedPoints]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Gráfico de Dispersão: Ganho x Perda por Trade</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80">
              {scatterPoints.length} operações plotadas
            </span>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="Entenda como analisar a assimetria visualmente"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span className="underline decoration-dotted text-[11px]">Como interpretar a assimetria?</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeamento da relação de risco versus retorno de cada operação, colorido por setup para identificar assimetria positiva.
          </p>
        </div>

        {/* View mode & Unit Switchers */}
        <div className="flex items-center gap-2 flex-wrap font-sans text-xs">
          {/* Unit Toggle: R$ vs pts */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setUnitMode('financial')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                unitMode === 'financial'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Financeiro (R$)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('points')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                unitMode === 'points'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pontos (pts)
            </button>
          </div>

          {/* Individual Trades vs Aggregated Setups Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'individual'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Trade Individual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('aggregated')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'aggregated'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Médias por Setup
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Setup, Asset, Year, Result */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span>Filtros:</span>
          </span>

          {/* Setup selector */}
          <select
            value={selectedSetupId}
            onChange={(e) => setSelectedSetupId(e.target.value)}
            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Setups ({setups.length})</option>
            {setups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Asset selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setAssetFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                assetFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos Ativos
            </button>
            <button
              type="button"
              onClick={() => setAssetFilter('WIN')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                assetFilter === 'WIN' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mini Índice
            </button>
            <button
              type="button"
              onClick={() => setAssetFilter('WDO')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                assetFilter === 'WDO' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mini Dólar
            </button>
          </div>

          {/* Year selector */}
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Anos</option>
              {availableYears.map((y) => (
                <option key={y.year} value={y.year}>
                  Ano {y.year} ({y.count})
                </option>
              ))}
            </select>
          )}

          {/* Result Filter */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setResultFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                resultFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gains & Losses
            </button>
            <button
              type="button"
              onClick={() => setResultFilter('GAIN')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                resultFilter === 'GAIN' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Apenas Gains
            </button>
          </div>
        </div>

        {/* Reset filters if any active */}
        {(selectedSetupId !== 'ALL' || assetFilter !== 'ALL' || selectedYear !== 'ALL' || resultFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedSetupId('ALL');
              setAssetFilter('ALL');
              setSelectedYear('ALL');
              setResultFilter('ALL');
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer self-start md:self-auto font-medium"
          >
            <X className="h-3 w-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {/* KPI Cards: Resumo de Assimetria dos Dados Plotados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block font-sans">
            Relação R:R Média
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-baseline gap-1.5">
            <span>1 : {asymmetryStats.avgRatio.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">
            {asymmetryStats.avgRatio >= 1.5 ? 'Excelente Assimetria Convexa' : asymmetryStats.avgRatio >= 1.0 ? 'Assimetria Positiva' : 'Assimetria Inversa (Alerta)'}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block font-sans">
            Trades em Zona Positiva (&gt;1:1)
          </span>
          <div className="text-base sm:text-lg font-bold text-sky-400 flex items-baseline gap-1.5">
            <span>{asymmetryStats.positivePercent}%</span>
            <span className="text-xs text-slate-400 font-normal">({asymmetryStats.positiveCount}/{asymmetryStats.total})</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">
            Ganhos superam o risco assumido
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block font-sans">
            Setup Mais Assimétrico
          </span>
          <div className="text-xs sm:text-sm font-bold text-white truncate block" title={asymmetryStats.bestSetup?.setupName}>
            {asymmetryStats.bestSetup?.setupName || '-'}
          </div>
          <span className="text-[10px] text-emerald-400 block font-mono">
            {asymmetryStats.bestSetup ? `R:R ${asymmetryStats.bestSetup.ratioLabel} (${asymmetryStats.bestSetup.totalTrades} trades)` : '-'}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block font-sans">
            Maior Assimetria Individual
          </span>
          <div className="text-xs sm:text-sm font-bold text-purple-300 truncate block">
            {asymmetryStats.bestTrade ? `${asymmetryStats.bestTrade.setupName}` : '-'}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {asymmetryStats.bestTrade 
              ? `${asymmetryStats.bestTrade.ratioLabel} em ${formatDateBR(asymmetryStats.bestTrade.date)}` 
              : '-'}
          </span>
        </div>
      </div>

      {/* Main Scatter Canvas Area */}
      <div className="relative rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 sm:p-4 overflow-hidden shadow-inner">
        {/* Canvas Subtitle and Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-300">
              {viewMode === 'individual' ? 'Cada ponto representa 1 operação realizada' : 'Cada ponto representa a média consolidada de 1 setup'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-400 inline-block" />
              <span>Zona Positiva (Y &gt; X)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-emerald-400 inline-block" />
              <span>Linha 2:1</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400/80 stroke-dashed inline-block" />
              <span>Linha 1:1</span>
            </span>
          </div>
        </div>

        {scatterPoints.length === 0 ? (
          <div className="py-16 text-center space-y-2 border border-dashed border-slate-800 rounded-lg">
            <Scale className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">Nenhum trade encontrado para os filtros selecionados</p>
            <p className="text-xs text-slate-400">Altere o filtro de setup, ativo ou ano para visualizar a dispersão.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-[360px] sm:h-[420px] overflow-visible"
            >
              <defs>
                {/* Gradiente sutil da Zona Positiva */}
                <linearGradient id="positiveZoneGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                </linearGradient>

                {/* Filtro Glow para pontos destacados */}
                <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Polígono da Zona Assimétrica Positiva (Acima de 1:1) */}
              <polygon
                points={positiveAreaPoints}
                fill="url(#positiveZoneGrad)"
              />

              {/* Gridlines verticais e horizontais */}
              {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                const xVal = frac * chartBounds.maxRisk;
                const yVal = frac * chartBounds.maxGain;
                const xPos = getXCoord(xVal);
                const yPos = getYCoord(yVal);

                return (
                  <g key={`grid-${frac}`}>
                    {/* Linha vertical */}
                    <line
                      x1={xPos}
                      y1={padTop}
                      x2={xPos}
                      y2={padTop + chartInnerHeight}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                      opacity="0.4"
                    />
                    {/* Linha horizontal */}
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={padLeft + chartInnerWidth}
                      y2={yPos}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                      opacity="0.4"
                    />
                    {/* Rótulo Eixo X */}
                    <text
                      x={xPos}
                      y={padTop + chartInnerHeight + 18}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {unitMode === 'financial' ? `R$${Math.round(xVal)}` : `${Math.round(xVal)}pts`}
                    </text>
                    {/* Rótulo Eixo Y */}
                    <text
                      x={padLeft - 10}
                      y={yPos + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {unitMode === 'financial' ? `R$${Math.round(yVal)}` : `${Math.round(yVal)}pts`}
                    </text>
                  </g>
                );
              })}

              {/* Eixo X e Eixo Y principais */}
              <line
                x1={padLeft}
                y1={padTop + chartInnerHeight}
                x2={padLeft + chartInnerWidth}
                y2={padTop + chartInnerHeight}
                stroke="#475569"
                strokeWidth="1.5"
              />
              <line
                x1={padLeft}
                y1={padTop}
                x2={padLeft}
                y2={padTop + chartInnerHeight}
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Rótulo Central do Eixo X */}
              <text
                x={padLeft + chartInnerWidth / 2}
                y={padTop + chartInnerHeight + 42}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                Risco Assumido / Perda por Trade ({unitMode === 'financial' ? 'R$' : 'pontos'}) →
              </text>

              {/* Rótulo Central do Eixo Y */}
              <text
                x={-(padTop + chartInnerHeight / 2)}
                y={18}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                ← Ganho Realizado / Retorno por Trade ({unitMode === 'financial' ? 'R$' : 'pontos'})
              </text>

              {/* Linha Diagonal 1:1 (Simetria Neutra Y = X) */}
              <line
                x1={line11.x1}
                y1={line11.y1}
                x2={line11.x2}
                y2={line11.y2}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text
                x={line11.x2 - 10}
                y={line11.y2 - 6}
                textAnchor="end"
                fill="#f59e0b"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Linha 1:1 (Neutro)
              </text>

              {/* Linha Diagonal 2:1 (Ganho = 2 * Risco) */}
              {line21.x2 <= padLeft + chartInnerWidth && (
                <g>
                  <line
                    x1={line21.x1}
                    y1={line21.y1}
                    x2={line21.x2}
                    y2={line21.y2}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                  <text
                    x={line21.x2 + 4}
                    y={line21.y2 + 12}
                    fill="#34d399"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Linha 2:1 (Assimetria Ideal)
                  </text>
                </g>
              )}

              {/* Linha Diagonal 3:1 (Ganho = 3 * Risco) */}
              {line31.x2 <= padLeft + chartInnerWidth && (
                <g>
                  <line
                    x1={line31.x1}
                    y1={line31.y1}
                    x2={line31.x2}
                    y2={line31.y2}
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    opacity="0.7"
                  />
                  <text
                    x={line31.x2 + 4}
                    y={line31.y2 + 22}
                    fill="#22d3ee"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Linha 3:1
                  </text>
                </g>
              )}

              {/* Rótulo de Zona Superior */}
              <text
                x={padLeft + 15}
                y={padTop + 25}
                fill="#10b981"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                opacity="0.85"
              >
                ▲ ZONA DE ASSIMETRIA POSITIVA (Ganho &gt; Risco)
              </text>

              {/* Rótulo de Zona Inferior */}
              <text
                x={padLeft + chartInnerWidth - 10}
                y={padTop + chartInnerHeight - 12}
                textAnchor="end"
                fill="#f43f5e"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                opacity="0.75"
              >
                ▼ ZONA DE ASSIMETRIA INVERSA (Risco &gt; Ganho)
              </text>

              {/* Linhas de Projeção até os eixos para o ponto com hover */}
              {hoveredPoint && (
                (() => {
                  const xVal = viewMode === 'individual' 
                    ? (unitMode === 'financial' ? (hoveredPoint as ScatterPoint).riskFinancial : (hoveredPoint as ScatterPoint).riskPoints)
                    : (unitMode === 'financial' ? (hoveredPoint as SetupAggregatedPoint).avgLossFinancial : (hoveredPoint as SetupAggregatedPoint).avgLossPoints);

                  const yVal = viewMode === 'individual'
                    ? (unitMode === 'financial' ? (hoveredPoint as ScatterPoint).gainFinancial : (hoveredPoint as ScatterPoint).gainPoints)
                    : (unitMode === 'financial' ? (hoveredPoint as SetupAggregatedPoint).avgGainFinancial : (hoveredPoint as SetupAggregatedPoint).avgGainPoints);

                  const px = getXCoord(xVal);
                  const py = getYCoord(yVal);

                  return (
                    <g>
                      {/* Projeção vertical para Eixo X */}
                      <line
                        x1={px}
                        y1={py}
                        x2={px}
                        y2={padTop + chartInnerHeight}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="2 3"
                        opacity="0.8"
                      />
                      {/* Projeção horizontal para Eixo Y */}
                      <line
                        x1={padLeft}
                        y1={py}
                        x2={px}
                        y2={py}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="2 3"
                        opacity="0.8"
                      />
                    </g>
                  );
                })()
              )}

              {/* RENDERIZAÇÃO DOS PONTOS */}
              {viewMode === 'individual' ? (
                // MODO 1: Trades Individuais
                scatterPoints.map((pt) => {
                  const xVal = unitMode === 'financial' ? pt.riskFinancial : pt.riskPoints;
                  const yVal = unitMode === 'financial' ? pt.gainFinancial : pt.gainPoints;
                  const cx = getXCoord(xVal);
                  const cy = getYCoord(yVal);
                  const isHovered = hoveredPointId === pt.id;
                  const isGain = pt.result === 'GAIN';

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredPointId(pt.id)}
                      onMouseLeave={() => setHoveredPointId(null)}
                      onClick={() => onFilterBySetup && onFilterBySetup(pt.setupId)}
                    >
                      {/* Círculo do ponto */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 8 : 5.5}
                        fill={pt.setupColor}
                        stroke={isHovered ? '#ffffff' : '#020617'}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        filter={isHovered ? 'url(#pointGlow)' : undefined}
                        opacity={hoveredPointId && !isHovered ? 0.35 : 0.95}
                        className="transition-all duration-150"
                      />

                      {/* Ícone no centro para distinguir GAIN (+) vs LOSS (-) se hovered */}
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill={isGain ? '#10b981' : '#f43f5e'}
                        />
                      )}
                    </g>
                  );
                })
              ) : (
                // MODO 2: Médias Agrupadas por Setup
                aggregatedPoints.map((sPt) => {
                  const xVal = unitMode === 'financial' ? sPt.avgLossFinancial : sPt.avgLossPoints;
                  const yVal = unitMode === 'financial' ? sPt.avgGainFinancial : sPt.avgGainPoints;
                  const cx = getXCoord(xVal);
                  const cy = getYCoord(yVal);
                  const isHovered = hoveredPointId === sPt.setupId;
                  // Raio proporcional ao número de trades
                  const r = Math.min(18, Math.max(9, Math.sqrt(sPt.totalTrades) * 4));

                  return (
                    <g
                      key={sPt.setupId}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredPointId(sPt.setupId)}
                      onMouseLeave={() => setHoveredPointId(null)}
                      onClick={() => onFilterBySetup && onFilterBySetup(sPt.setupId)}
                    >
                      {/* Aura */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + (isHovered ? 6 : 2)}
                        fill={sPt.setupColor}
                        opacity={isHovered ? 0.35 : 0.18}
                        className="transition-all"
                      />

                      {/* Círculo principal */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={sPt.setupColor}
                        stroke={isHovered ? '#ffffff' : '#0f172a'}
                        strokeWidth={isHovered ? 2.5 : 2}
                        opacity={hoveredPointId && !isHovered ? 0.35 : 0.95}
                      />

                      {/* Texto do Setup */}
                      <text
                        x={cx}
                        y={cy - r - 6}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={isHovered ? '11' : '10'}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {sPt.setupName}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>

            {/* Floating Tooltip Card */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 z-20 w-80 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 pointer-events-none select-none">
                {viewMode === 'individual' ? (
                  // Tooltip Trade Individual
                  (() => {
                    const pt = hoveredPoint as ScatterPoint;
                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full inline-block shadow-sm"
                              style={{ backgroundColor: pt.setupColor }}
                            />
                            <span className="font-bold text-white text-sm">{pt.setupName}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              pt.result === 'GAIN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : pt.result === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {pt.result}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 space-y-0.5">
                            <span className="text-slate-400 block font-sans text-[10px]">Retorno / Ganho:</span>
                            <span className="font-bold text-emerald-400 text-xs">
                              {unitMode === 'financial' ? formatBRL(pt.gainFinancial) : `${pt.gainPoints} pts`}
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 space-y-0.5">
                            <span className="text-slate-400 block font-sans text-[10px]">Risco Assumido / Stop:</span>
                            <span className="font-bold text-rose-400 text-xs">
                              {unitMode === 'financial' ? formatBRL(pt.riskFinancial) : `${pt.riskPoints} pts`}
                            </span>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                          <span className="text-slate-400 font-sans">Relação Risco x Retorno:</span>
                          <span className={`font-bold ${pt.isPositiveAsymmetry ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {pt.ratioLabel} {pt.isPositiveAsymmetry ? '(Assimetria Favorável)' : '(Risco &gt; Retorno)'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800/80">
                          <span>{formatDateBR(pt.date)} {pt.time || ''}</span>
                          <span className="text-slate-300 font-semibold">{pt.asset} · {pt.contracts} {pt.contracts === 1 ? 'contrato' : 'contratos'}</span>
                        </div>

                        {pt.notes && (
                          <p className="text-[10px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                            "{pt.notes}"
                          </p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  // Tooltip Setup Agrupado
                  (() => {
                    const sPt = hoveredPoint as SetupAggregatedPoint;
                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full inline-block shadow-sm"
                              style={{ backgroundColor: sPt.setupColor }}
                            />
                            <span className="font-bold text-white text-sm">{sPt.setupName}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {sPt.totalTrades} trades
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 space-y-0.5">
                            <span className="text-slate-400 block font-sans text-[10px]">Ganho Médio:</span>
                            <span className="font-bold text-emerald-400 text-xs">
                              {unitMode === 'financial' ? formatBRL(sPt.avgGainFinancial) : `${sPt.avgGainPoints} pts`}
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 space-y-0.5">
                            <span className="text-slate-400 block font-sans text-[10px]">Prejuízo Médio:</span>
                            <span className="font-bold text-rose-400 text-xs">
                              {unitMode === 'financial' ? formatBRL(sPt.avgLossFinancial) : `${sPt.avgLossPoints} pts`}
                            </span>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                          <span className="text-slate-400 font-sans">Payoff Médio do Setup:</span>
                          <span className={`font-bold ${sPt.isPositiveAsymmetry ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {sPt.ratioLabel}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800/80">
                          <span>Taxa de Acerto: <strong className="text-sky-300">{sPt.winRate}%</strong></span>
                          <span>{sPt.wins} Gains / {sPt.losses} Losses</span>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda Interativa com Cores de Cada Setup */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Identificação Visual por Setup:</span>
          </span>
          <span className="text-slate-400 text-[11px]">
            Clique em qualquer setup abaixo para isolar seus pontos no gráfico
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {setups.map((s) => {
            const isSelected = selectedSetupId === s.id;
            const pointsOfSetup = scatterPoints.filter((p) => p.setupId === s.id);
            const count = pointsOfSetup.length;
            const sumR = pointsOfSetup.reduce((acc, p) => acc + p.ratio, 0);
            const avgR = count > 0 ? (sumR / count).toFixed(1) : '-';

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSetupId(isSelected ? 'ALL' : s.id)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-slate-500 shadow-sm ring-1 ring-slate-400/30'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: s.color || '#3b82f6' }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {count} {count === 1 ? 'trade' : 'trades'} · R:R médio 1:{avgR}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    count > 0 && Number(avgR) >= 1.5 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isSelected ? 'Ativo' : 'Ver'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Educativo: Entenda a Assimetria Visual */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl space-y-4 overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">Como identificar Setups Assimétricos?</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>1. Zona Superior (Acima da Linha 1:1) = Assimetria Convexa</span>
                </span>
                <p className="text-slate-300">
                  Pontos localizados acima da linha diagonal tracejada representam trades onde o **retorno obtido foi maior que o risco assumido**. Setups cujos pontos se concentram nas faixas 2:1 ou 3:1 permitem ser altamente lucrativos no longo prazo mesmo acertando menos de 50% das vezes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
                <span className="font-bold text-rose-400 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>2. Zona Inferior (Abaixo da Linha 1:1) = Assimetria Inversa</span>
                </span>
                <p className="text-slate-300">
                  Pontos abaixo da linha 1:1 indicam operações onde você arriscou mais do que ganhou (ex: buscar 100 pontos no índice com stop de 200 pontos). Exigem uma taxa de acerto altíssima (&gt; 70%) para compensar a perda.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-400 flex items-center gap-1.5 text-sm">
                  <Layers className="h-4 w-4 text-sky-400" />
                  <span>3. Cores dos Setups</span>
                </span>
                <p className="text-slate-300">
                  Cada cor representa uma estratégia. Se uma determinada cor se concentra no topo esquerdo do gráfico, esse setup é seu maior gerador de assimetria matemática positiva.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                Entendi, voltar ao gráfico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
