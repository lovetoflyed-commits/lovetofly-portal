# Análise da Arquitetura do Painel de Administração
**Data:** 10 de Fevereiro de 2026  
**Status:** Análise & Recomendações (Sem Ações Implementadas)  
**Preparado Para:** Revisão & Decisão

---

## Sumário Executivo

O portal atualmente possui:
- **Um Painel Master Admin** (`/admin`) com acesso total ao sistema
- **Controle de acesso baseado em papéis** definido em `accessControl.ts` com 8 níveis de função
- **Sistema híbrido de revisão de documentos** - Documentos de negócios vinculados apenas ao HangarShare
- **Sem painéis dedicados para membros da equipe** para tipos individuais de função

Este relatório analisa:
1. Fluxo atual de registro (Sem obrigatoriedade de upload de documentos para usuários negócio inicialmente)
2. Estrutura do painel & padrões de acesso
3. Hierarquia de função/permissão
4. Lacunas em painéis de nível de equipe
5. Arquitetura recomendada para painéis específicos por função

---

## Parte 1: Fluxo Atual de Registro de Usuário Negócio

### Processo de Registro (pessoa jurídica)
**Arquivo:** `/src/app/api/auth/register/route.ts`

**Dados Coletados MAS SEM OBRIGATORIEDADE DE DOCUMENTO:**
- Informações Legais: CNPJ, Razão Social, Nome Comercial, Tipo de Negócio
- Informações de Contato: Email, Telefone, Website
- Endereço da Sede: Rua, Número, Cidade, Estado, CEP, País
- Detalhes do Negócio: Tamanho, Indústria, Descrição, Ano de Fundação
- Volume de Contratações & Informações Operacionais
- **Upload de Documento: NÃO acionado no registro**

**Estado do Banco de Dados Após Registro:**
```
tabela users:
├── user_type = 'business'
├── user_type_verified = false
├── cnpj = CNPJ validado
└── plan = 'free'

tabela business_users:
├── verification_status = 'pending'
├── Todos os 30+ campos de negócio preenchidos
└── is_verified = false (padrão)
```

**Fluxo de Redirecionamento do Usuário:**
```
Envio de Registro
    ↓
Validação de API & Verificação CNPJ
    ↓
Transação: Criar users + business_users
    ↓
✓ Sucesso
    ↓
→ Página /business/pending-verification
    ├── Mostrar mensagem "Em Revisão"
    ├── Exibir informações da empresa registrada
    ├── Cronograma: Verificação em 1-5 dias
    ├── Botão Reenviar Email
    └── FAQ & Informações de Suporte
```

### Localizações Atuais de Revisão de Documentos

**1. Documentos de Proprietário HangarShare** (`/admin/hangarshare/owner-documents`)
   - Status: `uploaded | pending | verified | rejected`
   - Tipos de Documento: Contratos de aluguel, seguro, comprovantes de propriedade
   - Verificação de Permissão: `role === 'master' || 'admin' || 'staff'`
   - **Limitação:** Apenas revisável APÓS configuração de proprietário para HangarShare

**2. Documentos Gerais** (`/admin/documents`)
   - Suporta: Documentos de CPF, CNH, RG
   - Campos: `owner_company`, `owner_cnpj`, `owner_verification_status`
   - **Estado Atual:** Não utilizado ativamente para verificação de usuário negócio
   - **Problema:** Sem acionamento de upload de documento no registro de negócio

**3. Sem Módulo Centralizado de Verificação de Negócio**
   - ❌ Documentos de registro de negócio não automaticamente listados para revisão
   - ❌ Sem fila separada "Verificação de Usuário Negócio"
   - ❌ Fluxo de verificação manual/indefinido

---

## Parte 2: Estrutura Atual do Painel de Administração

### Painel Master Admin (`/admin/page.tsx`)

**9 Módulos Definidos (Todos Visíveis ao Master):**

