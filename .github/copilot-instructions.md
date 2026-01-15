# Instruções para Agentes IA - Love to Fly Portal

## Arquitetura Core

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Neon PostgreSQL + Stripe + Resend  
**Padrão:** Co-location - APIs vivem no lado da feature (`src/app/api/**/route.ts`), não em "services" separadas

### Estrutura Crítica
- **Client State:** `src/context/AuthContext.tsx` → `useAuth()` hook (user, token via localStorage)
- **Language State:** `src/context/LanguageContext.tsx` → `useLanguage()` hook (language switching, i18n)
- **DB Connection:** `src/config/db.ts` → `pg.Pool` singleton; schemas em `src/migrations/` (sequencial: `00X_description.sql`)
- **UI Components:** `src/components/` compartilhados (Header, Sidebar, AuthGuard, HangarCarousel, LanguageSelector)
- **Translations:** `src/translations/` com pt.json, en.json, es.json (300+ keys cada)
- **Pages:** `src/app/` com `'use client'` em components interativos; layout.tsx raiz wrappa `<LanguageProvider><AuthProvider>`

---

## Fluxos de Trabalho Essenciais

### Desenvolvimento
```bash
npm run dev              # Inicia Next.js em http://localhost:3000
npm run build && npm run start  # Build/serve production
npm run lint            # ESLint check
```

### Banco de Dados (Neon PostgreSQL via node-pg-migrate)
```bash
npm run migrate         # Status das migrations
npm run migrate:up      # Executa próxima migration pendente
npm run migrate:down    # Desfaz última migration
npm run migrate:create  # Cria novo arquivo de migration
```

**Padrão de Migration:** Cada alteração em arquivo novo (`src/migrations/00X_...sql`). Usar `IF NOT EXISTS` e criar índices para FKs. Atualizar `src/types/db.d.ts` após.

### Variáveis de Ambiente
Obrigatórias em `.env.local`:
- `DATABASE_URL` (Neon PostgreSQL connection string)
- `JWT_SECRET`, `NEXTAUTH_SECRET` (autenticação)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (pagamentos)
- `RESEND_API_KEY` (emails)

Deploy (Netlify): adicione mesmas variáveis em Settings → Environment Variables

---

## Padrões de Código

### API Routes (`src/app/api/**/route.ts`)
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // validação, business logic
    const result = await pool.query('SELECT ...', [params]);
    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erro descritivo:', error);
    return NextResponse.json({ message: 'Erro' }, { status: 500 });
  }
}
```
- Sempre `try/catch` com `console.error()`
- Resposta: `NextResponse.json({ message|data }, { status })`
- Auth: JWT no header `Authorization: Bearer <token>` (verificar em autenticação)

### Autenticação
- Login em `/api/auth/login` → retorna `{ token, user: { id, name, email, plan } }`
- Context guarda `token` + `user` em localStorage
- Rotas privadas: usar `<AuthGuard>` ou validar `useAuth()` no client

### Componentes UI
- **Tailwind CSS** (configurado em `tailwind.config.js`)
- **Componentes reutilizáveis** em `src/components/`: Header, Sidebar, BookingModal, HangarCarousel
- **Dashboard modular** em `src/app/page.tsx`: objeto `modules` controla acesso por plano (free/premium/pro)

### Estado Global
- Usar `useAuth()` para obter `user`, `token`, `login()`, `logout()`
- localStorage persiste entre refresh
- Dados sensíveis (senhas, chaves) NUNCA no client

---

## Features Principais

### Internacionalização (i18n) - Multilingual Support
**Versão:** v1.0 - Completa e Production-Ready  
**Linguagens:** Português (🇧🇷), English (🇺🇸), Spanish (🇪🇸)

**Componentes:**
- `src/context/LanguageContext.tsx` → `useLanguage()` hook para acesso a idioma e função `t()`
- `src/components/LanguageSelector.tsx` → UI dropdown com flags para seleção
- `src/translations/pt.json|en.json|es.json` → Dicionários com 300+ keys cada
- `src/app/layout.tsx` → Wrapper `<LanguageProvider>` app-wide

**Como Usar:**
```typescript
import { useLanguage } from '@/context/LanguageContext';

