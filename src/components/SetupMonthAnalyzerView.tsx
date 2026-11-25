import React, { useState, useMemo } from 'react';
import { Setup, Trade, AssetType } from '../types';
import { formatBRL, formatPoints } from '../utils/calculations';
import { Calendar, Trophy, TrendingUp, TrendingDown, Award, Sparkles, Filter, BarChart3, CheckCircle2 } from 'lucide-react';

interface SetupMonthAnalyzerViewProps {
  trades: Trade[];
  setups: Setup[];
  onFilterBySetup?: (setupId: string) => void;
  onFilterByMonth?: (monthKey: string) => void;
}

export const SetupMonthAnalyzerView: React.FC<SetupMonthAnalyzerViewProps> = ({
  trades,
  setups,
  onFilterBySetup,
  onFilterByMonth,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<'ALL' | AssetType>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Filter trades by asset & year
  const filteredTrades = useMemo(() => {
    let list = [...trades];
    if (selectedAsset !== 'ALL') {
      list = list.filter((t) => t.asset === selectedAsset);
    }
    if (selectedYear !== 'ALL') {
      list = list.filter((t) => t.date?.startsWith(selectedYear));
    }
    return list;
  }, [trades, selectedAsset, selectedYear]);

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    trades.forEach((t) => {
      if (t.date) {
        const y = t.date.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [trades]);

  // Group trades by Month (YYYY-MM)
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, Trade[]> = {};
    filteredTrades.forEach((t) => {
      if (!t.date) return;
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = [];
      }
      monthsMap[monthKey].push(t);
    });

    const monthKeys = Object.keys(monthsMap).sort().reverse();

    return monthKeys.map((monthKey) => {
      const monthTrades = monthsMap[monthKey];
      const [year, monthNum] = monthKey.split('-');
      
      const monthNames: Record<string, string> = {
        '01': 'Janeiro',
        '02': 'Fevereiro',
        '03': 'Março',
        '04': 'Abril',
        '05': 'Maio',
        '06': 'Junho',
        '07': 'Julho',
        '08': 'Agosto',
        '09': 'Setembro',
        '10': 'Outubro',
        '11': 'Novembro',
        '12': 'Dezembro',
      };
      
      const monthLabel = `${monthNames[monthNum] || monthNum} de ${year}`;

      // Calculate performance per setup for this month
      const setupPerformanceMap: Record<string, {
        setupId: string;
        setupName: string;
        totalProfit: number;
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        grossGain: number;
        grossLoss: number;
        profitFactor: number;
      }> = {};

      monthTrades.forEach((t) => {
        const sId = t.setupId || 'unknown';
        const sName = t.setupName || setups.find((s) => s.id === sId)?.name || 'Setup Padrão';
        
        if (!setupPerformanceMap[sId]) {
          setupPerformanceMap[sId] = {
            setupId: sId,
            setupName: sName,
            totalProfit: 0,
            totalTrades: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            grossGain: 0,
            grossLoss: 0,
            profitFactor: 0,
          };
        }

        const sp = setupPerformanceMap[sId];
        sp.totalTrades += 1;
        const v = t.financialValue || 0;
        sp.totalProfit += v;
        if (t.result === 'GAIN') {
          sp.wins += 1;
          sp.grossGain += v;
        } else if (t.result === 'LOSS') {
          sp.losses += 1;
          sp.grossLoss += Math.abs(v);
        }
      });

      // Calculate win rates & profit factors
      const setupResults = Object.values(setupPerformanceMap).map((sp) => {
        const winRate = sp.totalTrades > 0 ? (sp.wins / sp.totalTrades) * 100 : 0;
        const profitFactor = sp.grossLoss > 0 ? sp.grossGain / sp.grossLoss : sp.grossGain > 0 ? 99 : 0;
        return { ...sp, winRate, profitFactor };
      });

      // Sort by total profit descending
      setupResults.sort((a, b) => b.totalProfit - a.totalProfit);

      const bestSetup = setupResults.length > 0 ? setupResults[0] : null;

      // Total month profit
      const totalMonthProfit = monthTrades.reduce((acc, t) => acc + (t.financialValue || 0), 0);

      return {
        monthKey,
        monthLabel,
        monthTradesCount: monthTrades.length,
        totalMonthProfit,
        setupResults,
        bestSetup,
      };
    });
  }, [filteredTrades, setups]);

  // Overall Best Setup across all months (frequency of being #1 or total profit)
  const overallBestByMonthCount = useMemo(() => {
    const counts: Record<string, { name: string; count: number; totalProfit: number }> = {};
    monthlyData.forEach((m) => {
      if (m.bestSetup) {
        const id = m.bestSetup.setupId;
        if (!counts[id]) {
          counts[id] = { name: m.bestSetup.setupName, count: 0, totalProfit: 0 };
        }
        counts[id].count += 1;
        counts[id].totalProfit += m.bestSetup.totalProfit;
      }
    });
    return Object.entries(counts).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.count - a.count || b.totalProfit - a.totalProfit);
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                <Trophy className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Analisador: Qual Setup é Melhor para Cada Mês?
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Descubra qual estratégia operacional teve o melhor desempenho financeiro e taxa de acerto mês a mês. Otimize sua sazonalidade na B3.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Asset Filter */}
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedAsset('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedAsset === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos Ativos
              </button>
              <button
                type="button"
                onClick={() => setSelectedAsset('WIN')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedAsset === 'WIN' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                WIN (Índice)
              </button>
              <button
                type="button"
                onClick={() => setSelectedAsset('WDO')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedAsset === 'WDO' ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                WDO (Dólar)
              </button>
            </div>

            {/* Year Filter */}
            {availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Anos</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>Ano {y}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Highlights Summary */}
        {overallBestByMonthCount.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Setup Mais Vencedor (Qtd Meses)</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {overallBestByMonthCount[0]?.name} <span className="text-emerald-400 font-mono">({overallBestByMonthCount[0]?.count} meses)</span>
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Total de Meses Analisados</p>
                <p className="text-xs font-bold text-white mt-0.5 font-mono">
                  {monthlyData.length} meses operacionais
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Total Trades no Filtro</p>
                <p className="text-xs font-bold text-white mt-0.5 font-mono">
                  {filteredTrades.length} trades
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Cards */}
      {monthlyData.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60">
          <Calendar className="mx-auto h-10 w-10 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">Nenhum trade encontrado para o período/ativo selecionado.</p>
          <p className="text-xs text-slate-500 mt-1">Registre novos trades ou ajuste os filtros acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {monthlyData.map((m) => (
            <div
              key={m.monthKey}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden transition-all hover:border-slate-700"
            >
              {/* Month Header Banner */}
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 font-mono font-bold text-xs">
                    {m.monthKey.split('-')[1]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{m.monthLabel}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {m.monthTradesCount} trades
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Resultado do Mês</span>
                    <span className={`text-xs sm:text-sm font-mono font-bold ${m.totalMonthProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatBRL(m.totalMonthProfit)}
                    </span>
                  </div>

                  {onFilterByMonth && (
                    <button
                      type="button"
                      onClick={() => onFilterByMonth(m.monthKey)}
                      title="Ver trades deste mês no Histórico"
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                    >
                      Ver Histórico
                    </button>
                  )}
                </div>
              </div>

              {/* Best Setup Spotlight Banner */}
              {m.bestSetup && (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Melhor Setup do Mês</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Rank #1 🏆
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {m.bestSetup.setupName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Lucro no Mês</span>
                      <span className="font-bold text-emerald-400 text-sm">{formatBRL(m.bestSetup.totalProfit)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Win Rate</span>
                      <span className="font-bold text-slate-200">{m.bestSetup.winRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Fator de Lucro</span>
                      <span className="font-bold text-sky-400">{m.bestSetup.profitFactor === 99 ? '∞' : m.bestSetup.profitFactor.toFixed(2)}</span>
                    </div>
                    {onFilterBySetup && (
                      <button
                        type="button"
                        onClick={() => onFilterBySetup(m.bestSetup!.setupId)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-semibold transition-colors cursor-pointer text-[11px]"
                      >
                        Filtrar Setup
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* All Setups Performance Table for this Month */}
              <div className="p-3.5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-2 px-2">Setup Operacional</th>
                      <th className="py-2 px-2 text-center">Trades</th>
                      <th className="py-2 px-2 text-center">Win Rate</th>
                      <th className="py-2 px-2 text-right">Resultado Financeiro</th>
                      <th className="py-2 px-2 text-center">Fator de Lucro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {m.setupResults.map((sp, idx) => (
                      <tr key={sp.setupId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 font-sans font-medium text-slate-200 flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span>{sp.setupName}</span>
                          {idx === 0 && <span className="text-[10px] text-amber-400 font-semibold font-sans">⭐ Campeão</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          {sp.totalTrades}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          <span className={sp.winRate >= 50 ? 'text-emerald-400' : 'text-slate-400'}>
                            {sp.winRate.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block">({sp.wins}G / {sp.losses}L)</span>
                        </td>
                        <td className={`py-2.5 px-2 text-right font-bold ${sp.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatBRL(sp.totalProfit)}
                        </td>
                        <td className="py-2.5 px-2 text-center text-sky-400">
                          {sp.profitFactor === 99 ? '∞' : sp.profitFactor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
