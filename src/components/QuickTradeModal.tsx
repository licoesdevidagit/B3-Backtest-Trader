import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle2, XCircle, MinusCircle, HelpCircle, Brain, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AssetType, Setup, Trade, TradeDirection, TradeResult, TraderEmotion, PlanDeviationReason } from '../types';
import { calculateTradeFinancial, formatBRL, POINT_VALUE_WIN, POINT_VALUE_WDO, EMOTION_CONFIGS, DEVIATION_REASON_CONFIGS } from '../utils/calculations';

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  setups: Setup[];
  onSaveTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  onOpenNewSetup: () => void;
  onOpenManageSetups?: () => void;
  initialAsset?: AssetType;
  initialTradeData?: Partial<Trade>;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  onClose,
  setups,
  onSaveTrade,
  onOpenNewSetup,
  onOpenManageSetups,
  initialAsset = 'WIN',
  initialTradeData,
}) => {
  const sortedSetups = useMemo(() => {
    return [...setups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [setups]);

  const [asset, setAsset] = useState<AssetType>(initialTradeData?.asset || initialAsset);
  const [ticker, setTicker] = useState<string>(initialTradeData?.ticker || 'PETR4');
  const [quantity, setQuantity] = useState<number>(initialTradeData?.quantity || 200);
  const [entryPrice, setEntryPrice] = useState<string>(initialTradeData?.entryPrice ? String(initialTradeData.entryPrice) : '');
  const [exitPrice, setExitPrice] = useState<string>(initialTradeData?.exitPrice ? String(initialTradeData.exitPrice) : '');
  const [setupId, setSetupId] = useState<string>(initialTradeData?.setupId || '');
  const [direction, setDirection] = useState<TradeDirection>(initialTradeData?.direction || 'COMPRA');
  const [contracts, setContracts] = useState<number>(initialTradeData?.contracts || 1);
  const [result, setResult] = useState<TradeResult>(initialTradeData?.result || 'GAIN');
  const [pointsInput, setPointsInput] = useState<string>(
    initialTradeData?.points !== undefined ? String(Math.abs(initialTradeData.points)) : '150'
  );
  const [customFinancial, setCustomFinancial] = useState<string>(
    initialTradeData?.financialValue !== undefined ? String(initialTradeData.financialValue) : ''
  );
  const [isManualFinancial, setIsManualFinancial] = useState<boolean>(false);
  const [date, setDate] = useState<string>(() => initialTradeData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    if (initialTradeData?.time) return initialTradeData.time;
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState<string>(initialTradeData?.notes || '');

  // Sync initialTradeData when opened
  useEffect(() => {
    if (isOpen && initialTradeData) {
      if (initialTradeData.asset) setAsset(initialTradeData.asset);
      if (initialTradeData.ticker) setTicker(initialTradeData.ticker);
      if (initialTradeData.quantity) {
        setQuantity(initialTradeData.quantity);
        setContracts(initialTradeData.quantity);
      }
      if (initialTradeData.entryPrice) setEntryPrice(String(initialTradeData.entryPrice));
      if (initialTradeData.exitPrice) setExitPrice(String(initialTradeData.exitPrice));
      if (initialTradeData.direction) setDirection(initialTradeData.direction);
      if (initialTradeData.result) setResult(initialTradeData.result);
      if (initialTradeData.setupId) setSetupId(initialTradeData.setupId);
      if (initialTradeData.points !== undefined) setPointsInput(String(Math.abs(initialTradeData.points)));
      if (initialTradeData.financialValue !== undefined) setCustomFinancial(String(initialTradeData.financialValue));
      if (initialTradeData.notes) setNotes(initialTradeData.notes);
    }
  }, [isOpen, initialTradeData]);

  // Psychology and Discipline state
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [emotion, setEmotion] = useState<TraderEmotion>('CALMO');
  const [anxietyLevel, setAnxietyLevel] = useState<number>(2);
  const [fearLevel, setFearLevel] = useState<number>(2);
  const [greedLevel, setGreedLevel] = useState<number>(2);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(4);
  const [impulsivenessLevel, setImpulsivenessLevel] = useState<number>(1);
  const [planDeviationReason, setPlanDeviationReason] = useState<PlanDeviationReason>('NENHUM');
  const [isPsychologyExpanded, setIsPsychologyExpanded] = useState<boolean>(false);

  // Default setup selection
  useEffect(() => {
    if (setups.length > 0 && !setupId) {
      // Find matching setup for asset or pick first
      const preferred = setups.find(s => s.preferredAsset === asset || s.preferredAsset === 'AMBOS') || setups[0];
      setSetupId(preferred.id);
    }
  }, [setups, asset, setupId]);

  // When asset changes, adjust default points if user hasn't heavily customized
  useEffect(() => {
    if (asset === 'WIN') {
      setPointsInput('150');
    } else {
      setPointsInput('8.0');
    }
  }, [asset]);

  // When setup or result changes, offer setup default points
  const applySetupDefaults = (currentSetupId: string, currentResult: TradeResult, currentAsset: AssetType) => {
    const s = setups.find(item => item.id === currentSetupId);
    if (!s) return;
    if (currentResult === 'GAIN' && s.defaultGainPts) {
      setPointsInput(String(s.defaultGainPts));
    } else if (currentResult === 'LOSS' && s.defaultLossPts) {
      setPointsInput(String(s.defaultLossPts));
    } else if (currentResult === 'BREAKEVEN') {
      setPointsInput('0');
    } else {
      setPointsInput(currentAsset === 'WIN' ? '150' : '8.0');
    }
  };

  const handleResultChange = (newResult: TradeResult) => {
    setResult(newResult);
    if (newResult === 'BREAKEVEN') {
      setPointsInput('0');
    } else {
      applySetupDefaults(setupId, newResult, asset);
    }
  };

  const handleSetupChange = (newSetupId: string) => {
    setSetupId(newSetupId);
    applySetupDefaults(newSetupId, result, asset);
  };

  // Auto calculate points and financial if entry and exit prices are provided for equities
  useEffect(() => {
    if (asset === 'ACOES') {
      const ep = parseFloat(entryPrice);
      const xp = parseFloat(exitPrice);
      if (!isNaN(ep) && !isNaN(xp) && ep > 0 && xp > 0) {
        const diff = direction === 'COMPRA' ? (xp - ep) : (ep - xp);
        setPointsInput(String(Math.abs(diff).toFixed(2)));
        if (diff > 0.001) {
          setResult('GAIN');
        } else if (diff < -0.001) {
          setResult('LOSS');
        } else {
          setResult('BREAKEVEN');
        }
      }
    }
  }, [asset, entryPrice, exitPrice, direction]);

  if (!isOpen) return null;

  // Signed points calculation
  const absPoints = Math.abs(parseFloat(pointsInput) || 0);
  const signedPoints = result === 'GAIN' ? absPoints : result === 'LOSS' ? -absPoints : 0;
  
  // Auto financial calculation
  const autoFinancial = calculateTradeFinancial(asset, signedPoints, contracts);
  const finalFinancial = isManualFinancial && customFinancial !== '' 
    ? parseFloat(customFinancial) || 0 
    : autoFinancial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSetup = setups.find(s => s.id === setupId);

    onSaveTrade({
      date,
      time,
      asset,
      ticker: asset === 'ACOES' ? (ticker.trim().toUpperCase() || 'PETR4') : undefined,
      quantity: asset === 'ACOES' ? Math.max(1, quantity) : undefined,
      entryPrice: asset === 'ACOES' && parseFloat(entryPrice) > 0 ? parseFloat(entryPrice) : undefined,
      exitPrice: asset === 'ACOES' && parseFloat(exitPrice) > 0 ? parseFloat(exitPrice) : undefined,
      setupId,
      setupName: selectedSetup?.name || 'Setup Padrão',
      direction,
      contracts: asset === 'ACOES' ? Math.max(1, quantity) : Math.max(1, contracts),
      result,
      points: signedPoints,
      financialValue: finalFinancial,
      notes: notes.trim() || undefined,
      psychology: {
        followedPlan,
        emotion,
        anxietyLevel,
        fearLevel,
        greedLevel,
        confidenceLevel,
        impulsivenessLevel,
        planDeviationReason: followedPlan ? 'NENHUM' : planDeviationReason,
      },
    });

    onClose();
  };

  const pointPresets = asset === 'WIN' 
    ? [50, 100, 150, 200, 300, 500] 
    : asset === 'WDO'
    ? [3.0, 5.0, 8.0, 10.0, 15.0, 20.0]
    : [0.20, 0.40, 0.60, 0.80, 1.00, 1.50];

  const quickContractPresets = [1, 2, 3, 5, 10];
  const quickStockQtyPresets = [100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 shrink-0 bg-slate-900/95">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Registrar Trade de Backtest
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Insira os dados da operação para computar na taxa de acerto e relatórios.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4.5 space-y-3.5 overscroll-contain">
            {/* 1. Ativo (Mini Índice WIN, Mini Dólar WDO ou Ações B3) */}
            <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              1. Selecione o Mercado / Ativo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAsset('WIN');
                  setPointsInput('150');
                }}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  asset === 'WIN'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold font-mono">Índice (WIN)</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  R$ 0,20 / pt
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAsset('WDO');
                  setPointsInput('8.0');
                }}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  asset === 'WDO'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold font-mono">Dólar (WDO)</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  R$ 10,00 / pt
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAsset('ACOES');
                  setPointsInput('0.60');
                }}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  asset === 'ACOES'
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold font-mono">Ações B3</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  R$ / ação
                </span>
              </button>
            </div>
          </div>

          {/* Se Ações B3: Seletor de Ticker da Ação */}
          {asset === 'ACOES' && (
            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-300">
                  Código da Ação (Ticker B3):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Lote Padrão: 100 ações
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Ex: PETR4, VALE3, ITUB4..."
                  className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono uppercase font-bold focus:border-indigo-500 focus:outline-none"
                  required
                />
                {/* Quick Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'PRIO3', 'WEGE3'].map((tk) => (
                    <button
                      key={tk}
                      type="button"
                      onClick={() => setTicker(tk)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                        ticker.toUpperCase() === tk
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Setup */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="setupSelect" className="text-xs font-medium text-slate-300">
                2. Setup Utilizado
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenNewSetup}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Novo Setup</span>
                </button>
                {onOpenManageSetups && (
                  <button
                    type="button"
                    onClick={onOpenManageSetups}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Excluir / Gerenciar</span>
                  </button>
                )}
              </div>
            </div>

            {setups.length === 0 ? (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
                <span>Nenhum setup cadastrado.</span>
                <button
                  type="button"
                  onClick={onOpenNewSetup}
                  className="underline font-semibold"
                >
                  Cadastrar Setup
                </button>
              </div>
            ) : (
              <select
                id="setupSelect"
                value={setupId}
                onChange={(e) => handleSetupChange(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {sortedSetups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.preferredAsset !== 'AMBOS' ? `(${s.preferredAsset})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Direção & Contratos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                3. Direção da Operação
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDirection('COMPRA')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    direction === 'COMPRA'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ▲ Compra
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('VENDA')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    direction === 'VENDA'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ▼ Venda
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                4. Contratos
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  {quickContractPresets.map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setContracts(qty)}
                      className={`h-8 w-8 rounded-lg text-xs font-mono font-semibold border transition-all ${
                        contracts === qty
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={contracts}
                  onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-center text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  title="Quantidade personalizada de contratos"
                />
              </div>
            </div>
          </div>

          {/* 5. Resultado (GAIN / LOSS / 0x0) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              5. Resultado da Operação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleResultChange('GAIN')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'GAIN'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>GAIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('LOSS')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'LOSS'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>LOSS</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('BREAKEVEN')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'BREAKEVEN'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <MinusCircle className="h-4 w-4" />
                <span>0x0 (Empate)</span>
              </button>
            </div>
          </div>

          {/* 6. Pontos e Cálculo Financeiro */}
          {result !== 'BREAKEVEN' && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Pontos do Trade ({asset === 'WIN' ? 'Índice' : 'Dólar'})
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {result === 'GAIN' ? '+' : '-'}{absPoints} pts
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                {pointPresets.map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setPointsInput(String(pts))}
                    className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                      parseFloat(pointsInput) === pts
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={asset === 'WIN' ? '5' : '0.5'}
                  min="0"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex: 150"
                  required
                />
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                  pts
                </span>
              </div>

              {/* Financial Outcome summary box */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span>Financeiro Estimado: </span>
                  <span className="font-mono text-slate-300">
                    ({contracts} ct × {result === 'GAIN' ? '+' : '-'}{absPoints} pts × {asset === 'WIN' ? 'R$ 0,20' : 'R$ 10,00'})
                  </span>
                </div>
                <div
                  className={`text-sm font-bold font-mono ${
                    finalFinancial > 0
                      ? 'text-emerald-400'
                      : finalFinancial < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {formatBRL(finalFinancial)}
                </div>
              </div>

              {/* Manual adjustment option toggle */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  id="manualFinCheck"
                  checked={isManualFinancial}
                  onChange={(e) => {
                    setIsManualFinancial(e.target.checked);
                    if (e.target.checked && customFinancial === '') {
                      setCustomFinancial(String(autoFinancial));
                    }
                  }}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="manualFinCheck" className="cursor-pointer">
                  Ajustar valor financeiro manualmente (ex: saídas parciais / corretagem)
                </label>
              </div>

              {isManualFinancial && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customFinancial}
                    onChange={(e) => setCustomFinancial(e.target.value)}
                    placeholder="Valor financeiro final em R$"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 7. Data e Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Data do Trade (dia/mês/ano)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Horário (opcional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* 8. Psicologia e Disciplina do Trader */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">
                  Psicologia & Disciplina do Trader
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPsychologyExpanded(!isPsychologyExpanded)}
                className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>{isPsychologyExpanded ? 'Recolher' : 'Expandir'}</span>
                {isPsychologyExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Cumprimento do Plano Operacional (Botão Primário) */}
            <div>
              <span className="text-[11px] font-medium text-slate-300 block mb-1">
                Seguiu o Plano Operacional à Risca?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFollowedPlan(true);
                    setPlanDeviationReason('NENHUM');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    followedPlan
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Sim, Plano Cumprido</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFollowedPlan(false);
                    if (planDeviationReason === 'NENHUM') {
                      setPlanDeviationReason('ENTRADA_PRECOCE');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    !followedPlan
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm ring-1 ring-rose-500/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <span>Não, Quebrei a Regra</span>
                </button>
              </div>
            </div>

            {isPsychologyExpanded && (
              <div className="space-y-3 pt-2 border-t border-purple-500/20 animate-in fade-in">
                {/* Motivo do desvio se não seguiu */}
                {!followedPlan && (
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-300 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Qual foi o motivo da fuga do plano?</span>
                    </label>
                    <select
                      value={planDeviationReason}
                      onChange={(e) => setPlanDeviationReason(e.target.value as PlanDeviationReason)}
                      className="w-full rounded-lg border border-rose-500/40 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {Object.entries(DEVIATION_REASON_CONFIGS)
                        .filter(([k]) => k !== 'NENHUM')
                        .map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Emoção Dominante (Chips) */}
                <div>
                  <span className="text-[11px] font-medium text-slate-300 block mb-1.5">
                    Emoção Dominante no Trade:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(EMOTION_CONFIGS).map(([key, cfg]) => {
                      const isSelected = emotion === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEmotion(key as TraderEmotion)}
                          className={`py-1 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border cursor-pointer truncate ${
                            isSelected
                              ? `${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} font-bold ring-1 ring-purple-500/30 shadow-sm`
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{cfg.emoji}</span>
                          <span className="truncate">{cfg.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Os 5 Níveis Emocionais (1 a 5) */}
                <div className="space-y-2 pt-1 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Ansiedade */}
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-sans">😰 Ansiedade:</span>
                        <strong className="text-amber-400">{anxietyLevel}/5</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={anxietyLevel}
                        onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Medo */}
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-sans">😨 Medo:</span>
                        <strong className="text-purple-400">{fearLevel}/5</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={fearLevel}
                        onChange={(e) => setFearLevel(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Ganância */}
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-sans">🤑 Ganância:</span>
                        <strong className="text-yellow-400">{greedLevel}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={greedLevel}
                        onChange={(e) => setGreedLevel(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                    </div>

                    {/* Confiança */}
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-sans">🦁 Confiança:</span>
                        <strong className="text-sky-400">{confidenceLevel}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={confidenceLevel}
                        onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Impulsividade */}
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-sans">⚡ Impulso:</span>
                        <strong className="text-rose-400">{impulsivenessLevel}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={impulsivenessLevel}
                        onChange={(e) => setImpulsivenessLevel(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 9. Observações / Anotações */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Observações / Contexto (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Rompimento do primeiro candle, VWAP flat, alvo técnico atingido..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          </div>

          {/* Footer Submit (fixed at bottom) */}
          <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={setups.length === 0}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
            >
              Registrar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
