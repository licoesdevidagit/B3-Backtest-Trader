import React, { useState, useEffect, useMemo } from 'react';
import { Trade } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Edit3, 
  Check, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

interface DailyGoalCardProps {
  trades: Trade[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onOpenCertificates?: () => void;
}

const STORAGE_KEY_DAILY_GOAL = 'b3_daily_goal_v1';

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  trades,
  selectedDate: externalSelectedDate,
  onSelectDate,
  onOpenCertificates,
}) => {
  // Load daily goal from localStorage (default: R$ 300,00)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_GOAL);
      return saved ? parseFloat(saved) || 300 : 300;
    } catch (e) {
      return 300;
    }
  });

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(() => String(dailyGoal));

  // Determine latest traded date or today
  const latestTradeDate = useMemo(() => {
    if (trades.length === 0) {
      return new Date().toISOString().split('T')[0];
    }
    const dates = [...new Set(trades.map((t) => t.date))].sort();
    return dates[dates.length - 1] || new Date().toISOString().split('T')[0];
  }, [trades]);

  // Internal selected date if not externally controlled
  const [internalDate, setInternalDate] = useState<string>(() => latestTradeDate);
  const currentDate = externalSelectedDate || internalDate;

  const setCurrentDate = (d: string) => {
    setInternalDate(d);
    if (onSelectDate) {
      onSelectDate(d);
    }
  };

  // Sync with latestTradeDate when trades change initially
  useEffect(() => {
    if (!externalSelectedDate && trades.length > 0) {
      setInternalDate(latestTradeDate);
    }
  }, [latestTradeDate, externalSelectedDate, trades.length]);

  // Save daily goal to localStorage
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val);
      try {
        localStorage.setItem(STORAGE_KEY_DAILY_GOAL, String(val));
      } catch (err) {
        console.error('Failed to save daily goal', err);
      }
    }
    setIsEditingGoal(false);
  };

  // Calculate stats for the selected date
  const dayTrades = useMemo(() => {
    return trades.filter((t) => t.date === currentDate);
  }, [trades, currentDate]);

  const dayProfit = useMemo(() => {
    return dayTrades.reduce((acc, t) => acc + t.financialValue, 0);
  }, [dayTrades]);

  const dayWins = dayTrades.filter((t) => t.result === 'GAIN').length;
  const dayLosses = dayTrades.filter((t) => t.result === 'LOSS').length;
  const dayBreakevens = dayTrades.filter((t) => t.result === 'BREAKEVEN').length;

  const isGoalReached = dailyGoal > 0 && dayProfit >= dailyGoal;
  const progressRatio = dailyGoal > 0 ? (dayProfit / dailyGoal) : 0;
  const progressPercent = Math.max(0, Math.min(100, progressRatio * 100));

  // Step dates (navigate backtest days)
  const stepDay = (offsetDays: number) => {
    try {
      const d = new Date(currentDate + 'T12:00:00');
      d.setDate(d.getDate() + offsetDays);
      setCurrentDate(d.toISOString().split('T')[0]);
    } catch (e) {
      // fallback
    }
  };

  // Overall Backtest Daily Consistency: how many unique days reached the goal
  const consistencyStats = useMemo(() => {
    const dailyMap = new Map<string, number>();
    for (const t of trades) {
      dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.financialValue);
    }

    const totalDays = dailyMap.size;
    let daysGoalHit = 0;
    let positiveDays = 0;

    dailyMap.forEach((profit) => {
      if (profit >= dailyGoal) daysGoalHit++;
      if (profit > 0) positiveDays++;
    });

    const goalHitRate = totalDays > 0 ? (daysGoalHit / totalDays) * 100 : 0;

    return {
      totalDays,
      daysGoalHit,
      positiveDays,
      goalHitRate,
    };
  }, [trades, dailyGoal]);

  // Format date display (DD/MM/AAAA)
  const formatDateBR = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
      {/* Decorative background glow when goal reached */}
      {isGoalReached && (
        <div className="absolute top-0 right-0 w-80 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg border shadow-sm transition-colors ${
              isGoalReached
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/30'
                : dayProfit < 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Meta Financeira Diária</span>
              </h3>
              {isGoalReached ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-slate-950 shadow-sm animate-fade-in font-mono">
                  <Sparkles className="h-3 w-3" />
                  META BATIDA!
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  {progressRatio > 0 ? `${(progressRatio * 100).toFixed(0)}% concluída` : 'Acompanhamento'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina seu alvo financeiro diário e acompanhe o progresso em tempo real em cada pregão.
            </p>
          </div>
        </div>

        {/* Date Navigator for the goal */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs self-start sm:self-auto font-mono">
          <button
            type="button"
            onClick={() => stepDay(-1)}
            title="Dia anterior"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <span className="px-1.5 font-semibold text-slate-200">
            {formatDateBR(currentDate)}
          </span>

          <button
            type="button"
            onClick={() => stepDay(1)}
            title="Próximo dia"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            title="Ir para data de hoje"
            className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-emerald-400 hover:bg-slate-800 transition-colors border border-slate-800"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Main Stats and Progress Bar */}
      <div className="mt-4 space-y-3">
        {/* Numbers Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Target Value Card */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Meta do Dia
              </span>
              {isEditingGoal ? (
                <form onSubmit={handleSaveGoal} className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">R$</span>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    autoFocus
                    className="w-24 h-7 rounded border border-emerald-500 bg-slate-900 px-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    title="Salvar meta"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
                    {formatBRL(dailyGoal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGoalInput(String(dailyGoal));
                      setIsEditingGoal(true);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Alterar valor da meta diária"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <Target className="h-6 w-6 text-slate-600" />
          </div>

          {/* Current Day Result Card */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Resultado em {formatDateBR(currentDate)}
              </span>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-0.5 tabular-nums ${
                  dayProfit > 0
                    ? 'text-emerald-400'
                    : dayProfit < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {dayTrades.length > 0 ? formatBRL(dayProfit) : 'R$ 0,00'}
              </div>
              <span className="text-[11px] font-mono text-slate-400 block">
                {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'} ({dayWins}G / {dayLosses}L{dayBreakevens > 0 ? ` / ${dayBreakevens}E` : ''})
              </span>
            </div>
            <TrendingUp
              className={`h-6 w-6 ${
                dayProfit > 0
                  ? 'text-emerald-500/60'
                  : dayProfit < 0
                  ? 'text-rose-500/60'
                  : 'text-slate-600'
              }`}
            />
          </div>

          {/* Remaining / Surplus Card */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Status da Meta
              </span>
              {isGoalReached ? (
                <div className="mt-0.5">
                  <span className="text-sm font-bold font-mono text-emerald-400 block">
                    +{formatBRL(dayProfit - dailyGoal)} excedente
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {(progressRatio * 100).toFixed(0)}% da meta batida!
                  </span>
                </div>
              ) : dayProfit < 0 ? (
                <div className="mt-0.5">
                  <span className="text-sm font-bold font-mono text-rose-400 block">
                    Dia negativo
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Atenção ao gerenciamento de risco
                  </span>
                </div>
              ) : (
                <div className="mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200 block">
                    Faltam {formatBRL(Math.max(0, dailyGoal - dayProfit))}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {progressPercent.toFixed(0)}% atingido
                  </span>
                </div>
              )}
            </div>
            {isGoalReached ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400 animate-bounce" />
            ) : dayProfit < 0 ? (
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            ) : (
              <Clock className="h-6 w-6 text-sky-400" />
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Progresso Visual:</span>
              <strong className={isGoalReached ? 'text-emerald-400' : 'text-slate-200'}>
                {dayProfit > 0 ? `${(progressRatio * 100).toFixed(1)}%` : '0%'}
              </strong>
            </span>
            <span className="text-slate-400">
              Alvo: <strong className="text-emerald-400">{formatBRL(dailyGoal)}</strong>
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-sm shadow-emerald-500/50'
                  : dayProfit < 0
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
            />
          </div>
        </div>

        {/* Consistency Footnote across all backtest days */}
        {consistencyStats.totalDays > 0 && (
          <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                Consistência Geral: <strong className="text-white">{consistencyStats.daysGoalHit}</strong> de <strong className="text-white">{consistencyStats.totalDays}</strong> dias com meta batida ({consistencyStats.goalHitRate.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Dias no positivo: <strong className="text-emerald-400">{consistencyStats.positiveDays} dias</strong>
              </span>
              {onOpenCertificates && (
                <button
                  type="button"
                  onClick={onOpenCertificates}
                  className="text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Ver Metas & Certificados</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
