# Configuração de Banco de Dados para Produção (Vercel)

## Problema
O arquivo .env.local está configurado para localhost, que só funciona localmente.
Em produção (Vercel), você precisa de um banco PostgreSQL acessível pela internet.

## Soluções Recomendadas

### Opção 1: Vercel Postgres (Recomendado)
1. Acesse seu projeto no painel do Vercel
2. Vá em **Storage** → **Create Database**
3. Escolha **Postgres**
4. Copie a variável `DATABASE_URL` que será gerada automaticamente
5. O Vercel já configura automaticamente as variáveis de ambiente

### Opção 2: Neon (PostgreSQL Serverless - Gratuito)
1. Acesse https://neon.tech
2. Crie uma conta e um novo projeto
3. Copie a connection string (parecida com: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. No painel do Vercel:
   - Vá em **Settings** → **Environment Variables**
   - Adicione: `DATABASE_URL` = sua connection string do Neon

### Opção 3: Supabase (PostgreSQL Gratuito)
1. Acesse https://supabase.com
2. Crie um projeto
3. Vá em **Settings** → **Database**
4. Copie a "Connection string" (modo Transaction)
5. Configure no Vercel como DATABASE_URL

## Variáveis Necessárias no Vercel

No painel do Vercel → Settings → Environment Variables, adicione:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NEXTAUTH_SECRET=gere-uma-string-aleatoria-segura
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

## Criar Tabelas no Banco de Produção

Depois de configurar, execute a migration no banco de produção:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  mobile_phone VARCHAR(20) NOT NULL,
  address_street VARCHAR(255) NOT NULL,
  address_number VARCHAR(50) NOT NULL,
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(255) NOT NULL,
  address_city VARCHAR(255) NOT NULL,
  address_state VARCHAR(50) NOT NULL,
  address_zip VARCHAR(20) NOT NULL,
  address_country VARCHAR(100) NOT NULL,
  aviation_role VARCHAR(50) NOT NULL,
  aviation_role_other VARCHAR(100),
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  terms_agreed BOOLEAN DEFAULT FALSE,
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Status Atual
- ✅ Código está correto
- ❌ Falta configurar DATABASE_URL em produção
- ❌ Falta criar tabelas no banco de produção
