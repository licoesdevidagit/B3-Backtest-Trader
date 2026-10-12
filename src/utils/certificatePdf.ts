import jsPDF from 'jspdf';
import { Milestone } from './milestones';
import { formatBRL } from './calculations';
import { getTemplateById } from './certificateTemplates';
import { DashboardMetrics, Trade } from '../types';

export interface CertificateData {
  milestone: Milestone;
  traderName: string;
  totalProfit: number;
  totalTrades: number;
  winRate: number;
  profitFactor?: number;
  dateStr?: string;
  templateId?: string;
}

/**
 * Generates and downloads a prestigious landscape A4 PDF Certificate for an achieved trading goal.
 */
export function exportGoalCertificatePdf(data: CertificateData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const centerX = pageWidth / 2;

  const trader = (data.traderName || 'Trader Operador B3').trim();
  const dateFormatted = data.dateStr || new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const template = getTemplateById(data.templateId || 'ouro-classico');
  const cfg = template.pdfConfig;

  // Typographic font family selection for PDF based on certificate model
  const fontPrimary = template.layoutType === 'cyber-terminal' || template.layoutType === 'minimalist-swiss'
    ? 'courier'
    : template.layoutType === 'antique-manuscript' || template.layoutType === 'heraldic-crest' || template.layoutType === 'executive-modern'
    ? 'times'
    : 'helvetica';

  // Unique certificate code
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const certCode = `${data.milestone.code}-${new Date().getFullYear()}-${randomHex}`;

  // ==========================================
  // 1. BACKGROUND & ORNATE BORDERS
  // ==========================================
  // Solid luxury background
  doc.setFillColor(cfg.bgFill[0], cfg.bgFill[1], cfg.bgFill[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Subtle interior gradient tint
  doc.setFillColor(cfg.innerFill[0], cfg.innerFill[1], cfg.innerFill[2]);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 4, 4, 'F');

  // Outer Border
  doc.setDrawColor(cfg.outerBorder[0], cfg.outerBorder[1], cfg.outerBorder[2]);
  doc.setLineWidth(1.8);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'D');

  // Inner Thin Border
  doc.setDrawColor(cfg.innerBorder[0], cfg.innerBorder[1], cfg.innerBorder[2]);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'D');

  // Dashed accent border
  doc.setDrawColor(cfg.innerBorder[0], cfg.innerBorder[1], cfg.innerBorder[2]);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.rect(17, 17, pageWidth - 34, pageHeight - 34, 'D');
  doc.setLineDashPattern([], 0); // reset

  // Corner decorative flourishes
  const drawCornerFlourish = (x: number, y: number, dirX: number, dirY: number) => {
    doc.setDrawColor(cfg.outerBorder[0], cfg.outerBorder[1], cfg.outerBorder[2]);
    doc.setLineWidth(0.8);
    doc.line(x, y, x + dirX * 12, y);
    doc.line(x, y, x, y + dirY * 12);
    doc.setFillColor(cfg.outerBorder[0], cfg.outerBorder[1], cfg.outerBorder[2]);
    doc.circle(x + dirX * 3, y + dirY * 3, 1, 'F');
  };

  drawCornerFlourish(19, 19, 1, 1);
  drawCornerFlourish(pageWidth - 19, 19, -1, 1);
  drawCornerFlourish(19, pageHeight - 19, 1, -1);
  drawCornerFlourish(pageWidth - 19, pageHeight - 19, -1, -1);

  // ==========================================
  // 2. HEADER: LOGO / BANNER
  // ==========================================
  let currentY = 28;

  // Institutional header
  doc.setFont(fontPrimary, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cfg.headerText[0], cfg.headerText[1], cfg.headerText[2]);
  doc.text('MERCADO FINANCEIRO · B3 S.A. · MINI CONTRATOS FUTUROS (WIN / WDO)', centerX, currentY, { align: 'center' });

  currentY += 6;
  doc.setFontSize(7.5);
  doc.setFont(fontPrimary, 'normal');
  doc.setTextColor(cfg.subHeaderText[0], cfg.subHeaderText[1], cfg.subHeaderText[2]);
  doc.text('PROGRAMA DE MÉRITO, GESTÃO DE RISCO E CONSISTÊNCIA OPERACIONAL', centerX, currentY, { align: 'center' });

  // Central Seal Emblem
  currentY += 12;
  doc.setFillColor(cfg.sealOuter[0], cfg.sealOuter[1], cfg.sealOuter[2]);
  doc.circle(centerX, currentY, 6, 'F');
  doc.setFillColor(cfg.sealInner[0], cfg.sealInner[1], cfg.sealInner[2]);
  doc.circle(centerX, currentY, 4.8, 'F');
  doc.setFont(fontPrimary, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cfg.sealText[0], cfg.sealText[1], cfg.sealText[2]);
  doc.text('★', centerX, currentY + 3.2, { align: 'center' });

  // Main Certificate Title
  currentY += 12;
  doc.setFont(fontPrimary, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(cfg.titleText[0], cfg.titleText[1], cfg.titleText[2]);
  doc.text('CERTIFICADO DE META ALCANÇADA', centerX, currentY, { align: 'center' });

  // Subtitle
  currentY += 6;
  doc.setFont(fontPrimary, fontPrimary === 'times' ? 'italic' : 'normal');
  doc.setFontSize(10);
  doc.setTextColor(cfg.subHeaderText[0], cfg.subHeaderText[1], cfg.subHeaderText[2]);
  doc.text('Certificamos com distinção e honra ao mérito analítico que o(a) trader', centerX, currentY, { align: 'center' });

  // ==========================================
  // 3. TRADER NAME (LARGE PROMINENT CALLOUT)
  // ==========================================
  currentY += 12;
  doc.setFont(fontPrimary, fontPrimary === 'times' ? 'bolditalic' : 'bold');
  doc.setFontSize(21);
  doc.setTextColor(cfg.traderNameText[0], cfg.traderNameText[1], cfg.traderNameText[2]);
  doc.text(trader.toUpperCase(), centerX, currentY, { align: 'center' });

  // Underline beneath trader name
  const nameWidth = doc.getTextWidth(trader.toUpperCase());
  doc.setDrawColor(cfg.traderUnderline[0], cfg.traderUnderline[1], cfg.traderUnderline[2]);
  doc.setLineWidth(0.6);
  doc.line(centerX - nameWidth / 2 - 4, currentY + 2, centerX + nameWidth / 2 + 4, currentY + 2);

  // ==========================================
  // 4. ACHIEVEMENT DESCRIPTION & MILESTONE BOX
  // ==========================================
  currentY += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(cfg.subHeaderText[0], cfg.subHeaderText[1], cfg.subHeaderText[2]);
  doc.text('atingiu com disciplina operacional e controle estatístico a expressiva meta histórica de:', centerX, currentY, { align: 'center' });

  // Milestone Banner Box
  currentY += 6;
  const boxWidth = 170;
  const boxHeight = 22;
  const boxX = centerX - boxWidth / 2;

  doc.setFillColor(cfg.targetBoxFill[0], cfg.targetBoxFill[1], cfg.targetBoxFill[2]);
  doc.setDrawColor(cfg.targetBoxBorder[0], cfg.targetBoxBorder[1], cfg.targetBoxBorder[2]);
  doc.setLineWidth(1);
  doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 3, 3, 'FD');

  // Milestone Value Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(cfg.targetValueText[0], cfg.targetValueText[1], cfg.targetValueText[2]);
  const formattedTarget = formatBRL(data.milestone.targetProfit);
  doc.text(`${formattedTarget}`, centerX, currentY + 9, { align: 'center' });

  // Milestone Rank Text
  doc.setFontSize(8.5);
  doc.setTextColor(cfg.targetRankText[0], cfg.targetRankText[1], cfg.targetRankText[2]);
  doc.text(data.milestone.rank.toUpperCase(), centerX, currentY + 16, { align: 'center' });

  // Context line below box
  currentY += boxHeight + 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(cfg.descText[0], cfg.descText[1], cfg.descText[2]);
  doc.text(
    `"${data.milestone.description}"`,
    centerX,
    currentY,
    { align: 'center', maxWidth: 220 }
  );

  // ==========================================
  // 5. STATS SUMMARY BADGE ROW
  // ==========================================
  currentY += 8;
  const statsY = currentY;
  const statBoxW = 46;
  const statBoxH = 14;
  const gap = 6;
  const totalW = statBoxW * 4 + gap * 3;
  let startStatX = centerX - totalW / 2;

  const statItems = [
    { label: 'LUCRO ATUAL', val: formatBRL(data.totalProfit), col: cfg.targetValueText },
    { label: 'TOTAL TRADES', val: `${data.totalTrades} operações`, col: cfg.titleText },
    { label: 'TAXA ACERTO', val: `${data.winRate.toFixed(1)}%`, col: cfg.headerText },
    { label: 'FATOR DE LUCRO', val: data.profitFactor && data.profitFactor > 0 ? `${data.profitFactor.toFixed(2)}` : 'Consistente', col: cfg.targetRankText },
  ];

  statItems.forEach((st) => {
    doc.setFillColor(cfg.statBoxFill[0], cfg.statBoxFill[1], cfg.statBoxFill[2]);
    doc.setDrawColor(cfg.statBoxBorder[0], cfg.statBoxBorder[1], cfg.statBoxBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(startStatX, statsY, statBoxW, statBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(cfg.statLabelText[0], cfg.statLabelText[1], cfg.statLabelText[2]);
    doc.text(st.label, startStatX + statBoxW / 2, statsY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(st.col[0], st.col[1], st.col[2]);
    doc.text(st.val, startStatX + statBoxW / 2, statsY + 10.5, { align: 'center' });

    startStatX += statBoxW + gap;
  });

  // ==========================================
  // 6. FOOTER: SIGNATURE, SEAL & VALIDATION CODE
  // ==========================================
  const footerY = pageHeight - 32;

  // Left side: Validation Code & Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cfg.footerText[0], cfg.footerText[1], cfg.footerText[2]);
  doc.text(`Data de Concessão: ${dateFormatted}`, 26, footerY + 2);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cfg.headerText[0], cfg.headerText[1], cfg.headerText[2]);
  doc.text(`Código de Validação: ${certCode}`, 26, footerY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(cfg.footerText[0], cfg.footerText[1], cfg.footerText[2]);
  doc.text('Registro autêntico de backtest gerado por B3 Backtest Trader.', 26, footerY + 12);

  // Right side: Official Signature Line
  const signX = pageWidth - 90;
  doc.setDrawColor(cfg.footerText[0], cfg.footerText[1], cfg.footerText[2]);
  doc.setLineWidth(0.5);
  doc.line(signX, footerY + 4, signX + 64, footerY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cfg.titleText[0], cfg.titleText[1], cfg.titleText[2]);
  doc.text('B3 BACKTEST TRADER', signX + 32, footerY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(cfg.footerText[0], cfg.footerText[1], cfg.footerText[2]);
  doc.text('Comissão de Avaliação e Gestão Estatística', signX + 32, footerY + 13, { align: 'center' });

  // Center Gold Seal
  const sealY = footerY + 6;
  doc.setFillColor(cfg.sealOuter[0], cfg.sealOuter[1], cfg.sealOuter[2]);
  doc.circle(centerX, sealY, 9, 'F');
  doc.setFillColor(cfg.sealInner[0], cfg.sealInner[1], cfg.sealInner[2]);
  doc.circle(centerX, sealY, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(cfg.sealText[0], cfg.sealText[1], cfg.sealText[2]);
  doc.text('OFICIAL B3', centerX, sealY - 0.5, { align: 'center' });
  doc.setFontSize(5);
  doc.setTextColor(cfg.titleText[0], cfg.titleText[1], cfg.titleText[2]);
  doc.text('MÉRITO', centerX, sealY + 3, { align: 'center' });

  // Save PDF
  const safeFilename = `certificado_meta_${data.milestone.targetProfit}_reais_${template.id}_${trader.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
