# Configuração da Extensão Neon no VS Code

## ✓ Status: Conexão Testada e Funcionando

A conexão com o banco de dados Neon foi **verificada com sucesso** em 2025-12-25 18:04:37 UTC.

---

## Credenciais Neon (Local)

| Parâmetro | Valor |
|-----------|-------|
| **Host** | ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech |
| **Port** | 5432 |
| **Database** | neondb |
| **User** | neondb_owner |
| **Password** | npg_2yGJ1IjpWEDF |
| **SSL** | Required (sslmode=require) |
| **Channel Binding** | Required (channel_binding=require) |

---

## Como Usar a Extensão Neon no VS Code

### Opção 1: Usar Connection String (Recomendado)

1. Abra **VS Code**
2. Clique no ícone do **Neon** na barra lateral (Activity Bar)
3. Clique em **"Connect to Neon"** ou **"Add Connection"**
4. Selecione **"Use connection string"**
5. Cole a string de conexão:
   ```
   postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
6. Pressione Enter e aguarde a conexão ser estabelecida

### Opção 2: Inserir Credenciais Manualmente

1. Clique em **"Add Connection"** no painel do Neon
2. Selecione **"Manual Connection"**
3. Preencha os campos:
   - **Host**: `ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech`
   - **Port**: `5432`
   - **User**: `neondb_owner`
   - **Password**: `npg_2yGJ1IjpWEDF`
   - **Database**: `neondb`
   - **SSL**: Enable (marca a opção)

### Opção 3: Usar Script Local

Execute o script de conexão no terminal:
```bash
./scripts/neon-connect.sh
```

---

## Comandos Úteis

### Listar todas as tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public';
```

### Ver estrutura da tabela de usuários
```sql
\d users
```

### Contar registros
```sql
SELECT COUNT(*) FROM users;
```

### Executar migrations
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
PGPASSWORD='npg_2yGJ1IjpWEDF' /usr/local/opt/postgresql@15/bin/psql \
  -h ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -f src/migrations/001_create_users_table.sql
```

---

## Variáveis de Ambiente

A conexão também está configurada em:
- **`.env`**: `DATABASE_URL=postgresql://...`
- **`netlify.toml`**: `DATABASE_URL` para produção

---

## Testes Realizados

✓ Conexão TCP estabelecida  
✓ Autenticação bem-sucedida  
✓ Query SELECT executada com sucesso  
✓ Version: PostgreSQL 17.7  
✓ Timestamp Sincronizado (UTC)  

---

## Problemas Comuns

### "FATAL: password authentication failed"
- Verifique se a senha `npg_2yGJ1IjpWEDF` está correta
- Confirme o usuário: `neondb_owner`

### "SSL connection error"
- Certifique-se que `sslmode=require` está ativado
- Neon requer SSL para conexões externas

### "Channel binding required"
- Adicione `channel_binding=require` à connection string

---

## Arquivos de Configuração Criados

- `.neon/config.json` - Arquivo de configuração da extensão
- `scripts/neon-connect.sh` - Script de teste de conexão

---

**Última Verificação**: 2025-12-25 18:04:37 UTC ✓
