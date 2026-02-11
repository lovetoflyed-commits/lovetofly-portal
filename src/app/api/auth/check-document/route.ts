import { NextResponse, NextRequest } from 'next/server';
import pool from '@/config/db';
import { isValidCNPJ, isValidCPF } from '@/utils/masks';

/**
 * GET /api/auth/check-document
 * 
 * Validates document availability (CPF or CNPJ)
 * Query parameters:
 *   - type: 'cpf' or 'cnpj'
 *   - value: the document value (with or without formatting)
 * 
 * Response: { available: boolean, valid: boolean, message?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const docType = searchParams.get('type');
    const docValue = searchParams.get('value');

    // Validate parameters
    if (!docType || !docValue) {
      return NextResponse.json(
        { error: 'Parâmetros ausentes: type e value são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanedValue = docValue.replace(/\D/g, '');

    // Validate document type
    if (!['cpf', 'cnpj'].includes(docType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido. Use "cpf" ou "cnpj"' },
        { status: 400 }
      );
    }

    // Validate document format and calculate validity
    let isValid = false;
    let field = '';
    let table = 'users';

    if (docType.toLowerCase() === 'cpf') {
      isValid = isValidCPF(cleanedValue);
      field = 'cpf';
      
      if (!isValid) {
        return NextResponse.json({
          available: false,
          valid: false,
          message: 'CPF inválido. Verifique o número.'
        });
      }
    } else {
      // CNPJ
      isValid = isValidCNPJ(cleanedValue);
      field = 'cnpj';
      
      if (!isValid) {
        return NextResponse.json({
          available: false,
          valid: false,
          message: 'CNPJ inválido. Verifique o número.'
        });
      }
    }

    // Check if document already exists in users table
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE ${field} = $1`,
      [cleanedValue]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        available: false,
        valid: true,
        message: `${field.toUpperCase()} já cadastrado no sistema`
      });
    }

    // For CNPJ, also check business_users table
    if (docType.toLowerCase() === 'cnpj') {
      const existingBusiness = await pool.query(
        'SELECT id FROM business_users WHERE cnpj = $1',
        [cleanedValue]
      );

      if (existingBusiness.rows.length > 0) {
        return NextResponse.json({
          available: false,
          valid: true,
          message: 'CNPJ já registrado no sistema'
        });
      }
    }

    // Document is valid and available
    return NextResponse.json({
      available: true,
      valid: true,
      message: `${field.toUpperCase()} disponível`
    });

  } catch (error) {
    console.error('Erro ao verificar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar documento' },
      { status: 500 }
    );
  }
}
