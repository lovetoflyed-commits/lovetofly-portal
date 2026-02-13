# Análise de Sistema de Mensagens Universal Portal/Usuário

**Data:** 12 de Fevereiro de 2026  
**Versão:** 2.0 - Sistema Universal Multi-Módulo  
**Status:** 🔍 Análise e Esclarecimentos

---

## 📋 Resumo Executivo

### Requisito Principal
Criar um **sistema de mensagens universal** que permita comunicação bidirecional (Portal ↔ Usuário) para **TODOS os módulos** do portal, substituindo o sistema atual que é exclusivo de moderação.

### Mudança de Paradigma
- ❌ **ANTES:** Sistema isolado em `/admin/moderation` apenas para avisos de moderação
- ✅ **AGORA:** Sistema universal que atende todos os módulos (HangarShare, Carreiras, Cursos, Mentoria, Marketplace, etc.)

---

## 🔍 Análise da Infraestrutura Atual

### ✅ Sistemas de Mensagens EXISTENTES no Portal

#### 1. **Sistema de Notificações do Admin para Staff/Admin**
**Localização:** `/admin/page.tsx` (Dashboard Admin)

**Funcionalidade atual:**
- Modal "Enviar Mensagem" no dashboard admin
- Envia notificações para staff/admin internos
- Usa tabela `user_notifications`
- Filtros: todos usuários, específico, ou múltiplos membros staff

**Código encontrado:**
```tsx
// Em /admin/page.tsx linha 73
const [showMessageModal, setShowMessageModal] = useState(false);

// Modal renderizado linha 1391+
{showMessageModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center...">
    // Formulário de envio de mensagem
  </div>
)}
```

**Observação:** Este é um sistema de **broadcast interno** entre admins, NÃO é comunicação com usuários finais.

---

#### 2. **Sistema de Mensagens do Traslados (Transfer Service)**
**Localização:** `/api/traslados/messages/route.ts`

**Funcionalidade:**
- Mensagens entre usuários participantes de um traslado
- Sanitização automática (remove emails, telefones, redes sociais)
- Sistema de thread por `request_id`
- Usuários se comunicam sobre um serviço específico

**Tabela:** `traslados_messages` (NÃO EXISTE no banco atual)
- Migration existe: `077_create_traslados_messages.sql`
- ⚠️ Tabela não foi criada ainda

**Observação:** Sistema **isolado e específico** do módulo Traslados, não é universal.

---

#### 3. **Sistema de Mensagens de Moderação**
**Localização:** `/api/admin/user-moderation/message/route.ts`

**Funcionalidade:**
- Admin envia mensagem para usuário específico
- Armazenada em `moderation_messages`
- Sem UI para usuário visualizar
- Sistema **unidirecional** (admin → usuário)

**Problema:** Usuário nunca vê as mensagens (conforme análise anterior).

---

### ❌ O que NÃO EXISTE

1. **Sistema Universal de Mensagens**
   - Não há tabela unificada para mensagens de todos os módulos
   - Cada sistema é isolado e independente

2. **Identificação de Módulo/Origem**
   - Mensagens não têm campo `module` ou `source`
   - Impossível filtrar "mensagens do HangarShare" vs "mensagens de Carreiras"

3. **Caixas de Entrada Separadas por Módulo**
   - Usuario não pode ver "Minhas mensagens do HangarShare"
   - Tudo misturado ou inexistente

4. **Sistema de Resposta Bidirecional**
   - Apenas admin → usuário
   - Usuário não pode responder

---

## 🏗️ Módulos do Portal que Precisarão de Mensagens

### Módulos Identificados (via estrutura `/src/app/`)

1. **HangarShare** (`/hangarshare`)
   - Proprietários e locatários precisam se comunicar
   - Notificações de reserva, aprovação, cancelamento
   - Mensagens sobre documentos, verificação

2. **Carreiras/Vagas** (`/career`)
   - Empresas notificam candidatos
   - Portal envia updates de candidaturas
   - Feedback de processos seletivos

3. **Cursos** (`/courses`)
   - Instrutores notificam alunos
   - Avisos de aulas, materiais
   - Certificações e progresso

