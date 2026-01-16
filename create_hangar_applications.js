const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/edsonassumpcao/Desktop/lovetofly-portal/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const applications = [
  {
    user_id: 21, // Carlos Silva
    company_name: 'Hangares Aeroporto SP Ltda',
    cnpj: '12.345.678/0001-90',
    phone: '+55 11 3456-7890',
    address: 'Aeroporto de Congonhas, Hangar 5, São Paulo, SP, 04626-020',
    website: 'https://hangaressp.com.br',
    description: 'Empresa especializada em locação de hangares no Aeroporto de Congonhas. Oferecemos estrutura completa para aeronaves de pequeno e médio porte com segurança 24h.',
    verification_status: 'pending'
  },
  {
    user_id: 34, // Beatriz Carvalho
    company_name: 'Guarita Aviation Services',
    cnpj: '98.765.432/0001-10',
    phone: '+55 11 2345-6789',
    address: 'Aeroporto Campo de Marte, Área de Hangares B12, São Paulo, SP, 02051-070',
    website: 'https://guarita-aviation.com',
    description: 'Hangares premium no Campo de Marte. Serviços completos: manutenção preventiva, limpeza, abastecimento e segurança monitorada. Atendemos desde monomotores até jatos executivos.',
    verification_status: 'pending'
  },
  {
    user_id: 20, // Admin Sistema
    company_name: 'AeroSpace Hangares Corporativos',
    cnpj: '45.678.901/0001-23',
    phone: '+55 19 3210-9876',
    address: 'Aeroporto de Viracopos, Terminal de Carga, Hangar 8, Campinas, SP, 13055-900',
    website: 'https://aerospace-hangares.com.br',
    description: 'Hangares corporativos de alto padrão em Viracopos. Infraestrutura completa para jatos executivos e aeronaves de grande porte. Acesso direto à pista e serviços VIP.',
    verification_status: 'pending'
  },
  {
    user_id: 22, // Another test user
    company_name: 'Hangar Total - Aviação Geral',
    cnpj: '11.222.333/0001-44',
    phone: '+55 11 4567-8901',
    address: 'Aeroporto de Guarulhos, Área de Aviação Geral, Hangar 15, Guarulhos, SP, 07190-100',
    website: null,
    description: 'Hangares compartilhados e individuais no maior aeroporto da América Latina. Ideal para proprietários que buscam comodidade e facilidade de acesso internacional.',
    verification_status: 'pending'
  },
  {
    user_id: 23,
    company_name: 'Sky Storage Hangares Premium',
    cnpj: '55.666.777/0001-88',
    phone: '+55 12 3456-7890',
    address: 'Aeroporto de São José dos Campos, Hangar 3, São José dos Campos, SP, 12247-004',
    website: 'https://skystorage.aero',
    description: 'Hangares climatizados com monitoramento 24/7. Localização estratégica próxima à indústria aeroespacial. Serviços de manutenção e detailing disponíveis.',
    verification_status: 'pending'
  }
];

async function createApplications() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let created = 0;
    for (const app of applications) {
      try {
        // Check if user exists
        const userCheck = await client.query(
          'SELECT id FROM users WHERE id = $1',
          [app.user_id]
        );
        
        if (userCheck.rows.length === 0) {
          console.log(`⚠️  Skipping application for user_id ${app.user_id} - user not found`);
          continue;
        }
        
        // Check if application already exists
        const existingCheck = await client.query(
          'SELECT id FROM hangar_owners WHERE user_id = $1',
          [app.user_id]
        );
        
        let result;
        if (existingCheck.rows.length > 0) {
          // Update existing
          result = await client.query(
            `UPDATE hangar_owners SET
              company_name = $2, cnpj = $3, phone = $4, address = $5,
              website = $6, description = $7, verification_status = $8,
              updated_at = NOW()
            WHERE user_id = $1
            RETURNING id, company_name`,
            [app.user_id, app.company_name, app.cnpj, app.phone, app.address, 
             app.website, app.description, app.verification_status]
          );
          console.log(`🔄 Updated: ${result.rows[0].company_name} (ID: ${result.rows[0].id})`);
        } else {
          // Insert new
          result = await client.query(
            `INSERT INTO hangar_owners (
              user_id, company_name, cnpj, phone, address, website, 
              description, verification_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id, company_name`,
            [app.user_id, app.company_name, app.cnpj, app.phone, app.address, 
             app.website, app.description, app.verification_status]
          );
          console.log(`✅ Created: ${result.rows[0].company_name} (ID: ${result.rows[0].id})`);
        }
        
        created++;
      } catch (err) {
        console.log(`⚠️  Error with user_id ${app.user_id}: ${err.message}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n📊 Summary:');
    console.log(`   Total applications created/updated: ${created}`);
    console.log(`   Status: pending (ready for verification)`);
    console.log('\n✅ Hangar owner applications ready for testing!');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createApplications();
