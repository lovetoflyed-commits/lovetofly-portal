# 🔑 Configuração de API Keys - Stripe e Resend

## ⚡ Setup Rápido (5 minutos)

Você precisa obter 4 chaves de API para habilitar pagamentos e emails.

---

## 1️⃣ Stripe (Pagamentos)

### Passo 1: Criar Conta
1. Acesse: https://dashboard.stripe.com/register
2. Crie sua conta gratuita
3. Não precisa ativar pagamentos reais agora (use modo teste)

### Passo 2: Obter Publishable Key
1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie a **Publishable key** (começa com `pk_test_`)
3. Cole no `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Hxxxxxxxxxxxxx
   ```

### Passo 3: Obter Secret Key
1. Na mesma página, clique em "Reveal test key"
2. Copie a **Secret key** (começa com `sk_test_`)
3. Cole no `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_51Hxxxxxxxxxxxxx
   ```

### Passo 4: Obter Webhook Secret
1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em "Add endpoint"
3. URL do endpoint: `http://localhost:3000/api/hangarshare/webhook/stripe`
4. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Clique em "Add endpoint"
6. Copie o **Signing secret** (começa com `whsec_`)
7. Cole no `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 2️⃣ Resend (Emails)

### Passo 1: Criar Conta
1. Acesse: https://resend.com/signup
2. Crie sua conta gratuita (3.000 emails/mês)
3. Confirme seu email

### Passo 2: Obter API Key
1. Acesse: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Nome: `LoveToFly Production`
4. Permissões: **Full access**
5. Copie a key (começa com `re_`)
6. Cole no `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

---

## 3️⃣ Reiniciar Servidor

Depois de adicionar todas as chaves no `.env.local`:

```bash
# Parar o servidor (Ctrl+C ou)
lsof -ti:3000 | xargs kill -9

# Iniciar novamente
yarn dev
```

---

## ✅ Verificar Configuração

### Teste 1: Verificar Variáveis
Abra o terminal e execute:
```bash
node -e "console.log('Stripe PK:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0,20))"
```

### Teste 2: Fazer uma Reserva
1. Acesse: http://localhost:3000/hangarshare
2. Busque um hangar (ex: SBSP)
3. Selecione datas
4. Clique em "Confirmar Reserva"
5. Use cartão de teste:
   ```
   Número: 4242 4242 4242 4242
   Data: 12/34
   CVC: 123
   CEP: 12345-678
   ```

### Teste 3: Verificar Email
1. Se o pagamento for bem-sucedido
2. Acesse: https://resend.com/emails
3. Você deve ver os emails enviados

---

## 🎯 Cartões de Teste Stripe

| Cartão | Comportamento |
|--------|---------------|
| `4242 4242 4242 4242` | ✅ Sucesso |
| `4000 0000 0000 0002` | ❌ Recusado (limite insuficiente) |
| `4000 0000 0000 9995` | ❌ Recusado (cartão inválido) |
| `4000 0025 0000 3155` | 🔐 Requer autenticação 3D Secure |

---

## 🔒 Segurança

### ⚠️ NUNCA faça commit do .env.local
O arquivo já está no `.gitignore` - não suba suas chaves para o GitHub!

### ✅ Modo Teste vs Produção
- **Teste**: Chaves começam com `pk_test_` e `sk_test_`
- **Produção**: Chaves começam com `pk_live_` e `sk_live_`

Para produção, ative sua conta no Stripe e use as chaves `live`.

---

## 📚 Documentação Completa

- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
- Checkout deste projeto: `PAYMENT_INTEGRATION_COMPLETE.md`
- Emails deste projeto: `EMAIL_SETUP.md`

---

## 🆘 Problemas Comuns

### Erro: "Stripe publishable key ausente"
- Verifique se adicionou `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no `.env.local`
- Reinicie o servidor após adicionar

### Erro: "STRIPE_SECRET_KEY ausente"
- Verifique se adicionou `STRIPE_SECRET_KEY` no `.env.local`
- Reinicie o servidor

### Webhook não recebe eventos
- Use ngrok para testar localmente:
  ```bash
  ngrok http 3000
  ```
- Use a URL do ngrok no Stripe webhook endpoint

### Email não chega
- Verifique se adicionou `RESEND_API_KEY`
- Confira logs em: https://resend.com/emails
- Verifique spam/lixeira

---

## ✅ Checklist Final

- [ ] Conta Stripe criada
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY adicionada
- [ ] STRIPE_SECRET_KEY adicionada
- [ ] STRIPE_WEBHOOK_SECRET adicionada
- [ ] Conta Resend criada
- [ ] RESEND_API_KEY adicionada
- [ ] Servidor reiniciado
- [ ] Teste de pagamento realizado com sucesso
- [ ] Email de confirmação recebido

---

**Tempo estimado:** 5-10 minutos  
**Custo:** $0 (planos gratuitos)  
**Próximo passo:** Testar o fluxo completo de reserva!
