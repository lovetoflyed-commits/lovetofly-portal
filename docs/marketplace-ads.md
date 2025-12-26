# Classificados de Aeronaves — Requisitos, Fluxos e Conformidade

> Mensagem do solicitante (para histórico de decisão):
> "Vamos ter que elaborar uma forma de um anunciante poder escolher o tipo de anuncio, fazer o pagamento, cadastrar as aeronaves, enviar imagens, e uma forma de fazer uma verificacao da identidade do anunciante e buscar meios de podermos saber se ele possui algo que comprove que ele é autorizado ou o tpo de vinculo com o proprietario. Podem ser empresas, agentes, despachante, o próprio proprietario, mas temos que nos respaldar legalmente para que nao sejamos responsabilizados em caso que alguem cadastrar uma aeronave que tenha algum problema legal ou anuncio frauldulento. Nao podemos nos responsabilizer pelos anincios, mas temos que evitar a facilitacao de anunciantes falsos e estelionatarios."

## Objetivo
- Permitir anúncios de aeronaves com pagamento e verificação de identidade/autoridade.
- Mitigar fraude e responsabilidade, mantendo trilhas de auditoria e política de remoção.

## Escopo (MVP)
- Cadastro de anunciante (pessoa física/jurídica) + KYC/KYB.
- Planos de anúncio (gratuito limitado / premium / destaque) com Stripe.
- Criação de anúncio: dados da aeronave, preço/condições, mídia (imagens/vídeo), documentos comprobatórios.
- Fluxo de revisão/moderação antes de publicar.
- Canal de denúncia e política de takedown com SLA.

## Fluxo do Anunciante
- Escolhe tipo de anúncio/Plano → autentica → preenche perfil do anunciante.
- Passa por verificação (KYC/KYB + checagens automáticas) → pagamento do plano/taxa.
- Cadastra aeronave: dados técnicos, histórico, manutenção, status legal, preço/contato.
- Envia imagens (mín. 6 — externa, cabina, painel, série/placa quando aplicável) e documentos.
- Submete para revisão → moderação aprova/reprova com justificativa → publicação.

## Verificação de Identidade (KYC/KYB)
- Pessoa física: RG/Passaporte + selfie com liveness + CPF (validação algorítmica).
- Pessoa jurídica: CNPJ, contrato social/atos, representante legal + documento do representante.
- Autorização/Vínculo com proprietário:
  - Propriedade direta: matrícula (RAB/FAA), Bill of Sale, apólice de seguro com proprietário.
  - Procuração/mandato: documento assinado digitalmente pelo proprietário.
  - Empresa/agente/despachante: contrato de intermediação, carta de autorização.
- Checagens automáticas:
  - Consulta RAB/ANAC (ou FAA) por matrícula/serial.
  - Cross-check de titularidade/operador quando disponível.
  - Verificação de sanções/listas restritivas (quando aplicável).

## Prevenção a Fraudes
- Rate limiting por IP/usuário, fingerprint do dispositivo, reCAPTCHA v3.
- Validação de metadados de imagem (EXIF) e varredura de malware.
- Bloqueio de domínios de e-mail descartáveis, validação MX.
- Pagamentos com 3D Secure, webhooks de chargeback e suspensão automática de anúncios.
- Auditoria completa: quem fez o quê, quando, de onde (IP, user agent).

## Pagamentos e Planos (Stripe)
- Planos:
  - Gratuito: 1 anúncio, 5 fotos, duração limitada.
  - Premium: múltiplos anúncios, 15 fotos, destaque básico.
  - Destaque: prioridade no carrossel/home, 25 fotos, badge "Featured".
- Cobrança recorrente (mensal/anual) ou taxa única por anúncio.
- Webhooks: `checkout.session.completed`, `invoice.paid`, `charge.refunded`, `charge.dispute.created` → atualizar status do anúncio/perfil.

