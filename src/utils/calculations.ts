import { AssetType, DashboardMetrics, MonthlySummary, SessionPeriodStat, Setup, SetupPerformanceStat, Trade, TradeResult, YearlySummary } from '../types';
import { SETUP_CHART_PRESETS } from './setupChartPresets';

// B3 Point Values in R$ per contract/unit
export const POINT_VALUE_WIN = 0.20; // R$ 0,20 por ponto no Mini Índice
export const POINT_VALUE_WDO = 10.00; // R$ 10,00 por ponto no Mini Dólar
export const POINT_VALUE_ACOES = 1.00; // R$ 1,00 por Real de oscilação por ação

export interface B3StockInfo {
  ticker: string;
  name: string;
  sector: string;
  standardLot: number;
  typicalDailyRangePts: number; // Oscilação típica diária em R$ (ex: 0.85)
}

export const B3_POPULAR_STOCKS: B3StockInfo[] = [
  { ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo & Gás', standardLot: 100, typicalDailyRangePts: 0.90 },
  { ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração', standardLot: 100, typicalDailyRangePts: 1.20 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', sector: 'Financeiro', standardLot: 100, typicalDailyRangePts: 0.65 },
  { ticker: 'BBDC4', name: 'Bradesco PN', sector: 'Financeiro', standardLot: 100, typicalDailyRangePts: 0.35 },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', sector: 'Financeiro', standardLot: 100, typicalDailyRangePts: 0.70 },
  { ticker: 'PRIO3', name: 'PetroRio ON', sector: 'Petróleo & Gás', standardLot: 100, typicalDailyRangePts: 1.10 },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', sector: 'Varejo', standardLot: 100, typicalDailyRangePts: 0.40 },
  { ticker: 'WEGE3', name: 'WEG ON', sector: 'Bens de Capital', standardLot: 100, typicalDailyRangePts: 0.80 },
  { ticker: 'RENT3', name: 'Localiza ON', sector: 'Locação & Transporte', standardLot: 100, typicalDailyRangePts: 0.95 },
  { ticker: 'BOVA11', name: 'iShares Ibovespa ETF', sector: 'Índice B3', standardLot: 10, typicalDailyRangePts: 1.80 },
  { ticker: 'B3SA3', name: 'B3 S.A. ON', sector: 'Serviços Financeiros', standardLot: 100, typicalDailyRangePts: 0.30 },
  { ticker: 'SUZB3', name: 'Suzano ON', sector: 'Papel & Celulose', standardLot: 100, typicalDailyRangePts: 1.05 },
  { ticker: 'GGBR4', name: 'Gerdau PN', sector: 'Siderurgia', standardLot: 100, typicalDailyRangePts: 0.45 },
  { ticker: 'ABEV3', name: 'Ambev ON', sector: 'Bebidas', standardLot: 100, typicalDailyRangePts: 0.25 },
  { ticker: 'CSNA3', name: 'Siderúrgica Nacional ON', sector: 'Siderurgia', standardLot: 100, typicalDailyRangePts: 0.40 },
  { ticker: 'HAPV3', name: 'Hapvida ON', sector: 'Saúde', standardLot: 100, typicalDailyRangePts: 0.18 },
];

export function calculateTradeFinancial(
  asset: AssetType,
  signedPoints: number,
  contracts: number
): number {
  const pointValue = asset === 'WIN' ? POINT_VALUE_WIN : asset === 'WDO' ? POINT_VALUE_WDO : POINT_VALUE_ACOES;
  return Number((signedPoints * contracts * pointValue).toFixed(2));
}

export function calculateAcoesTradeDetails(
  direction: 'COMPRA' | 'VENDA',
  quantity: number,
  entryPrice: number,
  exitPrice: number,
  feeRateB3: number = 0.00025 // Emolumentos + Liquidação B3 para Day Trade (~0,025% do volume financeiro total)
) {
  const qty = Math.max(1, quantity);
  const priceDiff = direction === 'COMPRA' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
  const priceChangePercent = entryPrice > 0 ? (priceDiff / entryPrice) * 100 : 0;
  const grossFinancial = Number((priceDiff * qty).toFixed(2));
  const financialVolume = Number(((entryPrice * qty) + (exitPrice * qty)).toFixed(2));
  const estimatedB3Fees = Number((financialVolume * feeRateB3).toFixed(2));
  const netFinancial = Number((grossFinancial - estimatedB3Fees).toFixed(2));

  return {
    priceDiff: Number(priceDiff.toFixed(2)),
    priceChangePercent: Number(priceChangePercent.toFixed(2)),
    grossFinancial,
    financialVolume,
    estimatedB3Fees,
    netFinancial,
  };
}

export function formatBRL(value: number): string {
  const isNegative = value < 0;
  const formatted = Math.abs(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${formatted}` : formatted;
}

export function formatPoints(points: number, asset: AssetType): string {
  const sign = points > 0 ? '+' : '';
  if (asset === 'WIN') {
    return `${sign}${points.toLocaleString('pt-BR')} pts`;
  }
  if (asset === 'WDO') {
    return `${sign}${points.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`;
  }
  return `${sign}R$ ${Math.abs(points).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ação`;
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

export const INITIAL_SETUPS: Setup[] = [
  {
    id: 'setup-91',
    name: '9.1 Larry Williams',
    description: 'Virada da MME 9 exponencial com confirmação no rompimento do candle.',
    preferredAsset: 'AMBOS',
    defaultGainPts: 200,
    defaultLossPts: 130,
    color: '#3b82f6',
    imageUrl: SETUP_CHART_PRESETS[1]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-vwap',
    name: 'Rompimento de VWAP',
    description: 'Entrada a favor do fluxo com candle fechando acima/abaixo da VWAP e volume.',
    preferredAsset: 'AMBOS',
    defaultGainPts: 150,
    defaultLossPts: 100,
    color: '#10b981',
    imageUrl: SETUP_CHART_PRESETS[0]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-elefante',
    name: 'Barra Elefante (Oliver Velez)',
    description: 'Barra de ignição ampla saindo de congestão ou médias com stop na mínima/máxima.',
    preferredAsset: 'WIN',
    defaultGainPts: 300,
    defaultLossPts: 180,
    color: '#8b5cf6',
    imageUrl: SETUP_CHART_PRESETS[2]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-pullback20',
    name: 'Pullback na MME 20',
    description: 'Correção até a média de 20 períodos em tendência forte e gatilho de retomada.',
    preferredAsset: 'AMBOS',
    defaultGainPts: 250,
    defaultLossPts: 150,
    color: '#f59e0b',
    imageUrl: SETUP_CHART_PRESETS[3]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-trap',
    name: 'Trap de Rompimento',
    description: 'Armadilha em máxima/mínima prévia do dia ou suporte/resistência com reversão rápida.',
    preferredAsset: 'WDO',
    defaultGainPts: 10,
    defaultLossPts: 5,
    color: '#ec4899',
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-acoes-vwap',
    name: 'Rompimento de VWAP em Ações',
    description: 'Rompimento do preço médio ponderado por volume (VWAP) com volume acima da média nas ações do Ibov.',
    preferredAsset: 'ACOES',
    defaultGainPts: 0.65,
    defaultLossPts: 0.35,
    color: '#06b6d4',
    imageUrl: SETUP_CHART_PRESETS[0]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
  {
    id: 'setup-acoes-gap',
    name: 'Gap & Go na Abertura de Ações',
    description: 'Continuação imediata de gap de alta ou baixa após leilão das 10h com confirmação nos primeiros 5 minutos.',
    preferredAsset: 'ACOES',
    defaultGainPts: 0.80,
    defaultLossPts: 0.40,
    color: '#a855f7',
    imageUrl: SETUP_CHART_PRESETS[1]?.svgDataUrl,
    createdAt: '2026-01-01',
  },
];

export const SAMPLE_TRADES: Trade[] = [
  {
    id: 'trade-1',
    date: '2026-03-02',
    time: '09:20',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 200,
    financialValue: 80.00,
    notes: 'Entrada na violação da MME 9 virada para cima na abertura.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Entrada técnica executada no fechamento do candle.',
    },
    createdAt: '2026-03-02T09:25:00Z',
  },
  {
    id: 'trade-2',
    date: '2026-03-02',
    time: '10:45',
    asset: 'WDO',
    setupId: 'setup-vwap',
    setupName: 'Rompimento de VWAP',
    direction: 'VENDA',
    contracts: 2,
    result: 'GAIN',
    points: 8.5,
    financialValue: 170.00,
    notes: 'Fechamento abaixo da VWAP após payroll, alvo no ajuste.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Setup claro de rompimento com stop no topo prévio.',
    },
    createdAt: '2026-03-02T10:55:00Z',
  },
  {
    id: 'trade-3',
    date: '2026-03-03',
    time: '09:35',
    asset: 'WIN',
    setupId: 'setup-elefante',
    setupName: 'Barra Elefante (Oliver Velez)',
    direction: 'COMPRA',
    contracts: 3,
    result: 'GAIN',
    points: 320,
    financialValue: 192.00,
    notes: 'Barra elefante nos primeiros 30 min rompendo topo do dia anterior.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 3,
      confidenceLevel: 4,
      impulsivenessLevel: 2,
      followedPlan: true,
      notes: 'Barra de ignição de livro. Alvo atingido com disciplina.',
    },
    createdAt: '2026-03-03T09:48:00Z',
  },
  {
    id: 'trade-4',
    date: '2026-03-03',
    time: '11:15',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'VENDA',
    contracts: 2,
    result: 'LOSS',
    points: -140,
    financialValue: -56.00,
    notes: 'Violou a mínima mas mercado reverteu com fluxo forte.',
    psychology: {
      emotion: 'ANSIOSO',
      anxietyLevel: 4,
      fearLevel: 3,
      greedLevel: 3,
      confidenceLevel: 2,
      impulsivenessLevel: 4,
      followedPlan: false,
      planDeviationReason: 'ENTRADA_PRECOCE',
      notes: 'Cliquei antes do candle fechar por medo de ficar de fora.',
    },
    createdAt: '2026-03-03T11:22:00Z',
  },
  {
    id: 'trade-5',
    date: '2026-03-04',
    time: '10:10',
    asset: 'WDO',
    setupId: 'setup-trap',
    setupName: 'Trap de Rompimento',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 10,
    financialValue: 200.00,
    notes: 'Violou suporte do 5.720 e devolveu com absorção no book.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 2,
      fearLevel: 2,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Paciência para esperar o trap confirmar.',
    },
    createdAt: '2026-03-04T10:25:00Z',
  },
  {
    id: 'trade-6',
    date: '2026-03-04',
    time: '14:20',
    asset: 'WIN',
    setupId: 'setup-pullback20',
    setupName: 'Pullback na MME 20',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 180,
    financialValue: 72.00,
    notes: 'Toque na média móvel de 20 com candle de força.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Pullback respeitou o suporte da média.',
    },
    createdAt: '2026-03-04T14:32:00Z',
  },
  {
    id: 'trade-7',
    date: '2026-03-05',
    time: '09:40',
    asset: 'WDO',
    setupId: 'setup-vwap',
    setupName: 'Rompimento de VWAP',
    direction: 'VENDA',
    contracts: 1,
    result: 'LOSS',
    points: -6.0,
    financialValue: -60.00,
    notes: 'Falso rompimento da VWAP em dia lateral.',
    psychology: {
      emotion: 'MEDO',
      anxietyLevel: 4,
      fearLevel: 5,
      greedLevel: 1,
      confidenceLevel: 2,
      impulsivenessLevel: 3,
      followedPlan: false,
      planDeviationReason: 'STOP_MOVIDO',
      notes: 'Hesitação na saída e stop movido contra a posição.',
    },
    createdAt: '2026-03-05T09:50:00Z',
  },
  {
    id: 'trade-8',
    date: '2026-03-05',
    time: '11:05',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'COMPRA',
    contracts: 2,
    result: 'BREAKEVEN',
    points: 0,
    financialValue: 0.00,
    notes: 'Andou 100 pontos, stop móvel movido para o 0x0.',
    psychology: {
      emotion: 'HESITANTE',
      anxietyLevel: 3,
      fearLevel: 3,
      greedLevel: 1,
      confidenceLevel: 3,
      impulsivenessLevel: 2,
      followedPlan: true,
      notes: 'Protegi a operação no 0x0 para eliminar risco.',
    },
    createdAt: '2026-03-05T11:18:00Z',
  },
  {
    id: 'trade-9',
    date: '2026-03-06',
    time: '10:00',
    asset: 'WIN',
    setupId: 'setup-elefante',
    setupName: 'Barra Elefante (Oliver Velez)',
    direction: 'VENDA',
    contracts: 2,
    result: 'GAIN',
    points: 260,
    financialValue: 104.00,
    notes: 'Rompimento para baixo com abertura de Dow Jones.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 3,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Abertura alinhada com fluxo vendedor estrangeiro.',
    },
    createdAt: '2026-03-06T10:15:00Z',
  },
  {
    id: 'trade-10',
    date: '2026-03-06',
    time: '11:30',
    asset: 'WDO',
    setupId: 'setup-trap',
    setupName: 'Trap de Rompimento',
    direction: 'VENDA',
    contracts: 2,
    result: 'GAIN',
    points: 9.0,
    financialValue: 180.00,
    notes: 'Armadilha na máxima do dia, venda confirmada com fluxo.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Execução tranquila com stop técnico bem calculado.',
    },
    createdAt: '2026-03-06T11:42:00Z',
  },
  // Day Trades de Ações B3 (Março 2026)
  {
    id: 'trade-acoes-1',
    date: '2026-03-09',
    time: '10:15',
    asset: 'ACOES',
    ticker: 'PETR4',
    quantity: 400,
    entryPrice: 38.20,
    exitPrice: 38.75,
    priceChange: 0.55,
    priceChangePercent: 1.44,
    financialVolume: 30780.00,
    b3Fees: 7.70,
    netFinancialValue: 212.30,
    setupId: 'setup-acoes-vwap',
    setupName: 'Rompimento de VWAP em Ações',
    direction: 'COMPRA',
    contracts: 400,
    result: 'GAIN',
    points: 0.55,
    financialValue: 220.00,
    notes: 'Rompimento da VWAP após abertura de NY com forte fluxo comprador em PETR4.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Entrada precisa após teste na VWAP com stop curto de R$ 0,20.',
    },
    createdAt: '2026-03-09T10:35:00Z',
  },
  {
    id: 'trade-acoes-2',
    date: '2026-03-10',
    time: '10:05',
    asset: 'ACOES',
    ticker: 'VALE3',
    quantity: 200,
    entryPrice: 62.40,
    exitPrice: 63.25,
    priceChange: 0.85,
    priceChangePercent: 1.36,
    financialVolume: 25130.00,
    b3Fees: 6.28,
    netFinancialValue: 163.72,
    setupId: 'setup-acoes-gap',
    setupName: 'Gap & Go na Abertura de Ações',
    direction: 'COMPRA',
    contracts: 200,
    result: 'GAIN',
    points: 0.85,
    financialValue: 170.00,
    notes: 'Minério de ferro subindo 2,5% em Dalian; continuação de gap nos primeiros 5 minutos.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Seguiu o plano de abertura à risca com alvo no topo prévio.',
    },
    createdAt: '2026-03-10T10:20:00Z',
  },
  {
    id: 'trade-acoes-3',
    date: '2026-03-11',
    time: '11:20',
    asset: 'ACOES',
    ticker: 'ITUB4',
    quantity: 500,
    entryPrice: 35.10,
    exitPrice: 34.80,
    priceChange: -0.30,
    priceChangePercent: -0.85,
    financialVolume: 34950.00,
    b3Fees: 8.74,
    netFinancialValue: -158.74,
    setupId: 'setup-acoes-vwap',
    setupName: 'Rompimento de VWAP em Ações',
    direction: 'COMPRA',
    contracts: 500,
    result: 'LOSS',
    points: -0.30,
    financialValue: -150.00,
    notes: 'Perdeu a VWAP logo após a entrada com índice pesando.',
    psychology: {
      emotion: 'ANSIOSO',
      anxietyLevel: 3,
      fearLevel: 2,
      greedLevel: 2,
      confidenceLevel: 3,
      impulsivenessLevel: 2,
      followedPlan: true,
      notes: 'Stop técnico respeitado rigorosamente.',
    },
    createdAt: '2026-03-11T11:45:00Z',
  },
  {
    id: 'trade-acoes-4',
    date: '2026-03-12',
    time: '14:10',
    asset: 'ACOES',
    ticker: 'BBAS3',
    quantity: 300,
    entryPrice: 28.50,
    exitPrice: 28.95,
    priceChange: 0.45,
    priceChangePercent: 1.58,
    financialVolume: 17235.00,
    b3Fees: 4.31,
    netFinancialValue: 130.69,
    setupId: 'setup-pullback20',
    setupName: 'Pullback na MME 20',
    direction: 'COMPRA',
    contracts: 300,
    result: 'GAIN',
    points: 0.45,
    financialValue: 135.00,
    notes: 'Pullback na média móvel de 20 no gráfico de 15min com volume crescente.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
      notes: 'Paciência para aguardar o recuo na média móvel.',
    },
    createdAt: '2026-03-12T14:40:00Z',
  },
  // Janeiro 2026 trades
  {
    id: 'trade-jan-1',
    date: '2026-01-14',
    time: '09:30',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 250,
    financialValue: 100.00,
    notes: 'Início de ano, rompimento com volume forte.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-01-14T09:40:00Z',
  },
  {
    id: 'trade-jan-2',
    date: '2026-01-19',
    time: '10:15',
    asset: 'WDO',
    setupId: 'setup-vwap',
    setupName: 'Rompimento de VWAP',
    direction: 'VENDA',
    contracts: 1,
    result: 'GAIN',
    points: 7.0,
    financialValue: 70.00,
    notes: 'Tendência de baixa no dólar após abertura de Nova York.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-01-19T10:25:00Z',
  },
  {
    id: 'trade-jan-3',
    date: '2026-01-23',
    time: '14:10',
    asset: 'WIN',
    setupId: 'setup-pullback20',
    setupName: 'Pullback na MME 20',
    direction: 'COMPRA',
    contracts: 2,
    result: 'LOSS',
    points: -150,
    financialValue: -60.00,
    notes: 'Stop atingido após notícia de inflação.',
    psychology: {
      emotion: 'IMPULSIVO',
      anxietyLevel: 4,
      fearLevel: 2,
      greedLevel: 4,
      confidenceLevel: 3,
      impulsivenessLevel: 5,
      followedPlan: false,
      planDeviationReason: 'FOMO',
      notes: 'Entrei atrasado no movimento esticado por FOMO.',
    },
    createdAt: '2026-01-23T14:20:00Z',
  },
  {
    id: 'trade-jan-4',
    date: '2026-01-28',
    time: '10:50',
    asset: 'WDO',
    setupId: 'setup-trap',
    setupName: 'Trap de Rompimento',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 8.0,
    financialValue: 160.00,
    notes: 'Armadilha em fundo anterior do diário.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-01-28T11:05:00Z',
  },
  // Fevereiro 2026 trades
  {
    id: 'trade-feb-1',
    date: '2026-02-04',
    time: '09:25',
    asset: 'WIN',
    setupId: 'setup-elefante',
    setupName: 'Barra Elefante (Oliver Velez)',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 300,
    financialValue: 120.00,
    notes: 'Barra de ignição perfeita rompendo consolidação matinal.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 3,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-02-04T09:35:00Z',
  },
  {
    id: 'trade-feb-2',
    date: '2026-02-11',
    time: '11:20',
    asset: 'WDO',
    setupId: 'setup-vwap',
    setupName: 'Rompimento de VWAP',
    direction: 'COMPRA',
    contracts: 2,
    result: 'LOSS',
    points: -5.0,
    financialValue: -100.00,
    notes: 'Rejeição na VWAP, stop técnico acionado.',
    psychology: {
      emotion: 'GANANCIA',
      anxietyLevel: 3,
      fearLevel: 2,
      greedLevel: 5,
      confidenceLevel: 3,
      impulsivenessLevel: 4,
      followedPlan: false,
      planDeviationReason: 'AUMENTO_CONTRATOS',
      notes: 'Dobrei a mão sem justificativa técnica.',
    },
    createdAt: '2026-02-11T11:32:00Z',
  },
  {
    id: 'trade-feb-3',
    date: '2026-02-18',
    time: '10:05',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'VENDA',
    contracts: 3,
    result: 'GAIN',
    points: 220,
    financialValue: 132.00,
    notes: 'Venda de livro com médias alinhadas para baixo.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-02-18T10:18:00Z',
  },
  {
    id: 'trade-feb-4',
    date: '2026-02-25',
    time: '15:00',
    asset: 'WIN',
    setupId: 'setup-pullback20',
    setupName: 'Pullback na MME 20',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 170,
    financialValue: 68.00,
    notes: 'Pullback no fechamento de gap.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 2,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2026-02-25T15:15:00Z',
  },
  // Novembro 2025 trades (Histórico Anual)
  {
    id: 'trade-nov-2025-1',
    date: '2025-11-12',
    time: '09:40',
    asset: 'WIN',
    setupId: 'setup-91',
    setupName: '9.1 Larry Williams',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 210,
    financialValue: 84.00,
    notes: 'Rompimento da MME 9 no gráfico de 5 min com volume alto.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2025-11-12T09:48:00Z',
  },
  {
    id: 'trade-nov-2025-2',
    date: '2025-11-20',
    time: '10:25',
    asset: 'WDO',
    setupId: 'setup-trap',
    setupName: 'Trap de Rompimento',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 9.0,
    financialValue: 180.00,
    notes: 'Armadilha em suporte do dólar após notícia externa.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 3,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2025-11-20T10:35:00Z',
  },
  {
    id: 'trade-nov-2025-3',
    date: '2025-11-26',
    time: '14:15',
    asset: 'WIN',
    setupId: 'setup-elefante',
    setupName: 'Barra Elefante (Oliver Velez)',
    direction: 'COMPRA',
    contracts: 3,
    result: 'GAIN',
    points: 280,
    financialValue: 168.00,
    notes: 'Barra de ignição na retomada de tendência pós almoço.',
    psychology: {
      emotion: 'CONFIANTE',
      anxietyLevel: 2,
      fearLevel: 2,
      greedLevel: 3,
      confidenceLevel: 4,
      impulsivenessLevel: 2,
      followedPlan: true,
    },
    createdAt: '2025-11-26T14:30:00Z',
  },
  // Dezembro 2025 trades (Histórico Anual)
  {
    id: 'trade-dec-2025-1',
    date: '2025-12-05',
    time: '09:50',
    asset: 'WIN',
    setupId: 'setup-vwap',
    setupName: 'Rompimento de VWAP',
    direction: 'COMPRA',
    contracts: 2,
    result: 'LOSS',
    points: -130,
    financialValue: -52.00,
    notes: 'Falso rompimento de VWAP com rejeição rápida.',
    psychology: {
      emotion: 'VINGANCA',
      anxietyLevel: 5,
      fearLevel: 2,
      greedLevel: 4,
      confidenceLevel: 2,
      impulsivenessLevel: 5,
      followedPlan: false,
      planDeviationReason: 'REVENGE_TRADE',
      notes: 'Tentei recuperar stop anterior sem setup.',
    },
    createdAt: '2025-12-05T10:02:00Z',
  },
  {
    id: 'trade-dec-2025-2',
    date: '2025-12-11',
    time: '11:10',
    asset: 'WDO',
    setupId: 'setup-trap',
    setupName: 'Trap de Rompimento',
    direction: 'VENDA',
    contracts: 2,
    result: 'GAIN',
    points: 11.0,
    financialValue: 220.00,
    notes: 'Violou máxima histórica e rejeitou com forte agressão vendedora.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 2,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 5,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2025-12-11T11:25:00Z',
  },
  {
    id: 'trade-dec-2025-3',
    date: '2025-12-18',
    time: '15:20',
    asset: 'WIN',
    setupId: 'setup-pullback20',
    setupName: 'Pullback na MME 20',
    direction: 'COMPRA',
    contracts: 2,
    result: 'GAIN',
    points: 220,
    financialValue: 88.00,
    notes: 'Rali de final de ano no Mini Índice.',
    psychology: {
      emotion: 'CALMO',
      anxietyLevel: 1,
      fearLevel: 1,
      greedLevel: 2,
      confidenceLevel: 4,
      impulsivenessLevel: 1,
      followedPlan: true,
    },
    createdAt: '2025-12-18T15:35:00Z',
  }
];

export function calculateMetrics(trades: Trade[]): DashboardMetrics {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      lossRate: 0,
      totalProfit: 0,
      totalPointsWIN: 0,
      totalPointsWDO: 0,
      grossGain: 0,
      grossLoss: 0,
      profitFactor: 0,
      payoff: 0,
      avgGain: 0,
      avgLoss: 0,
      mathematicalExpectancy: 0,
      maxDrawdown: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      winStats: { trades: 0, winRate: 0, lossRate: 0, profit: 0, points: 0, avgGain: 0, avgLoss: 0, mathematicalExpectancy: 0 },
      wdoStats: { trades: 0, winRate: 0, lossRate: 0, profit: 0, points: 0, avgGain: 0, avgLoss: 0, mathematicalExpectancy: 0 },
      acoesStats: { trades: 0, winRate: 0, lossRate: 0, profit: 0, totalVolume: 0, totalShares: 0, avgGain: 0, avgLoss: 0, mathematicalExpectancy: 0, topTickers: [] },
    };
  }

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let grossGain = 0;
  let grossLoss = 0;
  let totalProfit = 0;
  let totalPointsWIN = 0;
  let totalPointsWDO = 0;
  let totalAcoesVolume = 0;

  // Asset specific
  let winTrades = 0;
  let winWins = 0;
  let winLosses = 0;
  let winGrossGain = 0;
  let winGrossLoss = 0;
  let winProfit = 0;

  let wdoTrades = 0;
  let wdoWins = 0;
  let wdoLosses = 0;
  let wdoGrossGain = 0;
  let wdoGrossLoss = 0;
  let wdoProfit = 0;

  let acoesTrades = 0;
  let acoesWins = 0;
  let acoesLosses = 0;
  let acoesGrossGain = 0;
  let acoesGrossLoss = 0;
  let acoesProfit = 0;
  let acoesTotalShares = 0;
  let acoesTotalVolume = 0;
  const acoesTickersMap = new Map<string, { ticker: string; trades: number; wins: number; profit: number }>();

  // Streaks
  let curWins = 0;
  let maxWins = 0;
  let curLosses = 0;
  let maxLosses = 0;

  // Drawdown tracking
  let runningEquity = 0;
  let peakEquity = 0;
  let maxDrawdown = 0;

  // Trades ordered chronologically for streaks
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return da.localeCompare(db);
  });

  for (const t of sorted) {
    totalProfit += t.financialValue;
    runningEquity += t.financialValue;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const currentDd = peakEquity - runningEquity;
    if (currentDd > maxDrawdown) {
      maxDrawdown = currentDd;
    }

    if (t.asset === 'WIN') {
      winTrades++;
      totalPointsWIN += t.points;
      winProfit += t.financialValue;
      if (t.result === 'GAIN') {
        winWins++;
        winGrossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        winLosses++;
        winGrossLoss += Math.abs(Math.min(0, t.financialValue));
      }
    } else if (t.asset === 'WDO') {
      wdoTrades++;
      totalPointsWDO += t.points;
      wdoProfit += t.financialValue;
      if (t.result === 'GAIN') {
        wdoWins++;
        wdoGrossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        wdoLosses++;
        wdoGrossLoss += Math.abs(Math.min(0, t.financialValue));
      }
    } else if (t.asset === 'ACOES') {
      acoesTrades++;
      const shares = t.quantity || t.contracts || 100;
      acoesTotalShares += shares;
      const vol = t.financialVolume || ((t.entryPrice || 35) * shares * 2);
      acoesTotalVolume += vol;
      totalAcoesVolume += vol;
      acoesProfit += t.financialValue;

      const tk = (t.ticker || 'B3').toUpperCase();
      const tkData = acoesTickersMap.get(tk) || { ticker: tk, trades: 0, wins: 0, profit: 0 };
      tkData.trades++;
      tkData.profit += t.financialValue;

      if (t.result === 'GAIN') {
        acoesWins++;
        tkData.wins++;
        acoesGrossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        acoesLosses++;
        acoesGrossLoss += Math.abs(Math.min(0, t.financialValue));
      }
      acoesTickersMap.set(tk, tkData);
    }

    if (t.result === 'GAIN') {
      wins++;
      grossGain += Math.max(0, t.financialValue);
      curWins++;
      curLosses = 0;
      if (curWins > maxWins) maxWins = curWins;
    } else if (t.result === 'LOSS') {
      losses++;
      grossLoss += Math.abs(Math.min(0, t.financialValue));
      curLosses++;
      curWins = 0;
      if (curLosses > maxLosses) maxLosses = curLosses;
    } else {
      breakevens++;
      curWins = 0;
      curLosses = 0;
    }
  }

  const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
  const lossRate = totalTrades > 0 ? Number(((losses / totalTrades) * 100).toFixed(1)) : 0;
  const profitFactor = grossLoss > 0 ? Number((grossGain / grossLoss).toFixed(2)) : grossGain > 0 ? 99.99 : 0;
  const avgGain = wins > 0 ? Number((grossGain / wins).toFixed(2)) : 0;
  const avgLoss = losses > 0 ? Number((grossLoss / losses).toFixed(2)) : 0;
  const payoff = avgLoss > 0 ? Number((avgGain / avgLoss).toFixed(2)) : avgGain > 0 ? avgGain : 0;

  // Expectativa Matemática: EM = (Taxa de Acerto * Ganho Médio) - (Taxa de Erro * Perda Média)
  const winRateDecimal = totalTrades > 0 ? (wins / totalTrades) : 0;
  const lossRateDecimal = totalTrades > 0 ? (losses / totalTrades) : 0;
  const mathematicalExpectancy = totalTrades > 0
    ? Number(((winRateDecimal * avgGain) - (lossRateDecimal * avgLoss)).toFixed(2))
    : 0;

  const winWinRate = winTrades > 0 ? Number(((winWins / winTrades) * 100).toFixed(1)) : 0;
  const winLossRate = winTrades > 0 ? Number(((winLosses / winTrades) * 100).toFixed(1)) : 0;
  const winAvgGain = winWins > 0 ? Number((winGrossGain / winWins).toFixed(2)) : 0;
  const winAvgLoss = winLosses > 0 ? Number((winGrossLoss / winLosses).toFixed(2)) : 0;
  const winExpectancy = winTrades > 0
    ? Number((((winWins / winTrades) * winAvgGain) - ((winLosses / winTrades) * winAvgLoss)).toFixed(2))
    : 0;

  const wdoWinRate = wdoTrades > 0 ? Number(((wdoWins / wdoTrades) * 100).toFixed(1)) : 0;
  const wdoLossRate = wdoTrades > 0 ? Number(((wdoLosses / wdoTrades) * 100).toFixed(1)) : 0;
  const wdoAvgGain = wdoWins > 0 ? Number((wdoGrossGain / wdoWins).toFixed(2)) : 0;
  const wdoAvgLoss = wdoLosses > 0 ? Number((wdoGrossLoss / wdoLosses).toFixed(2)) : 0;
  const wdoExpectancy = wdoTrades > 0
    ? Number((((wdoWins / wdoTrades) * wdoAvgGain) - ((wdoLosses / wdoTrades) * wdoAvgLoss)).toFixed(2))
    : 0;

  const acoesWinRate = acoesTrades > 0 ? Number(((acoesWins / acoesTrades) * 100).toFixed(1)) : 0;
  const acoesLossRate = acoesTrades > 0 ? Number(((acoesLosses / acoesTrades) * 100).toFixed(1)) : 0;
  const acoesAvgGain = acoesWins > 0 ? Number((acoesGrossGain / acoesWins).toFixed(2)) : 0;
  const acoesAvgLoss = acoesLosses > 0 ? Number((acoesGrossLoss / acoesLosses).toFixed(2)) : 0;
  const acoesExpectancy = acoesTrades > 0
    ? Number((((acoesWins / acoesTrades) * acoesAvgGain) - ((acoesLosses / acoesTrades) * acoesAvgLoss)).toFixed(2))
    : 0;

  const topTickers = Array.from(acoesTickersMap.values())
    .map(item => ({
      ticker: item.ticker,
      trades: item.trades,
      profit: Number(item.profit.toFixed(2)),
      winRate: item.trades > 0 ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.trades - a.trades || b.profit - a.profit);

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    lossRate,
    totalProfit: Number(totalProfit.toFixed(2)),
    totalPointsWIN,
    totalPointsWDO: Number(totalPointsWDO.toFixed(1)),
    totalAcoesVolume: Number(totalAcoesVolume.toFixed(2)),
    grossGain: Number(grossGain.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor,
    payoff,
    avgGain,
    avgLoss,
    mathematicalExpectancy,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    winStats: {
      trades: winTrades,
      winRate: winWinRate,
      lossRate: winLossRate,
      profit: Number(winProfit.toFixed(2)),
      points: totalPointsWIN,
      avgGain: winAvgGain,
      avgLoss: winAvgLoss,
      mathematicalExpectancy: winExpectancy,
    },
    wdoStats: {
      trades: wdoTrades,
      winRate: wdoWinRate,
      lossRate: wdoLossRate,
      profit: Number(wdoProfit.toFixed(2)),
      points: Number(totalPointsWDO.toFixed(1)),
      avgGain: wdoAvgGain,
      avgLoss: wdoAvgLoss,
      mathematicalExpectancy: wdoExpectancy,
    },
    acoesStats: {
      trades: acoesTrades,
      winRate: acoesWinRate,
      lossRate: acoesLossRate,
      profit: Number(acoesProfit.toFixed(2)),
      totalVolume: Number(acoesTotalVolume.toFixed(2)),
      totalShares: acoesTotalShares,
      avgGain: acoesAvgGain,
      avgLoss: acoesAvgLoss,
      mathematicalExpectancy: acoesExpectancy,
      topTickers,
    },
  };
}

export function calculateSetupsPerformance(trades: Trade[], setups: Setup[]): SetupPerformanceStat[] {
  const map = new Map<string, {
    name: string;
    totalTrades: number;
    wins: number;
    losses: number;
    breakevens: number;
    totalProfit: number;
    grossGain: number;
    grossLoss: number;
  }>();

  // Initialize with all known setups
  for (const s of setups) {
    map.set(s.id, {
      name: s.name,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      totalProfit: 0,
      grossGain: 0,
      grossLoss: 0,
    });
  }

  // Populate from trades
  for (const t of trades) {
    let stat = map.get(t.setupId);
    if (!stat) {
      stat = {
        name: t.setupName || 'Setup Removido',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        totalProfit: 0,
        grossGain: 0,
        grossLoss: 0,
      };
      map.set(t.setupId, stat);
    }
    stat.totalTrades++;
    stat.totalProfit += t.financialValue;
    if (t.result === 'GAIN') {
      stat.wins++;
      stat.grossGain += Math.max(0, t.financialValue);
    } else if (t.result === 'LOSS') {
      stat.losses++;
      stat.grossLoss += Math.abs(Math.min(0, t.financialValue));
    } else {
      stat.breakevens++;
    }
  }

  const result: SetupPerformanceStat[] = [];
  map.forEach((val, id) => {
    const winRate = val.totalTrades > 0 ? Number(((val.wins / val.totalTrades) * 100).toFixed(1)) : 0;
    const lossRate = val.totalTrades > 0 ? Number(((val.losses / val.totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = val.grossLoss > 0
      ? Number((val.grossGain / val.grossLoss).toFixed(2))
      : val.grossGain > 0 ? 99.9 : 0;
    const avgProfitPerTrade = val.totalTrades > 0
      ? Number((val.totalProfit / val.totalTrades).toFixed(2))
      : 0;
    const avgGain = val.wins > 0 ? Number((val.grossGain / val.wins).toFixed(2)) : 0;
    const avgLoss = val.losses > 0 ? Number((val.grossLoss / val.losses).toFixed(2)) : 0;
    const winDecimal = val.totalTrades > 0 ? (val.wins / val.totalTrades) : 0;
    const lossDecimal = val.totalTrades > 0 ? (val.losses / val.totalTrades) : 0;
    const mathematicalExpectancy = val.totalTrades > 0
      ? Number(((winDecimal * avgGain) - (lossDecimal * avgLoss)).toFixed(2))
      : 0;

    result.push({
      setupId: id,
      setupName: val.name,
      totalTrades: val.totalTrades,
      wins: val.wins,
      losses: val.losses,
      breakevens: val.breakevens,
      winRate,
      lossRate,
      totalProfit: Number(val.totalProfit.toFixed(2)),
      profitFactor,
      avgProfitPerTrade,
      avgGain,
      avgLoss,
      mathematicalExpectancy,
    });
  });

  // Sort by highest profit or highest trade count
  return result.sort((a, b) => b.totalTrades - a.totalTrades || b.totalProfit - a.totalProfit);
}

export function calculateMonthlySummary(trades: Trade[]): MonthlySummary[] {
  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const SHORT_MONTHS_PT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const map = new Map<string, Trade[]>();

  for (const t of trades) {
    if (!t.date) continue;
    // Format YYYY-MM
    const key = t.date.slice(0, 7);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(t);
  }

  // Sort keys chronologically
  const sortedKeys = Array.from(map.keys()).sort();

  return sortedKeys.map((key) => {
    const monthTrades = map.get(key)!;
    const [yearStr, monthStr] = key.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10); // 1-12
    const monthIndex = monthNum - 1;

    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let netProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;
    let pointsWIN = 0;
    let pointsWDO = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;

    for (const t of monthTrades) {
      netProfit += t.financialValue;
      if (t.financialValue > bestTrade) bestTrade = t.financialValue;
      if (t.financialValue < worstTrade) worstTrade = t.financialValue;

      if (t.asset === 'WIN') {
        pointsWIN += t.points;
      } else if (t.asset === 'WDO') {
        pointsWDO += t.points;
      }

      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
      } else {
        breakevens++;
      }
    }

    const totalTrades = monthTrades.length;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0
      ? Number((grossGain / grossLoss).toFixed(2))
      : grossGain > 0 ? 99.9 : 0;

    return {
      monthKey: key,
      monthLabel: `${MONTHS_PT[monthIndex] || monthStr} ${year}`,
      shortLabel: `${SHORT_MONTHS_PT[monthIndex] || monthStr}/${String(year).slice(-2)}`,
      year,
      month: monthNum,
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      netProfit: Number(netProfit.toFixed(2)),
      grossGain: Number(grossGain.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor,
      pointsWIN,
      pointsWDO: Number(pointsWDO.toFixed(1)),
      bestTrade: bestTrade === -Infinity ? 0 : Number(bestTrade.toFixed(2)),
      worstTrade: worstTrade === Infinity ? 0 : Number(worstTrade.toFixed(2)),
      trades: monthTrades,
    };
  });
}

export function calculateYearlySummary(trades: Trade[]): YearlySummary[] {
  const monthlyList = calculateMonthlySummary(trades);
  const yearsMap = new Map<number, {
    year: number;
    trades: Trade[];
    months: MonthlySummary[];
  }>();

  for (const m of monthlyList) {
    if (!yearsMap.has(m.year)) {
      yearsMap.set(m.year, {
        year: m.year,
        trades: [],
        months: [],
      });
    }
    const entry = yearsMap.get(m.year)!;
    entry.months.push(m);
    entry.trades.push(...m.trades);
  }

  // Also catch any trade if date exists but maybe monthly didn't group
  for (const t of trades) {
    if (!t.date) continue;
    const y = parseInt(t.date.slice(0, 4), 10);
    if (!isNaN(y) && !yearsMap.has(y)) {
      yearsMap.set(y, {
        year: y,
        trades: [t],
        months: [],
      });
    }
  }

  const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => b - a);

  return sortedYears.map((year) => {
    const data = yearsMap.get(year)!;
    const yearTrades = data.trades;
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let netProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;
    let pointsWIN = 0;
    let pointsWDO = 0;

    for (const t of yearTrades) {
      netProfit += t.financialValue;
      if (t.asset === 'WIN') pointsWIN += t.points;
      else pointsWDO += t.points;

      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
      } else {
        breakevens++;
      }
    }

    const totalTrades = yearTrades.length;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0
      ? Number((grossGain / grossLoss).toFixed(2))
      : grossGain > 0 ? 99.9 : 0;

    const monthsCount = data.months.length;
    const profitableMonthsCount = data.months.filter((m) => m.netProfit > 0).length;
    const losingMonthsCount = data.months.filter((m) => m.netProfit < 0).length;
    const avgMonthlyProfit = monthsCount > 0 ? Number((netProfit / monthsCount).toFixed(2)) : 0;

    let bestMonth: { monthLabel: string; netProfit: number; winRate: number } | undefined;
    let worstMonth: { monthLabel: string; netProfit: number; winRate: number } | undefined;

    if (data.months.length > 0) {
      const sortedMonths = [...data.months].sort((a, b) => b.netProfit - a.netProfit);
      bestMonth = {
        monthLabel: sortedMonths[0].monthLabel,
        netProfit: sortedMonths[0].netProfit,
        winRate: sortedMonths[0].winRate,
      };
      worstMonth = {
        monthLabel: sortedMonths[sortedMonths.length - 1].monthLabel,
        netProfit: sortedMonths[sortedMonths.length - 1].netProfit,
        winRate: sortedMonths[sortedMonths.length - 1].winRate,
      };
    }

    return {
      year,
      yearLabel: String(year),
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      netProfit: Number(netProfit.toFixed(2)),
      grossGain: Number(grossGain.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor,
      pointsWIN,
      pointsWDO: Number(pointsWDO.toFixed(1)),
      monthsCount,
      profitableMonthsCount,
      losingMonthsCount,
      avgMonthlyProfit,
      bestMonth,
      worstMonth,
    };
  });
}

export function calculateSessionPeriods(trades: Trade[]): SessionPeriodStat[] {
  const periodsConfig = [
    {
      key: 'inicio',
      name: 'Início da Sessão',
      shortName: 'Início',
      timeRange: '09:00 - 11:30',
      description: 'Abertura de futuros, à vista e bolsas americanas (alta volatilidade)',
      minTime: 9 * 60,
      maxTime: 11 * 60 + 30,
    },
    {
      key: 'meio',
      name: 'Meio da Sessão',
      shortName: 'Meio',
      timeRange: '11:30 - 14:30',
      description: 'Período intermediário e almoço (fluxo contínuo e consolidações)',
      minTime: 11 * 60 + 30,
      maxTime: 14 * 60 + 30,
    },
    {
      key: 'fim',
      name: 'Fim da Sessão',
      shortName: 'Fim',
      timeRange: '14:30 - 18:00',
      description: 'Reta final da tarde e fechamentos dos mercados',
      minTime: 14 * 60 + 30,
      maxTime: 19 * 60,
    },
  ];

  const map = new Map<string, Trade[]>();
  periodsConfig.forEach((p) => map.set(p.key, []));
  const unclassifiedTrades: Trade[] = [];

  for (const t of trades) {
    if (!t.time) {
      unclassifiedTrades.push(t);
      continue;
    }

    const [hh, mm] = t.time.split(':').map((v) => parseInt(v, 10));
    const totalMinutes = (isNaN(hh) ? 10 : hh) * 60 + (isNaN(mm) ? 0 : mm);

    let matched = false;
    for (const p of periodsConfig) {
      if (totalMinutes >= p.minTime && totalMinutes < p.maxTime) {
        map.get(p.key)!.push(t);
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (totalMinutes < periodsConfig[0].minTime) {
        map.get('inicio')!.push(t);
      } else {
        map.get('fim')!.push(t);
      }
    }
  }

  const result: SessionPeriodStat[] = periodsConfig.map((p) => {
    const periodTrades = map.get(p.key) || [];
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let netProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;

    for (const t of periodTrades) {
      netProfit += t.financialValue;
      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
      } else {
        breakevens++;
      }
    }

    const totalTrades = periodTrades.length;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0
      ? Number((grossGain / grossLoss).toFixed(2))
      : grossGain > 0 ? 99.9 : 0;
    const avgProfitPerTrade = totalTrades > 0 ? Number((netProfit / totalTrades).toFixed(2)) : 0;

    return {
      periodKey: p.key,
      name: p.name,
      shortName: p.shortName,
      timeRange: p.timeRange,
      description: p.description,
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      netProfit: Number(netProfit.toFixed(2)),
      grossGain: Number(grossGain.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor,
      avgProfitPerTrade,
      trades: periodTrades,
    };
  });

  if (unclassifiedTrades.length > 0) {
    let wins = 0;
    let losses = 0;
    let breakevens = 0;
    let netProfit = 0;
    let grossGain = 0;
    let grossLoss = 0;

    for (const t of unclassifiedTrades) {
      netProfit += t.financialValue;
      if (t.result === 'GAIN') {
        wins++;
        grossGain += Math.max(0, t.financialValue);
      } else if (t.result === 'LOSS') {
        losses++;
        grossLoss += Math.abs(Math.min(0, t.financialValue));
      } else {
        breakevens++;
      }
    }

    const totalTrades = unclassifiedTrades.length;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0 ? Number((grossGain / grossLoss).toFixed(2)) : grossGain > 0 ? 99.9 : 0;

    result.push({
      periodKey: 'sem_horario',
      name: 'Horário Não Informado',
      shortName: 'Geral',
      timeRange: 'Variado',
      description: 'Trades sem horário preenchido',
      totalTrades,
      wins,
      losses,
      breakevens,
      winRate,
      netProfit: Number(netProfit.toFixed(2)),
      grossGain: Number(grossGain.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor,
      avgProfitPerTrade: totalTrades > 0 ? Number((netProfit / totalTrades).toFixed(2)) : 0,
      trades: unclassifiedTrades,
    });
  }

  return result;
}

// ==========================================
// PSICOLOGIA E DISCIPLINA DO TRADER
// ==========================================

import { TraderEmotion, PlanDeviationReason, TradePsychology } from '../types';

export interface EmotionConfig {
  id: TraderEmotion;
  label: string;
  emoji: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export const EMOTION_CONFIGS: Record<TraderEmotion, EmotionConfig> = {
  CALMO: {
    id: 'CALMO',
    label: 'Calmo / Centrado',
    emoji: '🧘',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    description: 'Mente tranquila, respirando com calma e operando sem afobação.',
  },
  CONFIANTE: {
    id: 'CONFIANTE',
    label: 'Confiante',
    emoji: '🦁',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-sky-400',
    borderClass: 'border-blue-500/30',
    description: 'Segurança baseada em técnica e aceitação do risco.',
  },
  ANSIOSO: {
    id: 'ANSIOSO',
    label: 'Ansioso',
    emoji: '😰',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    description: 'Coração acelerado, pressa de ver o trade andar ou sair rápido.',
  },
  MEDO: {
    id: 'MEDO',
    label: 'Medo / Inseguro',
    emoji: '😨',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    description: 'Medo de errar, hesitação no gatilho ou pânico na oscilação.',
  },
  GANANCIA: {
    id: 'GANANCIA',
    label: 'Ganância',
    emoji: '🤑',
    color: '#eab308',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    description: 'Querer esticar além do alvo planejado ou aumentar mão sem critério.',
  },
  IMPULSIVO: {
    id: 'IMPULSIVO',
    label: 'Impulsivo',
    emoji: '⚡',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    description: 'Clicou sem sinal claro do setup, entrada por impulso visual.',
  },
  VINGANCA: {
    id: 'VINGANCA',
    label: 'Vingança (Revenge)',
    emoji: '🔥',
    color: '#ef4444',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40',
    description: 'Tentativa de recuperar um loss anterior imediatamente.',
  },
  EUFORICO: {
    id: 'EUFORICO',
    label: 'Eufórico',
    emoji: '🚀',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/30',
    description: 'Sensação de invencibilidade após gain, perigo de descuido.',
  },
  HESITANTE: {
    id: 'HESITANTE',
    label: 'Hesitante',
    emoji: '🤔',
    color: '#64748b',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500/30',
    description: 'Viu o sinal mas demorou para clicar, entrando atrasado.',
  },
};

export const DEVIATION_REASON_CONFIGS: Record<PlanDeviationReason, { label: string; description: string }> = {
  NENHUM: {
    label: 'Seguiu 100% o Plano',
    description: 'Entrada, stop e alvo executados rigorosamente conforme a regra.',
  },
  ENTRADA_PRECOCE: {
    label: 'Entrada Precoce',
    description: 'Entrou antes do candle fechar ou antes do gatilho técnico.',
  },
  FOMO: {
    label: 'FOMO (Medo de Ficar de Fora)',
    description: 'Entrou correndo atrás do preço esticado com medo de perder a alta/baixa.',
  },
  STOP_MOVIDO: {
    label: 'Moveu / Tirou o Stop Loss',
    description: 'Arrastou o stop contra a posição na esperança de o preço voltar.',
  },
  ALVO_ENCURTADO: {
    label: 'Alvo Encurtado por Medo',
    description: 'Zerou no primeiro centavo por insegurança, sem deixar o trade maturar.',
  },
  AUMENTO_CONTRATOS: {
    label: 'Alavancagem Descontrolada',
    description: 'Aumentou o número de contratos fora do gerenciamento de risco.',
  },
  OVERTRADING: {
    label: 'Overtrading (Excesso)',
    description: 'Operou em horário ou contexto sem setup válido.',
  },
  REVENGE_TRADE: {
    label: 'Trade de Vingança',
    description: 'Operou com raiva após tomar um stop para devolver o dinheiro.',
  },
};

export interface PsychologyMetrics {
  totalTrades: number;
  totalWithPsychology: number;
  followedPlanCount: number;
  notFollowedPlanCount: number;
  disciplineScore: number; // 0 - 100%
  profitWithPlan: number;
  profitWithoutPlan: number;
  winRateWithPlan: number;
  winRateWithoutPlan: number;
  avoidableLoss: number; // Prejuízo acumulado em trades fora do plano
  avgAnxiety: number; // 1 - 5
  avgFear: number; // 1 - 5
  avgGreed: number; // 1 - 5
  avgConfidence: number; // 1 - 5
  avgImpulsiveness: number; // 1 - 5
  emotionBreakdown: Array<{
    emotion: TraderEmotion;
    config: EmotionConfig;
    count: number;
    profit: number;
    winRate: number;
    wins: number;
    losses: number;
  }>;
  deviationBreakdown: Array<{
    reason: PlanDeviationReason;
    label: string;
    description: string;
    count: number;
    profit: number;
    lossCount: number;
  }>;
}

export function calculatePsychologyMetrics(trades: Trade[]): PsychologyMetrics {
  const tradesWithPsy = trades.filter((t) => t.psychology !== undefined);
  const totalTrades = trades.length;
  const totalWithPsychology = tradesWithPsy.length;

  let followedPlanCount = 0;
  let notFollowedPlanCount = 0;
  let profitWithPlan = 0;
  let profitWithoutPlan = 0;
  let winsWithPlan = 0;
  let winsWithoutPlan = 0;
  let avoidableLoss = 0;

  let sumAnxiety = 0;
  let countAnxiety = 0;
  let sumFear = 0;
  let countFear = 0;
  let sumGreed = 0;
  let countGreed = 0;
  let sumConfidence = 0;
  let countConfidence = 0;
  let sumImpulsiveness = 0;
  let countImpulsiveness = 0;

  const emotionMap = new Map<TraderEmotion, { count: number; profit: number; wins: number; losses: number }>();
  const deviationMap = new Map<PlanDeviationReason, { count: number; profit: number; lossCount: number }>();

  trades.forEach((t) => {
    const psy = t.psychology;
    // Default followedPlan = true if not specified
    const followed = psy ? psy.followedPlan : true;

    if (followed) {
      followedPlanCount++;
      profitWithPlan += t.financialValue;
      if (t.result === 'GAIN') winsWithPlan++;
    } else {
      notFollowedPlanCount++;
      profitWithoutPlan += t.financialValue;
      if (t.result === 'GAIN') winsWithoutPlan++;
      if (t.financialValue < 0) {
        avoidableLoss += Math.abs(t.financialValue);
      }
    }

    if (psy) {
      if (typeof psy.anxietyLevel === 'number') {
        sumAnxiety += psy.anxietyLevel;
        countAnxiety++;
      }
      if (typeof psy.fearLevel === 'number') {
        sumFear += psy.fearLevel;
        countFear++;
      }
      if (typeof psy.greedLevel === 'number') {
        sumGreed += psy.greedLevel;
        countGreed++;
      }
      if (typeof psy.confidenceLevel === 'number') {
        sumConfidence += psy.confidenceLevel;
        countConfidence++;
      }
      if (typeof psy.impulsivenessLevel === 'number') {
        sumImpulsiveness += psy.impulsivenessLevel;
        countImpulsiveness++;
      }

      if (psy.emotion) {
        const prev = emotionMap.get(psy.emotion) || { count: 0, profit: 0, wins: 0, losses: 0 };
        prev.count++;
        prev.profit += t.financialValue;
        if (t.result === 'GAIN') prev.wins++;
        if (t.result === 'LOSS') prev.losses++;
        emotionMap.set(psy.emotion, prev);
      }

      if (psy.planDeviationReason && psy.planDeviationReason !== 'NENHUM') {
        const prev = deviationMap.get(psy.planDeviationReason) || { count: 0, profit: 0, lossCount: 0 };
        prev.count++;
        prev.profit += t.financialValue;
        if (t.result === 'LOSS') prev.lossCount++;
        deviationMap.set(psy.planDeviationReason, prev);
      }
    }
  });

  const disciplineScore = totalTrades > 0 ? Number(((followedPlanCount / totalTrades) * 100).toFixed(1)) : 100;
  const winRateWithPlan = followedPlanCount > 0 ? Number(((winsWithPlan / followedPlanCount) * 100).toFixed(1)) : 0;
  const winRateWithoutPlan = notFollowedPlanCount > 0 ? Number(((winsWithoutPlan / notFollowedPlanCount) * 100).toFixed(1)) : 0;

  const emotionBreakdown = (Object.keys(EMOTION_CONFIGS) as TraderEmotion[])
    .map((emo) => {
      const data = emotionMap.get(emo) || { count: 0, profit: 0, wins: 0, losses: 0 };
      const winRate = data.count > 0 ? Number(((data.wins / data.count) * 100).toFixed(1)) : 0;
      return {
        emotion: emo,
        config: EMOTION_CONFIGS[emo],
        count: data.count,
        profit: Number(data.profit.toFixed(2)),
        winRate,
        wins: data.wins,
        losses: data.losses,
      };
    })
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  const deviationBreakdown = (Object.keys(DEVIATION_REASON_CONFIGS) as PlanDeviationReason[])
    .filter((r) => r !== 'NENHUM')
    .map((reason) => {
      const data = deviationMap.get(reason) || { count: 0, profit: 0, lossCount: 0 };
      const config = DEVIATION_REASON_CONFIGS[reason];
      return {
        reason,
        label: config.label,
        description: config.description,
        count: data.count,
        profit: Number(data.profit.toFixed(2)),
        lossCount: data.lossCount,
      };
    })
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalTrades,
    totalWithPsychology,
    followedPlanCount,
    notFollowedPlanCount,
    disciplineScore,
    profitWithPlan: Number(profitWithPlan.toFixed(2)),
    profitWithoutPlan: Number(profitWithoutPlan.toFixed(2)),
    winRateWithPlan,
    winRateWithoutPlan,
    avoidableLoss: Number(avoidableLoss.toFixed(2)),
    avgAnxiety: countAnxiety > 0 ? Number((sumAnxiety / countAnxiety).toFixed(1)) : 2.5,
    avgFear: countFear > 0 ? Number((sumFear / countFear).toFixed(1)) : 2.0,
    avgGreed: countGreed > 0 ? Number((sumGreed / countGreed).toFixed(1)) : 2.2,
    avgConfidence: countConfidence > 0 ? Number((sumConfidence / countConfidence).toFixed(1)) : 3.8,
    avgImpulsiveness: countImpulsiveness > 0 ? Number((sumImpulsiveness / countImpulsiveness).toFixed(1)) : 2.1,
    emotionBreakdown,
    deviationBreakdown,
  };
}


