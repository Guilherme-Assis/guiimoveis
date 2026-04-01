import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, TrendingUp, Users, CalendarDays, DollarSign } from "lucide-react";
import jsPDF from "jspdf";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const ReportsTab = () => {
  const { brokerId, role } = useAuth();

  const { data: leads = [] } = useQuery({
    queryKey: ["report-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("*");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["report-proposals", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_proposals").select("*, broker_leads(name), db_properties(title)");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["report-visits", brokerId],
    queryFn: async () => {
      const q = supabase.from("lead_property_visits").select("*");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["report-tasks", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_tasks").select("*");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const closedLeads = leads.filter((l: any) => l.status === "fechado").length;
    const lostLeads = leads.filter((l: any) => l.status === "perdido").length;
    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";
    const acceptedProposals = proposals.filter((p: any) => p.status === "aceita");
    const totalSales = acceptedProposals.reduce((s: number, p: any) => s + (p.proposed_value || 0), 0);
    const completedVisits = visits.filter((v: any) => v.status === "realizada").length;
    const scheduledVisits = visits.filter((v: any) => v.status === "agendada").length;
    const completedTasks = tasks.filter((t: any) => t.status === "concluida").length;
    const pendingTasks = tasks.filter((t: any) => t.status === "pendente").length;

    return { totalLeads, closedLeads, lostLeads, conversionRate, totalSales, acceptedProposals, completedVisits, scheduledVisits, completedTasks, pendingTasks, totalTasks: tasks.length, totalVisits: visits.length, totalProposals: proposals.length };
  }, [leads, proposals, visits, tasks]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");

    doc.setFontSize(20);
    doc.text("Relatorio de Performance", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Gerado em ${dateStr}`, 20, 33);
    doc.setTextColor(0);

    let y = 50;
    const addSection = (title: string, items: [string, string][]) => {
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 8;
      doc.setFontSize(11);
      items.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 25, y);
        y += 7;
      });
      y += 5;
    };

    addSection("Leads", [
      ["Total de Leads", String(stats.totalLeads)],
      ["Leads Fechados", String(stats.closedLeads)],
      ["Leads Perdidos", String(stats.lostLeads)],
      ["Taxa de Conversao", `${stats.conversionRate}%`],
    ]);

    addSection("Vendas e Propostas", [
      ["Total de Propostas", String(stats.totalProposals)],
      ["Propostas Aceitas", String(stats.acceptedProposals.length)],
      ["Valor Total em Vendas", formatCurrency(stats.totalSales)],
    ]);

    addSection("Visitas", [
      ["Total de Visitas", String(stats.totalVisits)],
      ["Visitas Realizadas", String(stats.completedVisits)],
      ["Visitas Agendadas", String(stats.scheduledVisits)],
    ]);

    addSection("Tarefas", [
      ["Total de Tarefas", String(stats.totalTasks)],
      ["Tarefas Concluidas", String(stats.completedTasks)],
      ["Tarefas Pendentes", String(stats.pendingTasks)],
    ]);

    doc.save(`relatorio-performance-${now.toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  }, [stats]);

  const exportCSV = useCallback(() => {
    const headers = ["Metrica", "Valor"];
    const rows = [
      ["Total de Leads", stats.totalLeads],
      ["Leads Fechados", stats.closedLeads],
      ["Leads Perdidos", stats.lostLeads],
      ["Taxa de Conversao (%)", stats.conversionRate],
      ["Total de Propostas", stats.totalProposals],
      ["Propostas Aceitas", stats.acceptedProposals.length],
      ["Valor Total em Vendas (R$)", stats.totalSales],
      ["Total de Visitas", stats.totalVisits],
      ["Visitas Realizadas", stats.completedVisits],
      ["Visitas Agendadas", stats.scheduledVisits],
      ["Total de Tarefas", stats.totalTasks],
      ["Tarefas Concluidas", stats.completedTasks],
      ["Tarefas Pendentes", stats.pendingTasks],
    ];

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-performance-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado com sucesso!" });
  }, [stats]);

  const summaryCards = [
    { label: "Total de Leads", value: stats.totalLeads, icon: Users, color: "text-sky-400", bg: "from-sky-500/20 to-sky-600/10" },
    { label: "Taxa de Conversão", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-primary", bg: "from-primary/20 to-primary/5" },
    { label: "Vendas Totais", value: formatCurrency(stats.totalSales), icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" },
    { label: "Visitas Realizadas", value: stats.completedVisits, icon: CalendarDays, color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
            Relatórios
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Exporte seus dados de performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
            <FileText className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
            <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/40 transition-all hover:border-border/60">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{card.label}</p>
                  <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl font-bold text-foreground truncate">{card.value}</p>
                </div>
                <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.bg}`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" /> Leads
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{stats.totalLeads}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fechados</span><span className="font-semibold text-emerald-400">{stats.closedLeads}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Perdidos</span><span className="font-semibold text-destructive">{stats.lostLeads}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Conversão</span><span className="font-semibold text-primary">{stats.conversionRate}%</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Propostas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{stats.totalProposals}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Aceitas</span><span className="font-semibold text-emerald-400">{stats.acceptedProposals.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor Total</span><span className="font-semibold text-primary">{formatCurrency(stats.totalSales)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-400" /> Atividades
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Visitas Realizadas</span><span className="font-semibold">{stats.completedVisits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Visitas Agendadas</span><span className="font-semibold text-violet-400">{stats.scheduledVisits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tarefas Concluídas</span><span className="font-semibold text-emerald-400">{stats.completedTasks}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tarefas Pendentes</span><span className="font-semibold text-amber-400">{stats.pendingTasks}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsTab;
