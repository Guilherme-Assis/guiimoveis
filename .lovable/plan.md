## Plano de Implementação

### 1. Dashboard com Gráficos de Performance
- Gráficos: leads por mês, taxa de conversão, visitas realizadas, comissões
- Usar Recharts (já instalado) com cards visuais premium
- Substituir o Dashboard atual básico

### 2. Pipeline Kanban de Leads
- Quadro visual com colunas: Novo → Em Contato → Qualificado → Proposta → Fechado → Perdido
- Drag & drop para mover leads entre status
- Nova aba no CRM

### 3. Gerador de Propostas em PDF
- Gerar PDF com dados do lead, imóvel e condições
- Usar jsPDF para geração client-side
- Botão na aba de propostas

### 4. Integração Google Calendar
- Requer conector Google Calendar
- Sincronizar visitas e tarefas agendadas

### Segurança
- ✅ Sem vulnerabilidades novas
- ⚠️ Ação manual: ativar Password HIBP Check

### Dependências necessárias
- `jspdf` para geração de PDF
- `@hello-pangea/dnd` para drag & drop do Kanban
