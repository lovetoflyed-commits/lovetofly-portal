# Relatório de Exportação de Gerenciamento de Usuários – Plano de Implementação

**Status**: Pronto para Revisão e Aprovação  
**Criado**: 2026-02-10  
**Módulo Alvo**: Painel de Gerenciamento de Usuários Admin (`/admin/users`)

---

## 1. Visão Geral e Objetivos

### Estado Atual
O módulo de gerenciamento de usuários do administrador fornece:
- Busca de usuários e paginação (20 usuários por página)
- Filtro de usuários por status (todos, negócios, equipe, individual, banido, suspenso, aviso, inativo)
- Edição de usuários (alterações de função)
- Ações de moderação (avisos, multas, suspensões, banimentos)
- Dados abrangentes de usuários: 18+ campos por usuário

### Recurso Proposto
Adicionar a capacidade de **gerar e exportar relatórios de gerenciamento de usuários** em múltiplos formatos (CSV, PDF, Excel) com:
- Seleção flexível de campos (escolha quais dados do usuário incluir)
- Preservação de filtros (aplicar filtros atuais aos dados do relatório)
- Filtro de intervalo de datas (opcional)
- Capacidade de exportação em lote (todos os usuários correspondentes aos critérios)
- Registro de auditoria para todas as exportações

### Objetivos
1. Fornecer aos funcionários não técnicos geração fácil de relatórios
2. Permitir análise de dados e relatórios de conformidade
3. Suportar operações comerciais (agendamento de pessoal, listas de comunicação, etc.)
4. Manter registros de auditoria para segurança e conformidade
5. Lidar com grandes conjuntos de dados de forma eficiente (1000+ usuários)

---

## 2. Visão Geral da Arquitetura

### Design do Sistema
```
Interface do Usuário (UserManagementPanel)
    ↓
    ├── Estado de Busca/Filtro (existente)
    ├── Botão Exportar (novo)
    └── Diálogo Modal de Exportação (novo)
         ↓
    Gateway de API (/api/admin/users/export)
         ↓
    ├── Construtor de Consultas (aplicar filtros ao banco de dados)
    ├── Formatador de Dados (converter para formato solicitado)
    └── Gerador de Arquivo (CSV/PDF/Excel)
         ↓
    Consulta Banco de Dados (PostgreSQL)
    [Aplicar busca + filtros + intervalo de datas]
    
    ↓ Fluxo de Resposta ↓
    
    Download de Arquivo para Cliente
    +
    Entrada de Log de Auditoria (tabela admin_audit_logs)
```

### Componentes-Chave

#### Frontend (Componentes React)
1. **BotãoExportar**: Aciona o modal de exportação
2. **ModalExportação**: Diálogo para configuração de exportação
   - Menu suspenso de seleção de formato (CSV, PDF, Excel)
   - Caixas de seleção de campos (selecionar quais colunas de usuário incluir)
   - Entradas de intervalo de datas (opcional)
   - Visualização dos dados a serem exportados
   - Botão Exportar

#### Backend (Rotas de API)
1. **GET `/api/admin/users/export/fields`**: Retorna campos disponíveis para exportação
2. **POST `/api/admin/users/export`**: Gera e retorna arquivo
   - Entrada: formato, campos selecionados, filtros, intervalo de datas
   - Saída: Stream de arquivo binário com cabeçalhos apropriados
   - Efeito colateral: Registra ação de exportação na tabela de auditoria

#### Componentes do Banco de Dados
1. **Consulta**: Consulta de busca modificada com campos específicos de exportação
2. **Registro de Auditoria**: Registro na tabela `admin_audit_logs` existente
   - Ação: 'user_export'
   - Detalhes: Formato, contagem de campos, contagem de usuários, filtros aplicados

---

## 3. Campos de Dados Disponíveis para Exportação

### Campos Principais de Usuário (Sempre Disponíveis)
- `id` - UUID do Usuário
- `name` - Nome Completo (Primeiro + Último concatenados)
- `email` - Endereço de E-mail
- `user_type` - individual | business
- `user_type_verified` - Booleano
- `created_at` - Data de criação da conta
- `updated_at` - Última atualização do perfil
- `role` - user | admin | staff | partner | owner | master
- `plan` - Free | Basic | Pro | Enterprise (ou personalizado)

### Campos de Atividade e Status
- `last_activity_at` - Timestamp da última atividade/login
- `days_inactive` - Dias calculados desde a última atividade
- `access_level` - Active | Restricted | Suspended | Banned
- `access_reason` - Explicação do nível de acesso atual
- `is_banned` - Booleano