export function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  return <h1>{t('section.key')}</h1>;
}
```

**Recursos:**
- ✅ Detecção automática de idioma do navegador
- ✅ Persistência em localStorage
- ✅ Troca instantânea sem reload
- ✅ Fallback seguro para SSR
- ✅ Type-safe com TypeScript
- ✅ 300+ keys traduzidas para cada idioma

**Adicionando Traduções:**
1. Add key to all 3 files: `src/translations/pt.json|en.json|es.json`
2. Use em component: `{t('section.key')}`

**Documentação:** `INTERNATIONALIZATION_COMPLETE.md`, `MULTILINGUAL_QUICK_START.md`, `MULTILINGUAL_VISUAL_GUIDE.md`

### HangarShare v1.0 (Marketplace de Hangares)
**Páginas:** `src/app/hangarshare/*`
- `/hangarshare/owner/setup` → Onboarding simplificado (6 campos de empresa)
- `/hangarshare/listing/create` → Formulário 4 passos com auto-fetch ICAO
- `/hangarshare/owner/dashboard` → Estatísticas + tabela de hangares + relatórios (PDF, CSV)

**APIs:**
- `GET /api/hangarshare/airport/search?icao=SBSP` → Busca aeródromos (migrations 008/009 com 14 aeródromos)
- `POST/GET /api/hangarshare/owners` → Gerencia perfis de anunciantes

**Nota:** APIs usam **mock data** - TODO conectar ao BD real

### Autenticação & Segurança
- JWT com `jsonwebtoken` lib, secret em `JWT_SECRET`
- Senha com `bcryptjs` (hashed em DB)
- `AuthContext` persiste sessão em localStorage + redireciona `/login` se expirado

### Pagamentos (Stripe)
- **Client:** `@stripe/react-stripe-js` + `@stripe/stripe-js` (CardElement, confirmPayment)
- **Server:** lib `stripe` cria PaymentIntent, webhook em `/api/hangarshare/webhook/stripe`
- Guias: `STRIPE_SETUP.md`, `PAYMENT_INTEGRATION.md`

### Emails (Resend)
- **Util function** em `src/utils/email.ts` (confirmação booking, notificação owner, falha pagamento)
- Webhook Stripe dispara envio
- Guia: `EMAIL_SETUP_GUIDE.md`

### Ferramentas de Voo
- **E6B Analógico/Digital:** `src/app/tools/e6b`
- **Assets Jeppesen:** `public/e6b/jeppesen/` (README.md com instruções)

### Relatórios
- **Libs:** jsPDF + jspdf-autotable
- **Dashboard HangarShare:** botão exporta PDF, CSV ou imprime

---

## Conhecidas Limitações & TODO

⚠️ **APIs usam mock data:** `/api/hangarshare/airport/search` e `/api/hangarshare/owners` retornam hardcoded data - substituir por queries ao `airport_icao` e `hangar_owners` tables  
⚠️ **Upload de fotos:** não implementado - será AWS S3 ou storage local  
⚠️ **Edição de anúncios:** botão existe mas endpoint não  

---

## Documentação de Referência (Prioridade)

1. **Guias de feature:** `HANGARSHARE_COMPLETE_GUIDE.md`, `EMAIL_SETUP_GUIDE.md`, `STRIPE_SETUP.md` (passo a passo)
2. **Entrega/Status:** `HANGARSHARE_ENHANCED.md`, `HANGARSHARE_DELIVERY_SUMMARY.md`
3. **Setup inicial:** `QUICK_START.md`, `START_HERE.md`
4. **Infraestrutura:** `NEON_SETUP.md` (BD), `DEPLOYMENT.md` (Netlify)

---

## Tips para Produtividade

- `src/app/login/page.tsx` é exemplo bom de flow auth client-side
- `src/app/page.tsx` mostra padrão dashboard com múltiplos módulos e gating por plano
- Migrations executam em ordem alfabética - sempre criar novo arquivo
- LocalStorage é o source of truth para auth - sincronize com JWT_SECRET
- Mock data ajuda development offline - mas TODO conectar ao BD antes de produção
