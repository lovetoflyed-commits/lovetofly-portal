import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImportError {
  row: number;
  message: string;
}

interface ImportWarning {
  row: number;
  message: string;
}

interface ImportResult {
  success: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

// Column name mappings (flexible names in PT/EN)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  flight_date: ['data do voo', 'data', 'date', 'flight date', 'data_voo'],
  aircraft_registration: ['aeronave', 'matrícula', 'matricula', 'aircraft', 'registration', 'aircraft_registration'],
  aircraft_model: ['modelo', 'model', 'aircraft model', 'aircraft_model'],
  aircraft_type: ['tipo de aeronave', 'tipo', 'type', 'aircraft type', 'aircraft_type'],
  departure_aerodrome: ['origem', 'from', 'departure', 'saída', 'saida', 'departure_aerodrome'],
  arrival_aerodrome: ['destino', 'to', 'arrival', 'chegada', 'arrival_aerodrome'],
  departure_time: ['hora saída', 'hora saida', 'departure time', 'time out', 'departure_time'],
  arrival_time: ['hora chegada', 'arrival time', 'time in', 'arrival_time'],
  time_diurno: ['horas de voo', 'horas', 'flight time', 'time diurno', 'diurno', 'day time', 'time_diurno'],
  time_noturno: ['noturno', 'night time', 'time noturno', 'time_noturno'],
  time_ifr_real: ['ifr real', 'ifr', 'time ifr', 'time_ifr_real'],
  time_under_hood: ['under hood', 'capota', 'time under hood', 'time_under_hood'],
  time_simulator: ['simulador', 'simulator', 'sim', 'time simulator', 'time_simulator'],
  day_landings: ['pousos', 'landings', 'day landings', 'pousos dia', 'day_landings'],
  night_landings: ['pousos noturno', 'night landings', 'pousos noite', 'night_landings'],
  function: ['função', 'funcao', 'function', 'role', 'pilot function'],
  rating: ['habilitação', 'habilitacao', 'rating', 'license'],
  nav_miles: ['milhas', 'miles', 'nav miles', 'navigation miles', 'nav_miles'],
  pilot_canac_number: ['canac', 'número canac', 'numero canac', 'canac number', 'pilot_canac_number'],
  remarks: ['observações', 'observacoes', 'remarks', 'notes', 'comments', 'obs']
};

// Normalize column name to standard field name
function normalizeColumnName(columnName: string): string | null {
  const normalized = columnName.toLowerCase().trim();
  
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.some(v => normalized === v.toLowerCase())) {
      return fieldName;
    }
  }
  
  return null;
}

// Parse date from various formats
function parseDate(value: any): string | null {
  if (!value) return null;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // If it's a string
  if (typeof value === 'string') {
    const str = value.trim();
    
    // DD/MM/YYYY
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = ddmmyyyyMatch[3];
      return `${year}-${month}-${day}`;
    }
    
    // YYYY-MM-DD (already correct format)
    const yyyymmddMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = yyyymmddMatch[1];
      const month = yyyymmddMatch[2].padStart(2, '0');
      const day = yyyymmddMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  return null;
}

