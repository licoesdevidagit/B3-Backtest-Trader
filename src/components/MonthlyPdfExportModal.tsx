import React, { useState } from 'react';
import { X, FileDown, Check, Calendar, User, FileText, CheckCircle2, ShieldCheck, Layers, BarChart3 } from 'lucide-react';
import { MonthlySummary, Setup, Trade } from '../types';
import { exportMonthlyPerformancePdf } from '../utils/pdfExport';
import { formatBRL } from '../utils/calculations';

interface MonthlyPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyData: MonthlySummary[];
  trades: Trade[];
  setups: Setup[];
  initialMonthKey?: string;
}

export const MonthlyPdfExportModal: React.FC<MonthlyPdfExportModalProps> = ({
  isOpen,
  onClose,
  monthlyData,
  trades,
  setups,
  initialMonthKey,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    if (initialMonthKey && initialMonthKey !== 'ALL') return initialMonthKey;
    return monthlyData[0]?.monthKey || 'ALL';
  });

  const [includeTradesList, setIncludeTradesList] = useState<boolean>(true);
  const [includeSetupsBreakdown, setIncludeSetupsBreakdown] = useState<boolean>(true);
  const [includeAssetComparison, setIncludeAssetComparison] = useState<boolean>(true);
  const [traderName, setTraderName] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Sync with initialMonthKey if it changes when opening
  React.useEffect(() => {
    if (isOpen && initialMonthKey) {
      setSelectedMonthKey(initialMonthKey);
      setDownloadSuccess(false);
    }
  }, [isOpen, initialMonthKey]);

  if (!isOpen) return null;

  const isAllMonths = selectedMonthKey === 'ALL';
  const currentMonthData = isAllMonths
    ? null
    : monthlyData.find((m) => m.monthKey === selectedMonthKey) || monthlyData[0];

  const handleExport = () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      setTimeout(() => {
        exportMonthlyPerformancePdf(monthlyData, trades, setups, {
          monthKey: selectedMonthKey,
          includeTradesList,
          includeSetupsBreakdown,
          includeAssetComparison,
          traderName: traderName.trim() || undefined,
        });

        setIsExporting(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }, 250);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Exportar Relatório Mensal em PDF</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Gere um documento profissional em formato PDF para salvar e arquivar seu histórico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4 overscroll-contain">
          {/* 1. Month Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Selecione o Período / Mês para o Relatório:
            </label>
            <div className="relative">
              <select
                value={selectedMonthKey}
                onChange={(e) => {
                  setSelectedMonthKey(e.target.value);
                  setDownloadSuccess(false);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Consolidado Geral (Todos os {monthlyData.length} meses operados)</option>
                {monthlyData.map((m) => (
                  <option key={m.monthKey} value={m.monthKey}>
                    {m.monthLabel} · {formatBRL(m.netProfit)} ({m.totalTrades} trades)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Monthly Summary Card Preview */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isAllMonths ? 'Consolidado de Todos os Meses' : currentMonthData?.monthLabel}</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  (isAllMonths
                    ? monthlyData.reduce((acc, m) => acc + m.netProfit, 0)
                    : currentMonthData?.netProfit || 0) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {isAllMonths
                  ? formatBRL(monthlyData.reduce((acc, m) => acc + m.netProfit, 0))
                  : formatBRL(currentMonthData?.netProfit || 0)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              <div>
                <span className="text-slate-500 block">Trades:</span>
                <strong className="text-white">
                  {isAllMonths
                    ? monthlyData.reduce((acc, m) => acc + m.totalTrades, 0)
                    : currentMonthData?.totalTrades || 0}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Taxa Acerto:</span>
                <strong className="text-emerald-400">
                  {isAllMonths
                    ? `${(
                        (monthlyData.reduce((acc, m) => acc + m.wins, 0) /
                          Math.max(monthlyData.reduce((acc, m) => acc + m.totalTrades, 0), 1)) *
                        100
                      ).toFixed(1)}%`
                    : `${currentMonthData?.winRate.toFixed(1) || 0}%`}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Fator Lucro:</span>
                <strong className="text-white">
                  {isAllMonths
                    ? '-'
                    : currentMonthData?.profitFactor && currentMonthData.profitFactor > 0
                    ? currentMonthData.profitFactor.toFixed(2)
                    : '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* 3. Trader Name (Optional Header Signature) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Trader (opcional para o cabeçalho do documento):
            </label>
            <div className="relative">
              <input
                type="text"
                value={traderName}
                onChange={(e) => setTraderName(e.target.value)}
                placeholder="Ex: Seu Nome ou Conta da Corretora"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Section Inclusions */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-300 block">
              Seções incluídas no documento PDF:
            </span>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:bg-slate-950/80 transition-colors">
              <input
                type="checkbox"
                checked={includeTradesList}
                onChange={(e) => setIncludeTradesList(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-medium text-white">Tabela Detalhada de Trades</span>
                <p className="text-[11px] text-slate-400">
                  Lista cronológica com hora, ativo, setup, contratos, resultado e pontos de cada operação
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:bg-slate-950/80 transition-colors">
              <input
                type="checkbox"
                checked={includeSetupsBreakdown}
                onChange={(e) => setIncludeSetupsBreakdown(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-medium text-white">Desempenho por Setup</span>
                <p className="text-[11px] text-slate-400">
                  Resumo das estratégias operadas no mês com taxa de acerto e lucro por setup
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:bg-slate-950/80 transition-colors">
              <input
                type="checkbox"
                checked={includeAssetComparison}
                onChange={(e) => setIncludeAssetComparison(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-medium text-white">Comparativo por Ativo (WIN vs WDO)</span>
                <p className="text-[11px] text-slate-400">
                  Sub-total do Mini Índice e Mini Dólar separadamente
                </p>
              </div>
            </label>
          </div>

          {/* Feedback message */}
          {downloadSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Relatório em PDF gerado e baixado com sucesso! Salvo no seu computador.</span>
            </div>
          )}
        </div>

        {/* Pinned Footer Actions */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            <span>{isExporting ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
