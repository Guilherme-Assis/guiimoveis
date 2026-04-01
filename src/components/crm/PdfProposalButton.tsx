import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";

interface ProposalData {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  propertyTitle: string;
  propertyCity?: string;
  propertyPrice?: number;
  proposedValue: number;
  counterValue?: number;
  conditions?: string;
  validUntil?: string;
  brokerName?: string;
  brokerCreci?: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PdfProposalButton = ({ data }: { data: ProposalData }) => {
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFillColor(30, 30, 40);
      doc.rect(0, 0, pageWidth, 50, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("PROPOSTA COMERCIAL", pageWidth / 2, 25, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 35, { align: "center" });
      if (data.validUntil) {
        doc.text(`Válida até: ${new Date(data.validUntil).toLocaleDateString("pt-BR")}`, pageWidth / 2, 42, { align: "center" });
      }

      y = 65;
      doc.setTextColor(30, 30, 40);

      // Section: Client
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 80, 200);
      doc.text("DADOS DO CLIENTE", 20, y);
      y += 2;
      doc.setDrawColor(100, 80, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${data.leadName}`, 20, y); y += 6;
      if (data.leadEmail) { doc.text(`Email: ${data.leadEmail}`, 20, y); y += 6; }
      if (data.leadPhone) { doc.text(`Telefone: ${data.leadPhone}`, 20, y); y += 6; }

      y += 8;

      // Section: Property
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 80, 200);
      doc.text("DADOS DO IMÓVEL", 20, y);
      y += 2;
      doc.line(20, y, pageWidth - 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Imóvel: ${data.propertyTitle}`, 20, y); y += 6;
      if (data.propertyCity) { doc.text(`Cidade: ${data.propertyCity}`, 20, y); y += 6; }
      if (data.propertyPrice) { doc.text(`Valor de Tabela: ${formatCurrency(data.propertyPrice)}`, 20, y); y += 6; }

      y += 8;

      // Section: Values
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 80, 200);
      doc.text("VALORES DA PROPOSTA", 20, y);
      y += 2;
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      // Value box
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(20, y - 2, pageWidth - 40, 24, 3, 3, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 80, 200);
      doc.text(`Valor Proposto: ${formatCurrency(data.proposedValue)}`, 30, y + 8);
      if (data.counterValue) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 90);
        doc.text(`Contraproposta: ${formatCurrency(data.counterValue)}`, 30, y + 16);
      }
      y += 32;

      // Conditions
      if (data.conditions) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 80, 200);
        doc.text("CONDIÇÕES", 20, y);
        y += 2;
        doc.line(20, y, pageWidth - 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 60);
        const lines = doc.splitTextToSize(data.conditions, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 10;
      }

      // Footer
      y = Math.max(y + 20, 230);
      doc.setDrawColor(200, 200, 210);
      doc.line(20, y, 90, y);
      doc.line(pageWidth - 90, y, pageWidth - 20, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text("Assinatura do Cliente", 55, y, { align: "center" });
      doc.text(data.brokerName || "Corretor", pageWidth - 55, y, { align: "center" });
      if (data.brokerCreci) {
        doc.text(`CRECI: ${data.brokerCreci}`, pageWidth - 55, y + 5, { align: "center" });
      }

      doc.save(`proposta-${data.leadName.replace(/\s/g, "-").toLowerCase()}.pdf`);
      toast({ title: "PDF gerado com sucesso!" });
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5 border-border/40 text-xs" onClick={generate} disabled={generating}>
      <FileDown className="h-3.5 w-3.5" />
      {generating ? "Gerando..." : "PDF"}
    </Button>
  );
};

export default PdfProposalButton;
