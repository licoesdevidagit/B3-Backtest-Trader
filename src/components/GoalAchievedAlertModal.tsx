import React, { useEffect } from 'react';
import { X, Award, Sparkles, Trophy, ArrowRight, ShieldCheck, Download, CheckCircle2, FileDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Milestone } from '../utils/milestones';
import { formatBRL } from '../utils/calculations';

interface GoalAchievedAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  currentProfit: number;
  onOpenCertificate: (milestone: Milestone) => void;
  onDownloadPdfDirect?: (milestone: Milestone) => void;
}

export const GoalAchievedAlertModal: React.FC<GoalAchievedAlertModalProps> = ({
  isOpen,
  onClose,
  milestone,
  currentProfit,
  onOpenCertificate,
  onDownloadPdfDirect,
}) => {
  // Fire celebratory confetti and audio chime when modal opens
  useEffect(() => {
    if (isOpen && milestone) {
      // 1. Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#ffffff'],
        });

        const timer1 = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#f59e0b', '#10b981', '#fbbf24'],
          });
        }, 300);

        const timer2 = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#38bdf8', '#10b981', '#f59e0b'],
          });
        }, 600);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } catch (e) {
        // Fallback if canvas is not supported
      }

      // 2. Play celebratory Web Audio fanfare synth
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.12);
            osc.stop(ctx.currentTime + idx * 0.12 + 0.36);
          });
        }
      } catch (err) {
        // Audio policy or silent fail
      }
    }
  }, [isOpen, milestone]);

  if (!isOpen || !milestone) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto overflow-y-auto rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 text-center text-slate-100 shadow-2xl shadow-amber-500/20 overscroll-contain animate-in zoom-in-95 duration-200">
        {/* Glowing background rays */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Trophy Banner with animation */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-500/30 animate-bounce">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-amber-400">
            <Trophy className="h-10 w-10 text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 text-base">✨</div>
          <div className="absolute -bottom-1 -left-1 text-base">🎉</div>
        </div>

        {/* Celebratory Title */}
        <div className="space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aviso de Meta Alcançada!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
            Parabéns, Trader!
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Você acabou de cruzar uma meta histórica memorável no seu histórico de operações na B3.
          </p>
        </div>

        {/* Goal Amount Badge Box */}
        <div className="my-5 p-4 rounded-xl border border-amber-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden">
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Nova Meta Histórica Desbloqueada
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
            {formatBRL(milestone.targetProfit)}
          </div>

          <div className="text-xs font-semibold text-emerald-400">
            {milestone.rank}
          </div>

          <p className="text-[11px] text-slate-400 max-w-sm mx-auto pt-1">
            {milestone.description}
          </p>

          <div className="text-[10px] text-slate-400 font-mono pt-1">
            Lucro líquido atual registrado: <strong className="text-emerald-400 font-bold">{formatBRL(currentProfit)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCertificate(milestone);
            }}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Award className="h-5 w-5" />
            <span>Emitir Certificado (Escolher entre 12 Modelos)</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {onDownloadPdfDirect && (
            <button
              type="button"
              onClick={() => onDownloadPdfDirect(milestone)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-amber-400" />
              <span>Baixar Certificado em PDF Direto (A4)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Continuar Operando
          </button>
        </div>
      </div>
    </div>
  );
};
