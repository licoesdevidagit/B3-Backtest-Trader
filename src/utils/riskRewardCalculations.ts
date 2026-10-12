import { AssetType, Setup, Trade } from '../types';

export type EfficiencyTier = 'HIGH' | 'GOOD' | 'INVERSE_ASYMMETRY' | 'CRITICAL';

export interface SetupRiskRewardStat {
  setupId: string;
  setupName: string;
  setupColor: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // 0 - 100 (%)
  lossRate: number; // 0 - 100 (%)
  totalProfit: number; // R$ líquido
  grossGain: number;
  grossLoss: number;
  avgGain: number; // R$ ganho médio nos GAINs
  avgLoss: number; // R$ prejuízo médio nos LOSSs
  riskRewardRatio: number; // Payoff = avgGain / avgLoss
  riskRewardFormatted: string; // Ex: "1 : 2.2"
  expectedValue: number; // EV em R$ por operação
  breakevenWinRate: number; // % mínima necessária para não perder dinheiro
  safetyMargin: number; // winRate - breakevenWinRate
  efficiencyTier: EfficiencyTier;
  efficiencyLabel: string;
  efficiencyScore: number; // 0 a 100
  // Pontos médios por ativo
  ptsWinGain: number;
  ptsWinLoss: number;
  ptsWdoGain: number;
  ptsWdoLoss: number;
  // Parâmetros planejados (se cadastrados no Setup)
  plannedGainPts?: number;
  plannedLossPts?: number;
  plannedRR?: number;
  plannedRRFormatted?: string;
  recommendation: string;
}

export interface GlobalRiskRewardMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // %
  totalProfit: number;
  grossGain: number;
  grossLoss: number;
  avgGain: number; // R$ ganho médio
  avgLoss: number; // R$ prejuízo médio
  riskRewardRatio: number; // Payoff
  riskRewardFormatted: string;
  expectedValue: number; // EV em R$ por trade
  breakevenWinRate: number; // % necessária
  safetyMargin: number; // Real - Mínima
  efficiencyTier: EfficiencyTier;
  efficiencyLabel: string;
  // Pontos
  avgPtsWinGain: number;
  avgPtsWinLoss: number;
  avgPtsWdoGain: number;
  avgPtsWdoLoss: number;
  // Destaques
  bestSetup: SetupRiskRewardStat | null;
  mostEfficientSetup: SetupRiskRewardStat | null;
  attentionSetup: SetupRiskRewardStat | null;
}

/**
 * Calcula a análise de Risco/Retorno e Eficiência por Trade e por Setup
 * @param trades Lista de operações
 * @param setups Lista de configurações de setups
 * @param assetFilter Filtro de ativo opcional ('ALL', 'WIN', 'WDO')
 */