## Dados do Anúncio (Campos sugeridos)
- Identificação: título, categoria (monomotor pistão, aerodesportiva, bimotor turboélice, jato leve, etc.).
- Especificações: ano, TT, TBO restante, motores/hélices (horas desde overhaul), avionics, equipamentos IFR/VFR, histórico de incidentes.
- Documentos: matrícula (RAB/FAA), logbooks (opcional), procuração/mandato (quando aplicável).
- Comercial: preço, condições (CALL FOR PRICE), localização, disponibilidade de financiamento.
- Contato: e-mail verificado, telefone no formato internacional +XX (XX) XXXXX-XXXX.

## Modelo de Dados (Esboço)
- User(id, name, email, plan, ...)
- AdvertiserProfile(id, userId, type[pessoa/empresa], cpf, cnpj, status)
- VerificationRequest(id, advertiserId, status[pending/approved/rejected], reasons, reviewerId, createdAt)
- OwnershipClaim(id, advertiserId, aircraftId?, registryNumber, authority[RAB/FAA], documents[], status)
- AircraftListing(id, advertiserId, title, category, specsJSON, price, currency, location, status[draft/review/published/suspended], featured, publishedAt)
- ListingImage(id, listingId, url, order)
- Payment(id, advertiserId, providerId, plan, amount, currency, status, rawWebhookJSON)
- AuditLog(id, actorId, action, entityType, entityId, metaJSON, ip, userAgent, createdAt)
- Report(id, listingId, reporterId?, reason, details, status, handledBy, handledAt)

## APIs (Esboço de rotas App Router)
- POST /api/ads/verification → inicia KYC/KYB
- GET  /api/ads/verification/:id → status
- POST /api/ads/listings → cria/atualiza anúncio (draft)
- POST /api/ads/listings/:id/submit → envia para revisão
- POST /api/ads/listings/:id/images → upload assinado (S3)
- POST /api/ads/payments/checkout → cria sessão Stripe
- POST /api/ads/webhooks/stripe → recebe eventos
- POST /api/ads/reports → denúncias do público
- POST /api/ads/moderation/:id/decision → aprova/reprova

## Upload de Imagens
- Armazenamento: S3 (ou R2) com URLs assinadas; redimensionamento serverless.
- Política: mínimo 6, máximo conforme plano; formatos aceitos (JPEG/PNG/WebP), tamanho máx.

## Moderação e Auditoria
- Fila interna para revisores com visão dos documentos e checagens automáticas.
- Auditoria imutável (WORM) para decisões de moderação.
- Suspensão automática ao receber disputa de pagamento ou denúncia grave.

## Conformidade Legal e Termos
- Disclaimer: o portal é plataforma de anúncios, não parte da negociação; sem garantias sobre estado da aeronave; incentivo à due diligence do comprador.
- Termos e Política de Anúncios: proíbem informações falsas, exigem comprovação de autorização.
- Política de Takedown: canal de denúncia, triagem, SLA de remoção, guarda de evidências.
- LGPD/GDPR: base legal para tratamento de dados (execução de contrato e legítimo interesse), retenção e descarte.

## Métricas e Logs
- KPIs: taxa de aprovação em KYC, tempo de revisão, taxa de denúncias, chargebacks, CTR do destaque.
- Logs centralizados (nivelados por severidade) e alertas para eventos anômalos.

## Próximos Passos (Backlog executivo)
- Definir planos e preços → criar produtos no Stripe.
- Integrar provedor de KYC (Onfido, Veriff, Persona) e upload de documentos.
- Implementar entidades e migrações (VerificationRequest, OwnershipClaim, AircraftListing, ListingImage, Payment, AuditLog, Report).
- Construir APIs e painel de moderação.
- Redigir Termos de Uso/Política de Anúncios/Política de Takedown com jurídico.
- Lançar piloto com lista de espera de anunciantes verificados.

---

## Seções Complementares: Compartilhamento, Manutenção e Hangaragem

### 1) Compartilhamento de Aeronaves
- Nomenclaturas aceitas no mercado:
  - Propriedade Fracionada (Fractional Ownership)
  - Co-Ownership / Partnership
  - Jet Card (créditos de horas, geralmente jatos executivos)
  - Time Sharing / Dry Lease (conforme regulamentação aplicável)
  - Clubes Aéreos / Aeroclubes (modelo associativo)
