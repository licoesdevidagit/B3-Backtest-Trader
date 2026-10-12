import React, { useState, useEffect, useMemo } from 'react';
import { Setup, Trade, DashboardMetrics, AssetType } from './types';
import { 
  INITIAL_SETUPS, 
  SAMPLE_TRADES, 
  calculateMetrics, 
  calculateSetupsPerformance,
  calculateMonthlySummary,
  calculateSessionPeriods,
  formatDateBR
} from './utils/calculations';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { DailyGoalCard } from './components/DailyGoalCard';
import { EquityChart } from './components/EquityChart';
import { SessionPeriodsChart } from './components/SessionPeriodsChart';
import { MonthlySummary as MonthlySummaryComponent } from './components/MonthlySummary';
import { SetupsBreakdown } from './components/SetupsBreakdown';
import { TradeHistory } from './components/TradeHistory';
import { ReportsView } from './components/ReportsView';
import { DarfTaxView } from './components/DarfTaxView';
import { QuickTradeModal } from './components/QuickTradeModal';
import { SetupsManagerModal } from './components/SetupsManagerModal';
import { SetupImageLightboxModal } from './components/SetupImageLightboxModal';
import { EditTradeModal } from './components/EditTradeModal';
import { DataBackupModal } from './components/DataBackupModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { QuickEntryCard } from './components/QuickEntryCard';
import { MaxDrawdownWidget } from './components/MaxDrawdownWidget';
import { WinningStreakWidget } from './components/WinningStreakWidget';
import { GoalMilestonesWidget } from './components/GoalMilestonesWidget';
import { GoalAchievedAlertModal } from './components/GoalAchievedAlertModal';
import { GoalCertificateModal } from './components/GoalCertificateModal';
import { GoalAchievedToast } from './components/GoalAchievedToast';
import { InitialCapitalModal } from './components/InitialCapitalModal';
import { DashboardLayoutManager, WidgetItem } from './components/DashboardLayoutManager';
import { RiskRewardAnalysisWidget } from './components/RiskRewardAnalysisWidget';
import { MathematicalExpectancyCard } from './components/MathematicalExpectancyCard';
import { TradesScatterPlotWidget } from './components/TradesScatterPlotWidget';
import { PsychologyDashboard } from './components/PsychologyDashboard';
import { PsychologyWidget } from './components/PsychologyWidget';
import { AnalyticsChartsView } from './components/AnalyticsChartsView';
import { RiskAlertsWidget } from './components/RiskAlertsWidget';
import { AcoesDayTradeView } from './components/AcoesDayTradeView';
import { 
  Milestone, 
  FINANCIAL_MILESTONES, 
  getAchievedMilestones, 
  detectNewMilestoneAchieved, 
  markMilestoneAsSeen,
  STORAGE_KEY_CERT_TRADER_NAME 
} from './utils/milestones';
import { STORAGE_KEY_CERT_TEMPLATE_ID } from './utils/certificateTemplates';
import { exportGoalCertificatePdf } from './utils/certificatePdf';
import { Sliders, PlusCircle, BarChart3, ListFilter, TrendingUp, Layers, Trash2, Edit3, RotateCcw, AlertTriangle, Target, Clock, CalendarDays, Zap, ShieldAlert, Flame, Trophy, Image as ImageIcon, Eye, Award, Scale, Calculator, Sparkles, Brain } from 'lucide-react';

const STORAGE_KEY_TRADES = 'b3_backtest_trades_v1';
const STORAGE_KEY_SETUPS = 'b3_backtest_setups_v1';
const STORAGE_KEY_INITIAL_CAPITAL = 'b3_account_initial_capital_v1';

