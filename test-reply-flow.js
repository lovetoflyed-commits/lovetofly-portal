const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testReplyFlow() {
  try {
    console.log('🧪 Testing Reply Flow\n');

    // 1. Get admin and a regular user
    const usersQuery = await pool.query(`
      SELECT id, email, role, first_name, last_name
      FROM users
      WHERE role IN ('admin', 'master')
      ORDER BY role DESC
      LIMIT 1
    `);

    const regularUserQuery = await pool.query(`
      SELECT id, email, role, first_name, last_name
      FROM users
      WHERE role NOT IN ('admin', 'master', 'staff')
      LIMIT 1
    `);

    if (usersQuery.rows.length === 0 || regularUserQuery.rows.length === 0) {
      console.log('❌ Precisa ter pelo menos 1 admin e 1 usuário regular');
      return;
    }

    const admin = usersQuery.rows[0];
    const user = regularUserQuery.rows[0];

    console.log('👥 Usuários do Teste:');
    console.log(`Admin: ${admin.email} (ID: ${admin.id})`);
    console.log(`User: ${user.email} (ID: ${user.id})\n`);

    // 2. Create original message from user to admin
    const originalMsg = await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id,
        recipient_user_id,
        subject,
        message,
        sender_type,
        module,
        is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, sender_user_id, recipient_user_id
    `, [
      user.id,
      admin.id,
      'Teste - Mensagem Original do User',
      'Esta é uma mensagem de teste do usuário para o admin',
      'user',
      'general',
      false
    ]);

    console.log('📨 Mensagem Original Criada:');
    console.log(`  ID: ${originalMsg.rows[0].id}`);
    console.log(`  De: ${originalMsg.rows[0].sender_user_id} (user)`);
    console.log(`  Para: ${originalMsg.rows[0].recipient_user_id} (admin)\n`);

    // 3. Verify original appears in admin inbox
    const adminInboxCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM portal_messages
      WHERE recipient_user_id = $1
        AND id = $2
        AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false')
    `, [admin.id, originalMsg.rows[0].id]);

    console.log(`✅ Admin inbox has original: ${adminInboxCheck.rows[0].count} (expected: 1)\n`);

    // 4. Create reply from admin to user
    const replyMsg = await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id,
        recipient_user_id,
        subject,
        message,
        sender_type,
        module,
        parent_message_id,
        is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, sender_user_id, recipient_user_id, parent_message_id
    `, [
      admin.id,
      user.id,
      'Re: Teste - Mensagem Original do User',
      'Esta é uma resposta do admin para o usuário',
      'admin',
      'general',
      originalMsg.rows[0].id,
      false
    ]);

    console.log('↩️ Resposta Criada:');
    console.log(`  ID: ${replyMsg.rows[0].id}`);
    console.log(`  De: ${replyMsg.rows[0].sender_user_id} (admin)`);
    console.log(`  Para: ${replyMsg.rows[0].recipient_user_id} (user)`);
    console.log(`  Parent ID: ${replyMsg.rows[0].parent_message_id}\n`);

    // 5. Verify reply appears in user inbox
    const userInboxCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM portal_messages
      WHERE recipient_user_id = $1
        AND id = $2
        AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false')
    `, [user.id, replyMsg.rows[0].id]);

    console.log(`✅ User inbox has reply: ${userInboxCheck.rows[0].count} (expected: 1)\n`);

    // 6. Verify reply appears in admin sent
    const adminSentCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM portal_messages
      WHERE sender_user_id = $1
        AND id = $2
        AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false')
    `, [admin.id, replyMsg.rows[0].id]);

    console.log(`✅ Admin sent has reply: ${adminSentCheck.rows[0].count} (expected: 1)\n`);

    // 7. Show the flow
    console.log('📊 Flow Summary:');
    console.log('=====================================');
    console.log(`Original Message (ID ${originalMsg.rows[0].id}):`);
    console.log(`  User ${user.id} → Admin ${admin.id}`);
    console.log(`  Should appear in:`);
    console.log(`    ✓ User sent tab`);
    console.log(`    ✓ Admin inbox tab`);
    console.log('');
    console.log(`Reply Message (ID ${replyMsg.rows[0].id}):`);
    console.log(`  Admin ${admin.id} → User ${user.id}`);
    console.log(`  Should appear in:`);
    console.log(`    ✓ Admin sent tab`);
    console.log(`    ✓ User inbox tab`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testReplyFlow();
