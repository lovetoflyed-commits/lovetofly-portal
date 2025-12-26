'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AirportData {
  icao_code: string;
  airport_name: string;
  city: string;
  state: string;
  country: string;
}

export default function HangarListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [icaoError, setIcaoError] = useState('');
  const [airportData, setAirportData] = useState<AirportData | null>(null);

  const [formData, setFormData] = useState({
    // Hangar Info
    icaoCode: '',
    hangarNumber: '',
    hangarLocationDescription: '',
    hangarSizeSqm: '',
    maxWingspanMeters: '',
    maxLengthMeters: '',
    maxHeightMeters: '',
    
    // Pricing
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    
    // Availability
    availableFrom: '',
    availableUntil: '',
    
    // Additional Info
    description: '',
    specialNotes: '',
    acceptsOnlinePayment: true,
    acceptsPaymentOnArrival: true,
    acceptsPaymentOnDeparture: false,
    cancellationPolicy: 'flexible',
  });

  const handleIcaoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setFormData({ ...formData, icaoCode: code });
    setIcaoError('');
    setAirportData(null);

    if (code.length === 4) {
      try {
        const res = await fetch(`/api/hangarshare/airport/search?icao=${code}`);
        if (res.ok) {
          const data = await res.json();
          setAirportData(data);
        } else {
          setIcaoError('Aeródromo não encontrado');
        }
      } catch (error) {
        console.error('Error:', error);
        setIcaoError('Erro ao buscar aeródromo');
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && !airportData) {
      setIcaoError('Por favor, insira um ICAO válido');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // TODO: Implement API call to create listing
      alert('Hangar anunciado com sucesso!');
      router.push('/hangarshare/owner/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao anunciar hangar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Login necessário</h2>
          <p className="text-slate-600 mb-6">
            Você precisa estar logado para anunciar um hangar.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-black text-blue-900">Anunciar Hangar</h1>
          <p className="text-slate-600 mt-2">
            Preencha os dados do seu hangar para começar a receber reservas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              1. Localização
            </span>
            <span className={`text-sm font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              2. Características
            </span>
            <span className={`text-sm font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              3. Preços & Disponibilidade
            </span>
            <span className={`text-sm font-bold ${step >= 4 ? 'text-blue-600' : 'text-slate-400'}`}>
              4. Confirmação
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Localização do Hangar</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código ICAO do Aeródromo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SBSP, SBCF, SBRJ..."
                    maxLength={4}
                    value={formData.icaoCode}
                    onChange={handleIcaoChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-lg"
                  />
                  {icaoError && (
                    <p className="text-red-600 text-sm mt-2">⚠️ {icaoError}</p>
                  )}
                </div>

                {airportData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-bold text-green-900 mb-4">✓ Aeródromo Encontrado</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-semibold">Nome</p>
                        <p className="text-slate-900">{airportData.airport_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">ICAO</p>
                        <p className="text-slate-900 font-mono">{airportData.icao_code}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">Localização</p>
                        <p className="text-slate-900">{airportData.city}, {airportData.state}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">País</p>
                        <p className="text-slate-900">{airportData.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">ℹ️ Informações do Anunciante</h3>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Nome:</strong> {user?.name || 'Não informado'}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>ID de Usuário:</strong> {user?.id}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 italic">
                    Estes dados são obtidos do seu perfil registrado. Para alterá-los, acesse suas configurações.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!airportData}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Características do Hangar</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Número do Hangar
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5, A-12, Galpão 3"
                      value={formData.hangarNumber}
                      onChange={(e) => setFormData({ ...formData, hangarNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Tamanho da Área (m²) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="500"
                      value={formData.hangarSizeSqm}
                      onChange={(e) => setFormData({ ...formData, hangarSizeSqm: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Localização dentro do Aeródromo
                  </label>
                  <textarea
                    placeholder="Ex: Próximo à pista 03, setor norte, fácil acesso"
                    value={formData.hangarLocationDescription}
                    onChange={(e) => setFormData({ ...formData, hangarLocationDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Dimensões Máximas Aceitas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Envergadura (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="15.0"
                        value={formData.maxWingspanMeters}
                        onChange={(e) => setFormData({ ...formData, maxWingspanMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Comprimento (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="12.0"
                        value={formData.maxLengthMeters}
                        onChange={(e) => setFormData({ ...formData, maxLengthMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Altura (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={formData.maxHeightMeters}
                        onChange={(e) => setFormData({ ...formData, maxHeightMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.hangarSizeSqm}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Preços e Disponibilidade</h2>
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-4">Tabela de Preços *</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Preencha pelo menos uma opção de preço (por hora, dia, semana ou mês)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Hora
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Dia
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Semana
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Mês
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.monthlyRate}
                        onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-4">Disponibilidade *</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Disponível desde
                      </label>
                      <input
                        type="date"
                        value={formData.availableFrom}
                        onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Disponível até
                      </label>
                      <input
                        type="date"
                        value={formData.availableUntil}
                        onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-3">Formas de Pagamento</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsOnlinePayment}
                        onChange={(e) => setFormData({ ...formData, acceptsOnlinePayment: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento online (cartão/Pix)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsPaymentOnArrival}
                        onChange={(e) => setFormData({ ...formData, acceptsPaymentOnArrival: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento na chegada</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsPaymentOnDeparture}
                        onChange={(e) => setFormData({ ...formData, acceptsPaymentOnDeparture: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento na saída</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.availableFrom || (!formData.hourlyRate && !formData.dailyRate && !formData.weeklyRate && !formData.monthlyRate)}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Confirmação e Publicação</h2>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-slate-900 mb-4">Resumo do Anúncio</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">Aeródromo:</span>
                    <span>{airportData?.airport_name} ({formData.icaoCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Localização:</span>
                    <span>{airportData?.city}/{airportData?.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Tamanho:</span>
                    <span>{formData.hangarSizeSqm} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Preços:</span>
                    <span>
                      {[formData.hourlyRate && 'Hora', formData.dailyRate && 'Dia', formData.weeklyRate && 'Semana', formData.monthlyRate && 'Mês']
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Disponível:</span>
                    <span>{formData.availableFrom} até {formData.availableUntil || 'sem prazo'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">✓ Informações do Anunciante</h3>
                <div className="text-sm text-slate-700 space-y-2">
                  <p><strong>Nome:</strong> {user?.name || 'Não informado'}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>ID de Usuário:</strong> {user?.id}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✓ Seu anúncio será publicado imediatamente e ficará visível para pilotos e operadores em todo o Brasil.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg"
                >
                  {loading ? 'Publicando...' : '✓ Publicar Anúncio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