// Parse time from HH:MM or decimal format
function parseTime(value: any): string {
  if (!value) return '00:00';
  
  // If it's a number (decimal hours)
  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  // If it's a string in HH:MM format
  if (typeof value === 'string') {
    const str = value.trim();
    const match = str.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
    
    // Try decimal format in string
    const num = parseFloat(str);
    if (!isNaN(num)) {
      const totalMinutes = Math.round(num * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }
  
  return '00:00';
}

// Validate ICAO code (4 characters)
function validateICAO(code: string): boolean {
  if (!code) return true; // Optional field
  return /^[A-Z]{4}$/i.test(code.trim());
}

// Validate time is between 0 and 24 hours
function validateTime(timeStr: string): boolean {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60;
}

// Check if a flight log already exists (duplicate detection)
async function isDuplicate(userId: number, flightDate: string, aircraftRegistration: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT id FROM flight_logs 
       WHERE user_id = $1 AND flight_date = $2 AND aircraft_registration = $3 AND deleted_at IS NULL`,
      [userId, flightDate, aircraftRegistration]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ 
        message: 'Tipo de arquivo inválido. Use .xlsx, .xls ou .csv' 
      }, { status: 400 });
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse with xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (rawData.length < 2) {
      return NextResponse.json({ 
        message: 'Arquivo vazio ou sem dados' 
      }, { status: 400 });
    }

    // Get headers and normalize them
    const headers = rawData[0] as string[];
    const columnMap: Record<number, string> = {};
    
    headers.forEach((header, index) => {
      const normalized = normalizeColumnName(String(header));
      if (normalized) {
        columnMap[index] = normalized;
      }
    });

    // Process rows
    const result: ImportResult = {
      success: 0,
      errors: [],
      warnings: []
    };

    const dataRows = rawData.slice(1); // Skip header row
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < dataRows.length; i++) {
        const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed
        const row = dataRows[i];
        
        // Skip empty rows
        if (!row || row.every(cell => !cell)) continue;
        
        // Extract data from row
        const rowData: Record<string, any> = {};
        
        row.forEach((cell, colIndex) => {
          const fieldName = columnMap[colIndex];
          if (fieldName && cell !== undefined && cell !== null && cell !== '') {
            rowData[fieldName] = cell;
          }
        });

        // Validate required fields
        if (!rowData.flight_date) {
          result.errors.push({ row: rowNum, message: 'Data do voo é obrigatória' });
          continue;
        }

        if (!rowData.aircraft_registration) {
          result.errors.push({ row: rowNum, message: 'Matrícula da aeronave é obrigatória' });
          continue;
        }

        // Parse and validate date
        const flightDate = parseDate(rowData.flight_date);
        if (!flightDate) {
          result.errors.push({ row: rowNum, message: 'Data do voo inválida' });
          continue;
        }

        // Check for duplicate
        const isDup = await isDuplicate(decoded.id, flightDate, String(rowData.aircraft_registration));
        if (isDup) {
          result.warnings.push({ 
            row: rowNum, 
            message: 'Registro duplicado (mesma data e aeronave) - ignorado' 
          });
          continue;
        }

        // Validate ICAO codes
        if (rowData.departure_aerodrome && !validateICAO(String(rowData.departure_aerodrome))) {
          result.errors.push({ row: rowNum, message: 'Código ICAO de origem inválido (deve ter 4 letras)' });
          continue;
        }

        if (rowData.arrival_aerodrome && !validateICAO(String(rowData.arrival_aerodrome))) {
          result.errors.push({ row: rowNum, message: 'Código ICAO de destino inválido (deve ter 4 letras)' });
          continue;
        }

        // Parse times
        const timeDiurno = parseTime(rowData.time_diurno);
        const timeNoturno = parseTime(rowData.time_noturno);
        const timeIfrReal = parseTime(rowData.time_ifr_real);
        const timeUnderHood = parseTime(rowData.time_under_hood);
        const timeSimulator = parseTime(rowData.time_simulator);
        const departureTime = parseTime(rowData.departure_time);
        const arrivalTime = parseTime(rowData.arrival_time);

        // Validate at least one flight time is provided
        if (timeDiurno === '00:00' && timeNoturno === '00:00') {
          result.errors.push({ 
            row: rowNum, 
            message: 'Pelo menos um tempo de voo (diurno ou noturno) é obrigatório' 
          });
          continue;
        }

        // Validate time formats
        if (!validateTime(timeDiurno)) {
          result.errors.push({ row: rowNum, message: 'Tempo diurno inválido' });
          continue;
        }

        // Insert into database
        try {
          await client.query(
            `INSERT INTO flight_logs (
              user_id,
              flight_date,
              aircraft_registration,
              aircraft_model,
              aircraft_type,
              departure_aerodrome,
              arrival_aerodrome,
              departure_time,
              arrival_time,
              time_diurno,
              time_noturno,
              time_ifr_real,
              time_under_hood,
              time_simulator,
              day_landings,
              night_landings,
              function,
              rating,
              nav_miles,
              pilot_canac_number,
              remarks,
              status,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())`,
            [
              decoded.id,
              flightDate,
              String(rowData.aircraft_registration || '').trim(),
              String(rowData.aircraft_model || '').trim(),
              String(rowData.aircraft_type || 'Avião').trim(),
              rowData.departure_aerodrome ? String(rowData.departure_aerodrome).trim().toUpperCase() : null,
              rowData.arrival_aerodrome ? String(rowData.arrival_aerodrome).trim().toUpperCase() : null,
              departureTime !== '00:00' ? departureTime : null,
              arrivalTime !== '00:00' ? arrivalTime : null,
              timeDiurno,
              timeNoturno,
              timeIfrReal,
              timeUnderHood,
              timeSimulator,
              rowData.day_landings ? parseInt(String(rowData.day_landings), 10) : 0,
              rowData.night_landings ? parseInt(String(rowData.night_landings), 10) : 0,
              String(rowData.function || 'PIC').trim(),
              String(rowData.rating || 'VFR').trim(),
              rowData.nav_miles ? parseInt(String(rowData.nav_miles), 10) : 0,
              rowData.pilot_canac_number ? String(rowData.pilot_canac_number).trim() : '',
              rowData.remarks ? String(rowData.remarks).trim() : '',
              'CADASTRADO'
            ]
          );
          
          result.success++;
        } catch (insertError) {
          console.error('Error inserting row:', insertError);
          result.errors.push({ 
            row: rowNum, 
            message: 'Erro ao inserir registro no banco de dados' 
          });
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar importação:', error);
    return NextResponse.json({ 
      message: 'Erro ao processar arquivo de importação',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
