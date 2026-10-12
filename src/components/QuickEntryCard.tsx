import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AssetType, Setup, Trade, TradeDirection, TradeResult, TraderEmotion, PlanDeviationReason } from '../types';
import { calculateTradeFinancial, formatBRL, EMOTION_CONFIGS, DEVIATION_REASON_CONFIGS } from '../utils/calculations';
import { getB3DayStatus, B3DayStatus } from '../utils/b3Calendar';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Brain,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { SetupImageLightboxModal } from './SetupImageLightboxModal';

interface QuickEntryCardProps {
  setups: Setup[];
  onSaveTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  onOpenDetailedModal: () => void;
  onOpenSetups: () => void;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAYS_SHORT_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const B3_TIME_PRESETS = [
  { time: '09:00', label: '09:00', note: 'Abertura Futuros' },
  { time: '09:15', label: '09:15', note: 'Primeiro pullback' },
  { time: '09:30', label: '09:30', note: 'Volatilidade' },
  { time: '10:00', label: '10:00', note: 'À Vista B3' },
  { time: '10:30', label: '10:30', note: 'NYSE / EUA' },
  { time: '11:00', label: '11:00', note: 'Fluxo contínuo' },
  { time: '11:30', label: '11:30', note: 'Manhã avançada' },
  { time: '12:00', label: '12:00', note: 'Almoço' },
  { time: '13:30', label: '13:30', note: 'Retomada' },
  { time: '14:30', label: '14:30', note: 'Tarde / Fluxo' },
  { time: '15:30', label: '15:30', note: 'Reta final' },
  { time: '16:30', label: '16:30', note: 'Pré-fechamento' },
  { time: '17:00', label: '17:00', note: 'Fechamento' },
];

const B3_HOURS = ['09', '10', '11', '12', '13', '14', '15', '16', '17'];
const B3_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export const QuickEntryCard: React.FC<QuickEntryCardProps> = ({
  setups,
  onSaveTrade,
  onOpenDetailedModal,
  onOpenSetups,
}) => {
  const sortedSetups = useMemo(() => {
    return [...setups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [setups]);

  const [asset, setAsset] = useState<AssetType>('WIN');
  const [setupId, setSetupId] = useState<string>(() => setups[0]?.id || '');
  const [direction, setDirection] = useState<TradeDirection>('COMPRA');
  const [contracts, setContracts] = useState<number>(1);
  const [points, setPoints] = useState<number>(150);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [recentLoggedNotice, setRecentLoggedNotice] = useState<string | null>(null);
  const [isSetupLightboxOpen, setIsSetupLightboxOpen] = useState<boolean>(false);

  // Quick Psychology & Discipline state
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [emotion, setEmotion] = useState<TraderEmotion>('CALMO');
  const [planDeviationReason, setPlanDeviationReason] = useState<PlanDeviationReason>('ENTRADA_PRECOCE');
  const [showPsychologyOptions, setShowPsychologyOptions] = useState<boolean>(false);

  // Interactive visual calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarView, setCalendarView] = useState<Date>(() => new Date(date + 'T12:00:00'));
  const [calendarViewMode, setCalendarViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [decadeBaseYear, setDecadeBaseYear] = useState<number>(() => Math.floor(new Date().getFullYear() / 12) * 12);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);
  const [selectedHolidayInfo, setSelectedHolidayInfo] = useState<{ dayNum: number; dateStr: string; status: B3DayStatus } | null>(null);

  // Interactive visual clock picker state
  const [isClockOpen, setIsClockOpen] = useState<boolean>(false);
  const clockContainerRef = useRef<HTMLDivElement>(null);

  // Close calendar or clock on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
      if (
        clockContainerRef.current &&
        !clockContainerRef.current.contains(event.target as Node)
      ) {
        setIsClockOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open calendar (and ensure clock is closed)
  const handleOpenCalendar = () => {
    try {
      const d = new Date(date + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setCalendarView(d);
        setDecadeBaseYear(Math.floor(d.getFullYear() / 12) * 12);
      }
    } catch (e) {
      // fallback
    }
    setCalendarViewMode('days');
    setIsClockOpen(false);
    setIsCalendarOpen((prev) => !prev);
  };

  // Open clock (and ensure calendar is closed)
  const handleOpenClock = () => {
    setIsCalendarOpen(false);
    setIsClockOpen((prev) => !prev);
  };

  const handleSelectDay = (day: number) => {
    const y = calendarView.getFullYear();
    const m = String(calendarView.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const newDate = `${y}-${m}-${d}`;
    const b3Status = getB3DayStatus(y, calendarView.getMonth() + 1, day);

    // If it's a holiday or weekend, display the holiday/weekend details banner
    if (b3Status.isHoliday || b3Status.isWeekend) {
      setSelectedHolidayInfo({
        dayNum: day,
        dateStr: newDate,
        status: b3Status,
      });
      return;
    }

    setDate(newDate);
    setSelectedHolidayInfo(null);
    setIsCalendarOpen(false);
  };

  const changeCalendarMonth = (offsetMonths: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHolidayInfo(null);
    const next = new Date(calendarView);
    next.setMonth(next.getMonth() + offsetMonths);
    setCalendarView(next);
  };

  // Select time preset
  const handleSelectPresetTime = (selectedTime: string) => {
    setTime(selectedTime);
    setIsClockOpen(false);
  };

  // Set time to now
  const handleSetTimeNow = () => {
    const d = new Date();
    const nowTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setTime(nowTime);
    setIsClockOpen(false);
  };

  // Update default points when asset or setup changes
  const handleAssetSelect = (newAsset: AssetType) => {
    setAsset(newAsset);
    setPoints(newAsset === 'WIN' ? 150 : newAsset === 'WDO' ? 8.0 : 0.60);
  };

  const stepDate = (offsetDays: number) => {
    try {
      const d = new Date(date + 'T12:00:00');
      d.setDate(d.getDate() + offsetDays);
      const newIso = d.toISOString().split('T')[0];
      setDate(newIso);
      setCalendarView(new Date(newIso + 'T12:00:00'));
    } catch (e) {
      // fallback
    }
  };

  const setDateToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setCalendarView(new Date(today + 'T12:00:00'));
    setIsCalendarOpen(false);
  };

  const currentSetup = setups.find(s => s.id === setupId) || setups[0];

  const handleQuickLog = (result: TradeResult) => {
    const pts = result === 'GAIN' 
      ? (currentSetup?.defaultGainPts || (asset === 'WIN' ? 150 : asset === 'WDO' ? 8.0 : 0.60)) 
      : result === 'LOSS'
      ? -(currentSetup?.defaultLossPts || (asset === 'WIN' ? 120 : asset === 'WDO' ? 5.0 : 0.40))
      : 0;

    const actualQty = asset === 'ACOES' ? contracts * 100 : contracts;
    const fin = calculateTradeFinancial(asset, pts, actualQty);

    onSaveTrade({
      date,
      time,
      asset,
      ticker: asset === 'ACOES' ? 'PETR4' : undefined,
      quantity: asset === 'ACOES' ? actualQty : undefined,
      setupId: currentSetup?.id || 'setup-default',
      setupName: currentSetup?.name || 'Setup',
      direction,
      contracts: actualQty,
      result,
      points: pts,
      financialValue: fin,
      notes: 'Registro Rápido',
      psychology: {
        followedPlan,
        emotion,
        anxietyLevel: followedPlan ? 2 : 4,
        fearLevel: followedPlan ? 1 : 3,
        greedLevel: followedPlan ? 2 : 4,
        confidenceLevel: followedPlan ? 4 : 2,
        impulsivenessLevel: followedPlan ? 1 : 4,
        planDeviationReason: followedPlan ? 'NENHUM' : planDeviationReason,
      },
    });

    const msg = `${result === 'GAIN' ? '✅ GAIN' : result === 'LOSS' ? '❌ LOSS' : '⚖️ 0x0'} em ${asset} (${formatDateBR(date)} às ${time}) registrado!`;
    setRecentLoggedNotice(msg);
    setTimeout(() => setRecentLoggedNotice(null), 3000);
  };

  // Compute days for calendar view
  const viewYear = calendarView.getFullYear();
  const viewMonth = calendarView.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const [selYear, selMonth, selDay] = date.split('-').map(Number);
  const isCurrentViewingSelectedMonth = selYear === viewYear && selMonth === viewMonth + 1;

  const todayIso = new Date().toISOString().split('T')[0];
  const [todayYear, todayMonth, todayDay] = todayIso.split('-').map(Number);
  const isViewingTodayMonth = todayYear === viewYear && todayMonth === viewMonth + 1;

  const currentHour = time.split(':')[0] || '09';
  const currentMinute = time.split(':')[1] || '00';

  const selectedDateB3Status = React.useMemo(() => {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return null;
    return getB3DayStatus(y, m, d);
  }, [date]);

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 p-4 shadow-lg relative">
      {/* Background subtle glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>Registro Rápido de Trade</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">
                1-clique
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Backteste barra a barra na velocidade do gráfico.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recentLoggedNotice && (
            <span className="hidden sm:inline-block text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-fade-in">
              {recentLoggedNotice}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenDetailedModal}
            className="text-xs text-slate-300 hover:text-white hover:underline flex items-center gap-1 font-medium"
          >
            Modo Completo
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 items-end">
          {/* 1. Data e Horário com Abertura Direta do Calendário & Relógio */}
          <div className="lg:col-span-1 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-emerald-400" />
                <span>Data & Hora</span>
              </label>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => stepDate(-1)}
                  title="Dia anterior"
                  className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={setDateToday}
                  title="Hoje"
                  className="text-[9px] font-mono px-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => stepDate(1)}
                  title="Próximo dia"
                  className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Date & Time Buttons side by side */}
            <div className="flex items-center gap-1.5">
              {/* Date Button (opens interactive calendar) */}
              <div className="flex-1 min-w-0" ref={calendarContainerRef}>
                <button
                  type="button"
                  onClick={handleOpenCalendar}
                  title="Clique para abrir o calendário visual"
                  className={`w-full h-8 rounded-lg border px-2 text-xs font-mono flex items-center justify-between gap-1 transition-all ${
                    isCalendarOpen
                      ? 'border-emerald-500 bg-slate-900 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950 text-white hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="font-semibold truncate">{formatDateBR(date)}</span>
                  <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                </button>

                {/* Hidden native input */}
                <input
                  ref={nativeDateInputRef}
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDate(e.target.value);
                      setCalendarView(new Date(e.target.value + 'T12:00:00'));
                    }
                  }}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>

              {/* Time Button (opens interactive clock popup) */}
              <div className="w-20 shrink-0" ref={clockContainerRef}>
                <button
                  type="button"
                  onClick={handleOpenClock}
                  title="Clique para abrir o relógio de horários"
                  className={`w-full h-8 rounded-lg border px-1.5 text-xs font-mono flex items-center justify-between gap-1 transition-all ${
                    isClockOpen
                      ? 'border-emerald-500 bg-slate-900 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950 text-white hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold">{time}</span>
                </button>
              </div>
            </div>

            {/* Warning if selected date is holiday or weekend */}
            {selectedDateB3Status?.isHoliday && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                <span className="truncate font-semibold">{selectedDateB3Status.holidayName}</span>
              </div>
            )}
            {selectedDateB3Status?.isWeekend && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                <AlertCircle className="h-3 w-3 shrink-0 text-slate-500" />
                <span className="truncate">{selectedDateB3Status.holidayName} (Sem pregão na B3)</span>
              </div>
            )}

            {/* Visual Interactive Calendar Dropdown */}
            {isCalendarOpen && (
              <div
                ref={calendarContainerRef}
                className="absolute left-0 top-full mt-1.5 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (calendarViewMode === 'days') {
                        changeCalendarMonth(-1, e);
                      } else if (calendarViewMode === 'months') {
                        const next = new Date(calendarView);
                        next.setFullYear(viewYear - 1);
                        setCalendarView(next);
                      } else {
                        setDecadeBaseYear((prev) => prev - 12);
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={
                      calendarViewMode === 'days'
                        ? 'Mês anterior'
                        : calendarViewMode === 'months'
                        ? 'Ano anterior'
                        : 'Década anterior'
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Interactive Openers: Click to Open Months / Click to Open Years */}
                  <div className="flex items-center gap-1.5 font-sans">
                    {/* 1. Click to open Months */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarViewMode((prev) => (prev === 'months' ? 'days' : 'months'));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        calendarViewMode === 'months'
                          ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                          : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50'
                      }`}
                      title="Clique aqui para abrir e selecionar o Mês"
                    >
                      <span>{MONTH_NAMES_PT[viewMonth]}</span>
                      <ChevronDown
                        className={`h-3 w-3 text-emerald-400 transition-transform ${
                          calendarViewMode === 'months' ? 'rotate-180 text-slate-950' : ''
                        }`}
                      />
                    </button>

                    {/* 2. Click to open Years */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDecadeBaseYear(Math.floor(viewYear / 12) * 12);
                        setCalendarViewMode((prev) => (prev === 'years' ? 'days' : 'years'));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                        calendarViewMode === 'years'
                          ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                          : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50'
                      }`}
                      title="Clique aqui para abrir e selecionar o Ano"
                    >
                      <span>{viewYear}</span>
                      <ChevronDown
                        className={`h-3 w-3 text-emerald-400 transition-transform ${
                          calendarViewMode === 'years' ? 'rotate-180 text-slate-950' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (calendarViewMode === 'days') {
                        changeCalendarMonth(1, e);
                      } else if (calendarViewMode === 'months') {
                        const next = new Date(calendarView);
                        next.setFullYear(viewYear + 1);
                        setCalendarView(next);
                      } else {
                        setDecadeBaseYear((prev) => prev + 12);
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={
                      calendarViewMode === 'days'
                        ? 'Próximo mês'
                        : calendarViewMode === 'months'
                        ? 'Próximo ano'
                        : 'Próxima década'
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* VIEW 1: Months Picker Grid (opened upon clicking Month) */}
                {calendarViewMode === 'months' && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-1">
                      <span>Escolha o Mês ({viewYear}):</span>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('days')}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Voltar para dias
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_NAMES_PT.map((mName, idx) => {
                        const isCurrent = viewMonth === idx;
                        return (
                          <button
                            key={mName}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = new Date(calendarView);
                              next.setMonth(idx);
                              setCalendarView(next);
                              setCalendarViewMode('days');
                            }}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="block truncate">{mName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VIEW 2: Years Picker Grid (opened upon clicking Year) */}
                {calendarViewMode === 'years' && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-1">
                      <span>Escolha o Ano ({decadeBaseYear} - {decadeBaseYear + 11}):</span>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('days')}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Voltar para dias
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 12 }).map((_, idx) => {
                        const y = decadeBaseYear + idx;
                        const isCurrent = viewYear === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = new Date(calendarView);
                              next.setFullYear(y);
                              setCalendarView(next);
                              setCalendarViewMode('months');
                            }}
                            className={`py-2 px-1 rounded-lg text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VIEW 3: Standard Days Grid */}
                {calendarViewMode === 'days' && (
                  <>
                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500 uppercase">
                      {WEEKDAYS_SHORT_PT.map((w, idx) => (
                        <div key={idx} className={idx === 0 || idx === 6 ? 'text-slate-600' : ''}>
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7 w-7" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSelected = isCurrentViewingSelectedMonth && selDay === dayNum;
                        const isToday = isViewingTodayMonth && todayDay === dayNum;
                        const b3Status = getB3DayStatus(viewYear, viewMonth + 1, dayNum);
                        const isHoliday = b3Status.isHoliday;
                        const isWeekend = b3Status.isWeekend;
                        const isPartial = b3Status.isPartialDay;
                        const isHolidayActive = selectedHolidayInfo?.dayNum === dayNum;

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => handleSelectDay(dayNum)}
                            title={
                              isHoliday
                                ? `${dayNum} - ${b3Status.holidayName} (Feriado B3 · Clique para ver)`
                                : isWeekend
                                ? `${dayNum} - ${b3Status.holidayName} (Fim de Semana · Sem Pregão B3)`
                                : isPartial
                                ? `${dayNum} - ${b3Status.holidayName} (Pregão B3 inicia às 13h)`
                                : `${dayNum}/${viewMonth + 1}/${viewYear} (Pregão B3)`
                            }
                            className={`relative h-7 w-7 rounded-lg text-xs font-mono font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : isHolidayActive
                                ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-400 shadow-md'
                                : isHoliday
                                ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold hover:bg-amber-500/30'
                                : isToday
                                ? 'border border-emerald-500/60 text-emerald-400 font-bold hover:bg-slate-800'
                                : isWeekend
                                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/80'
                                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span className="leading-none">{dayNum}</span>
                            {/* Dot indicator */}
                            {isHoliday && !isSelected && !isHolidayActive && (
                              <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-0.5" />
                            )}
                            {isPartial && !isSelected && (
                              <span className="w-1 h-1 rounded-full bg-sky-400 absolute bottom-0.5" />
                            )}
                            {isWeekend && !isSelected && (
                              <span className="w-0.5 h-0.5 rounded-full bg-slate-600 absolute bottom-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Interactive Holiday or Weekend Details Card (displayed when user clicks on the date) */}
                    {selectedHolidayInfo && (
                      <div
                        className={`mt-2 p-2.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100 ${
                          selectedHolidayInfo.status.isHoliday
                            ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                            : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-bold min-w-0">
                            {selectedHolidayInfo.status.isHoliday ? (
                              <>
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                <span className="text-amber-300 truncate">
                                  {selectedHolidayInfo.status.holidayName}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                <span className="text-rose-300 truncate">
                                  {selectedHolidayInfo.status.holidayName} (Fim de Semana)
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 font-semibold border border-white/10 shrink-0">
                            {selectedHolidayInfo.status.isHoliday ? 'Feriado B3' : 'Sem Pregão'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {selectedHolidayInfo.status.holidayDescription ||
                            'Não há negociação nos mercados da B3 nesta data.'}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                          <span className="font-mono text-slate-300 font-semibold">
                            {formatDateBR(selectedHolidayInfo.dateStr)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHolidayInfo(null);
                              }}
                              className="px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              Fechar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDate(selectedHolidayInfo.dateStr);
                                setSelectedHolidayInfo(null);
                                setIsCalendarOpen(false);
                              }}
                              className={`px-2.5 py-0.5 rounded font-bold text-slate-950 transition-colors shadow-sm cursor-pointer ${
                                selectedHolidayInfo.status.isHoliday
                                  ? 'bg-amber-400 hover:bg-amber-300'
                                  : 'bg-slate-200 hover:bg-white'
                              }`}
                            >
                              Confirmar data
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Presets & Legend footer */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={setDateToday}
                        className="px-2 py-0.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stepDate(-1);
                          setIsCalendarOpen(false);
                        }}
                        className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Ontem
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Fechar calendário"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* B3 Trading Legend */}
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Pregão B3</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-amber-400 font-semibold">Feriado B3</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="text-slate-500">Fim de Semana</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Interactive Clock Dropdown (Relógio 1-clique) */}
            {isClockOpen && (
              <div
                ref={clockContainerRef}
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Clock Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>Selecionar Horário</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSetTimeNow}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                      title="Preencher com o horário exato de agora"
                    >
                      Agora
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsClockOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Fechar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Popular B3 Trading Presets */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 font-sans">
                    Horários Clássicos do Pregão B3
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {B3_TIME_PRESETS.map((p) => {
                      const isSelected = time === p.time;
                      return (
                        <button
                          key={p.time}
                          type="button"
                          onClick={() => handleSelectPresetTime(p.time)}
                          className={`py-1 px-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-900 border border-slate-800/80 text-slate-200 hover:border-emerald-500/40 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          <span>{p.label}</span>
                          <span
                            className={`text-[8px] font-sans truncate max-w-full ${
                              isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {p.note}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine tuning: Hours and Minutes grids */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1 font-mono">
                      Hora ({currentHour}h):
                    </span>
                    <div className="grid grid-cols-9 gap-1 text-center font-mono text-[11px]">
                      {B3_HOURS.map((h) => {
                        const isCurrentH = currentHour === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              const newTime = `${h}:${currentMinute}`;
                              setTime(newTime);
                            }}
                            className={`py-1 rounded text-xs transition-colors ${
                              isCurrentH
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1 font-mono">
                      Minutos (:{currentMinute}):
                    </span>
                    <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                      {B3_MINUTES.map((m) => {
                        const isCurrentM = currentMinute === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const newTime = `${currentHour}:${m}`;
                              setTime(newTime);
                              setIsClockOpen(false);
                            }}
                            className={`py-1 rounded text-xs transition-colors ${
                              isCurrentM
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            :{m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Ativo */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Ativo / Mercado
            </label>
            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => handleAssetSelect('WIN')}
                className={`py-1 text-xs font-mono font-bold rounded ${
                  asset === 'WIN'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                WIN
              </button>
              <button
                type="button"
                onClick={() => handleAssetSelect('WDO')}
                className={`py-1 text-xs font-mono font-bold rounded ${
                  asset === 'WDO'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                WDO
              </button>
              <button
                type="button"
                onClick={() => handleAssetSelect('ACOES')}
                className={`py-1 text-[11px] font-mono font-bold rounded ${
                  asset === 'ACOES'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AÇÕES
              </button>
            </div>
          </div>

          {/* 3. Setup */}
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-400">
                Setup
              </label>
              <div className="flex items-center gap-2">
                {currentSetup?.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsSetupLightboxOpen(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    title="Ver print do exemplo do setup"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Ver Foto</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenSetups}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                >
                  + Cadastrar Setups
                </button>
              </div>
            </div>
            <select
              value={setupId}
              onChange={(e) => setSetupId(e.target.value)}
              className="w-full h-8 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none truncate"
            >
              {sortedSetups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Direção & Contratos */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Direção & Contratos
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDirection(direction === 'COMPRA' ? 'VENDA' : 'COMPRA')}
                className={`h-8 flex-1 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
                  direction === 'COMPRA'
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                }`}
              >
                {direction === 'COMPRA' ? '▲ Compra' : '▼ Venda'}
              </button>
              <select
                value={contracts}
                onChange={(e) => setContracts(parseInt(e.target.value) || 1)}
                className="w-16 h-8 rounded-lg border border-slate-800 bg-slate-950 px-1 text-center text-xs font-mono text-white focus:outline-none"
                title="Número de contratos"
              >
                <option value={1}>1 ct</option>
                <option value={2}>2 cts</option>
                <option value={3}>3 cts</option>
                <option value={5}>5 cts</option>
                <option value={10}>10 cts</option>
                <option value={20}>20 cts</option>
              </select>
            </div>
          </div>

          {/* 5. Ação Instantânea: GAIN / LOSS */}
          <div className="lg:col-span-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLog('GAIN')}
              className="flex-1 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>+ GAIN</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLog('LOSS')}
              className="flex-1 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>- LOSS</span>
            </button>
          </div>

          {/* Quick Psychology Row */}
          <div className="col-span-full pt-2 mt-1 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-semibold text-slate-300">Psicologia & Disciplina:</span>
              </span>

              {/* Seguiu o plano? */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFollowedPlan(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    followedPlan
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Plano OK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowedPlan(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    !followedPlan
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <XCircle className="h-3 w-3 text-rose-400" />
                  <span>Desvio</span>
                </button>
              </div>

              {/* Se desvio, escolher motivo */}
              {!followedPlan && (
                <select
                  value={planDeviationReason}
                  onChange={(e) => setPlanDeviationReason(e.target.value as PlanDeviationReason)}
                  className="rounded bg-slate-950 border border-rose-500/40 text-rose-300 text-[10px] px-1.5 py-0.5 focus:outline-none"
                >
                  {Object.entries(DEVIATION_REASON_CONFIGS)
                    .filter(([k]) => k !== 'NENHUM')
                    .map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                </select>
              )}

              {/* Emoção */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">Emoção:</span>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value as TraderEmotion)}
                  className="rounded bg-slate-950 border border-slate-800 text-slate-200 text-[11px] px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  {Object.entries(EMOTION_CONFIGS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.emoji} {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDetailedModal}
              className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Diário Completo (Sliders de 1 a 5)</span>
            </button>
          </div>
        </div>
      )}

      {/* Setup Lightbox Modal */}
      <SetupImageLightboxModal
        isOpen={isSetupLightboxOpen}
        onClose={() => setIsSetupLightboxOpen(false)}
        setup={currentSetup}
      />
    </div>
  );
};
