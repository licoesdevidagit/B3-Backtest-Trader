import React, { useState } from 'react';
import { MonthlyTaxApuracao } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  Receipt, 
  X, 
  Calendar, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  HelpCircle,
  Clock,
  Landmark
} from 'lucide-react';

interface DarfGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MonthlyTaxApuracao | null;
  onTogglePaid: (monthKey: string) => void;
}

export const DarfGuideModal: React.FC<DarfGuideModalProps> = ({
  isOpen,
  onClose,
  item,
  onTogglePaid,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const handleCopyInstructions = () => {
    const text = `DADOS PARA PREENCHIMENTO DO DARF (SICALCWEB):
Código da Receita: 6015 (Ganhos Líquidos em Operações em Bolsa - Pessoa Física)
Período de Apuração (PA): ${item.monthKey}
Data de Vencimento: ${item.dueDateFormatted}
Valor do Principal: ${formatBRL(item.darfDue)}
Multa: ${formatBRL(item.penaltyEstimate)}
Juros: ${formatBRL(item.interestEstimate)}
Valor Total a Pagar: ${formatBRL(item.totalDueWithInterest)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Guia de Apuração DARF Day Trade
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  CÓDIGO 6015
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Competência: <strong className="text-slate-200">{item.monthLabel}</strong> · Vencimento: <strong className="text-amber-400 font-mono">{item.dueDateFormatted}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4 overscroll-contain">

        {/* Status banner */}
        {item.isPaid ? (
          <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Esta DARF já foi marcada como PAGA por você.</span>
            </div>
            <button
              type="button"
              onClick={() => onTogglePaid(item.monthKey)}
              className="text-[11px] text-emerald-300 hover:underline shrink-0"
            >
              Desmarcar pagamento
            </button>
          </div>
        ) : item.isOverdue ? (
          <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Atenção: Data limite ultrapassada ({Math.abs(item.daysUntilDue)} dias de atraso). Emitir pelo Sicalc com encargos.</span>
            </div>
            <button
              type="button"
              onClick={() => onTogglePaid(item.monthKey)}
              className="text-[11px] font-bold px-2 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-colors shrink-0"
            >
              Marcar como Paga
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Clock className="h-4 w-4 shrink-0 text-amber-400" />
              <span>A vencer em {item.daysUntilDue} dias ({item.dueDateFormatted}). Pague sem juros até a data limite.</span>
            </div>
            <button
              type="button"
              onClick={() => onTogglePaid(item.monthKey)}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
            >
              Marcar como Paga
            </button>
          </div>
        )}

        {/* DARF Official Voucher Simulation Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs space-y-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-sans font-bold text-slate-200">
              <Landmark className="h-3.5 w-3.5 text-amber-400" />
              MINISTÉRIO DA FAZENDA · SECRETARIA DA RECEITA FEDERAL
            </span>
            <span className="font-bold text-white">DARF SIMPLES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-sans">02 · PERÍODO DE APURAÇÃO</span>
              <span className="text-white font-bold">{item.dueDate.substring(0, 7)} (Mês {item.monthLabel})</span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-sans">04 · CÓDIGO DA RECEITA</span>
              <span className="text-amber-400 font-bold text-sm">6015 - GANHOS LÍQ. BOLSA</span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-sans">06 · DATA DE VENCIMENTO</span>
              <span className="text-white font-bold">{item.dueDateFormatted}</span>
              <span className="text-[10px] text-slate-500 block font-sans">(Último dia útil do mês seguinte)</span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-sans">07 · VALOR DO PRINCIPAL (20% - IRRF)</span>
              <span className="text-emerald-400 font-bold text-sm">{formatBRL(item.darfDue)}</span>
            </div>

            {item.isOverdue && item.penaltyEstimate > 0 && (
              <>
                <div className="p-2 rounded bg-slate-900 border border-rose-900/40 space-y-0.5">
                  <span className="text-[10px] text-rose-400 block font-sans">08 · MULTA DE MORA ESTIMADA</span>
                  <span className="text-rose-300 font-bold">{formatBRL(item.penaltyEstimate)}</span>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-rose-900/40 space-y-0.5">
                  <span className="text-[10px] text-rose-400 block font-sans">09 · JUROS DE MORA ESTIMADOS</span>
                  <span className="text-rose-300 font-bold">{formatBRL(item.interestEstimate)}</span>
                </div>
              </>
            )}

            <div className="sm:col-span-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 block font-sans font-bold">10 · VALOR TOTAL A PAGAR</span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {item.isOverdue ? 'Principal + Multa + Juros estimados' : 'Imposto líquido apurado'}
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {formatBRL(item.totalDueWithInterest)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold font-sans">
            <span>Memória de Cálculo (Receita Federal)</span>
            <span className="text-slate-400 font-mono text-[11px]">{item.totalTrades} operações</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Lucro Líquido Mês:</span>
              <span className="font-bold text-white font-mono">{formatBRL(item.netResult)}</span>
            </div>

            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Prejuízo Compensado:</span>
              <span className="font-bold text-amber-400 font-mono">-{formatBRL(item.lossCompensated)}</span>
            </div>

            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Base de Cálculo (20%):</span>
              <span className="font-bold text-white font-mono">{formatBRL(item.taxBase)}</span>
            </div>

            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">IRRF 1% Retido:</span>
              <span className="font-bold text-emerald-400 font-mono">-{formatBRL(item.irrfDayTrade)}</span>
            </div>
          </div>
        </div>
        </div>

        {/* Pinned Actions bar */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyInstructions}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Dados Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copiar Dados p/ Sicalc</span>
                </>
              )}
            </button>

            <a
              href="https://sicalc.receita.fazenda.gov.br/sicalc/rapido/contribuinte"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir SicalcWeb</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-md"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
