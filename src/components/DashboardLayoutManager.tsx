import React, { useState, useEffect, useMemo } from 'react';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  LayoutGrid, 
  Check, 
  Sparkles,
  Zap,
  Target,
  BarChart3,
  TrendingUp,
  Clock,
  CalendarDays,
  Layers,
  ChevronDown,
  ChevronUp,
  AlignCenter,
  AlignJustify,
  Minus,
  ArrowDownAZ
} from 'lucide-react';

export interface WidgetItem {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface DashboardLayoutManagerProps {
  widgets: WidgetItem[];
  onNavigateToCharts?: () => void;
}

const STORAGE_KEY_ORDER = 'b3_dashboard_widgets_order_v2';
const STORAGE_KEY_VISIBILITY = 'b3_dashboard_widgets_visibility_v2';
const STORAGE_KEY_ALIGNMENT = 'b3_dashboard_toolbar_alignment_v1';

export const DashboardLayoutManager: React.FC<DashboardLayoutManagerProps> = ({
  widgets,
  onNavigateToCharts,
}) => {
  const defaultOrder = useMemoOrder(widgets);

  // Layout alignment: center (centralizado) or justify (grade justificada/balanceada)
  const [alignment, setAlignment] = useState<'center' | 'justify'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALIGNMENT);
      if (saved === 'justify' || saved === 'center') {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'justify'; // Padrão justificado para caber perfeitamente na tela em desktop, tablet e celular
  });

  const handleAlignmentChange = (newAlign: 'center' | 'justify') => {
    setAlignment(newAlign);
    try {
      localStorage.setItem(STORAGE_KEY_ALIGNMENT, newAlign);
    } catch (e) {
      // ignore
    }
  };

  // Widget Order State (stored in localStorage)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all current widgets exist in order
          const existingIds = widgets.map((w) => w.id);
          const filtered = parsed.filter((id) => existingIds.includes(id));
          const missing = existingIds.filter((id) => !filtered.includes(id));
          return [...filtered, ...missing];
        }
      }
    } catch (e) {
      // fallback
    }
    return defaultOrder;
  });

  // Widget Visibility State (stored in localStorage)
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBILITY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    const initial: Record<string, boolean> = {};
    widgets.forEach((w) => {
      initial[w.id] = true;
    });
    return initial;
  });

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState<boolean>(true);
  const [minimizedWindows, setMinimizedWindows] = useState<Record<string, boolean>>({});

  const toggleMinimizeWindow = (id: string) => {
    setMinimizedWindows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Sync missing widgets if widgets prop changes
  useEffect(() => {
    const existingIds = widgets.map((w) => w.id);
    setWidgetOrder((prev) => {
      const filtered = prev.filter((id) => existingIds.includes(id));
      const missing = existingIds.filter((id) => !filtered.includes(id));
      const next = [...filtered, ...missing];
      if (next.length !== prev.length || next.some((id, idx) => id !== prev[idx])) {
        return next;
      }
      return prev;
    });

    setWidgetVisibility((prev) => {
      let changed = false;
      const updated = { ...prev };
      widgets.forEach((w) => {
        if (updated[w.id] === undefined) {
          updated[w.id] = true;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [widgets]);

  // Save order to localStorage
  const saveOrder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(newOrder));
    } catch (e) {
      // ignore
    }
  };

  // Save visibility to localStorage
  const toggleVisibility = (id: string) => {
    setWidgetVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Reset to default layout
  const handleResetLayout = () => {
    const allIds = widgets.map((w) => w.id);
    saveOrder(allIds);
    const allVisible: Record<string, boolean> = {};
    allIds.forEach((id) => {
      allVisible[id] = true;
    });
    setWidgetVisibility(allVisible);
    try {
      localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(allVisible));
    } catch (e) {
      // ignore
    }
  };

  // Show all windows
  const handleShowAll = () => {
    const allVisible: Record<string, boolean> = {};
    widgets.forEach((w) => {
      allVisible[w.id] = true;
    });
    setWidgetVisibility(allVisible);
    try {
      localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(allVisible));
    } catch (e) {
      // ignore
    }
  };

  // Move widget position (+1 or -1)
  const moveWidget = (id: string, delta: number) => {
    const currentIndex = widgetOrder.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;

    const newOrder = [...widgetOrder];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    saveOrder(newOrder);
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag preview
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = widgetOrder.indexOf(draggedId);
    const toIndex = widgetOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...widgetOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      saveOrder(newOrder);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Compute active count
  const activeCount = widgets.filter((w) => widgetVisibility[w.id] !== false).length;

  // Toolbar buttons alphabetical sorting state (default true as requested by user)
  const [toolbarSortAlpha, setToolbarSortAlpha] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('b3_dashboard_widgets_sort_alpha');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true;
  });

  const sortedToolbarWidgets = useMemo(() => {
    if (!toolbarSortAlpha) return widgets;
    return [...widgets].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [widgets, toolbarSortAlpha]);

  const handleSortWindowsAlphabetically = () => {
    const alphaOrder = [...widgets]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((w) => w.id);
    saveOrder(alphaOrder);
  };

  // Render ordered and visible widgets
  const orderedWidgets = widgetOrder
    .map((id) => widgets.find((w) => w.id === id))
    .filter((w): w is WidgetItem => w !== undefined);

  return (
    <div className="space-y-4">
      {/* 1. Barra de Seleção de Janelas (Widget Selector Toolbar) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Barra de Janelas do Dashboard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {activeCount} de {widgets.length} ativas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Selecione quais janelas deseja exibir e organize o painel como preferir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Botão de Ordem Alfabética (A-Z) */}
            <button
              type="button"
              onClick={() => {
                const next = !toolbarSortAlpha;
                setToolbarSortAlpha(next);
                try {
                  localStorage.setItem('b3_dashboard_widgets_sort_alpha', JSON.stringify(next));
                } catch (e) {}
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                toolbarSortAlpha
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Organizar botões das janelas em ordem alfabética (A-Z)"
            >
              <ArrowDownAZ className="h-3 w-3 text-purple-400" />
              <span>Ordem Alfabética (A-Z)</span>
            </button>

            {/* Alignment Selector: Centralizado vs Justificado */}
            <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => handleAlignmentChange('center')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  alignment === 'center'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Centralizar botões das janelas"
              >
                <AlignCenter className="h-3 w-3" />
                <span>Centralizado</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlignmentChange('justify')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  alignment === 'justify'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Justificar botões em grade equilibrada"
              >
                <AlignJustify className="h-3 w-3" />
                <span>Justificado</span>
              </button>
            </div>

            {onNavigateToCharts && (
              <button
                type="button"
                onClick={onNavigateToCharts}
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 hover:text-slate-950 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                title="Acessar campo exclusivo de gráficos analíticos: desempenho por setup, perdas, resultados e metas"
              >
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span>Gráficos Analíticos</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShowAll}
              className="text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors hidden sm:inline-block cursor-pointer"
              title="Exibir todas as janelas"
            >
              Exibir Todas
            </button>
            <button
              type="button"
              onClick={handleResetLayout}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Restaurar posições originais das janelas"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>
            <button
              type="button"
              onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title={isToolbarExpanded ? 'Recolher barra' : 'Expandir barra'}
            >
              {isToolbarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Window Toggle Buttons Grid / Centered layout */}
        {isToolbarExpanded && (
          <div className="pt-2.5 border-t border-slate-800/60 space-y-3">
            {/* Banner Demonstrativo & Acesso Rápido ao Campo Exclusivo de Gráficos Analíticos */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-purple-950/40 border border-emerald-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white tracking-tight">
                      Campo de Gráficos Analíticos & Demonstrativos
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      NOVO ESPAÇO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Gráficos de desempenho por setup, curva de perdas & drawdown, evolução de resultados e tempo até alcançar objetivos.
                  </p>
                </div>
              </div>

              {onNavigateToCharts && (
                <button
                  type="button"
                  onClick={onNavigateToCharts}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md transition-all cursor-pointer shrink-0 font-sans"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Acessar Gráficos Analíticos</span>
                </button>
              )}
            </div>

            {alignment === 'justify' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {sortedToolbarWidgets.map((w) => {
                  const isVisible = widgetVisibility[w.id] !== false;

                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleVisibility(w.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isVisible
                          ? 'bg-slate-800/90 border border-emerald-500/40 text-white shadow-sm ring-1 ring-emerald-500/20 hover:bg-slate-800'
                          : 'bg-slate-950/60 border border-slate-800/80 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <span className={isVisible ? 'text-emerald-400' : 'text-slate-500'}>
                          {w.icon}
                        </span>
                        <span className="truncate font-medium">{w.name}</span>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                          isVisible ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {sortedToolbarWidgets.map((w) => {
                  const isVisible = widgetVisibility[w.id] !== false;

                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleVisibility(w.id)}
                      className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isVisible
                          ? 'bg-slate-800/90 border border-emerald-500/40 text-white shadow-sm ring-1 ring-emerald-500/20 hover:bg-slate-800'
                          : 'bg-slate-950/60 border border-slate-800/80 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className={isVisible ? 'text-emerald-400' : 'text-slate-500'}>
                        {w.icon}
                      </span>
                      <span>{w.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ml-0.5 ${
                          isVisible ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 pt-2 text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center justify-center text-center gap-2 flex-wrap">
              <span className="text-emerald-400 font-bold">⠿ Dica:</span>
              <span>Arraste cada janela pela barra superior ou use as setas [↑] [↓] para reposicionar no seu dashboard.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Draggable Windows Workspace */}
      <div className="space-y-4">
        {orderedWidgets.map((w, index) => {
          const isVisible = widgetVisibility[w.id] !== false;
          if (!isVisible) return null;

          const isFirst = index === 0;
          const isLast = index === orderedWidgets.length - 1;
          const isDragging = draggedId === w.id;
          const isOver = dragOverId === w.id && draggedId !== w.id;

          return (
            <div
              key={w.id}
              onDragOver={(e) => handleDragOver(e, w.id)}
              onDrop={(e) => handleDrop(e, w.id)}
              className={`group/window relative rounded-xl ${
                isDragging
                  ? 'opacity-40 border-dashed border-2 border-emerald-500'
                  : isOver
                  ? 'ring-2 ring-emerald-400 bg-slate-900/40'
                  : ''
              }`}
            >
              {/* Drop Target Guide Indicator */}
              {isOver && (
                <div className="absolute -top-1.5 left-0 right-0 h-1 bg-emerald-400 rounded-full shadow-md shadow-emerald-500/50 z-20 pointer-events-none" />
              )}

              {/* Window Header Handle Bar - Stable, no jittering or shifting */}
              <div className="flex items-center justify-between px-3 py-2 mb-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
                {/* Drag Handle - ONLY this element is draggable */}
                <div
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, w.id)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-white select-none py-0.5 px-2 rounded hover:bg-slate-800 transition-colors"
                  title="Clique e arraste por aqui para reposicionar esta janela"
                >
                  <GripVertical className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    {w.icon}
                    <span>{w.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    (arraste para mover)
                  </span>
                </div>

                {/* Move & Visibility Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget(w.id, -1)}
                    disabled={isFirst}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveWidget(w.id, 1)}
                    disabled={isLast}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3 w-px bg-slate-800 mx-0.5" />

                  {/* Botão Minimizar/Expandir Janela */}
                  <button
                    type="button"
                    onClick={() => toggleMinimizeWindow(w.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={minimizedWindows[w.id] ? "Expandir janela" : "Minimizar janela"}
                  >
                    {minimizedWindows[w.id] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleVisibility(w.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Ocultar esta janela do dashboard"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* The Actual Widget Component - Isolated from drag events (Minimizable) */}
              {!minimizedWindows[w.id] && (
                <div 
                  draggable={false}
                  onDragStart={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {w.component}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state when all windows are hidden */}
        {activeCount === 0 && (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
            <LayoutGrid className="h-8 w-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Todas as janelas do dashboard foram ocultadas</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Utilize a barra de seleção acima para marcar as janelas que você deseja exibir.
            </p>
            <button
              type="button"
              onClick={handleShowAll}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              Exibir Todas as Janelas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function useMemoOrder(widgets: WidgetItem[]): string[] {
  return widgets.map((w) => w.id);
}
