-- ============================================================================
-- FISIOFLOW AI STUDIO - DADOS DE EXEMPLO
-- Execute este SQL APÓS executar o 01_create_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. EXERCÍCIOS BÁSICOS
-- ============================================================================

INSERT INTO public.exercises (name, description, instructions, difficulty_level, duration_minutes, repetitions, sets, category, equipment_needed, active) VALUES
('Flexão de Ombro', 'Exercício básico de mobilidade do ombro', 'Lentamente levante o braço para frente até a altura do ombro, segure por 2 segundos, depois abaixe lentamente', 2, 10, 10, 3, 'ombro', '{}', true),
('Extensão de Joelho', 'Fortalecimento dos músculos quadríceps', 'Sente-se na cadeira, estenda lentamente o joelho, segure por 3 segundos, abaixe lentamente', 3, 15, 12, 3, 'joelho', '{"cadeira"}', true),
('Círculos no Tornozelo', 'Melhora a mobilidade do tornozelo', 'Sente-se confortavelmente, levante o pé do chão, gire lentamente o tornozelo em círculos', 1, 5, 10, 2, 'tornozelo', '{}', true),
('Flexões na Parede', 'Fortalecimento da parte superior do corpo', 'Fique a um braço de distância da parede, coloque as palmas contra a parede, empurre e retorne', 2, 10, 8, 2, 'corpo_superior', '{}', true),
('Elevação dos Calcanhares', 'Exercício de fortalecimento da panturrilha', 'Fique com os pés na largura dos quadris, lentamente suba na ponta dos pés, segure 2 segundos, abaixe', 2, 8, 15, 3, 'perna_inferior', '{}', true),
('Alongamento do Pescoço', 'Melhora a mobilidade do pescoço', 'Incline gentilmente a cabeça para cada lado, segure por 15 segundos', 1, 5, 4, 1, 'pescoco', '{}', true),
('Ponte de Quadril', 'Fortalece glúteos e core', 'Deite de costas, joelhos dobrados, levante os quadris, segure 3 segundos, abaixe', 3, 12, 12, 3, 'core', '{}', true),
('Rotação da Coluna Sentado', 'Melhora a mobilidade da coluna', 'Sente-se ereto, gire lentamente o tronco para um lado, segure 10 segundos, retorne ao centro', 2, 8, 6, 2, 'coluna', '{"cadeira"}', true),
('Marcha Estacionária', 'Exercício cardiovascular básico', 'Marche no lugar levantando os joelhos alternadamente', 1, 5, 30, 3, 'cardiovascular', '{}', true),
('Respiração Diafragmática', 'Exercício de respiração para relaxamento', 'Deite-se, coloque uma mão no peito e outra no abdômen, respire profundamente pelo nariz', 1, 10, 10, 1, 'respiratorio', '{}', true);

-- ============================================================================
-- 2. BASE DE CONHECIMENTO
-- ============================================================================

INSERT INTO public.knowledge_base (title, content, category, tags, status, views) VALUES
('Entendendo a Dor Lombar',
'A dor lombar é uma das razões mais comuns pelas quais as pessoas procuram profissionais de saúde. Pode variar de uma dor surda e constante a uma dor aguda e repentina.

## Causas Comuns
- Tensão muscular ou ligamentar
- Problemas de disco
- Artrite
- Osteoporose
- Má postura

## Tratamento
O tratamento da dor lombar geralmente inclui:
1. Fisioterapia
2. Exercícios de fortalecimento
3. Alongamentos
4. Educação postural
5. Técnicas de alívio da dor

## Prevenção
- Mantenha uma postura adequada
- Fortaleça os músculos do core
- Evite movimentos bruscos
- Use técnicas adequadas de levantamento',
'condicoes', '{"dor lombar", "lombalgia", "tratamento"}', 'published', 0),

