# HangarShare - Sistema de Reserva de Hangares

## 📋 Visão Geral

**HangarShare** é uma plataforma de intermediação que conecta proprietários de hangares com pilotos e operadores que necessitam de estacionamento temporário ou de longo prazo para suas aeronaves.

### Nomenclatura Oficial
Na aviação internacional, o termo mais comum é:
- **Transient Parking** (estacionamento transitório)
- **Hangar Rental/Sharing** (aluguel/compartilhamento de hangar)
- **Aircraft Storage** (armazenamento de aeronaves)
- Parte dos serviços de **FBO** (Fixed Base Operator)

---

## 🎯 Funcionalidades Principais

### Para Usuários (Pilotos/Operadores)
- ✈️ Busca de hangares por código ICAO ou localização
- 📅 Reserva online com confirmação automática
- 💳 Pagamento online seguro ou direto com proprietário
- 📱 Notificações por e-mail e SMS
- ⭐ Sistema de avaliações e reputação
- 🔄 Política de cancelamento flexível

### Para Proprietários de Hangares
- 🏢 Cadastro de hangares com verificação de identidade
- 📊 Gestão completa de disponibilidade e preços
- 💰 Repasse automático de pagamentos
- 📈 Painel de controle com estatísticas
- 📸 Upload de fotos e documentos
- 🛡️ Proteção contra fraudes

### Para Administradores
- ✅ Sistema de verificação de proprietários
- 🔍 Moderação de anúncios
- 📊 Analytics e relatórios
- 🚨 Sistema de denúncias e resolução de conflitos

---

## 🗄️ Estrutura de Banco de Dados

### Tabelas Criadas

1. **hangar_listings** - Anúncios de hangares
   - Informações do aeródromo (ICAO, cidade, estado)
   - Detalhes do hangar (número, tamanho, localização)
   - Categorias de aeronaves aceitas
   - Preços (horário, diário, semanal, mensal)
   - Disponibilidade e horários de operação
   - Fotos e descrição
   - Status de verificação

2. **hangar_bookings** - Reservas
   - Dados da aeronave (matrícula, tipo, dimensões)
   - Dados do piloto em comando
   - Datas e horários de entrada/saída
   - Informações de pagamento
   - Status da reserva
   - Solicitações especiais

3. **hangar_owner_verification** - Verificação de Proprietários
   - Documentos de identidade (RG, CNH, Passaporte)
   - Comprovantes de propriedade/autorização
   - Selfie com documento
   - Dados biométricos (opcional)
   - Status de verificação
   - Aceite de termos

4. **users** (colunas adicionadas)
   - `is_hangar_owner` - Flag de proprietário
   - `hangar_owner_verified` - Verificação aprovada
   - `hangar_owner_plan` - Plano do proprietário
   - Contadores de hangares e reservas
   - Ratings como proprietário e locatário

---

## 💰 Modelo de Negócio

### Planos para Proprietários

| Plano | Custo Mensal | Anúncios | Comissão Online | Fotos | Destaque |
|-------|--------------|----------|-----------------|-------|----------|
| **Básico** | Gratuito | 1 hangar | 15% | 5 | Não |
| **Profissional** | R$ 49,90 | 5 hangares | 10% | 20 | Sim |
| **Premium** | R$ 99,90 | Ilimitado | 5% | Ilimitadas | Sim |

### Estrutura de Taxas

- **Pagamento Online**: 10% comissão + taxa do gateway (~3%)
- **Pagamento Direto**: 0% (sem comissão)
- **Repasse ao Proprietário**: 7 dias após check-in confirmado

### Opções de Período

- ⏱️ **Pernoite** (overnight) - 1 noite
- 📆 **Diária** (daily) - por dia
- 📅 **Semanal** (weekly) - 7 dias
- 📊 **Mensal** (monthly) - 30 dias
- 🔒 **Longo prazo** (long-term) - negociável

---

## 🔐 Verificação de Identidade

### Documentos Necessários (Proprietários)

**1. Identidade:**
- RG, CNH ou Passaporte válido
- Frente e verso em alta resolução
- Selfie segurando o documento

**2. Propriedade do Hangar:**
- **Proprietário**: Escritura ou matrícula do imóvel
- **Locatário**: Contrato de locação vigente
- **Autorizado**: Carta de autorização + documento do proprietário

**3. Biometria (Opcional):**
- Verificação facial automática
- Comparação com documento

### Processo de Verificação
1. Proprietário envia documentos
2. Sistema valida automaticamente (OCR + AI)
3. Equipe revisa manualmente (48-72h)
4. Aprovação ou solicitação de correções
5. Proprietário pode começar a anunciar

---

## 💳 Integração de Pagamentos

### Processadores Recomendados

**1. Asaas (Recomendado)**
- Taxa: 2.99%
- Split payment nativo
- Suporta Pix, boleto, cartão

**2. Mercado Pago**
- Taxa: 3.99% + R$ 0.40
- Marca reconhecida
- Suporta Pix e boleto

**3. Stripe**
- Taxa: 4.99% + R$ 0.40
- API robusta
- Melhor documentação

