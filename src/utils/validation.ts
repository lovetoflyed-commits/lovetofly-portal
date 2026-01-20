/**
 * API Input Validation Schemas
 * Using Zod for type-safe runtime validation
 * 
 * Phase 1.2: Input Validation (Jan 20, 2026)
 */

import { z } from 'zod';

// ============================================================================
// HANGAR SHARE SCHEMAS
// ============================================================================

export const createHangarListingSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(100, 'Título muito longo'),
  description: z.string().min(10, 'Descrição muito curta').max(5000, 'Descrição muito longa'),
  city: z.string().min(2, 'Cidade inválida').max(100),
  icao_code: z.string().length(4, 'Código ICAO deve ter 4 caracteres').regex(/^[A-Z]{4}$/, 'Código ICAO inválido'),
  size_sqm: z.number().positive('Área deve ser positiva').int().max(10000, 'Área muito grande'),
  max_length: z.number().positive('Comprimento deve ser positivo').max(100),
  max_wingspan: z.number().positive('Envergadura deve ser positiva').max(100),
  max_height: z.number().positive('Altura deve ser positiva').max(50),
  daily_rate: z.number().positive('Diária deve ser positiva').max(1000000),
  monthly_rate: z.number().positive('Mensalidade deve ser positiva').max(1000000),
  available_spaces: z.number().int().min(1, 'Mínimo 1 vaga').max(100),
  amenities: z.array(z.string()).max(20, 'Máximo 20 comodidades').optional(),
});

export const createBookingSchema = z.object({
  listing_id: z.string().uuid('ID de anúncio inválido'),
  user_id: z.string().uuid('ID de usuário inválido'),
  start_date: z.string().datetime('Data inicial inválida'),
  end_date: z.string().datetime('Data final inválida'),
  total_price: z.number().positive('Preço deve ser positivo').max(1000000),
}).refine(
  data => new Date(data.end_date) > new Date(data.start_date),
  { message: 'Data final deve ser posterior à data inicial', path: ['end_date'] }
);

// ============================================================================
// CLASSIFIEDS SCHEMAS
// ============================================================================

export const createAircraftListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  manufacturer: z.string().min(2).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  registration: z.string().min(3).max(20).optional(),
  price: z.number().positive().max(100000000),
  hours_flown: z.number().int().min(0).max(100000).optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'project']),
  city: z.string().min(2).max(100),
  state: z.string().length(2, 'UF deve ter 2 letras').regex(/^[A-Z]{2}$/),
  contact_phone: z.string().min(10).max(20),
  contact_email: z.string().email('Email inválido'),
});

export const createPartsListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  part_number: z.string().min(1).max(100).optional(),
  manufacturer: z.string().min(2).max(100).optional(),
  condition: z.enum(['new', 'overhauled', 'serviceable', 'as-is']),
  price: z.number().positive().max(10000000),
  city: z.string().min(2).max(100),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  contact_phone: z.string().min(10).max(20),
  contact_email: z.string().email(),
});

// ============================================================================
// FORUM SCHEMAS
// ============================================================================

export const createTopicSchema = z.object({
  title: z.string().min(5, 'Título muito curto').max(255, 'Título muito longo'),
  content: z.string().min(10, 'Conteúdo muito curto').max(50000, 'Conteúdo muito longo'),
  category: z.enum(['general', 'technical', 'regulations', 'events', 'classifieds', 'questions']),
  user_id: z.string().uuid(),
});

export const createReplySchema = z.object({
  topic_id: z.string().uuid('ID de tópico inválido'),
  content: z.string().min(1, 'Resposta não pode estar vazia').max(50000),
  user_id: z.string().uuid(),
  parent_reply_id: z.string().uuid().optional(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const registerUserSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(100),
  phone: z.string().min(10).max(20).optional(),
  cep: z.string().length(8, 'CEP deve ter 8 dígitos').regex(/^\d{8}$/, 'CEP deve conter apenas números').optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  aviation_role: z.string().max(50).optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  cep: z.string().length(8).regex(/^\d{8}$/).optional(),
  street: z.string().max(200).optional(),
  number: z.string().max(20).optional(),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  aviation_role: z.string().max(50).optional(),
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['master', 'admin', 'staff', 'partner', 'owner', 'user']),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  role: z.enum(['master', 'admin', 'staff', 'partner', 'owner', 'user']).optional(),
});

// ============================================================================
// PHOTO UPLOAD SCHEMAS
// ============================================================================

export const uploadPhotoSchema = z.object({
  listing_type: z.enum(['aircraft', 'parts', 'avionics', 'hangar']),
  listing_id: z.number().int().positive(),
  is_primary: z.boolean().default(false),
  caption: z.string().max(500).optional(),
  display_order: z.number().int().min(0).max(100).default(0),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates request body against a Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
