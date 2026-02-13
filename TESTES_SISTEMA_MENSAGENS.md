# Sistema de Mensagens Universal - Documentação de Testes

## Visão Geral
Testes E2E completos do sistema de mensagens implementado na Fase 1.

## Pré-requisitos
- Servidor rodando em `http://localhost:3000`
- Dois usuários de teste no banco de dados:
  - User 1: test1@lovetofly.com / 123456
  - User 2: test2@lovetofly.com / 123456

## Como Executar (Manual)

### 1. Criar Usuários de Teste no Banco

```sql
-- Se os usuários não existirem, executar:
INSERT INTO users (first_name, last_name, email, password_hash, plan, created_at)
VALUES 
  ('Test', 'User1', 'test1@lovetofly.com', '$2b$10$hashedpassword', 'free', NOW()),
  ('Test', 'User2', 'test2@lovetofly.com', '$2b$10$hashedpassword', 'free', NOW());
```

### 2. Executar Script de Teste

```bash
# Tornar executável
chmod +x test-messages-system.sh

# Executar com valores padrão
./test-messages-system.sh

# Ou com variáveis customizadas
BASE_URL=http://localhost:3000 \
TEST_USER1_EMAIL=test1@lovetofly.com \
TEST_USER1_PASS=123456 \
TEST_USER2_EMAIL=test2@lovetofly.com \
TEST_USER2_PASS=123456 \
./test-messages-system.sh
```

## Testes Incluídos

### ✅ Teste 1: Envio de Mensagem
- Envia mensagem de User 1 para User 2
- Verifica retorno de `message_id` e `thread_id`
- Valida estrutura da resposta

### ✅ Teste 2: Buscar Mensagens (Inbox)
- Busca inbox do User 2
- Verifica se mensagem enviada aparece
- Testa paginação básica

### ✅ Teste 3: Marcar como Lida
- Marca mensagem específica como lida
- Verifica flag `is_read = true`
- Valida timestamp `read_at`

### ✅ Teste 4: Responder Mensagem
- User 2 responde mensagem do User 1
- Verifica herança de thread_id
- **Testa single-reply enforcement** (segunda resposta deve falhar)

### ✅ Teste 5: Rate Limiting
- Envia 5 mensagens rapidamente (limite permitido)
- Tenta enviar 6ª mensagem (deve ser bloqueada)
- Verifica mensagem de erro de rate limit

### ✅ Teste 6: Sanitização de Conteúdo
- Envia mensagem com email e telefone
- Verifica flag `contentModified = true`
- Valida lista de violações detectadas

### ✅ Teste 7: Sistema de Denúncia
- Denuncia mensagem com reason='spam'
- Verifica criação de report com status='pending'
- **Testa prevenção de denúncia duplicada**

### ✅ Teste 8: Filtros e Paginação
- Testa filtro por `module=portal`
- Testa filtro por `status=unread`
- Testa paginação com `page=1&limit=5`

### ✅ Teste 9: Contador de Não Lidas
- Busca endpoint `/api/messages/unread-count`
- Verifica `unreadCount`
- Verifica flag `hasUrgent`

## Estrutura do Relatório

O script gera um relatório com:
- **Total de testes executados**
- **Testes passados** (verde)
- **Testes falhados** (vermelho)
- **Taxa de sucesso** (%)

## Testes Manuais Complementares

### Admin Dashboard
1. Acessar `/admin/communications`
2. Tab "Send Individual":
   - Buscar usuário por email
   - Enviar mensagem individual
3. Tab "Broadcast":
   - Selecionar target group
   - Enviar mensagem em massa
4. Tab "Reports":
   - Visualizar denúncias
   - Filtrar por status
5. Tab "Stats":
   - Verificar estatísticas

### HangarShare Integration
1. Acessar `/hangarshare/listing/[id]`
2. Clicar "Enviar Mensagem ao Proprietário"
3. Preencher modal
4. Enviar mensagem
5. Verificar recebimento no inbox

### Carreiras Integration
1. Acessar `/career/my-applications`
2. Clicar "Enviar Mensagem" em uma candidatura
3. Preencher modal
4. Enviar mensagem
5. Verificar recebimento pela empresa

### Moderação Integration
1. Acessar `/admin/moderation`
2. Selecionar usuário
3. Clicar "Enviar Mensagem"
4. Enviar notificação de moderação
5. Verificar recebimento pelo usuário

### Portal System Messages
1. Registrar novo usuário
2. Verificar recebimento de mensagem de boas-vindas
3. Mensagem deve ter `sender_type = 'system'`

## Métricas de Sucesso

**Meta: 100% dos testes passando**

- ✅ Database funcionando
- ✅ APIs respondendo corretamente
- ✅ Security features ativas
- ✅ UI funcional
- ✅ Integrações operacionais

## Troubleshooting

### Erro: "Token não fornecido"
- Verificar se as credenciais de teste estão corretas
- Verificar se os usuários existem no banco

### Erro: "MESSAGE_ID não definido"
- O teste de envio falhou
- Verificar logs do servidor
- Verificar se tabela `portal_messages` existe

### Erro: "Rate limiting não funcionou"
- Verificar se `messageUtils.ts` está sendo usado
- Verificar logs de rate limit no console

### Taxa de sucesso < 100%
- Revisar logs de erros
- Verificar migrations executadas
- Verificar conexão com banco de dados

## Próximos Passos

Após 100% dos testes passando:
1. ✅ Marcar Etapa 8 como CONCLUÍDA
2. ✅ Atualizar tracking document
3. ✅ Fase 1 finalizada
4. 🚀 Pronto para deploy em produção
