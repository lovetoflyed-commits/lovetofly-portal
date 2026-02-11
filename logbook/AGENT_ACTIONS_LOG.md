# Agent Actions Log (Atualização obrigatória)

## 2026-02-11 (Continuação - Correção de Documentação)

- Ação: Criação do sistema de continuidade de tarefas para handoff de agentes.
- Resultado: Sistema completo implementado com CURRENT_TASK_STATUS.md como arquivo central de tracking. Novo agente agora pode ver exatamente onde o último agente parou e continuar do ponto certo sem repetir ou pular tarefas.
- Erros: Sem erros.
- Investigação: Análise do novo requisito do usuário sobre continuidade de agentes e necessidade de não repetir ou pular tarefas.
- Correção: Não aplicável (feature nova).
- Verificação: Conferir CURRENT_TASK_STATUS.md, AGENT_START_HERE.md atualizado, .github/copilot-instructions.md com workflow de handoff, TASK_STATUS_TEMPLATE.md criado, e AGENT_MANDATORY_UPDATE_RULES atualizado.

- Ação: Criação de CURRENT_TASK_STATUS.md no diretório raiz.
- Resultado: Arquivo criado com seções para: tarefas completadas, tarefa atual em progresso, subtarefas restantes, bloqueios, próxima ação, e protocolo de handoff. Inclui histórico de todas as tarefas da sessão 2026-02-11.
- Erros: Sem erros.
- Investigação: Definição da estrutura ideal para tracking de tarefas e continuidade.
- Correção: Não aplicável.
- Verificação: Conferir CURRENT_TASK_STATUS.md no root.

- Ação: Atualização de AGENT_START_HERE.md para priorizar CURRENT_TASK_STATUS.md.
- Resultado: Adicionada seção de "Agent Continuity" no topo com aviso destacado para ler CURRENT_TASK_STATUS.md PRIMEIRO. Ordem de leitura reorganizada com CURRENT_TASK_STATUS.md como prioridade #1.
- Erros: Sem erros.
- Investigação: Revisão da estrutura do arquivo para melhor destaque.
- Correção: Não aplicável.
- Verificação: Conferir AGENT_START_HERE.md seções iniciais.

- Ação: Atualização de .github/copilot-instructions.md com workflow completo de handoff.
- Resultado: Seção "MANDATORY" atualizada com CURRENT_TASK_STATUS.md como STEP 1. Instruções de "After EVERY action" expandidas para incluir atualização do task status. Nova seção "Before finishing your session (Agent Handoff)" adicionada. Checklist de workflow atualizado com 3 fases: antes de iniciar, após ação, antes de handoff. Common pitfalls atualizado incluindo "Incomplete Task Tracking".
- Erros: Sem erros.
- Investigação: Análise de onde inserir instruções de continuidade.
- Correção: Não aplicável.
- Verificação: Conferir .github/copilot-instructions.md seções atualizadas.

- Ação: Criação de TASK_STATUS_TEMPLATE.md em docs/records/active/.
- Resultado: Template completo criado com seções para: overview da tarefa, descrição, critérios de sucesso, subtarefas completadas/restantes, bloqueios, detalhes técnicos, testes, documentação, notas de handoff, e checklist de conclusão. Template reutilizável para futuras tarefas complexas.
- Erros: Sem erros.
- Investigação: Análise de elementos necessários para tracking completo de tarefas.
- Correção: Não aplicável.
- Verificação: Conferir docs/records/active/TASK_STATUS_TEMPLATE.md.

- Ação: Atualização de AGENT_MANDATORY_UPDATE_RULES_2026-01-29.md com regras de task tracking.
- Resultado: Ordem de leitura atualizada com CURRENT_TASK_STATUS.md como prioridade #1. Regra máxima expandida com 3 seções: após cada ação, e antes de finalizar sessão (handoff). Instruções detalhadas sobre o que atualizar em cada fase.
- Erros: Sem erros.
- Investigação: Revisão das regras existentes e integração das novas.
- Correção: Não aplicável.
- Verificação: Conferir docs/records/active/AGENT_MANDATORY_UPDATE_RULES_2026-01-29.md.

- Ação: Identificação de erro crítico na documentação anterior sobre configuração de banco de dados.
- Resultado: Descoberto que a documentação recém-criada estava INCORRETA ao afirmar "APENAS um banco de dados (Neon)". O projeto suporta DOIS bancos: Neon (produção) e PostgreSQL local (desenvolvimento).
- Erros: Documentação anterior muito restritiva, impedindo desenvolvimento local. Código em src/config/db.ts claramente suporta fallback para banco local com nome 'lovetofly-portal'.
- Investigação: Revisão de src/config/db.ts linhas 7-13 mostrando configuração de fallback. Busca em arquivos encontrou múltiplas referências ao banco local 'lovetofly-portal'. .env.example tinha nome ERRADO ('lovetofly_portal' com underscore ao invés de hífen).
- Correção: Atualizada documentação em .github/copilot-instructions.md, docs/records/active/DATABASE_GUIDE_2026-02-11.md, AGENT_START_HERE.md, e .env.example para refletir configuração dual correta.
- Verificação: Conferir arquivos modificados mostrando configuração dual (produção: Neon, desenvolvimento: local PostgreSQL com nome 'lovetofly-portal').

- Ação: Correção de .env.example com nome de banco incorreto.
- Resultado: Mudado DB_NAME de 'lovetofly_portal' (underscore) para 'lovetofly-portal' (hífen). Adicionada nota explicativa sobre obrigatoriedade do hífen.
- Erros: Sem erros.
- Investigação: Comparação com src/config/db.ts linha 10 que usa 'lovetofly-portal'.
- Correção: Editado .env.example para usar nome correto.
- Verificação: Conferir .env.example linha 26.

