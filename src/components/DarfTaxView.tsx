import React, { useState } from 'react';
import { Trade, MonthlyTaxApuracao } from '../types';
import { formatBRL } from '../utils/calculations';
import { calculateMonthlyTaxApuracao, getDarfSummary } from '../utils/taxCalculations';
import { DarfCalendar } from './DarfCalendar';
import { DarfGuideModal } from './DarfGuideModal';
import { DarfCalculationBreakdownModal } from './DarfCalculationBreakdownModal';
import { 
  Receipt, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink, 
  SlidersHorizontal, 
  Table, 
  CalendarDays, 
  FileSpreadsheet, 
  CheckCircle2, 
  Copy, 
  RotateCcw,
  Sparkles,
  DollarSign,
  Calculator,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow
} from 'lucide-react';

interface DarfTaxViewProps {
  trades: Trade[];
}

const STORAGE_KEY_PAID_DARFS = 'b3_backtest_paid_darfs_v1';
const STORAGE_KEY_INITIAL_LOSS = 'b3_backtest_initial_loss_v1';
const STORAGE_KEY_COSTS = 'b3_backtest_tax_costs_v1';

export const DarfTaxView: React.FC<DarfTaxViewProps> = ({ trades }) => {
  // Paid DARFs persistence
  const [paidMonths, setPaidMonths] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAID_DARFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {};
  });

  // Initial accumulated loss before app usage
  const [initialLoss, setInitialLoss] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INITIAL_LOSS);
      if (saved) return parseFloat(saved) || 0;
    } catch (e) {
      // ignore
    }
    return 0;
  });

  // Contract costs configuration
  const [costsConfig, setCostsConfig] = useState<{ costWIN: number; costWDO: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COSTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { costWIN: 0, costWDO: 0 };
  });

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [tempLossInput, setTempLossInput] = useState<string>(String(initialLoss || ''));
  const [tempWinCost, setTempWinCost] = useState<string>(String(costsConfig.costWIN || ''));
  const [tempWdoCost, setTempWdoCost] = useState<string>(String(costsConfig.costWDO || ''));

  // Active subtab
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'table' | 'irpf'>('calendar');

  // Selected item for the DARF guide modal
  const [selectedGuideItem, setSelectedGuideItem] = useState<MonthlyTaxApuracao | null>(null);
  const [calculationModalItem, setCalculationModalItem] = useState<MonthlyTaxApuracao | null>(null);

  // Toggle paid status
  const handleTogglePaid = (monthKey: string) => {
    setPaidMonths((prev) => {
      const updated = { ...prev, [monthKey]: !prev[monthKey] };
      try {
        localStorage.setItem(STORAGE_KEY_PAID_DARFS, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  // Save configurations
  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    const lossVal = Math.max(0, parseFloat(tempLossInput.replace(',', '.')) || 0);
    const winVal = Math.max(0, parseFloat(tempWinCost.replace(',', '.')) || 0);
    const wdoVal = Math.max(0, parseFloat(tempWdoCost.replace(',', '.')) || 0);

    setInitialLoss(lossVal);
    setCostsConfig({ costWIN: winVal, costWDO: wdoVal });

    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_LOSS, String(lossVal));
      localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify({ costWIN: winVal, costWDO: wdoVal }));
    } catch (err) {
      // ignore
    }

    setIsConfigOpen(false);
  };

  // Calculate apurações
  const monthlyApuracoes = React.useMemo(() => {
    return calculateMonthlyTaxApuracao(
      trades,
      initialLoss,
      paidMonths,
      costsConfig.costWIN,
      costsConfig.costWDO
    );
  }, [trades, initialLoss, paidMonths, costsConfig]);

  // Overall summary
  const summary = React.useMemo(() => {
    return getDarfSummary(monthlyApuracoes);
  }, [monthlyApuracoes]);

  // Table sorting controls: 'desc' (Decrescente) or 'asc' (Crescente)
  const [tableSortField, setTableSortField] = useState<'month' | 'netResult' | 'darfDue' | 'taxBase' | 'dueDate'>('month');
  const [tableSortOrder, setTableSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedTableApuracoes = React.useMemo(() => {
    const list = [...monthlyApuracoes];
    list.sort((a, b) => {
      let comp = 0;
      if (tableSortField === 'month') {
        comp = a.monthKey.localeCompare(b.monthKey);
      } else if (tableSortField === 'netResult') {
        comp = a.netResult - b.netResult;
      } else if (tableSortField === 'darfDue') {
        comp = a.darfDue - b.darfDue;
      } else if (tableSortField === 'taxBase') {
        comp = a.taxBase - b.taxBase;
      } else if (tableSortField === 'dueDate') {
        comp = a.dueDate.localeCompare(b.dueDate);
      }
      return tableSortOrder === 'desc' ? -comp : comp;
    });
    return list;
  }, [monthlyApuracoes, tableSortField, tableSortOrder]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <span>Imposto de Renda & DARF Day Trade</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Apuração automática com alíquota de 20%, compensação de prejuízos, dedução de IRRF (1%) e calendário oficial de vencimentos B3 (Código 6015).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTempLossInput(String(initialLoss || ''));
              setTempWinCost(String(costsConfig.costWIN || ''));
              setTempWdoCost(String(costsConfig.costWDO || ''));
              setIsConfigOpen((prev) => !prev);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span>Prejuízo Anterior & Custos</span>
          </button>
        </div>
      </div>

      {/* Configuration Card Drawer (when opened) */}
      {isConfigOpen && (
        <form
          onSubmit={handleSaveConfigs}
          className="rounded-2xl border border-amber-500/30 bg-slate-900/95 p-4 sm:p-5 shadow-xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Configurações de Compensação & Custos</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Prejuízo Acumulado Anterior (R$)
              </label>
              <input
                type="text"
                value={tempLossInput}
                onChange={(e) => setTempLossInput(e.target.value)}
                placeholder="Ex: 1500.00"
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                Prejuízo de Day Trade vindo de meses anteriores a este backtest.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Taxas / Custos WIN por Contrato (R$)
              </label>
              <input
                type="text"
                value={tempWinCost}
                onChange={(e) => setTempWinCost(e.target.value)}
                placeholder="Ex: 0.25 (emolumentos/corretagem)"
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                Opcional. Deduz automaticamente da apuração líquida de cada trade.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Taxas / Custos WDO por Contrato (R$)
              </label>
              <input
                type="text"
                value={tempWdoCost}
                onChange={(e) => setTempWdoCost(e.target.value)}
                placeholder="Ex: 1.20"
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                Opcional. Deduz da apuração de cada contrato de Dólar.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-md"
            >
              Salvar Parâmetros
            </button>
          </div>
        </form>
      )}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: DARF a Pagar / Pendente */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-amber-950/20 p-4 shadow-lg space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>DARF a Pagar (Total Pendente)</span>
            <Receipt className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatBRL(summary.totalDarfPending)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.pendingCount > 0 ? (
              <span className="text-amber-300 font-medium">
                {summary.pendingCount} mês(es) com DARF aguardando pagamento
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Nenhuma DARF pendente
              </span>
            )}
          </p>
        </div>

        {/* Card 2: Próxima Data Limite */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Próxima Data Limite Oficial</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {summary.nextDueItem ? summary.nextDueItem.dueDateFormatted : 'Em dia'}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.nextDueItem ? (
              <span className="text-emerald-400 font-medium">
                Faltam {summary.nextDueItem.daysUntilDue} dias ({summary.nextDueItem.monthLabel})
              </span>
            ) : (
              <span>Sem vencimentos futuros próximos</span>
            )}
          </p>
        </div>

        {/* Card 3: Prejuízo Acumulado para Compensar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Prejuízo Acumulado p/ Compensar</span>
            <ShieldCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatBRL(summary.accumulatedLossCurrent)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.accumulatedLossCurrent > 0 ? (
              <span className="text-sky-300">Abaterá automaticamente de lucros futuros</span>
            ) : (
              <span>Nenhum prejuízo a compensar</span>
            )}
          </p>
        </div>

        {/* Card 4: Total de DARF Já Pago */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total de DARF Já Pago</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatBRL(summary.totalDarfPaid)}
          </div>
          <p className="text-[11px] text-slate-400">
            IRRF 1% retido total: <strong className="text-slate-300 font-mono">{formatBRL(summary.totalIrrfRetained)}</strong>
          </p>
        </div>
      </div>

      {/* Subtab Navigation (Calendário de DARF / Tabela de Apuração / Ficha IRPF) */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'calendar'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Calendário de DARF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'table'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Table className="h-4 w-4" />
          <span>Tabela Detalhada de Apuração</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('irpf')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'irpf'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Ficha Anual IRPF (Receita Federal)</span>
        </button>
      </div>

      {/* VIEW 1: CALENDÁRIO DE DARF */}
      {activeSubTab === 'calendar' && (
        <DarfCalendar
          monthlyApuracoes={monthlyApuracoes}
          onOpenGuide={(item) => setSelectedGuideItem(item)}
          onTogglePaid={handleTogglePaid}
        />
      )}

      {/* VIEW 2: TABELA DETALHADA DE APURAÇÃO */}
      {activeSubTab === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Extrato Cronológico de Apuração de IR Day Trade</h3>
              <p className="text-xs text-slate-400">Todos os meses com base de cálculo, compensação e vencimento</p>
            </div>

            {/* Sort Filter Selector & Asc/Desc Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
                <span>Ordenar:</span>
              </span>

              <select
                value={tableSortField}
                onChange={(e) => setTableSortField(e.target.value as any)}
                className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-2.5 text-xs text-slate-200 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="month">Data / Mês</option>
                <option value="netResult">Resultado Líquido</option>
                <option value="darfDue">Valor da DARF</option>
                <option value="taxBase">Base de Cálculo</option>
                <option value="dueDate">Data de Vencimento</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTableSortOrder('desc')}
                  title="Ordem Decrescente"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    tableSortOrder === 'desc'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                  <span>Decrescente</span>
                  <span className="text-[10px] font-mono opacity-80">(Maior / Recente)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTableSortOrder('asc')}
                  title="Ordem Crescente"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    tableSortOrder === 'asc'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpWideNarrow className="h-3.5 w-3.5" />
                  <span>Crescente</span>
                  <span className="text-[10px] font-mono opacity-80">(Menor / Antigo)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (tableSortField === 'month') {
                        setTableSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setTableSortField('month');
                        setTableSortOrder('desc');
                      }
                    }}
                  >
                    Mês/Ano {tableSortField === 'month' && (tableSortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th 
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (tableSortField === 'netResult') {
                        setTableSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setTableSortField('netResult');
                        setTableSortOrder('desc');
                      }
                    }}
                  >
                    Resultado Líquido {tableSortField === 'netResult' && (tableSortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th className="py-2.5 px-3 text-right">Prej. Anterior</th>
                  <th className="py-2.5 px-3 text-right">Prej. Compensado</th>
                  <th 
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (tableSortField === 'taxBase') {
                        setTableSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setTableSortField('taxBase');
                        setTableSortOrder('desc');
                      }
                    }}
                  >
                    Base IR (20%) {tableSortField === 'taxBase' && (tableSortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th className="py-2.5 px-3 text-right">IRRF (1%)</th>
                  <th 
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (tableSortField === 'darfDue') {
                        setTableSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setTableSortField('darfDue');
                        setTableSortOrder('desc');
                      }
                    }}
                  >
                    DARF a Pagar {tableSortField === 'darfDue' && (tableSortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th 
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      if (tableSortField === 'dueDate') {
                        setTableSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                      } else {
                        setTableSortField('dueDate');
                        setTableSortOrder('desc');
                      }
                    }}
                  >
                    Data Limite {tableSortField === 'dueDate' && (tableSortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedTableApuracoes.length > 0 ? (
                  sortedTableApuracoes.map((item) => (
                    <tr key={item.monthKey} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">
                        {item.monthLabel}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-bold ${item.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatBRL(item.netResult)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {item.accumulatedLossPrevious > 0 ? formatBRL(item.accumulatedLossPrevious) : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                        {item.lossCompensated > 0 ? `-${formatBRL(item.lossCompensated)}` : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-white font-semibold">
                        {item.taxBase > 0 ? formatBRL(item.taxBase) : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-sky-400">
                        {item.irrfDayTrade > 0 ? `-${formatBRL(item.irrfDayTrade)}` : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                        {item.darfDue > 0 ? formatBRL(item.darfDue) : 'R$ 0,00'}
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-200">
                        {item.dueDateFormatted}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'PAGO' ? (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            PAGO
                          </span>
                        ) : item.status === 'VENCIDO' ? (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            VENCIDO
                          </span>
                        ) : item.status === 'A_VENCER' ? (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            A VENCER
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            ISENTO
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCalculationModalItem(item)}
                            className="px-2 py-1 rounded text-[11px] font-sans font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ver memória de cálculo desta DARF"
                          >
                            <Calculator className="h-3 w-3" />
                            <span>Cálculo</span>
                          </button>

                          {item.darfDue > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedGuideItem(item)}
                                className="px-2 py-1 rounded text-[11px] font-sans font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                              >
                                Guia
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePaid(item.monthKey)}
                                className={`px-2 py-1 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                                  item.isPaid
                                    ? 'text-slate-400 hover:text-white'
                                    : 'text-emerald-400 hover:underline font-bold'
                                }`}
                              >
                                {item.isPaid ? 'Desmarcar' : 'Pagar'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                      Nenhuma operação de trade registrada para apuração.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: FICHA ANUAL IRPF */}
      {activeSubTab === 'irpf' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <span>Dados Consolidados para a Declaração de Ajuste Anual (IRPF)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ficha: <strong>Renda Variável &gt; Operações Comuns / Day-Trade &gt; Mercado Futuro</strong> (WIN e WDO)
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 self-start sm:self-auto"
            >
              Imprimir Ficha IRPF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Mês</th>
                  <th className="py-2.5 px-3 text-right">Mercado Futuro (Day-Trade)</th>
                  <th className="py-2.5 px-3 text-right">Resultado Líquido do Mês</th>
                  <th className="py-2.5 px-3 text-right">Prejuízo a Compensar</th>
                  <th className="py-2.5 px-3 text-right">Base de Cálculo</th>
                  <th className="py-2.5 px-3 text-right">Imposto Devido (20%)</th>
                  <th className="py-2.5 px-3 text-right">IRRF Day-Trade (1%)</th>
                  <th className="py-2.5 px-3 text-right">Imposto Pago (DARF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedTableApuracoes.map((item) => (
                  <tr key={item.monthKey} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-sans font-semibold text-white">{item.monthLabel}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{formatBRL(item.netResult)}</td>
                    <td className={`py-2 px-3 text-right font-bold ${item.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatBRL(item.netResult)}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-400">
                      {item.lossCompensated > 0 ? `-${formatBRL(item.lossCompensated)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-white">{formatBRL(item.taxBase)}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{formatBRL(item.irGross)}</td>
                    <td className="py-2 px-3 text-right text-sky-400">
                      {item.irrfDayTrade > 0 ? formatBRL(item.irrfDayTrade) : '0,00'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {item.isPaid ? formatBRL(item.darfDue) : '0,00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DARF Guide Modal */}
      <DarfGuideModal
        isOpen={selectedGuideItem !== null}
        onClose={() => setSelectedGuideItem(null)}
        item={selectedGuideItem}
        onTogglePaid={handleTogglePaid}
      />

      {/* DARF Calculation Breakdown Modal */}
      <DarfCalculationBreakdownModal
        isOpen={calculationModalItem !== null}
        onClose={() => setCalculationModalItem(null)}
        item={calculationModalItem}
        onOpenGuide={(item) => setSelectedGuideItem(item)}
      />
    </div>
  );
};