('Diretrizes de Recuperação Pós-Cirúrgica',
'A recuperação após cirurgia requer atenção cuidadosa aos processos de cicatrização. Aqui estão diretrizes gerais para recuperação ideal.

## Fases da Recuperação
### Fase Aguda (0-2 semanas)
- Repouso adequado
- Controle da dor
- Prevenção de infecções
- Mobilização gradual

### Fase Subaguda (2-6 semanas)
- Aumento gradual da atividade
- Fisioterapia inicial
- Monitoramento da cicatrização

### Fase Crônica (6+ semanas)
- Retorno às atividades normais
- Fortalecimento progressivo
- Prevenção de recidivas

## Sinais de Alerta
- Aumento da dor
- Vermelhidão ou inchaço excessivo
- Febre
- Drenagem anormal

Sempre consulte seu médico se houver preocupações.',
'recuperacao', '{"cirurgia", "recuperacao", "reabilitacao"}', 'published', 0),

('Benefícios do Exercício Regular',
'A atividade física regular fornece inúmeros benefícios para a saúde, incluindo melhora da saúde cardiovascular, músculos e ossos mais fortes.

## Benefícios Físicos
- Melhora da função cardiovascular
- Aumento da força muscular
- Melhor densidade óssea
- Maior flexibilidade
- Controle de peso

## Benefícios Mentais
- Redução do estresse
- Melhora do humor
- Melhor qualidade do sono
- Aumento da autoestima
- Redução da ansiedade

## Recomendações
- 150 minutos de atividade moderada por semana
- Exercícios de fortalecimento 2x por semana
- Atividades de flexibilidade diárias
- Progressão gradual

Lembre-se: sempre consulte um profissional antes de iniciar um novo programa de exercícios.',
'bem_estar', '{"exercicio", "saude", "bem_estar"}', 'published', 0),

('Dicas de Postura Adequada',
'Uma boa postura é essencial para prevenir dor e lesões. Aqui estão pontos-chave para manter uma postura adequada ao longo do dia.

## Postura Sentada
- Pés apoiados no chão
- Joelhos em ângulo de 90°
- Costas retas e apoiadas
- Ombros relaxados
- Monitor na altura dos olhos

## Postura em Pé
- Peso distribuído igualmente
- Joelhos ligeiramente flexionados
- Pelve neutra
- Ombros para trás
- Queixo paralelo ao chão

## Postura para Dormir
- Travesseiro adequado
- Colchão firme
- Posição fetal ou de costas
- Travesseiro entre os joelhos (posição lateral)

## Dicas para o Trabalho
- Pausas a cada 30 minutos
- Alongamentos regulares
- Ajuste do ambiente de trabalho
- Fortalecimento dos músculos posturais',
'prevencao', '{"postura", "ergonomia", "prevencao"}', 'published', 0),

('Gerenciamento da Dor Crônica',
'A dor crônica afeta milhões de pessoas em todo o mundo. O gerenciamento eficaz requer uma abordagem abrangente.

## Tipos de Dor Crônica
- Dor musculoesquelética
- Dor neuropática
- Dor visceral
- Dor mista

## Estratégias de Gerenciamento
### Abordagens Físicas
- Fisioterapia
- Exercícios terapêuticos
- Termoterapia/crioterapia
- Massagem terapêutica

### Abordagens Psicológicas
- Terapia cognitivo-comportamental
- Técnicas de relaxamento
- Mindfulness
- Grupos de apoio

### Modificações do Estilo de Vida
- Sono adequado
- Nutrição balanceada
- Gerenciamento do estresse
- Atividade física regular

## Importante
O gerenciamento da dor crônica é individualizado. Trabalhe com uma equipe multidisciplinar para desenvolver o melhor plano para você.',
'gerenciamento_dor', '{"dor cronica", "gerenciamento", "tratamento"}', 'published', 0);

-- ============================================================================
-- 3. ITENS DE INVENTÁRIO
-- ============================================================================