- Ação: Atualização completa de .github/copilot-instructions.md para documentar configuração dual.
- Resultado: Seção de banco de dados reescrita para clarificar: (1) Produção usa Neon PostgreSQL via DATABASE_URL, (2) Desenvolvimento local usa PostgreSQL com banco 'lovetofly-portal'. Removidas declarações incorretas sobre "apenas um banco". Adicionados exemplos de configuração para ambos os ambientes.
- Erros: Sem erros.
- Investigação: Análise de como desenvolvedores realmente usam o projeto localmente.
- Correção: Reescrita de 5 seções no arquivo de instruções.
- Verificação: Conferir .github/copilot-instructions.md seções "DATABASE CONFIGURATION" e "Database Usage Rules".

- Ação: Atualização de docs/records/active/DATABASE_GUIDE_2026-02-11.md com configuração dual.
- Resultado: Guia de banco reescrito para documentar ambas configurações (Neon e local). Adicionadas seções separadas para cada ambiente. Corrigidos exemplos de connection strings e comandos psql.
- Erros: Sem erros.
- Investigação: Revisão do guia criado anteriormente que estava incorreto.
- Correção: Editadas 6 seções do DATABASE_GUIDE.
- Verificação: Conferir DATABASE_GUIDE seções "Database Connection Details" e "Connection String Format".

- Ação: Atualização de AGENT_START_HERE.md para refletir configuração dual.
- Resultado: Seção "Contexto correto do projeto" atualizada para mencionar ambos os bancos. Regras para agentes atualizadas com instruções corretas sobre quando usar cada banco.
- Erros: Sem erros.
- Investigação: Garantir consistência com outras documentações.
- Correção: Editadas 2 seções em AGENT_START_HERE.md.
- Verificação: Conferir AGENT_START_HERE.md seções "Contexto correto do projeto" e "Regra para novos agentes".

## 2026-02-11

- Ação: Análise do problema de agentes usando banco de dados errado e não seguindo instruções.
- Resultado: Identificadas 4 causas principais: documentação dispersa (366 .md na raiz), configuração de DB em múltiplos lugares, instruções incompletas no copilot-instructions.md, e ausência de fluxo de onboarding claro.
- Erros: Sem erros.
- Investigação: Revisão de .github/copilot-instructions.md, AGENT_START_HERE.md, documentação em /docs e /documentation, src/config/db.ts, e contagem de arquivos .md na raiz.
- Correção: Não aplicável.
- Verificação: Diagnóstico completo documentado no PR.

- Ação: Atualização completa de .github/copilot-instructions.md com contexto abrangente.
- Resultado: Arquivo expandido de 33 para 340+ linhas incluindo: seção obrigatória de leitura, guia completo de configuração do banco de dados, organização de documentação, estrutura do projeto, workflows, armadilhas comuns, e checklist de workflow do agente.
- Erros: Sem erros.
- Investigação: Análise de problemas reportados e documentação existente.
- Correção: Não aplicável.
- Verificação: Conferir .github/copilot-instructions.md com as novas seções adicionadas.

- Ação: Criação de DATABASE_GUIDE_2026-02-11.md como fonte única de verdade para configuração do banco.
- Resultado: Guia abrangente de 400+ linhas criado em docs/records/active/ incluindo: política de banco único, detalhes de conexão, configuração de código, esquema do banco, gerenciamento de migrações, melhores práticas de queries, testes, e troubleshooting.
- Erros: Sem erros.
- Investigação: Consolidação de informações de NEON_SETUP.md, SETUP_AND_CONNECTIONS.md, src/config/db.ts, e .env.example.
- Correção: Não aplicável.
- Verificação: Conferir docs/records/active/DATABASE_GUIDE_2026-02-11.md.

- Ação: Atualização de AGENT_START_HERE.md com cross-references e avisos críticos.
- Resultado: Adicionada referência proeminente a copilot-instructions.md, aviso sobre não usar banco local, ordem de leitura atualizada incluindo copilot-instructions.md como primeiro item, e regras expandidas incluindo cross-reference para instruções técnicas.
- Erros: Sem erros.
- Investigação: Revisão da ordem de leitura existente e integração com novo conteúdo.
- Correção: Não aplicável.
- Verificação: Conferir AGENT_START_HERE.md linhas 1-30.

- Ação: Atualização de README.md com seção proeminente para agentes AI.
- Resultado: Adicionado aviso destacado para agentes AI no topo do README e seção expandida "AI Development" com links para AGENT_START_HERE.md, copilot-instructions.md, e DATABASE_GUIDE.
- Erros: Sem erros.
- Investigação: Análise da estrutura do README existente.
- Correção: Não aplicável.
- Verificação: Conferir README.md seção "AI Development".

- Ação: Atualização de documentation/README.md com referências ao novo guia do banco.
- Resultado: Adicionado link destacado para DATABASE_GUIDE_2026-02-11.md na seção "Setup & Configuration" e nota expandida no rodapé referenciando os 3 documentos principais para agentes.
- Erros: Sem erros.
- Investigação: Revisão da estrutura de documentação existente.
- Correção: Não aplicável.
- Verificação: Conferir documentation/README.md seção "Setup & Configuration" e nota final.

- Ação: Adição de comentário em .vscode/settings.json referenciando instruções do Copilot.
- Resultado: Comentário "AI CODING AGENTS" adicionado no topo do arquivo apontando para .github/copilot-instructions.md e AGENT_START_HERE.md.
- Erros: Sem erros.
- Investigação: Verificação de configurações existentes do VS Code.
- Correção: Não aplicável.
- Verificação: Conferir .vscode/settings.json linha 2.

- Ação: Armazenamento de 5 fatos críticos na memória do agente para sessões futuras.
- Resultado: Armazenados fatos sobre: configuração do banco de dados (usar apenas Neon via db.ts), organização de documentação (não criar arquivos na raiz), onboarding de agentes (ordem de leitura obrigatória), contexto do HangarShare (é feature, não projeto separado), e regras de migrations (nunca editar existentes).
- Erros: Sem erros.
- Investigação: Identificação dos fatos mais críticos para evitar erros futuros.
- Correção: Não aplicável.
- Verificação: Memórias armazenadas via tool store_memory confirmadas como bem-sucedidas.

