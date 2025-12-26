import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(request: Request) {
  try {
    // 1. Promover 'lovetofly.ed@gmail.com' e qualquer email contendo 'kaiser' para Pro
    const proResult = await pool.query(
      `UPDATE users 
       SET plan = $1 
       WHERE email = $2 OR email ILIKE $3
       RETURNING id, email, plan`,
      ['pro', 'lovetofly.ed@gmail.com', '%kaiser%']
    );

    // 2. Promover todos os outros usuários para Premium (exceto os que já são Pro)
    const premiumResult = await pool.query(
      `UPDATE users 
       SET plan = $1 
       WHERE (email != $2 AND email NOT ILIKE $3) AND plan != 'pro'
       RETURNING id, email, plan`,
      ['premium', 'lovetofly.ed@gmail.com', '%kaiser%']
    );

    return NextResponse.json({
      message: 'Planos atualizados com sucesso!',
      upgradedToPro: proResult.rows,
      totalUpgradedToPro: proResult.rows.length,
      upgradedToPremium: premiumResult.rows,
      totalUpgradedToPremium: premiumResult.rows.length,
    });

  } catch (error: any) {
    console.error('Erro ao atualizar planos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar planos: ' + error.message },
      { status: 500 }
    );
  }
}
