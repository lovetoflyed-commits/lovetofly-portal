# Configuração do Neon para Produção

## Passo 1: Configurar Banco no Neon

1. Acesse https://console.neon.tech
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Dashboard** → **Connection Details**
4. Copie a **Connection string** (deve ter este formato):
   ```
   postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Passo 2: Criar Tabelas no Neon

Execute o script de setup com sua connection string:

```bash
node setup-neon-db.js "sua-connection-string-aqui"
```

Exemplo:
```bash
node setup-neon-db.js "postgresql://neondb_owner:abc123@ep-cool-fire-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

O script irá:
- ✅ Conectar ao seu banco Neon
- ✅ Criar a tabela `users` com todas as colunas
- ✅ Verificar se tudo funcionou

## Passo 3: Configurar Variáveis no Vercel

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```env
DATABASE_URL=sua-connection-string-do-neon
NEXTAUTH_SECRET=gere-uma-chave-secreta-aleatoria
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

Para gerar NEXTAUTH_SECRET, use:
```bash
openssl rand -base64 32
```

## Passo 4: Fazer Redeploy

1. Vá em **Deployments**
2. Clique nos três pontinhos do último deploy
3. Escolha **Redeploy**
4. Aguarde o deploy finalizar

## Passo 5: Testar

Acesse seu site e tente fazer cadastro. Deve funcionar! 🎉

## Solução de Problemas

### Erro: "connection refused"
- Verifique se a connection string está correta
- Certifique-se de que tem `?sslmode=require` no final

### Erro: "relation users does not exist"
- Execute novamente o script setup-neon-db.js
- Ou execute a SQL manualmente no SQL Editor do Neon

### Cadastro não funciona
- Verifique se DATABASE_URL está configurado no Vercel
- Veja os logs no Vercel: Functions → Select your API route → Logs