### Campos de Moderação
- `active_warnings` - Contagem de registros de aviso ativos
- `active_strikes` - Contagem de registros de multa ativos
- `suspension_status` - Se suspenso, data de término

### Campos de Perfil de Aviação
- `aviation_role` - Pilot | Mechanic | Student | Instructor | etc.
- `total_flight_hours` - Se preenchido no perfil do usuário
- `pic_hours` - Horas de PIC (se disponível)
- `medical_certificate_class` - First | Second | Special (se disponível)

### Campos Específicos de Negócios
- `cnpj` - Número CNPJ (se usuário comercial)
- `business_name` - Nome do negócio (se usuário comercial)
- `business_verified_at` - Timestamp de verificação (da tabela business_users)
- `business_type` - Tipo de negócio (se usuário comercial)

### Totais (Campos de Resumo)
- `total_jobs_posted` - Se acompanhado
- `total_applications_received` - Se acompanhado
- `membership_status` - Active | Inactive | Suspended

**Total de Campos Disponíveis**: 25+ campos (usuário pode selecionar subconjunto)

---

## 4. Fluxo de Trabalho Proposto e Recursos

### Fluxo de Experiência do Usuário

```
1. Admin navega para /admin/users
   ↓
2. (Opcional) Aplicar filtros e busca para restringir conjunto de dados
   - Filtros atuais disponíveis:
     * Status: Todos, Negócios, Equipe, Individual, Banido, Suspenso, Aviso, Inativo
     * Busca: Por e-mail, nome, sobrenome
   ↓
3. Clique no botão "Exportar Relatório" (novo)
   ↓
4. Modal de Exportação abre com:
   - Seletor de formato: CSV / PDF / Excel
   - Lista de verificação de campos (25+ campos, agrupados por categoria)
   - Filtro de intervalo de datas opcional
   - Visualização de dados (primeiras 5 linhas)
   - Botão "Gerar e Baixar"
   ↓
5. Sistema gera arquivo
   - Aplica todos os filtros atuais + busca
   - Inclui apenas campos selecionados
   - Formata dados apropriadamente para tipo de arquivo
   ↓
6. Arquivo baixa para o computador do usuário
   ↓
7. Sistema registra ação de exportação:
   - Quem: ID do usuário admin
   - Quando: Timestamp
   - O quê: Formato, contagem de campos, contagem de usuários
   - Como: Filtros atuais aplicados
```

### Formatos de Relatório

#### CSV (Padrão)
- **Vantagens**: Compatibilidade universal, Excel/Google Sheets, análise fácil, menor tamanho de arquivo
- **Desvantagens**: Sem formatação, texto simples
- **Implementação**: Use csv-stringify ou formatação nativa de CSV
- **Nomenclatura de Arquivo**: `users-export-YYYY-MM-DD.csv`

#### Excel (XLSX)
- **Vantagens**: Aparência profissional, formatação, suporte a múltiplas abas, pronto para gráficos
- **Desvantagens**: Tamanho maior de arquivo, requer biblioteca (xlsx)
- **Implementação**: Use pacote `xlsx` ou `exceljs`
- **Recursos**: Cabeçalhos de coluna, auto-largura, linha de cabeçalho congelada
- **Nomenclatura de Arquivo**: `users-export-YYYY-MM-DD.xlsx`

#### PDF
- **Vantagens**: Profissional, pronto para impressão, apenas leitura, padronizado
- **Desvantagens**: Tamanho maior de arquivo, menos dados por página (requer paginação)
- **Implementação**: Use biblioteca `jsPDF` ou `pdfkit`
- **Layout**: Formato de tabela com cabeçalho, rodapé com números de página e timestamp de exportação
- **Nomenclatura de Arquivo**: `users-export-YYYY-MM-DD.pdf`

---

## 5. Detalhamento da Implementação

### Fase 1: API Backend (Dias 1-2)

#### 1.1 Criar Rota `/api/admin/users/export/fields`
```typescript
// GET /api/admin/users/export/fields
// Retorna: Array de campos exportáveis disponíveis com categorias
// Resposta:
{
  "fields": [
    {
      "category": "Informações Principais",
      "fields": [
        { "id": "id", "label": "ID do Usuário", "type": "string" },
        { "id": "name", "label": "Nome Completo", "type": "string" },
        { "id": "email", "label": "Endereço de E-mail", "type": "string" },
        ...
      ]
    },
    {
      "category": "Atividade",
      "fields": [...]
    },
    ...
  ]
}
```

