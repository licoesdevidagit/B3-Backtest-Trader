import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  FileDown, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Trophy, 
  Edit3, 
  ShieldCheck, 
  Lock, 
  Star, 
  Crown, 
  Check, 
  User,
  ExternalLink,
  Palette,
  Layers
} from 'lucide-react';
import { 
  Milestone, 
  FINANCIAL_MILESTONES, 
  getAchievedMilestones, 
  getNextMilestone,
  STORAGE_KEY_CERT_TRADER_NAME 
} from '../utils/milestones';
import { 
  CERTIFICATE_TEMPLATES, 
  CertificateTemplate, 
  STORAGE_KEY_CERT_TEMPLATE_ID, 
  getTemplateById 
} from '../utils/certificateTemplates';
import { exportGoalCertificatePdf } from '../utils/certificatePdf';
import { formatBRL } from '../utils/calculations';
import { DashboardMetrics, Trade } from '../types';

interface GoalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DashboardMetrics;
  trades: Trade[];
  initialMilestone?: Milestone | null;
}

export const GoalCertificateModal: React.FC<GoalCertificateModalProps> = ({
  isOpen,
  onClose,
  metrics,
  trades,
  initialMilestone,
}) => {
  const achievedList = getAchievedMilestones(metrics.totalProfit);
  const nextMilestoneInfo = getNextMilestone(metrics.totalProfit);

  // Default to initialMilestone, or the highest achieved milestone, or the first milestone
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone>(() => {
    if (initialMilestone) return initialMilestone;
    if (achievedList.length > 0) return achievedList[achievedList.length - 1];
    return FINANCIAL_MILESTONES[0];
  });

  // Trader name state with persistence
  const [traderName, setTraderName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CERT_TRADER_NAME);
      return saved || 'Trader Operador B3';
    } catch (e) {
      return 'Trader Operador B3';
    }
  });

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(traderName);
  const [activeTab, setActiveTab] = useState<'certificate' | 'gallery'>('certificate');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Certificate template state (with 12 distinct models)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CERT_TEMPLATE_ID);
      return saved || 'ouro-classico';
    } catch (e) {
      return 'ouro-classico';
    }
  });

  const currentTemplate = getTemplateById(selectedTemplateId);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    try {
      localStorage.setItem(STORAGE_KEY_CERT_TEMPLATE_ID, id);
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    if (initialMilestone) {
      setSelectedMilestone(initialMilestone);
      setActiveTab('certificate');
    } else if (achievedList.length > 0 && !achievedList.some(m => m.id === selectedMilestone.id)) {
      setSelectedMilestone(achievedList[achievedList.length - 1]);
    }
  }, [initialMilestone, isOpen]);

  if (!isOpen) return null;

  const isCurrentMilestoneAchieved = metrics.totalProfit >= selectedMilestone.targetProfit;

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nameInput.trim() || 'Trader Operador B3';
    setTraderName(clean);
    setIsEditingName(false);
    try {
      localStorage.setItem(STORAGE_KEY_CERT_TRADER_NAME, clean);
    } catch (err) {
      // fallback
    }
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      setTimeout(() => {
        exportGoalCertificatePdf({
          milestone: selectedMilestone,
          traderName: traderName.trim() || 'Trader Operador B3',
          totalProfit: metrics.totalProfit,
          totalTrades: metrics.totalTrades,
          winRate: metrics.winRate,
          profitFactor: metrics.profitFactor,
          templateId: selectedTemplateId,
        });

        setIsDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }, 300);
    } catch (err) {
      console.error('Error generating certificate PDF', err);
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden text-slate-100 my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Metas & Certificados de Conquista
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {achievedList.length} de {FINANCIAL_MILESTONES.length} Metas Conquistadas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Emissão oficial de certificados de performance em mini contratos futuros B3.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Certificado vs Galeria */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'certificate'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Certificado Oficial
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas as Metas ({FINANCIAL_MILESTONES.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Milestone Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Meta Selecionada:</span>
              <select
                value={selectedMilestone.id}
                onChange={(e) => {
                  const found = FINANCIAL_MILESTONES.find(m => m.id === e.target.value);
                  if (found) setSelectedMilestone(found);
                  setDownloadSuccess(false);
                }}
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white font-semibold focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {FINANCIAL_MILESTONES.map((m) => {
                  const isAchieved = metrics.totalProfit >= m.targetProfit;
                  return (
                    <option key={m.id} value={m.id}>
                      {isAchieved ? '✓ ' : '🔒 '} {m.title} — {m.rank}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Trader Name Customizer */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Nome no Certificado:</span>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Seu nome"
                    className="rounded-lg bg-slate-900 border border-emerald-500 px-2 py-1 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-300 font-sans">{traderName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(traderName);
                      setIsEditingName(true);
                    }}
                    title="Editar nome exibido no certificado"
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: CERTIFICATE PREVIEW */}
          {activeTab === 'certificate' && (
            <div className="space-y-4">
              {!isCurrentMilestoneAchieved && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Você ainda não atingiu esta meta. Lucro atual: <strong>{formatBRL(metrics.totalProfit)}</strong> / Meta: <strong>{formatBRL(selectedMilestone.targetProfit)}</strong>.
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    Faltam {formatBRL(selectedMilestone.targetProfit - metrics.totalProfit)}
                  </span>
                </div>
              )}

              {/* 12 Certificate Model Options Selector */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
                      <Palette className="h-4 w-4 text-amber-400" />
                      <span>Modelos de Certificados ({CERTIFICATE_TEMPLATES.length} Opções Disponíveis):</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30 font-semibold">
                      Design Ativo: {currentTemplate.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Selecione um dos 12 designs completos com layouts e bordas exclusivas
                  </span>
                </div>

                {/* Templates Grid with Visual Badges & Color Swatches */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                  {CERTIFICATE_TEMPLATES.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                          isSelected
                            ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base group-hover:scale-110 transition-transform">{tmpl.badge}</span>
                          <div
                            className="h-3 w-3 rounded-full border border-white/20 shadow-xs shrink-0"
                            style={{ backgroundColor: tmpl.previewColor }}
                            title={tmpl.name}
                          />
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold line-clamp-1 ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {tmpl.name}
                          </div>
                          <div className="text-[9px] text-slate-400 line-clamp-1">
                            {tmpl.category}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* On-Screen Luxury Certificate Component (Printable) */}
              <div
                id="printable-certificate"
                className={`relative rounded-2xl border-4 ${currentTemplate.containerClasses} p-6 sm:p-10 shadow-2xl text-center space-y-4 overflow-hidden select-none transition-all duration-300`}
                style={currentTemplate.containerStyle}
              >
                {/* Ornate Inner Double Border */}
                <div className={`absolute inset-3 border ${currentTemplate.innerBorderClasses} rounded-xl pointer-events-none`} />
                <div className={`absolute inset-4 border border-dashed ${currentTemplate.dashedBorderClasses} rounded-lg pointer-events-none`} />

                {/* Corner ornaments */}
                <div className={`absolute top-5 left-5 text-xs font-serif opacity-80 ${currentTemplate.cornerClasses}`}>{currentTemplate.cornerIcon}</div>
                <div className={`absolute top-5 right-5 text-xs font-serif opacity-80 ${currentTemplate.cornerClasses}`}>{currentTemplate.cornerIcon}</div>
                <div className={`absolute bottom-5 left-5 text-xs font-serif opacity-80 ${currentTemplate.cornerClasses}`}>{currentTemplate.cornerIcon}</div>
                <div className={`absolute bottom-5 right-5 text-xs font-serif opacity-80 ${currentTemplate.cornerClasses}`}>{currentTemplate.cornerIcon}</div>

                {/* Institutional Header */}
                <div className="space-y-1">
                  <div className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase font-mono ${currentTemplate.headerCategoryClasses}`}>
                    MERCADO FINANCEIRO · B3 S.A. · MINI CONTRATOS FUTUROS (WIN / WDO)
                  </div>
                  <div className={`text-[9px] sm:text-[10px] tracking-wider ${currentTemplate.subHeaderClasses}`}>
                    PROGRAMA DE MÉRITO, GESTÃO DE RISCO E CONSISTÊNCIA OPERACIONAL
                  </div>
                </div>

                {/* Central Seal */}
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full p-0.5 shadow-md ${currentTemplate.sealClasses}`}>
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-lg font-bold">
                    <span className={currentTemplate.sealStarClasses}>{currentTemplate.sealStar}</span>
                  </div>
                </div>

                {/* Main Heading */}
                <div>
                  <h1 className={`text-xl sm:text-3xl font-black tracking-wide ${currentTemplate.titleClasses}`}>
                    CERTIFICADO DE META ALCANÇADA
                  </h1>
                  <p className={`text-xs sm:text-sm mt-1 ${currentTemplate.subHeaderClasses}`}>
                    Certificamos com distinção e honra ao mérito analítico que o(a) trader
                  </p>
                </div>

                {/* Trader Name */}
                <div className="py-1">
                  <span className={`text-2xl sm:text-3xl font-black uppercase tracking-wide border-b-2 pb-1 px-4 inline-block ${currentTemplate.traderNameClasses}`}>
                    {traderName}
                  </span>
                </div>

                {/* Text & Milestone Target Box */}
                <p className={`text-xs sm:text-sm max-w-lg mx-auto ${currentTemplate.textNoticeClasses}`}>
                  atingiu com disciplina operacional e controle estatístico a expressiva meta histórica de:
                </p>

                {/* Milestone Target Box */}
                <div className={`max-w-md mx-auto p-4 rounded-xl border ${currentTemplate.targetBoxClasses}`}>
                  <div className={`text-2xl sm:text-4xl font-black font-mono tracking-tight ${currentTemplate.targetValueClasses}`}>
                    {formatBRL(selectedMilestone.targetProfit)}
                  </div>
                  <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider mt-1 ${currentTemplate.targetRankClasses}`}>
                    {selectedMilestone.rank}
                  </div>
                  <div className={`text-[11px] italic mt-1 ${currentTemplate.targetDescClasses}`}>
                    "{selectedMilestone.description}"
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto pt-2 text-xs font-mono">
                  <div className={`p-2 rounded-lg ${currentTemplate.statBoxClasses}`}>
                    <span className={`text-[10px] block ${currentTemplate.statLabelClasses}`}>Lucro Registrado</span>
                    <strong className={currentTemplate.statValColors.profit}>{formatBRL(metrics.totalProfit)}</strong>
                  </div>
                  <div className={`p-2 rounded-lg ${currentTemplate.statBoxClasses}`}>
                    <span className={`text-[10px] block ${currentTemplate.statLabelClasses}`}>Total de Trades</span>
                    <strong className={currentTemplate.statValColors.trades}>{metrics.totalTrades} ops</strong>
                  </div>
                  <div className={`p-2 rounded-lg ${currentTemplate.statBoxClasses}`}>
                    <span className={`text-[10px] block ${currentTemplate.statLabelClasses}`}>Taxa de Acerto</span>
                    <strong className={currentTemplate.statValColors.winrate}>{metrics.winRate.toFixed(1)}%</strong>
                  </div>
                  <div className={`p-2 rounded-lg ${currentTemplate.statBoxClasses}`}>
                    <span className={`text-[10px] block ${currentTemplate.statLabelClasses}`}>Fator de Lucro</span>
                    <strong className={currentTemplate.statValColors.factor}>
                      {metrics.profitFactor > 0 ? metrics.profitFactor.toFixed(2) : '-'}
                    </strong>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${currentTemplate.footerClasses}`}>
                  <div className="text-left font-mono text-[11px]">
                    <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
                    <div className={`font-bold ${currentTemplate.headerCategoryClasses}`}>Código: {selectedMilestone.code}-{new Date().getFullYear()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold ${currentTemplate.sealClasses}`}>
                      OFICIAL
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className={`w-48 border-b mx-auto sm:ml-auto pb-1 ${currentTemplate.footerLineColor}`} />
                    <span className="font-bold text-xs block pt-1">B3 BACKTEST TRADER</span>
                    <span className="text-[10px] opacity-80">Gestão de Risco &amp; Consistência</span>
                  </div>
                </div>
              </div>

              {/* Success Notification */}
              {downloadSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Certificado oficial em PDF gerado e baixado com sucesso em seu dispositivo!</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MILESTONES GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Progress to next milestone */}
              {nextMilestoneInfo && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-slate-950 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Próxima Meta: {nextMilestoneInfo.milestone.title}</span>
                    </span>
                    <span className="text-emerald-400 font-mono">
                      {nextMilestoneInfo.progressPercent.toFixed(1)}% Concluído
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${nextMilestoneInfo.progressPercent}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Atual: <strong>{formatBRL(metrics.totalProfit)}</strong></span>
                    <span>Faltam: <strong className="text-amber-400">{formatBRL(nextMilestoneInfo.remainingAmount)}</strong></span>
                  </div>
                </div>
              )}

              {/* Grid of all milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FINANCIAL_MILESTONES.map((m) => {
                  const isAchieved = metrics.totalProfit >= m.targetProfit;
                  const isSelected = selectedMilestone.id === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMilestone(m);
                        setActiveTab('certificate');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-slate-900 ring-2 ring-amber-500/30'
                          : isAchieved
                          ? 'border-emerald-500/40 bg-slate-950/70 hover:border-emerald-500 hover:bg-slate-900/50'
                          : 'border-slate-800 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg shrink-0 ${
                            isAchieved
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isAchieved ? m.badge : <Lock className="h-5 w-5 text-slate-500" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">
                              {m.shortTitle}
                            </span>
                            {isAchieved && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Conquistada
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block">{m.rank}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{m.description}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors shrink-0"
                      >
                        Ver
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
            <span>Certificado emitido para: <strong className="text-white">{traderName}</strong></span>
            <span className="text-slate-600">·</span>
            <span>Design: <strong className="text-amber-400">{currentTemplate.name}</strong> ({currentTemplate.badge})</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              <span>{isDownloading ? 'Gerando Certificado...' : 'Baixar Certificado em PDF (A4)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
