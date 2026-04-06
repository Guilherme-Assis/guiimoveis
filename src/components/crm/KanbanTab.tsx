import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, Mail, DollarSign, MapPin, GripVertical } from "lucide-react";

const COLUMNS: { id: string; label: string; color: string; dotColor: string }[] = [
  { id: "novo", label: "Novo", color: "border-t-sky-500", dotColor: "bg-sky-500" },
  { id: "em_contato", label: "Em Contato", color: "border-t-amber-500", dotColor: "bg-amber-500" },
  { id: "qualificado", label: "Qualificado", color: "border-t-emerald-500", dotColor: "bg-emerald-500" },
  { id: "proposta", label: "Proposta", color: "border-t-violet-500", dotColor: "bg-violet-500" },
  { id: "fechado", label: "Fechado", color: "border-t-primary", dotColor: "bg-primary" },
  { id: "perdido", label: "Perdido", color: "border-t-destructive", dotColor: "bg-destructive" },
];

const priorityDots: Record<string, string> = { baixa: "bg-muted-foreground", media: "bg-amber-400", alta: "bg-destructive" };
const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : null;

const KanbanTab = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["kanban-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("id, name, status, priority, phone, email, interest_value, preferred_neighborhoods, updated_at").order("updated_at", { ascending: false });
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("broker_leads").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
    },
    onError: () => toast({ title: "Erro ao mover lead", variant: "destructive" }),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const lead = leads.find((l: any) => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      updateStatusMutation.mutate({ id: leadId, status: newStatus });
    }
  };

  const getLeadsByStatus = (status: string) => leads.filter((l: any) => l.status === status);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnLeads = getLeadsByStatus(col.id);
          return (
            <div key={col.id} className="flex w-64 shrink-0 flex-col">
              {/* Column Header */}
              <div className={`mb-3 rounded-t-lg border-t-2 ${col.color} bg-card/50 px-3 py-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                    <span className="font-display text-xs font-semibold text-foreground">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium">{columnLeads.length}</Badge>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg p-1.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-transparent"
                    }`}
                  >
                    {columnLeads.map((lead: any, index: number) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-lg border border-border/30 bg-card p-3 transition-shadow ${
                              snapshot.isDragging ? "shadow-xl shadow-primary/10 ring-1 ring-primary/30" : "hover:border-border/50"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div {...provided.dragHandleProps} className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
                                <GripVertical className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDots[lead.priority]}`} />
                                  <p className="truncate text-xs font-semibold text-foreground">{lead.name}</p>
                                </div>
                                <div className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                                  {lead.phone && (
                                    <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{lead.phone}</span>
                                  )}
                                  {lead.email && (
                                    <span className="flex items-center gap-1 truncate"><Mail className="h-2.5 w-2.5" />{lead.email}</span>
                                  )}
                                  {lead.interest_value && (
                                    <span className="flex items-center gap-1 font-medium text-primary/80">
                                      <DollarSign className="h-2.5 w-2.5" />{formatCurrency(lead.interest_value)}
                                    </span>
                                  )}
                                  {lead.preferred_neighborhoods?.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />{lead.preferred_neighborhoods[0]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanTab;
