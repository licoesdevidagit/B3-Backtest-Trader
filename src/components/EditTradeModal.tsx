import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, XCircle, MinusCircle, Brain, AlertTriangle } from 'lucide-react';
import { AssetType, Setup, Trade, TradeDirection, TradeResult, TraderEmotion, PlanDeviationReason } from '../types';
import { calculateTradeFinancial, formatBRL, EMOTION_CONFIGS, DEVIATION_REASON_CONFIGS } from '../utils/calculations';

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  setups: Setup[];
  onUpdateTrade: (trade: Trade) => void;
}

export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  isOpen,
  onClose,
  trade,
  setups,
  onUpdateTrade,
}) => {
  const sortedSetups = useMemo(() => {
    return [...setups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [setups]);
  const [asset, setAsset] = useState<AssetType>('WIN');
  const [ticker, setTicker] = useState<string>('PETR4');
  const [quantity, setQuantity] = useState<number>(200);
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [setupId, setSetupId] = useState<string>('');
  const [direction, setDirection] = useState<TradeDirection>('COMPRA');
  const [contracts, setContracts] = useState<number>(1);
  const [result, setResult] = useState<TradeResult>('GAIN');
  const [pointsInput, setPointsInput] = useState<string>('150');
  const [financialInput, setFinancialInput] = useState<string>('0');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Psychology state
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [emotion, setEmotion] = useState<TraderEmotion>('CALMO');
  const [anxietyLevel, setAnxietyLevel] = useState<number>(2);
  const [fearLevel, setFearLevel] = useState<number>(2);
  const [greedLevel, setGreedLevel] = useState<number>(2);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(4);
  const [impulsivenessLevel, setImpulsivenessLevel] = useState<number>(1);
  const [planDeviationReason, setPlanDeviationReason] = useState<PlanDeviationReason>('NENHUM');
  const [psychologyNotes, setPsychologyNotes] = useState<string>('');

  useEffect(() => {
    if (trade) {
      setAsset(trade.asset);
      setTicker(trade.ticker || 'PETR4');
      setQuantity(trade.quantity || trade.contracts || 200);
      setEntryPrice(trade.entryPrice ? String(trade.entryPrice) : '');
      setExitPrice(trade.exitPrice ? String(trade.exitPrice) : '');
      setSetupId(trade.setupId);
      setDirection(trade.direction);
      setContracts(trade.contracts);
      setResult(trade.result);
      setPointsInput(String(Math.abs(trade.points)));
      setFinancialInput(String(trade.financialValue));
      setDate(trade.date);
      setTime(trade.time || '');
      setNotes(trade.notes || '');

      const psy = trade.psychology;
      setFollowedPlan(psy ? psy.followedPlan : true);
      setEmotion(psy?.emotion || 'CALMO');
      setAnxietyLevel(psy?.anxietyLevel ?? 2);
      setFearLevel(psy?.fearLevel ?? 2);
      setGreedLevel(psy?.greedLevel ?? 2);
      setConfidenceLevel(psy?.confidenceLevel ?? 4);
      setImpulsivenessLevel(psy?.impulsivenessLevel ?? 1);
      setPlanDeviationReason(psy?.planDeviationReason || 'NENHUM');
      setPsychologyNotes(psy?.notes || '');
    }
  }, [trade]);

  if (!isOpen || !trade) return null;

  const handleResultChange = (newResult: TradeResult) => {
    setResult(newResult);
    const absPoints = Math.abs(parseFloat(pointsInput) || 0);
    const signedPts = newResult === 'GAIN' ? absPoints : newResult === 'LOSS' ? -absPoints : 0;
    const fin = calculateTradeFinancial(asset, signedPts, contracts);
    setFinancialInput(String(fin));
  };

  const handlePointsChange = (ptsVal: string) => {
    setPointsInput(ptsVal);
    const absPoints = Math.abs(parseFloat(ptsVal) || 0);
    const signedPts = result === 'GAIN' ? absPoints : result === 'LOSS' ? -absPoints : 0;
    const fin = calculateTradeFinancial(asset, signedPts, contracts);
    setFinancialInput(String(fin));
  };

  const handleContractsChange = (qty: number) => {
    setContracts(qty);
    const absPoints = Math.abs(parseFloat(pointsInput) || 0);
    const signedPts = result === 'GAIN' ? absPoints : result === 'LOSS' ? -absPoints : 0;
    const fin = calculateTradeFinancial(asset, signedPts, qty);
    setFinancialInput(String(fin));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const absPoints = Math.abs(parseFloat(pointsInput) || 0);
    const signedPoints = result === 'GAIN' ? absPoints : result === 'LOSS' ? -absPoints : 0;
    const selectedSetup = setups.find(s => s.id === setupId);

    onUpdateTrade({
      ...trade,
      asset,
      ticker: asset === 'ACOES' ? (ticker.trim().toUpperCase() || 'PETR4') : undefined,
      quantity: asset === 'ACOES' ? Math.max(1, quantity) : undefined,
      entryPrice: asset === 'ACOES' && parseFloat(entryPrice) > 0 ? parseFloat(entryPrice) : undefined,
      exitPrice: asset === 'ACOES' && parseFloat(exitPrice) > 0 ? parseFloat(exitPrice) : undefined,
      setupId,
      setupName: selectedSetup?.name || trade.setupName || 'Setup',
      direction,
      contracts: asset === 'ACOES' ? Math.max(1, quantity) : Math.max(1, contracts),
      result,
      points: signedPoints,
      financialValue: parseFloat(financialInput) || 0,
      date,
      time: time || undefined,
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
        notes: psychologyNotes.trim() || undefined,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 shrink-0 bg-slate-900/95">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Editar Trade #{trade.id.slice(-4)}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Altere os parâmetros da operação selecionada.
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
          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4.5 space-y-3.5 overscroll-contain">
            {/* Asset & Direction */}
            <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ativo / Mercado
              </label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as AssetType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="WIN">Mini Índice (WIN)</option>
                <option value="WDO">Mini Dólar (WDO)</option>
                <option value="ACOES">Ações B3 (ACOES)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Direção
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="COMPRA">Compra</option>
                <option value="VENDA">Venda</option>
              </select>
            </div>
          </div>

          {/* If Ações, show Ticker and Stock Quantity */}
          {asset === 'ACOES' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-950/20">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Ticker da Ação (B3)
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="PETR4, VALE3..."
                  className="w-full rounded-lg border border-purple-500/40 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Quantidade de Ações
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    const q = Math.max(1, parseInt(e.target.value) || 100);
                    setQuantity(q);
                    setContracts(q);
                  }}
                  className="w-full rounded-lg border border-purple-500/40 bg-slate-900 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Preço Entrada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="Ex: 38.50"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Preço Saída (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="Ex: 39.10"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Setup & Contracts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Setup
              </label>
              <select
                value={setupId}
                onChange={(e) => setSetupId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {sortedSetups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {asset !== 'ACOES' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantidade de Contratos
                </label>
                <input
                  type="number"
                  min="1"
                  value={contracts}
                  onChange={(e) => handleContractsChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lote Total de Ações
                </label>
                <div className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-mono text-purple-300 font-bold">
                  {quantity} ações ({Math.floor(quantity / 100)} {Math.floor(quantity / 100) === 1 ? 'lote' : 'lotes'})
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Resultado
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleResultChange('GAIN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'GAIN'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>GAIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('LOSS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'LOSS'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>LOSS</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('BREAKEVEN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  result === 'BREAKEVEN'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <MinusCircle className="h-4 w-4" />
                <span>0x0</span>
              </button>
            </div>
          </div>

          {/* Points & Financial value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pontos ({asset === 'WIN' ? 'Índice' : 'Dólar'})
              </label>
              <input
                type="number"
                step="any"
                value={pointsInput}
                onChange={(e) => handlePointsChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Resultado Financeiro (R$)
              </label>
              <input
                type="number"
                step="any"
                value={financialInput}
                onChange={(e) => setFinancialInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data (dia/mês/ano)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Psicologia e Disciplina do Trader */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-white">
                Psicologia & Disciplina Desta Operação
              </span>
            </div>

            {/* Cumprimento do Plano */}
            <div>
              <span className="text-xs font-medium text-slate-300 block mb-1">
                Seguiu o Plano Operacional?
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
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
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
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <span>Não, Quebrei o Plano</span>
                </button>
              </div>
            </div>

            {/* Motivo do desvio se não seguiu */}
            {!followedPlan && (
              <div>
                <label className="block text-[11px] font-semibold text-rose-300 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Motivo da quebra do plano:</span>
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

            {/* Emoção */}
            <div>
              <span className="text-[11px] font-medium text-slate-300 block mb-1.5">
                Emoção Dominante:
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

            {/* Níveis 1 a 5 */}
            <div className="space-y-2 pt-1 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-sans">😰 Ansiedade:</span>
                    <strong className="text-amber-400">{anxietyLevel}/5</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={anxietyLevel}
                    onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-sans">😨 Medo:</span>
                    <strong className="text-purple-400">{fearLevel}/5</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={fearLevel}
                    onChange={(e) => setFearLevel(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-300 font-sans">🤑 Ganância:</span>
                    <strong className="text-yellow-400">{greedLevel}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={greedLevel}
                    onChange={(e) => setGreedLevel(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-300 font-sans">🦁 Confiança:</span>
                    <strong className="text-sky-400">{confidenceLevel}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={confidenceLevel}
                    onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-300 font-sans">⚡ Impulso:</span>
                    <strong className="text-rose-400">{impulsivenessLevel}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={impulsivenessLevel}
                    onChange={(e) => setImpulsivenessLevel(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Diário de mindset para este trade */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Reflexão Psicológica deste Trade:
              </label>
              <input
                type="text"
                value={psychologyNotes}
                onChange={(e) => setPsychologyNotes(e.target.value)}
                placeholder="Ex: Esperei calmamente o fechamento da barra; não hesitei no stop..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          </div>

          <div className="flex items-center justify-end gap-2 p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
