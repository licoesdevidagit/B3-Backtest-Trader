import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Sparkles, 
  Target, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import { DashboardMetrics, Setup, Trade } from '../types';
import { formatBRL, calculateSetupsPerformance } from '../utils/calculations';

interface MathematicalExpectancyCardProps {
  metrics: DashboardMetrics;
  trades: Trade[];
  setups: Setup[];
  onFilterBySetup?: (setupId: string) => void;
  onOpenNewTrade?: () => void;
}

export const MathematicalExpectancyCard: React.FC<MathematicalExpectancyCardProps> = ({
  metrics,
  trades,
  setups,
  onFilterBySetup,
  onOpenNewTrade,
}) => {
  const [projectedTradeCount, setProjectedTradeCount] = useState<number>(100);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);

  const {
    totalTrades,
    wins,
    losses,
    winRate,
    lossRate,
    avgGain,
    avgLoss,
    mathematicalExpectancy,
    winStats,
    wdoStats,
  } = metrics;

  // Decimal rates for the exact mathematical formula
  const winRateDec = totalTrades > 0 ? wins / totalTrades : 0;
  const lossRateDec = totalTrades > 0 ? losses / totalTrades : 0;
  const winContribution = Number((winRateDec * avgGain).toFixed(2));
  const lossContribution = Number((lossRateDec * avgLoss).toFixed(2));

  // Long-term projection calculation
  const projectedReturn = Number((mathematicalExpectancy * projectedTradeCount).toFixed(2));

  // Setups performance with mathematical expectancy
  const setupsPerformance = useMemo(() => {
    return calculateSetupsPerformance(trades, setups);
  }, [trades, setups]);

  // Status configuration
  const isPositive = mathematicalExpectancy > 0;
  const isNeutral = mathematicalExpectancy === 0;

  if (totalTrades === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center backdrop-blur-sm shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <Calculator className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Expectativa Matemática (EM)</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          A Expectativa Matemática calcula o retorno financeiro médio esperado a cada trade realizado:
          <span className="block mt-1 font-mono text-slate-300">
            EM = (Taxa de Acerto × Ganho Médio) - (Taxa de Erro × Perda Média)
          </span>
        </p>
        <button
          type="button"
          onClick={onOpenNewTrade}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
        >
          Registrar Operações para Calcular
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            isPositive 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
              : isNeutral 
              ? 'bg-slate-800/60 border-slate-700 text-slate-400' 
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
          }`}>
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Expectativa Matemática (EM)
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : isNeutral
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {isPositive ? 'Edge Positivo' : isNeutral ? 'Equilíbrio (0x0)' : 'Edge Negativo'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Retorno financeiro médio projetado por trade com base no seu histórico operacional.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/90 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400">EM por trade:</span>
          <span className={`text-base font-bold font-mono ${
            isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-300' : 'text-rose-400'
          }`}>
            {isPositive ? `+${formatBRL(mathematicalExpectancy)}` : formatBRL(mathematicalExpectancy)}
          </span>
        </div>
      </div>

      {/* Hero Display & Formula Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Card: Primary Result & Insight */}
        <div className={`lg:col-span-5 rounded-xl border p-4 flex flex-col justify-between ${
          isPositive
            ? 'bg-gradient-to-br from-emerald-950/20 via-slate-900/90 to-slate-900/90 border-emerald-500/20'
            : isNeutral
            ? 'bg-slate-900/70 border-slate-800'
            : 'bg-gradient-to-br from-rose-950/20 via-slate-900/90 to-slate-900/90 border-rose-500/20'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-indigo-400" />
                Valor Esperado por Trade
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {totalTrades} operações
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums ${
                isPositive ? 'text-emerald-400' : isNeutral ? 'text-white' : 'text-rose-400'
              }`}>
                {isPositive ? `+${formatBRL(mathematicalExpectancy)}` : formatBRL(mathematicalExpectancy)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / operação
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {isPositive ? (
                <>
                  <strong className="text-emerald-400">Vantagem estatística confirmada:</strong> A cada clique no mercado, seu operacional gera em média <span className="font-mono font-semibold text-white">+{formatBRL(mathematicalExpectancy)}</span>. A lei dos grandes números trabalha a seu favor no longo prazo.
                </>
              ) : isNeutral ? (
                <>
                  <strong className="text-amber-400">Ponto de equilíbrio neutro:</strong> Seu sistema está empatando financeiramente entre ganhos e perdas. Pequenos ajustes em taxa de acerto ou payoff elevarão seu edge.
                </>
              ) : (
                <>
                  <strong className="text-rose-400">Expectativa matemática desfavorável:</strong> O sistema perde em média <span className="font-mono font-semibold text-rose-300">{formatBRL(Math.abs(mathematicalExpectancy))}</span> a cada trade. Reduza stops, aumente o alvo ou filtre os melhores setups.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Taxa Acerto: <strong className="text-slate-200">{winRate.toFixed(1)}%</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Taxa Erro: <strong className="text-slate-200">{lossRate.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Right Card: Step-by-Step Formula Substitution */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Fórmula da Expectativa Matemática
              </span>
              <button
                type="button"
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
              >
                <Info className="h-3 w-3" />
                {showFormulaDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
            </div>

            {/* Formula Banner */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-center text-slate-200 overflow-x-auto shadow-inner">
              <span className="text-indigo-400 font-bold">EM</span> = (
              <span className="text-emerald-400 font-semibold">Taxa de Acerto</span> ×{' '}
              <span className="text-emerald-400 font-semibold">Ganho Médio</span>) - (
              <span className="text-rose-400 font-semibold">Taxa de Erro</span> ×{' '}
              <span className="text-rose-400 font-semibold">Perda Média</span>)
            </div>

            {showFormulaDetails && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Win Side */}
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase block">
                      Potencial de Ganho Ponderado
                    </span>
                    <div className="mt-1 font-mono text-[11px] text-slate-300">
                      {winRate.toFixed(1)}% ({winRateDec.toFixed(3)}) × {formatBRL(avgGain)}
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
                      =+{formatBRL(winContribution)}
                    </div>
                  </div>

                  {/* Loss Side */}
                  <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15">
                    <span className="text-[10px] text-rose-400 font-semibold uppercase block">
                      Risco de Perda Ponderado
                    </span>
                    <div className="mt-1 font-mono text-[11px] text-slate-300">
                      {lossRate.toFixed(1)}% ({lossRateDec.toFixed(3)}) × {formatBRL(avgLoss)}
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-rose-400">
                      =-{formatBRL(lossContribution)}
                    </div>
                  </div>
                </div>

                {/* Calculation Resolution */}
                <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">
                    Substituição: ({formatBRL(winContribution)}) - ({formatBRL(lossContribution)})
                  </span>
                  <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    = {isPositive ? `+${formatBRL(mathematicalExpectancy)}` : formatBRL(mathematicalExpectancy)} / trade
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Dica: Se a Expectativa Matemática for positiva, você pode tolerar sequências de perdas normais sem desviar do plano.
          </div>
        </div>
      </div>

      {/* Long-term Simulation Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Simulador de Projeção de Longo Prazo
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Projeção do resultado financeiro acumulado mantendo os parâmetros atuais:
            </p>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-1.5">
            {[25, 50, 100, 250, 500].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setProjectedTradeCount(count)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  projectedTradeCount === count
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {count}T
              </button>
            ))}
          </div>
        </div>

        {/* Projection Box */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Volume Projetado</span>
            <span className="text-lg font-bold font-mono text-white mt-0.5 block">
              {projectedTradeCount} trades
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Execução fiel ao plano
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">EM Base por Operação</span>
            <span className={`text-lg font-bold font-mono mt-0.5 block ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositive ? `+${formatBRL(mathematicalExpectancy)}` : formatBRL(mathematicalExpectancy)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Retorno estatístico unitário
            </span>
          </div>

          <div className={`p-3 rounded-lg border ${
            projectedReturn >= 0
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : 'bg-rose-500/10 border-rose-500/25'
          }`}>
            <span className="text-[10px] uppercase font-semibold block text-slate-300">
              Retorno Esperado Acumulado
            </span>
            <span className={`text-xl font-extrabold font-mono mt-0.5 block ${
              projectedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {projectedReturn >= 0 ? `+${formatBRL(projectedReturn)}` : formatBRL(projectedReturn)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              ({projectedTradeCount} × {formatBRL(mathematicalExpectancy)})
            </span>
          </div>
        </div>
      </div>

      {/* Asset Breakdown: Mini Índice (WIN) vs Mini Dólar (WDO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* WIN Card */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                WIN
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Mini Índice</span>
                <span className="text-[10px] text-slate-400 font-mono ml-2">
                  {winStats.trades} trades
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-sm font-bold font-mono ${
                winStats.mathematicalExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {winStats.mathematicalExpectancy >= 0 
                  ? `+${formatBRL(winStats.mathematicalExpectancy)}` 
                  : formatBRL(winStats.mathematicalExpectancy)}
                <span className="text-[10px] text-slate-400 font-normal"> / trade</span>
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-400">
            <div>
              <span className="text-[9px] text-slate-400 block">Acerto:</span>
              <span className="text-white font-semibold">{winStats.winRate}%</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Ganho Méd.:</span>
              <span className="text-emerald-400 font-semibold">+{formatBRL(winStats.avgGain)}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">Perda Méd.:</span>
              <span className="text-rose-400 font-semibold">-{formatBRL(winStats.avgLoss)}</span>
            </div>
          </div>
        </div>

        {/* WDO Card */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                WDO
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Mini Dólar</span>
                <span className="text-[10px] text-slate-400 font-mono ml-2">
                  {wdoStats.trades} trades
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-sm font-bold font-mono ${
                wdoStats.mathematicalExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {wdoStats.mathematicalExpectancy >= 0 
                  ? `+${formatBRL(wdoStats.mathematicalExpectancy)}` 
                  : formatBRL(wdoStats.mathematicalExpectancy)}
                <span className="text-[10px] text-slate-400 font-normal"> / trade</span>
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-400">
            <div>
              <span className="text-[9px] text-slate-400 block">Acerto:</span>
              <span className="text-white font-semibold">{wdoStats.winRate}%</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Ganho Méd.:</span>
              <span className="text-emerald-400 font-semibold">+{formatBRL(wdoStats.avgGain)}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">Perda Méd.:</span>
              <span className="text-rose-400 font-semibold">-{formatBRL(wdoStats.avgLoss)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking of Setups by Expectativa Matemática */}
      {setupsPerformance.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Ranking de Expectativa Matemática por Setup
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Ordenado por EM / trade
            </span>
          </div>

          <div className="space-y-2">
            {[...setupsPerformance]
              .sort((a, b) => (b.mathematicalExpectancy || 0) - (a.mathematicalExpectancy || 0))
              .map((stat) => {
                const em = stat.mathematicalExpectancy || 0;
                const isStatPos = em > 0;
                return (
                  <div
                    key={stat.setupId}
                    className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/90 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        isStatPos ? 'bg-emerald-400' : em === 0 ? 'bg-slate-400' : 'bg-rose-400'
                      }`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {stat.setupName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stat.totalTrades}T · Acerto: {stat.winRate}% · Ganho: +{formatBRL(stat.avgGain || 0)} · Perda: -{formatBRL(stat.avgLoss || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <span className={`text-xs font-bold font-mono ${
                          isStatPos ? 'text-emerald-400' : em === 0 ? 'text-slate-300' : 'text-rose-400'
                        }`}>
                          {isStatPos ? `+${formatBRL(em)}` : formatBRL(em)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          / trade
                        </span>
                      </div>

                      {onFilterBySetup && (
                        <button
                          type="button"
                          onClick={() => onFilterBySetup(stat.setupId)}
                          title="Filtrar trades deste setup no histórico"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
