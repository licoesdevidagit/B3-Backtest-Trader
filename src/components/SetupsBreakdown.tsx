import React, { useState, useMemo } from 'react';
import { Setup, SetupPerformanceStat } from '../types';
import { formatBRL } from '../utils/calculations';
import { Sliders, Plus, Trash2, AlertCircle, Check, Eye, EyeOff, RotateCcw, Image as ImageIcon, ArrowDownAZ } from 'lucide-react';
import { SetupImageLightboxModal } from './SetupImageLightboxModal';

interface SetupsBreakdownProps {
  stats: SetupPerformanceStat[];
  setups?: Setup[];
  onOpenNewSetup: () => void;
  onFilterBySetup?: (setupId: string) => void;
  onDeleteSetup?: (setupId: string) => void;
  excludedSetupIds?: string[];
  onToggleExcludeSetup?: (setupId: string) => void;
  onResetExcludedSetups?: () => void;
}

export const SetupsBreakdown: React.FC<SetupsBreakdownProps> = ({
  stats,
  setups = [],
  onOpenNewSetup,
  onFilterBySetup,
  onDeleteSetup,
  excludedSetupIds = [],
  onToggleExcludeSetup,
  onResetExcludedSetups,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxSetup, setLightboxSetup] = useState<Setup | null>(null);
  const [sortOption, setSortOption] = useState<'alpha' | 'profit' | 'winRate' | 'trades'>('alpha');

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (sortOption === 'alpha') {
        return a.setupName.localeCompare(b.setupName, 'pt-BR');
      }
      if (sortOption === 'winRate') {
        return b.winRate - a.winRate;
      }
      if (sortOption === 'trades') {
        return b.totalTrades - a.totalTrades;
      }
      return b.totalProfit - a.totalProfit;
    });
  }, [stats, sortOption]);

  if (stats.length === 0) {
    return null;
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSetup) {
      onDeleteSetup(id);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-emerald-400" />
            Desempenho Comparativo por Setup
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Descubra qual estratégia oferece a maior taxa de acerto e consistência financeira.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de Ordenação Alfabética A-Z */}
          <button
            type="button"
            onClick={() => setSortOption((prev) => (prev === 'alpha' ? 'profit' : 'alpha'))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              sortOption === 'alpha'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Ordenar setups em ordem alfabética (A-Z)"
          >
            <ArrowDownAZ className="h-3.5 w-3.5 text-purple-400" />
            <span>{sortOption === 'alpha' ? 'Ordem Alfabética (A-Z)' : 'Classificar A-Z'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors self-start sm:self-center"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cadastrar Setup</span>
          </button>
        </div>
      </div>

      {/* Notice about setup isolation / hiding */}
      {excludedSetupIds.length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>{excludedSetupIds.length} setup(s) ocultado(s) da análise da conta.</strong> O gráfico de patrimônio e a taxa de acerto excluem esses trades.
            </span>
          </div>
          {onResetExcludedSetups && (
            <button
              type="button"
              onClick={onResetExcludedSetups}
              className="text-xs font-bold text-amber-300 hover:text-white underline cursor-pointer"
            >
              Reexibir Todos os Setups
            </button>
          )}
        </div>
      )}

      {/* Mobile & Tablet Card View (visible on < md screens) */}
      <div className="mt-4 md:hidden space-y-2.5">
        {sortedStats.map((s) => {
          const winRate = s.winRate;
          const hasTrades = s.totalTrades > 0;
          const isDeletingThis = confirmDeleteId === s.setupId;
          const setupItem = setups.find((item) => item.id === s.setupId);
          const isExcluded = excludedSetupIds.includes(s.setupId);

          return (
            <div
              key={s.setupId}
              className={`rounded-xl border p-3.5 space-y-2.5 shadow-sm transition-all ${
                isExcluded
                  ? 'border-rose-500/30 bg-slate-950/40 opacity-75'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {setupItem?.imageUrl && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxSetup(setupItem);
                      }}
                      className="relative w-12 h-9 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 cursor-pointer group shadow-sm hover:border-emerald-500 transition-all"
                      title="Ver foto de exemplo do setup"
                    >
                      <img
                        src={setupItem.imageUrl}
                        alt={`Foto de ${s.setupName}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-emerald-400">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {s.setupName}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {s.totalTrades} trades ({s.wins} Gain · {s.losses} Loss{s.breakevens > 0 ? ` · ${s.breakevens} 0x0` : ''})
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span
                    className={`text-sm font-bold ${
                      s.totalProfit > 0
                        ? 'text-emerald-400'
                        : s.totalProfit < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {formatBRL(s.totalProfit)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Média: {formatBRL(s.avgProfitPerTrade)}
                  </span>
                </div>
              </div>

              {/* Win Rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400">Taxa de Acerto:</span>
                  <span
                    className={`font-bold ${
                      !hasTrades
                        ? 'text-slate-500'
                        : winRate >= 50
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {hasTrades ? `${winRate.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${hasTrades ? winRate : 0}%` }}
                    className={`h-full ${
                      winRate >= 60
                        ? 'bg-emerald-500'
                        : winRate >= 45
                        ? 'bg-blue-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Bottom Row: Profit Factor and Action */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Fator Lucro: </span>
                  <strong className="text-white">{s.profitFactor > 0 ? s.profitFactor.toFixed(2) : '-'}</strong>
                </div>

                <div className="flex items-center gap-2 font-sans">
                  {onFilterBySetup && (
                    <button
                      type="button"
                      onClick={() => onFilterBySetup(s.setupId)}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                    >
                      Ver Trades
                    </button>
                  )}

                  {onDeleteSetup && (
                    <>
                      {isDeletingThis ? (
                        <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={(e) => handleDelete(s.setupId, e)}
                            className="px-2 py-0.5 text-xs font-bold rounded bg-rose-500 text-white"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(s.setupId)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Excluir setup"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid or Table of Setups (hidden on mobile, visible on md+) */}
      <div className="mt-4 hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400">
              <th className="pb-2.5 font-medium">Setup</th>
              {onToggleExcludeSetup && <th className="pb-2.5 font-medium text-center">Análise</th>}
              <th className="pb-2.5 font-medium text-center">Trades</th>
              <th className="pb-2.5 font-medium">Taxa de Acerto</th>
              <th className="pb-2.5 font-medium text-right">Resultado (R$)</th>
              <th className="pb-2.5 font-medium text-right">Fator de Lucro</th>
              <th className="pb-2.5 font-medium text-right">Média / Trade</th>
              {onDeleteSetup && <th className="pb-2.5 font-medium text-right">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedStats.map((s) => {
              const winRate = s.winRate;
              const hasTrades = s.totalTrades > 0;
              const isDeletingThis = confirmDeleteId === s.setupId;
              const setupItem = setups.find((item) => item.id === s.setupId);
              const isExcluded = excludedSetupIds.includes(s.setupId);

              return (
                <tr
                  key={s.setupId}
                  className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                    isExcluded ? 'opacity-60 bg-slate-950/20' : ''
                  }`}
                  onClick={() => onFilterBySetup && onFilterBySetup(s.setupId)}
                  title="Clique para filtrar trades deste setup no histórico"
                >
                  <td className="py-3 pr-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      {setupItem?.imageUrl && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxSetup(setupItem);
                          }}
                          className="relative w-11 h-8 rounded-md overflow-hidden border border-slate-700 bg-slate-900 shrink-0 cursor-pointer group shadow-sm hover:border-emerald-500 transition-all"
                          title="Clique para ver o print do setup ampliado"
                        >
                          <img
                            src={setupItem.imageUrl}
                            alt={`Foto de ${s.setupName}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-emerald-400">
                            <Eye className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold transition-colors ${
                            isExcluded ? 'line-through text-slate-400' : 'text-white group-hover:text-emerald-400'
                          }`}>
                            {s.setupName}
                          </span>
                          {isExcluded && (
                            <span className="text-[9px] font-mono font-bold px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Oculto
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] font-mono text-slate-400">
                          {s.wins} Gain · {s.losses} Loss{s.breakevens > 0 ? ` · ${s.breakevens} 0x0` : ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  {onToggleExcludeSetup && (
                    <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleExcludeSetup(s.setupId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                          isExcluded
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                        }`}
                        title={
                          isExcluded
                            ? 'Trades deste setup estão OCULTADOS da análise da conta. Clique para REEXIBIR.'
                            : 'Trades deste setup estão INCLUÍDOS na análise da conta. Clique para OCULTAR.'
                        }
                      >
                        {isExcluded ? <EyeOff className="h-3 w-3 text-rose-400" /> : <Eye className="h-3 w-3 text-emerald-400" />}
                        <span>{isExcluded ? 'Oculto' : 'Ativo'}</span>
                      </button>
                    </td>
                  )}

                  <td className="py-3 px-2 text-center text-slate-300">
                    {s.totalTrades}
                  </td>

                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-800 overflow-hidden shrink-0">
                        <div
                          style={{ width: `${hasTrades ? winRate : 0}%` }}
                          className={`h-full ${
                            winRate >= 60
                              ? 'bg-emerald-500'
                              : winRate >= 45
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <span
                        className={`font-semibold ${
                          !hasTrades
                            ? 'text-slate-500'
                            : winRate >= 50
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {hasTrades ? `${winRate.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-right">
                    <span
                      className={`font-bold ${
                        s.totalProfit > 0
                          ? 'text-emerald-400'
                          : s.totalProfit < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatBRL(s.totalProfit)}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-right">
                    <span
                      className={
                        s.profitFactor >= 1.5
                          ? 'text-emerald-400 font-bold'
                          : s.profitFactor >= 1.0
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }
                    >
                      {s.profitFactor > 0 ? s.profitFactor.toFixed(2) : '-'}
                    </span>
                  </td>

                  <td className="py-3 pl-2 text-right">
                    <span
                      className={
                        s.avgProfitPerTrade > 0
                          ? 'text-emerald-400'
                          : s.avgProfitPerTrade < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {formatBRL(s.avgProfitPerTrade)}
                    </span>
                  </td>

                  {/* Delete Action button */}
                  {onDeleteSetup && (
                    <td className="py-3 pl-3 pr-2 text-right whitespace-nowrap font-sans" onClick={(e) => e.stopPropagation()}>
                      {isDeletingThis ? (
                        <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                          <span className="text-[10px] text-rose-300 font-semibold px-1">
                            Excluir?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(s.setupId, e)}
                            className="px-2 py-0.5 text-xs font-bold rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 text-xs rounded text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(s.setupId);
                          }}
                          title="Excluir este setup"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lightbox Modal */}
      <SetupImageLightboxModal
        isOpen={!!lightboxSetup}
        onClose={() => setLightboxSetup(null)}
        setup={lightboxSetup}
      />
    </div>
  );
};
