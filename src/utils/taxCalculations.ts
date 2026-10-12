import { Trade, MonthlyTaxApuracao } from '../types';
import { getDarfDueDateForMonth } from './b3Calendar';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Calculates monthly Day Trade tax apuração and DARF amounts according to Receita Federal rules.
 * 
 * Rules:
 * - 20% flat tax rate on net Day Trade earnings.
 * - Previous accumulated Day Trade losses can be compensated indefinitely against future profits.
 * - IRRF (1% withheld at source by brokers on daily positive results) is credited against the tax due.
 * - Minimum DARF amount is R$ 10,00. If calculated tax < R$ 10, it accumulates forward until reaching R$ 10.
 * - Due date is the last business day of the subsequent month (antecipating for holidays and weekends).
 */
export function calculateMonthlyTaxApuracao(
  trades: Trade[],
  initialAccumulatedLoss: number = 0,
  paidMonths: Record<string, boolean> = {},
  costPerContractWIN: number = 0,
  costPerContractWDO: number = 0
): MonthlyTaxApuracao[] {
  if (!trades || trades.length === 0) {
    return [];
  }

  // 1. Group trades by month ("YYYY-MM")
  const tradesByMonth: Record<string, Trade[]> = {};
  
  trades.forEach((trade) => {
    if (!trade.date) return;
    const monthKey = trade.date.substring(0, 7); // "YYYY-MM"
    if (!tradesByMonth[monthKey]) {
      tradesByMonth[monthKey] = [];
    }
    tradesByMonth[monthKey].push(trade);
  });

  // Sort month keys chronologically
  const sortedMonthKeys = Object.keys(tradesByMonth).sort();

  let accumulatedLoss = Math.max(0, initialAccumulatedLoss);
  let accumulatedSmallDarf = 0; // Carry-over for DARF < R$ 10,00

  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const results: MonthlyTaxApuracao[] = [];

  sortedMonthKeys.forEach((monthKey) => {
    const monthTrades = tradesByMonth[monthKey];
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Group by day to compute broker IRRF (1% withheld on daily positive results)
    const dailyProfits: Record<string, number> = {};
    let grossGain = 0;
    let grossLoss = 0;

    monthTrades.forEach((t) => {
      // Calculate operational costs (emolumentos / corretagem if configured for futures)
      const costPerContract = t.asset === 'WDO' ? costPerContractWDO : t.asset === 'WIN' ? costPerContractWIN : 0;
      const tradeOperationalCost = (costPerContract || 0) * (t.contracts || 1);
      const effectiveFinancial = (t.financialValue || 0) - tradeOperationalCost;

      if (effectiveFinancial > 0) {
        grossGain += effectiveFinancial;
      } else {
        grossLoss += Math.abs(effectiveFinancial);
      }

      dailyProfits[t.date] = (dailyProfits[t.date] || 0) + effectiveFinancial;
    });

    const netResult = grossGain - grossLoss;

    // Calculate IRRF Day Trade (1% over positive daily results)
    let irrfDayTrade = 0;
    Object.values(dailyProfits).forEach((dayNet) => {
      if (dayNet > 0) {
        // Receita Federal: IRRF de 1% retido na fonte sobre ganho líquido diário
        irrfDayTrade += dayNet * 0.01;
      }
    });

    // Compensate previous losses
    let lossCompensated = 0;
    let taxBase = 0;
    let accumulatedLossPrevious = accumulatedLoss;

    if (netResult > 0) {
      if (accumulatedLoss > 0) {
        if (netResult >= accumulatedLoss) {
          lossCompensated = accumulatedLoss;
          taxBase = netResult - accumulatedLoss;
          accumulatedLoss = 0;
        } else {
          lossCompensated = netResult;
          taxBase = 0;
          accumulatedLoss -= netResult;
        }
      } else {
        lossCompensated = 0;
        taxBase = netResult;
      }
    } else {
      // Negative month or zero: increase accumulated loss
      accumulatedLoss += Math.abs(netResult);
      lossCompensated = 0;
      taxBase = 0;
    }

    // Tax calculation (20% for Day Trade)
    const irRate = 0.20;
    const irGross = taxBase > 0 ? taxBase * irRate : 0;
    const irNetCalculated = Math.max(0, irGross - irrfDayTrade);

    // DARF < R$ 10,00 accumulation rule
    const darfAccumulatedPrevious = accumulatedSmallDarf;
    const totalTaxForDarf = irNetCalculated + darfAccumulatedPrevious;

    let darfDue = 0;
    let darfCarriedForward = 0;

    if (totalTaxForDarf >= 10.00) {
      darfDue = totalTaxForDarf;
      accumulatedSmallDarf = 0;
      darfCarriedForward = 0;
    } else if (totalTaxForDarf > 0) {
      darfDue = 0;
      accumulatedSmallDarf = totalTaxForDarf;
      darfCarriedForward = totalTaxForDarf;
    } else {
      darfDue = 0;
      darfCarriedForward = darfAccumulatedPrevious;
    }

    // Due date (last business day of subsequent month)
    const dueInfo = getDarfDueDateForMonth(year, month);
    const dueDate = dueInfo.dueDate;
    const dueDateFormatted = dueInfo.dueDateFormatted;

    // Calculate days until due date
    const dueTime = new Date(dueDate + 'T23:59:59').getTime();
    const currentTime = new Date(todayIso + 'T00:00:00').getTime();
    const diffDays = Math.round((dueTime - currentTime) / (1000 * 60 * 60 * 24));

    const isPaid = !!paidMonths[monthKey];
    const isOverdue = !isPaid && darfDue > 0 && diffDays < 0;

    // Status determination
    let status: MonthlyTaxApuracao['status'] = 'SEM_DARF';
    if (darfDue <= 0) {
      status = netResult <= 0 ? 'SEM_DARF' : 'ISENTO';
    } else {
      if (isPaid) {
        status = 'PAGO';
      } else if (isOverdue) {
        status = 'VENCIDO';
      } else {
        status = 'A_VENCER';
      }
    }

    // Calculate penalty & interest estimates if overdue
    let penaltyEstimate = 0;
    let interestEstimate = 0;

    if (isOverdue && darfDue > 0) {
      const daysLate = Math.abs(diffDays);
      // Multa de mora: 0.33% por dia de atraso, limitada a 20%
      const penaltyRate = Math.min(0.20, daysLate * 0.0033);
      penaltyEstimate = darfDue * penaltyRate;

      // Juros de mora: Taxa Selic acumulada a partir do mês seguinte ao vencimento + 1% no mês do pagamento
      // Aproximação orientativa baseada em ~1% ao mês de atraso
      const monthsLate = Math.max(1, Math.floor(daysLate / 30));
      const interestRate = (monthsLate * 0.009) + 0.01;
      interestEstimate = darfDue * interestRate;
    }

    const totalDueWithInterest = darfDue + penaltyEstimate + interestEstimate;

    results.push({
      monthKey,
      year,
      month,
      monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      shortLabel: `${MONTH_SHORT[month - 1]}/${String(year).slice(-2)}`,
      totalTrades: monthTrades.length,
      grossGain,
      grossLoss,
      netResult,
      accumulatedLossPrevious,
      lossCompensated,
      accumulatedLossRemaining: accumulatedLoss,
      taxBase,
      irRate,
      irGross,
      irrfDayTrade,
      irNetCalculated,
      darfAccumulatedPrevious,
      darfDue,
      darfCarriedForward,
      dueDate,
      dueDateFormatted,
      daysUntilDue: diffDays,
      isOverdue,
      isPaid,
      status,
      penaltyEstimate,
      interestEstimate,
      totalDueWithInterest,
    });
  });

  return results;
}

