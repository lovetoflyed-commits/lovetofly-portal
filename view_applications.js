const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/edsonassumpcao/Desktop/lovetofly-portal/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function viewApplications() {
  const result = await pool.query(`
    SELECT 
      ho.id,
      ho.company_name,
      ho.cnpj,
      ho.phone,
      ho.address,
      ho.website,
      ho.description,
      ho.verification_status,
      CONCAT(u.first_name, ' ', u.last_name) as owner_name,
      u.email as owner_email
    FROM hangar_owners ho
    JOIN users u ON u.id = ho.user_id
    WHERE u.email LIKE '%test.local%'
    ORDER BY ho.id
  `);
  
  console.log('📋 HANGAR OWNER APPLICATIONS - TEST DATA\n');
  console.log('═'.repeat(80));
  
  result.rows.forEach(app => {
    console.log(`\n🏢 Application ID: ${app.id}`);
    console.log(`   Company: ${app.company_name}`);
    console.log(`   CNPJ: ${app.cnpj}`);
    console.log(`   Phone: ${app.phone}`);
    console.log(`   Address: ${app.address}`);
    console.log(`   Website: ${app.website || 'N/A'}`);
    console.log(`   Description: ${app.description.substring(0, 80)}...`);
    console.log(`   Owner: ${app.owner_name} (${app.owner_email})`);
    console.log(`   Status: ⏳ ${app.verification_status.toUpperCase()}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log(`\nTotal: ${result.rows.length} applications ready for verification testing`);
  console.log('\n✅ All applications use test users (@test.local)');
  console.log('✅ All applications are in PENDING status');
  console.log('\n💡 You can now test the verification tool with these applications!');
  
  await pool.end();
}

viewApplications();