Ver [PAYMENT_INTEGRATION.md](../PAYMENT_INTEGRATION.md) para detalhes completos.

---

## 📜 Aspectos Legais

### Contrato de Anúncio

O proprietário **DEVE** aceitar o Contrato de Anúncio que estabelece:

✅ O portal é apenas intermediador  
✅ Não há responsabilidade do portal por danos  
✅ Proprietário é totalmente responsável pela aeronave  
✅ Verificação não constitui endosso  
✅ Cumprimento de normas ANAC obrigatório  

Ver [HANGARSHARE_CONTRACT.md](../HANGARSHARE_CONTRACT.md) para contrato completo.

### Política de Cancelamento

**Flexível:**
- Cancelamento até 24h antes → reembolso total
- Menos de 24h → sem reembolso

**Moderada:**
- Cancelamento até 7 dias antes → reembolso de 50%
- Menos de 7 dias → sem reembolso

**Rígida:**
- Sem reembolso após confirmação

---

## 🔔 Sistema de Notificações

### E-mails Automáticos

**Para Locatário:**
- ✅ Reserva criada (pendente confirmação)
- ✅ Pagamento confirmado
- ✅ Reserva confirmada pelo proprietário
- ❌ Reserva cancelada
- 📅 Lembrete 24h antes do check-in
- ⭐ Solicitação de avaliação após check-out

**Para Proprietário:**
- 🔔 Nova reserva recebida
- 💰 Pagamento confirmado
- 📅 Lembrete de check-in/check-out
- ⭐ Nova avaliação recebida
- 💸 Repasse efetuado

### SMS (Opcional - Custo Adicional)
- Confirmação de reserva
- Lembrete 24h antes

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP (Concluído)
- ✅ Estrutura de banco de dados
- ✅ Página principal HangarShare
- ✅ Formulário de cadastro de proprietários
- ✅ Modal de reserva
- ✅ Contrato de anúncio
- ✅ Documentação de pagamentos

### Fase 2: Backend (Próximo)
- [ ] API de criação de anúncios
- [ ] API de busca de hangares
- [ ] API de reservas
- [ ] Upload de imagens
- [ ] Sistema de verificação automática (OCR)
- [ ] Integração com gateway de pagamento

### Fase 3: Dashboard
- [ ] Painel do proprietário
- [ ] Painel do locatário
- [ ] Gestão de reservas
- [ ] Calendário de disponibilidade
- [ ] Relatórios financeiros

### Fase 4: Melhorias
- [ ] Sistema de avaliações
- [ ] Chat entre proprietário e locatário
- [ ] Mapa de hangares disponíveis
- [ ] Notificações push
- [ ] App mobile

---

## 🔧 Configuração de Desenvolvimento

### 1. Executar Migrations

```bash
# Conectar ao banco Neon
psql $DATABASE_URL

# Executar migrations na ordem
\i src/migrations/004_create_hangar_listings_table.sql
\i src/migrations/005_create_hangar_bookings_table.sql
\i src/migrations/006_create_hangar_owner_verification_table.sql
\i src/migrations/007_add_hangar_columns_to_users.sql
```

### 2. Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Asaas (Recomendado)
ASAAS_API_KEY=your_asaas_api_key
ASAAS_WALLET_ID=your_platform_wallet_id

# Upload de imagens (Cloudinary, AWS S3, etc.)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Notificações
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 3. Acessar Funcionalidade

```
http://localhost:3000/hangarshare
```

---

## 📊 Campos do Anúncio

### Obrigatórios
- ✅ Código ICAO do aeródromo
- ✅ Cidade, Estado, País
- ✅ Pelo menos um tipo de preço (hora/dia/semana/mês)
- ✅ Tamanho da área (m²)
- ✅ Categoria de aeronaves aceitas

### Opcionais
- Número do hangar
- Localização dentro do aeródromo
- Dimensões máximas (envergadura, comprimento, altura)
- Horários de operação
- Serviços disponíveis
- Fotos (até 20 no plano profissional)

### Campos Calculados Automaticamente
- Status de verificação
- Rating médio
- Número de reservas
- Taxa de cancelamento

---

## 🎨 Design System

### Cores
- **Principal**: `#1E3A8A` (blue-900)
- **Secundária**: `#059669` (emerald-600)
- **Destaque**: `#F59E0B` (amber-500)
- **Erro**: `#DC2626` (red-600)

### Componentes
- `BookingModal` - Modal de reserva com 3 etapas
- `HangarCard` - Card de exibição de hangar
- `VerificationBadge` - Badge de verificação
- `RatingStars` - Componente de avaliação

---

## 📞 Suporte

Para dúvidas sobre implementação:
- 📧 Email: tech@lovetofly.com.br
- 📱 WhatsApp: (11) XXXX-XXXX
- 📚 Documentação: Ver arquivos PAYMENT_INTEGRATION.md e HANGARSHARE_CONTRACT.md

---

**Desenvolvido por Love To Fly Portal**  
Última atualização: 26 de dezembro de 2025
