declare module '@/config/db' {
  import { Pool } from 'pg';
  const pool: Pool;
  export default pool;
}
