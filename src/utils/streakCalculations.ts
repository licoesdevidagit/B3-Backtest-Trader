import { Trade } from '../types';

export interface StreakInfo {
  count: number;
  startDate: string;
  endDate: string;
  totalProfit: number;
  totalPointsWIN: number;
  totalPointsWDO: number;
  trades: Trade[];
}

export interface WinningStreakAnalysis {
  currentWinningStreak: StreakInfo;
  longestWinningStreak: StreakInfo;
  currentLosingStreak: StreakInfo;
  longestLosingStreak: StreakInfo;
  averageWinningStreak: number;
  totalWinningStreaksCount: number;
  streakDistribution: {
    streakLength: number;
    count: number;
    percentage: number;
  }[];
  winRateAfterWin: number;
  recentTrades: Trade[];
}

export function calculateStreakAnalysis(trades: Trade[]): WinningStreakAnalysis {
  const emptyStreak: StreakInfo = {
    count: 0,
    startDate: '',
    endDate: '',
    totalProfit: 0,
    totalPointsWIN: 0,
    totalPointsWDO: 0,
    trades: [],
  };

  if (!trades || trades.length === 0) {
    return {
      currentWinningStreak: emptyStreak,
      longestWinningStreak: emptyStreak,
      currentLosingStreak: emptyStreak,
      longestLosingStreak: emptyStreak,
      averageWinningStreak: 0,
      totalWinningStreaksCount: 0,
      streakDistribution: [],
      winRateAfterWin: 0,
      recentTrades: [],
    };
  }

  // Sort chronologically: oldest to newest
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return da.localeCompare(db);
  });

  // 1. Calculate Current Winning & Losing Streaks (from newest backwards)
  const currentWinTrades: Trade[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = sorted[i];
    if (t.result === 'GAIN' || t.financialValue > 0) {
      currentWinTrades.unshift(t);
    } else {
      break;
    }
  }

  const currentLossTrades: Trade[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = sorted[i];
    if (t.result === 'LOSS' || t.financialValue < 0) {
      currentLossTrades.unshift(t);
    } else {
      break;
    }
  }

  const buildStreakInfo = (streakTrades: Trade[]): StreakInfo => {
    if (streakTrades.length === 0) return emptyStreak;
    let profit = 0;
    let ptsWIN = 0;
    let ptsWDO = 0;

    streakTrades.forEach((t) => {
      profit += t.financialValue;
      if (t.asset === 'WIN') ptsWIN += t.points;
      else ptsWDO += t.points;
    });

    return {
      count: streakTrades.length,
      startDate: streakTrades[0].date,
      endDate: streakTrades[streakTrades.length - 1].date,
      totalProfit: Number(profit.toFixed(2)),
      totalPointsWIN: Number(ptsWIN.toFixed(1)),
      totalPointsWDO: Number(ptsWDO.toFixed(1)),
      trades: streakTrades,
    };
  };

  const currentWinningStreak = buildStreakInfo(currentWinTrades);
  const currentLosingStreak = buildStreakInfo(currentLossTrades);

  // 2. Calculate Longest Winning & Losing Streaks historically
  let longestWinTrades: Trade[] = [];
  let tempWinTrades: Trade[] = [];

  let longestLossTrades: Trade[] = [];
  let tempLossTrades: Trade[] = [];

  const allWinningStreakLengths: number[] = [];
  const distributionMap: Record<number, number> = {};

  // For conditional probability: win after win
  let winsAfterWinCount = 0;
  let totalOpportunitiesAfterWin = 0;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const isGain = t.result === 'GAIN' || t.financialValue > 0;
    const isLoss = t.result === 'LOSS' || t.financialValue < 0;

    // Check probability of win following another win
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevGain = prev.result === 'GAIN' || prev.financialValue > 0;
      if (prevGain) {
        totalOpportunitiesAfterWin++;
        if (isGain) {
          winsAfterWinCount++;
        }
      }
    }

    // Winning streak processing
    if (isGain) {
      tempWinTrades.push(t);
      if (tempWinTrades.length > longestWinTrades.length) {
        longestWinTrades = [...tempWinTrades];
      }
    } else {
      if (tempWinTrades.length > 0) {
        allWinningStreakLengths.push(tempWinTrades.length);
        const len = tempWinTrades.length;
        distributionMap[len] = (distributionMap[len] || 0) + 1;
        tempWinTrades = [];
      }
    }

    // Losing streak processing
    if (isLoss) {
      tempLossTrades.push(t);
      if (tempLossTrades.length > longestLossTrades.length) {
        longestLossTrades = [...tempLossTrades];
      }
    } else {
      if (tempLossTrades.length > 0) {
        tempLossTrades = [];
      }
    }
  }

  // Push remaining active streak if it terminated at the end of the array
  if (tempWinTrades.length > 0) {
    allWinningStreakLengths.push(tempWinTrades.length);
    const len = tempWinTrades.length;
    distributionMap[len] = (distributionMap[len] || 0) + 1;
  }

  const longestWinningStreak = buildStreakInfo(longestWinTrades);
  const longestLosingStreak = buildStreakInfo(longestLossTrades);

  // Average winning streak length
  const totalWinningStreaksCount = allWinningStreakLengths.length;
  const averageWinningStreak =
    totalWinningStreaksCount > 0
      ? Number(
          (
            allWinningStreakLengths.reduce((acc, l) => acc + l, 0) /
            totalWinningStreaksCount
          ).toFixed(1)
        )
      : 0;

  // Distribution array formatted
  const streakDistribution = Object.entries(distributionMap)
    .map(([lengthStr, count]) => {
      const streakLength = parseInt(lengthStr, 10);
      const percentage = totalWinningStreaksCount > 0 ? (count / totalWinningStreaksCount) * 100 : 0;
      return {
        streakLength,
        count,
        percentage: Number(percentage.toFixed(1)),
      };
    })
    .sort((a, b) => a.streakLength - b.streakLength);

  // Win rate after a win percentage
  const winRateAfterWin =
    totalOpportunitiesAfterWin > 0
      ? Number(((winsAfterWinCount / totalOpportunitiesAfterWin) * 100).toFixed(1))
      : 0;

  // Last 15 trades for the visual streak tape
  const recentTrades = sorted.slice(-15);

  return {
    currentWinningStreak,
    longestWinningStreak,
    currentLosingStreak,
    longestLosingStreak,
    averageWinningStreak,
    totalWinningStreaksCount,
    streakDistribution,
    winRateAfterWin,
    recentTrades,
  };
}
