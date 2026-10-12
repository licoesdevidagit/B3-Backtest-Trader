import { Trade } from '../types';

export interface Milestone {
  id: string;
  targetProfit: number; // in R$
  title: string;
  shortTitle: string;
  rank: string;
  category: 'FINANCIAL' | 'DAILY';
  description: string;
  badge: string; // emoji or label
  code: string;
}

export const FINANCIAL_MILESTONES: Milestone[] = [
  {
    id: 'meta-1k',
    targetProfit: 1000,
    title: 'Meta de R$ 1.000,00',
    shortTitle: 'R$ 1.000',
    rank: 'Bronze Trader · Primeiro K',
    category: 'FINANCIAL',
    description: 'Atingiu a primeira grande barreira psicológica de R$ 1.000,00 de lucro líquido acumulado.',
    badge: '🥉',
    code: 'B3-1K-BRONZE',
  },
  {
    id: 'meta-2.5k',
    targetProfit: 2500,
    title: 'Meta de R$ 2.500,00',
    shortTitle: 'R$ 2.500',
    rank: 'Silver Trader · Consistência',
    category: 'FINANCIAL',
    description: 'Consistência comprovada com mais de R$ 2.500,00 de resultado líquido positivo.',
    badge: '🥈',
    code: 'B3-2.5K-SILVER',
  },
  {
    id: 'meta-5k',
    targetProfit: 5000,
    title: 'Meta de R$ 5.000,00',
    shortTitle: 'R$ 5.000',
    rank: 'Gold Trader · Trader Consistente',
    category: 'FINANCIAL',
    description: 'Alcançou a marca de R$ 5.000,00 operando Mini Índice e Mini Dólar.',
    badge: '🥇',
    code: 'B3-5K-GOLD',
  },
  {
    id: 'meta-10k',
    targetProfit: 10000,
    title: 'Meta de R$ 10.000,00',
    shortTitle: 'R$ 10.000',
    rank: 'Platinum Trader · Clube dos 10K',
    category: 'FINANCIAL',
    description: 'Conquistou a respeitada marca de R$ 10.000,00 no backtest com rigor e gestão de risco.',
    badge: '💎',
    code: 'B3-10K-PLATINUM',
  },
  {
    id: 'meta-25k',
    targetProfit: 25000,
    title: 'Meta de R$ 25.000,00',
    shortTitle: 'R$ 25.000',
    rank: 'Diamond Trader · Alta Performance',
    category: 'FINANCIAL',
    description: 'Operações de alta precisão totalizando R$ 25.000,00 de lucro líquido acumulado.',
    badge: '🔷',
    code: 'B3-25K-DIAMOND',
  },
  {
    id: 'meta-50k',
    targetProfit: 50000,
    title: 'Meta de R$ 50.000,00',
    shortTitle: 'R$ 50.000',
    rank: 'Master Trader · Nível Profissional',
    category: 'FINANCIAL',
    description: 'Atingiu meio cento de milhar (R$ 50.000,00) de resultado acumulado na B3.',
    badge: '👑',
    code: 'B3-50K-MASTER',
  },
  {
    id: 'meta-100k',
    targetProfit: 100000,
    title: 'Meta de R$ 100.000,00',
    shortTitle: 'R$ 100.000',
    rank: 'Grandmaster · Clube dos 100K',
    category: 'FINANCIAL',
    description: 'Atingiu a épica marca de 6 dígitos: R$ 100.000,00 de resultado financeiro positivo.',
    badge: '🏆',
    code: 'B3-100K-GRANDMASTER',
  },
  {
    id: 'meta-250k',
    targetProfit: 250000,
    title: 'Meta de R$ 250.000,00',
    shortTitle: 'R$ 250.000',
    rank: 'Legendary Trader · Elite B3',
    category: 'FINANCIAL',
    description: 'Desempenho lendário com um quarto de milhão de reais (R$ 250.000,00) acumulados.',
    badge: '⭐',
    code: 'B3-250K-LEGEND',
  },
  {
    id: 'meta-500k',
    targetProfit: 500000,
    title: 'Meta de R$ 500.000,00',
    shortTitle: 'R$ 500.000',
    rank: 'Titan Trader · Meio Milhão',
    category: 'FINANCIAL',
    description: 'Alcançou a marca monumental de R$ 500.000,00 em contratos futuros B3.',
    badge: '🔱',
    code: 'B3-500K-TITAN',
  },
  {
    id: 'meta-1m',
    targetProfit: 1000000,
    title: 'Meta de R$ 1.000.000,00',
    shortTitle: 'R$ 1 Milhão',
    rank: 'Mythic Trader · Clube do Milhão',
    category: 'FINANCIAL',
    description: 'Conquistou o patamar supremo de 1 Milhão de Reais de lucro líquido acumulado.',
    badge: '🌌',
    code: 'B3-1M-MYTHIC',
  },
];