## 2026-01-29
- Ação: Remoção de registro indevido em public/ads.txt (arquivo de Google AdSense).
- Resultado: ads.txt restaurado ao conteúdo original.
- Erros: Alteração feita em arquivo incorreto na etapa anterior.
- Investigação: Verificação do conteúdo do ads.txt e correção da regra de leitura.
- Correção: Movida a regra para este logbook e atualizados AGENT_START_HERE e regras obrigatórias.
- Verificação: Conferir public/ads.txt, AGENT_START_HERE.md e docs/records/active/AGENT_MANDATORY_UPDATE_RULES_2026-01-29.md.

- Ação: Consulta da lista de tarefas de reorganização do banco.
- Resultado: Próxima tarefa confirmada.
- Erros: Sem erros.
- Investigação: Leitura de docs/records/active/DB_REORG_TASKS_2026-01-29.md.
- Correção: Não aplicável.
- Verificação: Confirmar Passo 1 como etapa atual.

- Ação: Busca em registros de tarefas concluídas por origem de duplicatas.
- Resultado: Duplicatas documentadas em relatórios, sem autoria explícita.
- Erros: Sem erros.
- Investigação: Leitura de MIGRATION_CLEANUP_REPORT e SESSION_SUMMARY_2026-01-13.
- Correção: Não aplicável.
- Verificação: Conferir docs/records/reports/MIGRATION_CLEANUP_REPORT.md e docs/records/reports/SESSION_SUMMARY_2026-01-13.md.

- Ação: Consulta ao histórico Git das migrações arquivadas para identificar autoria.
- Resultado: Commit de arquivamento encontrado.
- Erros: Sem erros.
- Investigação: git log em src/migrations_archive.
- Correção: Não aplicável.
- Verificação: commit 6ecc7d4d20c5c99f4d7e288b5e00a34339270e04.

- Ação: Consulta ao histórico Git geral das migrações.
- Resultado: Histórico indica autoria única (Edson Assumpção) para mudanças nas migrações no período analisado.
- Erros: Sem erros.
- Investigação: git log em src/migrations.
- Correção: Não aplicável.
- Verificação: commits recentes listados pelo log.

- Ação: Validação de tabelas (uso no código + dados no dump).
- Resultado: Relatório gerado com status sugerido por tabela.
- Erros: Sem erros.
- Investigação: Varredura de referências no código e contagem de linhas no dump.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md.

- Ação: Explicação sobre ativação de type checking no Pylance.
- Resultado: Orientação sobre vantagens e impactos.
- Erros: Sem erros.
- Investigação: Conhecimento técnico de configuração do Pylance.
- Correção: Não aplicável.
- Verificação: Resposta entregue ao usuário.

- Ação: Recomendação sobre a melhor opção de type checking.
- Resultado: Sugestão de ativar com nível inicial suave.
- Erros: Sem erros.
- Investigação: Avaliação de impacto vs. benefício.
- Correção: Não aplicável.
- Verificação: Resposta entregue ao usuário.

- Ação: Sugestão de configurações ideais do Pylance.
- Resultado: Orientação de settings para ativação gradual.
- Erros: Sem erros.
- Investigação: Boas práticas de type checking.
- Correção: Não aplicável.
- Verificação: Resposta entregue ao usuário.

- Ação: Análise do relatório de validação do DB e definição do próximo passo.
- Resultado: Priorização das tabelas com dados e sem referência no código.
- Erros: Sem erros.
- Investigação: Leitura do relatório de validação.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md.

- Ação: Extração do conteúdo das tabelas core.
- Resultado: Relatório gerado com linhas e colunas das tabelas core.
- Erros: Sem erros.
- Investigação: Leitura do dump local.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_CORE_TABLES_CONTENT_2026-01-29.md.

- Ação: Conclusão a partir do conteúdo das tabelas core.
- Resultado: Identificados padrões de dados reais vs. logs/testes e ausência em notificações.
- Erros: Sem erros.
- Investigação: Leitura do relatório de conteúdo core.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_CORE_TABLES_CONTENT_2026-01-29.md.

- Ação: Mapeamento de uso das tabelas core no código.
- Resultado: Referências de leitura/escrita localizadas para users, memberships, moderation, access_status, activity_log e notifications.
- Erros: Sem erros.
- Investigação: Busca por queries SQL no src/.
- Correção: Não aplicável.
- Verificação: Links de referência reportados na resposta.

- Ação: Geração do PDF de mapeamento das tabelas core.
- Resultado: PDF criado para impressão em A4.
- Erros: Sem erros.
- Investigação: Varredura de leitura/escrita no código.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_CORE_TABLES_MAPPING_2026-01-29.pdf.

- Ação: Entrega do último arquivo gerado para impressão.
- Resultado: Link para o relatório de tabelas core fornecido.
- Erros: Sem erros.
- Investigação: Identificação do arquivo mais recente gerado.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_CORE_TABLES_CONTENT_2026-01-29.md.

- Ação: Correção do aviso MD056 na tabela do relatório core.
- Resultado: Linha da tabela ajustada para a contagem correta de colunas.
- Erros: Sem erros.
- Investigação: Problema no Problems tab para a linha com “Sem dados”.
- Correção: Adição de células vazias para completar a linha.
- Verificação: Sem erros no arquivo.

- Ação: Geração do PDF A4 com tabelas core, labels e tipos explicados.
- Resultado: PDF criado com layout sem sobreposição e com dados completos.
- Erros: Sem erros.
- Investigação: Leitura do dump e varredura de uso no código.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_CORE_TABLES_CONTENT_2026-01-29.pdf.

- Ação: Correção de aviso Pylance em generate_core_tables_pdf.py.
- Resultado: Tipagem ajustada e cabeçalho da tabela com Paragraphs.
- Erros: Sem erros.
- Investigação: Diagnóstico reportArgumentType no schema_table_data.
- Correção: Tipagem com List[List[Any]] e cabeçalho usando wrap_text.
- Verificação: Aviso Pylance removido.

- Ação: Ajuste do layout A4 no PDF de mapeamento core.
- Resultado: Quebra de linha e limites para evitar sobreposição em células.
- Erros: Sem erros.
- Investigação: Verificação do layout com listas longas de caminhos.
- Correção: Pequeno ajuste de estilo, quebra por linha e limite de itens.
- Verificação: docs/records/active/DB_CORE_TABLES_MAPPING_2026-01-29.pdf.

