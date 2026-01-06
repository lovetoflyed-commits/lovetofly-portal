# HangarShare - Integração de Pagamentos Online

## Opções de Processadores de Pagamento para Brasil

### 1. **Stripe** (Recomendado)
- ✅ **Prós**: API robusta, documentação excelente, segurança PCI compliance
- ✅ Suporta cartões de crédito/débito brasileiros
- ✅ Checkout embutido ou hosted
- ✅ Webhooks para confirmação automática
- ❌ **Contras**: Taxa mais alta (4.99% + R$ 0.40 por transação)
- 📚 [Documentação Stripe Brasil](https://stripe.com/docs/payments)

**Configuração básica:**
```bash
npm install stripe @stripe/stripe-js
```

```typescript
// /api/hangarshare/payment/create-intent
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { amount, bookingId } = await req.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // cents
    currency: 'brl',
    metadata: { bookingId },
  });
  
  return Response.json({ clientSecret: paymentIntent.client_secret });
}
```

### 2. **Mercado Pago** (Mais Popular no Brasil)
- ✅ **Prós**: Muito usado no Brasil, menor taxa, aceita Pix
- ✅ Taxa: 3.99% + R$ 0.40 por transação
- ✅ Checkout transparente ou redirect
- ✅ Suporta Pix, boleto, cartão
- ❌ **Contras**: API menos intuitiva que Stripe
- 📚 [Documentação Mercado Pago](https://www.mercadopago.com.br/developers)

**Configuração básica:**
```bash
npm install mercadopago
```

```typescript
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const preference = await mercadopago.preferences.create({
  items: [{
    title: `Hangar ${listingId}`,
    quantity: days,
    unit_price: dailyRate,
  }],
  back_urls: {
    success: 'https://lovetofly.com.br/hangarshare/booking/success',
    failure: 'https://lovetofly.com.br/hangarshare/booking/failure',
  },
  notification_url: 'https://lovetofly.com.br/api/hangarshare/payment/webhook',
});
```

### 3. **PagSeguro / PagBank**
- ✅ Taxa: 3.49% + R$ 0.60
- ✅ Aceita todos os cartões brasileiros
- ✅ Suporta Pix e boleto
- ❌ Interface mais antiga
- 📚 [Documentação PagSeguro](https://dev.pagseguro.uol.com.br/)

### 4. **Asaas** (Melhor para Repasses)
- ✅ **Prós**: Focado em marketplaces/split de pagamento
- ✅ Taxa: 2.99% por transação
- ✅ Repasse automático para subconta do proprietário
- ✅ Suporta Pix, boleto, cartão
- ✅ API moderna e bem documentada
- 📚 [Documentação Asaas](https://docs.asaas.com/)

**Exemplo de Split Payment (Ideal para HangarShare):**
```typescript
const payment = await asaas.payments.create({
  customer: renterId,
  billingType: 'CREDIT_CARD',
  value: total,
  split: [
    {
      walletId: ownerWalletId, // Carteira do proprietário
      fixedValue: ownerPayout, // Valor líquido do proprietário
    },
    {
      walletId: platformWalletId, // Carteira da plataforma
      fixedValue: platformFee, // Comissão da plataforma
    },
  ],
});
```

---

## Recomendação para HangarShare

### Opção 1: **Asaas** (Melhor custo-benefício)
- Taxa baixa (2.99%)
- Split payment nativo (repasse automático ao proprietário)
- API moderna
- Suporta Pix (sem taxa adicional para o cliente)

### Opção 2: **Mercado Pago** (Mais confiança do usuário)
- Marca reconhecida no Brasil
- Taxa moderada (3.99%)
- Suporta Pix e boleto
- Checkout mais amigável

---

## Fluxo de Pagamento Recomendado

```
1. Usuário faz reserva → Cria `booking` com status='pending'
2. Se pagamento online:
   a. Cria payment intent no gateway
   b. Redireciona para checkout
   c. Gateway processa pagamento
   d. Webhook confirma pagamento
   e. Atualiza `booking` status='confirmed'
   f. Envia notificações
3. Se pagamento direto:
   a. Cria `booking` com status='awaiting_owner_confirmation'
   b. Notifica proprietário
   c. Proprietário confirma manualmente
```

---

## Variáveis de Ambiente Necessárias

Adicione ao `.env.local`:

```bash
# Asaas (Recomendado)
ASAAS_API_KEY=your_asaas_api_key
ASAAS_WALLET_ID=your_platform_wallet_id

# Ou Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your_mp_access_token
MERCADOPAGO_PUBLIC_KEY=your_mp_public_key

# Ou Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Estrutura de Taxas

| Método | Taxa Transação | Comissão Portal | Repasse Proprietário |
|--------|---------------|-----------------|---------------------|
| **Asaas** | 2.99% | 10% | 87.01% |
| **Mercado Pago** | 3.99% + R$ 0.40 | 10% | ~86% |
| **Stripe** | 4.99% + R$ 0.40 | 10% | ~85% |
| **Direto** | 0% | 0% | 100% |

---

## Próximos Passos

1. Escolher processador de pagamento (sugestão: **Asaas**)
2. Criar conta na plataforma escolhida
3. Obter API keys (sandbox para testes, produção para live)
4. Implementar endpoint `/api/hangarshare/payment/create-intent`
5. Implementar webhook `/api/hangarshare/payment/webhook`
6. Testar fluxo completo em sandbox
7. Ativar em produção

---

## Considerações de Segurança

- ✅ **NUNCA** armazene dados de cartão no seu banco
- ✅ Use HTTPS em produção (Netlify já fornece)
- ✅ Valide webhooks com assinaturas (HMAC)
- ✅ Armazene apenas `payment_intent_id` ou `transaction_id`
- ✅ Implemente rate limiting nos endpoints de pagamento
- ✅ Log todas as transações para auditoria

---

## Documentação de Referência

- [Asaas API Docs](https://docs.asaas.com/)
- [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- [Stripe Brazil Guide](https://stripe.com/docs/payments/payment-methods/brazil)
- [PagSeguro API](https://dev.pagseguro.uol.com.br/)

---

**Atualizado:** 26 de dezembro de 2025
