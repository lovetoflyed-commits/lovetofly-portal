const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/lovetofly-portal?sslmode=require&channel_binding=require',
});

async function checkHangarshareAdvertiser(email) {
  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    console.log('Usuário não encontrado.');
    return;
  }
  const userId = userRes.rows[0].id;
  const hangarRes = await pool.query('SELECT * FROM hangar_listings WHERE owner_id = $1', [userId]);
  if (hangarRes.rows.length > 0) {
    console.log('Usuário É anunciante ativo no HangarShare.');
    console.log(hangarRes.rows);
  } else {
    console.log('Usuário NÃO é anunciante ativo no HangarShare.');
  }
  await pool.end();
}

checkHangarshareAdvertiser('lovetofly.ed@gmail.com');
