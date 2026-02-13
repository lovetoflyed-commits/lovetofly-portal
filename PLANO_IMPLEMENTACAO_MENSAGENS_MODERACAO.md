# Plano de Implementação: Sistema de Mensagens de Moderação

**Data:** 12 de Fevereiro de 2026  
**Objetivo:** Criar um canal de comunicação completo entre administradores do portal e usuários

---

## 📊 Análise da Situação Atual

### ✅ O que JÁ EXISTE e FUNCIONA

#### 1. **Infraestrutura de Banco de Dados**
- ✅ Tabela `moderation_messages` (mensagens diretas admin→usuário)
  - Campos: id, sender_user_id, recipient_user_id, message, sent_at, read_at, is_read, created_at
  - Suporta tracking de leitura
  
- ✅ Tabela `user_notifications` (notificações gerais do sistema)
  - Campos: id, user_id, type, title, message, action_url, action_label, is_read, read_at, created_at, updated_at
  - Sistema completo de notificações

#### 2. **APIs Implementadas (Admin)**
- ✅ `POST /api/admin/user-moderation/message` - Admin envia mensagem para usuário
  - Valida token e permissões (master, admin, staff, moderator, super_admin)
  - Insere em `moderation_messages`
  - Registra atividade em `user_activity_log`
  - Usa transação para garantir atomicidade

#### 3. **APIs Implementadas (Usuário)**
- ✅ `GET /api/user/notifications` - Usuário busca notificações
  - Suporta filtro de não lidas
  - Retorna contador de não lidas
  - Paginação com limite configurável
  
- ✅ `PATCH /api/user/notifications` - Marca notificações como lidas
  - Suporta marcar individual ou todas

#### 4. **UI Implementada (Admin)**
- ✅ Modal de Mensagem em `/admin/moderation`
  - Textarea para escrever mensagem
  - Botão de envio funcional
  - Loading state durante envio
  - Chama API corretamente

#### 5. **UI Implementada (Usuário)**
- ✅ Página `/profile/notifications` - Visualização de notificações
  - Lista todas as notificações
  - Filtro todas/não lidas
  - Marcar como lida (individual ou todas)
  - Badges visuais por tipo
  - Links de ação quando aplicável
  
- ✅ Componente `NotificationDropdown` no Header
  - Badge com contador de não lidas
  - Preview rápido de notificações
  - Link para página completa

---

## ❌ O que FALTA IMPLEMENTAR

### 1. **Integração Entre Sistemas** ⚠️ CRÍTICO
**Problema:** Quando admin envia mensagem via `moderation_messages`, o usuário NÃO é notificado
- Mensagem fica "invisível" até usuário acessar inbox (que não existe)
- Não há notificação visual para o usuário

**Solução:** Criar notificação automática quando mensagem é enviada

---

### 2. **API para Mensagens de Moderação** ⚠️ CRÍTICO
**Arquivo a criar:** `/src/app/api/user/moderation-messages/route.ts`

**Funcionalidades necessárias:**
```typescript
// GET - Buscar mensagens recebidas
GET /api/user/moderation-messages?unreadOnly=true&limit=50

// PATCH - Marcar mensagem como lida
PATCH /api/user/moderation-messages
Body: { messageId: number }

// PATCH - Marcar todas como lidas
PATCH /api/user/moderation-messages
Body: { markAllAsRead: true }
```

**Retorno esperado (GET):**
```json
{
  "messages": [
    {
      "id": 1,
      "sender_name": "Admin João",
      "sender_id": "uuid",
      "message": "Texto da mensagem",
      "sent_at": "2026-02-12T10:30:00Z",
      "read_at": null,
      "is_read": false,
      "created_at": "2026-02-12T10:30:00Z"
    }
  ],
  "unreadCount": 5
}
```

---

### 3. **UI: Página de Mensagens de Moderação** ⚠️ ALTA PRIORIDADE
**Arquivo a criar:** `/src/app/profile/moderation-messages/page.tsx`