| Módulo | Chave | Status | Métricas Mostradas |
|--------|-------|--------|-------------------|
| HangarShare | `hangarshare` | ALTO | Verificações pendentes, Anúncios pendentes |
| Reservas | `bookings` | ALTO | Reservas ativas, Reservas hoje |
| Anúncios | `listings` | NORMAL | Pendentes, Total |
| Usuários | `users` | NORMAL | Total de usuários, Novos hoje |
| Moderação | `moderation` | NORMAL | Casos abertos, Escalações |
| Finanças | `finance` | BAIXO | Receita total, Faturas pendentes |
| Conformidade | `compliance` | BAIXO | Conformidade pendente, Auditorias |
| Marketing | `marketing` | BAIXO | Campanhas ativas, Leads |
| Traslados | `traslados` | ALTO | Solicitações pendentes, Atribuições de pilotos |

**Padrão Atual de Acesso:**
```
Usuário com user.role = 'master'
    ↓
Passa na verificação de autenticação: user.role === 'master' ✓
    ↓
Vê painel admin completo com todos os 9 módulos
    ↓
Links diretos para cada módulo
```

**Navegação da Barra Lateral:**
- 9 cartões de módulos
- Subitens para visualizações detalhadas
- Métricas codificadas por cores (Vermelho=Urgente, Amarelo=Pendente, Verde=Ativo, Azul=Informação)

---

## Parte 3: Hierarquia de Papéis & Sistema de Permissões

### Papéis Definidos (8 Níveis)
**Arquivo:** `/src/app/admin/accessControl.ts`

```typescript
Hierarquia (Topo → Fundo):
1. MASTER (Super Admin) - Todas as permissões
2. OPERATIONS_LEAD - Gerenciamento de sistema
3. SUPPORT_LEAD - Operações de suporte
4. CONTENT_MANAGER - Gerenciamento de conteúdo
5. BUSINESS_MANAGER - Operações de negócio
6. FINANCE_MANAGER - Operações financeiras
7. MARKETING - Operações de marketing
8. COMPLIANCE - Conformidade & auditoria
```

### Matriz de Permissões

| Papel | manage_system | manage_support | manage_content | manage_business | manage_finance | manage_marketing | manage_compliance | view_reports | escalate_issues |
|------|---------------|----------------|----------------|-----------------|----------------|-----------------|------------------|-------------|-----------------|
| MASTER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| OPERATIONS_LEAD | ✓ | | | | | | | ✓ | ✓ |
| SUPPORT_LEAD | | ✓ | | | | | | ✓ | ✓ |
| CONTENT_MANAGER | | | ✓ | | | | | ✓ | ✓ |
| BUSINESS_MANAGER | | | | ✓ | | | | ✓ | ✓ |
| FINANCE_MANAGER | | | | | ✓ | | | ✓ | ✓ |
| MARKETING | | | | | | ✓ | | ✓ | ✓ |
| COMPLIANCE | | | | | | | ✓ | ✓ | ✓ |

### Regras de Atribuição
- Master pode atribuir qualquer papel de nível inferior
- Operations Lead pode atribuir Support, Content, Business, etc.
- Cada papel pode atribuir apenas papéis abaixo do seu nível
- Não pode atribuir para si mesmo ou papéis de nível superior

---

## Parte 4: Gerenciamento de Usuário de Equipe

### Status Atual do Painel de Equipe
**❌ NÃO IMPLEMENTADO**

**O que Existe:**
1. Componente UserManagementPanel recebe parâmetro `currentRole`
2. Membros da equipe individuais podem ser atribuídos papéis via página `/admin/users`
3. Sem visualizações de painel específicas por função (todos os papéis veem mesmo layout Master)

**Fluxo Atual para Usuários de Equipe:**
```
Login de Usuário de Equipe
    ↓
Verificação: user.role === 'master' || 'admin' || 'staff'
    ↓
Se passou:
    ├── Redireciona para /admin (Painel Master)
    └── Vê lista completa de módulos (mesma que Master)
    
Se falhou:
    └── Redireciona para / (página inicial)
```