export default function App() {
  // Load Setups
  const [setups, setSetups] = useState<Setup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETUPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored setups lack imageUrl, complement with default presets if available
          return parsed.map((s: Setup) => {
            if (!s.imageUrl) {
              const defaultMatch = INITIAL_SETUPS.find(init => init.id === s.id);
              if (defaultMatch?.imageUrl) {
                return { ...s, imageUrl: defaultMatch.imageUrl };
              }
            }
            return s;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load setups from storage', e);
    }
    return INITIAL_SETUPS;
  });

  // Load Trades
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load trades from storage', e);
    }
    return SAMPLE_TRADES;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'graficos' | 'acoes' | 'mensal' | 'historico' | 'setups' | 'relatorios' | 'darf' | 'psicologia'>('dashboard');

  // Initial Capital (Account starting balance)
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INITIAL_CAPITAL);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
      const ddSaved = localStorage.getItem('b3_drawdown_initial_capital_v1');
      if (ddSaved) {
        const parsed = parseFloat(ddSaved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load initial capital', e);
    }
    return 1000; // Default R$ 1.000 (ex: 1 mil de investimento inicial)
  });

  const handleUpdateInitialCapital = (newVal: number) => {
    const clamped = Math.max(0, newVal);
    setInitialCapital(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_CAPITAL, String(clamped));
      localStorage.setItem('b3_drawdown_initial_capital_v1', String(clamped));
    } catch (e) {
      console.error('Failed to save initial capital', e);
    }
  };

  // Modals state
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState<boolean>(false);
  const [newTradeInitialData, setNewTradeInitialData] = useState<Partial<Trade> | undefined>(undefined);
  const [isSetupsModalOpen, setIsSetupsModalOpen] = useState<boolean>(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isInitialCapitalModalOpen, setIsInitialCapitalModalOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [lightboxSetup, setLightboxSetup] = useState<Setup | null>(null);

  // Goal Milestones & Certificates state
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [selectedCertificateMilestone, setSelectedCertificateMilestone] = useState<Milestone | null>(null);
  const [achievedAlertMilestone, setAchievedAlertMilestone] = useState<Milestone | null>(null);
  const [toastMilestone, setToastMilestone] = useState<Milestone | null>(null);

  // Filter pass-through (when clicking setup, month or asset to view its trades in history)
  const [initialHistoryAssetFilter, setInitialHistoryAssetFilter] = useState<'ALL' | AssetType>('ALL');
  const [initialHistoryYearFilter, setInitialHistoryYearFilter] = useState<string>('ALL');
  const [initialHistorySetupFilter, setInitialHistorySetupFilter] = useState<string>('ALL');
  const [initialHistoryMonthFilter, setInitialHistoryMonthFilter] = useState<string>('ALL');
  const [initialHistorySearch, setInitialHistorySearch] = useState<string>('');
  const [confirmDeleteSetupCardId, setConfirmDeleteSetupCardId] = useState<string | null>(null);

  // Setups excluded from operational comparative analysis (stored in localStorage)
  const [excludedSetupIds, setExcludedSetupIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('b3_excluded_setup_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const handleToggleExcludeSetup = (setupId: string) => {
    setExcludedSetupIds((prev) => {
      const next = prev.includes(setupId) ? prev.filter((id) => id !== setupId) : [...prev, setupId];
      try {
        localStorage.setItem('b3_excluded_setup_ids', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetExcludedSetups = () => {
    setExcludedSetupIds([]);
    try {
      localStorage.removeItem('b3_excluded_setup_ids');
    } catch (e) {}
  };

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(setups));
    } catch (e) {
      console.error('Failed to save setups', e);
    }
  }, [setups]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save trades', e);
    }
  }, [trades]);

  // Derived metrics (Global)
  const metrics: DashboardMetrics = useMemo(() => calculateMetrics(trades), [trades]);
  const setupsPerformance = useMemo(() => calculateSetupsPerformance(trades, setups), [trades, setups]);
  const monthlySummary = useMemo(() => calculateMonthlySummary(trades), [trades]);
  const sessionPeriods = useMemo(() => calculateSessionPeriods(trades), [trades]);

  // Milestone Achievement Automatic Alert Hook
  useEffect(() => {
    if (trades.length > 0 && metrics.totalProfit > 0) {
      const newlyHit = detectNewMilestoneAchieved(metrics.totalProfit);
      if (newlyHit) {
        setAchievedAlertMilestone(newlyHit);
        setToastMilestone(newlyHit);
      }
    }
  }, [trades, metrics.totalProfit]);

  const handleCloseMilestoneAlert = () => {
    if (achievedAlertMilestone) {
      markMilestoneAsSeen(achievedAlertMilestone.id);
    }
    setAchievedAlertMilestone(null);
  };

  const handleOpenCertificate = (milestone?: Milestone) => {
    if (milestone) {
      setSelectedCertificateMilestone(milestone);
    } else {
      const achieved = getAchievedMilestones(metrics.totalProfit);
      setSelectedCertificateMilestone(achieved.length > 0 ? achieved[achieved.length - 1] : FINANCIAL_MILESTONES[0]);
    }
    setIsCertificateModalOpen(true);
  };

  const handleDownloadPdfDirect = (milestone: Milestone) => {
    try {
      const savedTrader = localStorage.getItem(STORAGE_KEY_CERT_TRADER_NAME) || 'Trader Operador B3';
      const savedTemplate = localStorage.getItem(STORAGE_KEY_CERT_TEMPLATE_ID) || 'ouro-classico';
      exportGoalCertificatePdf({
        milestone,
        traderName: savedTrader,
        totalProfit: metrics.totalProfit,
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        templateId: savedTemplate,
      });
    } catch (err) {
      console.error('Failed to export PDF certificate', err);
    }
  };

  const handleSimulateMilestoneAlert = () => {
    const achieved = getAchievedMilestones(metrics.totalProfit);
    const m = achieved.length > 0 ? achieved[achieved.length - 1] : FINANCIAL_MILESTONES[0];
    setAchievedAlertMilestone(m);
    setToastMilestone(m);
  };

  // Trade count map by setup
  const tradeCountBySetup = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trades) {
      map[t.setupId] = (map[t.setupId] || 0) + 1;
    }
    return map;
  }, [trades]);

  // Handlers for Trades
  const handleAddTrade = (newTradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...newTradeData,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setTrades((prev) => [newTrade, ...prev]);
  };

  const handleUpdateTrade = (updated: Trade) => {
    setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTrade(null);
  };

  const handleDeleteTrade = (tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));
  };

  // Handlers for Setups
  const handleAddSetup = (newSetupData: Omit<Setup, 'id' | 'createdAt'>) => {
    const newSetup: Setup = {
      ...newSetupData,
      id: `setup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSetups((prev) => [...prev, newSetup]);
  };

  const handleUpdateSetup = (updated: Setup) => {
    setSetups((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    // Also sync names in existing trades if they changed
    setTrades((prev) =>
      prev.map((t) => (t.setupId === updated.id ? { ...t, setupName: updated.name } : t))
    );
  };

  const handleDeleteSetup = (setupId: string) => {
    const setupToDelete = setups.find((s) => s.id === setupId);
    setSetups((prev) => prev.filter((s) => s.id !== setupId));
    if (setupToDelete) {
      setTrades((prev) =>
        prev.map((t) =>
          t.setupId === setupId
            ? { ...t, setupName: `${setupToDelete.name} (Excluído)` }
            : t
        )
      );
    }
  };

  const handleResetSetups = () => {
    setSetups(INITIAL_SETUPS);
  };

  const handleResetSampleData = () => {
    setSetups(INITIAL_SETUPS);
    setTrades(SAMPLE_TRADES);
  };

  const handleClearAllTrades = () => {
    setTrades([]);
  };

  const handleImportData = (data: { trades: Trade[]; setups?: Setup[] }) => {
    if (data.setups && Array.isArray(data.setups) && data.setups.length > 0) {
      setSetups(data.setups);
    }
    setTrades(data.trades);
  };

  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'Data',
      'Hora',
      'Ativo',
      'Direcao',
      'Setup',
      'Contratos',
      'Resultado',
      'Pontos',
      'Financeiro_BRL',
      'Observacoes',
    ];

    const rows = trades.map((t) => [
      `"${formatDateBR(t.date)}"`,
      `"${t.time || ''}"`,
      `"${t.asset}"`,
      `"${t.direction}"`,
      `"${(t.setupName || '').replace(/"/g, '""')}"`,
      t.contracts,
      `"${t.result}"`,
      t.points,
      t.financialValue.toFixed(2).replace('.', ','),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_b3_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterBySetup = (setupId: string) => {
    setInitialHistorySetupFilter(setupId);
    setInitialHistorySearch('');
    setActiveTab('historico');
  };

  const handleFilterByMonth = (monthKey: string) => {
    if (monthKey && monthKey !== 'ALL') {
      const [yearPart] = monthKey.split('-');
      if (yearPart) {
        setInitialHistoryYearFilter(yearPart);
      }
    }
    setInitialHistoryMonthFilter(monthKey);
    setInitialHistorySearch('');
    setActiveTab('historico');
  };

  const handleFilterByDate = (dateStr: string) => {
    setInitialHistorySearch(dateStr);
    setInitialHistoryMonthFilter('ALL');
    setInitialHistorySetupFilter('ALL');
    setActiveTab('historico');
  };

  // Modular Dashboard Windows list for Drag-and-Drop and Visibility Customization
  const dashboardWidgets: WidgetItem[] = useMemo(() => {
    const list: WidgetItem[] = [
      {
        id: 'quickEntry',
        name: 'Registro Rápido de Trade',
        shortName: 'Registro Rápido',
        icon: <Zap className="h-3.5 w-3.5" />,
        component: (
          <QuickEntryCard
            setups={setups}
            onSaveTrade={handleAddTrade}
            onOpenDetailedModal={() => setIsNewTradeModalOpen(true)}
            onOpenSetups={() => setIsSetupsModalOpen(true)}
          />
        ),
      },
      {
        id: 'dailyGoal',
        name: 'Meta Financeira Diária',
        shortName: 'Meta Diária',
        icon: <Target className="h-3.5 w-3.5" />,
        component: (
          <DailyGoalCard 
            trades={trades} 
            onOpenCertificates={() => handleOpenCertificate()}
          />
        ),
      },
      {
        id: 'riskAlerts',
        name: 'Alertas de Gerenciamento de Risco (Preservação de Capital)',
        shortName: 'Alertas de Risco & Stop',
        icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />,
        component: (
          <RiskAlertsWidget 
            trades={trades} 
            initialCapital={initialCapital}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
            onNavigateToCharts={() => setActiveTab('graficos')}
          />
        ),
      },
      {
        id: 'psychologyWidget',
        name: 'Psicologia & Disciplina do Trader',
        shortName: 'Psicologia & Disciplina',
        icon: <Brain className="h-3.5 w-3.5 text-purple-400" />,
        component: (
          <PsychologyWidget 
            trades={trades} 
            onOpenFullPsychology={() => setActiveTab('psicologia')}
          />
        ),
      },
      {
        id: 'goalMilestones',
        name: 'Metas & Certificados de Conquista',
        shortName: 'Metas & Certificados',
        icon: <Trophy className="h-3.5 w-3.5 text-amber-400" />,
        component: (
          <GoalMilestonesWidget
            metrics={metrics}
            onOpenCertificateModal={handleOpenCertificate}
            onDownloadPdfDirect={handleDownloadPdfDirect}
            onSimulateMilestoneAlert={handleSimulateMilestoneAlert}
          />
        ),
      },
      {
        id: 'metrics',
        name: 'Métricas de Performance',
        shortName: 'Métricas Gerais',
        icon: <BarChart3 className="h-3.5 w-3.5" />,
        component: (
          <DashboardStats
            metrics={metrics}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
            initialCapital={initialCapital}
            onUpdateInitialCapital={handleUpdateInitialCapital}
            onOpenInitialCapitalModal={() => setIsInitialCapitalModalOpen(true)}
          />
        ),
      },
      {
        id: 'mathematicalExpectancy',
        name: 'Expectativa Matemática (EM)',
        shortName: 'Expectativa Matemática',
        icon: <Calculator className="h-3.5 w-3.5 text-indigo-400" />,
        component: (
          <MathematicalExpectancyCard
            metrics={metrics}
            trades={trades}
            setups={setups}
            onFilterBySetup={handleFilterBySetup}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
          />
        ),
      },
    ];

    if (trades.length >= 2) {
      list.push({
        id: 'equityChart',
        name: 'Curva de Patrimônio / Capital',
        shortName: 'Curva de Capital',
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        component: (
          <EquityChart 
            trades={trades} 
            initialCapital={initialCapital}
            onUpdateInitialCapital={handleUpdateInitialCapital}
          />
        ),
      });
    }

    list.push({
      id: 'maxDrawdown',
      name: 'Max Drawdown & Risco da Conta',
      shortName: 'Max Drawdown',
      icon: <ShieldAlert className="h-3.5 w-3.5" />,
      component: (
        <MaxDrawdownWidget 
          trades={trades} 
          initialCapital={initialCapital}
          onUpdateInitialCapital={handleUpdateInitialCapital}
        />
      ),
    });

    list.push({
      id: 'winningStreak',
      name: 'Winning Streak (Sequência de Vitórias)',
      shortName: 'Winning Streak',
      icon: <Flame className="h-3.5 w-3.5 text-amber-400" />,
      component: <WinningStreakWidget trades={trades} />,
    });

    list.push(
      {
        id: 'sessionPeriods',
        name: 'Melhores Horários (Sessão B3)',
        shortName: 'Melhores Horários',
        icon: <Clock className="h-3.5 w-3.5" />,
        component: <SessionPeriodsChart periods={sessionPeriods} />,
      },
      {
        id: 'monthlySummary',
        name: 'Resumo Mensal & Simulador',
        shortName: 'Resumo Mensal',
        icon: <CalendarDays className="h-3.5 w-3.5" />,
        component: (
          <MonthlySummaryComponent
            monthlyData={monthlySummary}
            trades={trades}
            setups={setups}
            onFilterByMonth={handleFilterByMonth}
          />
        ),
      },
      {
        id: 'setupsBreakdown',
        name: 'Desempenho por Setup',
        shortName: 'Setups',
        icon: <Layers className="h-3.5 w-3.5" />,
        component: (
          <SetupsBreakdown
            stats={setupsPerformance}
            setups={setups}
            onOpenNewSetup={() => setIsSetupsModalOpen(true)}
            onFilterBySetup={handleFilterBySetup}
            onDeleteSetup={handleDeleteSetup}
            excludedSetupIds={excludedSetupIds}
            onToggleExcludeSetup={handleToggleExcludeSetup}
            onResetExcludedSetups={handleResetExcludedSetups}
          />
        ),
      },
      {
        id: 'riskRewardAnalysis',
        name: 'Análise de Risco por Trade',
        shortName: 'Risco vs Retorno',
        icon: <Scale className="h-3.5 w-3.5 text-emerald-400" />,
        component: (
          <RiskRewardAnalysisWidget
            trades={trades}
            setups={setups}
            onFilterBySetup={handleFilterBySetup}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
          />
        ),
      },
      {
        id: 'tradesScatterPlot',
        name: 'Dispersão Ganho x Perda (Assimetria)',
        shortName: 'Dispersão de Assimetria',
        icon: <Sparkles className="h-3.5 w-3.5 text-emerald-400" />,
        component: (
          <TradesScatterPlotWidget
            trades={trades}
            setups={setups}
            onFilterBySetup={handleFilterBySetup}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
          />
        ),
      }
    );

    return list;
  }, [
    setups,
    handleAddTrade,
    trades,
    metrics,
    sessionPeriods,
    monthlySummary,
    handleFilterByMonth,
    setupsPerformance,
    handleFilterBySetup,
    handleDeleteSetup,
    initialCapital,
    excludedSetupIds,
    handleToggleExcludeSetup,
    handleResetExcludedSetups,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
        onOpenSetups={() => setIsSetupsModalOpen(true)}
        onOpenDataBackup={() => setIsDataBackupOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
        onOpenCertificates={() => handleOpenCertificate()}
        onOpenInitialCapital={() => setIsInitialCapitalModalOpen(true)}
        initialCapital={initialCapital}
        achievedGoalsCount={getAchievedMilestones(metrics.totalProfit).length}
        totalTrades={trades.length}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-2.5 sm:px-4 md:px-6 py-3 sm:py-5 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Quick inline 1-click trade entry card (for non-dashboard tabs) */}
        {activeTab !== 'dashboard' && activeTab !== 'graficos' && activeTab !== 'darf' && activeTab !== 'psicologia' && (
          <QuickEntryCard
            setups={setups}
            onSaveTrade={handleAddTrade}
            onOpenDetailedModal={() => setIsNewTradeModalOpen(true)}
            onOpenSetups={() => setIsSetupsModalOpen(true)}
          />
        )}

        {/* Tab 1: Dashboard with Modular Draggable Windows & Selection Toolbar */}
        {activeTab === 'dashboard' && (
          <DashboardLayoutManager 
            widgets={dashboardWidgets} 
            onNavigateToCharts={() => setActiveTab('graficos')}
          />
        )}

        {/* Tab Gráficos: Campo Exclusivo de Gráficos Analíticos & Demonstrativos */}
        {activeTab === 'graficos' && (
          <AnalyticsChartsView
            trades={trades}
            setups={setups}
            initialCapital={initialCapital}
            onFilterBySetup={handleFilterBySetup}
            onOpenNewTrade={() => {
              setNewTradeInitialData(undefined);
              setIsNewTradeModalOpen(true);
            }}
          />
        )}

        {/* Tab Ações: Módulo Completo de Day Trade em Ações da B3 */}
        {activeTab === 'acoes' && (
          <AcoesDayTradeView
            trades={trades}
            setups={setups}
            onOpenNewTrade={(initialData) => {
              setNewTradeInitialData(initialData || { asset: 'ACOES', ticker: 'PETR4', quantity: 200 });
              setIsNewTradeModalOpen(true);
            }}
            onEditTrade={(t) => setEditingTrade(t)}
            onNavigateToHistory={(ticker) => {
              setInitialHistoryAssetFilter('ACOES');
              if (ticker) setInitialHistorySearch(ticker);
              setActiveTab('historico');
            }}
          />
        )}

        {/* Tab 2: Resumo Mensal Dedicado */}
        {activeTab === 'mensal' && (
          <div className="space-y-6">
            <MonthlySummaryComponent
              monthlyData={monthlySummary}
              trades={trades}
              setups={setups}
              onFilterByMonth={handleFilterByMonth}
            />
          </div>
        )}

        {/* Tab 3: Detailed Trade History */}
        {activeTab === 'historico' && (
          <TradeHistory
            trades={trades}
            setups={setups}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
            onEditTrade={(t) => setEditingTrade(t)}
            onDeleteTrade={handleDeleteTrade}
            onExportCSV={handleExportCSV}
            initialAssetFilter={initialHistoryAssetFilter}
            initialYearFilter={initialHistoryYearFilter}
            initialMonthFilter={initialHistoryMonthFilter}
            initialSetupFilter={initialHistorySetupFilter}
            initialSearchQuery={initialHistorySearch}
          />
        )}

        {/* Tab 3: Setups Direct Management Tab */}
        {activeTab === 'setups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  <span>Gerenciamento de Setups Operacionais</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadastre novos setups ou exclua os que não deseja mais utilizar.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetSetups}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restaurar Padrões</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSetupsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Cadastrar Setup</span>
                </button>
              </div>
            </div>

            {/* Setups Breakdown Table with direct Excluir action column */}
            <SetupsBreakdown
              stats={setupsPerformance}
              setups={setups}
              onOpenNewSetup={() => setIsSetupsModalOpen(true)}
              onFilterBySetup={handleFilterBySetup}
              onDeleteSetup={handleDeleteSetup}
              excludedSetupIds={excludedSetupIds}
              onToggleExcludeSetup={handleToggleExcludeSetup}
              onResetExcludedSetups={handleResetExcludedSetups}
            />

            {/* Widget de Análise de Risco por Trade & Eficiência de Setups */}
            <RiskRewardAnalysisWidget
              trades={trades}
              setups={setups}
              onFilterBySetup={handleFilterBySetup}
              onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
            />

            {/* Novo Gráfico de Dispersão: Ganho x Perda por Trade (Assimetria dos Setups) */}
            <TradesScatterPlotWidget
              trades={trades}
              setups={setups}
              onFilterBySetup={handleFilterBySetup}
              onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
            />

            {/* Setups Direct Cards Grid with prominent Excluir and Editar buttons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cartões de Setups Cadastrados ({setups.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Clique em "Excluir" em qualquer setup para removê-lo
                </span>
              </div>

              {setups.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
                  <Sliders className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">Nenhum setup cadastrado no momento</p>
                  <p className="text-xs text-slate-400 mt-1">Todos os setups foram excluídos.</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSetupsModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                    >
                      Cadastrar Novo Setup
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSetups}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      Restaurar Setups da B3
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {setups.map((s) => {
                    const count = tradeCountBySetup[s.id] || 0;
                    const isConfirmingDelete = confirmDeleteSetupCardId === s.id;

                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all overflow-hidden"
                      >
                        {/* Setup Photo Preview or Add Photo Banner */}
                        {s.imageUrl ? (
                          <div
                            onClick={() => setLightboxSetup(s)}
                            className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 group cursor-pointer shadow-inner"
                            title="Clique para ver o print do setup ampliado"
                          >
                            <img
                              src={s.imageUrl}
                              alt={`Exemplo gráfico de ${s.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2 justify-between">
                              <span className="text-[10px] font-medium text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                <Eye className="h-3 w-3" />
                                Ver Exemplo
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSetupsModalOpen(true)}
                            className="w-full h-16 rounded-lg border border-dashed border-slate-800 hover:border-emerald-500/40 bg-slate-950/40 hover:bg-slate-900/60 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Adicionar foto de exemplo deste setup"
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span>+ Adicionar foto do exemplo</span>
                          </button>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white tracking-tight">{s.name}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {s.preferredAsset === 'AMBOS'
                                ? 'WIN / WDO'
                                : s.preferredAsset === 'WIN'
                                ? 'Mini Índice'
                                : 'Mini Dólar'}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {s.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Alvo: {s.defaultGainPts ? `+${s.defaultGainPts} pts` : '-'}</span>
                          <span>Stop: {s.defaultLossPts ? `-${s.defaultLossPts} pts` : '-'}</span>
                          <span className="text-emerald-400 font-semibold">{count} {count === 1 ? 'trade' : 'trades'}</span>
                        </div>

                        {/* Card Action Buttons with direct EXCLUIR SETUP option */}
                        <div className="pt-2 border-t border-slate-800/80">
                          {isConfirmingDelete ? (
                            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 space-y-2">
                              <span className="text-xs font-bold text-rose-300 block">
                                Excluir "{s.name}"?
                              </span>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSetupCardId(null)}
                                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteSetup(s.id);
                                    setConfirmDeleteSetupCardId(null);
                                  }}
                                  className="px-3 py-1 text-xs font-bold rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                  Sim, Excluir
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleFilterBySetup(s.id)}
                                className="text-xs text-slate-400 hover:text-emerald-400 font-medium hover:underline"
                              >
                                Ver Trades ({count})
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setIsSetupsModalOpen(true)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSetupCardId(s.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded border border-rose-500/30 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Reports / Relatórios */}
        {activeTab === 'relatorios' && (
          <ReportsView
            trades={trades}
            setups={setups}
            monthlyData={monthlySummary}
            onFilterByDate={handleFilterByDate}
            onFilterBySetup={handleFilterBySetup}
          />
        )}

        {/* Tab 6: Imposto de Renda / DARF Day Trade & Calendário de DARF */}
        {activeTab === 'darf' && (
          <DarfTaxView trades={trades} />
        )}

        {/* Tab 7: Psicologia e Disciplina do Trader */}
        {activeTab === 'psicologia' && (
          <PsychologyDashboard
            trades={trades}
            onOpenEditTrade={(t) => setEditingTrade(t)}
            onOpenNewTrade={() => setIsNewTradeModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <QuickTradeModal
        isOpen={isNewTradeModalOpen}
        onClose={() => {
          setIsNewTradeModalOpen(false);
          setNewTradeInitialData(undefined);
        }}
        setups={setups}
        initialTradeData={newTradeInitialData}
        onSaveTrade={handleAddTrade}
        onOpenNewSetup={() => {
          setIsNewTradeModalOpen(false);
          setIsSetupsModalOpen(true);
        }}
        onOpenManageSetups={() => {
          setIsNewTradeModalOpen(false);
          setIsSetupsModalOpen(true);
        }}
      />

      <SetupsManagerModal
        isOpen={isSetupsModalOpen}
        onClose={() => setIsSetupsModalOpen(false)}
        setups={setups}
        onAddSetup={handleAddSetup}
        onUpdateSetup={handleUpdateSetup}
        onDeleteSetup={handleDeleteSetup}
        onResetSetups={handleResetSetups}
        tradeCountBySetup={tradeCountBySetup}
      />

      <EditTradeModal
        isOpen={editingTrade !== null}
        onClose={() => setEditingTrade(null)}
        trade={editingTrade}
        setups={setups}
        onUpdateTrade={handleUpdateTrade}
      />

      <DataBackupModal
        isOpen={isDataBackupOpen}
        onClose={() => setIsDataBackupOpen(false)}
        trades={trades}
        setups={setups}
        onImportData={handleImportData}
        onResetSampleData={handleResetSampleData}
        onClearAllTrades={handleClearAllTrades}
        onExportCSV={handleExportCSV}
      />

      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Setup Image Lightbox Modal */}
      <SetupImageLightboxModal
        isOpen={!!lightboxSetup}
        onClose={() => setLightboxSetup(null)}
        setup={lightboxSetup}
      />

      {/* Goal Achieved Screen Alert Modal */}
      <GoalAchievedAlertModal
        isOpen={!!achievedAlertMilestone}
        onClose={handleCloseMilestoneAlert}
        milestone={achievedAlertMilestone}
        currentProfit={metrics.totalProfit}
        onOpenCertificate={(m) => {
          handleCloseMilestoneAlert();
          handleOpenCertificate(m);
        }}
        onDownloadPdfDirect={handleDownloadPdfDirect}
      />

      {/* Official Goal Certificate Modal */}
      <GoalCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        metrics={metrics}
        trades={trades}
        initialMilestone={selectedCertificateMilestone}
      />

      {/* Floating Screen Toast Notification when Goal is Reached */}
      <GoalAchievedToast
        milestone={toastMilestone}
        onOpenCertificate={(m) => {
          setToastMilestone(null);
          handleOpenCertificate(m);
        }}
        onDismiss={() => setToastMilestone(null)}
      />

      {/* Janela de Capital Inicial */}
      <InitialCapitalModal
        isOpen={isInitialCapitalModalOpen}
        onClose={() => setIsInitialCapitalModalOpen(false)}
        initialCapital={initialCapital}
        onUpdateInitialCapital={handleUpdateInitialCapital}
        totalProfit={metrics.totalProfit}
        totalTrades={trades.length}
        trades={trades}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400 font-mono">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>B3 Backtest Trader · Mini Índice (WIN: R$ 0,20/pt) & Mini Dólar (WDO: R$ 10,00/pt)</span>
          <span className="text-slate-400">Armazenamento local seguro · Exportação CSV e JSON</span>
        </div>
      </footer>
    </div>
  );
}