/**
 * Summary totals for the DARF dashboard.
 */
export interface DarfDashboardSummary {
  totalDarfPending: number;
  totalDarfPaid: number;
  totalDarfOverdue: number;
  accumulatedLossCurrent: number;
  totalIrrfRetained: number;
  totalGrossGains: number;
  totalGrossLosses: number;
  totalNetProfit: number;
  pendingCount: number;
  overdueCount: number;
  nextDueItem: MonthlyTaxApuracao | null;
}

export function getDarfSummary(monthlyApuracoes: MonthlyTaxApuracao[]): DarfDashboardSummary {
  let totalDarfPending = 0;
  let totalDarfPaid = 0;
  let totalDarfOverdue = 0;
  let totalIrrfRetained = 0;
  let totalGrossGains = 0;
  let totalGrossLosses = 0;
  let totalNetProfit = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  let nextDueItem: MonthlyTaxApuracao | null = null;

  monthlyApuracoes.forEach((item) => {
    totalIrrfRetained += item.irrfDayTrade;
    totalGrossGains += item.grossGain;
    totalGrossLosses += item.grossLoss;
    totalNetProfit += item.netResult;

    if (item.darfDue > 0) {
      if (item.isPaid) {
        totalDarfPaid += item.darfDue;
      } else {
        totalDarfPending += item.darfDue;
        pendingCount += 1;

        if (item.isOverdue) {
          totalDarfOverdue += item.totalDueWithInterest;
          overdueCount += 1;
        }

        // Find closest due date in the future
        if (!item.isOverdue) {
          if (!nextDueItem || item.dueDate < nextDueItem.dueDate) {
            nextDueItem = item;
          }
        }
      }
    }
  });

  // Current accumulated loss is the one remaining from the latest month
  const lastItem = monthlyApuracoes[monthlyApuracoes.length - 1];
  const accumulatedLossCurrent = lastItem ? lastItem.accumulatedLossRemaining : 0;

  return {
    totalDarfPending,
    totalDarfPaid,
    totalDarfOverdue,
    accumulatedLossCurrent,
    totalIrrfRetained,
    totalGrossGains,
    totalGrossLosses,
    totalNetProfit,
    pendingCount,
    overdueCount,
    nextDueItem,
  };
}
