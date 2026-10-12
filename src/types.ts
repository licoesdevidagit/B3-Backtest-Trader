export type AssetType = 'WIN' | 'WDO' | 'ACOES';

export type TradeDirection = 'COMPRA' | 'VENDA';

export type TradeResult = 'GAIN' | 'LOSS' | 'BREAKEVEN';

export interface Setup {
  id: string;
  name: string;
  description?: string;
  preferredAsset: 'WIN' | 'WDO' | 'ACOES' | 'AMBOS' | 'TODOS';
  defaultGainPts?: number;
  defaultLossPts?: number;
  color?: string;
  imageUrl?: string;
  createdAt: string;
}

export type TraderEmotion = 
  | 'CALMO' 
  | 'CONFIANTE' 
  | 'ANSIOSO' 
  | 'MEDO' 
  | 'GANANCIA' 
  | 'IMPULSIVO' 
  | 'VINGANCA' 
  | 'EUFORICO' 
  | 'HESITANTE';

export type PlanDeviationReason =
  | 'NENHUM'
  | 'ENTRADA_PRECOCE'
  | 'FOMO'
  | 'STOP_MOVIDO'
  | 'ALVO_ENCURTADO'
  | 'AUMENTO_CONTRATOS'
  | 'OVERTRADING'
  | 'REVENGE_TRADE';

export interface TradePsychology {
  emotion?: TraderEmotion; // Emoção dominante
  anxietyLevel?: number; // Ansiedade (1 a 5)
  fearLevel?: number; // Medo (1 a 5)
  greedLevel?: number; // Ganância (1 a 5)
  confidenceLevel?: number; // Confiança (1 a 5)
  impulsivenessLevel?: number; // Impulsividade (1 a 5)
  followedPlan: boolean; // Cumprimento do plano operacional
  planDeviationReason?: PlanDeviationReason; // Motivo se fugiu do plano
  preTradeState?: 'FOCADO' | 'CANSADO' | 'ESTRESSADO' | 'NEUTRO';
  postTradeFeeling?: 'SATISFEITO' | 'ARREPENDIDO' | 'NEUTRO' | 'FRUSTRADO';
  notes?: string; // Diário emocional
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  asset: AssetType;
  ticker?: string; // Código de negociação da Ação B3 (ex: PETR4, VALE3, ITUB4)
  quantity?: number; // Quantidade de ações negociadas (ex: 100, 200, 500, 1000)
  entryPrice?: number; // Preço de entrada em R$ (ex: 35.50)
  exitPrice?: number; // Preço de saída em R$ (ex: 36.15)
  priceChange?: number; // Oscilação em R$ por ação (+0.65 ou -0.40)
  priceChangePercent?: number; // Oscilação percentual (+1.83%)
  financialVolume?: number; // Volume financeiro total movimentado (compra + venda)
  b3Fees?: number; // Taxas B3 e emolumentos estimados (~0.025% do volume)
  netFinancialValue?: number; // Lucro líquido final descontadas taxas B3
  setupId: string;
  setupName?: string; // Cache for display
  direction: TradeDirection;
  contracts: number; // Para WIN/WDO = contratos; para AÇÕES = quantidade de ações ou lotes
  result: TradeResult;
  points: number; // Signed points (WIN/WDO: pontos; Ações: oscilação em R$ por ação)
  financialValue: number; // In R$ (calculated from points * contracts * pointValue, or manual)
  notes?: string;
  psychology?: TradePsychology; // Psicologia e Disciplina do Trader
  createdAt: string;
}

export interface AcoesMetricsSummary {
  trades: number;
  winRate: number;
  lossRate: number;
  profit: number;
  totalVolume: number;
  totalShares: number;
  avgGain: number;
  avgLoss: number;
  mathematicalExpectancy: number;
  topTickers: {
    ticker: string;
    trades: number;
    profit: number;
    winRate: number;
  }[];
}

