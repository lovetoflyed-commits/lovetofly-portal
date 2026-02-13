const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testHangarShareScenario() {
  try {
    console.log('🧪 Testing HangarShare Reply Scenario\n');

    // 1. Get users
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
      console.log('❌ Need at least 1 admin and 1 regular user');
      return;
    }

    const admin = usersQuery.rows[0];
    const user = regularUserQuery.rows[0];

    console.log('👥 Users:');
    console.log(`Admin: ${admin.email} (ID: ${admin.id})`);
    console.log(`User: ${user.email} (ID: ${user.id})\n`);

    // 2. Create HangarShare message from system/admin to user
    const hangarMsg = await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id,
        recipient_user_id,
        subject,
        message,
        sender_type,
        module,
        is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, sender_user_id, recipient_user_id, module, sender_type
    `, [
      admin.id,
      user.id,
      'Aplicação HangarShare - Hangar XYZ',
      'Sua aplicação para o hangar foi recebida',
      'system', // HangarShare sends as system
      'hangarshare',
      false
    ]);

    console.log('📨 HangarShare Message Created:');
    console.log(`  ID: ${hangarMsg.rows[0].id}`);
    console.log(`  Module: ${hangarMsg.rows[0].module}`);
    console.log(`  Sender Type: ${hangarMsg.rows[0].sender_type}`);
    console.log(`  From: ${hangarMsg.rows[0].sender_user_id} (admin/system)`);
    console.log(`  To: ${hangarMsg.rows[0].recipient_user_id} (user)\n`);

    // 3. Check user inbox
    const userInboxBefore = await pool.query(`
      SELECT COUNT(*) as count
      FROM portal_messages
      WHERE recipient_user_id = $1
        AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false')
    `, [user.id]);

    console.log(`📥 User inbox before reply: ${userInboxBefore.rows[0].count} messages\n`);

    // 4. Now user replies to this message
    // This simulates what happens when user clicks "Responder" and sends a reply
    console.log('📤 User replying to HangarShare message...\n');
    
    // Determine recipient (this is what the API does)
    const parentMsg = hangarMsg.rows[0];
    const currentSender = user.id;
    const parentSenderId = String(parentMsg.sender_user_id);
    const parentRecipientId = String(parentMsg.recipient_user_id);
    
    const calculatedRecipient = parentSenderId === currentSender
      ? parentRecipientId
      : parentSenderId;

    console.log('🔍 Reply Recipient Calculation:');
    console.log(`  Parent sender_user_id: ${parentSenderId}`);
    console.log(`  Parent recipient_user_id: ${parentRecipientId}`);
    console.log(`  Current sender (user): ${currentSender}`);
    console.log(`  Comparison: "${parentSenderId}" === "${currentSender}": ${parentSenderId === currentSender}`);
    console.log(`  Calculated recipient: ${calculatedRecipient}\n`);

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
      user.id,
      calculatedRecipient,
      'Re: Aplicação HangarShare - Hangar XYZ',
      'Obrigado pela confirmação!',
      'user',
      'hangarshare',
      hangarMsg.rows[0].id,
      false
    ]);

    console.log('✅ Reply Created:');
    console.log(`  ID: ${replyMsg.rows[0].id}`);
    console.log(`  From: ${replyMsg.rows[0].sender_user_id} (user)`);
    console.log(`  To: ${replyMsg.rows[0].recipient_user_id} (should be admin)`);
    console.log(`  Parent ID: ${replyMsg.rows[0].parent_message_id}\n`);

    // 5. Check admin inbox
    const adminInbox = await pool.query(`
      SELECT COUNT(*) as count
      FROM portal_messages
      WHERE recipient_user_id = $1
        AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false')
    `, [admin.id]);

    console.log(`📥 Admin inbox after reply: ${adminInbox.rows[0].count} messages\n`);

    // 6. Check if reply appears in admin inbox
    const replyInAdminInbox = await pool.query(`
      SELECT id, subject, sender_user_id, recipient_user_id
      FROM portal_messages
      WHERE id = $1 AND recipient_user_id = $2
    `, [replyMsg.rows[0].id, admin.id]);

    if (replyInAdminInbox.rows.length > 0) {
      console.log('✅ Reply FOUND in admin inbox!');
    } else {
      console.log('❌ Reply NOT FOUND in admin inbox!');
      console.log(`   Reply recipient_user_id: ${replyMsg.rows[0].recipient_user_id}`);
      console.log(`   Admin ID: ${admin.id}`);
      console.log(`   Match: ${replyMsg.rows[0].recipient_user_id === admin.id}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testHangarShareScenario();
