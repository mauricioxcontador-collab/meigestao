import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { ReportData } from '@/hooks/useReportData';

interface ReportActionsProps {
  data: ReportData;
  companyName: string;
  clientId: string | null;
}

export function ReportActions({ data, companyName, clientId }: ReportActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper to add new page if needed
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Cover Page
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório Financeiro', pageWidth / 2, 35, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companyName || 'MEI Gestão', pageWidth / 2, 50, { align: 'center' });
      
      pdf.setFontSize(12);
      const periodText = `${format(data.periodStart, 'dd/MM/yyyy', { locale: ptBR })} a ${format(data.periodEnd, 'dd/MM/yyyy', { locale: ptBR })}`;
      pdf.text(periodText, pageWidth / 2, 65, { align: 'center' });
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

      // Page 2 - Executive Summary
      pdf.addPage();
      yPosition = margin;
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo Executivo', margin, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const summaryItems = [
        { label: 'Receita Total', value: formatCurrency(data.totalRevenue), color: [16, 185, 129] },
        { label: 'Despesa Total', value: formatCurrency(data.totalExpenses), color: [239, 68, 68] },
        { label: 'Lucro Líquido', value: formatCurrency(data.netProfit), color: data.netProfit >= 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'Margem de Lucro', value: `${data.profitMargin.toFixed(1)}%`, color: [59, 130, 246] },
        { label: 'Crescimento Mensal', value: `${data.monthlyGrowth >= 0 ? '+' : ''}${data.monthlyGrowth.toFixed(1)}%`, color: data.monthlyGrowth >= 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'Ticket Médio', value: formatCurrency(data.averageTicket), color: [139, 92, 246] },
        { label: 'Faturamento Anual', value: formatCurrency(data.annualBilling), color: [59, 130, 246] },
      ];

      summaryItems.forEach((item) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(item.label + ':', margin, yPosition);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
        pdf.text(item.value, margin + 50, yPosition);
        yPosition += 10;
      });

      yPosition += 10;

      // Variations section
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Comparativo com Período Anterior', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const variations = [
        { label: 'Variação Receita', value: data.revenueVariation },
        { label: 'Variação Despesa', value: data.expenseVariation },
        { label: 'Variação Lucro', value: data.profitVariation },
      ];

      variations.forEach((v) => {
        const isPositive = v.value >= 0;
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${v.label}:`, margin, yPosition);
        pdf.setTextColor(isPositive ? 16 : 239, isPositive ? 185 : 68, isPositive ? 129 : 68);
        pdf.text(`${isPositive ? '+' : ''}${v.value.toFixed(1)}%`, margin + 45, yPosition);
        yPosition += 8;
      });

      // Page 3 - Charts (capture from DOM)
      pdf.addPage();
      yPosition = margin;

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gráficos de Desempenho', margin, yPosition);
      yPosition += 15;

      // Capture charts
      const chartsElement = document.getElementById('report-charts');
      if (chartsElement) {
        const canvas = await html2canvas(chartsElement, { 
          scale: 2, 
          backgroundColor: '#ffffff',
          logging: false 
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight > pageHeight - yPosition - margin) {
          const scale = (pageHeight - yPosition - margin) / imgHeight;
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth * scale, imgHeight * scale);
        } else {
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        }
      }

      // Page 4 - Revenue Categories
      pdf.addPage();
      yPosition = margin;

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receitas por Categoria', margin, yPosition);
      yPosition += 15;

      if (data.revenueByCategory.length > 0) {
        pdf.setFontSize(10);
        data.revenueByCategory.forEach((cat) => {
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${cat.name}:`, margin, yPosition);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(16, 185, 129);
          pdf.text(`${formatCurrency(cat.value)} (${cat.percentage.toFixed(1)}%)`, margin + 50, yPosition);
          yPosition += 8;
        });
      } else {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text('Nenhuma receita registrada no período', margin, yPosition);
      }

      yPosition += 15;

      // Expense Categories
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Despesas por Categoria', margin, yPosition);
      yPosition += 15;

      if (data.expensesByCategory.length > 0) {
        pdf.setFontSize(10);
        data.expensesByCategory.forEach((cat) => {
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${cat.name}:`, margin, yPosition);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(239, 68, 68);
          pdf.text(`${formatCurrency(cat.value)} (${cat.percentage.toFixed(1)}%)`, margin + 50, yPosition);
          yPosition += 8;
        });
      } else {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text('Nenhuma despesa registrada no período', margin, yPosition);
      }

      yPosition += 15;

      // Fixed vs Variable
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Despesas Fixas x Variáveis', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Despesas Fixas: ${formatCurrency(data.fixedExpenses)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Despesas Variáveis: ${formatCurrency(data.variableExpenses)}`, margin, yPosition);

      // Page 5 - Detailed Tables
      pdf.addPage();
      yPosition = margin;

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Produtos/Serviços', margin, yPosition);
      yPosition += 12;

      if (data.topProducts.length > 0) {
        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Produto/Serviço', margin + 2, yPosition);
        pdf.text('Qtd', margin + 90, yPosition);
        pdf.text('Total', margin + 120, yPosition);
        yPosition += 8;

        pdf.setFont('helvetica', 'normal');
        data.topProducts.forEach((product) => {
          pdf.text(product.name.substring(0, 40), margin + 2, yPosition);
          pdf.text(product.count.toString(), margin + 90, yPosition);
          pdf.setTextColor(16, 185, 129);
          pdf.text(formatCurrency(product.value), margin + 120, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 6;
        });
      }

      // Save report to database
      if (clientId) {
        await supabase.from('reports').insert([{
          client_id: clientId,
          period_start: format(data.periodStart, 'yyyy-MM-dd'),
          period_end: format(data.periodEnd, 'yyyy-MM-dd'),
          total_revenue: data.totalRevenue,
          total_expenses: data.totalExpenses,
          profit: data.netProfit,
          profit_margin: data.profitMargin,
          revenue_growth: data.revenueVariation,
          expense_growth: data.expenseVariation,
          report_data: JSON.parse(JSON.stringify({
            topProducts: data.topProducts,
            revenueByCategory: data.revenueByCategory,
            expensesByCategory: data.expensesByCategory,
          })),
        }]);
      }

      // Download PDF
      pdf.save(`relatorio-${companyName || 'mei'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `📊 *Relatório Financeiro - ${companyName}*\n\n` +
      `📅 Período: ${format(data.periodStart, 'dd/MM/yyyy')} a ${format(data.periodEnd, 'dd/MM/yyyy')}\n\n` +
      `💰 Receita: ${formatCurrency(data.totalRevenue)}\n` +
      `💸 Despesa: ${formatCurrency(data.totalExpenses)}\n` +
      `📈 Lucro: ${formatCurrency(data.netProfit)}\n` +
      `📊 Margem: ${data.profitMargin.toFixed(1)}%\n\n` +
      `_Gerado por MEI Gestão_`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareWithAccountant = () => {
    const subject = encodeURIComponent(`Relatório Financeiro - ${companyName}`);
    const body = encodeURIComponent(
      `Olá,\n\n` +
      `Segue o resumo do relatório financeiro:\n\n` +
      `Período: ${format(data.periodStart, 'dd/MM/yyyy')} a ${format(data.periodEnd, 'dd/MM/yyyy')}\n\n` +
      `• Receita Total: ${formatCurrency(data.totalRevenue)}\n` +
      `• Despesa Total: ${formatCurrency(data.totalExpenses)}\n` +
      `• Lucro Líquido: ${formatCurrency(data.netProfit)}\n` +
      `• Margem de Lucro: ${data.profitMargin.toFixed(1)}%\n` +
      `• Faturamento Anual: ${formatCurrency(data.annualBilling)}\n\n` +
      `Atenciosamente`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isGenerating ? 'Gerando...' : 'Download PDF'}
      </Button>
      <Button variant="outline" onClick={shareViaWhatsApp} className="gap-2">
        <MessageCircle className="h-4 w-4" />
        Enviar WhatsApp
      </Button>
      <Button variant="outline" onClick={shareWithAccountant} className="gap-2">
        <Share2 className="h-4 w-4" />
        Compartilhar com Contador
      </Button>
    </div>
  );
}
