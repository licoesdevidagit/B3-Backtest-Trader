import React from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  FileDown, 
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Flame,
  Star
} from 'lucide-react';
import { 
  FINANCIAL_MILESTONES, 
  Milestone, 
  getAchievedMilestones, 
  getNextMilestone 
} from '../utils/milestones';
import { formatBRL } from '../utils/calculations';
import { DashboardMetrics } from '../types';

interface GoalMilestonesWidgetProps {
  metrics: DashboardMetrics;
  onOpenCertificateModal: (milestone?: Milestone) => void;
  onDownloadPdfDirect: (milestone: Milestone) => void;
  onSimulateMilestoneAlert: () => void;
}

export const GoalMilestonesWidget: React.FC<GoalMilestonesWidgetProps> = ({
  metrics,
  onOpenCertificateModal,
  onDownloadPdfDirect,
  onSimulateMilestoneAlert,
}) => {
  const currentProfit = metrics.totalProfit;
  const achieved = getAchievedMilestones(currentProfit);
  const nextInfo = getNextMilestone(currentProfit);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Metas & Certificados de Conquista
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                {achieved.length} de {FINANCIAL_MILESTONES.length} Batidas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Avisos automáticos de metas alcançadas e emissão de certificados oficiais B3.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateMilestoneAlert}
            title="Demonstrar o aviso comemorativo de meta na tela com confetes e som"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Testar Aviso de Tela</span>
            <span className="sm:hidden">Testar Aviso</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCertificateModal()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Certificados (12 Modelos)</span>
          </button>
        </div>
      </div>

      {/* Progress towards Next Milestone */}
      {nextInfo ? (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/25 via-slate-900 to-slate-950 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Próxima Meta: <strong className="text-white font-mono">{nextInfo.milestone.title}</strong></span>
              <span className="text-slate-400 text-[11px] hidden md:inline">({nextInfo.milestone.rank})</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">
              {nextInfo.progressPercent.toFixed(1)}% Concluído
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div
              style={{ width: `${nextInfo.progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/30"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Lucro atual: <strong className="text-emerald-400">{formatBRL(currentProfit)}</strong></span>
            <span>Faltam: <strong className="text-amber-400">{formatBRL(nextInfo.remainingAmount)}</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Parabéns absoluto! Todas as metas históricas de até R$ 1.000.000,00 foram alcançadas!</span>
        </div>
      )}

      {/* Milestones Cards Grid (Scrollable or responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 pt-1">
        {FINANCIAL_MILESTONES.map((m) => {
          const isAchieved = currentProfit >= m.targetProfit;
          return (
            <div
              key={m.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                isAchieved
                  ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-md shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-950/40 opacity-75 hover:opacity-95 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isAchieved ? m.badge : '🔒'}</span>
                  <div>
                    <span className="text-xs font-bold text-white font-mono block">
                      {m.shortTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {m.rank.split('·')[0].trim()}
                    </span>
                  </div>
                </div>

                {isAchieved ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    BATI!
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500 shrink-0">
                    Bloqueada
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 border-t border-slate-800/80">
                {isAchieved ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenCertificateModal(m)}
                      className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Award className="h-3 w-3" />
                      <span>Certificado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadPdfDirect(m)}
                      title="Baixar Certificado em PDF direto"
                      className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Falta:</span>
                    <strong className="text-amber-400/90">{formatBRL(m.targetProfit - currentProfit)}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
