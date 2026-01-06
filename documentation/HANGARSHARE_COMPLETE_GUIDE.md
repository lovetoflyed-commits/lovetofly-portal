# HangarShare - Guia de Uso Completo 🚀

## 📋 Fluxo de Usuário

### 1️⃣ Usuário Comum → Anunciante

```
[1] Usuário faz login em /login
    ↓
[2] Acessa /hangarshare (página principal do marketplace)
    ↓
[3] Clica em "Quero Anunciar Meu Hangar"
    ↓
[4] Vai para /hangarshare/owner/setup
    ↓
[5] Preenche dados da empresa (apenas 6 campos):
    • Razão Social
    • CNPJ
    • Código Banco
    • Agência
    • Conta
    • Titular da Conta
    ↓
[6] Perfil de anunciante criado
    ↓
[7] Redireciona para /hangarshare/owner/dashboard
```

### 2️⃣ Anunciante → Criar Anúncio

```
[1] Acessa /hangarshare/owner/dashboard
    ↓
[2] Clica em "➕ Novo Anúncio"
    ↓
[3] Vai para /hangarshare/listing/create (formulário 4 passos)
    
    PASSO 1: Localização
    • Digita ICAO do aeródromo (ex: SBSP)
    • Sistema busca automaticamente ✓
    • Exibe dados do aeródromo
    
    PASSO 2: Características
    • Número do hangar
    • Tamanho (m²)
    • Descrição da localização
    • Dimensões máximas (envergadura, comprimento, altura)
    
    PASSO 3: Preços & Disponibilidade
    • Tabela de preços (hora, dia, semana, mês)
    • Datas de disponibilidade
    • Formas de pagamento
    
    PASSO 4: Confirmação
    • Resumo completo
    • Publica o anúncio
    ↓
[4] Anúncio publicado e visível no marketplace
```

### 3️⃣ Anunciante → Gerenciar & Reportar

```
[1] Acessa /hangarshare/owner/dashboard
    ↓
[2] Visualiza:
    • Total de hangares ativos
    • Total de reservas
    • Receita total
    • Tabela com todos os hangares
    
[3] Gera relatório:
    • 📄 PDF: Download do relatório completo
    • 📊 CSV: Exportar para Excel/Planilha
    • 🖨️ Imprimir: Via navegador
    
[4] Edita hangar:
    • Clica em "Editar" na tabela
    • Vai para página de edição (não implementado ainda)
```

---

## 🔌 APIs Disponíveis

### 1. Airport Search (Auto-fetch ICAO)
```
GET /api/hangarshare/airport/search?icao=SBSP

✓ Usado em: Formulário de criação de anúncio (Passo 1)
✓ Busca em tempo real enquanto digita
✓ Retorna dados do aeródromo

Request:
  ?icao=SBSP (string, 4 caracteres)

Response (200):
{
  "icao_code": "SBSP",
  "iata_code": "GRU",
  "airport_name": "São Paulo/Congonhas",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  "is_public": true
}

Error Responses:
  400: ICAO inválido
  404: Aeródromo não encontrado
  500: Erro no servidor
```

### 2. Advertiser Management
```
POST /api/hangarshare/owners
✓ Criar novo perfil de anunciante
✓ Usado em: /hangarshare/owner/setup

Request:
{
  "userId": "uuid-do-usuario",
  "companyName": "Premium Hangares",
  "companyCnpj": "12345678000190",
  "bankCode": "001",
  "bankAgency": "0001",
  "bankAccount": "123456-7",
  "accountHolderName": "João Silva"
}

Response (201):
{
  "success": true,
  "ownerId": "uuid-anunciante",
  "data": {
    "id": "uuid-anunciante",
    "userId": "uuid-usuario",
    "companyName": "Premium Hangares",
    "email": "usuario@email.com",
    "phone": "(11) 9999-9999",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

```
GET /api/hangarshare/owners
✓ Listar todos os anunciantes
✓ Usado em: Dashboard (carrega perfil do usuário)