**Problemas:**
- ❌ Support Lead vê módulo de Finanças (não deveria)
- ❌ Marketing Manager vê ferramentas de Conformidade (não deveria)
- ❌ Sem aplicação granular de permissão na UI
- ❌ Todos usuários não-master tratados como "equipe" genérica
- ❌ Sem painéis específicos por função

---

## Parte 5: Lacuna de Verificação de Usuário Negócio

### Estado Atual: Fluxo de Verificação Indefinido

**O Que Deveria Acontecer (Desejado):**
```
Usuário Negócio Registra
    ├── Sem upload de documento nesta fase ✓ (Solicitação do usuário)
    ├── Perguntar sobre planos HangarShare
    └── Redirecionar para página pending-verification

    ↓ (Ação Administrativa Necessária)

Admin Revisa Perfil do Negócio
    ├── Valida CNPJ
    ├── Revisa informações submissas do negócio
    ├── Pode solicitar documentos adicionais SE necessário
    └── Aprova ou Rejeita

    ↓ (Após Aprovação)

Usuário Negócio Obtém Acesso a:
    ├── Recursos principais do portal
    ├── HangarShare (se selecionado)
    └── Upload de documento SE HangarShare necessário
```

**Estado Atual Real:**
- ✓ Registro cria registro pendente
- ❌ Sem fila admin para verificação de negócio
- ❌ Documentos apenas revistos em contexto HangarShare
- ❌ Sem "Painel de Verificação de Negócio" para admins
- ❌ Mecanismo de mudança de status de verificação indefinido

### Módulo Faltando: Verificação de Usuário Negócio

**Deveria ser adicionado ao painel admin:**
```
Módulo: Verificação de Empresas
├── Pendente: Contagem de empresas aguardando verificação
├── Aprovadas: Contagem aprovada
├── Rejeitadas: Contagem rejeitada
├── Documentos Solicitados: Contagem aguardando docs
└── Subitens:
    ├── Fila de Verificação (status=pending)
    ├── Aguardando Documentos (status=docs_requested)
    ├── Histórico (status=approved|rejected)
    └── Relatório de Conformidade
```

---

## Parte 6: Arquitetura Recomendada do Painel

### Opção A: Painéis Específicos por Função em Camadas (RECOMENDADO)

**Criar 8 Painéis Separados - Um Por Papel**

```
/admin/dashboard/[papel]/page.tsx

├── /admin/dashboard/master/
│   ├── Todos os 9 módulos
│   ├── Saúde do sistema
│   ├── Análises entre módulos
│   └── Gerenciamento de equipe
│
├── /admin/dashboard/operations-lead/
│   ├── HangarShare
│   ├── Traslados
│   ├── Reservas
│   ├── Usuários
│   ├── Logs de sistema
│   └── Relatórios de incidente
│
├── /admin/dashboard/support-lead/
│   ├── Usuários
│   ├── Moderação
│   ├── Tickets de suporte
│   ├── Rastreamento de SLA
│   └── Escalações
│
├── /admin/dashboard/business-manager/
│   ├── Verificação de Empresas [NOVO]
│   ├── Usuários (filtro: apenas negócios)
│   ├── Anúncios
│   ├── HangarShare
│   └── Métricas de negócio
│
├── /admin/dashboard/compliance/
│   ├── Conformidade
│   ├── Verificação de Empresas [NOVO]
│   ├── Auditoria
│   ├── KYC/KYB
│   └── Relatórios de conformidade
│
├── /admin/dashboard/finance-manager/
│   ├── Finanças
│   ├── Faturas
│   ├── Relatórios de receita
│   └── Análises financeiras
│
├── /admin/dashboard/marketing/
│   ├── Marketing
│   ├── Campanhas
│   ├── Leads
│   └── Análises de campanhas
│
└── /admin/dashboard/content-manager/
    ├── Conteúdo (se existe)
    ├── Gerenciamento de FAQ
    ├── Documentação
    └── Análises de conteúdo
```

### Opção B: Abordagem Híbrida (MAIS SIMPLES)

**Manter Painel Master, Adicionar Filtragem Baseada em Papéis**

