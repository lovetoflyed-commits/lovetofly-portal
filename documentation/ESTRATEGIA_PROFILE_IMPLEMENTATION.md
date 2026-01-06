# 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO: Profile Edit Feature

**Data:** 5 de Janeiro de 2026  
**Objetivo:** Completar funcionalidade de edição de perfil **SEM quebrar funcionalidades existentes**  
**Risco Geral:** 🟡 MÉDIO (Há conflito de endpoints, precisa migração cuidadosa)

---

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ O Que Já Existe

```
✅ GET /api/user/profile - FUNCIONAL (2 implementações conflitantes)
❌ PUT /api/user/profile - NÃO EXISTE
✅ Frontend pages /profile e /profile/edit - EXISTEM mas quebradas
✅ AuthContext com token - FUNCIONAL
```

### 🔴 Problemas Detectados

1. **DUPLICAÇÃO DE ENDPOINT** (CRÍTICO)
   - `src/app/api/user/profile/route.ts` (93 linhas - completo)
   - `src/app/api/user/profile/route.tsx` (54 linhas - incompleto)
   - Retornam campos **diferentes** do BD!

2. **QUERIES INCOMPATÍVEIS**
   ```typescript
   // route.ts busca:
   first_name, last_name, cpf, mobile_phone, address_street, ...
   
   // route.tsx busca:
   first_name (aliased como "name"), phone_number, address, current_license...
   // (Estes campos NÃO existem no BD!)
   ```

3. **TIPOS NÃO SINCRONIZADOS**
   - `/profile/page.tsx` espera campos antigos (name, anac_code, etc)
   - `/profile/edit/page.tsx` espera camelCase correto
   - BD usa snake_case

---

## 🗺️ ESTRATÉGIA DE IMPLEMENTAÇÃO

### FASE 1: Consolidação Segura (1 hora)

**Objetivo:** Ter 1 GET /api/user/profile funcionando sem afetar nada mais.

#### Step 1.1: Criar nova versão limpa (SEM deletar a antiga)

```bash
# Criar versão nova (backup)
mv src/app/api/user/profile/route.ts src/app/api/user/profile/route.ts.backup
mv src/app/api/user/profile/route.tsx src/app/api/user/profile/route.tsx.backup

# Criar novo arquivo consolidado
touch src/app/api/user/profile/route.ts (versão final)
```

#### Step 1.2: Implementar GET limpo (sem PUT ainda)

