import React, { useState } from 'react';
import { MonthlyTaxApuracao } from '../types';
import { formatBRL } from '../utils/calculations';
import { DarfCalculationBreakdownModal } from './DarfCalculationBreakdownModal';
import { 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Receipt,
  Sparkles,
  Info,
  Calculator,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Filter
} from 'lucide-react';

interface DarfCalendarProps {
  monthlyApuracoes: MonthlyTaxApuracao[];
  onOpenGuide: (item: MonthlyTaxApuracao) => void;
  onTogglePaid: (monthKey: string) => void;
}

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DarfCalendar: React.FC<DarfCalendarProps> = ({
  monthlyApuracoes,
  onOpenGuide,
  onTogglePaid,
}) => {
  // Available years from the trades or default to current year
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    monthlyApuracoes.forEach((item) => yearsSet.add(item.year));
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => b - a); // descending
  }, [monthlyApuracoes]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears[0] || new Date().getFullYear();
  });

  const [calculationModalItem, setCalculationModalItem] = useState<MonthlyTaxApuracao | null>(null);

  // Sorting filter states: 'desc' (Decrescente) or 'asc' (Crescente)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [sortBy, setSortBy] = useState<'month' | 'darf' | 'profit' | 'dueDate'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'trades' | 'darf'>('all');

  // Map monthly data for fast lookup by month number (1-12)
  const apuracaoByMonth = React.useMemo(() => {
    const map: Record<number, MonthlyTaxApuracao> = {};
    monthlyApuracoes
      .filter((item) => item.year === selectedYear)
      .forEach((item) => {
        map[item.month] = item;
      });
    return map;
  }, [monthlyApuracoes, selectedYear]);

  // Sorted list of months according to sortOrder (Crescente / Decrescente) and sortBy
  const sortedMonthEntries = React.useMemo(() => {
    let list = MONTH_NAMES_FULL.map((name, idx) => ({
      name,
      monthNum: idx + 1,
      item: apuracaoByMonth[idx + 1] || null,
    }));

    if (filterStatus === 'trades') {
      list = list.filter((m) => !!m.item && m.item.totalTrades > 0);
    } else if (filterStatus === 'darf') {
      list = list.filter((m) => !!m.item && m.item.darfDue > 0);
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'month') {
        comp = a.monthNum - b.monthNum;
      } else if (sortBy === 'darf') {
        const valA = a.item?.darfDue || 0;
        const valB = b.item?.darfDue || 0;
        comp = valA - valB;
        if (comp === 0) comp = a.monthNum - b.monthNum;
      } else if (sortBy === 'profit') {
        const valA = a.item?.netResult || 0;
        const valB = b.item?.netResult || 0;
        comp = valA - valB;
        if (comp === 0) comp = a.monthNum - b.monthNum;
      } else if (sortBy === 'dueDate') {
        const dateA = a.item?.dueDate || '';
        const dateB = b.item?.dueDate || '';
        comp = dateA.localeCompare(dateB);
        if (comp === 0) comp = a.monthNum - b.monthNum;
      }

      return sortOrder === 'desc' ? -comp : comp;
    });

    return list;
  }, [apuracaoByMonth, sortBy, sortOrder, filterStatus]);

  // Year statistics
  const yearStats = React.useMemo(() => {
    let yearDarfTotal = 0;
    let yearDarfPaid = 0;
    let yearDarfPending = 0;
    let yearNetProfit = 0;
    let monthsWithProfits = 0;

    Object.values(apuracaoByMonth).forEach((item) => {
      yearNetProfit += item.netResult;
      if (item.netResult > 0) monthsWithProfits += 1;
      if (item.darfDue > 0) {
        yearDarfTotal += item.darfDue;
        if (item.isPaid) {
          yearDarfPaid += item.darfDue;
        } else {
          yearDarfPending += item.darfDue;
        }
      }
    });

    return {
      yearDarfTotal,
      yearDarfPaid,
      yearDarfPending,
      yearNetProfit,
      monthsWithProfits,
    };
  }, [apuracaoByMonth]);

  // Find next upcoming DARF deadline in the year
  const upcomingDeadline = React.useMemo(() => {
    return Object.values(apuracaoByMonth)
      .filter((item) => item.darfDue > 0 && !item.isPaid && !item.isOverdue)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null;
  }, [apuracaoByMonth]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Year Switcher */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Calendário de DARF Day Trade
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Alíquota 20%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Datas limites de pagamento calculadas oficialmente (último dia útil do mês subsequente) com histórico de lucros.
              </p>
            </div>
          </div>

          {/* Year selector buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-sm font-bold text-white font-mono">
              Ano {selectedYear}
            </span>

            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Próximo ano"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Year Summary Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] text-slate-400 block">Total DARF Apurada ({selectedYear}):</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {formatBRL(yearStats.yearDarfTotal)}
            </span>
            <span className="text-[10px] text-slate-500 block">Soma dos meses tributáveis</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] text-slate-400 block">DARF Paga / Quitada:</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {formatBRL(yearStats.yearDarfPaid)}
            </span>
            <span className="text-[10px] text-emerald-500/80 block">Comprovada em dia</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] text-slate-400 block">DARF a Pagar / Pendente:</span>
            <span className={`text-sm sm:text-base font-bold font-mono ${yearStats.yearDarfPending > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {formatBRL(yearStats.yearDarfPending)}
            </span>
            <span className="text-[10px] text-slate-500 block">Aguardando liquidação</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] text-slate-400 block">Resultado Anual Líquido:</span>
            <span className={`text-sm sm:text-base font-bold font-mono ${yearStats.yearNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(yearStats.yearNetProfit)}
            </span>
            <span className="text-[10px] text-slate-500 block">{yearStats.monthsWithProfits} meses no lucro</span>
          </div>
        </div>

        {/* Dynamic Attention Alert: Upcoming Deadline Banner */}
        {upcomingDeadline && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5 sm:mt-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  Próxima Data Limite de DARF: {upcomingDeadline.dueDateFormatted} ({upcomingDeadline.monthLabel})
                </span>
                <span className="text-[11px] text-slate-300">
                  Imposto apurado de <strong className="text-white font-mono">{formatBRL(upcomingDeadline.darfDue)}</strong>. Restam{' '}
                  <strong className="text-amber-300 font-mono">{upcomingDeadline.daysUntilDue} dias</strong> para pagar sem multa pelo SicalcWeb (Código 6015).
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenGuide(upcomingDeadline)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ver Guia DARF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sorting & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            <span>Filtro:</span>
          </span>
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos (12)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('trades')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === 'trades'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Com Trades
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('darf')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === 'darf'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DARF a Pagar
            </button>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
              <span>Organizar por:</span>
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-2.5 text-xs text-slate-200 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="month">Mês (Calendário)</option>
              <option value="darf">Valor da DARF</option>
              <option value="profit">Resultado Líquido</option>
              <option value="dueDate">Data de Vencimento</option>
            </select>
          </div>

          {/* Descending / Ascending Filter Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setSortOrder('desc')}
              title="Ordem Decrescente (Maior para menor / Dezembro para Janeiro / Mais recentes primeiro)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'desc'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              <span>Decrescente</span>
              <span className="text-[10px] font-mono opacity-80">(Z-A / Maior)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOrder('asc')}
              title="Ordem Crescente (Menor para maior / Janeiro para Dezembro / Mais antigos primeiro)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'asc'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpWideNarrow className="h-3.5 w-3.5" />
              <span>Crescente</span>
              <span className="text-[10px] font-mono opacity-80">(A-Z / Menor)</span>
            </button>
          </div>
        </div>
      </div>

      {sortedMonthEntries.length === 0 && (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          Nenhum mês corresponde ao filtro de status selecionado.
        </div>
      )}

      {/* 12-Month DARF Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {sortedMonthEntries.map(({ name: monthName, monthNum, item }) => {
          const hasTrades = !!item && item.totalTrades > 0;

          // Status & Visuals
          let badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
          let badgeText = 'SEM REGISTRO';
          let cardBorder = 'border-slate-800';

          if (hasTrades) {
            if (item.darfDue > 0) {
              if (item.isPaid) {
                badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                badgeText = 'DARF PAGA';
                cardBorder = 'border-emerald-500/40 bg-emerald-950/10';
              } else if (item.isOverdue) {
                badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                badgeText = 'VENCIDA';
                cardBorder = 'border-rose-500/40 bg-rose-950/10 ring-1 ring-rose-500/20';
              } else {
                badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
                badgeText = 'A VENCER';
                cardBorder = 'border-amber-500/40 bg-amber-950/10 ring-1 ring-amber-500/20';
              }
            } else if (item.netResult > 0) {
              badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
              badgeText = 'ISENTO / PREJUÍZO COMPENSADO';
            } else {
              badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
              badgeText = 'PREJUÍZO ACUMULADO';
            }
          }

          return (
            <div
              key={monthNum}
              onClick={() => hasTrades && setCalculationModalItem(item)}
              title={hasTrades ? "Clique para ver o passo a passo de como foi calculado esse valor" : undefined}
              className={`rounded-xl border p-4 bg-slate-900/90 shadow-md flex flex-col justify-between gap-3 transition-all ${
                hasTrades ? 'cursor-pointer hover:border-amber-500/60 hover:bg-slate-900 group ring-1 ring-transparent hover:ring-amber-500/20' : ''
              } ${cardBorder}`}
            >
              {/* Card Header: Month + Status Badge */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white font-sans group-hover:text-amber-300 transition-colors">
                      {monthName}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                {/* Main DARF Amount Display */}
                <div className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Valor da DARF Apurada
                    </span>
                    {hasTrades && (
                      <span className="text-[10px] text-amber-400/90 group-hover:text-amber-300 flex items-center gap-1 font-medium">
                        <Calculator className="h-3 w-3" /> Ver cálculo
                      </span>
                    )}
                  </div>
                  
                  {hasTrades ? (
                    item.darfDue > 0 ? (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 group-hover:text-amber-300 transition-colors">
                            {formatBRL(item.darfDue)}
                          </span>
                          {item.isPaid && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Pago
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          Clique no card para ver o passo a passo
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-base font-bold font-mono text-slate-400 block">
                          R$ 0,00 <span className="text-xs font-normal text-slate-500">(Sem imposto devido)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          Clique para ver a regra de isenção/compensação
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-sm font-mono text-slate-500 block italic">
                      Nenhuma operação registrada
                    </span>
                  )}

                  {/* Financial breakdown details */}
                  {hasTrades && (
                    <div className="pt-2 grid grid-cols-2 gap-1.5 text-[11px] font-mono border-t border-slate-800/60 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Lucro Mês:</span>
                        <span className={item.netResult >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {formatBRL(item.netResult)}
                        </span>
                      </div>

                      {item.lossCompensated > 0 ? (
                        <div>
                          <span className="text-[10px] text-slate-500 block font-sans">Compensado:</span>
                          <span className="text-amber-400 font-bold">-{formatBRL(item.lossCompensated)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-500 block font-sans">Base IR (20%):</span>
                          <span className="text-slate-200 font-bold">{formatBRL(item.taxBase)}</span>
                        </div>
                      )}

                      {item.irrfDayTrade > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 block font-sans">IRRF 1% Deduzido:</span>
                          <span className="text-sky-300 font-bold">-{formatBRL(item.irrfDayTrade)}</span>
                        </div>
                      )}

                      {item.accumulatedLossRemaining > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 block font-sans">Prej. a Abater:</span>
                          <span className="text-rose-300 font-bold">{formatBRL(item.accumulatedLossRemaining)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Due Date + Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                {hasTrades ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span>Data Limite:</span>
                      </span>
                      <strong className="text-white font-mono">{item.dueDateFormatted}</strong>
                    </div>

                    {item.darfDue > 0 && (
                      <div className="text-[10px] font-mono flex items-center justify-between text-slate-400">
                        {item.isPaid ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Quitado
                          </span>
                        ) : item.isOverdue ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Venceu há {Math.abs(item.daysUntilDue)} dias
                          </span>
                        ) : (
                          <span className="text-amber-300 font-bold">
                            Faltam {item.daysUntilDue} dias para pagar
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePaid(item.monthKey);
                          }}
                          className={`hover:underline cursor-pointer ${
                            item.isPaid ? 'text-slate-400' : 'text-emerald-400 font-bold'
                          }`}
                        >
                          {item.isPaid ? 'Desmarcar' : 'Marcar Pago'}
                        </button>
                      </div>
                    )}

                    {/* How it was calculated button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalculationModalItem(item);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Calculator className="h-3.5 w-3.5 text-amber-400" />
                      <span>Como foi feito o cálculo?</span>
                    </button>

                    {item.darfDue > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGuide(item);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
                      >
                        <Receipt className="h-3.5 w-3.5 text-amber-400" />
                        <span>Gerar Guia & Dados Sicalc</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] text-slate-500 italic py-1 text-center">
                    Sem movimentação financeira
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informative Guidance Section */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-bold text-white">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Regras Oficiais da Receita Federal para DARF Day Trade (Código 6015):</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
          <li>
            <strong>Alíquota:</strong> 20% sobre o lucro líquido mensal apurado em operações de Day Trade (WIN, WDO, ações, etc.). Não há isenção de R$ 20.000 (isenção é exclusiva para Swing Trade em ações).
          </li>
          <li>
            <strong>Vencimento:</strong> O imposto deve ser pago impreterivelmente até o <strong>último dia útil do mês subsequente</strong> ao da apuração (o calendário acima já antecipa fins de semana e feriados bancários).
          </li>
          <li>
            <strong>Compensação de Prejuízos:</strong> Prejuízos apurados em Day Trade podem ser deduzidos de lucros futuros de Day Trade indefinidamente, sem prazo de expiração.
          </li>
          <li>
            <strong>Dedução de IRRF ("Dedo-duro"):</strong> O 1% de imposto retido na fonte pela corretora nos dias com resultado positivo pode ser abatido diretamente do total de IR a pagar.
          </li>
          <li>
            <strong>Limite Mínimo de R$ 10,00:</strong> Não se emite DARF com valor inferior a R$ 10,00. Valores menores acumulam para o mês seguinte até atingir o limite.
          </li>
        </ul>
      </div>

      {/* Calculation Breakdown Modal */}
      <DarfCalculationBreakdownModal
        isOpen={calculationModalItem !== null}
        onClose={() => setCalculationModalItem(null)}
        item={calculationModalItem}
        onOpenGuide={onOpenGuide}
      />
    </div>
  );
};
