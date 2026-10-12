import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Wallet, 
  Check, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  HelpCircle,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { formatBRL } from '../utils/calculations';
import { Trade } from '../types';

interface InitialCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCapital: number;
  onUpdateInitialCapital: (newCapital: number) => void;
  totalProfit: number;
  totalTrades: number;
  trades?: Trade[];
}

const PRESET_VALUES = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

const SHORT_MONTHS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

export const InitialCapitalModal: React.FC<InitialCapitalModalProps> = ({
  isOpen,
  onClose,
  initialCapital,
  onUpdateInitialCapital,
  totalProfit,
  totalTrades,
  trades = [],
}) => {
  const [inputValue, setInputValue] = useState<string>(String(initialCapital));
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showEvolutionChart, setShowEvolutionChart] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue(String(initialCapital));
      setIsSaved(false);
    }
  }, [isOpen, initialCapital]);

  const numericValue = parseFloat(inputValue.replace(',', '.')) || 0;
  const currentTotalEquity = numericValue + totalProfit;
  const returnRate = numericValue > 0 ? (totalProfit / numericValue) * 100 : 0;
  const isProfitable = totalProfit >= 0;

  // Calculate monthly evolution data for the line chart
  const monthlyEvolutionData = useMemo(() => {
    if (!trades || trades.length === 0) {
      // Empty fallback data point
      return [
        {
          monthKey: 'Início',
          displayMonth: 'Início',
          monthlyProfit: 0,
          patrimonio: numericValue,
          formattedPatrimonio: formatBRL(numericValue),
          formattedProfit: formatBRL(0),
          tradesCount: 0,
        },
      ];
    }

    // Group trades by year-month (YYYY-MM)
    const monthMap = new Map<string, { netProfit: number; count: number; dateSample: string }>();

    // First collect all trades
    trades.forEach((t) => {
      if (!t.date) return;
      const key = t.date.slice(0, 7); // e.g. "2026-03"
      const prev = monthMap.get(key) || { netProfit: 0, count: 0, dateSample: t.date };
      prev.netProfit += t.financialValue;
      prev.count += 1;
      monthMap.set(key, prev);
    });

    const sortedMonthKeys = Array.from(monthMap.keys()).sort();

    // Build cumulative monthly balance points
    let runningPatrimonio = numericValue;
    const points: Array<{
      monthKey: string;
      displayMonth: string;
      monthlyProfit: number;
      patrimonio: number;
      formattedPatrimonio: string;
      formattedProfit: string;
      tradesCount: number;
    }> = [];

    // Starting baseline point before first month
    points.push({
      monthKey: 'start',
      displayMonth: 'Início',
      monthlyProfit: 0,
      patrimonio: Math.round(numericValue * 100) / 100,
      formattedPatrimonio: formatBRL(numericValue),
      formattedProfit: formatBRL(0),
      tradesCount: 0,
    });

    sortedMonthKeys.forEach((key) => {
      const data = monthMap.get(key)!;
      runningPatrimonio += data.netProfit;

      const [year, month] = key.split('-');
      const shortMonth = SHORT_MONTHS[month] || month;
      const label = `${shortMonth}/${year.slice(2)}`;

      points.push({
        monthKey: key,
        displayMonth: label,
        monthlyProfit: Math.round(data.netProfit * 100) / 100,
        patrimonio: Math.round(runningPatrimonio * 100) / 100,
        formattedPatrimonio: formatBRL(runningPatrimonio),
        formattedProfit: formatBRL(data.netProfit),
        tradesCount: data.count,
      });
    });

    return points;
  }, [trades, numericValue]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalVal = Math.max(0, numericValue);
    onUpdateInitialCapital(finalVal);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleSelectPreset = (preset: number) => {
    setInputValue(String(preset));
    onUpdateInitialCapital(preset);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 z-10" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Janela de Capital Inicial</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  B3 Conta Real / Sim
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Defina o investimento inicial para acompanhar o saldo total em reais (Equity) e a evolução patrimonial mês a mês.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Valor do Capital Inicial (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="Ex: 1000"
                  autoFocus
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-slate-400 shrink-0" />
                <span>Exemplo: se você iniciou com R$ 1.000 de margem na corretora, digite 1000.</span>
              </p>
            </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Atalhos Rápidos de Capital:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_VALUES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                    numericValue === preset
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {preset >= 1000 ? `R$ ${preset / 1000}k` : `R$ ${preset}`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Impact Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Projeção do Saldo em Conta</span>
              <span className="text-slate-400 font-mono text-[10px]">{totalTrades} trades computados</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block">Capital Inicial</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white">
                  {formatBRL(numericValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Lucro Líquido</span>
                <span
                  className={`text-xs sm:text-sm font-mono font-bold flex items-center gap-0.5 ${
                    isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isProfitable ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {formatBRL(totalProfit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Saldo Total (Equity)</span>
                <span
                  className={`text-xs sm:text-sm font-mono font-extrabold ${
                    currentTotalEquity >= numericValue ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatBRL(currentTotalEquity)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Rentabilidade Acumulada:</span>
              <span
                className={`font-bold ${
                  returnRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {returnRate >= 0 ? `+${returnRate.toFixed(1)}%` : `${returnRate.toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* BOTÃO PARA VISUALIZAR GRÁFICO DE EVOLUÇÃO DO PATRIMÔNIO (MÊS x VALORES) */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEvolutionChart(!showEvolutionChart)}
              className="w-full p-3 flex items-center justify-between gap-3 text-left transition-colors hover:bg-emerald-500/10 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                  <LineChartIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Evolução do Patrimônio</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      Mês × Valores
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {showEvolutionChart 
                      ? 'Ocultar gráfico de evolução patrimonial' 
                      : 'Clique para exibir o gráfico de linha com a evolução do patrimônio por mês'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-400 transition-colors">
                <span className="text-xs font-medium hidden sm:inline">
                  {showEvolutionChart ? 'Ocultar' : 'Ver Gráfico'}
                </span>
                {showEvolutionChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {/* ÁREA DO GRÁFICO DE LINHA (QUANDO ABERTO) */}
            {showEvolutionChart && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    <span className="font-semibold text-slate-200">Evolução do Saldo Total (R$)</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                    <span>Eixo X: <strong>Mês</strong></span>
                    <span>Eixo Y: <strong>Valores (R$)</strong></span>
                  </div>
                </div>

                {/* Container do gráfico Recharts */}
                <div className="h-60 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyEvolutionData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="patrimonioGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis
                        dataKey="displayMonth"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                        tickFormatter={(val: number) => {
                          if (Math.abs(val) >= 1000) {
                            return `R$ ${(val / 1000).toFixed(0)}k`;
                          }
                          return `R$ ${val}`;
                        }}
                        tick={{ fill: '#94a3b8' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          const isGain = data.monthlyProfit >= 0;
                          return (
                            <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-xl text-xs font-mono backdrop-blur-md">
                              <div className="text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
                                <span className="font-bold text-white flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                                  {data.displayMonth === 'Início' ? 'Capital Inicial (Aporte)' : `Mês: ${data.displayMonth}`}
                                </span>
                                {data.tradesCount > 0 && (
                                  <span className="text-[10px] text-slate-400">
                                    {data.tradesCount} trade{data.tradesCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-400">Patrimônio Acumulado:</span>
                                  <span className="font-bold text-emerald-400">
                                    {data.formattedPatrimonio}
                                  </span>
                                </div>
                                {data.displayMonth !== 'Início' && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-400">Resultado do Mês:</span>
                                    <span className={`font-semibold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isGain ? `+${data.formattedProfit}` : data.formattedProfit}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      />
                      {/* Linha de referência do Capital Inicial aportado */}
                      <ReferenceLine
                        y={numericValue}
                        stroke="#0ea5e9"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Inicial: ${formatBRL(numericValue)}`,
                          fill: '#38bdf8',
                          fontSize: 10,
                          position: 'insideBottomRight',
                        }}
                      />
                      {/* Área com gradiente suave */}
                      <Area
                        type="monotone"
                        dataKey="patrimonio"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#patrimonioGradient)"
                        dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#022c22' }}
                        activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Rodapé explicativo do gráfico */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-6 rounded-full bg-sky-400 opacity-80" />
                    <span>Linha pontilhada azul: Capital Inicial (R$ {numericValue.toLocaleString('pt-BR')})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Linha verde: Saldo Total fechado de cada mês</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Where it is used note */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              O gráfico de <strong>Curva de Patrimônio</strong>, o <strong>Drawdown Máximo</strong> e o resumo de conta usarão este valor automaticamente.
            </span>
          </div>

          </div>

          {/* Pinned Footer Actions */}
          <div className="flex items-center justify-end gap-2 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isSaved ? 'Capital Salvo!' : 'Salvar Capital Inicial'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