#### 1.2 Criar Rota `/api/admin/users/export` (POST)
```typescript
// POST /api/admin/users/export
// Corpo:
{
  "format": "csv" | "excel" | "pdf",
  "selectedFields": ["id", "name", "email", "role", ...],
  "filters": {
    "search": "string de consulta opcional",
    "userType": "individual" | "business" | null,
    "status": "all" | "banned" | "suspended" | ...,
    "dateRange": {
      "startDate": "2026-01-01",
      "endDate": "2026-02-10"
    }
  }
}

// Resposta: Stream de arquivo binário com cabeçalhos Content-Type e Content-Disposition
```

#### 1.3 Construtor de Consultas de Banco de Dados
- Modificar consulta de busca existente em `/api/admin/users/search/route.ts`
- Criar função reutilizável de construtor de consultas: `buildUserExportQuery(filters, selectedFields)`
- Incluir todos os JOINs necessários para usuários comerciais, atividade, dados de moderação
- Aplicar filtro de intervalo de datas em `created_at`

#### 1.4 Manipuladores de Formato
Criar funções utilitárias:
- `formatToCSV(data, fields)` - Retorna string CSV
- `formatToExcel(data, fields)` - Retorna buffer XLSX
- `formatToPDF(data, fields)` - Retorna buffer PDF

#### 1.5 Registro de Auditoria
- Adicionar ação de exportação à tabela `admin_audit_logs` existente
- Registrar: ID do usuário admin, ação 'user_export', formato usado, contagem de campos, contagem de usuários, filtros aplicados

**Dependências a Instalar** (se não presentes):
```json
{
  "csv-stringify": "^6.4.0",        // Geração de CSV
  "xlsx": "^0.18.5",                // Geração de Excel
  "pdfkit": "^0.13.0" OU "jsPDF": "^2.5.1"  // Geração de PDF
}
```

---

### Fase 2: Interface do Usuário Frontend (Dias 2-3)

#### 2.1 Criar Componente BotãoExportar
```typescript
// src/components/ExportButton.tsx
// Props: { currentFilters, searchQuery, onExportStart, onExportComplete }
// Renderiza: Botão + estado de carregamento
// Ação: Abre ModalExportação ao clicar
```

#### 2.2 Criar Componente ModalExportação
```typescript
// src/components/ExportModal.tsx
// Recursos:
// - Seletor de formato (radio ou menu suspenso)
// - Seleção de campo (caixas de seleção agrupadas por categoria)
// - Seletor de intervalo de datas (opcional)
// - Painel de visualização (mostra primeiras 5 linhas)
// - Botão Exportar + estado de carregamento
// - Tratamento de erros e mensagens
```

#### 2.3 Integrar ao UserManagementPanel
```typescript
// Em UserManagementPanel.tsx
// Adicionar:
// - Botão [Exportar Relatório] no cabeçalho
// - Componente ModalExportação com gerenciamento de estado
// - Passar filtros atuais e busca ao BotãoExportar
// - Manipular resposta de download da API
```

#### 2.4 Serviço de Exportação
```typescript
// src/services/exportService.ts
// Funções:
// - fetchAvailableFields()
// - generateExport(format, fields, filters)
// - downloadFile(blob, filename)
```

---

### Fase 3: Integração e Testes (Dias 3-4)

#### 3.1 Verificações de Permissão
- Verificar que ação de exportação requer permissão `manage_system` ou `Role.MASTER`
- Garantir que usuários não-admin não possam acessar endpoints de exportação

#### 3.2 Testes de Desempenho
- Testar com diferentes tamanhos de conjunto de dados (100, 500, 1000+ usuários)
- Medir desempenho de consulta para exportações grandes
- Otimizar consultas de banco de dados, se necessário (indexação, estrutura de consulta)

#### 3.3 Testes E2E
- Testar todas as exportações de formato (CSV, Excel, PDF)
- Testar com várias combinações de filtro
- Testar filtro de intervalo de datas
- Verificar se logs de auditoria registram exportações corretamente
- Testar manipulação de erros (sem dados, campos inválidos, permissão negada)

#### 3.4 Testes do Usuário
- Compartilhar com equipe admin para feedback
- Verificar se conteúdo do arquivo corresponde ao formato esperado
- Validar se arquivo abre corretamente em Excel, Google Sheets, leitores de PDF