- Ação: Compactação do PDF de mapeamento para uma única página.
- Resultado: Layout em uma página A4 com tabela única e truncamento controlado.
- Erros: Sem erros.
- Investigação: Ajuste necessário para evitar desperdício de impressão.
- Correção: Redução de fonte, margens menores e coluna única por tabela.
- Verificação: docs/records/active/DB_CORE_TABLES_MAPPING_2026-01-29.pdf.

- Ação: Geração de relatório de revisão para tabelas não-core com dados.
- Resultado: Relatórios em Markdown e PDF criados.
- Erros: Sem erros.
- Investigação: Contagem de linhas no dump e busca de referências no código.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NON_CORE_TABLES_REVIEW_2026-01-29.md e docs/records/active/DB_NON_CORE_TABLES_REVIEW_2026-01-29.pdf.

- Ação: Correção do aviso MD047 no relatório de validação.
- Resultado: Arquivo termina com newline único.
- Erros: Sem erros.
- Investigação: Alerta markdownlint MD047.
- Correção: Adição de newline final.
- Verificação: docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md.

- Ação: Criação de checklist de revisão por ordem de navegação.
- Resultado: Checklist ordenado por landing, dashboard e sidebar.
- Erros: Sem erros.
- Investigação: Ordem do menu lateral em Sidebar.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item 1 (Landing Page) no checklist de navegação.
- Resultado: Componentes, rotas e tabelas mapeados.
- Erros: Sem erros.
- Investigação: LandingPage, HangarCarousel e API highlighted.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item 2 (Dashboard do Usuário) no checklist de navegação.
- Resultado: Módulos, APIs e tabelas mapeados.
- Erros: Sem erros.
- Investigação: src/app/page.tsx e HangarCarousel.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /profile (Conta) no checklist de navegação.
- Resultado: API e tabelas mapeadas para perfil.
- Erros: Sem erros.
- Investigação: src/app/profile/page.tsx e /api/user/profile.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /career (Carreira) no checklist de navegação.
- Resultado: API e tabelas mapeadas para entrada da carreira.
- Erros: Sem erros.
- Investigação: src/app/career/page.tsx e /api/career/profile.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /career/jobs (Carreira) no checklist de navegação.
- Resultado: Página usa dados mock locais; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/career/jobs/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /career/my-applications (Carreira) no checklist de navegação.
- Resultado: Página usa dados mock locais; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/career/my-applications/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /career/companies (Carreira) no checklist de navegação.
- Resultado: Página usa dados mock locais; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/career/companies/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /mentorship (Carreira) no checklist de navegação.
- Resultado: Página usa dados mock locais; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/mentorship/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /classifieds/aircraft (Classificados) no checklist de navegação.
- Resultado: API e tabelas mapeadas para anúncios de aeronaves.
- Erros: Sem erros.
- Investigação: src/app/classifieds/aircraft/page.tsx e /api/classifieds/aircraft.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /classifieds/parts (Classificados) no checklist de navegação.
- Resultado: API e tabelas mapeadas para anúncios de peças.
- Erros: Sem erros.
- Investigação: src/app/classifieds/parts/page.tsx e /api/classifieds/parts.
- Correção: Ajuste de formatação do checklist.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /classifieds/avionics (Classificados) no checklist de navegação.
- Resultado: API e tabelas mapeadas para anúncios de aviônicos.
- Erros: Sem erros.
- Investigação: src/app/classifieds/avionics/page.tsx e /api/classifieds/avionics.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /traslados e /traslados/messages no checklist de navegação.
- Resultado: APIs e tabelas mapeadas para solicitações e mensagens.
- Erros: Sem erros.
- Investigação: src/app/traslados/page.tsx, src/app/traslados/messages/page.tsx e /api/traslados/*.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /traslados/status, /traslados/owners e /traslados/pilots no checklist de navegação.
- Resultado: APIs e tabelas mapeadas para atualizações e pilotos.
- Erros: Sem erros.
- Investigação: src/app/traslados/status/page.tsx, src/app/traslados/owners/page.tsx, src/app/traslados/pilots/page.tsx e /api/traslados/updates|pilots.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /forum (Comunidade) no checklist de navegação.
- Resultado: APIs e tabelas mapeadas para fórum.
- Erros: Sem erros.
- Investigação: src/app/forum/page.tsx, src/app/forum/topics/[id]/page.tsx e /api/forum/topics*.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /courses e /simulator (Cursos e Treinamento) no checklist de navegação.
- Resultado: Páginas com dados mock; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/courses/page.tsx e src/app/simulator/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /tools, /tools/e6b, /tools/glass-cockpit e /tools/ifr-simulator no checklist de navegação.
- Resultado: Páginas com conteúdo estático; sem tabelas adicionais.
- Erros: Sem erros.
- Investigação: src/app/tools/page.tsx e src/app/tools/*/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /hangarshare e /hangarshare/owner/register no checklist de navegação.
- Resultado: APIs e tabelas mapeadas; rota /hangarshare/bookings não encontrada.
- Erros: Sem erros.
- Investigação: src/app/hangarshare/page.tsx, src/app/hangarshare/owner/register/page.tsx e /api/hangarshare/owner/validate-documents.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução do item /logbook no checklist de navegação.
- Resultado: APIs e tabela mapeadas para registros de voo.
- Erros: Sem erros.
- Investigação: src/app/logbook/page.tsx e /api/logbook*.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Execução dos itens /weather e /weather/radar no checklist de navegação.
- Resultado: APIs sem DB e conteúdos externos mapeados.
- Erros: Sem erros.
- Investigação: src/app/weather/page.tsx e src/app/weather/radar/page.tsx.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Atualização dos itens / (Dashboard) e /shop no checklist de navegação.
- Resultado: Dashboard marcado como coberto; rota /shop não encontrada.
- Erros: Sem erros.
- Investigação: checklist e referências no menu lateral.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Consolidação por página e addendum de tabelas não-core.
- Resultado: Relatório de consolidação e addendum gerados.
- Erros: Sem erros.
- Investigação: Checklist e relatório de validação do DB.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CONSOLIDATION_2026-01-30.md e docs/records/active/DB_NON_CORE_TABLES_REVIEW_ADDENDUM_2026-01-30.md.

