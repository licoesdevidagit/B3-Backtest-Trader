import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Trash2, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Setup, Trade } from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  setups: Setup[];
  onImportData: (data: { trades: Trade[]; setups?: Setup[] }) => void;
  onResetSampleData: () => void;
  onClearAllTrades: () => void;
  onExportCSV: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  trades,
  setups,
  onImportData,
  onResetSampleData,
  onClearAllTrades,
  onExportCSV,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      setups,
      trades,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_b3_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.trades && Array.isArray(parsed.trades)) {
          onImportData({ trades: parsed.trades, setups: parsed.setups });
          setImportStatus(`Sucesso! ${parsed.trades.length} trades importados.`);
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('Arquivo JSON inválido ou formato incompatível.');
        }
      } catch (err) {
        setImportStatus('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Gerenciar e Exportar Dados
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Seus dados ficam salvos com segurança no seu navegador. Você pode exportar backups ou planilhas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4.5 space-y-3 overscroll-contain">
          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export section */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 space-y-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Exportar Backtest
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onExportCSV}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Planilha (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span>Backup (JSON)</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 space-y-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Restaurar Backup (JSON)
            </h3>
            <p className="text-[11px] text-slate-400">
              Importe um arquivo de backup (.json) exportado previamente para continuar seu backtest.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900 text-xs font-medium text-slate-200 transition-colors"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              <span>Selecionar arquivo JSON</span>
            </button>
          </div>

          {/* Iniciar do Zero & Backup Prompt */}
          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/20 space-y-2">
            <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Iniciar do Zero (Zerar Dados)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Apaga todas as informações e trades cadastrados. Recomendamos fazer um backup antes de prosseguir.
            </p>
            {showClearConfirm ? (
              <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 space-y-2.5">
                <p className="text-xs font-bold text-rose-200">
                  Deseja fazer um backup antes de apagar tudo e iniciar do zero?
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportJSON();
                      onClearAllTrades();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Fazer Backup & Iniciar do Zero</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllTrades();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Apagar sem Backup
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-rose-500/40 bg-rose-500/20 text-xs font-bold text-rose-200 hover:bg-rose-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span>Iniciar do Zero (Zerar Tudo com Backup Prévio)</span>
              </button>
            )}
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