---

## 6. Esforço Estimado e Timeline

| Fase | Componente | Estimativa | Dependências |
|------|-----------|-----------|---|
| **Fase 1** | Rotas de API | 4-5 horas | pacotes npm |
| | Construtor de Consultas | 2-3 horas | Conhecimento de banco de dados |
| | Manipuladores de Formato | 3-4 horas | Bibliotecas CSV/Excel/PDF |
| | Registro de Auditoria | 1-2 horas | Padrão existente |
| **Fase 2** | BotãoExportar | 1-2 horas | Componentes React |
| | ModalExportação | 3-4 horas | UI, gerenciamento de estado |
| | Integração | 2-3 horas | Testes |
| | Serviço de Exportação | 1-2 horas | Cliente de API |
| **Fase 3** | Testes | 3-4 horas | Utilitários de teste |
| | Documentação | 1 hora | Markdown |
| **Total** | Recurso Completo | **21-30 horas** | ~4-5 dias (desenvolvedor único) |

---

## 7. Considerações Técnicas

### Desempenho e Escalabilidade
- **Grandes Conjuntos de Dados**: Para 5000+ usuários, considere:
  - Resposta em stream em vez de carregar tudo na memória
  - Paginação em PDF/Excel (múltiplas abas/páginas)
  - Processamento de trabalho em fundo para exportações muito grandes
  
- **Otimização de Consulta**:
  - Usar índices de banco de dados em colunas de filtro comum (created_at, user_type, role)
  - Considerar visualização materializada para dados frequentemente exportados
  - Cachear definições de campo (campos não mudam frequentemente)

### Segurança
- **Autorização**: Apenas usuários com permissão MASTER ou manage_system podem exportar
- **Trilha de Auditoria**: Todas as exportações registradas com ID do usuário admin, timestamp, filtros usados
- **Privacidade de Dados**: Considerar mascaramento de dados sensíveis (hashes de senha, tokens) - já excluído da consulta de usuário
- **Limitação de Taxa**: Considerar limitar frequência de exportação por admin (ex: máximo 5 por hora)

### Geração de Arquivo
- **Arquivos Temporários**: Gerar em diretório temporário, transmitir para cliente, deletar depois
- **Uso de Memória**: Transmitir arquivos Excel/PDF grandes em vez de bufferizar arquivo inteiro
- **Nomenclatura de Arquivo**: Incluir timestamp para evitar conflitos + identificar quando a exportação foi criada

### Tratamento de Erros
- Nenhum usuário corresponde aos critérios → Informar usuário, não gerar arquivo vazio
- Campos inválidos selecionados → Validar antes do processamento
- Timeout de banco de dados → Retornar 504 com mensagem amigável
- Falha de geração de arquivo → Retornar 500 com detalhes do erro

---

## 8. Dependências e Instalação

### Pacotes npm Necessários
```bash
npm install csv-stringify xlsx jspdf
# OU
npm install csv-stringify xlsx pdfkit
# (escolha biblioteca de PDF com base na preferência da equipe)
```

### Arquivos a Criar
```
src/app/api/admin/users/export/
├── fields/
│   └── route.ts          (GET campos disponíveis)
└── route.ts              (POST gerar exportação)

src/components/
├── ExportButton.tsx       (Componente de botão)
├── ExportModal.tsx        (Diálogo modal)
└── ExportFieldSelector.tsx (Opcional: seleção de campo reutilizável)

src/services/
└── exportService.ts       (Cliente de API e utilitários)

src/utils/
└── formatters.ts          (Formatadores CSV/Excel/PDF)
```

### Arquivos a Modificar
```
src/components/UserManagementPanel.tsx
  - Adicionar importação de ExportButton
  - Adicionar estado de ModalExportação
  - Adicionar botão [Exportar Relatório] ao cabeçalho
  - Integrar fluxo de exportação
```

---

## 9. Especificações de Endpoint de API

### GET `/api/admin/users/export/fields`
**Propósito**: Recuperar campos disponíveis para exportação