- Ação: Classificação de ação por tabela (manter/revisar/arquivar).
- Resultado: Sugestões adicionadas ao relatório de consolidação.
- Erros: Sem erros.
- Investigação: Consolidação por navegação.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CONSOLIDATION_2026-01-30.md.

- Ação: Geração do PDF A4 do checklist de navegação.
- Resultado: PDF criado para impressão.
- Erros: Sem erros.
- Investigação: Checklist markdown atual.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.pdf.

- Ação: Correção do MD010 no checklist de navegação.
- Resultado: Tabs substituídas por espaços.
- Erros: Sem erros.
- Investigação: Alerta markdownlint MD010.
- Correção: Remoção de hard tabs nas listas.
- Verificação: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.md.

- Ação: Criação de lista de ações pendentes para concluir o trabalho do DB.
- Resultado: Checklist de ações gerado.
- Erros: Sem erros.
- Investigação: Checklist de navegação e consolidação.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_ACTIONS_2026-01-30.md.

- Ação: Criação de checklists individuais por seção de navegação.
- Resultado: Arquivos individuais gerados para cada seção do site.
- Erros: Sem erros.
- Investigação: Checklist principal de navegação.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_SECTION_*_2026-01-30.md.

- Ação: Criação de lista de rotas a criar/ajustar.
- Resultado: Arquivo com rotas ausentes e ações recomendadas.
- Erros: Sem erros.
- Investigação: Checklist de navegação.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_ROUTE_FIXES_2026-01-30.md.

- Ação: Verificação de tabelas ausentes no dump.
- Resultado: Relatório de presença/contagem gerado.
- Erros: Sem erros.
- Investigação: Dump SQL local.
- Correção: Não aplicável.
- Verificação: docs/records/active/DB_NAV_ORDER_DUMP_CHECK_2026-01-30.md.

## 2026-01-30
- Ação: Correção de filtros e parâmetros no relatório de desempenho por aeródromo.
- Resultado: Query do relatório passou a usar parâmetros consistentes para filtros e mínimos.
- Erros: Sem erros.
- Investigação: Rota de relatório de aeródromos com placeholders inconsistentes.
- Correção: Ajuste no builder de filtros e parâmetros.
- Verificação: src/app/api/admin/hangarshare/reports/aerodromes/route.ts.

- Ação: Implementação do relatório de desempenho por aeródromo com filtros, gráficos e tabela.
- Resultado: Página agora carrega dados reais, aplica filtros e exibe comparativos.
- Erros: Sem erros.
- Investigação: Página placeholder anterior para “Desempenho por Aeródromo”.
- Correção: UI completa com filtros, cards, gráficos e listagem.
- Verificação: src/app/admin/hangarshare/reports/aerodromes/page.tsx.

- Ação: Remoção do filtro dedicado por ICAO no relatório de aeródromos.
- Resultado: Mantida apenas a busca geral para consultas por ICAO e demais campos.
- Erros: Sem erros.
- Investigação: Campo ICAO apresentava inconsistências de filtro.
- Correção: Remoção do campo e ajuste do estado de filtros.
- Verificação: src/app/admin/hangarshare/reports/aerodromes/page.tsx.

- Ação: Adição de exportação do relatório de aeródromos em CSV.
- Resultado: Exportação disponível com base nos filtros aplicados.
- Erros: Sem erros.
- Investigação: Solicitação de função de exportação.
- Correção: Botão de exportar e geração de CSV no cliente.
- Verificação: src/app/admin/hangarshare/reports/aerodromes/page.tsx.

- Ação: Adição de exportação do relatório de aeródromos em PDF.
- Resultado: Exportação PDF disponível com resumo e tabela completa.
- Erros: Sem erros.
- Investigação: Solicitação de exportação em PDF.
- Correção: Geração de PDF com jsPDF e autoTable.
- Verificação: src/app/admin/hangarshare/reports/aerodromes/page.tsx.

- Ação: Implementação do relatório “Receita por Anunciante” com layout padrão.
- Resultado: Página agora usa filtros, gráficos, exportação e tabela detalhada.
- Erros: Sem erros.
- Investigação: Página placeholder anterior de receita por anunciante.
- Correção: Nova UI e rota dedicada para dados do relatório.
- Verificação: src/app/admin/hangarshare/reports/owners-revenue/page.tsx e src/app/api/admin/hangarshare/reports/owners-revenue/route.ts.

- Ação: Implementação do relatório “Tendências Temporais” com layout padrão.
- Resultado: Página agora usa filtros, gráficos, exportação e tabela detalhada por dia.
- Erros: Sem erros.
- Investigação: Página placeholder anterior de tendências.
- Correção: Nova UI e rota dedicada para dados do relatório.
- Verificação: src/app/admin/hangarshare/reports/trends/page.tsx e src/app/api/admin/hangarshare/reports/trends/route.ts.

- Ação: Implementação do relatório “Satisfação de Usuários” com layout padrão.
- Resultado: Página agora usa filtros, gráficos, exportação e tabela detalhada por aeródromo.
- Erros: Sem erros.
- Investigação: Página placeholder anterior de satisfação.
- Correção: Nova UI e rota dedicada para dados do relatório.
- Verificação: src/app/admin/hangarshare/reports/satisfaction/page.tsx e src/app/api/admin/hangarshare/reports/satisfaction/route.ts.

- Ação: Correção do arquivo de satisfação após corrupção de conteúdo.
- Resultado: Imports, estrutura e tipagens restauradas; erros de parsing e tipos resolvidos.
- Erros: Sem erros.
- Investigação: Arquivo continha blocos duplicados e fechamento incorreto.
- Correção: Reescrita do cabeçalho e ajustes de tipagem no formatter.
- Verificação: src/app/admin/hangarshare/reports/satisfaction/page.tsx.

