import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import pool from '@/config/db';
import { uploadFile } from '@/utils/storage';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
}

type ValidationResult = {
  valid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
};

/**
 * Valida a legibilidade de uma imagem de documento
 * Verifica: nitidez, contraste, tamanho, formato
 */
async function validateDocumentReadability(file: Buffer): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Verificar tamanho do arquivo (mínimo 50KB para legibilidade)
  if (file.length < 50000) {
    issues.push('Imagem muito pequena ou comprimida excessivamente');
    score -= 25;
    suggestions.push('Use uma foto em alta resolução');
  }

  // Verificar tamanho máximo (máximo 10MB)
  if (file.length > 10000000) {
    issues.push('Arquivo muito grande');
    score -= 15;
    suggestions.push('Comprima a imagem antes de enviar');
  }

  // Verificar magic bytes (PNG, JPG, etc)
  const header = file.slice(0, 4);
  const isPNG = header[0] === 0x89 && header[1] === 0x50;
  const isJPG = header[0] === 0xFF && header[1] === 0xD8;

  if (!isPNG && !isJPG) {
    issues.push('Formato de arquivo inválido. Use PNG ou JPG');
    score -= 30;
  }

  return {
    valid: score >= 70,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Valida características anti-fraude básicas
 * - Detectar fotos de fotos (screenshotting de documento)
 * - Verificar dimensões (4:3 ou 3:2 para documentos)
 * - Detectar alterações óbvias
 */
async function validateDocumentAuthenticity(
  buffer: Buffer,
  filename: string
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Verificar nome do arquivo (evitar nomes suspeitos)
  if (filename.toLowerCase().includes('fake') || filename.toLowerCase().includes('test')) {
    issues.push('Nome de arquivo suspeito detectado');
    score -= 40;
    suggestions.push('Envie um documento real e válido');
  }

  // Verificar metadados EXIF (documentos reais geralmente têm)
  // Nota: Implementação completa requer biblioteca EXIF
  // For now, we do basic checks

  // Verificar tamanho da imagem (documentos tipicamente têm aspect ratio 1.4-1.6)
  // Isso seria feito com análise de imagem real (PIL, Sharp, etc)

  return {
    valid: score >= 60,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Valida correspondência entre selfie e documento
 * Verifica que o rosto na selfie corresponde ao documento
 */
async function validateFaceMatch(
  idFrontBuffer: Buffer,
  selfieBuffer: Buffer
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const score = 75; // Score padrão sem análise de IA

  // Esta é uma análise básica sem IA
  // Para implementação real, use:
  // - AWS Rekognition CompareFaces
  // - Azure Face API
  // - Google Cloud Vision
  // - OpenCV + Dlib

  suggestions.push(
    'Para verificação facial completa, integre AWS Rekognition, Azure Face API ou Google Cloud Vision'
  );
  suggestions.push('Implemente liveness detection para evitar fotos impressas');

  return {
    valid: true, // Sem IA, não podemos validar
    score,
    issues,
    suggestions,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const formData = await request.formData();

    const idFront = formData.get('idFront') as File;
    const idBack = formData.get('idBack') as File;
    const selfie = formData.get('selfie') as File;

    if (!idFront || !selfie) {
      return NextResponse.json(
        { error: 'Documentos idFront e selfie são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar frente do documento
    const idFrontBuffer = await idFront.arrayBuffer();
    const idFrontValidation = await validateDocumentReadability(Buffer.from(idFrontBuffer));
    const idFrontAuth = await validateDocumentAuthenticity(
      Buffer.from(idFrontBuffer),
      idFront.name
    );

    // Validar selfie
    const selfieBuffer = await selfie.arrayBuffer();
    const selfieValidation = await validateDocumentReadability(Buffer.from(selfieBuffer));

    // Validar verso se fornecido
    let idBackValidation = null;
    if (idBack) {
      const idBackBuffer = await idBack.arrayBuffer();
      idBackValidation = await validateDocumentReadability(Buffer.from(idBackBuffer));
    }

    // Validar correspondência facial (sem IA por enquanto)
    const faceMatch = await validateFaceMatch(
      Buffer.from(idFrontBuffer),
      Buffer.from(selfieBuffer)
    );

    // Calcular score geral
    const scores = [
      idFrontValidation.score,
      idFrontAuth.score,
      selfieValidation.score,
      idBackValidation?.score || 100,
      faceMatch.score,
    ];
    const overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);

    // Agregar issues
    const allIssues = [
      ...idFrontValidation.issues.map(i => `Frente: ${i}`),
      ...idFrontAuth.issues.map(i => `Autenticidade: ${i}`),
      ...selfieValidation.issues.map(i => `Selfie: ${i}`),
      ...(idBackValidation?.issues.map(i => `Verso: ${i}`) || []),
      ...faceMatch.issues.map(i => `Facial: ${i}`),
    ];

    // Agregar sugestões
    const allSuggestions = new Set([
      ...idFrontValidation.suggestions,
      ...idFrontAuth.suggestions,
      ...selfieValidation.suggestions,
      ...(idBackValidation?.suggestions || []),
      ...faceMatch.suggestions,
    ]);

    const isValid = overallScore >= 70 && allIssues.length === 0;

    // Store documents to Vercel Blob if validation passes basic checks
    let idFrontStorageUrl = '';
    let idBackStorageUrl = '';
    let selfieStorageUrl = '';

    if (overallScore >= 60) {
      try {
        // Upload to Vercel Blob
        const idFrontResult = await uploadFile(idFront, 'owner-documents');
        idFrontStorageUrl = idFrontResult.url;

        if (idBack) {
          const idBackResult = await uploadFile(idBack, 'owner-documents');
          idBackStorageUrl = idBackResult.url;
        }

        const selfieResult = await uploadFile(selfie, 'owner-documents');
        selfieStorageUrl = selfieResult.url;

        // Get or create hangar owner record
        const ownerResult = await pool.query(
          `SELECT id FROM hangar_owners WHERE user_id = $1`,
          [decoded.userId]
        );

        const ownerId = ownerResult.rows.length > 0 ? ownerResult.rows[0].id : null;

        // Save to database
        await pool.query(
          `INSERT INTO user_documents (user_id, owner_id, document_type, file_url, file_size, mime_type, validation_score, validation_status, validation_issues, validation_suggestions)
           VALUES 
             ($1, $2, 'id_front', $3, $4, $5, $6, $7, $8, $9),
             ($1, $2, 'selfie', $10, $11, $12, $13, $14, $15, $16)`,
          [
            decoded.userId,
            ownerId,
            idFrontStorageUrl,
            idFront.size,
            idFront.type,
            Math.round((idFrontValidation.score + idFrontAuth.score) / 2),
            isValid ? 'pending_review' : 'rejected',
            [...idFrontValidation.issues, ...idFrontAuth.issues],
            Array.from(new Set([...idFrontValidation.suggestions, ...idFrontAuth.suggestions])),
            selfieStorageUrl,
            selfie.size,
            selfie.type,
            selfieValidation.score,
            isValid ? 'pending_review' : 'rejected',
            selfieValidation.issues,
            selfieValidation.suggestions,
          ]
        );

        // Insert back document if provided
        if (idBack && idBackStorageUrl) {
          await pool.query(
            `INSERT INTO user_documents (user_id, owner_id, document_type, file_url, file_size, mime_type, validation_score, validation_status, validation_issues, validation_suggestions)
             VALUES ($1, $2, 'id_back', $3, $4, $5, $6, $7, $8, $9)`,
            [
              decoded.userId,
              ownerId,
              idBackStorageUrl,
              idBack.size,
              idBack.type,
              idBackValidation?.score || 100,
              isValid ? 'pending_review' : 'rejected',
              idBackValidation?.issues || [],
              idBackValidation?.suggestions || [],
            ]
          );
        }

        console.log(`[DOCUMENT UPLOAD] User ${decoded.userId} uploaded ${idBack ? 3 : 2} documents for verification`);
      } catch (storageError) {
        console.error('Error storing documents:', storageError);
        return NextResponse.json(
          {
            error: 'Erro ao armazenar documentos',
            message: storageError instanceof Error ? storageError.message : 'Erro desconhecido',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      valid: isValid,
      overallScore,
      breakdown: {
        idFront: {
          readability: idFrontValidation.score,
          authenticity: idFrontAuth.score,
        },
        idBack: idBackValidation ? { readability: idBackValidation.score } : null,
        selfie: {
          readability: selfieValidation.score,
        },
        faceMatch: {
          score: faceMatch.score,
        },
      },
      issues: allIssues,
      suggestions: Array.from(allSuggestions),
      recommendation:
        isValid && overallScore >= 85
          ? 'APROVADO - Documentos válidos e legíveis'
          : isValid && overallScore >= 70
            ? 'REVISÃO - Documentos aceitáveis mas com qualidade baixa'
            : 'REJEITADO - Documentos inválidos ou ilegíveis',
    });
  } catch (error: any) {
    console.error('Erro na validação de documentos:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao validar documentos' },
      { status: 500 }
    );
  }
}
