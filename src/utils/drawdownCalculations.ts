import { Trade } from '../types';

export interface DrawdownPoint {
  index: number;
  tradeId?: string;
  date: string;
  time?: string;
  tradeValue: number;
  cumulativeEquity: number;
  peakEquity: number;
  drawdownFinancial: number; // Valor em R$ perdido a partir do pico (>= 0)
  drawdownPercent: number; // Queda percentual a partir do pico + capital base
  isNewPeak: boolean;
}

export interface DrawdownCycle {
  startIndex: number;
  peakIndex: number;
  peakEquity: number;
  peakDate: string;
  troughIndex: number;
  troughEquity: number;
  troughDate: string;
  recoveryIndex: number | null; // null se ainda não recuperou
  recoveryDate?: string;
  drawdownAmount: number;
  drawdownPercent: number;
  tradesDuration: number;
}

export interface DrawdownAnalysis {
  maxDrawdownFinancial: number; // Rebaixamento máximo em R$ (maior queda topo-fundo)
  maxDrawdownPercent: number; // Rebaixamento máximo em %
  maxDrawdownPeakDate: string;
  maxDrawdownTroughDate: string;
  maxDrawdownRecoveryDate: string | null;
  maxDrawdownTradeCount: number; // Quantidade de trades dentro do pior ciclo de drawdown
  isMaxDrawdownRecovered: boolean;
  currentDrawdownFinancial: number; // Rebaixamento atual em R$
  currentDrawdownPercent: number; // Rebaixamento atual em %
  isAtAllTimeHigh: boolean;
  allTimeHighEquity: number;
  recoveryFactor: number; // Lucro Líquido / Max Drawdown
  averageDrawdownFinancial: number;
  longestDrawdownTrades: number; // Maior sequência de trades sem bater novo topo histórico
  recommendedCapital: number; // Capital mínimo recomendado com margem de segurança (2.5x Max DD)
  riskRating: 'BAIXO' | 'MODERADO' | 'ELEVADO' | 'CRÍTICO';
  points: DrawdownPoint[];
  cycles: DrawdownCycle[];
}

export const DEFAULT_INITIAL_CAPITAL = 5000; // R$ 5.000 como capital inicial base padrão

