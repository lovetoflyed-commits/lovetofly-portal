# 📋 ANÁLISE: Página de Configuração de Dados do Usuário

**Arquivo Analisado:** `src/app/profile/page.tsx` e `src/app/profile/edit/page.tsx`  
**Data:** 5 de Janeiro de 2026  
**Status Geral:** ⚠️ **INCOMPLETO - Precisa de Revisão**

---

## 📊 RESUMO EXECUTIVO

A página de perfil do usuário está **parcialmente implementada** com:
- ✅ Visualização de dados (read-only)
- ⚠️ Edição com problemas de segurança e lógica
- ❌ Sincronização com banco de dados quebrada
- ❌ Sem tratamento de erros robusto

**Severidade:** 🔴 **ALTA** - Bloqueia funcionalidades críticas

---

## 🔍 ANÁLISE DETALHADA

### 1️⃣ PÁGINA DE VISUALIZAÇÃO (`/profile/page.tsx`)

#### ✅ Pontos Positivos

```tsx
// ✅ Layout bem estruturado com 3 colunas
- Avatar com iniciais do nome
- Cards separados por categoria (Pessoais, Técnicos)
- Botão "Editar Perfil" bem posicionado
- Responsive design (mobile-first)
- Tailwind CSS bem aplicado
```

#### ⚠️ Problemas Identificados

| Problema | Severidade | Impacto |
|----------|-----------|--------|
| **Tipos incoerentes** | 🔴 CRÍTICO | Interface define `string` mas BD usa `number` para ID |
| **Dados hardcoded** | 🔴 CRÍTICO | Labels como "CANAC" não correspondem ao BD real |
| **Sem API chamada** | 🔴 CRÍTICO | Dados não vêm da API, usam AuthContext (incompleto) |
| **Cast inseguro** | 🟡 MÉDIO | `user as unknown as UserProfile` esconde erros |
| **Campos não mapeados** | 🟡 MÉDIO | BD tem `first_name`, `last_name` mas código espera `name` |

#### Exemplo do Problema:

```tsx
// ❌ ERRADO - Código espera isso:
interface UserProfile {
  name: string;              // Não existe no BD!
  anac_code: string;         // Não existe no BD!
  current_license: string;   // Não existe no BD!
}

// ✅ CORRETO - BD realmente tem:
// users table:
// - first_name
// - last_name
// - cpf
// - email
// - mobile_phone
// - aviation_role
```

---

### 2️⃣ PÁGINA DE EDIÇÃO (`/profile/edit/page.tsx`)

#### ✅ Pontos Positivos

```tsx
// ✅ Busca dados da API
const res = await fetch("/api/user/profile", {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

// ✅ Proteção para anunciantes HangarShare
if (profile.isHangarshareAdvertiser) {
  // Bloqueia edição de dados sensíveis
}

// ✅ Usa types corretos (matches BD)
interface UserProfile {
  firstName: string;  // ✅ Matches DB
  lastName: string;   // ✅ Matches DB
  cpf: string;        // ✅ Matches DB
}
```

#### ⚠️ Problemas Críticos

| Problema | Severidade | Detalhes |
|----------|-----------|----------|
| **Sem salvar** | 🔴 CRÍTICO | Form não tem `onSubmit` handler |
| **Inputs desconectados** | 🔴 CRÍTICO | onChange não atualiza state |
| **API /profile não existe** | 🔴 CRÍTICO | Endpoint não implementado em `src/app/api/` |
| **Sem validação** | 🟡 MÉDIO | Nenhuma validação de CPF, email, etc |
| **Estado não sincronizado** | 🟡 MÉDIO | Profile state não responde a input changes |
| **UX pobre** | 🟡 MÉDIO | Sem feedback de sucesso/erro ao salvar |

#### Código Problemático:

```tsx
// ❌ PROBLEMA 1: Input sem onChange
<input 
  type="text" 
  value={profile.firstName} 
  // Falta: onChange={(e) => setProfile({...profile, firstName: e.target.value})}
  disabled={isBlocked}
/>

// ❌ PROBLEMA 2: Form sem submit handler
<form className="space-y-5">
  {/* Inputs aqui */}
  <button type="submit">Salvar Alterações</button>  // Não faz nada!
</form>

// ❌ PROBLEMA 3: API não existe
fetch("/api/user/profile")  // Este endpoint NÃO existe!
// Deveria ser GET /api/auth/me ou similar
```

---

## 🗄️ DISCREPÂNCIA: Interface vs Banco de Dados

### Página View (`/profile/page.tsx`):

```typescript
interface UserProfile {
  id: string;              // ❌ BD tem UUID
  name: string;            // ❌ BD tem first_name + last_name
  email: string;           // ✅ OK
  anac_code: string;       // ❌ NÃO EXISTE no BD
  role: string;            // ❌ BD tem aviation_role
  phone_number: string;    // ❌ BD tem mobile_phone
  address: string;         // ❌ BD tem address_street, address_city, etc
  course_type: string;     // ❌ NÃO EXISTE
  current_license: string; // ❌ NÃO EXISTE
  current_ratings: string; // ❌ NÃO EXISTE
  total_flight_hours: number;    // ❌ NÃO EXISTE
  observations: string;    // ❌ NÃO EXISTE
}
```

### Página Edit (`/profile/edit/page.tsx`):