```
/admin/dashboard/role-adaptive/

Painel único que:
├── Detecta papel do usuário
├── Mostra apenas módulos relevantes
├── Verificações de permissão em todos links de módulo
├── Same layout, conteúdo filtrado
└── Mais fácil de manter
```

### Abordagem Recomendada: **Opção A (Painéis em Camadas)**

**Vantagens:**
- Fluxos de trabalho claros e específicos por função
- Segurança aprimorada (ver apenas dados relevantes)
- Melhor UX para equipe especializada
- Escalável para novos papéis
- Trilha de auditoria por papel
- Pode customizar métricas por papel

---

## Parte 7: Plano de Implementação para Verificação de Usuário Negócio

### Novo Módulo: "Verificação de Empresas" (Verificação de Negócio)

**Papéis Alvo:** Master, Business Manager, Compliance

**Schema de Banco de Dados Necessário:**
```sql
-- Já existe mas precisa acompanhamento de status
colunas da tabela business_users:
├── verification_status (pending|approved|rejected|docs_requested)
├── verified_by (user_id de admin)
├── verified_at (timestamp)
├── verification_notes (texto)
└── documents_requested (array JSON)

-- Rastrear trilha de auditoria de verificação
tabela business_verification_audit:
├── id (PK)
├── business_user_id
├── admin_id
├── action (review|request_docs|approve|reject)
├── notes
├── created_at
└── documents_list
```

**Itens do Painel de Administração:**

1. **Fila de Verificação** - Negócios aguardando revisão
   - Mostrar: CNPJ, Razão Social, Tipo de Negócio, Data de Envio
   - Ações: Ver perfil completo, Solicitar documentos, Aprovar, Rejeitar
   - Filtro: Por indústria, por data de envio, por localização

2. **Aguardando Documentos** - Aguardando documentos adicionais
   - Mostrar: Nome negócio, Docs solicitados, Data de solicitação
   - Ações: Ver docs enviados, Reenviar solicitação, Aprovar, Rejeitar
   - Escalação automática se vencido (7+ dias)

3. **Aprovadas Recentemente** - Verificadas recentemente (30 dias)
   - Mostrar: Nome negócio, Data aprovação, Aprovador
   - Ações: Ver perfil, Reverter aprovação (se necessário)

4. **Rejeitadas** - Aplicações negadas
   - Mostrar: Nome negócio, Motivo rejeição, Data rejeição
   - Ações: Ver perfil, Permitir reenvio

**Fluxo de Upload de Documento (Condicional):**

```
Se Negócio Seleciona HangarShare:
├── Durante registro OU
└── Da página pending-verification
    └── Acionar modal de upload de documento
        ├── Certificado de seguro
        ├── Licença comercial
        ├── Comprovante de propriedade
        └── Adicional conforme necessário

Admin Revisa:
├── Através de /admin/documents (se geral)
├── Ou /admin/hangarshare/owner-documents (se HangarShare)
└── Atualiza business_users.verification_status
```

---

## Parte 8: Lacunas Atuais & Riscos

### Lacuna 1: Sem Fila de Verificação de Negócio
- ❌ Novos usuários negócio registram com sucesso
- ❌ Admin não tem lugar central para revisar
- ❌ Verificação acontece implicitamente (sem fluxo claro)
- **Impacto:** Rastreamento manual necessário, SLAs não reforçados

### Lacuna 2: Sem Painéis Específicos da Equipe
- ❌ Todos papéis de equipe veem painel Master
- ❌ Support Lead pode acessar dados de Finanças
- ❌ Sem aplicação de papéis em nível UI
- **Impacto:** Risco de vazamento de dados, UX pobre, confusão

### Lacuna 3: Upload de Documento Não Integrado
- ❌ Usuários negócio registram sem documentos
- ❌ Se HangarShare necessário, docs requeridos separadamente
- ❌ Fluxos de verificação e revisão de documento separados
- **Impacto:** Atrito, processo indefinido, problemas de conformidade