export function calculateDrawdownAnalysis(
  trades: Trade[],
  initialCapital: number = DEFAULT_INITIAL_CAPITAL
): DrawdownAnalysis {
  if (trades.length === 0) {
    return {
      maxDrawdownFinancial: 0,
      maxDrawdownPercent: 0,
      maxDrawdownPeakDate: '',
      maxDrawdownTroughDate: '',
      maxDrawdownRecoveryDate: null,
      maxDrawdownTradeCount: 0,
      isMaxDrawdownRecovered: true,
      currentDrawdownFinancial: 0,
      currentDrawdownPercent: 0,
      isAtAllTimeHigh: true,
      allTimeHighEquity: 0,
      recoveryFactor: 0,
      averageDrawdownFinancial: 0,
      longestDrawdownTrades: 0,
      recommendedCapital: initialCapital,
      riskRating: 'BAIXO',
      points: [],
      cycles: [],
    };
  }

  // Ordena cronologicamente
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return da.localeCompare(db);
  });

  const baseCapital = Math.max(500, initialCapital);
  let cumulativeEquity = 0;
  let peakEquity = 0;
  let peakDate = sorted[0].date;
  let peakIndex = 0;

  let maxDrawdownFinancial = 0;
  let maxDrawdownPercent = 0;
  let maxDrawdownPeakDate = sorted[0].date;
  let maxDrawdownTroughDate = sorted[0].date;
  let maxDrawdownStartIndex = 0;
  let maxDrawdownTroughIndex = 0;
  let maxDrawdownRecoveryDate: string | null = null;

  const points: DrawdownPoint[] = [
    {
      index: 0,
      date: sorted[0].date || 'Início',
      time: '',
      tradeValue: 0,
      cumulativeEquity: 0,
      peakEquity: 0,
      drawdownFinancial: 0,
      drawdownPercent: 0,
      isNewPeak: true,
    },
  ];

  let currentDrawdownTradesCount = 0;
  let longestDrawdownTrades = 0;
  const drawdownAmountsList: number[] = [];

  // Track cycles
  const cycles: DrawdownCycle[] = [];
  let activeCycle: Partial<DrawdownCycle> | null = null;

  sorted.forEach((t, i) => {
    cumulativeEquity += t.financialValue;
    const isNewPeak = cumulativeEquity > peakEquity;

    if (isNewPeak) {
      if (activeCycle && activeCycle.drawdownAmount && activeCycle.drawdownAmount > 0) {
        cycles.push({
          startIndex: activeCycle.startIndex || 0,
          peakIndex: activeCycle.peakIndex || 0,
          peakEquity: activeCycle.peakEquity || 0,
          peakDate: activeCycle.peakDate || '',
          troughIndex: activeCycle.troughIndex || 0,
          troughEquity: activeCycle.troughEquity || 0,
          troughDate: activeCycle.troughDate || '',
          recoveryIndex: i + 1,
          recoveryDate: t.date,
          drawdownAmount: activeCycle.drawdownAmount,
          drawdownPercent: activeCycle.drawdownPercent || 0,
          tradesDuration: (i + 1) - (activeCycle.peakIndex || 0),
        });
        activeCycle = null;
      }

      peakEquity = cumulativeEquity;
      peakDate = t.date;
      peakIndex = i + 1;
      currentDrawdownTradesCount = 0;
    } else {
      currentDrawdownTradesCount++;
      if (currentDrawdownTradesCount > longestDrawdownTrades) {
        longestDrawdownTrades = currentDrawdownTradesCount;
      }
    }

    const currentDrawdownFin = Math.max(0, peakEquity - cumulativeEquity);
    // Drawdown em % relativo ao patrimônio máximo do topo mais o capital inicial base
    const totalPeakCapital = baseCapital + peakEquity;
    const currentDrawdownPct = totalPeakCapital > 0 ? (currentDrawdownFin / totalPeakCapital) * 100 : 0;

    if (currentDrawdownFin > 0) {
      drawdownAmountsList.push(currentDrawdownFin);

      if (!activeCycle) {
        activeCycle = {
          startIndex: peakIndex,
          peakIndex,
          peakEquity,
          peakDate,
          troughIndex: i + 1,
          troughEquity: cumulativeEquity,
          troughDate: t.date,
          drawdownAmount: currentDrawdownFin,
          drawdownPercent: currentDrawdownPct,
        };
      } else if (currentDrawdownFin > (activeCycle.drawdownAmount || 0)) {
        activeCycle.troughIndex = i + 1;
        activeCycle.troughEquity = cumulativeEquity;
        activeCycle.troughDate = t.date;
        activeCycle.drawdownAmount = currentDrawdownFin;
        activeCycle.drawdownPercent = currentDrawdownPct;
      }

      if (currentDrawdownFin > maxDrawdownFinancial) {
        maxDrawdownFinancial = currentDrawdownFin;
        maxDrawdownPercent = currentDrawdownPct;
        maxDrawdownPeakDate = peakDate;
        maxDrawdownTroughDate = t.date;
        maxDrawdownStartIndex = peakIndex;
        maxDrawdownTroughIndex = i + 1;
      }
    }

    points.push({
      index: i + 1,
      tradeId: t.id,
      date: t.date,
      time: t.time,
      tradeValue: t.financialValue,
      cumulativeEquity: Number(cumulativeEquity.toFixed(2)),
      peakEquity: Number(peakEquity.toFixed(2)),
      drawdownFinancial: Number(currentDrawdownFin.toFixed(2)),
      drawdownPercent: Number(currentDrawdownPct.toFixed(2)),
      isNewPeak,
    });
  });

  // Fecha ciclo aberto se ainda estiver no final
  const trailingCycle = activeCycle as Partial<DrawdownCycle> | null;
  if (trailingCycle && trailingCycle.drawdownAmount && trailingCycle.drawdownAmount > 0) {
    cycles.push({
      startIndex: trailingCycle.startIndex || 0,
      peakIndex: trailingCycle.peakIndex || 0,
      peakEquity: trailingCycle.peakEquity || 0,
      peakDate: trailingCycle.peakDate || '',
      troughIndex: trailingCycle.troughIndex || 0,
      troughEquity: trailingCycle.troughEquity || 0,
      troughDate: trailingCycle.troughDate || '',
      recoveryIndex: null,
      drawdownAmount: trailingCycle.drawdownAmount,
      drawdownPercent: trailingCycle.drawdownPercent || 0,
      tradesDuration: points.length - 1 - (trailingCycle.peakIndex || 0),
    });
  }

  // Verifica se o Max Drawdown já foi recuperado
  let isMaxDrawdownRecovered = false;
  let maxDrawdownTradeCount = maxDrawdownTroughIndex - maxDrawdownStartIndex;
  if (maxDrawdownFinancial > 0) {
    for (let j = maxDrawdownTroughIndex; j < points.length; j++) {
      if (points[j].cumulativeEquity >= points[maxDrawdownStartIndex].peakEquity) {
        isMaxDrawdownRecovered = true;
        maxDrawdownRecoveryDate = points[j].date;
        maxDrawdownTradeCount = j - maxDrawdownStartIndex;
        break;
      }
    }
    if (!isMaxDrawdownRecovered) {
      maxDrawdownTradeCount = points.length - 1 - maxDrawdownStartIndex;
    }
  }

  const currentDrawdownFinancial = Math.max(0, peakEquity - cumulativeEquity);
  const totalPeakCapital = baseCapital + peakEquity;
  const currentDrawdownPercent = totalPeakCapital > 0 ? (currentDrawdownFinancial / totalPeakCapital) * 100 : 0;
  const isAtAllTimeHigh = currentDrawdownFinancial < 0.01;

  // Fator de Recuperação (Recovery Factor = Lucro Líquido / Max Drawdown)
  let recoveryFactor = 0;
  if (maxDrawdownFinancial > 0) {
    recoveryFactor = cumulativeEquity > 0 ? Number((cumulativeEquity / maxDrawdownFinancial).toFixed(2)) : 0;
  } else if (cumulativeEquity > 0) {
    recoveryFactor = 99.9;
  }

  const averageDrawdownFinancial =
    drawdownAmountsList.length > 0
      ? Number((drawdownAmountsList.reduce((acc, d) => acc + d, 0) / drawdownAmountsList.length).toFixed(2))
      : 0;

  // Capital recomendado = Max Drawdown * 2.5 + margem de garantia básica
  const recommendedCapital = Math.max(
    baseCapital,
    Number((maxDrawdownFinancial * 2.5 + 1000).toFixed(2))
  );

  // Classificação de Risco
  let riskRating: 'BAIXO' | 'MODERADO' | 'ELEVADO' | 'CRÍTICO' = 'BAIXO';
  if (maxDrawdownPercent >= 35 || maxDrawdownFinancial >= 5000) {
    riskRating = 'CRÍTICO';
  } else if (maxDrawdownPercent >= 20 || maxDrawdownFinancial >= 2500) {
    riskRating = 'ELEVADO';
  } else if (maxDrawdownPercent >= 10 || maxDrawdownFinancial >= 1200) {
    riskRating = 'MODERADO';
  }

  return {
    maxDrawdownFinancial: Number(maxDrawdownFinancial.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    maxDrawdownPeakDate,
    maxDrawdownTroughDate,
    maxDrawdownRecoveryDate,
    maxDrawdownTradeCount: Math.max(1, maxDrawdownTradeCount),
    isMaxDrawdownRecovered,
    currentDrawdownFinancial: Number(currentDrawdownFinancial.toFixed(2)),
    currentDrawdownPercent: Number(currentDrawdownPercent.toFixed(2)),
    isAtAllTimeHigh,
    allTimeHighEquity: Number(peakEquity.toFixed(2)),
    recoveryFactor,
    averageDrawdownFinancial,
    longestDrawdownTrades,
    recommendedCapital,
    riskRating,
    points,
    cycles,
  };
}
