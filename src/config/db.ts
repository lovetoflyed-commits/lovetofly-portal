import { Pool } from 'pg';

// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lovetofly_portal', // Corrigido: com underscore (_)
  password: process.env.DB_PASSWORD || 'Mestre@51',
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;
