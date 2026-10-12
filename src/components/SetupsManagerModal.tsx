import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Sliders, 
  AlertCircle, 
  Check, 
  RotateCcw,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Eye,
  Sparkles,
  Maximize2,
  ArrowDownAZ
} from 'lucide-react';
import { AssetType, Setup } from '../types';
import { INITIAL_SETUPS } from '../utils/calculations';
import { SETUP_CHART_PRESETS } from '../utils/setupChartPresets';
import { SetupImageLightboxModal } from './SetupImageLightboxModal';

interface SetupsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  setups: Setup[];
  onAddSetup: (setup: Omit<Setup, 'id' | 'createdAt'>) => void;
  onUpdateSetup: (setup: Setup) => void;
  onDeleteSetup: (setupId: string) => void;
  onResetSetups: () => void;
  tradeCountBySetup: Record<string, number>;
}

export const SetupsManagerModal: React.FC<SetupsManagerModalProps> = ({
  isOpen,
  onClose,
  setups,
  onAddSetup,
  onUpdateSetup,
  onDeleteSetup,
  onResetSetups,
  tradeCountBySetup,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [preferredAsset, setPreferredAsset] = useState<'WIN' | 'WDO' | 'AMBOS' | 'ACOES' | 'TODOS'>('AMBOS');
  const [defaultGainPts, setDefaultGainPts] = useState<string>('200');
  const [defaultLossPts, setDefaultLossPts] = useState<string>('130');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxSetup, setLightboxSetup] = useState<Setup | null>(null);
  const [sortAlpha, setSortAlpha] = useState<boolean>(true);

  const displaySetups = sortAlpha
    ? [...setups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    : setups;

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPreferredAsset('AMBOS');
    setDefaultGainPts('200');
    setDefaultLossPts('130');
    setDescription('');
    setImageUrl('');
    setUrlInput('');
    setImageError(null);
    setIsDragging(false);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartEdit = (setup: Setup) => {
    setEditingId(setup.id);
    setName(setup.name);
    setPreferredAsset(setup.preferredAsset);
    setDefaultGainPts(setup.defaultGainPts ? String(setup.defaultGainPts) : '');
    setDefaultLossPts(setup.defaultLossPts ? String(setup.defaultLossPts) : '');
    setDescription(setup.description || '');
    setImageUrl(setup.imageUrl || '');
    setUrlInput('');
    setImageError(null);
    setIsCreating(true);
  };

  const processImageFile = (file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError('A imagem é muito grande. Escolha uma imagem de até 4MB para salvar no navegador.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
    };
    reader.onerror = () => {
      setImageError('Erro ao carregar imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setImageUrl(urlInput.trim());
    setUrlInput('');
    setImageError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const gainPts = defaultGainPts ? parseFloat(defaultGainPts) : undefined;
    const lossPts = defaultLossPts ? parseFloat(defaultLossPts) : undefined;
    const cleanImageUrl = imageUrl.trim() || undefined;

    if (editingId) {
      const existing = setups.find(s => s.id === editingId);
      if (existing) {
        onUpdateSetup({
          ...existing,
          name: name.trim(),
          preferredAsset,
          defaultGainPts: gainPts,
          defaultLossPts: lossPts,
          description: description.trim() || undefined,
          imageUrl: cleanImageUrl,
        });
      }
    } else {
      onAddSetup({
        name: name.trim(),
        preferredAsset,
        defaultGainPts: gainPts,
        defaultLossPts: lossPts,
        description: description.trim() || undefined,
        imageUrl: cleanImageUrl,
      });
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    onDeleteSetup(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-800 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Gerenciar Setups Operacionais
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Cadastre ou exclua os setups que você testará no Mini Índice e Dólar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-3.5 sm:px-4.5 py-2.5 border-b border-slate-800/60 bg-slate-950/40 shrink-0 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400">
            <span>Total de Setups: </span>
            <span className="font-semibold text-white font-mono">{setups.length}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Cadastrar Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4.5 space-y-4 overscroll-contain">
          {/* Create or Edit Form */}
          {isCreating && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-emerald-500/30 bg-slate-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {editingId ? 'Editar Setup' : 'Novo Setup'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome do Setup *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: 9.1 Larry Williams, Rompimento de VWAP, Barra Elefante..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ativo Recomendado
                  </label>
                  <select
                    value={preferredAsset}
                    onChange={(e) => setPreferredAsset(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="AMBOS">WIN e WDO</option>
                    <option value="WIN">Mini Índice (WIN)</option>
                    <option value="WDO">Mini Dólar (WDO)</option>
                    <option value="ACOES">Ações B3 (ACOES)</option>
                    <option value="TODOS">Todos os Mercados</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Alvo Médio (pts)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={defaultGainPts}
                      onChange={(e) => setDefaultGainPts(e.target.value)}
                      placeholder="Ex: 200 ou 10"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Stop Médio (pts)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={defaultLossPts}
                      onChange={(e) => setDefaultLossPts(e.target.value)}
                      placeholder="Ex: 130 ou 5"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gatilho / Regras de Entrada
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o gatilho, filtro de médias, tempo gráfico ou regras do setup..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Área de Adicionar Foto do Exemplo Gráfico */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      <span>Foto / Print do Exemplo Gráfico</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Print do Profit, TradingView ou Gráfico B3
                    </span>
                  </div>

                  {imageUrl ? (
                    /* Preview da Foto Cadastrada */
                    <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-950/80 space-y-2.5">
                      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900/90 flex items-center justify-center max-h-52 group">
                        <img
                          src={imageUrl}
                          alt="Exemplo do setup"
                          className="max-h-52 w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLightboxSetup({
                              id: 'preview',
                              name: name || 'Preview do Exemplo',
                              preferredAsset,
                              defaultGainPts: defaultGainPts ? parseFloat(defaultGainPts) : undefined,
                              defaultLossPts: defaultLossPts ? parseFloat(defaultLossPts) : undefined,
                              description,
                              imageUrl,
                              createdAt: '',
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg transition-all"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>Ver Imagem Ampliada</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Foto do exemplo anexada com sucesso</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-[11px]"
                          >
                            Substituir Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setImageError(null);
                            }}
                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors text-[11px]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Área de Upload / Seleção */
                    <div className="space-y-2">
                      {/* Sub-abas de escolha */}
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setImageInputMode('upload')}
                          className={`flex-1 py-1 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
                            imageInputMode === 'upload'
                              ? 'bg-slate-800 text-emerald-400 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Upload do Arquivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('url')}
                          className={`flex-1 py-1 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
                            imageInputMode === 'url'
                              ? 'bg-slate-800 text-emerald-400 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>Link da Imagem</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('presets')}
                          className={`flex-1 py-1 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
                            imageInputMode === 'presets'
                              ? 'bg-slate-800 text-emerald-400 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Padrões Prontos B3</span>
                        </button>
                      </div>

                      {imageInputMode === 'upload' && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            isDragging
                              ? 'border-emerald-500 bg-emerald-500/15 scale-[1.01]'
                              : 'border-slate-700/80 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-slate-900/60'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <div className="p-2.5 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700">
                              <UploadCloud className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-200">
                              Clique para selecionar ou arraste o print do gráfico aqui
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-sm">
                              Capturas de tela do ProfitChart, TradingView, Tryd ou MetaTrader (PNG, JPG, WEBP até 4MB)
                            </p>
                          </div>
                        </div>
                      )}

                      {imageInputMode === 'url' && (
                        <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                          <label className="block text-[11px] font-medium text-slate-300">
                            Cole a URL ou Link direto da imagem:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              placeholder="https://exemplo.com/grafico-setup.png"
                              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleApplyUrl}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
                            >
                              Inserir Foto
                            </button>
                          </div>
                        </div>
                      )}

                      {imageInputMode === 'presets' && (
                        <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                          <p className="text-[11px] text-slate-300">
                            Selecione um gráfico ilustrativo de setup clássico da B3:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SETUP_CHART_PRESETS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setImageUrl(p.svgDataUrl);
                                  setImageError(null);
                                }}
                                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-emerald-500/60 hover:bg-slate-850 transition-all text-left flex flex-col items-center gap-1.5 group cursor-pointer"
                              >
                                <div className="w-full h-14 rounded overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                                  <img
                                    src={p.svgDataUrl}
                                    alt={p.title}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-200 text-center leading-tight">
                                  {p.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {imageError && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{imageError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingId ? 'Salvar Alterações' : 'Salvar Setup'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Setups */}
          {setups.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
              <Sliders className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">Nenhum setup cadastrado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Cadastre seus setups favoritos para começar a registrar e testar sua taxa de acerto.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Cadastrar Primeiro Setup
                </button>
                <button
                  type="button"
                  onClick={onResetSetups}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Carregar Setups Padrão B3
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-slate-400 font-medium">
                  {displaySetups.length} setups operacionais cadastrados:
                </span>
                <button
                  type="button"
                  onClick={() => setSortAlpha((prev) => !prev)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    sortAlpha
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Organizar setups por ordem alfabética (A-Z)"
                >
                  <ArrowDownAZ className="h-3 w-3 text-purple-400" />
                  <span>{sortAlpha ? 'Ordem Alfabética (A-Z)' : 'Ordem de Criação'}</span>
                </button>
              </div>

              {displaySetups.map((s) => {
                const count = tradeCountBySetup[s.id] || 0;
                const isDeletingThis = confirmDeleteId === s.id;

                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Thumbnail if setup has photo */}
                      {s.imageUrl ? (
                        <div
                          onClick={() => setLightboxSetup(s)}
                          className="relative w-14 h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 cursor-pointer group shadow-sm hover:border-emerald-500 transition-all"
                          title="Clique para ver foto de exemplo ampliada"
                        >
                          <img
                            src={s.imageUrl}
                            alt={`Foto de ${s.name}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-emerald-400">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(s)}
                          className="w-14 h-11 rounded-lg border border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-600 hover:text-emerald-400 hover:border-emerald-500/40 shrink-0 cursor-pointer transition-colors"
                          title="Clique para editar e adicionar foto de exemplo"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-[8px] font-medium">+ Foto</span>
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">
                            {s.name}
                          </span>

                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {s.preferredAsset === 'AMBOS'
                              ? 'WIN / WDO'
                              : s.preferredAsset === 'WIN'
                              ? 'Mini Índice'
                              : 'Mini Dólar'}
                          </span>

                          <span className="text-xs text-slate-400">
                            · {count} {count === 1 ? 'trade' : 'trades'}
                          </span>
                        </div>

                        {s.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {s.description}
                          </p>
                        )}

                        {(s.defaultGainPts || s.defaultLossPts) && (
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                            {s.defaultGainPts && (
                              <span className="text-emerald-400">
                                Alvo: +{s.defaultGainPts} pts
                              </span>
                            )}
                            {s.defaultLossPts && (
                              <span className="text-rose-400">
                                Stop: -{s.defaultLossPts} pts
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isDeletingThis ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 p-1.5 rounded-lg">
                          <span className="text-xs text-rose-300 px-1 font-semibold">
                            Confirmar exclusão?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                          >
                            Sim, Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs rounded text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(s)}
                            title="Editar setup"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(s.id)}
                            title="Excluir setup"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Excluir</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetSetups}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar setups padrão B3</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox Modal para visualizar foto ampliada */}
      <SetupImageLightboxModal
        isOpen={!!lightboxSetup}
        onClose={() => setLightboxSetup(null)}
        setup={lightboxSetup}
      />
    </div>
  );
};
