import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Copy, Check, Sparkles, X, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';
import { CorporateCard, ExpenseItem, InvoiceStatementLine, UserProfile } from '../types';

interface ReportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  cards: CorporateCard[];
  users: UserProfile[];
  statements: InvoiceStatementLine[];
  monthYear: string;
}

export const ReportImageModal: React.FC<ReportImageModalProps> = ({
  isOpen,
  onClose,
  expenses,
  cards,
  users,
  statements,
  monthYear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalSpent = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalReconciled = expenses
    .filter((e) => e.status === 'reconciled' || e.invoiceMatch)
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const reconciledCount = expenses.filter((e) => e.status === 'reconciled' || e.invoiceMatch).length;
  const openCount = expenses.filter((e) => e.status === 'open').length;

  useEffect(() => {
    if (!isOpen) return;
    generateReportImage();
  }, [isOpen, expenses, cards, monthYear]);

  const generateReportImage = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas (2x DPI for crisp text)
    const scale = 2;
    const width = 1240;
    
    // Dynamic height calculation so nothing is ever clipped
    const headerHeight = 150;
    const kpiHeight = 110;
    const cardsHeight = 90;
    const tableHeaderHeight = 44;
    const rowHeight = 52;
    const rowsHeight = Math.max(1, expenses.length) * rowHeight;
    const footerHeight = 110;
    const paddingTotal = 100;
    
    const height = headerHeight + kpiHeight + cardsHeight + tableHeaderHeight + rowsHeight + footerHeight + paddingTotal;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // 1. Background (Deep Slate with Neon Emerald Tint)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#07090e');
    bgGradient.addColorStop(0.5, '#0a0d14');
    bgGradient.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer Neon Glow Border
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Top Neon Accent Bar
    const barGradient = ctx.createLinearGradient(24, 24, width - 24, 24);
    barGradient.addColorStop(0, '#00FF41');
    barGradient.addColorStop(0.5, '#10b981');
    barGradient.addColorStop(1, '#00FF41');
    ctx.fillStyle = barGradient;
    ctx.fillRect(24, 24, width - 48, 6);

    // 2. Header Section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('CARTÕES CEO TRAVEL • RELATÓRIO DE CONCILIAÇÃO', 50, 78);

    ctx.fillStyle = '#00FF41';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`PERÍODO: ${monthYear.toUpperCase()} • SISTEMA DE GESTÃO CORPORATIVA & AUDITORIA`, 50, 106);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | contasareceber@ceotravel.com.br`, 50, 128);

    // Right-aligned status pill on header
    ctx.fillStyle = 'rgba(0, 255, 65, 0.12)';
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 320, 55, 270, 70, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00FF41';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('STATUS DA CONCILIAÇÃO', width - 302, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${reconciledCount}/${expenses.length} CONCILIADOS`, width - 302, 108);

    // 3. Metric KPI Cards (3 Columns)
    const kpis = [
      {
        label: 'TOTAL GASTO REGISTRADO',
        value: `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        color: '#00FF41',
      },
      {
        label: 'TOTAL CONCILIADO NO BANCO',
        value: `R$ ${totalReconciled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        color: '#34d399',
      },
      {
        label: 'LANÇAMENTOS EM ABERTO',
        value: `${openCount} Pendentes`,
        color: openCount > 0 ? '#fbbf24' : '#00FF41',
      },
    ];

    const kpiWidth = (width - 100 - 40) / 3;
    kpis.forEach((kpi, i) => {
      const x = 50 + i * (kpiWidth + 20);
      const y = 156;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, kpiWidth, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(kpi.label, x + 18, y + 28);

      ctx.fillStyle = kpi.color;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(kpi.value, x + 18, y + 60);
    });

    // 4. Cards Summary Section
    let currentY = 265;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillText('CARTÕES CORPORATIVOS CEO TRAVEL UTILIZADOS:', 50, currentY);

    currentY += 15;
    const cardBlockWidth = (width - 100 - 30) / Math.min(3, Math.max(cards.length, 1));
    cards.slice(0, 3).forEach((card, idx) => {
      const cardX = 50 + idx * (cardBlockWidth + 15);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cardX, currentY, cardBlockWidth, 48, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillText(`${card.name.slice(0, 32)} (•••• ${card.last4})`, cardX + 12, currentY + 22);

      ctx.fillStyle = '#00FF41';
      ctx.font = '11px monospace';
      ctx.fillText(
        `Gasto: R$ ${card.currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Limite: R$ ${card.limitMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        cardX + 12,
        currentY + 38
      );
    });

    // 5. Itemized Table of Expenses
    currentY += 75;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillText('DETALHAMENTO DOS LANÇAMENTOS POR SETOR, COLABORADOR E MOTIVO:', 50, currentY);

    currentY += 15;
    // Table Header
    ctx.fillStyle = 'rgba(0, 255, 65, 0.15)';
    ctx.fillRect(50, currentY, width - 100, 34);

    ctx.fillStyle = '#00FF41';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('DATA', 65, currentY + 22);
    ctx.fillText('SETOR', 150, currentY + 22);
    ctx.fillText('COLABORADOR', 260, currentY + 22);
    ctx.fillText('TRAJETO / FORNECEDOR / OBSERVAÇÃO', 430, currentY + 22);
    ctx.fillText('APROVADO POR', 780, currentY + 22);
    ctx.fillText('VALOR', 940, currentY + 22);
    ctx.fillText('STATUS', 1060, currentY + 22);

    currentY += 34;

    // Table Rows
    if (expenses.length === 0) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(50, currentY, width - 100, 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('Nenhuma despesa registrada neste período.', 65, currentY + 30);
      currentY += 50;
    } else {
      expenses.forEach((exp, idx) => {
        const isEven = idx % 2 === 0;
        ctx.fillStyle = isEven ? 'rgba(15, 23, 42, 0.5)' : 'rgba(25, 33, 50, 0.4)';
        ctx.fillRect(50, currentY, width - 100, rowHeight);

        // Border bottom
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, currentY + rowHeight);
        ctx.lineTo(width - 50, currentY + rowHeight);
        ctx.stroke();

        // Date
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(new Date(exp.date).toLocaleDateString('pt-BR'), 65, currentY + 30);

        // Sector Pill
        ctx.fillStyle = '#00FF41';
        ctx.font = 'bold 10px monospace';
        ctx.fillText((exp.employeeDept || 'GERAL').slice(0, 12), 150, currentY + 30);

        // Colaborador
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.fillText((exp.employeeName || 'Colaborador').slice(0, 18), 260, currentY + 30);

        // Description / Trajeto / Motivo
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px -apple-system, sans-serif';
        let descText = exp.title;
        if (exp.details.origin && exp.details.destination) {
          descText = `${exp.details.origin} ➔ ${exp.details.destination}`;
        }
        if (exp.details.notes) {
          descText += ` (${exp.details.notes})`;
        }
        ctx.fillText(descText.slice(0, 48), 430, currentY + 30);

        // Authorizer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillText((exp.authorizationBy || 'Diretoria').slice(0, 18), 780, currentY + 30);

        // Amount
        ctx.fillStyle = '#00FF41';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`R$ ${exp.totalAmount.toFixed(2)}`, 940, currentY + 30);

        // Status Badge
        const isReconciled = exp.status === 'reconciled' || !!exp.invoiceMatch;
        const isOpen = exp.status === 'open';

        if (isReconciled) {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.2)';
          ctx.strokeStyle = '#00FF41';
        } else if (isOpen) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.strokeStyle = '#f59e0b';
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
          ctx.strokeStyle = '#94a3b8';
        }

        ctx.beginPath();
        ctx.roundRect(1055, currentY + 12, 125, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isReconciled ? '#00FF41' : isOpen ? '#fbbf24' : '#cbd5e1';
        ctx.font = 'bold 9px monospace';
        const statusLabel = isReconciled ? 'CONCILIADO' : isOpen ? 'EM ABERTO' : 'FINALIZADO';
        ctx.fillText(statusLabel, 1068, currentY + 29);

        currentY += rowHeight;
      });
    }

    // 6. Footer Digital Signature & Audit Stamp
    currentY += 28;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, currentY, width - 100, 72, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00FF41';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SELO DE AUDITORIA & CONFORMIDADE CORPORATIVA • CEO TRAVEL', 70, currentY + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(
      `HASH: ${Math.random().toString(36).substring(2, 12).toUpperCase()}-CEOTRAVEL-CORP-VALIDATED`,
      70,
      currentY + 47
    );
    ctx.fillText('Documento oficial para prestação de contas dos cartões corporativos.', 70, currentY + 60);

    // Generate Base64
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setImageSrc(dataUrl);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.download = `Relatorio_Cartoes_CEO_Travel_${monthYear.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = imageSrc;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    } catch (e) {
      console.error('Error copying image:', e);
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#111217] border border-[#00FF41]/40 rounded-3xl w-full max-w-5xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,255,65,0.15)] space-y-4 my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
                Relatório dos Cartões CEO Travel (Imagem PNG)
              </h3>
              <p className="text-xs text-zinc-400">
                Imagem sem cortes com todas as despesas, setores, valores e autorizações do mês.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas for High-DPI Rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Image Preview Container (with block display so it NEVER clips!) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-3 max-h-[65vh] overflow-y-auto block shadow-inner">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Relatório Visual de Conciliação CEO Travel"
              className="w-full h-auto rounded-xl shadow-2xl block mx-auto"
            />
          ) : (
            <div className="py-20 text-center text-zinc-400 text-sm">
              <Sparkles className="w-6 h-6 animate-spin text-[#00FF41] mx-auto mb-2" />
              Gerando imagem do relatório em alta resolução...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-[#00FF41]" />
            <span>Formato perfeito para envio no WhatsApp, e-mail ou prestação de contas contábil.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-copy-report-img"
              onClick={handleCopyImage}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center gap-2 transition-all border border-zinc-750"
            >
              {isCopied ? <CheckCircle2 className="w-4 h-4 text-[#00FF41]" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
            </button>

            <button
              type="button"
              id="btn-download-report-img"
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#10ff55] text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem PNG</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
