import { Pool } from 'pg';

// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback para variáveis individuais se DATABASE_URL não estiver definida
  ...(process.env.DATABASE_URL ? {} : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lovetofly-portal',
    password: process.env.DB_PASSWORD || 'Master@51',
    port: Number(process.env.DB_PORT) || 5432,
  }),
});

export default pool;