```typescript
// src/app/api/user/profile/route.ts - VERSÃO FINAL
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

// Tipo compartilhado (source of truth)
interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  mobilePhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  aviationRole?: string;
  aviationRoleOther?: string;
  isHangarshareAdvertiser?: boolean;
}

export async function GET(request: Request): Promise<NextResponse<UserProfileResponse | { message: string }>> {
  try {
    // 1. Validar token (mesmo código que antes)
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // 2. Buscar dados do usuário (QUERY CORRETA - do route.ts.backup)
    const result = await pool.query(
      `SELECT 
        id,
        first_name,
        last_name,
        cpf,
        email,
        mobile_phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip,
        address_country,
        aviation_role,
        aviation_role_other
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    // 3. Checar se é anunciante (NOVO - validação)
    const hangarResult = await pool.query(
      `SELECT 1 FROM hangar_listings WHERE owner_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    const isHangarshareAdvertiser = hangarResult.rows.length > 0;

    // 4. Retornar com tipos corretos (camelCase)
    return NextResponse.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      cpf: user.cpf,
      email: user.email,
      mobilePhone: user.mobile_phone,
      addressStreet: user.address_street,
      addressNumber: user.address_number,
      addressComplement: user.address_complement,
      addressNeighborhood: user.address_neighborhood,
      addressCity: user.address_city,
      addressState: user.address_state,
      addressZip: user.address_zip,
      addressCountry: user.address_country,
      aviationRole: user.aviation_role,
      aviationRoleOther: user.aviation_role_other,
      isHangarshareAdvertiser,
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
```

#### Step 1.3: Testar GET em isolamento

```bash
# Verificar se ainda funciona
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/user/profile

# Esperado: { id, firstName, lastName, cpf, email, ... }
```

**✅ Verificação:** Se o GET retorna dados corretamente, passe para Fase 2.

---

### FASE 2: Implementar PUT (1-2 horas)

**Objetivo:** Adicionar endpoint PUT ao arquivo consolidado.

#### Step 2.1: Validações helper (novo arquivo)

```typescript
// src/utils/validators.ts (novo arquivo)
export function validateCPF(cpf: string): boolean {
  // Implementação de validação de CPF
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  // Verificação de dígitos... (simplificado)
  return true;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

export function validateZip(zip: string): boolean {
  return /^\d{5}-?\d{3}$/.test(zip);
}
```

#### Step 2.2: Implementar PUT no route.ts

```typescript
// Adicionar ao final de src/app/api/user/profile/route.ts

export async function PUT(request: Request): Promise<NextResponse<UserProfileResponse | { message: string }>> {
  try {
    // 1. Validar token (mesmo padrão GET)
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // 2. Parsear body
    const body = await request.json();
    const {
      firstName,
      lastName,
      cpf,
      email,
      mobilePhone,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      aviationRole,
      aviationRoleOther,
    } = body;

    // 3. Validações (SEM quebrar se forem válidas)
    const errors: string[] = [];
    if (firstName && firstName.length < 2) errors.push('Nome deve ter pelo menos 2 caracteres');
    if (lastName && lastName.length < 2) errors.push('Sobrenome deve ter pelo menos 2 caracteres');
    if (email && !validateEmail(email)) errors.push('Email inválido');
    if (mobilePhone && !validatePhone(mobilePhone)) errors.push('Telefone inválido');
    if (addressZip && !validateZip(addressZip)) errors.push('CEP inválido');

    if (errors.length > 0) {
      return NextResponse.json({ message: errors.join('; ') }, { status: 400 });
    }

    // 4. Verificar se é anunciante (bloquear edição sensível)
    const hangarResult = await pool.query(
      `SELECT 1 FROM hangar_listings WHERE owner_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    const isAdvertiser = hangarResult.rows.length > 0;

    // 5. UPDATE (apenas campos permitidos)
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    // Campos que anunciantes NÃO podem alterar
    const sensitiveFields = ['firstName', 'lastName', 'cpf', 'email', 'mobilePhone'];

    if (firstName && !isAdvertiser) {
      updateFields.push(`first_name = $${paramCount++}`);
      updateValues.push(firstName);
    }
    if (lastName && !isAdvertiser) {
      updateFields.push(`last_name = $${paramCount++}`);
      updateValues.push(lastName);
    }
    if (cpf && !isAdvertiser) {
      updateFields.push(`cpf = $${paramCount++}`);
      updateValues.push(cpf);
    }
    if (email) {
      // Email nunca pode ser alterado para não quebrar auth
      // (comentado: não permitir mudança)
      // updateFields.push(`email = $${paramCount++}`);
      // updateValues.push(email);
    }
    if (mobilePhone && !isAdvertiser) {
      updateFields.push(`mobile_phone = $${paramCount++}`);
      updateValues.push(mobilePhone);
    }

    // Campos que QUALQUER usuário pode alterar
    if (addressStreet) {
      updateFields.push(`address_street = $${paramCount++}`);
      updateValues.push(addressStreet);
    }
    if (addressNumber) {
      updateFields.push(`address_number = $${paramCount++}`);
      updateValues.push(addressNumber);
    }
    if (addressComplement) {
      updateFields.push(`address_complement = $${paramCount++}`);
      updateValues.push(addressComplement);
    }
    if (addressNeighborhood) {
      updateFields.push(`address_neighborhood = $${paramCount++}`);
      updateValues.push(addressNeighborhood);
    }
    if (addressCity) {
      updateFields.push(`address_city = $${paramCount++}`);
      updateValues.push(addressCity);
    }
    if (addressState) {
      updateFields.push(`address_state = $${paramCount++}`);
      updateValues.push(addressState);
    }
    if (addressZip) {
      updateFields.push(`address_zip = $${paramCount++}`);
      updateValues.push(addressZip);
    }
    if (addressCountry) {
      updateFields.push(`address_country = $${paramCount++}`);
      updateValues.push(addressCountry);
    }
    if (aviationRole) {
      updateFields.push(`aviation_role = $${paramCount++}`);
      updateValues.push(aviationRole);
    }
    if (aviationRoleOther) {
      updateFields.push(`aviation_role_other = $${paramCount++}`);
      updateValues.push(aviationRoleOther);
    }

    // Se não há campos para atualizar, retornar erro
    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    // 6. Executar UPDATE
    updateValues.push(userId);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Falha ao atualizar perfil' }, { status: 500 });
    }

    const user = result.rows[0];

    // 7. Retornar dados atualizados (formato correto)
    return NextResponse.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      cpf: user.cpf,
      email: user.email,
      mobilePhone: user.mobile_phone,
      addressStreet: user.address_street,
      addressNumber: user.address_number,
      addressComplement: user.address_complement,
      addressNeighborhood: user.address_neighborhood,
      addressCity: user.address_city,
      addressState: user.address_state,
      addressZip: user.address_zip,
      addressCountry: user.address_country,
      aviationRole: user.aviation_role,
      aviationRoleOther: user.aviation_role_other,
      isHangarshareAdvertiser: isAdvertiser,
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
```

#### Step 2.3: Testar PUT em isolamento

```bash
# Test PUT
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"João","lastName":"Silva"}' \
  http://localhost:3000/api/user/profile