**Funcionalidades:**
- Lista de mensagens recebidas de moderadores
- Filtro: Todas / Não lidas
- Visual diferente das notificações normais (mais sério, warning style)
- Marcar como lida ao abrir/expandir
- Timestamp de envio e leitura
- Nome do moderador que enviou
- Badge visual de "Nova Mensagem de Moderação"

**Design sugerido:**
```tsx
[ÍCONE ⚠️] Mensagem de Moderação - Admin João
Data: 12/02/2026 10:30

Conteúdo da mensagem aqui...

[Marcar como lida] [Detalhes da Ação de Moderação]
```

---

### 4. **Link de Acesso no Menu do Usuário** ⚠️ ALTA PRIORIDADE
**Arquivos a modificar:**
- `/src/components/Header.tsx`
- `/src/components/UserMenu.tsx` (se existir)
- `/src/app/(dashboard)/layout.tsx` (se menu estiver no layout)

**Implementação:**
- Adicionar item "Mensagens de Moderação" no menu do usuário
- Badge com contador de mensagens não lidas
- Ícone diferenciado (⚠️ ou 📧)
- Ordem sugerida: Logo após "Notificações"

```tsx
<Link href="/profile/moderation-messages">
  Mensagens de Moderação
  {unreadModMessages > 0 && (
    <span className="badge-warning">{unreadModMessages}</span>
  )}
</Link>
```

---

### 5. **Hook para Contador de Mensagens Não Lidas** 📦 MÉDIA PRIORIDADE
**Arquivo a criar:** `/src/hooks/useModerationMessages.ts`

**Funcionalidade:**
- Buscar contador de mensagens não lidas
- Auto-refresh a cada X segundos (configurável)
- Retornar estado de loading
- Integração com Header/Menu

```typescript
export function useModerationMessages(autoRefresh = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Implementação...
  
  return { unreadCount, loading, refresh };
}
```

---

### 6. **Notificação Automática ao Enviar Mensagem** ⚠️ CRÍTICO
**Arquivo a modificar:** `/src/app/api/admin/user-moderation/message/route.ts`

**Mudança necessária:**
Após inserir em `moderation_messages`, criar notificação em `user_notifications`:

```typescript
// Após inserir mensagem
await client.query(
  `INSERT INTO user_notifications 
    (user_id, type, title, message, action_url, action_label)
   VALUES ($1, 'warning', $2, $3, $4, $5)`,
  [
    userId,
    '⚠️ Nova Mensagem de Moderação',
    message.substring(0, 150) + (message.length > 150 ? '...' : ''),
    '/profile/moderation-messages',
    'Ver Mensagem'
  ]
);
```

---

### 7. **Resposta do Usuário (Opcional - Fase 2)** 💡 BAIXA PRIORIDADE
**Funcionalidade futura:**
- Permitir usuário responder mensagens de moderação
- Criar thread/conversação
- Adicionar campo `parent_message_id` na tabela
- Notificar admin quando usuário responder

**Decisão:** Implementar apenas se requisito for aprovado

---

## 📋 Plano de Implementação - Fases

### **FASE 1: FUNCIONALIDADE BÁSICA** (Essencial)
**Tempo estimado:** 3-4 horas

#### Etapa 1.1: API de Mensagens do Usuário (1h)
- [ ] Criar `/api/user/moderation-messages/route.ts`
- [ ] Implementar GET (buscar mensagens)
- [ ] Implementar PATCH (marcar como lida)
- [ ] Testar com Postman/Thunder Client

#### Etapa 1.2: Integração - Notificação Automática (30min)
- [ ] Modificar `/api/admin/user-moderation/message/route.ts`
- [ ] Adicionar INSERT em `user_notifications` após criar mensagem
- [ ] Testar fluxo completo: Admin envia → Usuário recebe notificação

#### Etapa 1.3: UI - Página de Mensagens (1.5h)
- [ ] Criar `/profile/moderation-messages/page.tsx`
- [ ] Implementar lista de mensagens
- [ ] Filtros (todas/não lidas)
- [ ] Visual de mensagem expandida
- [ ] Marcar como lida ao visualizar

