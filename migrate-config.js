require('dotenv').config();

const user = process.env.DB_USER || 'postgres';
const password = encodeURIComponent(process.env.DB_PASSWORD || ''); 
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 5432;
const db = process.env.DB_DATABASE || 'lovetofly-portal';

// Monta a URL de conexão
const databaseUrl = `postgres://${user}:${password}@${host}:${port}/${db}`;

console.log('Tentando conectar no banco:', databaseUrl);

// Set DATABASE_URL for node-pg-migrate
process.env.DATABASE_URL = databaseUrl;

module.exports = {
  databaseUrl: databaseUrl,
  migrationsTable: 'pgmigrations',
  dir: 'src/migrations',
  direction: 'up',
  count: 1
};