- Ação: Ajuste da Central de Verificações para buscar dados mesmo sem registros em hangar_owner_verification.
- Resultado: Fallback para hangar_owners com mapeamento de status aprovado/rejeitado/pendente.
- Erros: Sem erros.
- Investigação: Tabela hangar_owner_verification vazia resultava em listagens vazias.
- Correção: Fallback por status usando hangar_owners e paginação correta.
- Verificação: src/app/api/admin/verifications/route.ts.

- Ação: Atualização da lista e filtros da Central de Verificações.
- Resultado: Itens exibem nome, empresa, e-mail, telefone, data e plano; filtros por esses campos.
- Erros: Sem erros.
- Investigação: Necessidade de exibir dados completos e filtrar por campos-chave.
- Correção: Inclusão de phone/plan na API e filtros client-side.
- Verificação: src/app/admin/verifications/page.tsx e src/app/api/admin/verifications/route.ts.

- Ação: Ajuste da API de verificações para tolerar colunas ausentes em users.
- Resultado: Seleção dinâmica de phone/plan evita erro de coluna inexistente.
- Erros: Sem erros.
- Investigação: Falha no fetch das verificações após inclusão de novos campos.
- Correção: Detecção de colunas e seleção segura.
- Verificação: src/app/api/admin/verifications/route.ts.

- Ação: Correção de hidratação e adição de botões de filtros na Central de Verificações.
- Resultado: Renderização consistente no client e controles de aplicar/limpar filtros disponíveis.
- Erros: Sem erros.
- Investigação: Mismatch SSR/CSR e ausência dos botões de filtro.
- Correção: Guard de montagem + filtros rascunho/aplicados.
- Verificação: src/app/admin/verifications/page.tsx.

- Ação: Desativação da Central de Verificações e remoção do atalho em Ações Rápidas.
- Resultado: Página redireciona para o painel HangarShare; botão de Verificações Pendentes removido.
- Erros: Sem erros.
- Investigação: Página redundante em relação às abas do painel.
- Correção: Substituição da página por redirect e remoção do link.
- Verificação: src/app/admin/verifications/page.tsx e src/app/admin/hangarshare/page.tsx.

## 2026-01-31
- Ação: Ajuste da mensagem de conflito ao tentar confirmar reserva com datas indisponíveis.
- Resultado: Checkout exibe mensagem amigável para conflitos de datas (HTTP 409).
- Erros: Sem erros.
- Investigação: Console indicou 409 em /api/hangarshare/booking/confirm.
- Correção: Mensagem específica para conflito no checkout.
- Verificação: src/app/hangarshare/booking/checkout/page.tsx.

- Ação: Prevenção de duplicatas em reservas confirmadas durante o pagamento.
- Resultado: Confirm endpoint reutiliza reserva recente e Stripe PaymentIntent; checkout evita chamadas duplicadas.
- Erros: Sem erros.
- Investigação: Duplicatas observadas nas reservas confirmadas (mesmas datas/hangar).
- Correção: Guardas de idempotência no endpoint e proteção contra duplo init no checkout.
- Verificação: src/app/api/hangarshare/booking/confirm/route.ts, src/app/hangarshare/booking/checkout/page.tsx.

- Ação: Adição de botão "Ver Minhas Reservas" na confirmação de pagamento.
- Resultado: Usuário pode ir direto para a lista de reservas após o pagamento.
- Erros: Sem erros.
- Investigação: Solicitação de navegação direta após confirmação.
- Correção: Inclusão do botão na página de sucesso.
- Verificação: src/app/hangarshare/booking/success/page.tsx.

- Ação: Correção do cancelamento de reservas para não depender de colunas inexistentes.
- Resultado: Cancelamento atualiza apenas status e updated_at sem erro de colunas ausentes.
- Erros: Sem erros.
- Investigação: Erro 500 no endpoint /api/hangarshare/booking/cancel.
- Correção: Remoção de refund_amount/refund_id/cancellation_reason nos updates.
- Verificação: src/app/api/hangarshare/booking/cancel/route.ts.

- Ação: Ajuste da listagem de reservas para mostrar confirmadas por padrão e histórico sob demanda.
- Resultado: Estado vazio com ações e botão para ver reservas anteriores; acesso rápido a nova reserva.
- Erros: Sem erros.
- Investigação: Solicitação de UX para reservas atuais e histórico.
- Correção: Filtros de status e CTAs na página de reservas.
- Verificação: src/app/profile/bookings/page.tsx.

- Ação: Correção de hidratação no CTA de HangarShare.
- Resultado: CTA dependente de autenticação rende consistente entre servidor e cliente.
- Erros: Sem erros.
- Investigação: Erro de hydration mismatch no CTA "Anunciar Meu Hangar".
- Correção: Renderização condicionada após mount do cliente.
- Verificação: src/app/hangarshare/page.tsx.

- Ação: Correção de erro 500 ao carregar favoritos do HangarShare.
- Resultado: Campo airport_name não depende mais de coluna inexistente.
- Erros: Sem erros.
- Investigação: Erro "column ai.name does not exist".
- Correção: Uso de hl.icao_code como airport_name no retorno de favoritos.
- Verificação: src/app/api/hangarshare/favorites/route.ts.

- Ação: Adição de acesso aos favoritos de HangarShare no menu lateral.
- Resultado: Link para /hangarshare/favorites disponível para usuários autenticados.
- Erros: Sem erros.
- Investigação: Solicitação de acesso à lista de favoritos.
- Correção: Inclusão do item no sidebar.
- Verificação: src/components/Sidebar.tsx.

- Ação: Correção de mapeamento de campos na lista de favoritos.
- Resultado: Preço e dimensões exibidos com fallback quando dados não existem.
- Erros: Sem erros.
- Investigação: Campos vazios/NaN na tela de favoritos.
- Correção: Uso de daily_rate/monthly_rate e dimensões máximas com valores padrão.
- Verificação: src/app/hangarshare/favorites/page.tsx.

- Ação: Normalização de campos no detalhe do hangar para compatibilidade com o payload da API.
- Resultado: ICAO, tamanho e dimensões passam a aparecer corretamente na página de detalhes.
- Erros: Sem erros.
- Investigação: Campos vazios ao abrir detalhes via favoritos.
- Correção: Mapeamento de icaoCode/hangarSizeSqm/max*Meters e isAvailable para o modelo esperado.
- Verificação: src/app/hangarshare/listing/[id]/page.tsx.

