#!/usr/bin/env node

/**
 * Script para configurar o banco de dados Neon em produção
 * 
 * Como usar:
 * 1. Copie sua connection string do Neon
 * 2. Execute: node setup-neon-db.js "sua-connection-string"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase(connectionString) {
  if (!connectionString) {
    console.error('❌ Erro: Forneça a connection string do Neon como argumento');
    console.log('\nUso: node setup-neon-db.js "postgresql://user:pass@host/db?sslmode=require"');
    console.log('\nOnde encontrar no Neon:');
    console.log('1. Acesse https://console.neon.tech');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em "Dashboard" → "Connection Details"');
    console.log('4. Copie a "Connection string"');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao Neon...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Ler a migration
    const migrationPath = path.join(__dirname, 'src', 'migrations', '000_fresh_users.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Executando migration...');
    await client.query(sql);
    console.log('✅ Tabela users criada com sucesso!\n');

    // Verificar se funcionou
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total de usuários: ${result.rows[0].count}`);

    console.log('\n✨ Banco de dados configurado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse o painel do Vercel: https://vercel.com');
    console.log('2. Vá em seu projeto → Settings → Environment Variables');
    console.log('3. Adicione estas variáveis:');
    console.log(`   DATABASE_URL=${connectionString}`);
    console.log('   NEXTAUTH_SECRET=<gere-uma-string-aleatoria>');
    console.log('   NEXTAUTH_URL=https://seu-dominio.vercel.app');
    console.log('4. Faça redeploy do projeto\n');

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: Verifique se a connection string está correta');
    } else if (error.message.includes('already exists')) {
      console.log('\n✅ A tabela já existe! Tudo certo.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
const connectionString = process.argv[2];
setupDatabase(connectionString);
