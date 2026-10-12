import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Sliders, ExternalLink, Minus, Maximize2 } from 'lucide-react';
import { Setup } from '../types';

interface SetupImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: Setup | null;
}

export const SetupImageLightboxModal: React.FC<SetupImageLightboxModalProps> = ({
  isOpen,
  onClose,
  setup,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isOpen || !setup || !setup.imageUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownload = () => {
    if (!setup.imageUrl) return;
    const link = document.createElement('a');
    link.href = setup.imageUrl;
    link.download = `setup_${setup.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_exemplo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Visualização minimizada (dock flutuante no canto inferior direito)
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 select-none max-w-sm ring-1 ring-emerald-500/30"
      >
        <img
          src={setup.imageUrl}
          alt={setup.name}
          className="h-10 w-10 rounded-lg object-cover border border-slate-700 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
            <Sliders className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>{setup.name}</span>
          </h4>
          <span className="text-[10px] text-slate-400 block font-mono">Imagem minimizada</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Restaurar / Maximizar visualização da imagem"
          >
            <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] sm:max-h-[90vh] my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {setup.name}
                </h3>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {setup.preferredAsset === 'AMBOS'
                    ? 'WIN / WDO'
                    : setup.preferredAsset === 'WIN'
                    ? 'Mini Índice'
                    : 'Mini Dólar'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exemplo gráfico de entrada / Foto do Setup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="Diminuir Zoom"
                className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Resetar Zoom"
                className="px-1.5 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Aumentar Zoom"
                className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              title="Baixar imagem do setup"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Botão Minimizar Janela */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Minimizar janela para dock flutuante"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image Container with Scroll & Zoom */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/80 min-h-[300px]">
          <div
            className="transition-transform duration-150 ease-out origin-center"
            style={{ transform: `scale(${scale})` }}
          >
            <img
              src={setup.imageUrl}
              alt={`Exemplo do setup ${setup.name}`}
              className="max-h-[60vh] max-w-full rounded-xl border border-slate-800 shadow-2xl object-contain pointer-events-auto"
            />
          </div>
        </div>

        {/* Footer info banner: Setup rules */}
        {(setup.description || setup.defaultGainPts || setup.defaultLossPts) && (
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {setup.description && (
              <p className="text-slate-300 leading-relaxed max-w-xl">
                <span className="font-semibold text-emerald-400">Gatilho/Regras: </span>
                {setup.description}
              </p>
            )}

            {(setup.defaultGainPts || setup.defaultLossPts) && (
              <div className="flex items-center gap-3 font-mono shrink-0">
                {setup.defaultGainPts && (
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Alvo: +{setup.defaultGainPts} pts
                  </span>
                )}
                {setup.defaultLossPts && (
                  <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Stop: -{setup.defaultLossPts} pts
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