```typescript
interface UserProfile {
  id: number;              // ✅ Matches BD
  firstName: string;       // ✅ Matches BD
  lastName: string;        // ✅ Matches BD
  cpf: string;             // ✅ Matches DB
  email: string;           // ✅ OK
  mobilePhone: string;     // ✅ Matches mobile_phone
  addressStreet: string;   // ✅ Partial match
  aviationRole: string;    // ✅ Matches DB
}
```

### Banco de Dados Real (`users` table):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  cpf VARCHAR(20) UNIQUE,
  birth_date DATE,
  mobile_phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  address_country VARCHAR(100),
  aviation_role VARCHAR(50),
  plan VARCHAR(20) DEFAULT 'free'
);
```

---

## 🔧 ENDPOINTS NECESSÁRIOS

### ❌ FALTANDO: GET /api/user/profile

```typescript
// src/app/api/user/profile/route.ts
export async function GET(request: Request) {
  try {
    // 1. Extrair token do header
    const auth = request.headers.get('Authorization');
    const token = auth?.replace('Bearer ', '');
    
    // 2. Validar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Buscar usuário no BD
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    // 4. Retornar dados
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    return NextResponse.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      cpf: user.cpf,
      email: user.email,
      mobilePhone: user.mobile_phone,
      // ... etc
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}
```

### ❌ FALTANDO: PUT /api/user/profile

```typescript
// src/app/api/user/profile/route.ts
export async function PUT(request: Request) {
  try {
    // 1. Validar token
    // 2. Validar dados de entrada
    // 3. Checar se é anunciante (bloquear edição sensível)
    // 4. Atualizar BD
    // 5. Retornar novo perfil
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
```

---

## 📝 CHECKLIST DE CORREÇÃO NECESSÁRIA

### Urgente 🔴

- [ ] **Criar endpoint GET /api/user/profile** (buscar dados)
- [ ] **Criar endpoint PUT /api/user/profile** (atualizar dados)
- [ ] **Sincronizar types com BD real** (UserProfile interfaces)
- [ ] **Adicionar onChange handlers** em /profile/edit/page.tsx
- [ ] **Implementar form submission** com validação
- [ ] **Remover cast inseguro** (`as unknown as`)
- [ ] **Validação de entrada** (CPF, email, telefone)

### Importante 🟡

- [ ] **Tratamento de erros robusto** (try-catch, mensagens)
- [ ] **Loading states** (spinner durante chamada API)
- [ ] **Toast notifications** (sucesso/erro ao salvar)
- [ ] **Confirmação** antes de alterar dados sensíveis
- [ ] **Rate limiting** nas APIs (prevent spam)
- [ ] **Auditoria** (log de quem alterou o quê)

### Melhorias 🟢

- [ ] **Preview de mudanças** antes de salvar
- [ ] **Histórico de alterações**
- [ ] **Undo/Redo** para edições
- [ ] **Foto de perfil upload**
- [ ] **Integração Google/GitHub** para SSO

---

## 🎯 RECOMENDAÇÕES PRIORITÁRIAS

### Priority 1: Implementar APIs

Criar em `src/app/api/user/profile/route.ts`:

1. **GET** - Buscar perfil do usuário autenticado
2. **PUT** - Atualizar dados do perfil com validação

### Priority 2: Corrigir Interface

```typescript
// ✅ CORRETO - Usar um tipo universal
type UserProfile = {
  // IDs
  id: string;
  
  // Dados Pessoais
  firstName: string;
  lastName: string;
  cpf: string;
  birthDate?: string;
  email: string;
  mobilePhone?: string;
  
  // Endereço
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  
  // Aviação
  aviationRole?: string;
  aviationRoleOther?: string;
  
  // Status
  plan: 'free' | 'premium' | 'pro';
  createdAt: string;
}
```

### Priority 3: Reescrever Edit Page

```tsx
export default function EditProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    const res = await fetch("/api/user/profile", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  };

  const handleInputChange = (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile) {
      setProfile({ ...profile, [field]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit}>
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* Form Fields */}
      <input
        type="text"
        value={profile?.firstName || ''}
        onChange={handleInputChange('firstName')}
        placeholder="Nome"
      />

      <button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

---

## 📊 COMPARATIVO: Estado Atual vs Ideal

| Aspecto | Atual | Ideal | Gap |
|--------|-------|-------|-----|
| **API Endpoints** | 0/2 | 2/2 | ❌ 100% |
| **Form Submission** | Não | Sim | ❌ 0% |
| **Validação** | Não | Sim | ❌ 0% |
| **Error Handling** | Mínimo | Robusto | ❌ 20% |
| **Loading States** | Spinner simples | Completo | ❌ 40% |
| **Type Safety** | Parcial | Completo | ❌ 50% |
| **UX Feedback** | Nenhum | Toast + messages | ❌ 0% |
| **Security** | Básica | Avançada | ❌ 30% |

---

## 🎯 CONCLUSÃO

A página de perfil é uma **estrutura de UI bonita sem funcionalidade completa**.

### Status: 🔴 **NÃO PRONTA PARA PRODUÇÃO**

**Problemas Críticos:**
1. ❌ Endpoints API não existem
2. ❌ Form não salva dados
3. ❌ Types não correspondem ao BD
4. ❌ Sem validação
5. ❌ Sem feedback ao usuário

**Tempo para Correção:** ~4-6 horas (1 dev)

**Impacto:** Usuários não conseguem editar seu perfil - bloqueador crítico

