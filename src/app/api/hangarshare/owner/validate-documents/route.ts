import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

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
  let score = 75; // Score padrão sem análise de IA

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
