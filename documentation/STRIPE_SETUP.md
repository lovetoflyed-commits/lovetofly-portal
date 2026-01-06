# Integração Stripe - Love to Fly Portal

## 🔧 Setup Stripe

### 1. Criar Conta Stripe
1. Acesse https://dashboard.stripe.com/register
2. Cadastre-se com seu email
3. Complete a verificação

### 2. Obter Chaves de API
1. Vá para https://dashboard.stripe.com/apikeys
2. Copie suas chaves:
   - **Publishable Key** (pública) - `pk_test_...` ou `pk_live_...`
   - **Secret Key** (secreta) - `sk_test_...` ou `sk_live_...`

### 3. Configurar Variáveis de Ambiente
Adicione ao seu `.env.local`:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefg
STRIPE_SECRET_KEY=sk_test_1234567890abcdefghijklmnop

# Webhook Secret (após criar endpoint)
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrs
```

### 4. Criar Webhook
1. Vá para https://dashboard.stripe.com/webhooks
2. Clique em "Add an endpoint"
3. Configure:
   - **URL**: `https://seu-dominio.com/api/hangarshare/webhook/stripe`
   - **Eventos**: 
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
4. Copie o **Signing secret** e adicione como `STRIPE_WEBHOOK_SECRET` no `.env.local`

## 💳 Fluxo de Pagamento

### Teste com Cartões Demo
Use estes cartões para testar em modo **test**:

| Cartão | Expiração | CVC | Comportamento |
|--------|-----------|-----|---|
| `4242 4242 4242 4242` | Qualquer data futura | Qualquer CVC | ✅ Sucesso |
| `4000 0000 0000 0002` | Qualquer data futura | Qualquer CVC | ❌ Recusado |
| `5555 5555 5555 4444` | Qualquer data futura | Qualquer CVC | ✅ Mastercard |

### Processo Completo

1. **Usuário clica "Confirmar Reserva"**
   - Valida datas
   - Calcula preço total
   - Redireciona para `/hangarshare/booking/checkout`

2. **Página de Checkout**
   - Exibe resumo da reserva
   - Chama `/api/hangarshare/booking/confirm` (POST)
   - Retorna `clientSecret` do Stripe

3. **API de Confirmação** (`/api/hangarshare/booking/confirm`)
   ```typescript
   // 1. Valida dados
   // 2. Cria Stripe PaymentIntent
   // 3. Cria registro de booking com status "pending"
   // 4. Retorna clientSecret para o frontend
   ```

4. **Usuário entra dados do cartão**
   - Componente `CardElement` do Stripe
   - Valida em tempo real

5. **Confirmar Pagamento**
   - `stripe.confirmCardPayment(clientSecret, ...)`
   - Stripe processa cartão
   - Retorna resultado

6. **Webhook Stripe** (`/api/hangarshare/webhook/stripe`)
   - Recebe `payment_intent.succeeded`
   - Atualiza booking para `confirmed`
   - Envia email de confirmação (TODO)

7. **Sucesso**
   - Redireciona para `/hangarshare/booking/success`
   - Exibe número de confirmação

## 🔒 Segurança

- ✅ Chaves secretas nunca expostas ao cliente
- ✅ Validação de webhook com assinatura Stripe
- ✅ Criptografia TLS/SSL automática
- ✅ Conformidade PCI DSS (Stripe se encarrega)
- ✅ Tokens de cliente para autenticação

## 📊 Monitoramento

### Dashboard Stripe
- https://dashboard.stripe.com/payments
- Ver todas as transações
- Reembolsos
- Disputes

### Logs Local
- Verificar `console.error()` em caso de falha
- Webhook retorna `{ received: true }`

## 🧪 Teste Completo

```bash
# 1. Start dev server
yarn dev

# 2. Acesse
http://localhost:3000/hangarshare

# 3. Busque um hangar, calcule preço

# 4. Clique "Confirmar Reserva"

# 5. Use cartão 4242 4242 4242 4242

# 6. Veja confirmação em:
# - Página /booking/success
# - Dashboard Stripe

# 7. (Opcional) Testar webhook localmente
# Use Stripe CLI: stripe listen --forward-to localhost:3000/api/hangarshare/webhook/stripe
```

## 🚨 Troubleshooting

### "Missing Publishable Key"
- Verificar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` em `.env.local`
- Deve começar com `pk_`

### "Invalid API Key"
- Verificar `STRIPE_SECRET_KEY` em `.env.local`
- Deve começar com `sk_`

### Webhook não funciona localmente
- Usar **Stripe CLI**: `stripe listen`
- Substituir URL do webhook para localhost

### Pagamento recusado
- Usar cartão de teste correto
- Verificar data de expiração (futura)

## 📝 Próximos Passos

1. **Emails**
   - [ ] Enviar confirmação de reserva
   - [ ] Notificar proprietário do hangar
   - [ ] Cancelamento com reembolso

2. **Refunds**
   - [ ] Criar endpoint `/api/hangarshare/booking/refund`
   - [ ] Política de reembolso (X dias antes)

3. **Relatórios**
   - [ ] Relatório de vendas
   - [ ] Dados de ocupação do hangar

4. **Multi-moeda**
   - [ ] Suportar USD, EUR
   - [ ] Conversão automática

## 📚 Referências
- [Stripe Docs](https://stripe.com/docs)
- [Stripe React Library](https://stripe.com/docs/stripe-js/react)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Webhooks](https://stripe.com/docs/webhooks)
