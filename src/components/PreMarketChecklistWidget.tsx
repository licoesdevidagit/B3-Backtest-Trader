import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Newspaper, 
  Target, 
  Sliders, 
  Brain, 
  Cpu, 
  Plus, 
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const STORAGE_KEY_PREMARKET_PREFIX = 'b3_premarket_checklist_';

export interface PreMarketItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
  iconName: 'newspaper' | 'target' | 'sliders' | 'brain' | 'cpu';
}

export const DEFAULT_PREMARKET_ITEMS: Omit<PreMarketItem, 'checked'>[] = [
  {
    id: 'noticias',
    label: 'Notícias & Calendário Econômico checados',
    description: 'Verificar horários de Payroll, Copom, FED, IPCA ou discursos que causam volatilidade extrema.',
    required: true,
    iconName: 'newspaper',
  },
  {
    id: 'meta-diaria',
    label: 'Meta diária & Limite de Stop definidos',
    description: 'Fixar antecipadamente o ganho almejado e o limite máximo de perda do dia (stop inegociável).',
    required: true,
    iconName: 'target',
  },
  {
    id: 'setup-revisado',
    label: 'Setup operacional revisado & Regras claras',
    description: 'Relembrar gatilhos de entrada, condução pelas médias móveis e alvos técnicos da sua estratégia.',
    required: true,
    iconName: 'sliders',
  },
  {
    id: 'mentalidade',
    label: 'Mentalidade & Controle emocional calibrados',
    description: 'Estar calmo, descansado e pronto para aceitar o risco do mercado sem ansiedade ou pressa.',
    required: false,
    iconName: 'brain',
  },
  {
    id: 'plataforma',
    label: 'Plataforma & Ordens OCO verificadas',
    description: 'Conexão estável com a corretora, gráficos atualizados e ordens de stop automático configuradas.',
    required: false,
    iconName: 'cpu',
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isPreMarketCompleteForDate(dateStr: string): boolean {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREMARKET_PREFIX}${dateStr}`);
    if (!raw) return false;
    const items: PreMarketItem[] = JSON.parse(raw);
    const requiredItems = items.filter((i) => i.required);
    if (requiredItems.length === 0) return true;
    return requiredItems.every((i) => i.checked);
  } catch (e) {
    return false;
  }
}

export function completePreMarketForDate(dateStr: string): void {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREMARKET_PREFIX}${dateStr}`);
    let items: PreMarketItem[];
    if (raw) {
      items = JSON.parse(raw);
    } else {
      items = DEFAULT_PREMARKET_ITEMS.map((item) => ({ ...item, checked: true }));
    }
    const updated = items.map((i) => ({ ...i, checked: true }));
    localStorage.setItem(`${STORAGE_KEY_PREMARKET_PREFIX}${dateStr}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('b3_premarket_updated'));
  } catch (e) {
    // ignore
  }
}

interface PreMarketChecklistWidgetProps {
  onStatusChange?: (isComplete: boolean) => void;
  onOpenNewTrade?: () => void;
}

export const PreMarketChecklistWidget: React.FC<PreMarketChecklistWidgetProps> = ({
  onStatusChange,
  onOpenNewTrade,
}) => {
  const todayStr = getTodayDateString();

  const [items, setItems] = useState<PreMarketItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREMARKET_PREFIX}${todayStr}`);
      if (saved) {
        const parsed: PreMarketItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_PREMARKET_ITEMS.map((item) => ({
      ...item,
      checked: false,
    }));
  });

  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Calculate completeness
  const requiredItems = items.filter((i) => i.required);
  const requiredChecked = requiredItems.filter((i) => i.checked);
  const allRequiredComplete = requiredItems.length > 0 && requiredChecked.length === requiredItems.length;
  const totalChecked = items.filter((i) => i.checked).length;
  const progressPercent = Math.round((totalChecked / items.length) * 100);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREMARKET_PREFIX}${todayStr}`, JSON.stringify(items));
      window.dispatchEvent(new Event('b3_premarket_updated'));
    } catch (e) {
      // ignore
    }
    if (onStatusChange) {
      onStatusChange(allRequiredComplete);
    }
  }, [items, todayStr, allRequiredComplete, onStatusChange]);

  // Listen to external triggers (e.g. 1-click modal approval)
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREMARKET_PREFIX}${todayStr}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('b3_premarket_updated', handleUpdate);
    return () => window.removeEventListener('b3_premarket_updated', handleUpdate);
  }, [todayStr]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleCheckAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  const handleReset = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: PreMarketItem = {
      id: `custom-${Date.now()}`,
      label: newItemText.trim(),
      description: 'Item personalizado adicionado para o pregão de hoje.',
      required: false,
      checked: true,
      iconName: 'sliders',
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'newspaper':
        return <Newspaper className="h-4 w-4 text-amber-400" />;
      case 'target':
        return <Target className="h-4 w-4 text-emerald-400" />;
      case 'sliders':
        return <Sliders className="h-4 w-4 text-sky-400" />;
      case 'brain':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'cpu':
        return <Cpu className="h-4 w-4 text-indigo-400" />;
      default:
        return <CheckSquare className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border shrink-0 transition-colors ${
              allRequiredComplete
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {allRequiredComplete ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Checklist Pré-Market (Obrigatório)
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  allRequiredComplete
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                }`}
              >
                {allRequiredComplete ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Pregão Liberado para Operar</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Pregão Bloqueado para Entradas</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Marque os itens obrigatórios antes de iniciar o registro de operações do dia.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCheckAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Marcar Todos & Liberar</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Resetar checklist para o dia"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Resetar</span>
          </button>
        </div>
      </div>

      {/* Progress & Notice */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <span>Progresso da Preparação:</span>
            <strong className="text-white">
              {totalChecked} de {items.length} itens ({progressPercent}%)
            </strong>
          </span>
          <span
            className={`font-semibold ${
              allRequiredComplete ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {requiredChecked.length} de {requiredItems.length} itens obrigatórios
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              allRequiredComplete ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </div>

        {!allRequiredComplete && (
          <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-0.5 leading-tight">
              <strong className="block text-amber-200">Disciplina Operacional Ativa</strong>
              <span>
                Para proteger seu capital, o registro de trades exige a marcação prévia de{' '}
                <strong>"Notícias checadas"</strong>, <strong>"Meta diária definida"</strong> e{' '}
                <strong>"Setup revisado"</strong>.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Checklist items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => {
          const isChecked = item.checked;

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 cursor-pointer transition-all select-none ${
                isChecked
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 bg-slate-900 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="shrink-0">{getIcon(item.iconName)}</span>
                    <span
                      className={`font-semibold ${
                        isChecked ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.id.startsWith('custom-') && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="text-slate-600 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                  title="Excluir regra"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Item */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        {isAddingItem ? (
          <form onSubmit={handleAddItem} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Ex: Verificar correlação do S&P 500 futuro e DI..."
              className="flex-1 h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="h-8 px-2.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Adicionar Regra Pré-Market</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Salvo para hoje ({todayStr})
            </span>
          </>
        )}
      </div>
    </div>
  );
};
