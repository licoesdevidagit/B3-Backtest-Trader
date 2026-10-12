import React, { useState, useMemo } from 'react';
import { AssetType, Setup, Trade, TradeResult } from '../types';
import { formatBRL, formatPoints, formatDateBR, EMOTION_CONFIGS, DEVIATION_REASON_CONFIGS } from '../utils/calculations';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Download, 
  Upload, 
  PlusCircle,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  X,
  Brain,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Sliders,
  ArrowDownAZ
} from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
  setups: Setup[];
  onOpenNewTrade: () => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onExportCSV: () => void;
  initialYearFilter?: string;
  initialMonthFilter?: string;
  initialSetupFilter?: string;
  initialAssetFilter?: 'ALL' | AssetType;
  initialSearchQuery?: string;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  setups,
  onOpenNewTrade,
  onEditTrade,
  onDeleteTrade,
  onExportCSV,
  initialYearFilter = 'ALL',
  initialMonthFilter = 'ALL',
  initialSetupFilter = 'ALL',
  initialAssetFilter = 'ALL',
  initialSearchQuery = '',
}) => {
  const [filterAsset, setFilterAsset] = useState<'ALL' | AssetType>(initialAssetFilter);
  const [filterYear, setFilterYear] = useState<string>(initialYearFilter);
  const [filterSetup, setFilterSetup] = useState<string>(initialSetupFilter);
  const [filterMonth, setFilterMonth] = useState<string>(initialMonthFilter);
  const [filterResult, setFilterResult] = useState<'ALL' | TradeResult>('ALL');
  const [filterPlan, setFilterPlan] = useState<'ALL' | 'FOLLOWED' | 'NOT_FOLLOWED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Setups visibility state: list of setup IDs that are hidden from the history
  const [hiddenSetupIds, setHiddenSetupIds] = useState<string[]>([]);

  // Sorting filter states: 'desc' (Decrescente) or 'asc' (Crescente)
  const [sortField, setSortField] = useState<'date' | 'financialValue' | 'points'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Sync initial filters if prop changes
  React.useEffect(() => {
    if (initialAssetFilter) {
      setFilterAsset(initialAssetFilter);
    }
  }, [initialAssetFilter]);

  React.useEffect(() => {
    if (initialYearFilter) {
      setFilterYear(initialYearFilter);
    }
  }, [initialYearFilter]);

  React.useEffect(() => {
    if (initialMonthFilter) {
      setFilterMonth(initialMonthFilter);
    }
  }, [initialMonthFilter]);

  React.useEffect(() => {
    if (initialSetupFilter) {
      setFilterSetup(initialSetupFilter);
    }
  }, [initialSetupFilter]);

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Available distinct years with trade counts
  const availableYears = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach((t) => {
      if (!t.date) return;
      const y = t.date.slice(0, 4);
      if (y) {
        map.set(y, (map.get(y) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, count]) => ({ year, count }));
  }, [trades]);

  // Available distinct months for filtering (filtered by year if active)
  const availableMonths = useMemo(() => {
    const MONTHS_PT = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    let keys = Array.from(new Set(trades.map((t) => t.date.slice(0, 7)).filter(Boolean))).sort().reverse();
    if (filterYear !== 'ALL') {
      keys = keys.filter((k) => k.startsWith(filterYear));
    }
    return keys.map((key) => {
      const [y, m] = key.split('-');
      const monthIdx = parseInt(m, 10) - 1;
      return {
        key,
        label: `${MONTHS_PT[monthIdx] || m} ${y}`,
      };
    });
  }, [trades, filterYear]);

  // If year changes and month was selected that doesn't match new year, reset month
  const handleYearChange = (newYear: string) => {
    setFilterYear(newYear);
    if (newYear !== 'ALL' && filterMonth !== 'ALL' && !filterMonth.startsWith(newYear)) {
      setFilterMonth('ALL');
    }
  };

  // Filter logic
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterAsset !== 'ALL' && t.asset !== filterAsset) return false;
      if (filterYear !== 'ALL' && !t.date.startsWith(filterYear)) return false;
      if (filterSetup !== 'ALL' && t.setupId !== filterSetup) return false;
      if (hiddenSetupIds.includes(t.setupId)) return false;
      if (filterMonth !== 'ALL' && !t.date.startsWith(filterMonth)) return false;
      if (filterResult !== 'ALL' && t.result !== filterResult) return false;
      if (filterPlan === 'FOLLOWED') {
        const followed = t.psychology ? t.psychology.followedPlan : true;
        if (!followed) return false;
      }
      if (filterPlan === 'NOT_FOLLOWED') {
        const followed = t.psychology ? t.psychology.followedPlan : true;
        if (followed) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNote = t.notes?.toLowerCase().includes(q);
        const matchSetup = t.setupName?.toLowerCase().includes(q);
        const matchDate = t.date.includes(q) || formatDateBR(t.date).includes(q);
        if (!matchNote && !matchSetup && !matchDate) return false;
      }
      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === 'date') {
        const da = `${a.date} ${a.time || '00:00'}`;
        const db = `${b.date} ${b.time || '00:00'}`;
        comp = da.localeCompare(db);
      } else if (sortField === 'financialValue') {
        comp = (a.financialValue || 0) - (b.financialValue || 0);
      } else if (sortField === 'points') {
        comp = (a.points || 0) - (b.points || 0);
      }

      if (comp === 0) {
        const da = `${a.date} ${a.time || '00:00'}`;
        const db = `${b.date} ${b.time || '00:00'}`;
        comp = da.localeCompare(db);
      }

      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [trades, filterAsset, filterSetup, filterMonth, filterResult, filterPlan, hiddenSetupIds, searchQuery, sortField, sortOrder]);

  // Sorting order for setups in comparison toolbar ('alpha' = Ordem Alfabética, 'profit' = Rentabilidade)
  const [setupSortAlpha, setSetupSortAlpha] = useState<boolean>(true);

  // Setups ordered alphabetically for dropdowns and lists
  const sortedSetups = useMemo(() => {
    return [...setups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [setups]);

  // Per-setup stats for comparison and quick hide/show toggles
  const setupStats = useMemo(() => {
    const list = setups.map((s) => {
      const sTrades = trades.filter((t) => t.setupId === s.id);
      const wins = sTrades.filter((t) => t.result === 'GAIN').length;
      const profit = sTrades.reduce((acc, t) => acc + (t.financialValue || 0), 0);
      const winRate = sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0;
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        count: sTrades.length,
        profit,
        winRate,
      };
    });

    if (setupSortAlpha) {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
    return list.sort((a, b) => b.profit - a.profit);
  }, [trades, setups, setupSortAlpha]);

  const toggleSetupVisibility = (setupId: string) => {
    setHiddenSetupIds((prev) =>
      prev.includes(setupId) ? prev.filter((id) => id !== setupId) : [...prev, setupId]
    );
  };

  const handleShowAllSetups = () => {
    setHiddenSetupIds([]);
    setFilterSetup('ALL');
  };

  const handleIsolateSetup = (setupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const otherIds = setups.filter((s) => s.id !== setupId).map((s) => s.id);
    setHiddenSetupIds(otherIds);
    setFilterSetup('ALL');
  };

  // Count trades and compute metrics by asset across all trades
  const assetMetrics = useMemo(() => {
    let winCount = 0;
    let wdoCount = 0;
    let acoesCount = 0;
    let winProfit = 0;
    let wdoProfit = 0;
    let acoesProfit = 0;

    trades.forEach((t) => {
      if (t.asset === 'WIN') {
        winCount++;
        winProfit += t.financialValue;
      } else if (t.asset === 'WDO') {
        wdoCount++;
        wdoProfit += t.financialValue;
      } else if (t.asset === 'ACOES') {
        acoesCount++;
        acoesProfit += t.financialValue;
      }
    });

    return {
      all: trades.length,
      winCount,
      wdoCount,
      acoesCount,
      winProfit,
      wdoProfit,
      acoesProfit,
    };
  }, [trades]);

  // Aggregate stats for filtered trades
  const filteredStats = useMemo(() => {
    const total = filteredTrades.length;
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let netProfit = 0;
    let pointsWIN = 0;
    let pointsWDO = 0;

    filteredTrades.forEach((t) => {
      if (t.result === 'GAIN') wins++;
      else if (t.result === 'LOSS') losses++;
      else breakevens++;

      netProfit += t.financialValue;
      if (t.asset === 'WIN') pointsWIN += t.points;
      if (t.asset === 'WDO') pointsWDO += t.points;
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    return { 
      total, 
      wins, 
      losses, 
      breakevens, 
      winRate, 
      netProfit, 
      pointsWIN, 
      pointsWDO 
    };
  }, [filteredTrades]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Histórico Detalhado de Operações</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({filteredTrades.length} de {trades.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro completo de cada trade testado com contratos, pontos e financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExportCSV}
            title="Exportar dados para Excel/Planilha"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTrade}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Novo Trade</span>
          </button>
        </div>
      </div>

      {/* Filtro de Ativo Destacado: Mini Índice (WIN) vs. Mini Dólar (WDO) vs. Ações B3 */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-emerald-400" />
              <span>Filtro de Ativo / Mercado B3:</span>
            </span>
            {filterAsset !== 'ALL' && (
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                filterAsset === 'WIN' 
                  ? 'bg-blue-500/10 text-sky-400 border-blue-500/30' 
                  : filterAsset === 'WDO'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              }`}>
                <span>Visualizando apenas:</span>
                <strong>{filterAsset === 'WIN' ? 'Mini Índice (WIN)' : filterAsset === 'WDO' ? 'Mini Dólar (WDO)' : 'Ações B3'}</strong>
                <button
                  type="button"
                  onClick={() => setFilterAsset('ALL')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  title="Remover filtro de ativo"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {filterAsset !== 'ALL' && (
            <button
              type="button"
              onClick={() => setFilterAsset('ALL')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer font-medium"
            >
              <span>Exibir Todos os Mercados</span>
            </button>
          )}
        </div>

        {/* 4 Botões Principais de Seleção de Ativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Opção 1: Todos os Ativos */}
          <button
            type="button"
            onClick={() => setFilterAsset('ALL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              filterAsset === 'ALL'
                ? 'bg-slate-800/90 border-slate-600 text-white shadow-md ring-1 ring-slate-500/50'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Todos os Mercados</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  WIN + WDO + Ações
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Operações combinadas de todos os mercados
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-bold text-white block">{assetMetrics.all}</span>
              <span className="text-[10px] text-slate-500">trades</span>
            </div>
          </button>

          {/* Opção 2: Mini Índice (WIN) */}
          <button
            type="button"
            onClick={() => setFilterAsset('WIN')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              filterAsset === 'WIN'
                ? 'bg-sky-950/50 border-sky-500/70 text-white shadow-md ring-1 ring-sky-500/40'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Mini Índice</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-sky-400 border border-blue-500/40">
                  WIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Contratos futuros de Índice (R$ 0,20/pt)
              </p>
            </div>
            <div className="text-right font-mono">
              <span className={`text-sm font-bold block ${filterAsset === 'WIN' ? 'text-sky-300' : 'text-slate-200'}`}>
                {assetMetrics.winCount} trades
              </span>
              <span className={`text-[10px] font-bold ${assetMetrics.winProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(assetMetrics.winProfit)}
              </span>
            </div>
          </button>

          {/* Opção 3: Mini Dólar (WDO) */}
          <button
            type="button"
            onClick={() => setFilterAsset('WDO')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              filterAsset === 'WDO'
                ? 'bg-emerald-950/50 border-emerald-500/70 text-white shadow-md ring-1 ring-emerald-500/40'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Mini Dólar</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  WDO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Contratos futuros de Dólar (R$ 10,00/pt)
              </p>
            </div>
            <div className="text-right font-mono">
              <span className={`text-sm font-bold block ${filterAsset === 'WDO' ? 'text-emerald-300' : 'text-slate-200'}`}>
                {assetMetrics.wdoCount} trades
              </span>
              <span className={`text-[10px] font-bold ${assetMetrics.wdoProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(assetMetrics.wdoProfit)}
              </span>
            </div>
          </button>

          {/* Opção 4: Ações B3 (ACOES) */}
          <button
            type="button"
            onClick={() => setFilterAsset('ACOES')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              filterAsset === 'ACOES'
                ? 'bg-purple-950/50 border-purple-500/70 text-white shadow-md ring-1 ring-purple-500/40'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Ações B3</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ACOES
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PETR4, VALE3, ITUB4, BBAS3...
              </p>
            </div>
            <div className="text-right font-mono">
              <span className={`text-sm font-bold block ${filterAsset === 'ACOES' ? 'text-purple-300' : 'text-slate-200'}`}>
                {assetMetrics.acoesCount} trades
              </span>
              <span className={`text-[10px] font-bold ${assetMetrics.acoesProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(assetMetrics.acoesProfit)}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Seletor de Período Anual (Análise por Ano) */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <span>Seletor de Período Anual:</span>
            </span>
            {filterYear !== 'ALL' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-300 border-purple-500/40 flex items-center gap-1.5">
                <span>Filtrando por:</span>
                <strong>Ano {filterYear}</strong>
                <button
                  type="button"
                  onClick={() => handleYearChange('ALL')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  title="Ver todos os anos"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {filterYear !== 'ALL' && (
            <button
              type="button"
              onClick={() => handleYearChange('ALL')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer font-medium"
            >
              <span>Exibir Todos os Anos</span>
            </button>
          )}
        </div>

        {/* Botões Rápidos de Seleção de Ano */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => handleYearChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterYear === 'ALL'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm ring-1 ring-purple-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Todos os Anos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {trades.length}
            </span>
          </button>

          {availableYears.map(({ year, count }) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearChange(year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                filterYear === year
                  ? 'bg-purple-600/25 text-white border-purple-400 shadow-md ring-1 ring-purple-400/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>Ano {year}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                filterYear === year ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {count} {count === 1 ? 'trade' : 'trades'}
              </span>
            </button>
          ))}
        </div>

        {/* Painel de Análise Comparativa de Setups (Ocultar / Exibir Setups na Análise) */}
        {setups.length > 0 && (
          <div className="pt-2.5 border-t border-slate-800/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                <span>Análise Comparativa de Setups (Ocultar / Exibir):</span>
                {hiddenSetupIds.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {hiddenSetupIds.length} {hiddenSetupIds.length === 1 ? 'setup oculto' : 'setups ocultos'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Botão de Ordenação Alfabética A-Z */}
                <button
                  type="button"
                  onClick={() => setSetupSortAlpha((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    setupSortAlpha
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Alternar entre Ordem Alfabética (A-Z) e Rentabilidade"
                >
                  <ArrowDownAZ className="h-3 w-3 text-purple-400" />
                  <span>{setupSortAlpha ? 'Ordem Alfabética (A-Z)' : 'Por Rentabilidade'}</span>
                </button>

                {hiddenSetupIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleShowAllSetups}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Exibir Todos os Setups</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Clique em um setup para <strong>ocultar ou reexibir</strong> todos os seus trades da análise comparativa, ou clique em <strong>Isolar</strong> para analisar exclusivamente o desempenho daquele setup.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {setupStats.map((s) => {
                const isHidden = hiddenSetupIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSetupVisibility(s.id)}
                    className={`group px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none flex items-center gap-2 ${
                      isHidden
                        ? 'bg-slate-950/60 border-rose-500/40 text-slate-500 hover:border-rose-500/60 opacity-60 ring-1 ring-rose-500/10'
                        : 'bg-slate-900 border-slate-700/90 text-white hover:border-emerald-500/60 shadow-sm'
                    }`}
                    title={
                      isHidden
                        ? `Clique para REEXIBIR os ${s.count} trades de "${s.name}"`
                        : `Clique para OCULTAR os ${s.count} trades de "${s.name}" da análise comparativa`
                    }
                  >
                    <span className={isHidden ? 'text-rose-400' : 'text-emerald-400'}>
                      {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </span>

                    <span className={`font-semibold ${isHidden ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {s.name}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      ({s.count} tr · {s.winRate.toFixed(0)}%)
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold ${
                        s.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {s.profit >= 0 ? `+${formatBRL(s.profit)}` : formatBRL(s.profit)}
                    </span>

                    {/* Botões de Ação Explícitos no Card */}
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleSetupVisibility(s.id)}
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          isHidden
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-slate-700'
                        }`}
                        title={isHidden ? `Reexibir "${s.name}"` : `Ocultar "${s.name}"`}
                      >
                        {isHidden ? 'Reexibir' : 'Ocultar'}
                      </button>

                      {!isHidden && setups.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleIsolateSetup(s.id, e)}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                          title={`Isolar "${s.name}" (oculta todos os outros)`}
                        >
                          Isolar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banner de Aviso de Setups Ocultos */}
            {hiddenSetupIds.length > 0 && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-200 flex items-center justify-between gap-3 flex-wrap animate-fade-in">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>{hiddenSetupIds.length} setup(s) ocultado(s) da análise:</strong>{' '}
                    {setups.filter((s) => hiddenSetupIds.includes(s.id)).map((s) => s.name).join(', ')}.
                    A listagem de trades e as métricas refletem exclusivamente os setups ativos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleShowAllSetups}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 hover:text-white font-semibold transition-colors border border-rose-500/40 text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Reexibir Todos</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demais Controles de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 items-end">
        {/* Year Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Ano Operado
          </label>
          <select
            value={filterYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Anos</option>
            {availableYears.map((y) => (
              <option key={y.year} value={y.year}>
                Ano {y.year} ({y.count} trades)
              </option>
            ))}
          </select>
        </div>

        {/* Month dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Mês Operado
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">
              {filterYear !== 'ALL' ? `Todos os Meses de ${filterYear}` : 'Todos os Meses'}
            </option>
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Result Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Resultado
          </label>
          <div className="flex items-center h-9 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterResult('ALL')}
              className={`flex-1 h-full flex items-center justify-center px-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResult === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterResult('GAIN')}
              className={`flex-1 h-full flex items-center justify-center px-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResult === 'GAIN'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gain
            </button>
            <button
              type="button"
              onClick={() => setFilterResult('LOSS')}
              className={`flex-1 h-full flex items-center justify-center px-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResult === 'LOSS'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Loss
            </button>
            <button
              type="button"
              onClick={() => setFilterResult('BREAKEVEN')}
              className={`flex-1 h-full flex items-center justify-center px-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterResult === 'BREAKEVEN'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0x0
            </button>
          </div>
        </div>

        {/* Setup dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-slate-400">
              Filtrar por Setup
            </label>
            {filterSetup !== 'ALL' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    toggleSetupVisibility(filterSetup);
                    setFilterSetup('ALL');
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Ocultar todos os trades deste setup da análise"
                >
                  <EyeOff className="h-2.5 w-2.5" />
                  <span>Ocultar</span>
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={(e) => handleIsolateSetup(filterSetup, e)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Isolar este setup (ocultar os outros)"
                >
                  <span>Isolar</span>
                </button>
              </div>
            )}
          </div>
          <select
            value={filterSetup}
            onChange={(e) => setFilterSetup(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Setups ({trades.length} trades)</option>
            {sortedSetups.map((s) => {
              const count = trades.filter((t) => t.setupId === s.id).length;
              const isHidden = hiddenSetupIds.includes(s.id);
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count} tr){isHidden ? ' [Oculto]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Plan / Discipline filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Brain className="h-3 w-3 text-purple-400" />
            <span>Disciplina / Plano</span>
          </label>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as 'ALL' | 'FOLLOWED' | 'NOT_FOLLOWED')}
            className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Operações</option>
            <option value="FOLLOWED">🎯 No Plano Operacional</option>
            <option value="NOT_FOLLOWED">⚠️ Fora do Plano (Desvio)</option>
          </select>
        </div>

        {/* Search query */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1 xl:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-slate-400">
              Buscar por Nota ou Data
            </label>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: payroll, 2026-03..."
              className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-7 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Limpar campo de busca"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sorting Controls Bar: Decrescente / Crescente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2 px-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
            <span>Organizar por:</span>
          </span>

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="h-7 rounded-md bg-slate-900 border border-slate-800 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
          >
            <option value="date">Data & Hora do Trade</option>
            <option value="financialValue">Resultado Financeiro (R$)</option>
            <option value="points">Pontuação (pts)</option>
          </select>
        </div>

        {/* Buttons: Decrescente / Crescente */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortOrder('desc')}
            title="Ordem Decrescente (Mais recentes primeiro / Maiores valores primeiro)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              sortOrder === 'desc'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            <span>Decrescente</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder('asc')}
            title="Ordem Crescente (Mais antigos primeiro / Menores valores primeiro)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              sortOrder === 'asc'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpWideNarrow className="h-3.5 w-3.5" />
            <span>Crescente</span>
          </button>
        </div>
      </div>

      {/* Filtered Bar summary stats */}
      <div className="py-2.5 px-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400">
            Resultados filtrados: <strong className="text-white">{filteredStats.total}</strong> trades
          </span>
          {filterAsset === 'WIN' && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/15 text-sky-400 border border-blue-500/30">
              Mini Índice · {formatPoints(filteredStats.pointsWIN, 'WIN')}
            </span>
          )}
          {filterAsset === 'WDO' && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Mini Dólar · {formatPoints(filteredStats.pointsWDO, 'WDO')}
            </span>
          )}
          {filterAsset === 'ALL' && (
            <span className="text-[11px] text-slate-400">
              (WIN: <strong className="text-sky-400">{filteredTrades.filter(t => t.asset === 'WIN').length}</strong> | WDO: <strong className="text-emerald-400">{filteredTrades.filter(t => t.asset === 'WDO').length}</strong>)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-400">
            Acerto: <strong className="text-emerald-400">{filteredStats.winRate.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-400">
            Saldo Líquido:{' '}
            <strong className={filteredStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatBRL(filteredStats.netProfit)}
            </strong>
          </span>
        </div>
      </div>

      {/* Trades List / Table */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 space-y-2">
          <p className="text-xs text-slate-400">
            {filterAsset !== 'ALL'
              ? `Nenhuma operação de ${filterAsset === 'WIN' ? 'Mini Índice (WIN)' : 'Mini Dólar (WDO)'} encontrada com os filtros selecionados.`
              : 'Nenhuma operação encontrada com os filtros selecionados.'}
          </p>
          {(filterAsset !== 'ALL' || filterSetup !== 'ALL' || filterResult !== 'ALL' || filterMonth !== 'ALL' || searchQuery) && (
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              {filterAsset !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterAsset('ALL')}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                >
                  Exibir todos os ativos
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setFilterAsset('ALL');
                  setFilterSetup('ALL');
                  setFilterMonth('ALL');
                  setFilterResult('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile & Tablet Card View (visible on < md screens) */}
          <div className="md:hidden space-y-2.5">
            {filteredTrades.map((t) => {
              const isConfirmingDelete = confirmDeleteId === t.id;

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5 transition-colors shadow-sm"
                >
                  {/* Top Bar: Asset, Direction, Contracts & Result Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          t.asset === 'WIN'
                            ? 'bg-blue-500/15 text-sky-400 border border-blue-500/30'
                            : t.asset === 'WDO'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {t.asset === 'WIN' ? 'Mini Índice (WIN)' : t.asset === 'WDO' ? 'Mini Dólar (WDO)' : `Ações (${t.ticker || 'B3'})`}
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          t.direction === 'COMPRA' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.direction === 'COMPRA' ? '▲ Compra' : '▼ Venda'}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {t.asset === 'ACOES' ? `${t.quantity || t.contracts} ações` : `${t.contracts} ${t.contracts === 1 ? 'ct' : 'cts'}`}
                      </span>

                      {/* Psychology & Discipline badge on mobile */}
                      {t.psychology && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border flex items-center gap-0.5 ${
                            t.psychology.followedPlan
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {t.psychology.followedPlan ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <XCircle className="h-2.5 w-2.5" />
                          )}
                          <span>{t.psychology.followedPlan ? 'Plano OK' : 'Desvio'}</span>
                        </span>
                      )}

                      {t.psychology?.emotion && EMOTION_CONFIGS[t.psychology.emotion] && (
                        <span className="text-[11px]">
                          {EMOTION_CONFIGS[t.psychology.emotion].emoji}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.result === 'GAIN' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          GAIN
                        </span>
                      ) : t.result === 'LOSS' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="h-3 w-3" />
                          LOSS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <MinusCircle className="h-3 w-3" />
                          0x0
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Setup Name, Date & Financial Result */}
                  <div className="flex items-center justify-between gap-2 border-t border-b border-slate-800/60 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white block truncate">
                          {t.setupName || 'Setup'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSetupVisibility(t.setupId)}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700/80 flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Ocultar todos os trades de "${t.setupName}"`}
                        >
                          <EyeOff className="h-2.5 w-2.5 text-rose-400" />
                          <span>Ocultar</span>
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 block">
                        {formatDateBR(t.date)} {t.time ? `· ${t.time}` : ''}
                      </span>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          t.financialValue > 0
                            ? 'text-emerald-400'
                            : t.financialValue < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatBRL(t.financialValue)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatPoints(t.points, t.asset)}
                      </div>
                    </div>
                  </div>

                  {/* Notes (if any) */}
                  {t.notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg break-words">
                      "{t.notes}"
                    </p>
                  )}

                  {/* Bottom Row: Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                    <button
                      type="button"
                      onClick={() => onEditTrade(t)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Editar</span>
                    </button>

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTrade(t.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white bg-slate-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on md+) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (sortField === 'date') {
                        setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setSortField('date');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Data / Hora {sortField === 'date' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th className="py-2.5 px-2">Ativo</th>
                  <th className="py-2.5 px-2">Direção</th>
                  <th className="py-2.5 px-3">Setup</th>
                  <th className="py-2.5 px-2 text-center">Contratos</th>
                  <th className="py-2.5 px-2 text-center">Resultado</th>
                  <th 
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (sortField === 'points') {
                        setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setSortField('points');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Pontos {sortField === 'points' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th 
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (sortField === 'financialValue') {
                        setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setSortField('financialValue');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Resultado (R$) {sortField === 'financialValue' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th className="py-2.5 px-3">Disciplina / Emoção</th>
                  <th className="py-2.5 px-3">Observações</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
                {filteredTrades.map((t) => {
                  const isConfirmingDelete = confirmDeleteId === t.id;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/40 transition-colors font-mono"
                    >
                      {/* Date / Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        <div className="font-semibold text-slate-100">{formatDateBR(t.date)}</div>
                        {t.time && <div className="text-[10px] text-slate-400">{t.time}</div>}
                      </td>

                      {/* Asset Badge */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.asset === 'WIN'
                              ? 'bg-blue-500/15 text-sky-400 border border-blue-500/30'
                              : t.asset === 'WDO'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {t.asset === 'WIN' ? 'Mini Índice (WIN)' : t.asset === 'WDO' ? 'Mini Dólar (WDO)' : `Ações (${t.ticker || 'B3'})`}
                        </span>
                      </td>

                      {/* Direction */}
                      <td className="py-2.5 px-2 whitespace-nowrap font-sans font-medium text-xs">
                        {t.direction === 'COMPRA' ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            ▲ Compra
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-0.5">
                            ▼ Venda
                          </span>
                        )}
                      </td>

                      {/* Setup Name with Quick Ocultar / Isolar actions */}
                      <td className="py-2.5 px-3 font-sans font-medium text-white max-w-[210px] group/setup">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate" title={t.setupName}>{t.setupName || 'Setup'}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/setup:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSetupVisibility(t.setupId);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`Ocultar todos os trades de "${t.setupName}"`}
                            >
                              <EyeOff className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleIsolateSetup(t.setupId, e)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`Isolar apenas "${t.setupName}"`}
                            >
                              <Sliders className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Contracts / Shares */}
                      <td className="py-2.5 px-2 text-center text-slate-200">
                        {t.asset === 'ACOES' ? `${t.quantity || t.contracts} ações` : `${t.contracts} ${t.contracts === 1 ? 'ct' : 'cts'}`}
                      </td>

                      {/* Result */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-sans">
                        {t.result === 'GAIN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            GAIN
                          </span>
                        ) : t.result === 'LOSS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <XCircle className="h-3 w-3" />
                            LOSS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <MinusCircle className="h-3 w-3" />
                            0x0
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            t.points > 0
                              ? 'text-emerald-400'
                              : t.points < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatPoints(t.points, t.asset)}
                        </span>
                      </td>

                      {/* Financial Value (R$) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            t.financialValue > 0
                              ? 'text-emerald-400'
                              : t.financialValue < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatBRL(t.financialValue)}
                        </span>
                      </td>

                      {/* Psychology & Discipline */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-sans text-xs">
                        {t.psychology ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                t.psychology.followedPlan
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              }`}
                            >
                              {t.psychology.followedPlan ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3 w-3 text-rose-400" />
                              )}
                              <span>{t.psychology.followedPlan ? 'Plano OK' : 'Desvio'}</span>
                            </span>

                            {t.psychology.emotion && EMOTION_CONFIGS[t.psychology.emotion] && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${EMOTION_CONFIGS[t.psychology.emotion].bgClass} ${EMOTION_CONFIGS[t.psychology.emotion].textClass} ${EMOTION_CONFIGS[t.psychology.emotion].borderClass}`}
                                title={`Emoção: ${EMOTION_CONFIGS[t.psychology.emotion].label}`}
                              >
                                {EMOTION_CONFIGS[t.psychology.emotion].emoji} {EMOTION_CONFIGS[t.psychology.emotion].label.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">Sem dados</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-3 font-sans text-xs text-slate-400 max-w-[200px] truncate" title={t.notes}>
                        {t.notes || <span className="text-slate-600">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-sans">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded">
                            <span className="text-[10px] text-rose-300 font-semibold px-1">Excluir?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTrade(t.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white rounded"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTrade(t)}
                              title="Editar trade"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(t.id)}
                              title="Excluir trade"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