# Esperado: { id, firstName: "João", lastName: "Silva", ... }
```

**✅ Verificação:** Se PUT retorna dados corretos, continue.

---

### FASE 3: Corrigir Pages (1-2 horas)

**Objetivo:** Sincronizar UI com API corrigida.

#### Step 3.1: Remover `/profile/page.tsx` (é só leitura do edit)

Manter apenas `/profile/edit/page.tsx` como página principal de perfil.

#### Step 3.2: Reescrever `/profile/edit/page.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  mobilePhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  aviationRole?: string;
  aviationRoleOther?: string;
  isHangarshareAdvertiser?: boolean;
}

export default function EditProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setProfile(await res.json());
        } else {
          setMessage({ type: 'error', text: 'Erro ao carregar perfil' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro de conexão' });
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  const handleInputChange = (field: keyof UserProfileResponse) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (profile) {
        setProfile({ ...profile, [field]: e.target.value });
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Erro ao carregar perfil</div>;
  }

  const isAdvertiser = profile.isHangarshareAdvertiser;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Editar Perfil</h1>

        {/* Toast Message */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-700' 
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Advertiser Warning */}
        {isAdvertiser && (
          <div className="p-4 mb-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <b className="text-yellow-900">Aviso:</b>
            <p className="text-sm text-yellow-800 mt-1">
              Você é anunciante ativo no HangarShare. 
              Alguns dados sensíveis estão bloqueados para edição.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <fieldset className="border-t pt-6">
            <legend className="text-lg font-bold text-slate-900 mb-4">Dados Pessoais</legend>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={profile.firstName || ''}
                  onChange={handleInputChange('firstName')}
                  disabled={isAdvertiser}
                  className="w-full border rounded px-3 py-2 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sobrenome</label>
                <input
                  type="text"
                  value={profile.lastName || ''}
                  onChange={handleInputChange('lastName')}
                  disabled={isAdvertiser}
                  className="w-full border rounded px-3 py-2 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={profile.cpf || ''}
                  onChange={handleInputChange('cpf')}
                  disabled={isAdvertiser || true} // CPF nunca pode mudar
                  className="w-full border rounded px-3 py-2 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled={true} // Email nunca pode mudar (quebra auth)
                  className="w-full border rounded px-3 py-2 disabled:bg-slate-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={profile.mobilePhone || ''}
                onChange={handleInputChange('mobilePhone')}
                disabled={isAdvertiser}
                className="w-full border rounded px-3 py-2 disabled:bg-slate-100"
                placeholder="(00) 00000-0000"
              />
            </div>
          </fieldset>

          {/* Endereço */}
          <fieldset className="border-t pt-6">
            <legend className="text-lg font-bold text-slate-900 mb-4">Endereço</legend>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Rua</label>
                <input
                  type="text"
                  value={profile.addressStreet || ''}
                  onChange={handleInputChange('addressStreet')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={profile.addressNumber || ''}
                  onChange={handleInputChange('addressNumber')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={profile.addressZip || ''}
                  onChange={handleInputChange('addressZip')}
                  className="w-full border rounded px-3 py-2"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={profile.addressNeighborhood || ''}
                  onChange={handleInputChange('addressNeighborhood')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={profile.addressCity || ''}
                  onChange={handleInputChange('addressCity')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                <input
                  type="text"
                  value={profile.addressState || ''}
                  onChange={handleInputChange('addressState')}
                  className="w-full border rounded px-3 py-2"
                  maxLength={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">País</label>
                <input
                  type="text"
                  value={profile.addressCountry || ''}
                  onChange={handleInputChange('addressCountry')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </fieldset>

          {/* Aviação */}
          <fieldset className="border-t pt-6">
            <legend className="text-lg font-bold text-slate-900 mb-4">Informações de Aviação</legend>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Função na Aviação</label>
              <input
                type="text"
                value={profile.aviationRole || ''}
                onChange={handleInputChange('aviationRole')}
                className="w-full border rounded px-3 py-2"
                placeholder="Piloto, Instrutor, Mecânico, etc"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Outra Função (se aplicável)</label>
              <input
                type="text"
                value={profile.aviationRoleOther || ''}
                onChange={handleInputChange('aviationRoleOther')}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div className="border-t pt-6 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## ⚠️ MATRIZ DE RISCO

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| **PUT quebra GET** | 🔴 CRÍTICO | Testar GET depois de implementar PUT em isolamento |
| **Duplos arquivos conflitam** | 🔴 CRÍTICO | Deletar `route.tsx.backup` APÓS validação completa |
| **Dados não salvam** | 🟡 MÉDIO | Validar UPDATE query com params corretos |
| **Anunciantes conseguem editar sensíveis** | 🟡 MÉDIO | Check `isHangarshareAdvertiser` antes de UPDATE |
| **Email/CPF mudam (quebra auth)** | 🔴 CRÍTICO | Bloquear campos sensíveis no PUT |
| **Validações fracas** | 🟡 MÉDIO | Testar com dados inválidos |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de Começar Fase 1

- [ ] Backup de `/src/app/api/user/profile/route.ts` criado
- [ ] Backup de `/src/app/api/user/profile/route.tsx` criado
- [ ] Build passing (`yarn build`)
- [ ] Dev server rodando (`yarn dev`)

### Depois de Implementar GET (Fase 1)

- [ ] GET /api/user/profile retorna 200
- [ ] Todos os campos no response
- [ ] Tipos camelCase corretos
- [ ] `isHangarshareAdvertiser` funciona
- [ ] Token validation funciona
- [ ] Nenhuma outra rota quebrou

### Depois de Implementar PUT (Fase 2)

- [ ] PUT /api/user/profile retorna 200
- [ ] Dados salvos no BD
- [ ] Validações funcionam (email inválido = 400)
- [ ] Anunciantes não conseguem editar sensíveis
- [ ] Email/CPF não podem ser alterados
- [ ] GET ainda funciona após PUT

### Depois de Corrigir Pages (Fase 3)

- [ ] `/profile/edit` carrega dados
- [ ] Form campos respondendo a input
- [ ] Submit salva dados
- [ ] Toast mostra sucesso/erro
- [ ] Advertiser gets warning
- [ ] Sensitive fields disabled
- [ ] Nenhuma rota quebrou

---

## 🔧 SEQUÊNCIA EXATA DE PASSOS

### DIA 1: SETUP

```bash
# 1. Criar backup dos arquivos
cp src/app/api/user/profile/route.ts src/app/api/user/profile/route.ts.backup
cp src/app/api/user/profile/route.tsx src/app/api/user/profile/route.tsx.backup

# 2. Remover arquivo problemático
rm src/app/api/user/profile/route.tsx

# 3. Verificar que build passou
yarn build

# 4. Iniciar servidor
yarn dev

# 5. Testar GET manualmente (curl ou Postman)
```

### DIA 2: IMPLEMENTAÇÃO

**Fase 1 (1h)**
```bash
# Criar versão consolidada do GET
# (copiar código do "Step 1.2" acima)

# Testar GET
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/user/profile
```

**Fase 2 (2h)**
```bash
# Criar src/utils/validators.ts
# Adicionar PUT ao route.ts (código do "Step 2.2")

# Testar PUT
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Novo"}' \
  http://localhost:3000/api/user/profile
```

**Fase 3 (1-2h)**
```bash
# Reescrever /profile/edit/page.tsx
# (código do "Step 3.2")

# Testar na UI
# Acessar http://localhost:3000/profile/edit
# Preencher campos
# Clicar salvar
# Verificar toast
```

### DIA 3: VALIDAÇÃO

```bash
# 1. Build final
yarn build

# 2. Testar todos os fluxos
# - Login
# - Carregar perfil
# - Editar campos
# - Salvar
# - Carregar novamente (verificar persistência)
# - Tentar email inválido (verificar validação)
# - Anunciante tenta editar sensíveis (bloquear)

# 3. Deletar backups
rm src/app/api/user/profile/route.ts.backup
rm src/app/api/user/profile/route.tsx.backup

# 4. Commit
git add -A
git commit -m "feat: implement profile edit with GET/PUT endpoints"
```

---

## 📋 CÓDIGO A IMPLEMENTAR (Resumido)

### Arquivo 1: `src/app/api/user/profile/route.ts`
- GET: Buscar perfil (consolidado)
- PUT: Atualizar perfil (novo)
- 130 linhas totais

### Arquivo 2: `src/utils/validators.ts`
- validateCPF()
- validateEmail()
- validatePhone()
- validateZip()
- 50 linhas

### Arquivo 3: `src/app/profile/edit/page.tsx`
- Reescrever com state management
- onChange handlers
- Form submission
- Toast notifications
- 200 linhas

### Deletar:
- `src/app/api/user/profile/route.tsx` (conflito)
- `src/app/profile/page.tsx` (redundante)

---

## 🎯 RESULTADO FINAL

✅ **GET /api/user/profile** - Funcional
✅ **PUT /api/user/profile** - Funcional  
✅ **/profile/edit** - Funcional
✅ **Nenhuma rota quebrou**
✅ **Validações funcionam**
✅ **Anunciantes protegidos**
✅ **Build passing**

**Tempo Total:** ~4-6 horas (1 dev)  
**Risco Residual:** 🟢 BAIXO