### Lacuna 4: Sem Trilha de Auditoria
- ❌ Sem rastreamento de quem verificou qual negócio
- ❌ Sem timestamp de ações de verificação
- ❌ Não pode reverter aprovações inapropriadas
- **Impacto:** Risco de conformidade, lacuna de responsabilidade

### Lacuna 5: Sem SLA/Escalação para Verificação de Negócio
- ❌ Sem tempo alvo para verificar (ex: 1-5 dias prometidos)
- ❌ Sem escalação automática se vencido
- ❌ Acompanhamento manual necessário
- **Impacto:** Experiência de usuário inconsistente

---

## Parte 9: Mapeamento de Módulo por Papel

### Master Admin
```
Acesso: TODOS módulos
├── HangarShare (Completo)
├── Reservas (Completo)
├── Anúncios (Completo)
├── Usuários (Completo)
├── Moderação (Completo)
├── Finanças (Completo)
├── Conformidade (Completo)
├── Marketing (Completo)
├── Traslados (Completo)
├── Verificação de Empresas (Completo) [NOVO]
└── Gerenciamento de Equipe (Completo)
```

### Operations Lead
```
Acesso: Módulos focados em operações
├── HangarShare (Leitura/Escrita)
├── Traslados (Leitura/Escrita)
├── Reservas (Somente leitura)
├── Usuários (Somente leitura)
└── Saúde do Sistema (Nível painel)
```

### Support Lead
```
Acesso: Módulos focados em suporte
├── Usuários (Leitura/Escrita para suporte)
├── Moderação (Leitura/Escrita)
├── Tickets de Suporte (Leitura/Escrita) [SE EXISTE]
├── Escalações (Leitura/Escrita)
└── Rastreamento de SLA (Somente leitura)
```

### Business Manager
```
Acesso: Módulos focados em negócio
├── Verificação de Empresas (Completo) [NOVO]
├── Usuários (Filtro: apenas negócios)
├── Anúncios (HangarShare)
├── HangarShare (Revisão de anúncio)
└── Métricas de Negócio (Somente leitura)
```

### Compliance Officer
```
Acesso: Módulos focados em conformidade
├── Conformidade (Completo)
├── Verificação de Empresas (Completo) [NOVO]
├── Auditoria (Completo)
├── KYC/KYB (Completo)
├── Documentos (Completo)
└── Logs de Auditoria (Somente leitura)
```

### Finance Manager
```
Acesso: Módulos focados em finanças
├── Finanças (Completo)
├── Faturas (Completo)
├── Relatórios de Receita (Completo)
└── Análises Financeiras (Somente leitura)
```

### Marketing Manager
```
Acesso: Módulos focados em marketing
├── Marketing (Completo)
├── Campanhas (Completo)
├── Leads (Completo)
└── Análises (Somente leitura)
```

### Content Manager
```
Acesso: Módulos focados em conteúdo
├── Conteúdo (Completo) [SE EXISTE]
├── Gerenciamento de FAQ (Completo)
├── Documentação (Completo)
└── Análises de Conteúdo (Somente leitura)
```

---

## Parte 10: Roteiro de Implementação Recomendado

### Fase 1: Fundação (Semana 1-2)
- [ ] Criar estrutura de pasta `/admin/dashboard`
- [ ] Mover `/admin/page.tsx` atual para `/admin/dashboard/master/page.tsx`
- [ ] Implementar lógica de detecção de papéis & redirecionamento
  ```
  /admin → redireciona para /admin/dashboard/[papel]/
  ```
- [ ] Adicionar middleware de verificação de permissão

### Fase 2: Painéis Específicos por Papel (Semana 3-4)
- [ ] Criar 7 componentes de painel específicos por papel
- [ ] Implementar filtragem de módulo por papel
- [ ] Adicionar KPIs/métricas específicas por papel
- [ ] Testar aplicação de permissão

