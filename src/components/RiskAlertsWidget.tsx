import React, { useState, useMemo, useEffect } from 'react';
import { Trade } from '../types';
import { formatBRL, formatDateBR } from '../utils/calculations';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Sliders, 
  Lock, 
  Unlock, 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Zap, 
  Calendar, 
  Clock, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';

interface RiskAlertsWidgetProps {
  trades: Trade[];
  initialCapital?: number;
  onOpenNewTrade?: () => void;
  onNavigateToCharts?: () => void;
}

const STORAGE_KEY_RISK_SETTINGS = 'b3_risk_management_settings_v1';

export interface RiskManagementSettings {
  limitMode: 'fixed' | 'percent'; // R$ fixo ou % do capital inicial
  dailyLossLimitFixed: number; // Ex: R$ 250,00
  dailyLossLimitPercent: number; // Ex: 3.0%
  weeklyLossLimitFixed: number; // Ex: R$ 750,00
  weeklyLossLimitPercent: number; // Ex: 8.0%
  maxConsecutiveLosses: number; // Ex: 3 stops seguidos
  maxTradesPerDay: number; // Ex: 5 trades
  soundAlertsEnabled: boolean;
  preservationLockedDates: string[]; // datas em que o trader ativou o bloqueio de preservação
}

const DEFAULT_SETTINGS: RiskManagementSettings = {
  limitMode: 'fixed',
  dailyLossLimitFixed: 300,
  dailyLossLimitPercent: 3.0,
  weeklyLossLimitFixed: 900,
  weeklyLossLimitPercent: 8.0,
  maxConsecutiveLosses: 3,
  maxTradesPerDay: 6,
  soundAlertsEnabled: true,
  preservationLockedDates: [],
};

// Helper to determine the week range (Monday to Sunday) for a date string YYYY-MM-DD
function getWeekRange(dateStr: string): { start: string; end: string; mondayDate: Date; fridayDate: Date } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const start = monday.toISOString().split('T')[0];
  const end = sunday.toISOString().split('T')[0];

  return { start, end, mondayDate: monday, fridayDate: friday };
}

