'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Download, X, Clock, Plane, Upload } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import LogbookImport from './components/LogbookImport';

// ANAC CIV Digital compliant data structure
const FLIGHT_LOGS = [
  {
    id: 1,
    date: '03/09/2025',
    aircraft_registration: 'PT-CCU',
    aircraft_model: 'PA-30',
    aircraft_type: 'Avião',
    departure_aerodrome: 'SBBH',
    arrival_aerodrome: 'SBBH',
    departure_time: '08:30',
    arrival_time: '10:18',
    time_diurno: '01:48',
    time_noturno: '00:00',
    time_ifr_real: '00:00',
    time_under_hood: '01:36',
    time_simulator: '00:00',
    day_landings: 1,
    night_landings: 0,
    function: 'INSTRUCTOR',
    rating: 'MLTE',
    nav_miles: 120,
    pilot_canac_number: '198699',
    remarks: 'Instrução em voo - Manobras de navegação',
    status: 'CADASTRADO',
    created_at: '2025-09-03T11:21:00Z'
  },
  {
    id: 2,
    date: '04/09/2025',
    aircraft_registration: 'PT-ABC',
    aircraft_model: 'C172',
    aircraft_type: 'Avião',
    departure_aerodrome: 'SBMT',
    arrival_aerodrome: 'SBJD',
    departure_time: '09:00',
    arrival_time: '10:48',
    time_diurno: '01:48',
    time_noturno: '00:00',
    time_ifr_real: '00:00',
    time_under_hood: '00:00',
    time_simulator: '00:00',
    day_landings: 1,
    night_landings: 0,
    function: 'PIC',
    rating: 'VFR',
    nav_miles: 85,
    pilot_canac_number: '873711',
    remarks: 'Voo de instrução - Navegação',
    status: 'CADASTRADO',
    created_at: '2025-09-04T11:48:00Z'
  }
];

interface NewFlightForm {
  date: string;
  aircraft_registration: string;
  aircraft_model: string;
  aircraft_type: string;
  departure_aerodrome: string;
  arrival_aerodrome: string;
  departure_time: string;
  arrival_time: string;
  time_diurno: string;
  time_noturno: string;
  time_ifr_real: string;
  time_under_hood: string;
  time_simulator: string;
  day_landings: number;
  night_landings: number;
  function: string;
  rating: string;
  nav_miles: number;
  pilot_canac_number: string;
  remarks: string;
}

const initialFormState: NewFlightForm = {
  date: '',
  aircraft_registration: '',
  aircraft_model: '',
  aircraft_type: 'Avião',
  departure_aerodrome: '',
  arrival_aerodrome: '',
  departure_time: '',
  arrival_time: '',
  time_diurno: '00:00',
  time_noturno: '00:00',
  time_ifr_real: '00:00',
  time_under_hood: '00:00',
  time_simulator: '00:00',
  day_landings: 0,
  night_landings: 0,
  function: 'PIC',
  rating: 'VFR',
  nav_miles: 0,
  pilot_canac_number: '',
  remarks: ''
};