#### Etapa 1.4: Menu e Navegação (1h)
- [ ] Adicionar link no menu do usuário
- [ ] Implementar contador de não lidas no badge
- [ ] Atualizar componente Header/UserMenu
- [ ] Adicionar ícone diferenciado

---

### **FASE 2: MELHORIAS UX** (Recomendado)
**Tempo estimado:** 2-3 horas

#### Etapa 2.1: Hook Reutilizável (1h)
- [ ] Criar `useModerationMessages` hook
- [ ] Implementar auto-refresh
- [ ] Integrar com Header

#### Etapa 2.2: Notificações em Tempo Real (1h)
- [ ] Adicionar WebSocket para mensagens (se já existir infra)
- [ ] Ou polling a cada 30s
- [ ] Toast notification quando nova mensagem chegar

#### Etapa 2.3: Histórico Vinculado (30min)
- [ ] Na mensagem, mostrar link para ação de moderação relacionada
- [ ] "Esta mensagem está relacionada a: [Aviso por conduta inadequada]"

---

### **FASE 3: RECURSOS AVANÇADOS** (Opcional - Futuro)
**Tempo estimado:** 4-6 horas

#### Etapa 3.1: Sistema de Resposta
- [ ] Adicionar campo `parent_message_id`
- [ ] Criar API para usuário responder
- [ ] UI de thread/conversação
- [ ] Notificar admin de resposta

#### Etapa 3.2: Anexos
- [ ] Suporte a anexos em mensagens
- [ ] Upload de arquivos
- [ ] Preview de imagens

#### Etapa 3.3: Templates de Mensagem
- [ ] Admin pode salvar templates
- [ ] Biblioteca de respostas pré-definidas
- [ ] Variáveis dinâmicas (nome do usuário, etc)

---

## 🗄️ Mudanças no Banco de Dados

### ✅ Nenhuma Migration Necessária (Tabelas Existem)
As tabelas `moderation_messages` e `user_notifications` já existem e têm a estrutura adequada.

### ⚠️ Possível Melhoria Futura (Fase 3)
```sql
-- Adicionar suporte a threads/conversações
ALTER TABLE moderation_messages 
  ADD COLUMN parent_message_id INTEGER REFERENCES moderation_messages(id),
  ADD COLUMN thread_id UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN message_type VARCHAR(20) DEFAULT 'admin_to_user' 
    CHECK (message_type IN ('admin_to_user', 'user_to_admin'));

CREATE INDEX idx_moderation_messages_thread ON moderation_messages(thread_id);
CREATE INDEX idx_moderation_messages_parent ON moderation_messages(parent_message_id);
```

---

## 🧪 Testes Necessários

### Testes de API
1. **POST /api/admin/user-moderation/message**
   - ✅ Mensagem criada em `moderation_messages`
   - ✅ Notificação criada em `user_notifications`
   - ✅ Log de atividade registrado
   - ❌ Erro se campos vazios
   - ❌ Erro se usuário não encontrado

2. **GET /api/user/moderation-messages**
   - ✅ Retorna mensagens do usuário logado
   - ✅ Filtro unreadOnly funciona
   - ✅ Contador correto
   - ❌ 401 se não autenticado

3. **PATCH /api/user/moderation-messages**
   - ✅ Marca mensagem como lida
   - ✅ Atualiza `read_at` timestamp
   - ✅ markAllAsRead funciona

### Testes de UI
1. **Admin envia mensagem**
   - ✅ Modal abre corretamente
   - ✅ Mensagem enviada com sucesso
   - ✅ Feedback visual (sucesso/erro)
   - ✅ Modal fecha após envio

2. **Usuário visualiza mensagem**
   - ✅ Lista carrega corretamente
   - ✅ Mensagens ordenadas por data (mais recente primeiro)
   - ✅ Badge de não lida aparece
   - ✅ Ao expandir, marca como lida
   - ✅ Contador atualiza em tempo real