4. **Marketplace** (`/marketplace`)
   - Compradores e vendedores
   - Notificações de pedidos
   - Suporte de transações

5. **Logbook** (`/logbook`)
   - Avisos de validação de voos
   - Alertas de validade de certificados

6. **Mentoria** (`/mentorship`)
   - Comunicação mentor/mentorado
   - Agendamento de sessões

7. **Simulador** (`/simulator`)
   - Notificações de reservas
   - Lembretes de sessões

8. **Procedimentos** (`/procedures`)
   - Atualizações de documentos
   - Avisos de novas versões

9. **Classificados** (`/classifieds`)
   - Interessados contatam anunciantes
   - Negociações

10. **Moderação** (existente)
    - Avisos de infrações
    - Suspensões, banimentos

11. **Suporte/Customer Service** (`/support`)
    - Tickets de suporte
    - Respostas do time

12. **Comunicados Promocionais** (Portal)
    - Newsletters
    - Promoções, eventos
    - Avisos gerais

---

## 🤔 Perguntas de Esclarecimento ANTES da Implementação

### 1. **Arquitetura de Caixas de Entrada**

Você mencionou duas opções:

**Opção A: Caixa Geral + Filtros por Módulo**
- Uma única inbox `/profile/messages`
- Usuário filtra por: Todas | HangarShare | Carreiras | Cursos | etc.
- Mensagens exibem badge do módulo de origem

**Opção B: Caixas Separadas por Módulo**
- `/profile/messages/hangarshare`
- `/profile/messages/careers`
- `/profile/messages/courses`
- Cada módulo tem sua própria página de mensagens

**❓ PERGUNTA 1:** Qual arquitetura prefere?
- [ ] **Opção A:** Caixa única com filtros
- [ ] **Opção B:** Caixas separadas por módulo
- [ ] **Opção C:** Híbrido (caixa geral + links diretos de cada módulo)

**Recomendação técnica:** Opção A (mais simples) ou Opção C (melhor UX)

---

### 2. **Estrutura de Banco de Dados**