- Ação: Atualização do status de verificação de proprietários ao aprovar no admin.
- Resultado: Badge de proprietários passa a exibir “Verificado” após aprovação.
- Erros: Sem erros.
- Investigação: Status permanecia “Pendente” mesmo após aprovação.
- Correção: Atualização de verification_status para 'verified' no endpoint de aprovação.
- Verificação: src/app/api/admin/hangarshare/owners/[id]/verify/route.ts.

- Ação: Pré-visualização de documentos em modal na revisão de proprietários.
- Resultado: Botão “Visualizar” abre modal com documento ao invés de nova aba.
- Erros: Sem erros.
- Investigação: Visualização abria 404 em nova aba.
- Correção: Modal com preview inline para PDF/imagens e fallback para download.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Inclusão de opções de notificação no pedido de reenvio de documentos.
- Resultado: Admin escolhe envio por e-mail, dashboard ou ambos (default marcado em ambos).
- Erros: Sem erros.
- Investigação: Necessidade de controlar canais de notificação no reenvio.
- Correção: Modal com checkboxes e envio condicional no endpoint de reenvio, com e-mail via Resend quando marcado.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx, src/app/api/admin/hangarshare/owner-documents/[documentId]/request-reupload/route.ts.

- Ação: Registro de tarefa pendente para templates de e-mail do sistema.
- Resultado: Checklist atualizado com configuração futura de e-mails.
- Erros: Sem erros.
- Investigação: Necessidade de templates antes de ativar envios completos.
- Correção: Item adicionado no checklist de ações.
- Verificação: docs/records/active/DB_NAV_ORDER_ACTIONS_2026-01-30.md.

- Ação: Ajuste das ações no rodapé e inclusão de alteração de status no perfil do proprietário.
- Resultado: Botões renomeados e novo modal de alteração de status disponível.
- Erros: Sem erros.
- Investigação: Necessidade de mudar status sem entrar no modo de edição.
- Correção: Botão “Alterar Status” e atualização via PATCH.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Exibição de documentos ausentes e upload manual pelo admin.
- Resultado: Documentos faltantes aparecem com status “não enviado” e opção de upload/reenvio.
- Erros: Sem erros.
- Investigação: Documentos não enviados não apareciam na lista.
- Correção: Placeholders no endpoint de detalhes e novo endpoint de upload admin.
- Verificação: src/app/api/admin/hangarshare/owners/[id]/details/route.ts, src/app/admin/hangarshare/owners/[id]/page.tsx, src/app/api/admin/hangarshare/owner-documents/upload/route.ts.

- Ação: Remoção de duplicidade de caixas de documentos na revisão de proprietários.
- Resultado: Lista passa a exibir somente os documentos do owner_documents (em português), sem duplicatas.
- Erros: Sem erros.
- Investigação: Documentos apareciam duas vezes por mistura com hangar_owner_verification.
- Correção: Uso de documentos legados apenas quando owner_documents não está disponível.
- Verificação: src/app/api/admin/hangarshare/owners/[id]/details/route.ts.

- Ação: Ajuste de upload admin para fallback de storage local sem token do Vercel Blob.
- Resultado: Upload de documentos no admin funciona mesmo sem BLOB_READ_WRITE_TOKEN.
- Erros: Sem erros.
- Investigação: Upload falhava com mensagem genérica ao enviar arquivo.
- Correção: Fallback para storage local e retorno de erro detalhado.
- Verificação: src/utils/storage.ts, src/app/api/admin/hangarshare/owner-documents/upload/route.ts.

- Ação: Persistência de uploads locais em disco para evitar URLs gigantes.
- Resultado: Upload local gera caminho em /public/uploads, evitando limite do file_path.
- Erros: Sem erros.
- Investigação: Erro “value too long for type character varying(500)” com data URL.
- Correção: uploadToLocal agora escreve arquivo em disco e retorna URL curta.
- Verificação: src/utils/storage.ts.

- Ação: Padronização dos botões nos cartões de documentos do proprietário.
- Resultado: Todos os cartões exibem Visualizar, Enviar arquivo, Aprovar, Rejeitar e Solicitar reenvio de forma consistente.
- Erros: Sem erros.
- Investigação: Botões desapareciam após aprovar e cartões variavam por status.
- Correção: Exibição uniforme dos botões, com bloqueio apenas quando o arquivo está indisponível.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Ajuste de bloqueio dos botões Aprovar/Rejeitar.
- Resultado: Botões ficam ativos para documentos existentes e apenas desabilitam para itens “não enviados”.
- Erros: Sem erros.
- Investigação: Botões apareciam desabilitados mesmo com arquivo disponível.
- Correção: Remoção do bloqueio por URL indisponível.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Correção do botão Visualizar e padronização de status dos documentos.
- Resultado: Visualizar habilita com arquivos locais e status segue Pendente/Verificado/Rejeitado/Não Enviado.
- Erros: Sem erros.
- Investigação: URLs locais eram bloqueadas e status variavam entre cartões.
- Correção: Permitir /owner-documents e mapear status para português.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Ajuste da visualização de PDFs no modal de documentos.
- Resultado: PDFs renderizam via object com fallback e link para abrir em nova aba.
- Erros: Sem erros.
- Investigação: PDF aparecia em branco no modal.
- Correção: Uso de object/embed e link de abertura externa.
- Verificação: src/app/admin/hangarshare/owners/[id]/page.tsx.

- Ação: Correção do preço ausente na aba de hangares do admin HangarShare.
- Resultado: Campo de preço mensal volta a exibir valores no listing.
- Erros: Sem erros.
- Investigação: UI esperava monthly_price, API retornava monthly_rate.
- Correção: Alias monthly_rate para monthly_price (e daily_rate para price).
- Verificação: src/app/api/admin/hangarshare/listings/route.ts.

- Ação: Correção de título e localização ausentes na aba de hangares do admin.
- Resultado: Campos de título e localização passam a preencher corretamente.
- Erros: Sem erros.
- Investigação: UI esperava title/location_city e API não retornava.
- Correção: Adicionados aliases title e location_city no endpoint.
- Verificação: src/app/api/admin/hangarshare/listings/route.ts.

