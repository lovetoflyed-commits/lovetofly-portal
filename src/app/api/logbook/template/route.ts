import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create sample data with Portuguese headers
    const sampleData = [
      {
        'Data do Voo': '03/09/2025',
        'Matrícula': 'PT-CCU',
        'Modelo': 'PA-30',
        'Tipo': 'Avião',
        'Origem': 'SBBH',
        'Destino': 'SBBH',
        'Hora Saída': '08:30',
        'Hora Chegada': '10:18',
        'Horas de Voo': '01:48',
        'Noturno': '00:00',
        'IFR Real': '00:00',
        'Under Hood': '01:36',
        'Simulador': '00:00',
        'Pousos': 1,
        'Pousos Noturno': 0,
        'Função': 'INSTRUCTOR',
        'Habilitação': 'MLTE',
        'Milhas': 120,
        'CANAC': '198699',
        'Observações': 'Instrução em voo - Manobras de navegação'
      },
      {
        'Data do Voo': '04/09/2025',
        'Matrícula': 'PT-ABC',
        'Modelo': 'C172',
        'Tipo': 'Avião',
        'Origem': 'SBMT',
        'Destino': 'SBJD',
        'Hora Saída': '09:00',
        'Hora Chegada': '10:48',
        'Horas de Voo': '01:48',
        'Noturno': '00:00',
        'IFR Real': '00:00',
        'Under Hood': '00:00',
        'Simulador': '00:00',
        'Pousos': 1,
        'Pousos Noturno': 0,
        'Função': 'PIC',
        'Habilitação': 'VFR',
        'Milhas': 85,
        'CANAC': '873711',
        'Observações': 'Voo de instrução - Navegação'
      },
      {
        'Data do Voo': '05/09/2025',
        'Matrícula': 'PT-XYZ',
        'Modelo': 'C152',
        'Tipo': 'Avião',
        'Origem': 'SBSP',
        'Destino': 'SBSP',
        'Hora Saída': '14:00',
        'Hora Chegada': '15:30',
        'Horas de Voo': '01:30',
        'Noturno': '00:00',
        'IFR Real': '00:00',
        'Under Hood': '00:00',
        'Simulador': '00:00',
        'Pousos': 3,
        'Pousos Noturno': 0,
        'Função': 'STUDENT',
        'Habilitação': 'VFR',
        'Milhas': 0,
        'CANAC': '',
        'Observações': 'Treinamento de circuito'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Data do Voo
      { wch: 12 }, // Matrícula
      { wch: 12 }, // Modelo
      { wch: 10 }, // Tipo
      { wch: 8 },  // Origem
      { wch: 8 },  // Destino
      { wch: 12 }, // Hora Saída
      { wch: 12 }, // Hora Chegada
      { wch: 13 }, // Horas de Voo
      { wch: 10 }, // Noturno
      { wch: 10 }, // IFR Real
      { wch: 12 }, // Under Hood
      { wch: 10 }, // Simulador
      { wch: 8 },  // Pousos
      { wch: 15 }, // Pousos Noturno
      { wch: 12 }, // Função
      { wch: 13 }, // Habilitação
      { wch: 8 },  // Milhas
      { wch: 10 }, // CANAC
      { wch: 40 }  // Observações
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Registros de Voo');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_logbook.xlsx"'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar template:', error);
    return NextResponse.json({ 
      message: 'Erro ao gerar arquivo de template' 
    }, { status: 500 });
  }
}