**Opção A: Tabela Universal `portal_messages`**
```sql
CREATE TABLE portal_messages (
  id SERIAL PRIMARY KEY,
  sender_user_id UUID REFERENCES users(id),      -- Quem enviou
  recipient_user_id UUID REFERENCES users(id),   -- Quem recebe
  sender_type VARCHAR(20),                       -- 'user', 'admin', 'system'
  module VARCHAR(50),                            -- 'hangarshare', 'career', 'moderation', etc.
  subject VARCHAR(255),                          -- Assunto
  message TEXT,                                  -- Conteúdo
  parent_message_id INTEGER REFERENCES portal_messages(id), -- Para threads
  related_entity_type VARCHAR(50),               -- 'listing', 'job', 'course', etc.
  related_entity_id INTEGER,                     -- ID do objeto relacionado
  priority VARCHAR(20),                          -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,                                -- Dados extras por módulo
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Opção B: Manter Tabelas Separadas**
- `hangarshare_messages`
- `career_messages`
- `moderation_messages`
- `support_messages`
- etc.

**❓ PERGUNTA 2:** Qual estrutura de dados?
- [ ] **Opção A:** Tabela universal `portal_messages`
- [ ] **Opção B:** Tabelas separadas por módulo

**Recomendação técnica:** Opção A (facilita queries universais, relatórios, busca)

---

### 3. **Sistema de Resposta (Threads)**

Você confirmou: **SIM, sistema de resposta**

**Cenários a esclarecer:**

**Caso 1: Admin envia aviso de moderação**
- ✅ Usuário pode responder?
- ✅ Admin vê resposta em qual local?
- ✅ Sistema de tickets ou thread?

**Caso 2: Usuário do HangarShare pergunta sobre reserva**
- ✅ Proprietário responde?
- ✅ Admin pode intervir na conversa?
- ✅ Notificação para ambas as partes?

**Caso 3: Empresa envia feedback de entrevista**
- ✅ Candidato pode perguntar detalhes?
- ✅ Empresa recebe notificação de resposta?

**❓ PERGUNTA 3:** Como funciona a resposta?
- [ ] **Opção A:** Thread completa (como WhatsApp) - qualquer um responde ilimitadamente
- [ ] **Opção B:** Sistema de tickets (1 mensagem inicial + respostas limitadas)
- [ ] **Opção C:** Resposta única (usuário responde uma vez, aguarda nova mensagem)

**Recomendação técnica:** Opção A para módulos interativos (HangarShare, Marketplace) e Opção B para moderação/suporte

---

### 4. **Permissões e Quem Pode Enviar Mensagens**

**Cenário Admin/Staff:**
- ✅ Admin pode enviar mensagem para qualquer usuário?
- ✅ Staff de HangarShare só envia mensagens relacionadas a HangarShare?
- ✅ Moderador só envia mensagens de moderação?

**Cenário Usuário ↔ Usuário:**
- ✅ Usuário A pode iniciar conversa com Usuário B livremente?
- ✅ Ou apenas dentro de contexto (exemplo: só se ambos estão em uma transação)?
- ✅ Proteção contra spam?

**❓ PERGUNTA 4:** Quem pode enviar mensagens para quem?

**Matriz de Permissões Sugerida:**

| Remetente | Destinatário | Contexto Necessário? | Aprovação? |
|-----------|-------------|---------------------|-----------|
| Admin/Master | Qualquer usuário | Não (livre) | Não |
| Staff Específico | Usuários do módulo | Sim (HangarShare staff → apenas HangarShare users) | Não |
| Moderador | Qualquer usuário | Não | Não |
| Usuário → Outro usuário | Outro usuário | **SIM** (transação, reserva, candidatura) | Não |
| Usuário → Admin | Admin/Suporte | Não (abrir ticket) | Não |
| Portal (sistema) | Qualquer usuário | Não (broadcast) | Não |

- [ ] **Aprovar matriz acima?**
- [ ] **Modificações necessárias?**

---

### 5. **Níveis de Prioridade - Explicação Detalhada**

Você pediu esclarecimento sobre prioridades. Aqui está como funcionaria:

#### **Sistema de 4 Níveis de Prioridade**

**🟢 LOW (Baixa)**
- **Uso:** Comunicados gerais, newsletters, atualizações não urgentes
- **Comportamento:**
  - Sem notificação visual destacada
  - Aparece na lista de mensagens normal
  - Sem email automático
- **Exemplo:** "Confira nossos novos cursos de navegação!"

**🟡 NORMAL (Normal) - PADRÃO**
- **Uso:** Mensagens típicas do dia-a-dia
- **Comportamento:**
  - Badge no menu de mensagens
  - Notificação in-app padrão
  - Email opcional (configurável pelo usuário)
- **Exemplo:** "Sua reserva de hangar foi confirmada"

**🟠 HIGH (Alta)**
- **Uso:** Situações que requerem atenção rápida
- **Comportamento:**
  - Badge destacado (cor laranja/amarelo)
  - Notificação in-app com ícone de alerta
  - Email obrigatório
  - Som de notificação (se navegador permitir)
- **Exemplo:** "Documento do HangarShare foi rejeitado - ação necessária"

**🔴 URGENT (Urgente)**
- **Uso:** Situações críticas que requerem ação imediata
- **Comportamento:**
  - Banner vermelho no topo do portal
  - Modal popup ao fazer login (não pode fechar facilmente)
  - Email + SMS (se configurado)
  - Bloqueia acesso a certas áreas até ler a mensagem
- **Exemplo:** "Conta suspensa por violação de termos", "Pagamento atrasado - serviço será suspenso"

#### **Onde Cada Nível Seria Usado**

| Módulo | LOW | NORMAL | HIGH | URGENT |
|--------|-----|--------|------|--------|
| **HangarShare** | Promoções | Reserva confirmada | Documento rejeitado | Cancelamento de reserva |
| **Carreiras** | Dicas de emprego | Candidatura recebida | Entrevista agendada | Oferta expira em 24h |
| **Cursos** | Novos cursos | Material disponível | Prova amanhã | Reprovação/falta |
| **Moderação** | Lembrete de regras | Aviso de conduta | Strike aplicado | Conta banida |
| **Marketplace** | Novos produtos | Pedido confirmado | Pagamento pendente | Transação contestada |
| **Suporte** | FAQ atualizado | Ticket aberto | Resposta recebida | Conta comprometida |
| **Portal (geral)** | Newsletter | Manutenção agendada | Mudança de termos | Violação de segurança |

#### **Impacto Visual (UI)**

```tsx
// Exemplo de renderização por prioridade
function MessageBadge({ priority }) {
  const styles = {
    low: 'bg-gray-100 text-gray-600',      // Cinza claro
    normal: 'bg-blue-100 text-blue-700',   // Azul padrão
    high: 'bg-orange-100 text-orange-700', // Laranja alerta
    urgent: 'bg-red-100 text-red-700',     // Vermelho crítico
  };
  
  const icons = {
    low: 'ℹ️',
    normal: '📧',
    high: '⚠️',
    urgent: '🚨',
  };
  
  return (
    <span className={`badge ${styles[priority]}`}>
      {icons[priority]} {priority.toUpperCase()}
    </span>
  );
}
```

**❓ PERGUNTA 5:** Sistema de prioridades faz sentido?
- [ ] **SIM:** Implementar os 4 níveis (low, normal, high, urgent)
- [ ] **PARCIAL:** Apenas 2 níveis (normal, urgent)
- [ ] **NÃO:** Todas as mensagens têm mesma prioridade

**Recomendação:** SIM, implementar os 4 níveis. Essencial para UX e gestão de atenção do usuário.

---

### 6. **Sistema de Email (Você mencionou que NÃO existe)**

**Situação atual:** Portal não tem sistema de envio de emails configurado.

**Implicações:**
- ✅ Notificações apenas in-app (dentro do portal)
- ❌ Usuário não recebe email de mensagens urgentes
- ❌ Sem recuperação de senha por email (presumivelmente)

**Opções:**

**Opção A: Implementar sistema de email primeiro**
- Usar serviço: SendGrid, AWS SES, Resend, Mailgun
- Configurar templates de email
- Depois integrar com mensagens

**Opção B: Implementar mensagens SEM email**
- Apenas notificações in-app
- Adicionar email depois (Fase 2)

**❓ PERGUNTA 6:** Como tratar a ausência de email?
- [ ] **Opção A:** Implementar email ANTES das mensagens (bloqueia desenvolvimento)
- [ ] **Opção B:** Mensagens SEM email agora, adicionar depois
- [ ] **Opção C:** Usar webhook/integração externa temporária

**Recomendação:** Opção B (não bloquear projeto por falta de email)

---

### 7. **Integração com Sistema Interno de Admin**

Você mencionou:
> "os membros do admin staff já possuem um sistema de mensagens para comunicação interna que se possível poderá apenas que seja integrada uma nova função de enviar e receber mensagens de usuários em uma caixa de entrada e saída específica para esse novo canal de comunicação portal/usuário."

**Análise do sistema atual:**
- Modal no `/admin/page.tsx` envia notificações para staff
- Usa tabela `user_notifications`
- É sistema de **broadcast**, não é inbox/outbox

**❓ PERGUNTA 7:** Integração com admin
- [ ] **Opção A:** Admin usa o MESMO sistema de mensagens que usuários (inbox universal)
- [ ] **Opção B:** Admin tem interface separada para enviar, mas mensagens vão para inbox de usuários
- [ ] **Opção C:** Manter sistemas completamente separados

**Cenário Opção A: Admin como usuário privilegiado**
```
/admin/messages/
  ├── /inbox (mensagens recebidas de usuários)
  ├── /sent (mensagens enviadas para usuários)
  ├── /by-module (filtrar por HangarShare, Carreiras, etc.)
  └── /compose (nova mensagem)