Response (200):
[
  {
    "id": "uuid-123",
    "userId": "user-123",
    "companyName": "Premium Hangares SP",
    "email": "contato@premium.com",
    "phone": "(11) 9999-9999",
    "isActive": true,
    "totalHangars": 3,
    "totalBookings": 15,
    "totalRevenue": 45000.00,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🗺️ Rotas Implementadas

### Páginas Públicas
- `GET /` - Home
- `GET /hangarshare` - Marketplace principal
- `GET /login` - Login de usuário
- `GET /register` - Registro de usuário

### Páginas de Anunciante (requer login)
- `GET /hangarshare/owner/setup` - Configurar perfil de anunciante ⭐ **NOVO**
- `GET /hangarshare/owner/register` - Registro antigo (manter para compatibilidade)
- `GET /hangarshare/owner/dashboard` - Painel do anunciante ⭐ **NOVO**
- `GET /hangarshare/listing/create` - Criar novo anúncio ⭐ **NOVO**

### APIs
- `GET /api/hangarshare/airport/search?icao=XXXX` - Buscar aeródromo ⭐ **NOVO**
- `POST /api/hangarshare/owners` - Criar anunciante ⭐ **NOVO**
- `GET /api/hangarshare/owners` - Listar anunciantes ⭐ **NOVO**

---

## 📊 Banco de Dados

### Migrations Criadas
```
Migration 008: hangar_owners
- Armazena perfis de anunciantes
- Campos: user_id (FK), company_name, cnpj, bank_code, etc.
- Índices: user_id (UNIQUE), is_active, verified

Migration 009: airport_icao
- Armazena aeródromos brasileiros
- 14 aeródromos pré-populados
- Campos: icao_code, iata_code, airport_name, city, state, etc.
- Índices: icao_code (PK), city/state
```

### Próximas Migrations Necessárias
```
Migration 010: hangar_listings
- Armazena anúncios de hangares
- Campos: hangar_owner_id (FK), icao_code (FK), title, description,
         size_sqm, max_wingspan, max_length, max_height, etc.

Migration 011: hangar_pricing
- Tabela de preços flexível
- Campos: listing_id (FK), period_type (hour/day/week/month), price

Migration 012: hangar_bookings
- Armazena reservas
- Campos: listing_id (FK), user_id (FK), check_in, check_out, status

Migration 013: hangar_reviews
- Avaliações de hangares
- Campos: booking_id (FK), rating, comment, user_id (FK)
```

---

## 🎯 Checklist de Implementação

### ✅ Concluído (v1)
- [x] Tabela de anunciantes (hangar_owners)
- [x] Tabela de aeródromos (airport_icao com 14 aeródromos)
- [x] API de busca de aeródromos (GET /api/hangarshare/airport/search)
- [x] API de gerenciamento de anunciantes (POST/GET /api/hangarshare/owners)
- [x] Página de setup simplificada (/hangarshare/owner/setup)
- [x] Formulário de criação de anúncio 4 passos (/hangarshare/listing/create)
- [x] Painel de anunciante (/hangarshare/owner/dashboard)
- [x] Relatórios (PDF, CSV, impressão)
- [x] Auto-fetch ICAO durante digitação

### 🔄 Em Progresso
- [ ] Conectar APIs ao banco de dados real (substituir mock data)
- [ ] Validações mais robustas
- [ ] Upload de fotos de hangares
- [ ] Editar anúncio existente
- [ ] Deletar anúncio

### ⏳ Próximo (v2)
- [ ] Tabela de anúncios (hangar_listings)
- [ ] Tabela de preços dinâmicos (hangar_pricing)
- [ ] Formulário de booking para usuários
- [ ] Tabela de reservas (hangar_bookings)
- [ ] Sistema de avaliações (hangar_reviews)
- [ ] Notificações por email
- [ ] Integração de pagamento (Asaas/Mercado Pago)
- [ ] Chat entre anunciante e reservador
- [ ] Dashboard de financeiro
- [ ] Relatórios avançados

---

## 🚀 Como Testar

### 1. Registrar Novo Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "password": "SenhaForte123!",
    "cpf": "12345678901",
    "birthDate": "1990-01-01",
    "mobilePhone": "(11) 99999-9999",
    "addressStreet": "Rua Teste",
    "addressNumber": "123",
    "addressNeighborhood": "Centro",
    "addressCity": "São Paulo",
    "addressState": "SP",
    "addressZip": "01310100",
    "addressCountry": "Brasil",
    "aviationRole": "owner",
    "terms": true
  }'
```

### 2. Fazer Login
```bash
# Via interface web: /login
# Email: joao@example.com
# Senha: SenhaForte123!
```

### 3. Configurar Perfil de Anunciante
```bash
# Acessa: http://localhost:3000/hangarshare/owner/setup
# Preenche os 6 campos da empresa
# Clica em "Confirmar"
```

### 4. Criar Novo Anúncio
```bash
# Acessa: http://localhost:3000/hangarshare/listing/create
# Passo 1: Digita SBSP (auto-fetch funciona)
# Passo 2: Preenche características
# Passo 3: Define preços e datas
# Passo 4: Confirma e publica
```

### 5. Visualizar Dashboard
```bash
# Acessa: http://localhost:3000/hangarshare/owner/dashboard
# Visualiza estatísticas
# Clica em "📊 Relatório" para gerar PDF/CSV
```

---

## 📝 Notas Importantes

### Auto-fetch ICAO
- ✅ Funciona em tempo real
- ✅ 14 aeródromos pré-populados
- ✅ Validação de 4 caracteres
- ✅ Exibe dados do aeródromo encontrado
- ⏳ TODO: Adicionar mais aeródromos

### Banco de Dados
- ⏳ APIs atualmente usam **mock data**
- ⏳ TODO: Conectar ao Neon PostgreSQL real
- ⏳ TODO: Executar migrations 008 e 009

### Formulários
- ✅ Validação client-side completa
- ✅ Formatação automática (CNPJ, telefone)
- ✅ Feedback visual (errors, success)
- ⏳ TODO: Validação server-side robusta

### Segurança
- ✅ Requer autenticação
- ✅ UserID obtido do AuthContext
- ⏳ TODO: Validar proprietário do anúncio
- ⏳ TODO: Rate limiting nas APIs

---

## 🔗 Links Úteis

- **Documentação Geral**: [HANGARSHARE_README.md](HANGARSHARE_README.md)
- **Documentação Aprimorada**: [HANGARSHARE_ENHANCED.md](HANGARSHARE_ENHANCED.md)
- **Termos de Contrato**: [Contrato](src/app/hangarshare/contract)
- **Integração de Pagamento**: [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador (F12)
2. Verificar terminal do servidor
3. Consultar documentação específica acima
4. Criar issue no repositório

---

**Última Atualização**: 26 de Dezembro de 2025
**Versão**: 1.0.0 (Beta)
**Status**: 🟡 Em Desenvolvimento