**Resposta** (200 OK):
```json
{
  "fields": [
    {
      "category": "Informações Principais",
      "fields": [
        { "id": "id", "label": "ID do Usuário", "type": "string" },
        { "id": "name", "label": "Nome Completo", "type": "string" },
        { "id": "email", "label": "E-mail", "type": "string" },
        { "id": "user_type", "label": "Tipo de Usuário", "type": "enum", "values": ["individual", "business"] },
        { "id": "role", "label": "Função", "type": "enum", "values": ["user", "admin", "staff", "master"] },
        { "id": "plan", "label": "Plano", "type": "string" },
        { "id": "created_at", "label": "Data de Criação", "type": "date" }
      ]
    },
    {
      "category": "Atividade e Status",
      "fields": [
        { "id": "last_activity_at", "label": "Última Atividade", "type": "date" },
        { "id": "days_inactive", "label": "Dias Inativo", "type": "number" },
        { "id": "access_level", "label": "Nível de Acesso", "type": "enum" }
      ]
    },
    {
      "category": "Moderação",
      "fields": [
        { "id": "active_warnings", "label": "Avisos Ativos", "type": "number" },
        { "id": "active_strikes", "label": "Multas Ativas", "type": "number" },
        { "id": "is_banned", "label": "Banido", "type": "boolean" }
      ]
    }
  ]
}
```

---

### POST `/api/admin/users/export`
**Propósito**: Gerar e baixar arquivo de exportação de usuário

**Corpo da Requisição**:
```json
{
  "format": "csv",
  "selectedFields": [
    "id",
    "name",
    "email",
    "user_type",
    "role",
    "plan",
    "created_at",
    "last_activity_at",
    "active_warnings",
    "active_strikes",
    "is_banned"
  ],
  "filters": {
    "search": "email: john OU name: john",
    "userType": null,
    "status": "all",
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2026-02-10"
    }
  }
}
```

**Resposta** (200 OK):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="users-export-2026-02-10.csv"

