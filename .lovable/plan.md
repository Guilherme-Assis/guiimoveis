## Plano de Implementação — 9 Melhorias

### 🔧 Grupo 1 — Frontend Imediato (sem banco de dados)

**1. Comparador de Imóveis**
- Botão "Comparar" no PropertyCard
- Estado global (context) para até 3 imóveis selecionados
- Barra flutuante mostrando imóveis selecionados
- Página `/comparar` com tabela lado a lado (preço, área, quartos, banheiros, vagas, localização, features)

**2. Compartilhamento Social**
- Botões no PropertyDetail: WhatsApp, Facebook, copiar link
- WhatsApp com mensagem pré-formatada com título e preço
- Facebook share via URL
- Botão copiar link com feedback visual

**3. SEO Avançado**
- react-helmet-async para meta tags dinâmicas por imóvel
- Open Graph tags (título, descrição, imagem) para compartilhamento
- JSON-LD structured data (RealEstateListing) no PropertyDetail
- Arquivo sitemap.xml estático no public/

**4. Cache de Imagens S3**
- Melhorar o hook useS3Image com cache em memória (Map)
- Cache de URLs assinadas com TTL (10min)
- Batch prefetch para listas de imóveis
- Evitar re-requests desnecessários

**5. Galeria de Plantas Baixas**
- Nova seção no PropertyDetail para exibir plantas
- Usa campo `images` existente (ou novo campo `floor_plans` no banco)
- Visualizador com zoom

### 📊 Grupo 2 — CRM/Admin (novas queries)

**6. Dashboard de Conversão (Funil)**
- Novo componente no CRM Dashboard
- Funil visual: Lead → Contato → Visita → Proposta → Fechamento
- Taxas de conversão entre etapas
- Gráfico de barras horizontais

**7. Relatório de Performance por Corretor**
- Ranking de corretores por: imóveis vendidos, visitas realizadas, avaliação média
- Tabela com métricas e medalhas
- Filtro por período

### 📧 Grupo 3 — Requer configuração adicional

**8. Alertas por Email**
- Requer configuração de email domain
- Tabela para salvar filtros do usuário
- Edge function para enviar alertas quando novos imóveis compatíveis forem cadastrados
- ⚠️ Será implementado após configurar domínio de email

**9. Avaliação de Bairro**
- Seção no PropertyDetail com dados simulados/estáticos por bairro
- Ícones para escolas, mercados, transporte, segurança
- Notas de 1-5 por categoria
- Dados iniciais hardcoded (pode ser expandido com API futura)

### Ordem de implementação sugerida:
1. Comparador + Compartilhamento + SEO (impacto imediato no usuário)
2. Cache S3 + Galeria de Plantas (performance e conteúdo)
3. Dashboard Conversão + Relatório Corretores (gestão)
4. Avaliação de Bairro (conteúdo)
5. Alertas por Email (requer setup de domínio)
