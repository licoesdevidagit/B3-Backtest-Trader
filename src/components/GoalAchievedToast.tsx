import React from 'react';
import { Trophy, Award, X, Sparkles, ArrowRight } from 'lucide-react';
import { Milestone } from '../utils/milestones';
import { formatBRL } from '../utils/calculations';

interface GoalAchievedToastProps {
  milestone: Milestone | null;
  onOpenCertificate: (milestone: Milestone) => void;
  onDismiss: () => void;
}

export const GoalAchievedToast: React.FC<GoalAchievedToastProps> = ({
  milestone,
  onOpenCertificate,
  onDismiss,
}) => {
  if (!milestone) return null;

  return (
    <aside
      aria-label="Aviso de meta alcançada"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xl shadow-inner animate-pulse">
          🏆
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Aviso de Meta Conquistada!</span>
          </div>

          <h4 className="text-sm font-bold text-white truncate pt-0.5">
            {milestone.title} ({formatBRL(milestone.targetProfit)})
          </h4>

          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {milestone.rank}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => onOpenCertificate(milestone)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Ver Certificado</span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors -mr-1 -mt-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