export const RiskAlertsWidget: React.FC<RiskAlertsWidgetProps> = ({
  trades,
  initialCapital = 1000,
  onOpenNewTrade,
  onNavigateToCharts,
}) => {
  // Load settings from localStorage
  const [settings, setSettings] = useState<RiskManagementSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [simulatedBreach, setSimulatedBreach] = useState<'none' | 'daily' | 'weekly'>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'rules'>('status');

  // Form state for config modal
  const [tempSettings, setTempSettings] = useState<RiskManagementSettings>(settings);

  // Sync temp settings when modal opens
  useEffect(() => {
    if (isConfigModalOpen) {
      setTempSettings(settings);
    }
  }, [isConfigModalOpen, settings]);

  const saveSettings = (newSettings: RiskManagementSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_RISK_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save risk settings', e);
    }
  };

  // Determine current active date (latest traded date or today)
  const allDates = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.date))).filter(Boolean).sort();
  }, [trades]);

  const latestDate = allDates.length > 0 ? allDates[allDates.length - 1] : new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(latestDate);

  // Sync selected date when latest date updates
  useEffect(() => {
    if (allDates.length > 0 && !allDates.includes(selectedDate)) {
      setSelectedDate(allDates[allDates.length - 1]);
    }
  }, [allDates, selectedDate]);

  // Calculate effective limits based on mode (fixed R$ or % of capital)
  const effectiveDailyLimit = useMemo(() => {
    if (settings.limitMode === 'percent') {
      return (initialCapital * settings.dailyLossLimitPercent) / 100;
    }
    return settings.dailyLossLimitFixed;
  }, [settings, initialCapital]);

  const effectiveWeeklyLimit = useMemo(() => {
    if (settings.limitMode === 'percent') {
      return (initialCapital * settings.weeklyLossLimitPercent) / 100;
    }
    return settings.weeklyLossLimitFixed;
  }, [settings, initialCapital]);

  // Current day analysis
  const dayStats = useMemo(() => {
    const dayTrades = trades.filter((t) => t.date === selectedDate);
    const count = dayTrades.length;
    let netPnl = 0;
    let maxDrawdownIntraday = 0;
    let peakPnl = 0;
    let runningPnl = 0;
    let wins = 0;
    let losses = 0;

    // Consecutive losses calculation
    let currentLossStreak = 0;
    let maxLossStreakInDay = 0;

    // Sort chronologically
    const sorted = [...dayTrades].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    sorted.forEach((t) => {
      const val = t.financialValue || 0;
      netPnl += val;
      runningPnl += val;

      if (runningPnl > peakPnl) {
        peakPnl = runningPnl;
      }
      const dd = Math.max(0, peakPnl - runningPnl);
      if (dd > maxDrawdownIntraday) {
        maxDrawdownIntraday = dd;
      }

      if (t.result === 'GAIN') {
        wins++;
        currentLossStreak = 0;
      } else if (t.result === 'LOSS') {
        losses++;
        currentLossStreak++;
        if (currentLossStreak > maxLossStreakInDay) {
          maxLossStreakInDay = currentLossStreak;
        }
      }
    });

    // The loss amount considered for the stop limit:
    // If net PnL is negative, that's the day's net loss. We also check intraday max drawdown.
    const currentLoss = netPnl < 0 ? Math.abs(netPnl) : 0;
    const lossToCompare = Math.max(currentLoss, maxDrawdownIntraday);

    const isSimulated = simulatedBreach === 'daily';
    const finalLoss = isSimulated ? effectiveDailyLimit * 1.15 : currentLoss;
    const percentConsumed = effectiveDailyLimit > 0 ? (finalLoss / effectiveDailyLimit) * 100 : 0;

    let status: 'SAFE' | 'WARNING' | 'BREACHED' = 'SAFE';
    if (finalLoss >= effectiveDailyLimit || isSimulated) {
      status = 'BREACHED';
    } else if (percentConsumed >= 70) {
      status = 'WARNING';
    }

    const isConsecutiveStreakBreached = maxLossStreakInDay >= settings.maxConsecutiveLosses;
    const isOvertradingBreached = count >= settings.maxTradesPerDay;

    return {
      date: selectedDate,
      count,
      netPnl: isSimulated ? -effectiveDailyLimit * 1.15 : netPnl,
      currentLoss: finalLoss,
      maxDrawdownIntraday,
      wins,
      losses,
      maxLossStreakInDay,
      percentConsumed: Math.min(200, percentConsumed),
      status,
      isConsecutiveStreakBreached,
      isOvertradingBreached,
    };
  }, [trades, selectedDate, effectiveDailyLimit, simulatedBreach, settings.maxConsecutiveLosses, settings.maxTradesPerDay]);

  // Current week analysis
  const weekStats = useMemo(() => {
    const { start, end } = getWeekRange(selectedDate);
    const weekTrades = trades.filter((t) => t.date >= start && t.date <= end);
    const count = weekTrades.length;

    let netPnl = 0;
    let peakPnl = 0;
    let runningPnl = 0;
    let maxDrawdownInWeek = 0;

    // Group by day to compute daily progression in week
    const dailyMap: Record<string, number> = {};
    weekTrades.forEach((t) => {
      const val = t.financialValue || 0;
      dailyMap[t.date] = (dailyMap[t.date] || 0) + val;
    });

    const sortedDates = Object.keys(dailyMap).sort();
    sortedDates.forEach((d) => {
      const dayNet = dailyMap[d];
      netPnl += dayNet;
      runningPnl += dayNet;
      if (runningPnl > peakPnl) {
        peakPnl = runningPnl;
      }
      const dd = Math.max(0, peakPnl - runningPnl);
      if (dd > maxDrawdownInWeek) {
        maxDrawdownInWeek = dd;
      }
    });

    const currentLoss = netPnl < 0 ? Math.abs(netPnl) : 0;
    const isSimulated = simulatedBreach === 'weekly';
    const finalLoss = isSimulated ? effectiveWeeklyLimit * 1.1 : currentLoss;
    const percentConsumed = effectiveWeeklyLimit > 0 ? (finalLoss / effectiveWeeklyLimit) * 100 : 0;

    let status: 'SAFE' | 'WARNING' | 'BREACHED' = 'SAFE';
    if (finalLoss >= effectiveWeeklyLimit || isSimulated) {
      status = 'BREACHED';
    } else if (percentConsumed >= 70) {
      status = 'WARNING';
    }

    return {
      startDate: start,
      endDate: end,
      count,
      daysOperated: sortedDates.length,
      netPnl: isSimulated ? -effectiveWeeklyLimit * 1.1 : netPnl,
      currentLoss: finalLoss,
      maxDrawdownInWeek,
      percentConsumed: Math.min(200, percentConsumed),
      status,
    };
  }, [trades, selectedDate, effectiveWeeklyLimit, simulatedBreach]);

  // Check if current day has Capital Preservation Lock engaged
  const isDateLocked = settings.preservationLockedDates.includes(selectedDate);

  const togglePreservationLock = () => {
    let next: string[];
    if (isDateLocked) {
      next = settings.preservationLockedDates.filter((d) => d !== selectedDate);
    } else {
      next = [...settings.preservationLockedDates, selectedDate];
    }
    saveSettings({ ...settings, preservationLockedDates: next });
  };

  // Recent 7 days risk compliance history
  const recentDaysHistory = useMemo(() => {
    const dates = [...allDates].slice(-7).reverse();
    return dates.map((d) => {
      const dayTrades = trades.filter((t) => t.date === d);
      const net = dayTrades.reduce((acc, t) => acc + (t.financialValue || 0), 0);
      const loss = net < 0 ? Math.abs(net) : 0;
      const pct = (loss / effectiveDailyLimit) * 100;
      const isBreached = loss >= effectiveDailyLimit;
      const isWarning = pct >= 70 && !isBreached;
      const wasLocked = settings.preservationLockedDates.includes(d);

      return {
        date: d,
        tradesCount: dayTrades.length,
        net,
        loss,
        percentConsumed: pct,
        isBreached,
        isWarning,
        wasLocked,
      };
    });
  }, [allDates, trades, effectiveDailyLimit, settings.preservationLockedDates]);

  // Calculate Overall Risk Discipline Score (% of days where daily limit was respected)
  const disciplineScore = useMemo(() => {
    if (allDates.length === 0) return 100;
    let safeDays = 0;
    allDates.forEach((d) => {
      const dayTrades = trades.filter((t) => t.date === d);
      const net = dayTrades.reduce((acc, t) => acc + (t.financialValue || 0), 0);
      if (net >= 0 || Math.abs(net) <= effectiveDailyLimit) {
        safeDays++;
      }
    });
    return Math.round((safeDays / allDates.length) * 100);
  }, [allDates, trades, effectiveDailyLimit]);

  // Apply Quick Presets
  const applyPreset = (preset: 'conservative' | 'moderate' | 'aggressive') => {
    if (preset === 'conservative') {
      setTempSettings({
        ...tempSettings,
        limitMode: 'percent',
        dailyLossLimitPercent: 1.5,
        weeklyLossLimitPercent: 4.0,
        dailyLossLimitFixed: Math.round(initialCapital * 0.015),
        weeklyLossLimitFixed: Math.round(initialCapital * 0.04),
        maxConsecutiveLosses: 2,
        maxTradesPerDay: 4,
      });
    } else if (preset === 'moderate') {
      setTempSettings({
        ...tempSettings,
        limitMode: 'percent',
        dailyLossLimitPercent: 3.0,
        weeklyLossLimitPercent: 8.0,
        dailyLossLimitFixed: Math.round(initialCapital * 0.03),
        weeklyLossLimitFixed: Math.round(initialCapital * 0.08),
        maxConsecutiveLosses: 3,
        maxTradesPerDay: 6,
      });
    } else {
      setTempSettings({
        ...tempSettings,
        limitMode: 'percent',
        dailyLossLimitPercent: 5.0,
        weeklyLossLimitPercent: 12.0,
        dailyLossLimitFixed: Math.round(initialCapital * 0.05),
        weeklyLossLimitFixed: Math.round(initialCapital * 0.12),
        maxConsecutiveLosses: 4,
        maxTradesPerDay: 8,
      });
    }
  };

  const isAnyBreachActive = dayStats.status === 'BREACHED' || weekStats.status === 'BREACHED';
  const isAnyWarningActive = (dayStats.status === 'WARNING' || weekStats.status === 'WARNING') && !isAnyBreachActive;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 shadow-lg space-y-4 font-sans animate-fade-in relative overflow-hidden">
      {/* Visual Accent glow border when breached */}
      {isAnyBreachActive && (
        <div className="absolute inset-0 border-2 border-rose-500 rounded-xl pointer-events-none animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.3)]" />
      )}

      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border shrink-0 ${
            isAnyBreachActive 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-bounce' 
              : isAnyWarningActive 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Alertas de Gerenciamento de Risco</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isAnyBreachActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : isAnyWarningActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {isAnyBreachActive ? '🛑 STOP VIOLADO' : isAnyWarningActive ? '⚠️ ZONA DE CAUTELA' : '🛡️ RISCO CONTROLADO'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoramento em tempo real de Drawdown Diário e Semanal para preservação de capital na B3.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Selector */}
          {allDates.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-slate-400 hidden md:inline">Pregão:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
              >
                {allDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDateBR(d)} {d === latestDate ? '(Recente)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Test Simulation Trigger */}
          <button
            type="button"
            onClick={() => {
              if (simulatedBreach === 'none') {
                setSimulatedBreach('daily');
              } else if (simulatedBreach === 'daily') {
                setSimulatedBreach('weekly');
              } else {
                setSimulatedBreach('none');
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              simulatedBreach !== 'none'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Simular visualmente um disparo de alarme de risco"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Simular:</span>
            <span>{simulatedBreach === 'none' ? 'Teste' : simulatedBreach === 'daily' ? 'Diário' : 'Semanal'}</span>
          </button>

          {/* Settings Config Modal Button */}
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-750 transition-colors cursor-pointer shadow-sm"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span>Configurar Limites</span>
          </button>
        </div>
      </div>

      {/* 2. PROMINENT BREACH ALERT BANNER (CRITICAL WARNING) */}
      {isAnyBreachActive && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/60 shadow-lg shadow-rose-950/50 space-y-3 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 shadow-md">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-white tracking-tight uppercase">
                    🚨 ALERTA CRÍTICO DE PRESERVAÇÃO DE CAPITAL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
                    {dayStats.status === 'BREACHED' ? 'STOP DIÁRIO ATINGIDO' : 'STOP SEMANAL ATINGIDO'}
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
                  {dayStats.status === 'BREACHED' ? (
                    <>
                      Seu prejuízo no pregão de <strong>{formatDateBR(selectedDate)}</strong> atingiu{' '}
                      <strong className="text-white font-mono">{formatBRL(dayStats.netPnl)}</strong>, ultrapassando o limite diário de{' '}
                      <strong className="text-white font-mono">-{formatBRL(effectiveDailyLimit)}</strong>.
                    </>
                  ) : (
                    <>
                      Seu prejuízo acumulado nesta semana atingiu{' '}
                      <strong className="text-white font-mono">{formatBRL(weekStats.netPnl)}</strong>, ultrapassando o limite semanal de{' '}
                      <strong className="text-white font-mono">-{formatBRL(effectiveWeeklyLimit)}</strong>.
                    </>
                  )}
                  {' '}<strong>Ação Mandatória:</strong> Feche a plataforma imediatamente e não faça novas operações hoje para evitar a perda em cascata (tilt / revenge trade).
                </p>
              </div>
            </div>

            {/* Lock / Protect Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={togglePreservationLock}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isDateLocked
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:from-rose-400 hover:to-amber-400'
                }`}
              >
                {isDateLocked ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <span>{isDateLocked ? 'Modo Preservação Ativo' : 'Ativar Bloqueio de Capital'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TABS NAV (Status Atual vs Histórico vs Regras de Risco) */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'status'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Monitoramento em Tempo Real</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-blue-400" />
          <span>Histórico de Conformidade</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
            {recentDaysHistory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Info className="h-3.5 w-3.5 text-purple-400" />
          <span>Regras de Preservação B3</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: MONITORAMENTO EM TEMPO REAL                            */}
      {/* ===================================================================== */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* Main Gauges Grid: Drawdown Diário vs Drawdown Semanal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: DRAWDOWN DIÁRIO */}
            <div className={`p-4 rounded-xl border transition-all ${
              dayStats.status === 'BREACHED'
                ? 'bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/20'
                : dayStats.status === 'WARNING'
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    dayStats.status === 'BREACHED' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Drawdown Diário (Stop Diário)</span>
                    <span className="text-[10px] text-slate-400">Pregão de {formatDateBR(selectedDate)}</span>
                  </div>
                </div>

                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                  dayStats.status === 'BREACHED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : dayStats.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {dayStats.percentConsumed.toFixed(0)}% do Limite
                </span>
              </div>

              {/* Loss vs Limit numbers */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Resultado do Dia</span>
                  <span className={`text-base font-bold font-mono ${dayStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(dayStats.netPnl)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {dayStats.count} trades ({dayStats.wins}G · {dayStats.losses}L)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Limite Máximo Diário</span>
                  <span className="text-base font-bold font-mono text-white">
                    -{formatBRL(effectiveDailyLimit)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {settings.limitMode === 'percent' ? `${settings.dailyLossLimitPercent}% do Capital` : 'Valor Fixo'}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Daily Loss */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Consumido: {formatBRL(dayStats.currentLoss)}</span>
                  <span>Restante: {formatBRL(Math.max(0, effectiveDailyLimit - dayStats.currentLoss))}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      dayStats.status === 'BREACHED'
                        ? 'bg-rose-500 animate-pulse'
                        : dayStats.status === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, dayStats.percentConsumed)}%` }}
                  />
                  {/* Warning line at 70% */}
                  <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-400/50 pointer-events-none" title="Alerta Cautela (70%)" />
                </div>
              </div>

              {/* Secondary Protections: Consecutive Stops & Overtrading */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-400">Stops Seguidos:</span>
                  <span className={`font-mono font-bold ${dayStats.isConsecutiveStreakBreached ? 'text-rose-400' : 'text-white'}`}>
                    {dayStats.maxLossStreakInDay} / {settings.maxConsecutiveLosses} máx
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Trades/Dia:</span>
                  <span className={`font-mono font-bold ${dayStats.isOvertradingBreached ? 'text-rose-400' : 'text-white'}`}>
                    {dayStats.count} / {settings.maxTradesPerDay} máx
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: DRAWDOWN SEMANAL */}
            <div className={`p-4 rounded-xl border transition-all ${
              weekStats.status === 'BREACHED'
                ? 'bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/20'
                : weekStats.status === 'WARNING'
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    weekStats.status === 'BREACHED' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Drawdown Semanal (Stop Semanal)</span>
                    <span className="text-[10px] text-slate-400">
                      Semana: {formatDateBR(weekStats.startDate)} a {formatDateBR(weekStats.endDate)}
                    </span>
                  </div>
                </div>

                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                  weekStats.status === 'BREACHED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : weekStats.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {weekStats.percentConsumed.toFixed(0)}% do Limite
                </span>
              </div>

              {/* Loss vs Limit numbers */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Líquido da Semana</span>
                  <span className={`text-base font-bold font-mono ${weekStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(weekStats.netPnl)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {weekStats.count} trades em {weekStats.daysOperated} pregões
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Limite Máximo Semanal</span>
                  <span className="text-base font-bold font-mono text-white">
                    -{formatBRL(effectiveWeeklyLimit)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {settings.limitMode === 'percent' ? `${settings.weeklyLossLimitPercent}% do Capital` : 'Valor Fixo'}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Weekly Loss */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Perda Semanal: {formatBRL(weekStats.currentLoss)}</span>
                  <span>Margem Restante: {formatBRL(Math.max(0, effectiveWeeklyLimit - weekStats.currentLoss))}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      weekStats.status === 'BREACHED'
                        ? 'bg-rose-500 animate-pulse'
                        : weekStats.status === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, weekStats.percentConsumed)}%` }}
                  />
                  {/* Warning line at 70% */}
                  <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-400/50 pointer-events-none" title="Alerta Cautela (70%)" />
                </div>
              </div>

              {/* Weekly Advice */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Proteção Semanal:</span>
                <span className="text-slate-300 font-medium">
                  {weekStats.status === 'BREACHED' 
                    ? '⛔ Pare pelo restante da semana!' 
                    : weekStats.status === 'WARNING' 
                    ? '⚠️ Reduza o lote pela metade' 
                    : '✅ Ritmo saudável'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar: Disciplina, Capital Base, Status de Preservação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block font-medium">Índice de Disciplina</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                {disciplineScore}%
              </span>
              <span className="text-[10px] text-slate-500 block">dias dentro do limite</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block font-medium">Capital Base Protegido</span>
              <span className="text-base sm:text-lg font-bold font-mono text-white">
                {formatBRL(initialCapital)}
              </span>
              <span className="text-[10px] text-slate-500 block">saldo inicial da conta</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block font-medium">Bloqueio de Preservação</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isDateLocked ? (
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> ATIVADO
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <Unlock className="h-3 w-3" /> LIBERADO
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={togglePreservationLock}
                className="text-[10px] text-slate-400 hover:text-white underline mt-0.5 block"
              >
                {isDateLocked ? 'Desbloquear hoje' : 'Ativar bloqueio'}
              </button>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block font-medium">Modo de Cálculo</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-purple-300 block mt-0.5">
                {settings.limitMode === 'percent' ? '% do Capital' : 'R$ Valor Fixo'}
              </span>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[10px] text-emerald-400 hover:underline block mt-0.5"
              >
                Alterar parâmetros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: HISTÓRICO DE CONFORMIDADE DOS ÚLTIMOS PREGÕES          */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Registro de Risco dos Últimos {recentDaysHistory.length} Pregões
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Limite diário de referência: -{formatBRL(effectiveDailyLimit)}
            </span>
          </div>

          {recentDaysHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Nenhuma operação registrada no histórico ainda.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Trades</th>
                    <th className="py-2.5 px-3">Resultado (R$)</th>
                    <th className="py-2.5 px-3">% Limite Consumido</th>
                    <th className="py-2.5 px-3">Status de Gestão</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentDaysHistory.map((row) => (
                    <tr 
                      key={row.date} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        row.date === selectedDate ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-white flex items-center gap-1.5">
                        <span>{formatDateBR(row.date)}</span>
                        {row.date === latestDate && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            HOJE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {row.tradesCount}
                      </td>
                      <td className={`py-2.5 px-3 font-mono font-bold ${row.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatBRL(row.net)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${row.isBreached ? 'bg-rose-500' : row.isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, row.percentConsumed)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-300">{row.percentConsumed.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {row.isBreached ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="h-3 w-3" /> Stop Violado
                          </span>
                        ) : row.isWarning ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="h-3 w-3" /> Cautela
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3" /> Risco Respeitado
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(row.date)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 3: REGRAS DE PRESERVAÇÃO DE CAPITAL DA B3                 */}
      {/* ===================================================================== */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Regra do Stop Diário Máximo</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O Stop Diário não pode ultrapassar o valor de <strong>1 a 2 dias normais de meta</strong>. Se a sua meta é R$ 200, seu stop diário deve ser de no máximo R$ 200 a R$ 300 para manter a assimetria matemática positiva.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Trava de Perdas Consecutivas</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tomar <strong>3 stops seguidos</strong> é o gatilho clássico para a entrada no estado de fúria (tilt). A trava automática protege você de devolver o lucro do mês inteiro em 30 minutos de descontrole.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Stop Semanal e Sobrevivência</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Se você bater o Stop Semanal antes de quinta-feira, <strong>não opere na sexta</strong>. A preservação de capital é o que garante que você terá saldo na corretora na segunda-feira seguinte.
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CONFIGURAÇÃO DE LIMITES DE RISCO                             */}
      {/* ===================================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-2xl space-y-4 overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Parâmetros de Gerenciamento de Risco</h3>
                  <p className="text-xs text-slate-400">Defina seus limites de Drawdown e travas operacionais</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Presets de Perfil Operacional:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('conservative')}
                  className="py-1.5 px-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                >
                  Conservador (1.5% / 4%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('moderate')}
                  className="py-1.5 px-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                >
                  Moderado (3% / 8%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('aggressive')}
                  className="py-1.5 px-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                >
                  Agressivo (5% / 12%)
                </button>
              </div>
            </div>

            {/* Mode Selector: R$ fixo vs % do Capital */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Modo de Definição dos Limites:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTempSettings({ ...tempSettings, limitMode: 'fixed' })}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tempSettings.limitMode === 'fixed'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  R$ Valor Fixo por Dia/Semana
                </button>
                <button
                  type="button"
                  onClick={() => setTempSettings({ ...tempSettings, limitMode: 'percent' })}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tempSettings.limitMode === 'percent'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  % do Capital Inicial ({formatBRL(initialCapital)})
                </button>
              </div>
            </div>

            {/* Daily & Weekly Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Daily Loss Limit */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  {tempSettings.limitMode === 'fixed' ? 'Limite de Stop Diário (R$)' : 'Limite de Stop Diário (%)'}
                </label>
                {tempSettings.limitMode === 'fixed' ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">R$</span>
                    <input
                      type="number"
                      step="10"
                      min="50"
                      value={tempSettings.dailyLossLimitFixed}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        dailyLossLimitFixed: Math.max(10, parseFloat(e.target.value) || 0)
                      })}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      value={tempSettings.dailyLossLimitPercent}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        dailyLossLimitPercent: Math.max(0.1, parseFloat(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block">
                  {tempSettings.limitMode === 'percent'
                    ? `Equivale a ${formatBRL((initialCapital * tempSettings.dailyLossLimitPercent) / 100)}`
                    : 'Stop financeiro do pregão'}
                </span>
              </div>

              {/* Weekly Loss Limit */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  {tempSettings.limitMode === 'fixed' ? 'Limite de Stop Semanal (R$)' : 'Limite de Stop Semanal (%)'}
                </label>
                {tempSettings.limitMode === 'fixed' ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">R$</span>
                    <input
                      type="number"
                      step="50"
                      min="100"
                      value={tempSettings.weeklyLossLimitFixed}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        weeklyLossLimitFixed: Math.max(20, parseFloat(e.target.value) || 0)
                      })}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      value={tempSettings.weeklyLossLimitPercent}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        weeklyLossLimitPercent: Math.max(0.5, parseFloat(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block">
                  {tempSettings.limitMode === 'percent'
                    ? `Equivale a ${formatBRL((initialCapital * tempSettings.weeklyLossLimitPercent) / 100)}`
                    : 'Stop acumulado na semana'}
                </span>
              </div>
            </div>

            {/* Behavioral Constraints: Max Consecutive Stops & Max Trades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Máximo de Stops Seguidos no Dia:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.maxConsecutiveLosses}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    maxConsecutiveLosses: Math.max(1, parseInt(e.target.value, 10) || 1)
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Trava anti-fúria após sequências ruins</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Máximo de Trades por Dia (Overtrading):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.maxTradesPerDay}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    maxTradesPerDay: Math.max(1, parseInt(e.target.value, 10) || 1)
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Evita boletas desnecessárias</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveSettings(tempSettings);
                  setIsConfigModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