- Ação: Filtros de busca e status na aba de hangares do admin.
- Resultado: Listagem permite filtrar por texto e status para localizar itens rapidamente.
- Erros: Sem erros.
- Investigação: Necessidade de localizar anúncios específicos em listas grandes.
- Correção: Campo de busca e select de status com filtro client-side.
- Verificação: src/app/admin/hangarshare/page.tsx.

- Ação: Inclusão de ICAO na listagem e na busca da aba de hangares.
- Resultado: ICAO aparece como coluna e é pesquisável no filtro.
- Erros: Sem erros.
- Investigação: ICAO é o principal localizador para anúncios.
- Correção: Coluna adicionada e busca ajustada.
- Verificação: src/app/admin/hangarshare/page.tsx.

- Ação: Inclusão do ICAO no endpoint de listagens do admin.
- Resultado: Valores ICAO passam a ser enviados para a tabela do admin.
- Erros: Sem erros.
- Investigação: Coluna estava vazia por ausência no SELECT.
- Correção: Adicionado hl.icao_code na query.
- Verificação: src/app/api/admin/hangarshare/listings/route.ts.

- Ação: Ativação das seções de análises detalhadas nos relatórios HangarShare.
- Resultado: Links passam a abrir páginas dedicadas com resumo do período.
- Erros: Sem erros.
- Investigação: Links de análises apontavam para "#".
- Correção: Rotas criadas e links atualizados.
- Verificação: src/app/admin/hangarshare/reports/page.tsx, src/app/admin/hangarshare/reports/*/page.tsx.

- Ação: Upload e remoção manual de fotos de hangares no admin.
- Resultado: Admin pode enviar e remover fotos diretamente no detalhe do anúncio.
- Erros: Sem erros.
- Investigação: Necessidade de gestão manual de fotos no admin.
- Correção: Endpoint de fotos e botões de upload/remoção.
- Verificação: src/app/api/admin/hangarshare/listings/[id]/photos/route.ts, src/app/admin/hangarshare/listings/[id]/page.tsx.

- Ação: Leitura dos arquivos de instruções e registros de deploy.
- Resultado: Instruções e restrições de charts confirmadas.
- Erros: Sem erros.
- Investigação: Leitura de documentation/DEPLOYMENT.md, DEPLOYMENT_JANUARY_15_2026.md e NEXT_DEPLOY_REPORT.md.
- Correção: Não aplicável.
- Verificação: Arquivos mencionados acima.

- Ação: Preparação do deploy via GitHub com exclusão de charts.
- Resultado: Commit 8496b6a criado e enviado para origin/main; charts excluídos do conteúdo do deploy.
- Erros: Sem erros.
- Investigação: git status e verificação dos padrões de exclusão para charts.
- Correção: Reset dos caminhos de charts no índice.
- Verificação: git log (commit 8496b6a) e push para origin/main.

- Ação: Registro do conteúdo do deploy em arquivo de records.
- Resultado: Registro criado em docs/records/deployment/DEPLOYMENT_RECORD_2026-01-31.md.
- Erros: Sem erros.
- Investigação: Lista de mudanças do commit e escopo solicitado pelo usuário.
- Correção: Não aplicável.
- Verificação: docs/records/deployment/DEPLOYMENT_RECORD_2026-01-31.md.

- Ação: Remoção do box/carrossel HangarShare na landing page pré-login.
- Resultado: Seção HangarShare com carrossel removida da landing page.
- Erros: Sem erros.
- Investigação: Identificação do componente LandingPage como página pré-login.
- Correção: Remoção do import `HangarCarousel` e da seção correspondente.
- Verificação: src/components/LandingPage.tsx.

## 2026-02-01
- Ação: Correção de logging administrativo para tolerar ausência da coluna details.
- Resultado: Log tenta inserir em details e faz fallback usando new_value quando coluna não existe.
- Erros: Sem erros.
- Investigação: Erros 42703 ao inserir em admin_activity_log.
- Correção: Fallback no logAdminAction.
- Verificação: src/utils/adminAuth.ts.

- Ação: Validação de documentId nas rotas de aprovação/rejeição de documentos.
- Resultado: IDs inválidos retornam 400 e não geram erro 500.
- Erros: Sem erros.
- Investigação: Erro NaN na aprovação de documentos.
- Correção: Validação numérica e uso do id real do documento no log.
- Verificação: src/app/api/admin/hangarshare/owner-documents/[documentId]/approve/route.ts, src/app/api/admin/hangarshare/owner-documents/[documentId]/reject/route.ts.

- Ação: Criação de migração para adicionar coluna details em admin_activity_log.
- Resultado: Migração 092 criada para suporte a metadados estruturados.
- Erros: Sem erros.
- Investigação: Schema sem coluna details.
- Correção: ALTER TABLE com ADD COLUMN IF NOT EXISTS.
- Verificação: src/migrations/092_add_admin_activity_log_details.sql.

- Ação: Correção do fallback de log admin para usar ipAddress/userAgent no escopo correto.
- Resultado: Fallback não gera ReferenceError.
- Erros: Sem erros.
- Investigação: Erro ReferenceError: ipAddress is not defined no fallback.
- Correção: Moveu ipAddress e userAgent para o escopo da função.
- Verificação: src/utils/adminAuth.ts.

- Ação: Execução das migrações do banco.
- Resultado: Migrations complete; nenhuma nova migração aplicada.
- Erros: Avisos de timestamp e warning de module type em migrações .js.
- Investigação: Execução de npm run migrate:up -- --no-check-order.
- Correção: Não aplicável.
- Verificação: Saída do comando de migração.

- Ação: Remoção apenas do carrossel HangarShare na landing page pré-login.
- Resultado: Apenas o componente do carrossel foi removido; seção e layout mantidos.
- Erros: Sem erros.
- Investigação: Confirmação do trecho em LandingPage.
- Correção: Remoção do uso do componente e do import.
- Verificação: src/components/LandingPage.tsx.
