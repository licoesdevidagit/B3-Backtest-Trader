import React from 'react';
import { Lock, AlertTriangle, CheckCircle2, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { completePreMarketForDate, getTodayDateString } from './PreMarketChecklistWidget';

interface PreMarketAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproveAndProceed?: () => void;
  onGoToDashboard?: () => void;
}

export const PreMarketAlertModal: React.FC<PreMarketAlertModalProps> = ({
  isOpen,
  onClose,
  onApproveAndProceed,
  onGoToDashboard,
}) => {
  if (!isOpen) return null;

  const todayStr = getTodayDateString();

  const handleQuickApprove = () => {
    completePreMarketForDate(todayStr);
    if (onApproveAndProceed) {
      onApproveAndProceed();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl p-5 sm:p-6 text-slate-100 space-y-4 overscroll-contain">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Checklist Pré-Market Obrigatório
              </h3>
              <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                Pregão bloqueado para novos registros de trades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Message */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Para manter o rigor e a disciplina profissional do trader, o sistema exige a confirmação prévia dos itens obrigatórios antes de registrar operações do dia:
          </p>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">📰</span>
              <span className="font-semibold">1. Notícias & Calendário Econômico checados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">🎯</span>
              <span className="font-semibold">2. Meta diária & Limite de Stop definidos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-400">🔍</span>
              <span className="font-semibold">3. Setup operacional revisado</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Você pode marcar todos os itens agora com 1 clique para liberar o registro ou acessar o widget completo no Dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleQuickApprove}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Marcar Todos & Liberar Agora</span>
          </button>

          {onGoToDashboard && (
            <button
              type="button"
              onClick={() => {
                onGoToDashboard();
                onClose();
              }}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Ver no Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
