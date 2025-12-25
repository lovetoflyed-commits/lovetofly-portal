import { Pool } from 'pg';

// Força o uso da variável DATABASE_URL que configuramos no Netlify
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('ERRO CRÍTICO: DATABASE_URL não encontrada. Configure no painel do Netlify.');
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Obrigatório para o Neon
  },
  // Removemos qualquer referência a DB_HOST ou localhost aqui
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