- Objetivo da seção:
  - Catálogo de ofertas de cotas/horas por operadores/empresas especializadas.
  - Informações claras de aeronave, frota, disponibilidade, bases de operação, regras de uso, preço/hora/bloco.
  - Fluxo de qualificação do interessado (KYC), checagem de elegibilidade (habilitação/tipo), apólice de seguro.
  - Mensageria segura entre interessado e operador; registro de intenções e trilha de auditoria.
- Requisitos e compliance:
  - Evidências de autorização do operador e de regularidade (AOC/Certificado, quando aplicável).
  - Links/integração para verificação de matrícula (RAB/ANAC ou FAA) e manutenção.
  - Disclaimers de que o portal não intermedeia operações de transporte aéreo nem presta serviço aéreo.
- Dados sugeridos:
  - Provider/Operator (id, razão social, contatos, certificações), Fleet (tipo, matrícula, capacidade), Offer (modelo de preço, franquias, política de cancelamento), Insurance.
- APIs (rascunho):
  - GET/POST /api/sharing/providers, /api/sharing/offers, /api/sharing/intents
  - POST /api/sharing/kyc → reuso do KYC do anunciante.

### 2) Manutenção de Aeronaves (MRO Directory + RFQ)
- Diretório de oficinas/MRO: categorias (motor, estrutura, aviônicos, pintura), certificações, bases, SLA médio, avaliações.
- RFQ (Request for Quote): proprietário descreve serviço; oficinas elegíveis recebem notificação e respondem proposta.
- Upload de documentação (logbooks, relatórios, fotos) com expurgo controlado.
- Integrações futuras: trackers de manutenção/airworthiness.
- Dados sugeridos: MRO(id, escopos, certificações, bases), ServiceRequest(id, aeronave, escopo, anexos), Quote(id, valores, prazos, garantias).
- APIs (rascunho): /api/mro/providers, /api/mro/requests, /api/mro/quotes

### 3) Hangaragem e Aluguel de Hangares (Diária/Mensal) + Reserva Antecipada
- Caso de uso: piloto/proprietário agenda hangar no aeródromo de destino para pernoite, semana ou períodos variáveis.
- Catálogo de hangares com disponibilidade, dimensões, amenities (energia, GPU, combustível, segurança, lounge), regras de acesso e contatos.
- Reserva com janela (check-in/out), política de cancelamento e pagamento seguro (Stripe); confirmação e instruções de acesso.
- Operadores podem gerenciar calendários, bloqueios e preços dinâmicos.
- Dados sugeridos:
  - Facility(id, aeródromo/ICAO, endereço, contatos, amenities)
  - Hangar(id, facilityId, dimensões, vagas, restrições, fotos)
  - Availability(id, hangarId, intervalo, preço, tipo[diária/mensal])
  - Booking(id, hangarId, usuário, período, preço, status[pending/confirmed/cancelled], policyId)
  - Policy(id, regras de cancelamento/no-show)
- APIs (rascunho):
  - GET/POST /api/hangars/facilities, /api/hangars/units, /api/hangars/availability
  - POST /api/hangars/bookings → cria reserva; webhooks de pagamento → confirma/suspende.

### 4) Anti-fraude e Responsabilidade (aplica às três seções)
- Reuso de KYC/KYB, verificação de domínio corporativo e contratos.
- Rate limiting, reCAPTCHA, device fingerprint e auditoria WORM.
- Canal de denúncia e processos de takedown com SLA.
- Disclaimers específicos por modalidade; mencionar necessidade de observar regulamentação local (ANAC/RBAC/FAA) — sem aconselhamento jurídico.

### 5) Backlog Inicial para essas Seções
- Especificar entidades e migrações (Sharing, MRO, Hangars/Bookings) alinhadas ao modelo acima.
- Prototipar UIs: catálogo, detalhes, formulário de intenção/RFQ/reserva.
- Integração Stripe para reservas e taxas de serviço.
- Redigir políticas específicas e atualizar ToS/Privacy.