export const STORAGE_KEY_SEEN_MILESTONES = 'b3_seen_milestones_v1';
export const STORAGE_KEY_LAST_PROFIT = 'b3_last_milestone_profit_v1';
export const STORAGE_KEY_CERT_TRADER_NAME = 'b3_cert_trader_name_v1';

/**
 * Returns all milestones achieved for a given accumulated profit.
 */
export function getAchievedMilestones(totalProfit: number): Milestone[] {
  if (totalProfit <= 0) return [];
  return FINANCIAL_MILESTONES.filter((m) => totalProfit >= m.targetProfit);
}

/**
 * Returns the next upcoming milestone to be achieved.
 */
export function getNextMilestone(totalProfit: number): {
  milestone: Milestone;
  progressPercent: number;
  remainingAmount: number;
} | null {
  const next = FINANCIAL_MILESTONES.find((m) => totalProfit < m.targetProfit);
  if (!next) return null;

  const prevTarget = FINANCIAL_MILESTONES[FINANCIAL_MILESTONES.indexOf(next) - 1]?.targetProfit || 0;
  const range = next.targetProfit - prevTarget;
  const currentInRange = Math.max(0, totalProfit - prevTarget);
  const progressPercent = Math.min(100, Math.max(0, (currentInRange / range) * 100));
  const remainingAmount = Math.max(0, next.targetProfit - totalProfit);

  return {
    milestone: next,
    progressPercent,
    remainingAmount,
  };
}

/**
 * Checks if a new milestone was crossed since the last check, and returns it.
 */
export function detectNewMilestoneAchieved(currentProfit: number): Milestone | null {
  try {
    const rawSeen = localStorage.getItem(STORAGE_KEY_SEEN_MILESTONES);
    const seenIds: string[] = rawSeen ? JSON.parse(rawSeen) : [];

    const achieved = getAchievedMilestones(currentProfit);
    // Find the highest achieved milestone that hasn't been seen yet
    const unseen = achieved.filter((m) => !seenIds.includes(m.id));

    if (unseen.length > 0) {
      // Pick the most recent/highest one
      const newest = unseen[unseen.length - 1];
      return newest;
    }
  } catch (e) {
    console.error('Error detecting new milestone', e);
  }
  return null;
}

/**
 * Marks a milestone as seen in localStorage.
 */
export function markMilestoneAsSeen(milestoneId: string): void {
  try {
    const rawSeen = localStorage.getItem(STORAGE_KEY_SEEN_MILESTONES);
    const seenIds: string[] = rawSeen ? JSON.parse(rawSeen) : [];
    if (!seenIds.includes(milestoneId)) {
      seenIds.push(milestoneId);
      localStorage.setItem(STORAGE_KEY_SEEN_MILESTONES, JSON.stringify(seenIds));
    }
  } catch (e) {
    console.error('Error marking milestone as seen', e);
  }
}