### Fase 3: Módulo de Verificação de Negócio (Semana 5-6)
- [ ] Criar módulo "Verificação de Empresas"
- [ ] Construir visualização de fila de negócio pendente
- [ ] Implementar ações de verificação (aprovar/rejeitar/solicitar-docs)
- [ ] Adicionar logging de auditoria para ações de verificação
- [ ] Criar cartões de painel para papéis Business Manager & Compliance

### Fase 4: Integração & Polimento (Semana 7)
- [ ] Conectar fluxo de upload de documento ao registro de negócio
- [ ] Adicionar rastreamento de SLA para verificação (promessa 1-5 dias)
- [ ] Implementar escalações para revisões vencidas
- [ ] Adicionar análises por papel
- [ ] Testes & QA

### Fase 5: Documentação & Deployment (Semana 8)
- [ ] Documentação de guia de novos papéis admin
- [ ] Materiais de onboarding de equipe
- [ ] Guia de referência de permissão
- [ ] Rollout gradual com testes

---

## Parte 11: Mudanças de Banco de Dados Necessárias

### Tabelas Existentes (Modificações)
```sql
-- Atualizar tabela business_users
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS (
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  documents_status VARCHAR(50) DEFAULT 'pending'
);

-- Já possuem
-- verification_status VARCHAR(50) DEFAULT 'pending'
-- is_verified BOOLEAN DEFAULT false
```

### Nova Tabela de Auditoria
```sql
CREATE TABLE business_verification_audit (
  id SERIAL PRIMARY KEY,
  business_user_id INTEGER NOT NULL REFERENCES business_users(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- review|request_docs|approve|reject
  status_before VARCHAR(50),
  status_after VARCHAR(50),
  notes TEXT,
  documents_requested JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_user_id) REFERENCES business_users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_business_user_id (business_user_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
);
```

---

## Sumário & Recomendações

### O Que ESTÁ Funcionando ✓
1. Registro de negócio sem docs obrigatórios
2. Sistema de papéis/permissão definido
3. Verificação de documento de proprietário HangarShare
4. Painel Master com estrutura de módulo

### O Que PRECISA de Implementação ✗
1. **Painéis específicos por papel** (8 visualizações separadas)
2. **Fila de verificação de negócio** (módulo de gerenciamento)
3. **Aplicação de permissão de membro de equipe** (nível UI)
4. **Integração de upload de documento** (para negócios precisando HangarShare)
5. **Trilha de auditoria** (quem verificou o quê, quando)
6. **Rastreamento de SLA** (notificação de promessa 1-5 dias)

### Pontos de Decisão Crítica

**P1: Verificação deveria ser necessária para todos negócios ou apenas HangarShare?**
- Atual: Apenas HangarShare (documentos condicionais)
- Recomendação: Todos negócios obtêm verificação base (validação CNPJ mínimo)

**P2: Painéis de equipe deveriam ser separados ou visualizações filtradas do Master?**
- Opção A: Painéis separados (mais seguro, melhor UX)
- Opção B: Painel Master filtrado (mais fácil manter)
- **Recomendação: Opção A** (8 arquivos separados de painel)

**P3: Quão rápido implementar?**
- Mínimo: 4-6 semanas para implementação completa
- Ganho rápido: 1-2 semanas apenas para módulo de verificação Business Manager

**P4: Admins não-Master deveriam poder atribuir papéis?**
- Atual: Não claramente implementado
- Recomendação: Master apenas, OU Operations Lead pode atribuir papéis abaixo

---

## Próximos Passos (Para Sua Decisão)

Por favor, revise e decida:

1. ✅ Aprovar arquitetura de painel em camadas (Opção A)?
2. ✅ Priorizar módulo de Verificação de Negócio?
3. ✅ Cronograma alvo para implementação?
4. ✅ Verificação deveria ser obrigatória para todos ou apenas HangarShare?
5. ✅ Quem deveria ter acesso à Verificação de Negócio? (Master + Business Manager + Compliance?)

Uma vez que as decisões forem tomadas, a implementação pode começar imediatamente.

---

**Relatório preparado por:** Assistente IA  
**Data:** 10 de Fevereiro de 2026  
**Status:** Pronto para Revisão & Decisão
