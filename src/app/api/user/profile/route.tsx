import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '../../../../config/db';

export async function GET(req: Request) {
  try {
    // 1. Obtém o Token do Header de Autorização
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token não fornecido ou inválido.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verifica e Decodifica o Token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não definido no .env');
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 3. Busca os dados completos do usuário no banco
    // Selecionamos apenas os campos seguros (excluindo senha)
    const query = `
      SELECT 
        id, 
        first_name as name, 
        email, 
        phone_number, 
        address, 
        current_license, 
        current_ratings, 
        total_flight_hours 
      FROM users 
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Retorna os dados do usuário
    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ message: 'Sessão inválida ou expirada.' }, { status: 401 });
  }
}

