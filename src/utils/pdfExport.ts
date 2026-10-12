import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlySummary, Setup, Trade } from '../types';
import { formatBRL, formatDateBR } from './calculations';

export interface PdfExportOptions {
  monthKey?: string; // e.g. "2026-03" or "ALL"
  includeTradesList?: boolean;
  includeSetupsBreakdown?: boolean;
  includeAssetComparison?: boolean;
  traderName?: string;
  notes?: string;
}

/**
 * Generates and downloads a professional PDF performance report for a selected month or full period.
 */
export function exportMonthlyPerformancePdf(
  monthlyData: MonthlySummary[],
  allTrades: Trade[],
  setups: Setup[],
  options: PdfExportOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const isAllMonths = !options.monthKey || options.monthKey === 'ALL';
  const selectedMonth = isAllMonths
    ? null
    : monthlyData.find((m) => m.monthKey === options.monthKey) || monthlyData[0];

  const reportTitle = isAllMonths
    ? 'Relatório de Performance Mensal Consolidado'
    : `Relatório de Performance Mensal · ${selectedMonth?.monthLabel || 'Mês'}`;

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // --- Header Styling ---
  // Dark header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Top accent green line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('B3 BACKTEST TRADER', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Mini Contratos Futuros (WIN & WDO) · Análise de Consistência', margin, 18);

  // Right-aligned report type and generation date
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Gerado em: ${todayStr}`, pageWidth - margin, 12, { align: 'right' });
  if (options.traderName?.trim()) {
    doc.text(`Trader: ${options.traderName.trim()}`, pageWidth - margin, 18, { align: 'right' });
  }

  let currentY = 36;

  // --- Report Heading ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(reportTitle, margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isAllMonths
      ? `Histórico consolidado de ${monthlyData.length} meses operados na B3.`
      : `Histórico detalhado das operações, métricas e setups de ${selectedMonth?.monthLabel}.`,
    margin,
    currentY
  );

  currentY += 8;

  // ==========================================
  // CASE 1: SPECIFIC MONTH DETAILED REPORT
  // ==========================================
  if (selectedMonth) {
    const monthTrades = selectedMonth.trades || allTrades.filter(
      (t) => t.date && t.date.startsWith(selectedMonth.monthKey)
    );

    const isProfit = selectedMonth.netProfit >= 0;

    // --- Primary Metrics Box ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'FD');

    // Box Columns
    // Col 1: Net Profit
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('RESULTADO LÍQUIDO', margin + 6, currentY + 7);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    if (isProfit) {
      doc.setTextColor(16, 185, 129); // emerald
    } else {
      doc.setTextColor(225, 29, 72); // rose
    }
    doc.text(formatBRL(selectedMonth.netProfit), margin + 6, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Ganhos: +${formatBRL(selectedMonth.grossGain)} | Perdas: -${formatBRL(selectedMonth.grossLoss)}`,
      margin + 6,
      currentY + 22
    );

    // Col 2: Win Rate
    const col2X = margin + 55;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TAXA DE ACERTO', col2X, currentY + 7);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedMonth.winRate.toFixed(1)}%`, col2X, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${selectedMonth.wins} Vitórias / ${selectedMonth.losses} Derrotas${
        selectedMonth.breakevens > 0 ? ` / ${selectedMonth.breakevens} 0x0` : ''
      }`,
      col2X,
      currentY + 22
    );

    // Col 3: Profit Factor & Trades
    const col3X = margin + 110;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DE TRADES', col3X, currentY + 7);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedMonth.totalTrades} operações`, col3X, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Fator de Lucro: ${selectedMonth.profitFactor > 0 ? selectedMonth.profitFactor.toFixed(2) : '-'}`,
      col3X,
      currentY + 22
    );

    // Col 4: Points WIN & WDO
    const col4X = margin + 145;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PONTOS NO MÊS', col4X, currentY + 7);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `WIN: ${selectedMonth.pointsWIN >= 0 ? `+${selectedMonth.pointsWIN}` : selectedMonth.pointsWIN} pts`,
      col4X,
      currentY + 14
    );
    doc.text(
      `WDO: ${selectedMonth.pointsWDO >= 0 ? `+${selectedMonth.pointsWDO}` : selectedMonth.pointsWDO} pts`,
      col4X,
      currentY + 20
    );

    currentY += 34;

    // --- Sub-tabela: Comparativo por Ativo (WIN vs WDO) no Mês ---
    if (options.includeAssetComparison !== false) {
      const winTrades = monthTrades.filter((t) => t.asset === 'WIN');
      const wdoTrades = monthTrades.filter((t) => t.asset === 'WDO');

      const winWins = winTrades.filter((t) => t.result === 'GAIN').length;
      const winLosses = winTrades.filter((t) => t.result === 'LOSS').length;
      const winProfit = winTrades.reduce((acc, t) => acc + t.financialValue, 0);
      const winWinRate = winTrades.length > 0 ? (winWins / winTrades.length) * 100 : 0;

      const wdoWins = wdoTrades.filter((t) => t.result === 'GAIN').length;
      const wdoLosses = wdoTrades.filter((t) => t.result === 'LOSS').length;
      const wdoProfit = wdoTrades.reduce((acc, t) => acc + t.financialValue, 0);
      const wdoWinRate = wdoTrades.length > 0 ? (wdoWins / wdoTrades.length) * 100 : 0;

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Ativo Operado', 'Trades', 'Vitórias', 'Derrotas', 'Taxa Acerto', 'Pontos', 'Resultado Financeiro']],
        body: [
          [
            'Mini Índice (WIN)',
            String(winTrades.length),
            String(winWins),
            String(winLosses),
            `${winWinRate.toFixed(1)}%`,
            `${selectedMonth.pointsWIN >= 0 ? `+${selectedMonth.pointsWIN}` : selectedMonth.pointsWIN} pts`,
            formatBRL(winProfit),
          ],
          [
            'Mini Dólar (WDO)',
            String(wdoTrades.length),
            String(wdoWins),
            String(wdoLosses),
            `${wdoWinRate.toFixed(1)}%`,
            `${selectedMonth.pointsWDO >= 0 ? `+${selectedMonth.pointsWDO}` : selectedMonth.pointsWDO} pts`,
            formatBRL(wdoProfit),
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [15, 23, 42],
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          6: { halign: 'right', fontStyle: 'bold' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // --- Sub-tabela: Desempenho por Setup no Mês ---
    if (options.includeSetupsBreakdown !== false) {
      const setupMap = new Map<string, { name: string; count: number; wins: number; losses: number; profit: number }>();
      
      monthTrades.forEach((t) => {
        const id = t.setupId || 'setup-outro';
        const name = t.setupName || setups.find((s) => s.id === id)?.name || 'Setup Padrão';
        const curr = setupMap.get(id) || { name, count: 0, wins: 0, losses: 0, profit: 0 };
        curr.count += 1;
        if (t.result === 'GAIN') curr.wins += 1;
        if (t.result === 'LOSS') curr.losses += 1;
        curr.profit += t.financialValue;
        setupMap.set(id, curr);
      });

      const setupsRows = Array.from(setupMap.values())
        .sort((a, b) => b.profit - a.profit)
        .map((s) => [
          s.name,
          String(s.count),
          String(s.wins),
          String(s.losses),
          `${s.count > 0 ? ((s.wins / s.count) * 100).toFixed(1) : 0}%`,
          formatBRL(s.profit),
        ]);

      if (setupsRows.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Estratégias / Setups Utilizados no Mês', margin, currentY);
        currentY += 3;

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['Setup Operacional', 'Trades', 'Gains', 'Losses', 'Taxa de Acerto', 'Resultado (R$)']],
          body: setupsRows,
          theme: 'grid',
          headStyles: {
            fillColor: [51, 65, 85],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [15, 23, 42],
          },
          columnStyles: {
            5: { halign: 'right', fontStyle: 'bold' },
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    // --- Sub-tabela: Lista Completa de Trades do Mês ---
    if (options.includeTradesList !== false && monthTrades.length > 0) {
      // Check if page needs break
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Histórico Completo de Trades do Mês (${monthTrades.length} registros)`, margin, currentY);
      currentY += 3;

      const tradeRows = [...monthTrades]
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
        .map((t) => [
          formatDateBR(t.date),
          t.time || '-',
          t.asset,
          t.direction === 'COMPRA' ? 'COMPRA' : 'VENDA',
          t.setupName || setups.find((s) => s.id === t.setupId)?.name || 'Setup',
          `${t.contracts} ct`,
          t.points > 0 ? `+${t.points}` : `${t.points}`,
          t.result,
          formatBRL(t.financialValue),
        ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Data', 'Hora', 'Ativo', 'Direção', 'Setup', 'Cts', 'Pontos', 'Resultado', 'Financeiro']],
        body: tradeRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 14 },
          2: { fontStyle: 'bold', cellWidth: 14 },
          7: { fontStyle: 'bold' },
          8: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rawVal = tradeRows[data.row.index]?.[8];
            const resultVal = tradeRows[data.row.index]?.[7];
            if (data.column.index === 8) {
              if (rawVal && !rawVal.startsWith('-') && !rawVal.startsWith('R$ 0,00')) {
                data.cell.styles.textColor = [16, 185, 129]; // emerald
              } else if (rawVal && rawVal.startsWith('-')) {
                data.cell.styles.textColor = [225, 29, 72]; // rose
              }
            }
            if (data.column.index === 7) {
              if (resultVal === 'GAIN') data.cell.styles.textColor = [16, 185, 129];
              if (resultVal === 'LOSS') data.cell.styles.textColor = [225, 29, 72];
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ==========================================
  // CASE 2: CONSOLIDATED ALL MONTHS REPORT
  // ==========================================
  else {
    const totalProfit = monthlyData.reduce((acc, m) => acc + m.netProfit, 0);
    const totalTradesCount = monthlyData.reduce((acc, m) => acc + m.totalTrades, 0);
    const totalWins = monthlyData.reduce((acc, m) => acc + m.wins, 0);
    const avgWinRate = totalTradesCount > 0 ? (totalWins / totalTradesCount) * 100 : 0;
    const profitableMonths = monthlyData.filter((m) => m.netProfit > 0).length;

    // Overview Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('LUCRO TOTAL ACUMULADO', margin + 6, currentY + 7);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(totalProfit >= 0 ? 16 : 225, totalProfit >= 0 ? 185 : 29, totalProfit >= 0 ? 129 : 72);
    doc.text(formatBRL(totalProfit), margin + 6, currentY + 16);

    const col2X = margin + 60;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CONSISTÊNCIA MENSAL', col2X, currentY + 7);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${profitableMonths} de ${monthlyData.length} meses positivos`, col2X, currentY + 16);

    const col3X = margin + 125;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TAXA DE ACERTO GLOBAL', col3X, currentY + 7);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgWinRate.toFixed(1)}% (${totalTradesCount} trades)`, col3X, currentY + 16);

    currentY += 30;

    // Consolidated Months Table
    const monthsRows = [...monthlyData]
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map((m) => [
        m.monthLabel,
        String(m.totalTrades),
        `${m.wins}G / ${m.losses}L`,
        `${m.winRate.toFixed(1)}%`,
        `+${formatBRL(m.grossGain)}`,
        `-${formatBRL(m.grossLoss)}`,
        m.profitFactor > 0 ? m.profitFactor.toFixed(2) : '-',
        `WIN: ${m.pointsWIN >= 0 ? `+${m.pointsWIN}` : m.pointsWIN} | WDO: ${m.pointsWDO >= 0 ? `+${m.pointsWDO}` : m.pointsWDO}`,
        formatBRL(m.netProfit),
      ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Mês / Ano', 'Trades', 'G / L', 'Acerto', 'Ganhos', 'Perdas', 'Fator L.', 'Pontos', 'Resultado Líquido']],
      body: monthsRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        8: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const val = monthsRows[data.row.index]?.[8];
          if (val && !val.startsWith('-')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (val && val.startsWith('-')) {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- Page Numbering & Footer Note on all pages ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'Documento gerado por B3 Backtest Trader · Uso pessoal e controle estatístico',
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  }

  // File name
  const safeFilename = isAllMonths
    ? `relatorio_performance_mensal_consolidado_${new Date().toISOString().split('T')[0]}.pdf`
    : `relatorio_performance_${selectedMonth?.monthKey || 'mensal'}_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(safeFilename);
}
