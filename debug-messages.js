const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugMessages() {
  try {
    console.log('🔍 Debugging Messages System\n');

    // 1. Verificar mensagens recentes
    const recentMessages = await pool.query(`
      SELECT 
        id,
        sender_user_id,
        recipient_user_id,
        subject,
        parent_message_id,
        sent_at,
        created_at
      FROM portal_messages
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('📋 10 Mensagens Mais Recentes:');
    console.log('=====================================');
    recentMessages.rows.forEach(msg => {
      console.log(`ID: ${msg.id}`);
      console.log(`  Subject: ${msg.subject}`);
      console.log(`  Sender: ${msg.sender_user_id} → Recipient: ${msg.recipient_user_id}`);
      console.log(`  Parent ID: ${msg.parent_message_id || 'None (original message)'}`);
      console.log(`  Sent: ${msg.sent_at}`);
      console.log('-------------------------------------');
    });

    // 2. Verificar respostas (mensagens com parent_message_id)
    const replies = await pool.query(`
      SELECT 
        r.id as reply_id,
        r.subject as reply_subject,
        r.sender_user_id as reply_sender,
        r.recipient_user_id as reply_recipient,
        r.parent_message_id,
        p.sender_user_id as parent_sender,
        p.recipient_user_id as parent_recipient,
        p.subject as parent_subject
      FROM portal_messages r
      JOIN portal_messages p ON r.parent_message_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    console.log('\n🔗 5 Respostas Mais Recentes (com Parent):');
    console.log('=====================================');
    replies.rows.forEach(reply => {
      console.log(`Reply ID: ${reply.reply_id}`);
      console.log(`  Reply: "${reply.reply_subject}"`);
      console.log(`  Reply Flow: sender ${reply.reply_sender} → recipient ${reply.reply_recipient}`);
      console.log(`  Parent: "${reply.parent_subject}" (ID: ${reply.parent_message_id})`);
      console.log(`  Parent Flow: sender ${reply.parent_sender} → recipient ${reply.parent_recipient}`);
      
      // Verificar se o fluxo está correto
      const isCorrect = (
        reply.reply_sender === reply.parent_recipient && 
        reply.reply_recipient === reply.parent_sender
      ) || (
        reply.reply_sender === reply.parent_sender && 
        reply.reply_recipient === reply.parent_recipient
      );
      
      console.log(`  Flow is ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log('-------------------------------------');
    });

    // 3. Verificar usuários admins
    const admins = await pool.query(`
      SELECT id, email, role
      FROM users
      WHERE role IN ('master', 'admin')
      ORDER BY id
      LIMIT 5
    `);

    console.log('\n👥 Admins:');
    console.log('=====================================');
    admins.rows.forEach(admin => {
      console.log(`ID: ${admin.id} - Email: ${admin.email} - Role: ${admin.role}`);
    });

    // 4. Verificar inbox de cada admin
    console.log('\n📥 Inbox Count por Admin:');
    console.log('=====================================');
    for (const admin of admins.rows) {
      const inboxCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM portal_messages
        WHERE recipient_user_id = $1
      `, [admin.id]);
      
      console.log(`Admin ${admin.id} (${admin.email}): ${inboxCount.rows[0].count} mensagens recebidas`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugMessages();
