# Roadmap Revisado - Prioridades Ajustadas para Registro Legal
Data: 9 de janeiro de 2026  
Revisão: v2.0 - Alinhado com requisitos de marca e empresa  
Status Atual: 95% desenvolvimento técnico + 0% registro legal

---
## 🎯 Novo Foco: Lançamento Legal + Técnico Integrado

### Objetivo Principal
Garantir que o portal esteja **tecnicamente pronto** E **legalmente protegido** antes do lançamento público (9 de fevereiro de 2026).

---
## 📅 Timeline Ajustada (4 Semanas)

```
Semana 1 (Jan 9-15):  LEGAL + Mock→Real DB
Semana 2 (Jan 16-22): LEGAL + Photos + Edit
Semana 3 (Jan 23-29): LEGAL + Booking + Docs
Semana 4 (Jan 30-Feb 9): TESTES + LAUNCH
```

---
## 🔴 FASE 0: PROTEÇÃO LEGAL (PARALELO A TODO DESENVOLVIMENTO)

### Status: ⚠️ CRÍTICO - BLOQUEANTE PARA LANÇAMENTO
**Duração:** Semana 1-3 (paralelo ao desenvolvimento)  
**Responsável:** CEO/Founder + Advogado  
**Effort:** ~20-30 horas (administrativo)

### Tarefas Legais Obrigatórias

#### Semana 1 (Jan 9-15): Preparação + Reunião Legal
**Prazo:** Antes de 15 de janeiro