```

**Cenário Opção B: Interface admin especializada**
```
/admin/communications/
  ├── /broadcast (enviar para múltiplos usuários)
  ├── /tickets (suporte)
  ├── /moderation (avisos)
  └── /reports (relatórios de mensagens)
```

**Recomendação:** Opção B (admin precisa de ferramentas específicas: broadcast, filtros avançados, relatórios)

---

### 8. **Proteção Anti-Spam e Segurança**

**Riscos identificados:**
1. **Spam entre usuários**
   - Usuário A envia 100 mensagens para usuário B
   - Anunciantes abusam do sistema

2. **Phishing e Scams**
   - Usuários tentam coletar emails/telefones
   - Links maliciosos

3. **Violação de Privacidade**
   - Compartilhamento de dados pessoais indevidos

**❓ PERGUNTA 8:** Implementar proteções?

**Proteções Sugeridas:**

**A. Rate Limiting**
- Max 5 mensagens/hora para mesmo destinatário (usuário comum)
- Max 50 mensagens/hora no total (usuário comum)
- Sem limite para admin/staff

**B. Sanitização de Conteúdo**
- Remover/bloquear emails, telefones, redes sociais (como já faz no Traslados)
- Bloquear links externos (exceto domínios whitelistados)
- Detectar palavras suspeitas (WhatsApp, Telegram, @gmail, etc.)

**C. Sistema de Denúncia**
- Botão "Denunciar mensagem" em cada mensagem
- Cria alerta para moderação
- Usuário bloqueado após X denúncias

**D. Verificação de Contexto**
- Mensagens usuário↔usuário só permitidas se há relação (transação, reserva, etc.)
- Impede mensagens cold (fora de contexto)

- [ ] **Implementar todas as proteções acima?**
- [ ] **Apenas algumas? Quais?**

**Recomendação:** Implementar A, B e C imediatamente. D depende da resposta da Pergunta 4.

---

### 9. **Notificações em Tempo Real**

**Tecnologias possíveis:**

**A. WebSocket (requer infrastructure)**
- Server já tem `server.js` com WebSocket?
- Notificações instantâneas
- Complexidade média/alta

**B. Polling (simples)**
- Frontend consulta `/api/messages/unread` a cada 30s
- Sem infrastructure extra
- Pode gerar mais requisições

**C. Server-Sent Events (SSE)**
- Meio termo entre WebSocket e Polling
- Mais simples que WebSocket
- Browser mantém conexão aberta

**❓ PERGUNTA 9:** Como notificar usuário de nova mensagem?
- [ ] **WebSocket:** Tempo real, requer infra
- [ ] **Polling:** Simples, mais requisições
- [ ] **SSE:** Compromisso
- [ ] **Nenhum:** Usuário só vê ao entrar na inbox

**Recomendação:** Polling (Fase 1) → WebSocket (Fase 2, se necessário)

---

### 10. **Armazenamento e Retenção de Mensagens**

**Questões:**

**A. Retenção**
- Manter mensagens para sempre?
- Auto-deletar após X dias/meses?
- Arquivar mensagens antigas?

**B. Limite de Armazenamento**
- Limite de mensagens por usuário?
- Limite de tamanho do texto da mensagem?

**C. Backup e Auditoria**
- Mensagens críticas (moderação, suporte) devem ser mantidas indefinidamente?
- Relatórios de compliance?

**❓ PERGUNTA 10:** Política de retenção?

**Sugestão de Política:**

| Tipo de Mensagem | Retenção | Motivo |
|-----------------|----------|--------|
| Moderação | Indefinida | Auditoria legal |
| Suporte | 2 anos | Compliance |
| Transações (HangarShare, Marketplace) | 1 ano após transação | Legal/fiscal |
| Comunicados gerais | 90 dias | Limpeza |
| Mensagens usuário↔usuário | 6 meses | Privacidade |

- [ ] **Aprovar política acima?**
- [ ] **Modificações?**

---

## 📊 Proposta de Arquitetura (Baseada nas Respostas)

### **Modelo de Dados Proposto (aguardando confirmações)**

```sql
-- ==================== TABELA UNIVERSAL DE MENSAGENS ====================
CREATE TABLE portal_messages (
  -- Identificação
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Remetente e Destinatário
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'staff', 'system')),
  
  -- Módulo e Contexto
  module VARCHAR(50) NOT NULL, -- 'hangarshare', 'career', 'moderation', 'support', 'portal', etc.
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Thread/Resposta
  parent_message_id INTEGER REFERENCES portal_messages(id) ON DELETE CASCADE,
  thread_id UUID, -- Todas as mensagens de uma conversa têm mesmo thread_id
  
  -- Relacionamento com Entidades
  related_entity_type VARCHAR(50), -- 'listing', 'job', 'booking', 'course_enrollment', etc.
  related_entity_id VARCHAR(100),  -- ID genérico (pode ser UUID ou integer)
  
  -- Prioridade e Status
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_portal_messages_recipient ON portal_messages(recipient_user_id, is_read);
CREATE INDEX idx_portal_messages_sender ON portal_messages(sender_user_id);
CREATE INDEX idx_portal_messages_module ON portal_messages(module);
CREATE INDEX idx_portal_messages_thread ON portal_messages(thread_id);
CREATE INDEX idx_portal_messages_parent ON portal_messages(parent_message_id);
CREATE INDEX idx_portal_messages_priority ON portal_messages(priority) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_portal_messages_related ON portal_messages(related_entity_type, related_entity_id);
CREATE INDEX idx_portal_messages_sent_at ON portal_messages(sent_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_portal_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portal_messages_updated_at
  BEFORE UPDATE ON portal_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_messages_updated_at();

-- ==================== TABELA DE ANEXOS (OPCIONAL) ====================
CREATE TABLE portal_message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_portal_message_attachments_message ON portal_message_attachments(message_id);

-- ==================== TABELA DE DENÚNCIAS ====================
CREATE TABLE portal_message_reports (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'scam', 'inappropriate', etc.
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_portal_message_reports_message ON portal_message_reports(message_id);
CREATE INDEX idx_portal_message_reports_status ON portal_message_reports(status);
```

---

## 🎯 Fluxos de Uso Propostos

### **Fluxo 1: Admin Envia Aviso de Moderação**

```
1. Admin acessa /admin/communications/moderation
2. Seleciona usuário infrator
3. Preenche formulário:
   - Module: 'moderation'
   - Subject: 'Aviso: Violação das Regras da Comunidade'
   - Message: 'Você recebeu um strike por...'
   - Priority: 'high'
   - Related_entity: 'user_moderation' + ID da ação
4. Sistema cria registro em portal_messages
5. Sistema cria notificação em user_notifications
6. Usuário recebe:
   - Badge no menu "Mensagens" (contador +1)
   - Notificação destacada (prioridade alta = laranja)
   - Ao clicar, vai para /profile/messages?module=moderation
7. Usuário pode responder diretamente
8. Admin vê resposta em /admin/communications/moderation/inbox
```

---

### **Fluxo 2: Usuário do HangarShare Pergunta sobre Reserva**

```
1. Usuário está em /hangarshare/booking/123
2. Clica em "Enviar mensagem para o proprietário"
3. Sistema verifica:
   - Usuário tem reserva ativa/pendente? ✅
   - Contexto válido? ✅
4. Abre modal de mensagem:
   - Module: 'hangarshare' (automático)
   - Subject: 'Dúvida sobre reserva #123'
   - Message: (usuário escreve)
   - Priority: 'normal' (automático)
   - Related_entity: 'hangar_booking' + 123
5. Proprietário recebe notificação
6. Proprietário acessa /profile/messages?module=hangarshare
7. Vê mensagem, pode responder
8. Thread de conversa criada (mesmo thread_id)
```

---

### **Fluxo 3: Portal Envia Comunicado Promocional**

```
1. Admin acessa /admin/communications/broadcast
2. Cria mensagem:
   - Module: 'portal'
   - Subject: '🎉 Promoção: 20% OFF em Cursos de Navegação'
   - Message: (HTML/texto formatado)
   - Priority: 'low'
   - Target: 'all_users' ou filtro (ex: usuários com curso X)
3. Sistema cria 1 registro em portal_messages para CADA usuário
   - Ou usa sistema de "broadcast" com flag (otimização)
4. Todos os usuários veem na inbox com badge "Portal"
5. Não é urgente, então sem destaque especial
6. Usuário pode arquivar/deletar
```

---

## 📈 Estimativa de Desenvolvimento

### **FASE 1: Core System (Sistema Base)**
**Tempo:** 2-3 dias  
**Complexidade:** Alta

**Entregas:**
- [x] Criar tabela `portal_messages` com todos os campos
- [x] Criar tabela `portal_message_reports` (denúncias)
- [x] API: `POST /api/messages/send` (enviar mensagem)
- [x] API: `GET /api/messages/inbox` (buscar mensagens recebidas, com filtros)
- [x] API: `GET /api/messages/sent` (buscar mensagens enviadas)
- [x] API: `PATCH /api/messages/:id/read` (marcar como lida)
- [x] API: `POST /api/messages/:id/reply` (responder mensagem)
- [x] API: `POST /api/messages/:id/report` (denunciar)
- [x] Rate limiting (5 msg/hora para mesmo destinatário)
- [x] Sanitização de conteúdo (bloquear emails, telefones, links)

---

### **FASE 2: User Interface (Interface do Usuário)**
**Tempo:** 2-3 dias  
**Complexidade:** Média

**Entregas:**
- [x] Página `/profile/messages` (inbox principal)
- [x] Filtros por módulo (HangarShare, Carreiras, etc.)
- [x] Filtros por status (não lidas, todas, arquivadas)
- [x] Visualização de thread (conversa completa)
- [x] Modal de resposta
- [x] Badge de contador no Header
- [x] Indicadores visuais de prioridade
- [x] Botão "Denunciar mensagem"

---

### **FASE 3: Admin Interface (Interface Administrativa)**
**Tempo:** 2-3 dias  
**Complexidade:** Média/Alta

**Entregas:**
- [x] Página `/admin/communications`
- [x] Dashboard de mensagens (estatísticas)
- [x] Interface de envio individual
- [x] Interface de broadcast (múltiplos usuários)
- [x] Filtros avançados (módulo, prioridade, período)
- [x] Visualização de denúncias
- [x] Relatórios de mensagens

---

### **FASE 4: Integração com Módulos**
**Tempo:** 3-5 dias  
**Complexidade:** Alta (depende de quantos módulos)

**Entregas:**
- [x] Integrar HangarShare (botão "Enviar mensagem" em bookings)
- [x] Integrar Carreiras (notificações de candidatura)
- [x] Integrar Marketplace (mensagens de transação)
- [x] Integrar Moderação (migrar sistema atual)
- [x] Integrar Suporte (criar sistema de tickets)
- [x] Cada módulo testado individualmente

---

### **FASE 5: Notificações e Polimento**
**Tempo:** 1-2 dias  
**Complexidade:** Baixa/Média

**Entregas:**
- [x] Sistema de polling (check de novas mensagens a cada 30s)
- [x] Notificações toast (popup no canto da tela)
- [x] Sons de notificação (opcional)
- [x] Melhorias de UX/UI
- [x] Testes de performance

---

## ⚖️ Comparação: Sistema Atual vs Sistema Proposto

| Aspecto | Sistema Atual | Sistema Proposto Universal |
|---------|--------------|---------------------------|
| **Escopo** | Apenas moderação | Todos os módulos |
| **Tabelas** | `moderation_messages` (isolada) | `portal_messages` (universal) |
| **Identificação** | Sem campo module | Campo `module` identifica origem |
| **Resposta** | Não existe | Sistema de threads completo |
| **Prioridade** | Não existe | 4 níveis (low, normal, high, urgent) |
| **UI Usuário** | Não existe | Inbox completa com filtros |
| **UI Admin** | Modal simples | Dashboard completo de comunicações |
| **Contexto** | Nenhum | `related_entity` vincula a objetos |
| **Broadcast** | Não existe | Envio para múltiplos usuários |
| **Denúncias** | Não existe | Sistema de report embutido |
| **Sanitização** | Não existe | Bloqueia emails, telefones, links |
| **Rate Limit** | Não existe | 5 msg/hora por destinatário |

---

## ⚠️ Riscos e Considerações

### **Risco 1: Migração de Dados**
**Problema:** Mensagens existentes em `moderation_messages` precisam migrar?

**Opções:**
- Migrar tudo para `portal_messages` (complexo)
- Manter ambas as tabelas e depreciar `moderation_messages` gradualmente
- Criar VIEW que unifica ambas

**Recomendação:** Manter ambas, novas mensagens vão para `portal_messages`

---

### **Risco 2: Escalabilidade**
**Problema:** Se sistema crescer muito, tabela `portal_messages` pode ficar gigante

**Mitigações:**
- Particionamento de tabela (por data)
- Arquivamento automático de mensagens antigas
- Cache de mensagens recentes (Redis)

**Decisão necessária:** Implementar agora ou depois?

---

### **Risco 3: Performance de Queries**
**Problema:** Queries complexas (filtrar por módulo + não lidas + usuário) podem ser lentas

**Mitigações:**
- Índices compostos bem planejados
- Materializar contadores em outra tabela
- Usar JSONB indexes para metadata

**Decisão:** Implementar índices desde o início

---

### **Risco 4: Complexidade de Integração**
**Problema:** Integrar 10+ módulos é trabalhoso e pode ter bugs

**Mitigações:**
- Começar com 2-3 módulos prioritários (HangarShare, Moderação, Portal)
- Adicionar outros módulos incrementalmente
- Criar SDK/helper para facilitar integração

**Decisão necessária:** Quais módulos na Fase 1?

---

## 🎯 Decisões Finais Necessárias - CHECKLIST

Por favor, responda cada item para prosseguirmos:

### **Arquitetura**
- [ ] **P1:** Caixa de entrada: (A) Única com filtros | (B) Separada por módulo | (C) Híbrido
- [ ] **P2:** Banco de dados: (A) Tabela universal | (B) Tabelas separadas

### **Funcionalidades**
- [ ] **P3:** Resposta: (A) Thread ilimitada | (B) Sistema tickets | (C) Resposta única
- [ ] **P4:** Aprovar matriz de permissões? (Sim/Não + modificações)
- [ ] **P5:** Níveis de prioridade: (A) 4 níveis | (B) 2 níveis | (C) Sem prioridades

### **Infraestrutura**
- [ ] **P6:** Email: (A) Implementar antes | (B) Mensagens sem email | (C) Integração externa
- [ ] **P7:** Admin: (A) Mesmo sistema | (B) Interface separada | (C) Sistemas separados
- [ ] **P9:** Notificações: (A) WebSocket | (B) Polling | (C) SSE | (D) Nenhum

### **Segurança**
- [ ] **P8:** Proteções: Implementar (A) Todas | (B) Apenas [especificar] | (C) Nenhuma
- [ ] **P10:** Aprovar política de retenção? (Sim/Não + modificações)

### **Priorização**
- [ ] **Módulos Fase 1:** Quais módulos integrar primeiro? (máx. 3-4)
  - [ ] HangarShare
  - [ ] Carreiras
  - [ ] Moderação
  - [ ] Portal (comunicados)
  - [ ] Suporte
  - [ ] Outros: __________

---

## 📅 Próximos Passos

**Aguardando suas respostas para:**

1. ✅ Finalizar arquitetura técnica
2. ✅ Criar schema de banco de dados definitivo
3. ✅ Definir APIs e endpoints
4. ✅ Priorizar módulos de integração
5. ✅ Estimar cronograma preciso
6. ✅ Preparar documentação técnica
7. ⏸️ **INICIAR IMPLEMENTAÇÃO** (apenas após sua aprovação)

---

**⚠️ IMPORTANTE: Não iniciarei nenhuma implementação até receber suas respostas e confirmação explícita para prosseguir.**

---

**Resumo:** Sistema atual é limitado e isolado. Sistema proposto é universal, escalável e atende todos os módulos do portal. Requer decisões arquiteturais importantes antes de começar o desenvolvimento.