export default function LogbookPage() {
  const { user, token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState<NewFlightForm>(initialFormState);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedFlights, setDeletedFlights] = useState<any[]>([]);

  // Fetch user's flight logs on mount
  useEffect(() => {
    if (token) {
      fetchFlightLogs();
    }
  }, [token]);

  const fetchFlightLogs = async () => {
    try {
      const response = await fetch('/api/logbook', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlights(data.flights || []);
      }
    } catch (error) {
      console.error('Erro ao carregar voos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedLogs = async () => {
    try {
      const response = await fetch('/api/logbook/deleted', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeletedFlights(data.deletedFlights || []);
      }
    } catch (error) {
      console.error('Erro ao carregar voos excluídos:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Tem certeza que deseja excluir este voo? Ele será movido para a lista de voos excluídos.')) {
      return;
    }

    try {
      const response = await fetch(`/api/logbook?id=${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from active flights list
        setFlights(flights.filter(f => f.id !== logId));
        alert('Voo excluído com sucesso');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao excluir voo');
      }
    } catch (error) {
      console.error('Erro ao excluir voo:', error);
      alert('Erro ao excluir voo. Tente novamente.');
    }
  };

  const handleInputChange = (field: keyof NewFlightForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Time mask formatter for HH:MM format
  const handleTimeMask = (field: keyof NewFlightForm, value: string) => {
    // Remove all non-numeric characters
    let numbers = value.replace(/\D/g, '');
    
    // Limit to 4 digits (HHMM)
    numbers = numbers.slice(0, 4);
    
    // Format as HH:MM
    let formatted = '';
    if (numbers.length > 0) {
      formatted = numbers.slice(0, 2);
      if (numbers.length > 2) {
        formatted += ':' + numbers.slice(2, 4);
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('Você precisa estar logado para registrar voos');
      return;
    }

    try {
      const response = await fetch('/api/logbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        // Add new flight to local state
        setFlights([data.flight, ...flights]);
        setFormData(initialFormState);
        setShowForm(false);
        alert('Voo registrado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao registrar voo');
      }
    } catch (error) {
      console.error('Erro ao salvar voo:', error);
      alert('Erro ao registrar voo. Tente novamente.');
    }
  };

  // Calculate totals
  const calculateTotals = (flights: any[]) => {
    return flights.reduce((acc, flight) => ({
      totalHours: acc.totalHours + timeToHours(flight.time_diurno) + timeToHours(flight.time_noturno) + timeToHours(flight.time_ifr_real) + timeToHours(flight.time_under_hood),
      picHours: acc.picHours + (flight.function === 'PIC' ? timeToHours(flight.time_diurno) + timeToHours(flight.time_noturno) + timeToHours(flight.time_ifr_real) + timeToHours(flight.time_under_hood) : 0),
      instructionHours: acc.instructionHours + (flight.function === 'INSTRUCTOR' ? timeToHours(flight.time_diurno) + timeToHours(flight.time_noturno) + timeToHours(flight.time_ifr_real) + timeToHours(flight.time_under_hood) : 0),
      ifrHours: acc.ifrHours + timeToHours(flight.time_ifr_real),
      nightHours: acc.nightHours + timeToHours(flight.time_noturno),
      totalLandings: acc.totalLandings + flight.day_landings + flight.night_landings
    }), { totalHours: 0, picHours: 0, instructionHours: 0, ifrHours: 0, nightHours: 0, totalLandings: 0 });
  };

  const normalizeTime = (value: any): string => {
    if (!value) return '00:00';
    if (typeof value === 'string') return value.includes(':') ? value.slice(0, 5) : `${value}:00`;
    if (typeof value === 'object') {
      const hours = Number(value.hours ?? 0);
      const minutes = Number(value.minutes ?? 0);
      const total = hours * 60 + minutes;
      const hh = String(Math.floor(total / 60)).padStart(2, '0');
      const mm = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '00:00';
  };

  const timeToHours = (timeStr: string | null | undefined): number => {
    const normalized = normalizeTime(timeStr);
    const [hours, minutes] = normalized.split(':').map(Number);
    return (Number.isFinite(hours) ? hours : 0) + (Number.isFinite(minutes) ? minutes / 60 : 0);
  };

  const totals = calculateTotals(flights);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando registros de voo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">{" "}
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Caderneta Individual de Voo</h1>
                <p className="text-blue-100">
                  Compliant with ANAC CIV Digital format
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                  <Plus size={18} /> Novo Registro
                </button>
                <button 
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                  <Upload size={18} /> Importar Registros
                </button>
                <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  <Download size={18} /> Extrato PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8">
          {/* New Flight Form Modal */}
          {showForm && (
            <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Novo Voo - ANAC CIV Digital</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Fechar formulário">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Date, Aircraft Registration, Model, Type */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data *</label>
                    <input type="date" required value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Data" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Matrícula Aeronave *</label>
                    <input type="text" required value={formData.aircraft_registration} onChange={(e) => handleInputChange('aircraft_registration', e.target.value)} placeholder="PT-ABC" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Matricula aeronave" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo Aeronave *</label>
                    <input type="text" required value={formData.aircraft_model} onChange={(e) => handleInputChange('aircraft_model', e.target.value)} placeholder="C172" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Modelo aeronave" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo Aeronave *</label>
                    <select value={formData.aircraft_type} onChange={(e) => handleInputChange('aircraft_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Tipo aeronave">
                      <option>Avião</option>
                      <option>Helicóptero</option>
                      <option>Planador</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Aerodromes and Times */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aeródromo Origem *</label>
                    <input type="text" required value={formData.departure_aerodrome} onChange={(e) => handleInputChange('departure_aerodrome', e.target.value)} placeholder="SBMT" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" title="Aerodromo origem" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hora Partida (HH:MM)</label>
                    <input type="time" value={formData.departure_time} onChange={(e) => handleInputChange('departure_time', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Hora partida" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aeródromo Destino *</label>
                    <input type="text" required value={formData.arrival_aerodrome} onChange={(e) => handleInputChange('arrival_aerodrome', e.target.value)} placeholder="SBJD" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" title="Aerodromo destino" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hora Chegada (HH:MM)</label>
                    <input type="time" value={formData.arrival_time} onChange={(e) => handleInputChange('arrival_time', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Hora chegada" />
                  </div>
                </div>

                {/* Row 3: Flight Times Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempos de Voo (HH:MM)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Diurno</label>
                      <input type="text" pattern="\d{2}:\d{2}" value={formData.time_diurno} onChange={(e) => handleTimeMask('time_diurno', e.target.value)} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" title="Tempo diurno" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Noturno</label>
                      <input type="text" pattern="\d{2}:\d{2}" value={formData.time_noturno} onChange={(e) => handleTimeMask('time_noturno', e.target.value)} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" title="Tempo noturno" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFR Real</label>
                      <input type="text" pattern="\d{2}:\d{2}" value={formData.time_ifr_real} onChange={(e) => handleTimeMask('time_ifr_real', e.target.value)} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" title="Tempo IFR real" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Sob Capota</label>
                      <input type="text" pattern="\d{2}:\d{2}" value={formData.time_under_hood} onChange={(e) => handleTimeMask('time_under_hood', e.target.value)} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" title="Tempo sob capota" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Simulador</label>
                      <input type="text" pattern="\d{2}:\d{2}" value={formData.time_simulator} onChange={(e) => handleTimeMask('time_simulator', e.target.value)} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" title="Tempo simulador" />
                    </div>
                  </div>
                </div>

                {/* Row 4: Landings, Function, Rating */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pousos Dia</label>
                    <input type="number" min="0" value={formData.day_landings} onChange={(e) => handleInputChange('day_landings', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Pousos dia" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pousos Noite</label>
                    <input type="number" min="0" value={formData.night_landings} onChange={(e) => handleInputChange('night_landings', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Pousos noite" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Função *</label>
                    <select value={formData.function} onChange={(e) => handleInputChange('function', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Funcao">
                      <option value="PIC">Piloto em Comando (PIC)</option>
                      <option value="SIC">Copiloto (SIC)</option>
                      <option value="STUDENT">Piloto em Instrução</option>
                      <option value="INSTRUCTOR">Instrutor em Voo</option>
                      <option value="DUAL">Instrução Recebida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Habilitação *</label>
                    <select value={formData.rating} onChange={(e) => handleInputChange('rating', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Habilitacao">
                      <option value="VFR">VFR</option>
                      <option value="IFRA">IFRA (Avião)</option>
                      <option value="MLTE">MLTE</option>
                      <option value="MNTE">MNTE</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Milhas Navegação</label>
                    <input type="number" min="0" value={formData.nav_miles} onChange={(e) => handleInputChange('nav_miles', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Milhas navegacao" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Número CANAC</label>
                    <input type="text" value={formData.pilot_canac_number} onChange={(e) => handleInputChange('pilot_canac_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Numero CANAC" />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
                  <textarea value={formData.remarks} onChange={(e) => handleInputChange('remarks', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Manobras realizadas, aproximações IFR, etc." title="Observacoes" />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total Geral</div>
              <div className="text-3xl font-bold text-gray-900">{totals.totalHours.toFixed(1)}h</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">PIC</div>
              <div className="text-3xl font-bold text-blue-600">{totals.picHours.toFixed(1)}h</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Instrução</div>
              <div className="text-3xl font-bold text-yellow-600">{totals.instructionHours.toFixed(1)}h</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">IFR Real</div>
              <div className="text-3xl font-bold text-purple-600">{totals.ifrHours.toFixed(1)}h</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total Pousos</div>
              <div className="text-3xl font-bold text-green-600">{totals.totalLandings}</div>
            </div>
          </div>

          {/* Flight Logs Table - ANAC Format */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Lançamento de Horas - CIV Digital</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Matrícula</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Modelo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Origem</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Destino</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Diurno</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Noturno</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">IFR Real</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Pousos</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Função</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Habilitação</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {flights.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">{log.date}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-mono">{log.aircraft_registration}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">{log.aircraft_model}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-mono">{log.departure_aerodrome}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-mono">{log.arrival_aerodrome}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-900 font-mono">{normalizeTime(log.time_diurno)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-900 font-mono">{normalizeTime(log.time_noturno)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-900 font-mono">{normalizeTime(log.time_ifr_real)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-900 font-semibold">{log.day_landings + log.night_landings}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                          {log.function}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                          {log.rating}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                          title="Excluir voo"
                        >
                          🗑️ Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota importante:</strong> Os tempos devem ser lançados em formato HH:MM (hora e minuto), não em decimais. Conforme regulamentação ANAC.
            </p>
          </div>

          {/* Deleted Logs Section */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Voos Excluídos</h2>
                <p className="text-sm text-gray-600 mt-1">Histórico de voos excluídos para auditoria</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  if (!showDeleted && deletedFlights.length === 0) {
                    fetchDeletedLogs();
                  }
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                {showDeleted ? '🔼 Ocultar' : '🔽 Mostrar'} ({deletedFlights.length})
              </button>
            </div>
            
            {showDeleted && (
              <div className="p-6">
                {deletedFlights.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum voo excluído</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50 border-b border-red-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Data</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Matrícula</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Modelo</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Rota</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600">Tempo Total</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Excluído em</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {deletedFlights.map((log) => (
                          <tr key={log.id} className="hover:bg-red-50 transition-colors opacity-75">
                            <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">{log.date}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-mono">{log.aircraft_registration}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-600">{log.aircraft_model}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-mono">
                              {log.departure_aerodrome} → {log.arrival_aerodrome}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-gray-900 font-mono">
                              {normalizeTime(log.time_diurno)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-600" suppressHydrationWarning>
                              {new Date(log.deleted_at).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <LogbookImport 
          onClose={() => setShowImport(false)}
          onImportComplete={() => {
            fetchFlightLogs();
          }}
          token={token}
        />
      )}
    </div>
  );
}