- [ ] **DIA 1-2: Pesquisa INPI**
  - [ ] Buscar "Love to Fly" no INPI (https://busca.inpi.gov.br)
  - [ ] Verificar classes 35, 36, 39, 41, 42
  - [ ] Documentar resultados (registros existentes, conflitos)
  - [ ] Verificar "Portal da Aviação Civil" (verificação secundária)
  - **Tempo:** 2-3 horas
  - **Output:** Relatório de busca INPI preenchido

- [ ] **DIA 2-3: Verificação de Domínios**
  - [ ] WHOIS lovetofly.com.br (confirmar propriedade)
  - [ ] Verificar lovetofly.com (disponibilidade)
  - [ ] Verificar variações (loveto-fly.com.br, love-to-fly.com.br)
  - [ ] Verificar domínios complementares (hangarshare.com.br)
  - **Tempo:** 1-2 horas
  - **Output:** Lista de domínios (próprios, disponíveis, indisponíveis)

- [ ] **DIA 3-4: Preparar Documentação**
  - [ ] Compilar documentos da empresa (CNPJ, contrato social)
  - [ ] Listar sócios e participações
  - [ ] Preparar exemplos de código-fonte (IP)
  - [ ] Lista de npm packages (auditoria open-source)
  - [ ] Screenshots da plataforma (demo para advogado)
  - **Tempo:** 2-3 horas
  - **Output:** Pasta completa para reunião

- [ ] **DIA 5: Reunião com Advogado** ⭐
  - [ ] Apresentar pesquisa INPI
  - [ ] Solicitar registro de marca "Love to Fly"
  - [ ] Discutir classes de registro (35, 36, 39, 41, 42)
  - [ ] Revisar NDA, Privacy Policy, Terms of Service
  - [ ] Definir DPO (interno ou externo)
  - [ ] Discutir LGPD compliance
  - [ ] Obter timeline de registro (INPI)
  - [ ] Obter orçamento completo
  - **Tempo:** 1-2 horas
  - **Output:** Contrato jurídico + roadmap de registros

#### Semana 2 (Jan 16-22): Execução Registro + LGPD
**Prazo:** Até 22 de janeiro

- [ ] **Registro de Marca INPI** (via advogado)
  - [ ] Protocolar pedido de registro "Love to Fly"
  - [ ] Classes: 35 (serviços), 36 (financeiro), 39 (transporte), 41 (educação), 42 (software)
  - [ ] Acompanhar número de protocolo
  - [ ] Estimativa: 6-12 meses até registro final (mas protocolo já protege)
  - **Tempo:** 5-10 horas (advogado)
  - **Output:** Protocolo INPI com número de pedido

- [ ] **Privacy Policy & Terms of Service** (revisão jurídica)
  - [ ] Advogado revisa versões atuais
  - [ ] Ajustes para compliance LGPD
  - [ ] Publicar versões finais no site
  - [ ] Adicionar links em footer + signup
  - **Tempo:** 3-5 horas (advogado + dev)
  - **Output:** Documentos finalizados e publicados

- [ ] **DPO (Data Protection Officer)**
  - [ ] Definir responsável LGPD (interno ou advogado)
  - [ ] Criar email privacy@lovetofly.com.br
  - [ ] Publicar contato no site (footer + privacy policy)
  - **Tempo:** 1 hora
  - **Output:** DPO designado e publicado

- [ ] **Domínios Complementares**
  - [ ] Registrar lovetofly.com (se disponível e viável)
  - [ ] Registrar variações defensivas (opcional)
  - [ ] Configurar redirecionamentos
  - **Tempo:** 1-2 horas
  - **Output:** Domínios registrados e configurados

#### Semana 3 (Jan 23-29): Compliance Final + Beta Testers
**Prazo:** Até 29 de janeiro

- [ ] **NDA + Beta Terms** (finalizar)
  - [ ] Advogado revisa NDA final
  - [ ] Advogado revisa Beta Terms
  - [ ] Preparar para assinatura digital (DocuSign ou PDF)
  - **Tempo:** 2-3 horas
  - **Output:** Documentos prontos para beta testers

- [ ] **LGPD Compliance Check**
  - [ ] Revisar consent forms (signup)
  - [ ] Implementar direitos do titular (access, delete, portability)
  - [ ] Testar fluxo de consentimento
  - [ ] Documentar política de retenção de dados
  - **Tempo:** 4-5 horas (dev + legal)
  - **Output:** Sistema LGPD-compliant

- [ ] **Recrutamento Beta Testers** (início)
  - [ ] Enviar convites para 15-25 testers
  - [ ] Coletar assinaturas de NDA
  - [ ] Preparar onboarding
  - **Tempo:** 3-5 horas
  - **Output:** 15-25 beta testers confirmados

#### Semana 4 (Jan 30 - Feb 9): Onboarding + Testes
**Prazo:** Lançamento 9 de fevereiro

- [ ] **Beta Testing**
  - [ ] Liberar acesso aos beta testers
  - [ ] Coletar feedback
  - [ ] Corrigir bugs críticos
  - **Tempo:** 20+ horas
  - **Output:** Sistema testado e validado

- [ ] **Verificação Final Legal**
  - [ ] Confirmar protocolo INPI ativo
  - [ ] Confirmar Privacy Policy publicada
  - [ ] Confirmar DPO designado
  - [ ] Confirmar NDAs assinados
  - **Tempo:** 1-2 horas
  - **Output:** Checklist legal 100% completo

---
## 🔴 FASE 1: DESENVOLVIMENTO CRÍTICO (Semanas 1-3)

### Semana 1 (Jan 9-15): Mock→Real DB + Listing Edit
**Foco:** Dados reais e gestão de anúncios

**Backend:**
- [ ] Substituir mock airports por query PostgreSQL
  - Arquivo: `src/app/api/hangarshare/airport/search/route.ts`
  - Query: `SELECT * FROM airport_icao WHERE icao ILIKE $1 OR city ILIKE $1`
  - Tempo: 3-4 horas

- [ ] Substituir mock owners por query PostgreSQL
  - Arquivo: `src/app/api/hangarshare/owners/route.ts`
  - Query: `SELECT * FROM hangar_owners WHERE user_id = $1`
  - Tempo: 2-3 horas

- [ ] Criar endpoint PUT/PATCH para edição de listing
  - Arquivo: `src/app/api/hangarshare/listings/[id]/route.ts`
  - Validação + autorização (owner only)
  - Tempo: 4-5 horas

**Frontend:**
- [ ] Página de edição de listing
  - Arquivo: `src/app/hangarshare/listing/[id]/edit/page.tsx`
  - Pre-fill com dados existentes
  - Tempo: 5-6 horas

- [ ] Wire edit button em dashboard
  - Tempo: 1 hora

**Total Semana 1 Dev:** ~20 horas  
**Total Semana 1 Legal:** ~10 horas  
**Output:** Dados reais + edição funcional + reunião legal completa

---

### Semana 2 (Jan 16-22): Photo Upload + Document Storage
**Foco:** Upload de mídia e verificação

**Backend:**
- [ ] Escolher storage (AWS S3 / Vercel Blob)
  - Recomendação: Vercel Blob (integrado, simples)
  - Setup: variáveis env, configuração
  - Tempo: 2-3 horas

- [ ] Abstração de storage
  - Arquivo: `src/utils/storage.ts`
  - Upload, delete, get URL
  - Tempo: 3-4 horas

- [ ] Endpoint upload de fotos
  - Arquivo: `src/app/api/hangarshare/listings/[id]/upload-photo/route.ts`
  - Validação (formato, tamanho, quantidade)
  - Tempo: 4-5 horas

- [ ] Endpoint de documentos (owner verification)
  - Arquivo: `src/app/api/hangarshare/owners/upload-document/route.ts`
  - Tempo: 3-4 horas

**Frontend:**
- [ ] Componente drag-drop de fotos
  - Componente: `src/components/PhotoUpload.tsx`
  - Multi-select, preview, reorder
  - Tempo: 6-8 hours

- [ ] Integração em wizard de criação
  - Tempo: 2-3 horas

**Total Semana 2 Dev:** ~25 horas  
**Total Semana 2 Legal:** ~10 horas  
**Output:** Upload funcional + registro INPI protocolado

---

### Semana 3 (Jan 23-29): Booking Status + Document Verification
**Foco:** Gestão de reservas e verificação de proprietários

**Backend:**
- [ ] Endpoint PATCH booking status
  - Arquivo: `src/app/api/hangarshare/bookings/[id]/status/route.ts`
  - Transições: pending→confirmed, confirmed→completed, any→cancelled
  - Validação de regras de negócio
  - Tempo: 4-5 horas

- [ ] Integração de reembolso (Stripe Refund API)
  - Para cancelamentos
  - Tempo: 3-4 horas

- [ ] Email notifications de status
  - Usando Resend (já configurado)
  - Templates: confirmação, cancelamento, conclusão
  - Tempo: 3-4 horas

- [ ] Admin dashboard para verificação de docs
  - Arquivo: `src/app/admin/verify-documents/page.tsx`
  - Aprovar/rejeitar documentos
  - Tempo: 5-6 horas

**Frontend:**
- [ ] Painel de gerenciamento de bookings (owner)
  - Ver bookings, confirmar/recusar, cancelar
  - Tempo: 5-6 horas

- [ ] Notificações de status (user)
  - Emails automáticos
  - Tempo: 2-3 horas

**Total Semana 3 Dev:** ~25 horas  
**Total Semana 3 Legal:** ~8 horas  
**Output:** Reservas gerenciáveis + docs verificáveis + beta testers onboarded

---
## 🟡 FASE 2: TESTES E POLISH (Semana 4)

### Semana 4 (Jan 30 - Feb 9): Beta Testing + Launch Prep
**Foco:** Validação com usuários reais e preparação final

**Testing:**
- [ ] Beta testers testando plataforma (1-2 semanas)
- [ ] Coletar feedback estruturado
- [ ] Bugs críticos → fix imediato
- [ ] Bugs não-críticos → backlog
- [ ] Tempo: 20+ horas

**Security & Performance:**
- [ ] Security audit básico
- [ ] Performance check (Lighthouse)
- [ ] Mobile responsiveness
- [ ] Tempo: 8-10 horas

**Monitoring:**
- [ ] Setup Sentry.io (error tracking)
- [ ] Setup analytics (Vercel/Posthog)
- [ ] Status page (opcional)
- [ ] Tempo: 4-5 horas

**Legal Final:**
- [ ] Todos NDAs assinados
- [ ] Privacy Policy + ToS publicados
- [ ] DPO designado e publicado
- [ ] Protocolo INPI confirmado
- [ ] Tempo: 2-3 horas

**Total Semana 4:** ~35 horas  
**Output:** Sistema testado, seguro e legalmente protegido

---
## 📊 Comparação: Roadmap Anterior vs. Revisado

| Aspecto | Roadmap Anterior | Roadmap Revisado |
|---------|------------------|------------------|
| Duração | 6 semanas | 4 semanas |
| Foco Legal | Nenhum | 25-30 horas |
| Launch Target | Feb 23 | Feb 9 |
| Registro INPI | Não mencionado | Obrigatório (Semana 2) |
| LGPD | Mencionado | Implementado (Semana 2-3) |
| Beta Testers | Não planejado | 15-25 testers (Semana 3-4) |
| NDA/Legal Docs | Não mencionado | Finalizados (Semana 3) |
| Risco Legal | Alto | Baixo (protegido) |

---
## ✅ Checklist de Lançamento Integrado

### Legal (Bloqueante para launch)
- [ ] Protocolo de registro "Love to Fly" no INPI ativo
- [ ] Privacy Policy publicada em /privacy
- [ ] Terms of Service publicados em /terms
- [ ] DPO designado e contato publicado (privacy@lovetofly.com.br)
- [ ] NDA e Beta Terms finalizados e assinados
- [ ] LGPD compliance implementado (consent, direitos titular)
- [ ] Domínio lovetofly.com.br confirmado (WHOIS)
- [ ] Domínios complementares registrados (opcional mas recomendado)

### Técnico (Bloqueante para launch)
- [ ] Mock data substituído por queries reais
- [ ] Edição de listings funcional
- [ ] Upload de fotos funcional
- [ ] Upload de documentos funcional
- [ ] Status de booking gerenciável
- [ ] Reembolso via Stripe testado
- [ ] Emails transacionais funcionando
- [ ] Security audit básico completo
- [ ] Performance otimizada (Lighthouse >80)
- [ ] Monitoring ativo (Sentry + analytics)

### Beta Testing (Validação)
- [ ] 15-25 beta testers confirmados
- [ ] NDAs assinados por todos
- [ ] 1-2 semanas de testes ativos
- [ ] Feedback coletado e bugs críticos corrigidos
- [ ] Go/No-Go decision tomada (48h antes de launch)

---
## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Registro INPI demorar | Alta | Médio | Protocolo já protege; registro completo leva meses mas launch pode ocorrer |
| Advogado atrasar | Média | Alto | Ter 2-3 contatos backup; documentos já preparados aceleram |
| Beta testers não responderem | Média | Médio | Recrutar 25 (meta 15 ativos); incentivos claros |
| Bugs críticos em produção | Média | Alto | Beta testing de 1-2 semanas; rollback plan |
| LGPD não-compliance | Baixa | Crítico | Advogado revisa; checklist clara; DPO designado |

---
## 📞 Próximas Ações Imediatas (Jan 9-10)

### Hoje (Jan 9):
1. ✅ Buscar "Love to Fly" no INPI (2-3 horas)
2. ✅ WHOIS de lovetofly.com.br (30 min)
3. ✅ Compilar documentos para advogado (1-2 horas)
4. ✅ Agendar/confirmar reunião com advogado (se ainda não feito)

### Amanhã (Jan 10):
1. Finalizar preparação para reunião legal
2. Começar desenvolvimento: Mock→Real DB (backend)
3. Revisar Privacy Policy atual (draft para advogado)

### Próxima Semana (Jan 13-15):
1. Reunião com advogado (dia agendado)
2. Protocolar registro INPI (via advogado)
3. Continuar desenvolvimento paralelo

---
## 📈 Métricas de Sucesso

### Legal:
- Protocolo INPI obtido antes de Feb 1
- Privacy Policy + ToS publicados antes de Feb 1
- DPO designado antes de Feb 1
- 100% beta testers com NDA assinado

### Técnico:
- 100% dados reais (zero mock)
- Upload de fotos funcional
- Booking management 100%
- Zero bugs críticos em produção

### Negócio:
- 15+ beta testers ativos
- Feedback positivo (NPS > 8)
- Zero incidentes de segurança
- Launch em Feb 9 ou antes

---
*Roadmap revisado: 9 de janeiro de 2026*  
*Foco: Legal + Técnico integrado*  
*Timeline: 4 semanas até lançamento protegido*
