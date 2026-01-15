import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.title,
        t.category,
        t.content,
        t.views,
        t.replies_count,
        t.is_pinned,
        t.is_locked,
        t.created_at,
        t.updated_at,
        u.name as author_name
      FROM forum_topics t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.is_deleted = FALSE
    `;

    const params: any[] = [];

    if (category) {
      query += ` AND t.category = $${params.length + 1}`;
      params.push(category);
    }

    query += ` ORDER BY t.is_pinned DESC, t.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM forum_topics WHERE is_deleted = FALSE`;
    if (category) {
      countQuery += ` AND category = $1`;
    }
    const countResult = await pool.query(
      countQuery,
      category ? [category] : []
    );

    return NextResponse.json({
      topics: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum topics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, content, token } = body;

    // Validate required fields
    if (!title || !category || !content || !token) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    const userId = (decoded as any).user_id;

    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Insert topic
    const result = await pool.query(
      `INSERT INTO forum_topics (user_id, title, category, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [userId, title, category, content]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      message: 'Topic created successfully',
      topic: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating forum topic:', error);
    if ((error as any).name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