export interface DashboardMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // percentage 0 - 100
  lossRate: number; // percentage 0 - 100
  totalProfit: number; // in R$
  totalPointsWIN: number;
  totalPointsWDO: number;
  totalAcoesVolume?: number;
  grossGain: number; // sum of positive financial values
  grossLoss: number; // sum of negative financial values
  profitFactor: number; // grossGain / abs(grossLoss)
  payoff: number; // avgGain / avgLoss
  avgGain: number;
  avgLoss: number;
  mathematicalExpectancy: number; // in R$ per trade: (Taxa de Acerto * Ganho Médio) - (Taxa de Erro * Perda Média)
  maxDrawdown: number; // in R$ (peak to trough)
  maxDrawdownPercent?: number; // in %
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  winStats: {
    trades: number;
    winRate: number;
    lossRate: number;
    profit: number;
    points: number;
    avgGain: number;
    avgLoss: number;
    mathematicalExpectancy: number;
  };
  wdoStats: {
    trades: number;
    winRate: number;
    lossRate: number;
    profit: number;
    points: number;
    avgGain: number;
    avgLoss: number;
    mathematicalExpectancy: number;
  };
  acoesStats?: AcoesMetricsSummary;
}

export interface SetupPerformanceStat {
  setupId: string;
  setupName: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  lossRate: number;
  totalProfit: number;
  profitFactor: number;
  avgProfitPerTrade: number;
  avgGain: number;
  avgLoss: number;
  mathematicalExpectancy: number;
}

export interface MonthlySummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Março 2026"
  shortLabel: string; // "Mar/26"
  year: number;
  month: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // percentage 0 - 100
  netProfit: number; // R$
  grossGain: number;
  grossLoss: number;
  profitFactor: number;
  pointsWIN: number;
  pointsWDO: number;
  bestTrade: number;
  worstTrade: number;
  trades: Trade[];
}

export interface YearlySummary {
  year: number;
  yearLabel: string; // "2026"
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // 0 - 100
  netProfit: number; // R$
  grossGain: number;
  grossLoss: number;
  profitFactor: number;
  pointsWIN: number;
  pointsWDO: number;
  monthsCount: number;
  profitableMonthsCount: number;
  losingMonthsCount: number;
  avgMonthlyProfit: number;
  bestMonth?: {
    monthLabel: string;
    netProfit: number;
    winRate: number;
  };
  worstMonth?: {
    monthLabel: string;
    netProfit: number;
    winRate: number;
  };
}

export interface SessionPeriodStat {
  periodKey: string;
  name: string;
  shortName: string;
  timeRange: string;
  description: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // 0 - 100
  netProfit: number; // R$
  grossGain: number;
  grossLoss: number;
  profitFactor: number;
  avgProfitPerTrade: number;
  trades: Trade[];
}

export type DarfStatus = 'PAGO' | 'A_VENCER' | 'VENCIDO' | 'ISENTO' | 'SEM_DARF';

export interface MonthlyTaxApuracao {
  monthKey: string; // "YYYY-MM"
  year: number;
  month: number;
  monthLabel: string; // "Janeiro 2026"
  shortLabel: string; // "Jan/26"
  totalTrades: number;
  grossGain: number; // Lucro bruto (R$)
  grossLoss: number; // Prejuízo bruto (R$)
  netResult: number; // Resultado líquido do mês (R$)
  accumulatedLossPrevious: number; // Prejuízo acumulado vindo de meses anteriores (R$)
  lossCompensated: number; // Prejuízo compensado neste mês (R$)
  accumulatedLossRemaining: number; // Prejuízo acumulado restante para o próximo mês (R$)
  taxBase: number; // Base de cálculo do IR (R$)
  irRate: number; // Alíquota: 0.20 (20% para Day Trade)
  irGross: number; // IR Apurado (20% * taxBase)
  irrfDayTrade: number; // IRRF retido na fonte pela corretora (1% dos ganhos diários positivos)
  irNetCalculated: number; // IR Bruto - IRRF
  darfAccumulatedPrevious: number; // Saldo de DARF < R$ 10 vindo de mês anterior
  darfDue: number; // Valor final da DARF a pagar no mês (ou 0 se acumulado < 10)
  darfCarriedForward: number; // Valor acumulado que vai para o próximo mês (< R$ 10)
  dueDate: string; // Data limite de vencimento (YYYY-MM-DD)
  dueDateFormatted: string; // DD/MM/AAAA (último dia útil do mês subsequente)
  daysUntilDue: number; // Dias restantes (positivo) ou atraso (negativo)
  isOverdue: boolean; // Se venceu e não está pago
  isPaid: boolean; // Marcado como pago pelo usuário
  paidAt?: string;
  status: DarfStatus;
  penaltyEstimate: number; // Multa estimada de mora (0,33% ao dia até max 20%) se em atraso
  interestEstimate: number; // Juros de mora estimados (taxa Selic 1% + Selic)
  totalDueWithInterest: number; // darfDue + multa + juros
}



