import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { formatBRL, formatDateBR, formatPoints } from '../utils/calculations';
import { calculateStreakAnalysis } from '../utils/streakCalculations';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  Award, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Activity, 
  Clock,
  Layers,
  Info
} from 'lucide-react';

interface WinningStreakWidgetProps {
  trades: Trade[];
}

export const WinningStreakWidget: React.FC<WinningStreakWidgetProps> = ({ trades }) => {
  const [isRecordTradesOpen, setIsRecordTradesOpen] = useState<boolean>(false);

  const analysis = useMemo(() => {
    return calculateStreakAnalysis(trades);
  }, [trades]);

  const {
    currentWinningStreak,
    longestWinningStreak,
    currentLosingStreak,
    longestLosingStreak,
    averageWinningStreak,
    totalWinningStreaksCount,
    streakDistribution,
    winRateAfterWin,
    recentTrades,
  } = analysis;

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <Flame className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-white">Winning Streak (Sequências Vencedoras)</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Registre operações para acompanhar sua sequência atual de vitórias consecutivas e o recorde histórico de consistência da estratégia.
        </p>
      </div>
    );
  }

  const isStreakHot = currentWinningStreak.count >= 3;
  const isStreakActive = currentWinningStreak.count >= 1;
  const streakRecordPercentage = longestWinningStreak.count > 0 
    ? Math.min(100, Math.round((currentWinningStreak.count / longestWinningStreak.count) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border shadow-sm ${
            isStreakHot 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Winning Streak</span>
                <span className="text-slate-400 font-normal text-xs sm:text-sm">· Sequências de Vitórias</span>
              </h3>
              {isStreakHot ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                  <Flame className="h-3 w-3" /> EM CHAMAS ({currentWinningStreak.count} GAINS)
                </span>
              ) : isStreakActive ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> MOMENTO POSITIVO
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  NEUTRO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Contagem de operações lucrativas consecutivas no momento e histórico do maior ciclo de ganhos.
            </p>
          </div>
        </div>

        {/* Top Quick Status Tag */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Recorde Histórico:</span>
            <strong className="text-amber-400 font-bold">{longestWinningStreak.count} vitórias</strong>
          </span>
        </div>
      </div>

      {/* Main 2 Highlight Hero Cards (Current vs Longest) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* CARD 1: SEQUÊNCIA ATUAL DE VITÓRIAS */}
        <div className={`rounded-2xl border p-4.5 space-y-3 relative overflow-hidden transition-all shadow-md ${
          isStreakHot 
            ? 'border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 ring-1 ring-amber-500/20' 
            : isStreakActive
            ? 'border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/15 to-slate-950'
            : 'border-slate-800 bg-slate-950/70'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${
                isStreakHot ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                <Flame className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sequência Atual de Vitórias
              </span>
            </div>
            {isStreakActive && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                EM ANDAMENTO
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums ${
                  isStreakHot ? 'text-amber-400' : isStreakActive ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {currentWinningStreak.count}
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {currentWinningStreak.count === 1 ? 'vitória seguida' : 'vitórias consecutivas'}
                </span>
              </div>
              <div className="text-xs font-mono pt-1">
                {isStreakActive ? (
                  <span className="text-emerald-400 font-bold text-sm">
                    +{formatBRL(currentWinningStreak.totalProfit)}
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      acumulados na sequência
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-500">
                    O último trade foi um {currentLosingStreak.count > 0 ? `loss (${currentLosingStreak.count} seguidos)` : '0x0 ou neutro'}.
                  </span>
                )}
              </div>
            </div>

            {isStreakActive && (
              <div className="text-right text-[11px] font-mono text-slate-400">
                {currentWinningStreak.totalPointsWIN !== 0 && (
                  <div className="text-blue-400">WIN: +{currentWinningStreak.totalPointsWIN} pts</div>
                )}
                {currentWinningStreak.totalPointsWDO !== 0 && (
                  <div className="text-emerald-400">WDO: +{currentWinningStreak.totalPointsWDO} pts</div>
                )}
              </div>
            )}
          </div>

          {/* Progress towards all-time record */}
          {longestWinningStreak.count > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Progresso rumo ao Recorde Histórico:</span>
                <span className="text-white font-bold">{streakRecordPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div 
                  style={{ width: `${streakRecordPercentage}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    isStreakHot ? 'bg-gradient-to-r from-amber-500 to-emerald-400' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>Recorde: {longestWinningStreak.count} vitórias</span>
              </div>
            </div>
          )}

          {isStreakActive && currentWinningStreak.startDate && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                Início: {formatDateBR(currentWinningStreak.startDate)}
              </span>
              <span>Último: {formatDateBR(currentWinningStreak.endDate)}</span>
            </div>
          )}
        </div>

        {/* CARD 2: MAIOR SEQUÊNCIA HISTÓRICA (RECORDE) */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-950 p-4.5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Maior Sequência Vencedora (Recorde)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> RECORDE
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 tracking-tight tabular-nums">
                  {longestWinningStreak.count}
                </span>
                <span className="text-sm font-semibold text-white">
                  vitórias seguidas
                </span>
              </div>
              <div className="text-xs font-mono pt-1 text-emerald-400 font-bold text-sm">
                +{formatBRL(longestWinningStreak.totalProfit)}
                <span className="text-xs text-slate-400 font-normal ml-1">
                  gerados no pico de consistência
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-400">
              {longestWinningStreak.totalPointsWIN > 0 && (
                <div className="text-blue-400">WIN: +{longestWinningStreak.totalPointsWIN} pts</div>
              )}
              {longestWinningStreak.totalPointsWDO > 0 && (
                <div className="text-emerald-400">WDO: +{longestWinningStreak.totalPointsWDO} pts</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Média por Trade:</span>
              <span className="text-emerald-400 font-bold">
                +{formatBRL(longestWinningStreak.count > 0 ? longestWinningStreak.totalProfit / longestWinningStreak.count : 0)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Período do Recorde:</span>
              <span className="text-slate-300 font-semibold text-[11px]">
                {longestWinningStreak.startDate ? `${formatDateBR(longestWinningStreak.startDate)} a ${formatDateBR(longestWinningStreak.endDate)}` : '-'}
              </span>
            </div>
          </div>

          {longestWinningStreak.trades.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsRecordTradesOpen(!isRecordTradesOpen)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isRecordTradesOpen ? 'Ocultar operações do recorde' : `Ver as ${longestWinningStreak.count} operações do recorde`}</span>
                {isRecordTradesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Table of Trades from the Record Streak */}
      {isRecordTradesOpen && longestWinningStreak.trades.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Operações que Compuseram o Recorde Histórico ({longestWinningStreak.count} trades)</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              Total: +{formatBRL(longestWinningStreak.totalProfit)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-2 px-3 rounded-l-xl">#</th>
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3">Ativo</th>
                  <th className="py-2 px-3">Setup</th>
                  <th className="py-2 px-3 text-right">Pontos</th>
                  <th className="py-2 px-3 text-right rounded-r-xl">Resultado (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {longestWinningStreak.trades.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{formatDateBR(t.date)} {t.time || ''}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        t.asset === 'WIN' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {t.asset}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-white font-sans">{t.setupName || 'Setup'}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatPoints(t.points, t.asset)}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">+{formatBRL(t.financialValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Streak Tape: Visual Sequence of Recent Trades */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Fita dos Últimos Trades (Sequência Recente)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Mais antigos ➔ Mais recentes
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 select-none scrollbar-thin">
          {recentTrades.map((t, idx) => {
            const isGain = t.result === 'GAIN' || t.financialValue > 0;
            const isLoss = t.result === 'LOSS' || t.financialValue < 0;
            const isInCurrentStreak = currentWinningStreak.trades.some((st) => st.id === t.id);

            return (
              <div
                key={t.id || idx}
                title={`${formatDateBR(t.date)} - ${t.asset} (${t.result}): ${formatBRL(t.financialValue)}`}
                className={`relative shrink-0 flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-mono transition-all group ${
                  isInCurrentStreak
                    ? 'border-amber-500/50 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : isGain
                    ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60'
                    : isLoss
                    ? 'border-rose-500/30 bg-rose-500/10 hover:border-rose-500/60'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
                style={{ minWidth: '4.5rem' }}
              >
                {isInCurrentStreak && (
                  <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] text-slate-950 font-bold items-center justify-center">🔥</span>
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {isGain ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : isLoss ? (
                    <XCircle className="h-3 w-3 text-rose-400" />
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">0x0</span>
                  )}
                  <span className={`text-[10px] font-bold ${
                    isGain ? 'text-emerald-300' : isLoss ? 'text-rose-300' : 'text-slate-400'
                  }`}>
                    {t.result === 'GAIN' ? 'GAIN' : t.result === 'LOSS' ? 'LOSS' : '0x0'}
                  </span>
                </div>

                <span className={`text-[11px] font-bold pt-0.5 ${
                  isGain ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {isGain ? `+${formatBRL(t.financialValue)}` : formatBRL(t.financialValue)}
                </span>

                <span className="text-[9px] text-slate-500 pt-0.5">
                  {t.asset} · {formatDateBR(t.date).slice(0, 5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Secondary Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Média de Vitórias Consecutivas:
          </span>
          <div className="text-base font-bold text-white font-mono">
            {averageWinningStreak > 0 ? `${averageWinningStreak} trades` : '-'}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Duração média das sequências de gain ao longo do histórico.
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <Percent className="h-3.5 w-3.5 text-amber-400" />
            Probabilidade de Vitória Consecutiva:
          </span>
          <div className="text-base font-bold text-amber-300 font-mono">
            {winRateAfterWin > 0 ? `${winRateAfterWin}%` : '-'}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Chance estatística de obter outro gain imediatamente após um trade positivo.
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Total de Ciclos Vencedores:
          </span>
          <div className="text-base font-bold text-slate-200 font-mono">
            {totalWinningStreaksCount} sequências registradas
          </div>
          <span className="text-[10px] text-slate-500 block">
            Pior sequência de losses no histórico: <strong className="text-rose-400">{longestLosingStreak.count} trades</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
