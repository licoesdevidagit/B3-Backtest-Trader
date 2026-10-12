import React, { useState, useMemo, useEffect } from 'react';
import { 
  Brain, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Smile, 
  Zap, 
  Flame, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Calendar, 
  Plus, 
  Check, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  ListFilter,
  BarChart3,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { Trade, TraderEmotion, PlanDeviationReason } from '../types';
import { 
  calculatePsychologyMetrics, 
  EMOTION_CONFIGS, 
  DEVIATION_REASON_CONFIGS, 
  formatBRL, 
  formatDateBR 
} from '../utils/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';

interface PsychologyDashboardProps {
  trades: Trade[];
  onOpenEditTrade?: (trade: Trade) => void;
  onOpenNewTrade?: () => void;
}

const STORAGE_KEY_MINDSET_CHECKLIST = 'b3_trader_mindset_checklist_v1';

interface MindsetItem {
  id: string;
  text: string;
  checked: boolean;
}

const DEFAULT_MINDSET_CHECKLIST: MindsetItem[] = [
  { id: '1', text: 'Dormi bem e minha mente está descansada e focada para a sessão.', checked: false },
  { id: '2', text: 'Aceito antecipadamente o risco de cada operação antes de enviar a ordem.', checked: false },
  { id: '3', text: 'Meu stop loss diário está pré-definido e respeitarei o limite sem hesitar.', checked: false },
  { id: '4', text: 'Não operarei por FOMO (medo de ficar de fora) nem por vingança após um stop.', checked: false },
  { id: '5', text: 'Esperarei o candle fechar e o gatilho do setup se confirmar antes de clicar.', checked: false },
  { id: '6', text: 'Jamais moverei o stop loss contra a posição para "dar mais espaço".', checked: false },
];

export const PsychologyDashboard: React.FC<PsychologyDashboardProps> = ({
  trades,
  onOpenEditTrade,
  onOpenNewTrade,
}) => {
  // Filters
  const [filterAsset, setFilterAsset] = useState<'ALL' | 'WIN' | 'WDO'>('ALL');
  const [filterPlan, setFilterPlan] = useState<'ALL' | 'FOLLOWED' | 'NOT_FOLLOWED'>('ALL');
  const [filterEmotion, setFilterEmotion] = useState<string>('ALL');

  // Mindset Checklist State (persisted in localStorage)
  const [checklist, setChecklist] = useState<MindsetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MINDSET_CHECKLIST);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_MINDSET_CHECKLIST;
  });

  const [newRuleText, setNewRuleText] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MINDSET_CHECKLIST, JSON.stringify(checklist));
    } catch (e) {
      // ignore
    }
  }, [checklist]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleResetChecklist = () => {
    setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    const newItem: MindsetItem = {
      id: Date.now().toString(),
      text: newRuleText.trim(),
      checked: false,
    };
    setChecklist(prev => [...prev, newItem]);
    setNewRuleText('');
    setIsAddingRule(false);
  };

  const handleDeleteRule = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  // Filtered trades for analysis
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterAsset !== 'ALL' && t.asset !== filterAsset) return false;
      if (filterPlan === 'FOLLOWED') {
        const followed = t.psychology ? t.psychology.followedPlan : true;
        if (!followed) return false;
      }
      if (filterPlan === 'NOT_FOLLOWED') {
        const followed = t.psychology ? t.psychology.followedPlan : true;
        if (followed) return false;
      }
      if (filterEmotion !== 'ALL') {
        if (!t.psychology || t.psychology.emotion !== filterEmotion) return false;
      }
      return true;
    });
  }, [trades, filterAsset, filterPlan, filterEmotion]);

  // General metrics calculated across all trades
  const globalMetrics = useMemo(() => {
    return calculatePsychologyMetrics(trades);
  }, [trades]);

  // Metrics for filtered trades
  const currentMetrics = useMemo(() => {
    return calculatePsychologyMetrics(filteredTrades);
  }, [filteredTrades]);

  // Discipline rating classification
  const getDisciplineStatus = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Trader de Alta Disciplina',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        badge: 'Excelente',
        icon: ShieldCheck,
        tip: 'Você opera com respeito rigoroso ao plano operacional. A consistência no longo prazo é consequência direta desta postura.',
      };
    }
    if (score >= 65) {
      return {
        label: 'Disciplina Moderada (Atenção aos Desvios)',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        badge: 'Atenção',
        icon: AlertTriangle,
        tip: 'Alguns trades fora do plano estão vazando o lucro acumulado com os bons trades. Corte imediatamente as entradas por impulso.',
      };
    }
    return {
      label: 'Zona de Risco Emocional (Indisciplina Crítica)',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      badge: 'Perigo',
      icon: ShieldAlert,
      tip: 'Muitas operações foram executadas sem critério técnico (FOMO, vingança ou stop movido). Pause as operações e volte ao plano simulado.',
    };
  };

  const disciplineStatus = getDisciplineStatus(globalMetrics.disciplineScore);

  // Pillar levels data
  const pillars = [
    {
      name: 'Ansiedade',
      key: 'anxiety',
      value: globalMetrics.avgAnxiety,
      ideal: '1.0 - 2.0 (Baixa)',
      description: 'Pressa para entrar ou sair da operação.',
      color: globalMetrics.avgAnxiety > 3 ? 'text-amber-400' : 'text-emerald-400',
      barColor: globalMetrics.avgAnxiety > 3 ? 'bg-amber-500' : 'bg-emerald-500',
      emoji: '😰',
    },
    {
      name: 'Medo',
      key: 'fear',
      value: globalMetrics.avgFear,
      ideal: '1.0 - 2.0 (Controlado)',
      description: 'Hesitação na execução ou zeragem prematura.',
      color: globalMetrics.avgFear > 3 ? 'text-purple-400' : 'text-emerald-400',
      barColor: globalMetrics.avgFear > 3 ? 'bg-purple-500' : 'bg-emerald-500',
      emoji: '😨',
    },
    {
      name: 'Ganância',
      key: 'greed',
      value: globalMetrics.avgGreed,
      ideal: '1.0 - 2.5 (Moderada)',
      description: 'Alavancar além da gestão ou não realizar no alvo.',
      color: globalMetrics.avgGreed > 3 ? 'text-yellow-400' : 'text-emerald-400',
      barColor: globalMetrics.avgGreed > 3 ? 'bg-yellow-500' : 'bg-emerald-500',
      emoji: '🤑',
    },
    {
      name: 'Confiança',
      key: 'confidence',
      value: globalMetrics.avgConfidence,
      ideal: '3.5 - 4.5 (Alta & Realista)',
      description: 'Tranquilidade e clareza na leitura do setup.',
      color: globalMetrics.avgConfidence >= 3.5 ? 'text-sky-400' : 'text-amber-400',
      barColor: globalMetrics.avgConfidence >= 3.5 ? 'bg-sky-500' : 'bg-amber-500',
      emoji: '🦁',
    },
    {
      name: 'Impulsividade',
      key: 'impulsiveness',
      value: globalMetrics.avgImpulsiveness,
      ideal: '1.0 - 1.8 (Mínima)',
      description: 'Clicar sem sinal técnico claro do setup.',
      color: globalMetrics.avgImpulsiveness > 2.5 ? 'text-rose-400' : 'text-emerald-400',
      barColor: globalMetrics.avgImpulsiveness > 2.5 ? 'bg-rose-500' : 'bg-emerald-500',
      emoji: '⚡',
    },
  ];

  // Chart data for emotion distribution
  const emotionChartData = useMemo(() => {
    return globalMetrics.emotionBreakdown.map((e) => ({
      name: `${e.config.emoji} ${e.emotion}`,
      count: e.count,
      profit: e.profit,
      winRate: e.winRate,
      color: e.config.color,
    }));
  }, [globalMetrics]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Hero Score de Disciplina */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Psicologia e Disciplina do Trader
                </h2>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${disciplineStatus.bg} ${disciplineStatus.color}`}>
                  {disciplineStatus.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Monitoramento de emoções, ansiedade, medo, ganância, confiança, impulsividade e fidelidade ao plano operacional.
              </p>
            </div>
          </div>

          {/* Score Badge */}
          <div className="p-3.5 sm:px-5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between md:justify-end gap-4 shrink-0 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Índice de Disciplina
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {globalMetrics.followedPlanCount} de {globalMetrics.totalTrades} no plano
              </span>
            </div>
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${disciplineStatus.color}`}>
                {globalMetrics.disciplineScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${disciplineStatus.bg}`}>
          <disciplineStatus.icon className={`h-4 w-4 shrink-0 mt-0.5 ${disciplineStatus.color}`} />
          <div className="space-y-0.5">
            <span className={`font-semibold block ${disciplineStatus.color}`}>
              {disciplineStatus.label}
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {disciplineStatus.tip}
            </p>
          </div>
        </div>
      </div>

      {/* 2. O Grande Comparativo: Seguiu o Plano vs. Quebrou o Plano (O Custo da Indisciplina) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Com Disciplina (Plano Cumprido) */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-slate-900/70 space-y-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Plano Operacional Cumprido</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {globalMetrics.followedPlanCount} trades
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Resultado Financeiro</span>
            <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              globalMetrics.profitWithPlan >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {globalMetrics.profitWithPlan >= 0 ? `+${formatBRL(globalMetrics.profitWithPlan)}` : formatBRL(globalMetrics.profitWithPlan)}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Taxa de Acerto:</span>
            <strong className="text-emerald-400">{globalMetrics.winRateWithPlan}%</strong>
          </div>
          <p className="text-[10px] text-slate-400">
            Trades executados seguindo a regra do setup, stop técnico e alvo planejado.
          </p>
        </div>

        {/* Card 2: Fora do Plano (Indisciplina / Erros Emocionais) */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-slate-900/70 space-y-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              <span>Fora do Plano (Desvio)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {globalMetrics.notFollowedPlanCount} trades
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Resultado Financeiro</span>
            <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              globalMetrics.profitWithoutPlan >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {globalMetrics.profitWithoutPlan >= 0 ? `+${formatBRL(globalMetrics.profitWithoutPlan)}` : formatBRL(globalMetrics.profitWithoutPlan)}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Taxa de Acerto:</span>
            <strong className={globalMetrics.winRateWithoutPlan >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
              {globalMetrics.winRateWithoutPlan}%
            </strong>
          </div>
          <p className="text-[10px] text-slate-400">
            Operações precipitadas, FOMO, vingança ou stops movidos fora da estratégia.
          </p>
        </div>

        {/* Card 3: O Custo Financeiro da Indisciplina */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-900/70 space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Custo da Indisciplina</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Prejuízo Evitável
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Capital Desperdiçado</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {globalMetrics.avoidableLoss > 0 ? `-${formatBRL(globalMetrics.avoidableLoss)}` : 'R$ 0,00'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-tight">
            {globalMetrics.avoidableLoss > 0 ? (
              <span>
                Você teria <strong className="text-emerald-400">+{formatBRL(globalMetrics.avoidableLoss)}</strong> a mais na conta apenas evitando trades impulsivos.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                Parabéns! Nenhum centavo foi perdido por desvio do plano operacional.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Os 5 Pilares Emocionais do Trader (Ansiedade, Medo, Ganância, Confiança, Impulsividade) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span>Níveis Médios dos 5 Pilares Emocionais</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Escala de 1 a 5 avaliada em cada trade operado.
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Escala: <strong>1 (Mínima)</strong> a <strong>5 (Máxima)</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {pillars.map((pillar) => {
            const percentage = Math.min(100, Math.max(0, (pillar.value / 5) * 100));

            return (
              <div 
                key={pillar.key} 
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{pillar.emoji}</span>
                      <span>{pillar.name}</span>
                    </span>
                    <span className={`text-base font-bold font-mono ${pillar.color}`}>
                      {pillar.value.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">/ 5</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    {pillar.description}
                  </p>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mb-1">
                    <div 
                      style={{ width: `${percentage}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${pillar.barColor}`} 
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block text-right">
                    Ideal: {pillar.ideal}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Distribuição das Emoções & Motivos de Quebra do Plano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lado A: Ranking das Emoções Dominantes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Smile className="h-4 w-4 text-emerald-400" />
                <span>Impacto Financeiro por Emoção Dominante</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Desempenho obtido em cada estado mental registrado.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {globalMetrics.emotionBreakdown.length} emoções
            </span>
          </div>

          {globalMetrics.emotionBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma emoção registrada ainda. Adicione emoções aos seus trades!
            </div>
          ) : (
            <div className="space-y-2.5">
              {globalMetrics.emotionBreakdown.map((item) => {
                const isGain = item.profit >= 0;

                return (
                  <div
                    key={item.emotion}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{item.config.emoji}</span>
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">
                          {item.config.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.count} trade{item.count > 1 ? 's' : ''} ({item.wins}G / {item.losses}L) · Acerto: {item.winRate}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className={`font-bold block ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? `+${formatBRL(item.profit)}` : formatBRL(item.profit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lado B: Principais Motivos de Fuga do Plano (Gatilhos de Erro) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Gatilhos de Indisciplina (Fuga do Plano)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quais erros operacionais custaram mais caro na sua jornada.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              {globalMetrics.deviationBreakdown.length} gatilhos
            </span>
          </div>

          {globalMetrics.deviationBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-400 font-medium">
              ✨ Nenhum desvio registrado! Você seguiu 100% das suas operações.
            </div>
          ) : (
            <div className="space-y-2.5">
              {globalMetrics.deviationBreakdown.map((item) => (
                <div
                  key={item.reason}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-rose-300 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {item.description}
                    </span>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {item.count} ocorrência{item.count > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-rose-400">
                      {formatBRL(item.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Checklist Pré-Mercado de Mentalidade & Regras de Ouro */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Checklist de Mentalidade & Regras Inegociáveis</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Marque cada item antes de abrir a plataforma para calibrar seu estado psicológico.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetChecklist}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Desmarcar Todos
            </button>
            <button
              type="button"
              onClick={() => setIsAddingRule(!isAddingRule)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Regra</span>
            </button>
          </div>
        </div>

        {/* Add custom rule form */}
        {isAddingRule && (
          <form onSubmit={handleAddRule} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 animate-in fade-in">
            <input
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              placeholder="Ex: Não operar após as 12h se a meta estiver batida..."
              className="flex-1 bg-transparent border-0 px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsAddingRule(false)}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Checklist items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all select-none ${
                item.checked
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  item.checked
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {item.checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <span className={`leading-snug ${item.checked ? 'text-white font-medium' : ''}`}>
                  {item.text}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRule(item.id);
                }}
                className="text-slate-600 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                title="Excluir regra"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Linha do Tempo e Diário Psicológico dos Trades */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-purple-400" />
              <span>Diário Psicológico das Operações</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento trade a trade com avaliação emocional e adesão ao plano.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Plan */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterPlan('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({trades.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPlan('FOLLOWED')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'FOLLOWED' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                No Plano ({globalMetrics.followedPlanCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterPlan('NOT_FOLLOWED')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'NOT_FOLLOWED' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fora do Plano ({globalMetrics.notFollowedPlanCount})
              </button>
            </div>
          </div>
        </div>

        {/* Trades List */}
        {filteredTrades.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            Nenhuma operação encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTrades.map((t) => {
              const psy = t.psychology;
              const emotionConfig = psy?.emotion ? EMOTION_CONFIGS[psy.emotion] : undefined;
              const followed = psy ? psy.followedPlan : true;
              const deviationConfig = psy?.planDeviationReason ? DEVIATION_REASON_CONFIGS[psy.planDeviationReason] : undefined;
              const isGain = t.financialValue >= 0;

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Trade Info */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        t.asset === 'WIN' ? 'bg-blue-500/15 text-sky-400 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {t.asset}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {t.setupName || 'Setup'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateBR(t.date)} {t.time ? `às ${t.time}` : ''}
                      </span>

                      {/* Plan Compliance Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                        followed
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {followed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{followed ? 'Plano Cumprido' : 'Fora do Plano'}</span>
                      </span>

                      {/* Emotion Badge */}
                      {emotionConfig && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${emotionConfig.bgClass} ${emotionConfig.textClass} ${emotionConfig.borderClass}`}>
                          <span>{emotionConfig.emoji}</span>
                          <span>{emotionConfig.label}</span>
                        </span>
                      )}
                    </div>

                    {/* Result & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 font-mono">
                      <span className={`text-sm font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? `+${formatBRL(t.financialValue)}` : formatBRL(t.financialValue)}
                      </span>
                      {onOpenEditTrade && (
                        <button
                          type="button"
                          onClick={() => onOpenEditTrade(t)}
                          className="px-2.5 py-1 rounded text-xs font-sans text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Editar Psicologia
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emotional Levels & Deviation notes */}
                  {psy && (
                    <div className="pt-2 border-t border-slate-800/70 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono text-slate-400">
                      <div>Ansiedade: <strong className={psy.anxietyLevel && psy.anxietyLevel > 3 ? 'text-amber-400' : 'text-slate-200'}>{psy.anxietyLevel || '-'}/5</strong></div>
                      <div>Medo: <strong className={psy.fearLevel && psy.fearLevel > 3 ? 'text-purple-400' : 'text-slate-200'}>{psy.fearLevel || '-'}/5</strong></div>
                      <div>Ganância: <strong className={psy.greedLevel && psy.greedLevel > 3 ? 'text-yellow-400' : 'text-slate-200'}>{psy.greedLevel || '-'}/5</strong></div>
                      <div>Confiança: <strong className={psy.confidenceLevel && psy.confidenceLevel >= 3 ? 'text-sky-400' : 'text-slate-200'}>{psy.confidenceLevel || '-'}/5</strong></div>
                      <div>Impulsividade: <strong className={psy.impulsivenessLevel && psy.impulsivenessLevel > 2 ? 'text-rose-400' : 'text-slate-200'}>{psy.impulsivenessLevel || '-'}/5</strong></div>
                    </div>
                  )}

                  {/* Deviation Reason if any */}
                  {!followed && deviationConfig && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span><strong>Desvio:</strong> {deviationConfig.label} — {deviationConfig.description}</span>
                    </div>
                  )}

                  {/* Notes / Reflexão emocional */}
                  {psy?.notes && (
                    <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2 rounded border border-slate-800/60">
                      "{psy.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