3. **Navegação**
   - ✅ Link no menu funciona
   - ✅ Badge com contador aparece
   - ✅ Badge desaparece quando tudo lido

---

## 📊 Métricas de Sucesso

1. **Tempo de Resposta**
   - API GET < 200ms (50 mensagens)
   - API POST < 300ms

2. **Taxa de Leitura**
   - 90%+ das mensagens lidas em 24h
   - Tempo médio até leitura < 2h

3. **Experiência do Usuário**
   - Usuário consegue encontrar mensagens facilmente
   - Notificação visível imediatamente
   - Zero mensagens "perdidas"

---

## 🚨 Riscos e Mitigações

### Risco 1: Spam de Mensagens
**Problema:** Admin pode enviar muitas mensagens, sobrecarregando usuário

**Mitigação:**
- Implementar rate limit (max 5 mensagens/usuário/hora)
- Log de todas as mensagens para auditoria
- Revisar mensagens frequentes

### Risco 2: Mensagens Não Lidas
**Problema:** Usuário não vê mensagens importantes

**Mitigação:**
- Notificação também por email (opcional)
- Badge destacado no menu
- Persistir notificação até ser lida

### Risco 3: Conflito com Notificações Existentes
**Problema:** Confusão entre notificações e mensagens

**Mitigação:**
- Visual claramente diferente
- Seções separadas no menu
- Nomenclatura clara ("Mensagens de Moderação")

---

## 📝 Decisões Pendentes

### 1. **Sistema de Resposta**
- [ ] SIM: Usuário pode responder mensagens de moderação
- [ ] NÃO: Apenas comunicação unidirecional (admin → usuário)

**Recomendação:** Começar SEM resposta (FASE 1), avaliar necessidade depois

---

### 2. **Notificação por Email**
- [ ] SIM: Enviar email quando admin envia mensagem
- [ ] NÃO: Apenas notificação in-app

**Recomendação:** SIM para mensagens críticas (suspensão, banimento)

---

### 3. **Retenção de Mensagens**
- [ ] Manter todas as mensagens indefinidamente
- [ ] Auto-deletar após 90 dias
- [ ] Arquivar após 30 dias (usuário pode ver em "Arquivadas")

**Recomendação:** Manter indefinidamente por questões legais/auditoria

---

### 4. **Priorização de Mensagens**
- [ ] SIM: Adicionar campo `priority` (low, normal, high, critical)
- [ ] NÃO: Todas as mensagens têm mesma importância

**Recomendação:** SIM, útil para destacar mensagens urgentes

---

## 🎯 Resumo Executivo

### O Que Funciona Hoje
✅ Admin pode enviar mensagens (backend)  
✅ Mensagens são armazenadas no banco  
✅ Sistema de notificações existe e funciona  

### O Que Não Funciona
❌ Usuário nunca vê as mensagens de moderação  
❌ Não há UI para visualizar mensagens  
❌ Não há notificação quando mensagem chega  
❌ Sistema está "invisível" para usuários  

### Solução Proposta - FASE 1 (Essencial)
1. Criar API para usuário buscar mensagens
2. Criar página de visualização de mensagens
3. Adicionar link no menu do usuário
4. Criar notificação automática quando mensagem é enviada
5. Badge com contador de não lidas

**Tempo:** 3-4 horas  
**Complexidade:** Baixa/Média  
**Impacto:** ALTO - Torna o sistema completamente funcional

---

## ✅ Próximos Passos

**AGUARDANDO APROVAÇÃO PARA:**

1. ✋ Implementar FASE 1 (funcionalidade básica)?
2. ✋ Incluir FASE 2 (melhorias UX)?
3. ✋ Planejar FASE 3 (recursos avançados) para futuro?

**DECISÕES NECESSÁRIAS:**
- Sistema de resposta: SIM ou NÃO?
- Notificação por email: SIM ou NÃO?
- Priorização de mensagens: SIM ou NÃO?

---

**Aguardando confirmação para iniciar implementação.**
