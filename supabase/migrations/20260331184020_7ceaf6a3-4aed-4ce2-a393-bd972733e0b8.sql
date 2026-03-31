
-- Insert mock properties with coordinates for the existing broker
INSERT INTO public.db_properties (title, type, status, availability, price, location, city, state, bedrooms, bathrooms, parking_spaces, area, land_area, description, features, image_url, images, is_highlight, slug, broker_id, latitude, longitude, virtual_tour_url) VALUES
(
  'Mansão Contemporânea com Vista Panorâmica',
  'mansao', 'venda', 'available', 18500000,
  'Jardim Europa', 'São Paulo', 'SP',
  7, 9, 8, 1200, 2500,
  'Uma obra-prima da arquitetura contemporânea com 1.200m² de área construída em um terreno de 2.500m². Cada detalhe foi meticulosamente planejado para proporcionar o mais alto padrão de conforto e sofisticação. Amplos espaços integrados com pé-direito duplo, piscina de borda infinita com aquecimento solar, spa completo, adega climatizada para 2.000 garrafas.',
  ARRAY['Piscina Infinita', 'Spa Completo', 'Adega Climatizada', 'Home Theater', 'Elevador', 'Automação Total', 'Segurança 24h', 'Heliponto'],
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
  ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'],
  true,
  'mansao-contemporanea-jardim-europa',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -23.5705, -46.6753,
  NULL
),
(
  'Cobertura Duplex com Vista para o Skyline',
  'cobertura', 'venda', 'available', 12800000,
  'Vila Nova Conceição', 'São Paulo', 'SP',
  5, 7, 6, 680, 0,
  'Cobertura duplex espetacular no coração da Vila Nova Conceição, com vista privilegiada de 360° para o Parque Ibirapuera e o skyline paulistano. Projeto de interiores assinado, com acabamentos em mármore Calacatta, marcenaria em nogueira americana e metais em ouro escovado.',
  ARRAY['Vista Panorâmica', 'Piscina com Raia', 'Terraço Gourmet', 'Sauna', 'Lareira', 'Wine Bar', '6 Vagas Cobertas'],
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
  ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200'],
  true,
  'cobertura-duplex-vila-nova-conceicao',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -23.5870, -46.6670,
  NULL
),
(
  'Villa Mediterrânea à Beira-Mar',
  'casa', 'venda', 'available', 25000000,
  'Jurerê Internacional', 'Florianópolis', 'SC',
  6, 8, 5, 950, 1800,
  'Residência exclusiva pé-na-areia em Jurerê Internacional, o endereço mais cobiçado do sul do Brasil. Arquitetura mediterrânea contemporânea com amplos espaços de convivência voltados para o mar. Piscina de borda infinita que se funde com o horizonte oceânico.',
  ARRAY['Pé na Areia', 'Piscina Infinita', 'Quadra de Tênis', 'Cozinha Gourmet', 'Pier Privativo', 'Jardim Tropical', 'Segurança 24h'],
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'],
  true,
  'villa-mediterranea-jurere',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -27.4360, -48.4930,
  'https://my.matterport.com/show/?m=SxQL3iGyoDo'
),
(
  'Residência Moderna em Alphaville',
  'casa', 'venda', 'available', 8900000,
  'Alphaville', 'Barueri', 'SP',
  5, 6, 4, 620, 1200,
  'Residência de alto padrão em condomínio fechado no Alphaville, com projeto arquitetônico arrojado que harmoniza concreto aparente, vidro e aço corten. Ampla sala de estar com lareira ecológica e pé-direito triplo.',
  ARRAY['Condomínio Fechado', 'Piscina Aquecida', 'Sauna', 'Fitness', 'Lareira Ecológica', 'Jardim Paisagístico', 'Energia Solar'],
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
  ARRAY['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200'],
  false,
  'residencia-moderna-alphaville',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -23.4950, -46.8490,
  NULL
),
(
  'Fazenda Premium Serra da Mantiqueira',
  'fazenda', 'venda', 'available', 35000000,
  'Serra da Mantiqueira', 'Campos do Jordão', 'SP',
  10, 12, 10, 2800, 500000,
  'Propriedade rural excepcional na Serra da Mantiqueira, com 50 hectares de paisagens deslumbrantes, mata nativa preservada e nascentes de água cristalina. A sede principal conta com 2.800m² em estilo colonial contemporâneo.',
  ARRAY['50 Hectares', 'Centro Equestre', 'Adega Subterrânea', 'Lago Artificial', 'Casa de Hóspedes', 'Mata Nativa', 'Nascentes', 'Heliponto'],
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
  ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200'],
  true,
  'fazenda-premium-campos-do-jordao',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -22.7396, -45.5913,
  NULL
),
(
  'Terreno Premium com Vista para o Oceano',
  'terreno', 'venda', 'available', 4500000,
  'Praia do Rosa', 'Imbituba', 'SC',
  0, 0, 0, 0, 5000,
  'Terreno exclusivo de 5.000m² com vista panorâmica de 270° para o Oceano Atlântico e a baía da Praia do Rosa. Topografia privilegiada em aclive suave, permitindo aproveitamento total da vista marítima.',
  ARRAY['Vista para o Mar', '5.000m²', 'Projeto Aprovado', 'Infraestrutura Completa', 'Acesso à Praia', 'Vegetação Preservada'],
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200',
  ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200'],
  false,
  'terreno-premium-praia-do-rosa',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -28.1234, -48.6345,
  NULL
),
(
  'Apartamento Luxo Leblon com Vista Mar',
  'apartamento', 'venda', 'available', 9200000,
  'Leblon', 'Rio de Janeiro', 'RJ',
  4, 5, 3, 320, 0,
  'Apartamento excepcional no Leblon com vista panorâmica para o mar e a Pedra da Gávea. Acabamentos de altíssimo padrão com mármore importado, piso em madeira nobre e automação completa. Varanda gourmet com churrasqueira e piscina privativa.',
  ARRAY['Vista para o Mar', 'Varanda Gourmet', 'Piscina Privativa', 'Automação', 'Lazer Completo', 'Segurança 24h'],
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
  ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'],
  true,
  'apartamento-luxo-leblon',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -22.9838, -43.2235,
  NULL
),
(
  'Casa de Praia Trancoso',
  'casa', 'aluguel', 'available', 45000,
  'Quadrado', 'Porto Seguro', 'BA',
  4, 5, 2, 380, 800,
  'Casa charmosa no Quadrado de Trancoso, um dos destinos mais exclusivos do Brasil. Arquitetura rústica-chique com amplos jardins tropicais, piscina natural e deck com vista para o mar. Perfeita para temporada de alto padrão.',
  ARRAY['Jardim Tropical', 'Piscina Natural', 'Deck com Vista', 'Churrasqueira', 'Wi-Fi', 'Ar Condicionado'],
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200',
  ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200'],
  false,
  'casa-praia-trancoso',
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  -16.5900, -39.0940,
  NULL
);