[Dados CSV...]
```

**Respostas de Erro**:
- 400 Bad Request: Formato ou campos inválidos
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Sem permissão para exportar
- 500 Internal Server Error: Falha de consulta ou geração de arquivo

---

## 10. Considerações de Banco de Dados

### Tabelas Existentes Utilizadas
- `users` (dados principais do usuário, 30+ colunas)
- `user_access_status` (access_level, access_reason)
- `user_moderation_status` (active_warnings, active_strikes, is_banned)
- `user_last_activity` (last_activity_at, days_inactive)
- `business_users` (dados específicos de negócios para user_type='business')
- `admin_audit_logs` (para registro de exportação)

### Recomendações de Otimização de Consulta
```sql
-- Certifique-se que estes índices existem para desempenho:
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_user_access_status_user_id ON user_access_status(user_id);
CREATE INDEX idx_user_moderation_status_id ON user_moderation_status(id);
```

---

## 11. Critérios de Sucesso e Validação

### Requisitos Funcionais
- ✅ Usuários admin podem gerar relatórios em formatos CSV, Excel e PDF
- ✅ Relatórios incluem campos selecionados de 25+ opções disponíveis
- ✅ Relatórios respeitam filtros atuais e critérios de busca
- ✅ Relatórios podem ser filtrados por intervalo de datas
- ✅ Arquivos baixam com nome de arquivo e formato apropriados
- ✅ Ações de exportação são registradas na trilha de auditoria
- ✅ Apenas admins autorizados podem acessar funcionalidade de exportação
- ✅ Mensagens de erro são amigáveis e úteis

### Requisitos de Desempenho
- ✅ Exportação CSV para <1000 usuários: <2 segundos
- ✅ Exportação Excel para <1000 usuários: <3 segundos
- ✅ Exportação PDF para <500 usuários: <4 segundos
- ✅ Consultas de banco de dados otimizadas com índices apropriados
- ✅ Sem vazamentos de memória ou problemas de sistema de arquivos

### Requisitos de Qualidade
- ✅ Testes unitários para manipuladores de formato (CSV, Excel, PDF)
- ✅ Testes de integração para endpoints de API
- ✅ Testes E2E para fluxo completo de exportação
- ✅ Testes manuais com diferentes cenários de dados
- ✅ Registros de log de auditoria verificados quanto à precisão

---

## 12. Avaliação de Riscos e Mitigação

| Risco | Impacto | Probabilidade | Mitigação |
|------|---------|-------------|-----------|
| Exportação de grande conjunto de dados causa problemas de desempenho | Alto | Médio | Implementar streaming, paginação, opção de trabalhos em fundo |
| Tamanho de arquivo muito grande para download do navegador | Médio | Baixo | Comprimir arquivos, oferecer CSV como padrão |
| Conflito de biblioteca de formato com código existente | Médio | Baixo | Testar em branch isolado, verificar compatibilidade |
| Dados sensíveis acidentalmente incluídos na exportação | Alto | Baixo | Verificar exclusões de campos, revisão de segurança |
| Logs de auditoria não registram exportações | Médio | Baixo | Testar integração de auditoria, verificar logging |
| Bypass de permissão permitindo não-admins exportar | Alto | Baixo | Implementar verificações de permissão, testes de segurança |

---

## 13. Aprimoramentos Futuros (Pós-MVP)

1. **Relatórios Agendados**: Configurar exportações recorrentes (diária, semanal, mensal)
2. **Modelos de Relatório**: Salvar e reutilizar configurações comuns de exportação
3. **Distribuição por E-mail**: Enviar relatórios diretamente para endereços de e-mail
4. **Trabalhos em Fundo**: Para conjuntos de dados muito grandes (1000+ usuários)
5. **Histórico de Relatórios**: Rastrear quais admins exportaram quais dados quando
6. **Filtros Avançados**: Opções de filtro mais sofisticadas (regex, fórmulas de data personalizadas)
7. **Campos Personalizados**: Campos adicionais definidos por admin para exportar
8. **Lote Multi-formato**: Gerar todos os formatos em uma ação
9. **Visualização de Dados**: Incluir gráficos e estatísticas de resumo em PDF

---

## 14. Documentação e Implantação

### Documentação para Desenvolvedor
- Comentários de código explicando lógica complexa
- README em `/api/admin/users/export/` descrevendo endpoints
- Interfaces TypeScript para tipos de requisição/resposta

### Guia de Usuário Admin
- Texto de ajuda no modal de exportação
- Tooltips para descrições de campos
- Arquivos exportados de amostra mostrando exemplos de formato

### Notas de Implantação
- Instalar pacotes npm em ambiente de produção
- Executar testes antes de implantar em produção
- Monitorar desempenho da API de exportação após implantação
- Configurar alertas para falhas de exportação em logs de auditoria

---

## Próximos Passos (Após Aprovação)

1. **Revisão e Feedback**: Revise este plano e forneça feedback
   - Há campos adicionais necessários?
   - Preferência pela biblioteca de PDF (pdfkit vs jsPDF)?
   - Algum formato de exportação preferido?
   - Preocupações com desempenho?

2. **Aprovação de Stakeholders**: Obtenha sinal de parada dos usuários admin que usarão recurso
   - Mostrar mockup do modal de exportação
   - Obter feedback sobre seleção de campo
   - Validar se filtro de intervalo de datas é útil

3. **Implementação**: Após aprovação, começar Fase 1 (API Backend)
   - Iniciar com endpoint de campos
   - Implementar rota POST de exportação
   - Configurar manipuladores de formato
   - Integrar registro de auditoria

4. **Testes e Revisão**: Testes abrangentes antes de implantação
   - Testes unitários para formatadores
   - Testes de integração para API
   - Testes E2E para fluxo completo
   - Revisão de segurança

---

## Perguntas para Esclarecimento do Usuário

Antes da implementação, esclareça:

1. **Preferência de Formato**: Os admins preferem CSV (mais simples), Excel (formatado) ou PDF (profissional)?
2. **Conjuntos de Campo**: Devemos incluir todos os 25+ campos por padrão ou exigir seleção?
3. **Intervalo de Data**: A filtragem de intervalo de datas é importante? Padrão para data de criação da conta ou última atividade?
4. **Escopo de Exportação**: A exportação deve sempre incluir filtros atuais ou opção de exportar todos os usuários?
5. **Desempenho**: Tempo de resposta de 1-2 segundos é aceitável ou precisamos de processamento de trabalho em fundo?
6. **Grandes Conjuntos de Dados**: Número esperado de usuários por exportação? (Impacta abordagem de implementação)
7. **Campos Adicionais**: Há campos além dos 25+ listados que admins precisam?
8. **Frequência**: Com que frequência relatórios serão exportados? (Impacta estratégia de caching)

---

## Aprovação

**Status do Plano**: ✅ Pronto para Revisão  
**Aprovação Necessária**: Sim  
**Aprovado Por**: [Aguardando Confirmação do Usuário]  
**Data de Aprovação**: [Pendente]  
**Notas**: Este plano é abrangente e pode ser implementado como está, ou modificado com base em feedback. Todas as dependências são pacotes npm padrão com amplo suporte.

---

*Para perguntas ou esclarecimentos, consulte este documento ou as seções de código relevantes em `/src/app/api/admin/users/` e `/src/components/UserManagementPanel.tsx`.*
