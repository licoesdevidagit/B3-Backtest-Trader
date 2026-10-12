import React from 'react';
import { MonthlyTaxApuracao } from '../types';
import { formatBRL } from '../utils/calculations';
import { 
  Calculator, 
  X, 
  ArrowRight, 
  Minus, 
  Plus, 
  Equal, 
  ShieldCheck, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  HelpCircle,
  Clock
} from 'lucide-react';

interface DarfCalculationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MonthlyTaxApuracao | null;
  onOpenGuide?: (item: MonthlyTaxApuracao) => void;
}

export const DarfCalculationBreakdownModal: React.FC<DarfCalculationBreakdownModalProps> = ({
  isOpen,
  onClose,
  item,
  onOpenGuide,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Memória de Cálculo da DARF
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  {item.monthLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Veja o passo a passo exato de cada regra da Receita Federal aplicada para chegar no valor de{' '}
                <strong className="text-amber-400 font-mono">{formatBRL(item.darfDue)}</strong>.
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

        {/* Big Highlight Banner: The Final Result */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-amber-400/90 tracking-wider block">
              Valor Final Apurado da DARF (Código 6015)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                {formatBRL(item.darfDue)}
              </span>
              <span className="text-xs text-slate-400">
                {item.darfDue > 0
                  ? item.isPaid
                    ? '• Status: Quitado / Pago'
                    : '• Status: Aguardando Pagamento'
                  : item.netResult > 0
                  ? '• Isento por compensação de prejuízo ou saldo < R$ 10'
                  : '• Sem imposto devido (mês com prejuízo)'}
              </span>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[10px] text-slate-400 block">Data Limite Oficial:</span>
            <span className="text-sm font-bold text-white font-mono flex items-center gap-1 sm:justify-end">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              {item.dueDateFormatted}
            </span>
            <span className="text-[10px] text-slate-500 block">Último dia útil do mês seguinte</span>
          </div>
        </div>

        {/* Step-by-Step Mathematical Flow */}
        <div className="space-y-3 text-xs">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span>Passo a Passo do Cálculo Oficial:</span>
          </h3>

          {/* STEP 1: Lucro Líquido do Mês */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] font-mono">
                  1
                </span>
                <span className="font-bold text-white">Resultado Operacional do Mês (Day Trade)</span>
              </div>
              <span className={`font-mono font-bold text-sm ${item.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(item.netResult)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pl-7 text-slate-400">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Ganhos Brutos (Trades com Gain):</span>
                <span className="text-emerald-400 font-bold">+{formatBRL(item.grossGain)}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Perdas Brutas (Trades com Loss):</span>
                <span className="text-rose-400 font-bold">-{formatBRL(item.grossLoss)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pl-7 leading-relaxed font-sans">
              Em Day Trade na B3, somam-se todas as operações realizadas de 1º ao último dia do mês para apuração do resultado líquido.
            </p>
          </div>

          {/* STEP 2: Prejuízo Acumulado & Compensação */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] font-mono">
                  2
                </span>
                <span className="font-bold text-white">Compensação de Prejuízos de Meses Anteriores</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {item.lossCompensated > 0 ? `-${formatBRL(item.lossCompensated)}` : 'R$ 0,00'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pl-7 text-slate-400">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Prejuízo trazido do passado:</span>
                <span className="text-slate-300">{formatBRL(item.accumulatedLossPrevious)}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Prejuízo restante p/ próximo mês:</span>
                <span className="text-rose-300 font-bold">{formatBRL(item.accumulatedLossRemaining)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pl-7 leading-relaxed font-sans">
              {item.lossCompensated > 0 ? (
                <span>
                  A legislação da Receita Federal permitiu abater <strong className="text-amber-400 font-mono">{formatBRL(item.lossCompensated)}</strong> de prejuízos passados diretamente do lucro deste mês, reduzindo seu imposto legalmente.
                </span>
              ) : item.accumulatedLossPrevious > 0 ? (
                <span>
                  Você possuía prejuízos passados de <strong className="text-slate-300 font-mono">{formatBRL(item.accumulatedLossPrevious)}</strong>. Como o mês não teve lucro, esse prejuízo continua acumulado.
                </span>
              ) : (
                <span>
                  Você não tinha prejuízos acumulados anteriores para compensar neste mês.
                </span>
              )}
            </p>
          </div>

          {/* STEP 3: Base de Cálculo Tributável */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] font-mono">
                  3
                </span>
                <span className="font-bold text-white">Base de Cálculo Tributável</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {formatBRL(item.taxBase)}
              </span>
            </div>

            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80 font-mono text-[11px] pl-3 text-slate-300 flex items-center justify-between">
              <span>Fórmula: Lucro ({formatBRL(Math.max(0, item.netResult))}) - Prejuízo Compensado ({formatBRL(item.lossCompensated)})</span>
              <strong className="text-white">= {formatBRL(item.taxBase)}</strong>
            </div>

            <p className="text-[11px] text-slate-400 pl-7 font-sans">
              É sobre este valor que incide o Imposto de Renda. Não existe isenção de R$ 20.000 para Day Trade.
            </p>
          </div>

          {/* STEP 4: Alíquota de 20% & IRRF Retido (Dedo-Duro) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] font-mono">
                  4
                </span>
                <span className="font-bold text-white">Aplicação da Alíquota (20%) e Dedução de IRRF</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formatBRL(item.irNetCalculated)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pl-7">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">IR Bruto (Base × 20%):</span>
                <span className="text-slate-200 font-bold">{formatBRL(item.irGross)}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-sans">IRRF 1% Retido pela Corretora:</span>
                <span className="text-sky-300 font-bold">-{formatBRL(item.irrfDayTrade)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pl-7 leading-relaxed font-sans">
              A corretora retém 1% na fonte nos dias com lucro ("dedo-duro"). Esse valor de{' '}
              <strong className="text-sky-300 font-mono">{formatBRL(item.irrfDayTrade)}</strong> é deduzido da sua DARF para evitar que você pague imposto duas vezes.
            </p>
          </div>

          {/* STEP 5: Regra dos R$ 10,00 e Valor Final */}
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px] font-mono">
                  5
                </span>
                <span className="font-bold text-white">Regra dos R$ 10,00 & Valor Final da DARF</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-base">
                {formatBRL(item.darfDue)}
              </span>
            </div>

            {item.darfAccumulatedPrevious > 0 && (
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between pl-3">
                <span>+ Saldo acumulado vindo do mês anterior (&lt; R$ 10,00):</span>
                <span className="text-amber-300 font-bold">+{formatBRL(item.darfAccumulatedPrevious)}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-300 pl-7 leading-relaxed font-sans">
              {item.darfDue >= 10 ? (
                <span>
                  O imposto total calculado atingiu o valor mínimo de R$ 10,00 exigido pela Receita Federal. Portanto, a DARF a pagar é de{' '}
                  <strong className="text-amber-400 font-mono">{formatBRL(item.darfDue)}</strong>.
                </span>
              ) : item.darfDue === 0 && item.netResult > 0 && item.taxBase > 0 ? (
                <span className="text-amber-300">
                  O valor calculado foi inferior a R$ 10,00. A Receita Federal proíbe emitir DARF menor que R$ 10,00. Esse valor de{' '}
                  <strong className="text-white font-mono">{formatBRL(item.darfCarriedForward)}</strong> fica guardado e será somado à DARF do próximo mês lucrativo!
                </span>
              ) : (
                <span>
                  Nenhum imposto a recolher para esta competência.
                </span>
              )}
            </p>
          </div>
        </div>
        </div>

        {/* Pinned Footer Actions */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Vencimento: <strong className="text-white">{item.dueDateFormatted}</strong>
          </div>

          <div className="flex items-center gap-2">
            {item.darfDue > 0 && onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuide(item);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors border border-slate-700 cursor-pointer"
              >
                Ver Guia de Pagamento (6015)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-md cursor-pointer"
            >
              Entendido / Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