export function calculateRiskRewardAnalysis(
  trades: Trade[],
  setups: Setup[],
  assetFilter: 'ALL' | AssetType = 'ALL'
): {
  global: GlobalRiskRewardMetrics;
  setupsStats: SetupRiskRewardStat[];
} {
  // Filtrar trades pelo ativo selecionado se aplicável
  const filteredTrades = assetFilter === 'ALL' 
    ? trades 
    : trades.filter((t) => t.asset === assetFilter);

  // Mapa de Setup IDs para mapear nomes e cores
  const setupMetaMap = new Map<string, Setup>();
  setups.forEach((s) => setupMetaMap.set(s.id, s));

  // 1. Agrupamento por Setup
  const setupGroups = new Map<string, {
    id: string;
    name: string;
    color: string;
    trades: Trade[];
  }>();

  // Inicializar com setups existentes
  setups.forEach((s) => {
    setupGroups.set(s.id, {
      id: s.id,
      name: s.name,
      color: s.color || '#3b82f6',
      trades: [],
    });
  });

  // Agrupar trades
  filteredTrades.forEach((t) => {
    let group = setupGroups.get(t.setupId);
    if (!group) {
      const meta = setupMetaMap.get(t.setupId);
      group = {
        id: t.setupId,
        name: meta?.name || t.setupName || 'Setup Desconhecido',
        color: meta?.color || '#64748b',
        trades: [],
      };
      setupGroups.set(t.setupId, group);
    }
    group.trades.push(t);
  });

  // 2. Cálculo dos setups individuais
  const setupsStats: SetupRiskRewardStat[] = [];

  setupGroups.forEach((group) => {
    const sTrades = group.trades;
    const totalTrades = sTrades.length;
    if (totalTrades === 0) return; // pular setups sem operações no filtro selecionado

    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let grossGain = 0;
    let grossLoss = 0;
    let totalProfit = 0;

    let winPointsSum = 0;
    let winPointsCount = 0;
    let lossPointsSum = 0;
    let lossPointsCount = 0;

    let wdoGainPtsSum = 0;
    let wdoGainPtsCount = 0;
    let wdoLossPtsSum = 0;
    let wdoLossPtsCount = 0;

    sTrades.forEach((t) => {
      totalProfit += t.financialValue;
      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
        if (t.asset === 'WIN') {
          winPointsSum += t.points;
          winPointsCount++;
        } else if (t.asset === 'WDO') {
          wdoGainPtsSum += t.points;
          wdoGainPtsCount++;
        }
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
        if (t.asset === 'WIN') {
          lossPointsSum += Math.abs(t.points);
          lossPointsCount++;
        } else if (t.asset === 'WDO') {
          wdoLossPtsSum += Math.abs(t.points);
          wdoLossPtsCount++;
        }
      } else {
        breakevens++;
      }
    });

    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const lossRate = totalTrades > 0 ? Number(((losses / totalTrades) * 100).toFixed(1)) : 0;
    const avgGain = wins > 0 ? Number((grossGain / wins).toFixed(2)) : 0;
    const avgLoss = losses > 0 ? Number((grossLoss / losses).toFixed(2)) : 0;

    // Relação R:R = avgGain / avgLoss
    let riskRewardRatio = 0;
    let riskRewardFormatted = '1 : 1.0';

    if (avgLoss > 0) {
      riskRewardRatio = Number((avgGain / avgLoss).toFixed(2));
      riskRewardFormatted = `1 : ${riskRewardRatio.toFixed(1)}`;
    } else if (avgGain > 0) {
      riskRewardRatio = 10;
      riskRewardFormatted = '1 : >10 (Sem stops)';
    } else {
      riskRewardRatio = 0;
      riskRewardFormatted = '1 : 0.0';
    }

    // Expectativa Matemática (EV) por trade em R$
    const expectedValue = totalTrades > 0 ? Number((totalProfit / totalTrades).toFixed(2)) : 0;

    // Taxa de Acerto Mínima Requerida para Breakeven = 1 / (1 + RR)
    let breakevenWinRate = 50;
    if (riskRewardRatio > 0) {
      breakevenWinRate = Number(((1 / (1 + riskRewardRatio)) * 100).toFixed(1));
    } else if (avgLoss > 0 && avgGain === 0) {
      breakevenWinRate = 100;
    }

    // Margem de Segurança = winRate Real - breakevenWinRate Mínima
    const safetyMargin = Number((winRate - breakevenWinRate).toFixed(1));

    // Pontos Médios
    const ptsWinGain = winPointsCount > 0 ? Math.round(winPointsSum / winPointsCount) : 0;
    const ptsWinLoss = lossPointsCount > 0 ? Math.round(lossPointsSum / lossPointsCount) : 0;
    const ptsWdoGain = wdoGainPtsCount > 0 ? Number((wdoGainPtsSum / wdoGainPtsCount).toFixed(1)) : 0;
    const ptsWdoLoss = wdoLossPtsCount > 0 ? Number((wdoLossPtsSum / wdoLossPtsCount).toFixed(1)) : 0;

    // Planejado no Setup
    const setupMeta = setupMetaMap.get(group.id);
    let plannedRR: number | undefined;
    let plannedRRFormatted: string | undefined;
    if (setupMeta?.defaultGainPts && setupMeta?.defaultLossPts && setupMeta.defaultLossPts > 0) {
      plannedRR = Number((setupMeta.defaultGainPts / setupMeta.defaultLossPts).toFixed(2));
      plannedRRFormatted = `1 : ${plannedRR.toFixed(1)}`;
    }

    // Classificação de Eficiência
    let efficiencyTier: EfficiencyTier = 'GOOD';
    let efficiencyLabel = 'Consistente';
    let recommendation = '';
    let efficiencyScore = 50;

    if (totalTrades < 2) {
      efficiencyTier = 'GOOD';
      efficiencyLabel = 'Amostra Inicial';
      recommendation = 'Realize mais operações com este setup para consolidar a análise estatística.';
      efficiencyScore = 50;
    } else if (expectedValue > 0 && riskRewardRatio >= 1.5 && safetyMargin >= 10) {
      efficiencyTier = 'HIGH';
      efficiencyLabel = 'Alta Eficiência';
      recommendation = `Excelente relação R:R (${riskRewardFormatted}) com margem de segurança de +${safetyMargin}%. Setup de alta expectativa matemática.`;
      efficiencyScore = Math.min(100, Math.round(60 + safetyMargin + (riskRewardRatio * 10)));
    } else if (expectedValue > 0 && riskRewardRatio >= 1.0) {
      efficiencyTier = 'GOOD';
      efficiencyLabel = 'Consistente';
      recommendation = `Equilíbrio saudável entre ganho e risco (R:R de ${riskRewardFormatted}). Mantém valor esperado positivo de +R$ ${expectedValue.toFixed(2)} por trade.`;
      efficiencyScore = Math.min(85, Math.round(50 + (safetyMargin * 0.8) + (riskRewardRatio * 8)));
    } else if (expectedValue > 0 && riskRewardRatio < 0.9 && winRate >= 65) {
      efficiencyTier = 'INVERSE_ASYMMETRY';
      efficiencyLabel = 'Assimetria Inversa';
      recommendation = `Atenção: Ganho médio (R$ ${avgGain}) é menor que o prejuízo médio (R$ ${avgLoss}). O lucro atual depende de taxa de acerto alta (${winRate}%); cuide do tamanho do stop.`;
      efficiencyScore = Math.max(30, Math.round(45 + (safetyMargin * 0.5)));
    } else {
      efficiencyTier = 'CRITICAL';
      efficiencyLabel = 'Ajustar Parâmetros';
      recommendation = `Expectativa negativa ou risco desproporcional ao ganho. Reavalie o stop loss ou estenda o alvo de lucro para melhorar a taxa R:R.`;
      efficiencyScore = Math.max(10, Math.round(30 + safetyMargin));
    }

    setupsStats.push({
      setupId: group.id,
      setupName: group.name,
      setupColor: group.color,
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      lossRate,
      totalProfit: Number(totalProfit.toFixed(2)),
      grossGain: Number(grossGain.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      avgGain,
      avgLoss,
      riskRewardRatio,
      riskRewardFormatted,
      expectedValue,
      breakevenWinRate,
      safetyMargin,
      efficiencyTier,
      efficiencyLabel,
      efficiencyScore,
      ptsWinGain,
      ptsWinLoss,
      ptsWdoGain,
      ptsWdoLoss,
      plannedGainPts: setupMeta?.defaultGainPts,
      plannedLossPts: setupMeta?.defaultLossPts,
      plannedRR,
      plannedRRFormatted,
      recommendation,
    });
  });

  // Ordenar setups por Expectativa Matemática (EV) decrescente por padrão
  setupsStats.sort((a, b) => b.expectedValue - a.expectedValue || b.riskRewardRatio - a.riskRewardRatio);

  // 3. Métricas Globais
  const totalTrades = filteredTrades.length;
  let totalWins = 0;
  let totalLosses = 0;
  let totalBreakevens = 0;
  let totalGrossGain = 0;
  let totalGrossLoss = 0;
  let totalProfit = 0;

  let gWinGainSum = 0;
  let gWinGainCount = 0;
  let gWinLossSum = 0;
  let gWinLossCount = 0;

  let gWdoGainSum = 0;
  let gWdoGainCount = 0;
  let gWdoLossSum = 0;
  let gWdoLossCount = 0;

  filteredTrades.forEach((t) => {
    totalProfit += t.financialValue;
    if (t.result === 'GAIN') {
      totalWins++;
      totalGrossGain += Math.max(0, t.financialValue);
      if (t.asset === 'WIN') {
        gWinGainSum += t.points;
        gWinGainCount++;
      } else if (t.asset === 'WDO') {
        gWdoGainSum += t.points;
        gWdoGainCount++;
      }
    } else if (t.result === 'LOSS') {
      totalLosses++;
      totalGrossLoss += Math.abs(Math.min(0, t.financialValue));
      if (t.asset === 'WIN') {
        gWinLossSum += Math.abs(t.points);
        gWinLossCount++;
      } else if (t.asset === 'WDO') {
        gWdoLossSum += Math.abs(t.points);
        gWdoLossCount++;
      }
    } else {
      totalBreakevens++;
    }
  });

  const winRate = totalTrades > 0 ? Number(((totalWins / totalTrades) * 100).toFixed(1)) : 0;
  const avgGain = totalWins > 0 ? Number((totalGrossGain / totalWins).toFixed(2)) : 0;
  const avgLoss = totalLosses > 0 ? Number((totalGrossLoss / totalLosses).toFixed(2)) : 0;

  let globalRiskRewardRatio = 0;
  let globalRiskRewardFormatted = '1 : 1.0';

  if (avgLoss > 0) {
    globalRiskRewardRatio = Number((avgGain / avgLoss).toFixed(2));
    globalRiskRewardFormatted = `1 : ${globalRiskRewardRatio.toFixed(1)}`;
  } else if (avgGain > 0) {
    globalRiskRewardRatio = 10;
    globalRiskRewardFormatted = '1 : >10 (Sem stops)';
  }

  const expectedValue = totalTrades > 0 ? Number((totalProfit / totalTrades).toFixed(2)) : 0;

  let breakevenWinRate = 50;
  if (globalRiskRewardRatio > 0) {
    breakevenWinRate = Number(((1 / (1 + globalRiskRewardRatio)) * 100).toFixed(1));
  } else if (avgLoss > 0 && avgGain === 0) {
    breakevenWinRate = 100;
  }

  const safetyMargin = Number((winRate - breakevenWinRate).toFixed(1));

  let efficiencyTier: EfficiencyTier = 'GOOD';
  let efficiencyLabel = 'Consistente';
  if (totalTrades >= 3) {
    if (expectedValue > 0 && globalRiskRewardRatio >= 1.5 && safetyMargin >= 10) {
      efficiencyTier = 'HIGH';
      efficiencyLabel = 'Alta Eficiência';
    } else if (expectedValue > 0 && globalRiskRewardRatio >= 1.0) {
      efficiencyTier = 'GOOD';
      efficiencyLabel = 'Consistente';
    } else if (expectedValue > 0 && globalRiskRewardRatio < 0.9 && winRate >= 60) {
      efficiencyTier = 'INVERSE_ASYMMETRY';
      efficiencyLabel = 'Assimetria Inversa';
    } else {
      efficiencyTier = 'CRITICAL';
      efficiencyLabel = 'Ajustar Risco';
    }
  }

  // Identificar Setup mais eficiente, melhor R:R e que requer atenção
  const validSetups = setupsStats.filter((s) => s.totalTrades >= 1);
  const mostEfficientSetup = validSetups.length > 0 
    ? [...validSetups].sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0] 
    : null;
  const bestSetup = validSetups.length > 0 
    ? [...validSetups].sort((a, b) => b.riskRewardRatio - a.riskRewardRatio)[0] 
    : null;
  const attentionSetup = validSetups.length > 0 
    ? [...validSetups].sort((a, b) => a.expectedValue - b.expectedValue)[0] 
    : null;

  return {
    global: {
      totalTrades,
      wins: totalWins,
      losses: totalLosses,
      breakevens: totalBreakevens,
      winRate,
      totalProfit: Number(totalProfit.toFixed(2)),
      grossGain: Number(totalGrossGain.toFixed(2)),
      grossLoss: Number(totalGrossLoss.toFixed(2)),
      avgGain,
      avgLoss,
      riskRewardRatio: globalRiskRewardRatio,
      riskRewardFormatted: globalRiskRewardFormatted,
      expectedValue,
      breakevenWinRate,
      safetyMargin,
      efficiencyTier,
      efficiencyLabel,
      avgPtsWinGain: gWinGainCount > 0 ? Math.round(gWinGainSum / gWinGainCount) : 0,
      avgPtsWinLoss: gWinLossCount > 0 ? Math.round(gWinLossSum / gWinLossCount) : 0,
      avgPtsWdoGain: gWdoGainCount > 0 ? Number((gWdoGainSum / gWdoGainCount).toFixed(1)) : 0,
      avgPtsWdoLoss: gWdoLossCount > 0 ? Number((gWdoLossSum / gWdoLossCount).toFixed(1)) : 0,
      bestSetup,
      mostEfficientSetup,
      attentionSetup,
    },
    setupsStats,
  };
}