-- Insert mock blog posts (using admin user as author)
INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image_url, author_id, is_published, published_at) VALUES
(
  'Tendências do Mercado Imobiliário de Luxo em 2026',
  'tendencias-mercado-imobiliario-luxo-2026',
  'Descubra as principais tendências que estão moldando o mercado de imóveis de alto padrão no Brasil.',
  'O mercado imobiliário de luxo brasileiro segue em plena expansão em 2026, com tendências que refletem mudanças nos hábitos e desejos dos compradores de alto poder aquisitivo.

Sustentabilidade como Prioridade
A integração de tecnologias verdes deixou de ser diferencial e se tornou requisito. Painéis solares, captação de água da chuva, materiais de baixo impacto ambiental e certificações como LEED e AQUA são critérios decisivos na escolha de um imóvel premium.

Espaços Multifuncionais
O home office veio para ficar. Projetos que contemplam escritórios integrados, estúdios de gravação e espaços de coworking privativos dentro dos empreendimentos estão entre os mais procurados.

Localização e Exclusividade
Endereços consolidados como Jardim Europa, Vila Nova Conceição e Leblon continuam no topo. Porém, destinos como Trancoso, Praia do Rosa e Serra da Mantiqueira ganham cada vez mais espaço entre compradores que buscam refúgio e qualidade de vida.

Tecnologia e Automação
Casas inteligentes com automação completa, segurança biométrica, e sistemas de entretenimento integrados são o novo padrão. A integração com assistentes virtuais e IoT eleva a experiência de morar.

O investidor de luxo em 2026 busca mais do que metros quadrados — busca experiência, exclusividade e impacto positivo.',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  '109a6178-9b64-4d65-ac3d-d083423f0795',
  true,
  NOW() - INTERVAL '3 days'
),
(
  'Guia Completo: Como Investir em Imóveis de Alto Padrão',
  'guia-investir-imoveis-alto-padrao',
  'Tudo o que você precisa saber antes de fazer seu primeiro investimento em imóveis de luxo.',
  'Investir em imóveis de alto padrão é uma das formas mais seguras e rentáveis de aplicar capital. Neste guia, compartilhamos as melhores práticas para maximizar seu retorno.

Entendendo o Mercado
O mercado de luxo opera com dinâmicas próprias. Diferente do mercado convencional, a valorização de imóveis premium é mais estável e menos suscetível a crises econômicas. A escassez de terrenos em áreas nobres garante valorização contínua.

Localização é Tudo
A regra de ouro do mercado imobiliário se aplica com ainda mais força no segmento de luxo. Proximidade a centros financeiros, boas escolas, hospitais de referência e áreas verdes são fatores decisivos.

Documentação e Due Diligence
Antes de qualquer negociação, verifique a matrícula atualizada do imóvel, certidões negativas do vendedor, regularidade fiscal e urbanística. No segmento de luxo, contratar um advogado especializado é essencial.

Financiamento vs. Capital Próprio
Embora muitos compradores de luxo tenham capital próprio, o financiamento pode ser vantajoso do ponto de vista fiscal. Taxas especiais para imóveis acima de R$ 1,5 milhão estão cada vez mais competitivas.

Potencial de Valorização
Imóveis em regiões como Vila Nova Conceição (SP) valorizaram em média 12% ao ano nos últimos 5 anos. Terrenos em áreas costeiras premium apresentam valorização ainda maior.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  '109a6178-9b64-4d65-ac3d-d083423f0795',
  true,
  NOW() - INTERVAL '7 days'
),
(
  'Os 5 Bairros Mais Valorizados de São Paulo em 2026',
  '5-bairros-mais-valorizados-sao-paulo-2026',
  'Conheça os bairros paulistanos que lideram a valorização imobiliária neste ano.',
  'São Paulo concentra alguns dos endereços mais caros e cobiçados da América Latina. Confira os bairros que mais se valorizaram em 2026:

1. Jardim Europa
O bairro mais exclusivo de São Paulo mantém sua posição de liderança. Com mansões que ultrapassam R$ 20 milhões, o Jardim Europa oferece ruas arborizadas, segurança e proximidade aos melhores restaurantes e lojas da cidade.

2. Vila Nova Conceição
A vista para o Parque Ibirapuera é o grande trunfo. Coberturas duplex com vista panorâmica são as mais procuradas, com preços que variam de R$ 8 a R$ 15 milhões.

3. Itaim Bibi
O polo gastronômico e corporativo atrai jovens executivos e empresários. A região concentra os melhores restaurantes e uma vida noturna sofisticada.

4. Pinheiros
A efervescência cultural e a proximidade ao metrô fazem de Pinheiros um dos bairros mais dinâmicos. Empreendimentos boutique com design autoral são a tendência.

5. Jardins
O clássico nunca sai de moda. A região dos Jardins oferece a combinação perfeita entre comércio de luxo, cultura e residenciais de altíssimo padrão.',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200',
  '109a6178-9b64-4d65-ac3d-d083423f0795',
  true,
  NOW() - INTERVAL '14 days'
);

-- Insert mock broker reviews (using admin user as reviewer)
INSERT INTO public.broker_reviews (broker_id, user_id, rating, comment) VALUES
(
  'f48572d3-2935-4471-b283-eabbf37b9d28',
  '109a6178-9b64-4d65-ac3d-d083423f0795',
  5,
  'Excelente profissional! Muito atencioso e conhecedor do mercado de alto padrão. Nos ajudou a encontrar a casa perfeita em tempo recorde. Recomendo fortemente!'
);