INSERT INTO public.inventory (name, description, category, brand, condition, location, status, purchase_date, purchase_price) VALUES
('Aparelho de Ultrassom', 'Aparelho de ultrassom terapêutico para tratamento de tecidos profundos', 'equipamento', 'PhysioTech', 'excellent', 'Sala de Tratamento 1', 'available', '2024-01-15', 8500.00),
('Bolas de Exercício - Kit', 'Conjunto de 5 bolas suíças para fortalecimento do core', 'exercicio', 'FitPro', 'good', 'Sala de Exercícios', 'available', '2024-02-20', 450.00),
('Faixas Elásticas', 'Faixas de resistência com diferentes níveis para treinamento de força', 'exercicio', 'TheraBand', 'good', 'Armário de Equipamentos', 'available', '2024-03-10', 280.00),
('Compressas Quente/Frio', 'Compressas terapêuticas reutilizáveis para alívio da dor', 'terapia', 'MediTemp', 'excellent', 'Sala de Tratamento 2', 'available', '2024-01-30', 320.00),
('Goniômetro', 'Instrumento para medir amplitude de movimento articular', 'avaliacao', 'MedTools', 'good', 'Sala de Avaliação', 'available', '2023-12-05', 180.00),
('Aparelho TENS', 'Estimulador elétrico transcutâneo para alívio da dor', 'equipamento', 'PainRelief Pro', 'excellent', 'Sala de Tratamento 1', 'available', '2024-04-12', 2200.00),
('Barras Paralelas', 'Barras paralelas ajustáveis para treinamento de marcha', 'equipamento', 'RehabTech', 'good', 'Ginásio de Reabilitação', 'available', '2023-11-20', 3500.00),
('Mesa de Tratamento', 'Mesa elétrica com altura ajustável para tratamentos', 'mobiliario', 'MedTable', 'excellent', 'Sala de Tratamento 3', 'available', '2024-03-25', 4200.00),
('Pesos Livres - Conjunto', 'Conjunto de halteres de 1kg a 10kg para fortalecimento', 'exercicio', 'PowerFit', 'good', 'Sala de Musculação', 'available', '2024-02-08', 850.00),
('Laser Terapêutico', 'Aparelho de laser de baixa intensidade para cicatrização', 'equipamento', 'LaserHeal', 'excellent', 'Sala de Tratamento 2', 'available', '2024-05-03', 12000.00);

-- ============================================================================
-- 4. CATEGORIAS FINANCEIRAS (para facilitar relatórios)
-- ============================================================================

-- Inserir algumas transações de exemplo para demonstração
INSERT INTO public.finance (type, category, amount, description, payment_method, status, transaction_date) VALUES
('income', 'Consulta', 120.00, 'Consulta fisioterapêutica - avaliação inicial', 'card', 'completed', '2024-09-01'),
('income', 'Sessão', 80.00, 'Sessão de fisioterapia - fortalecimento', 'pix', 'completed', '2024-09-02'),
('income', 'Pacote', 400.00, 'Pacote 5 sessões - reabilitação pós-cirúrgica', 'transfer', 'completed', '2024-09-03'),
('expense', 'Equipamentos', 280.00, 'Compra de faixas elásticas TheraBand', 'card', 'completed', '2024-09-04'),
('expense', 'Materiais', 150.00, 'Materiais de consumo - compressas e géis', 'cash', 'completed', '2024-09-05'),
('income', 'Consulta', 120.00, 'Consulta fisioterapêutica - reavaliação', 'card', 'completed', '2024-09-06'),
('income', 'Sessão', 80.00, 'Sessão de fisioterapia - alongamento', 'pix', 'completed', '2024-09-07'),
('expense', 'Manutenção', 200.00, 'Manutenção preventiva do ultrassom', 'card', 'completed', '2024-09-08');

-- ============================================================================
-- DADOS DE EXEMPLO INSERIDOS COM SUCESSO!
--
-- Resumo do que foi criado:
-- - 10 exercícios básicos de fisioterapia
-- - 5 artigos na base de conhecimento
-- - 10 itens de inventário
-- - 8 transações financeiras de exemplo
--
-- Agora você pode testar a aplicação com dados reais!
-- ============================================================================