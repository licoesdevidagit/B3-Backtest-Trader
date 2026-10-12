import React, { useMemo } from 'react';
import { 
  Brain, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  Activity,
  Smile
} from 'lucide-react';
import { Trade } from '../types';
import { calculatePsychologyMetrics, formatBRL } from '../utils/calculations';

interface PsychologyWidgetProps {
  trades: Trade[];
  onOpenFullPsychology?: () => void;
}

export const PsychologyWidget: React.FC<PsychologyWidgetProps> = ({
  trades,
  onOpenFullPsychology,
}) => {
  const metrics = useMemo(() => {
    return calculatePsychologyMetrics(trades);
  }, [trades]);

  const score = metrics.disciplineScore;
  const isHigh = score >= 85;
  const isModerate = score >= 65 && score < 85;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Psicologia & Disciplina do Trader
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isHigh 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : isModerate 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {isHigh ? 'Alta Disciplina' : isModerate ? 'Atenção' : 'Risco Emocional'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fidelidade ao plano operacional e controle de emoções, ansiedade e impulsividade.
            </p>
          </div>
        </div>

        {onOpenFullPsychology && (
          <button
            type="button"
            onClick={onOpenFullPsychology}
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer self-start sm:self-auto"
          >
            <span>Ver Área Completa</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Score de Disciplina */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
              Índice de Disciplina
            </span>
            <div className={`text-2xl font-extrabold font-mono tabular-nums ${
              isHigh ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {score}%
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.followedPlanCount} de {metrics.totalTrades} no plano
            </span>
          </div>
          <div className={`p-2 rounded-xl ${
            isHigh ? 'bg-emerald-500/10 text-emerald-400' : isModerate ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isHigh ? <ShieldCheck className="h-6 w-6" /> : isModerate ? <AlertTriangle className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
        </div>

        {/* Lucro com o Plano */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold flex items-center justify-between">
            <span>No Plano Operacional</span>
            <span className="text-emerald-400 font-bold">{metrics.winRateWithPlan}% acerto</span>
          </span>
          <div className={`text-xl font-bold font-mono tabular-nums ${
            metrics.profitWithPlan >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {metrics.profitWithPlan >= 0 ? `+${formatBRL(metrics.profitWithPlan)}` : formatBRL(metrics.profitWithPlan)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {metrics.followedPlanCount} operações com disciplina
          </span>
        </div>

        {/* Custo da Indisciplina */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold flex items-center justify-between">
            <span>Custo da Indisciplina</span>
            <span className="text-rose-400 font-bold">{metrics.notFollowedPlanCount} fora do plano</span>
          </span>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {metrics.avoidableLoss > 0 ? `-${formatBRL(metrics.avoidableLoss)}` : 'R$ 0,00'}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {metrics.avoidableLoss > 0 ? 'Prejuízo gerado por quebra de regra' : 'Nenhum desvio com prejuízo'}
          </span>
        </div>
      </div>

      {/* Mini Pillars Bar */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-400">Médias (1-5):</span>
          <span>Ansiedade: <strong className={metrics.avgAnxiety > 3 ? 'text-amber-400' : 'text-emerald-400'}>{metrics.avgAnxiety}</strong></span>
          <span>Medo: <strong className={metrics.avgFear > 3 ? 'text-purple-400' : 'text-emerald-400'}>{metrics.avgFear}</strong></span>
          <span>Ganância: <strong className={metrics.avgGreed > 3 ? 'text-yellow-400' : 'text-emerald-400'}>{metrics.avgGreed}</strong></span>
          <span>Confiança: <strong className="text-sky-400">{metrics.avgConfidence}</strong></span>
          <span>Impulsividade: <strong className={metrics.avgImpulsiveness > 2.5 ? 'text-rose-400' : 'text-emerald-400'}>{metrics.avgImpulsiveness}</strong></span>
        </div>

        {onOpenFullPsychology && (
          <button
            type="button"
            onClick={onOpenFullPsychology}
            className="text-[11px] font-sans font-medium text-emerald-400 hover:underline cursor-pointer"
          >
            Abrir Checklist e Diário &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
