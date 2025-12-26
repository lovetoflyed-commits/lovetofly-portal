'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: number;
    hangarNumber: string;
    icaoCode: string;
    city: string;
    state: string;
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
    hourlyRate?: number;
    acceptsOnlinePayment: boolean;
    acceptsPaymentOnArrival: boolean;
    acceptsPaymentOnDeparture: boolean;
  };
}

export default function BookingModal({ isOpen, onClose, listing }: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [bookingData, setBookingData] = useState({
    // Aircraft Details
    aircraftRegistration: '',
    aircraftType: '',
    aircraftCategory: 'single-engine',
    aircraftWingspan: '',
    aircraftLength: '',
    
    // Pilot Details
    pilotName: '',
    pilotLicense: '',
    pilotPhone: '',
    
    // Booking Dates
    checkInDate: '',
    checkInTime: '09:00',
    checkOutDate: '',
    checkOutTime: '17:00',
    
    // Payment
    paymentMethod: listing.acceptsOnlinePayment ? 'online' : 'arrival',
    
    // Special Requests
    specialRequests: '',
  });

  const [pricing, setPricing] = useState({
    days: 0,
    ratePerPeriod: 0,
    periodType: 'daily',
    subtotal: 0,
    platformFee: 0,
    paymentFee: 0,
    total: 0,
  });

  useEffect(() => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      calculatePricing();
    }
  }, [bookingData.checkInDate, bookingData.checkOutDate]);

  const calculatePricing = () => {
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let ratePerPeriod = 0;
    let periodType = 'daily';

    // Choose best rate
    if (diffDays >= 30 && listing.monthlyRate) {
      ratePerPeriod = listing.monthlyRate;
      periodType = 'monthly';
    } else if (diffDays >= 7 && listing.weeklyRate) {
      ratePerPeriod = listing.weeklyRate;
      periodType = 'weekly';
    } else if (listing.dailyRate) {
      ratePerPeriod = listing.dailyRate;
      periodType = 'daily';
    } else if (listing.hourlyRate) {
      ratePerPeriod = listing.hourlyRate * 24; // Convert to daily
      periodType = 'hourly';
    }

    const subtotal = ratePerPeriod * (periodType === 'monthly' ? Math.ceil(diffDays / 30) : 
                                       periodType === 'weekly' ? Math.ceil(diffDays / 7) : 
                                       diffDays);
    const platformFee = subtotal * 0.10; // 10% commission
    const paymentFee = bookingData.paymentMethod === 'online' ? (subtotal * 0.0499 + 0.40) : 0;
    const total = subtotal + platformFee + paymentFee;

    setPricing({
      days: diffDays,
      ratePerPeriod,
      periodType,
      subtotal,
      platformFee,
      paymentFee,
      total,
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Você precisa estar logado para fazer uma reserva.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/hangarshare/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          ...bookingData,
          pricing,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (bookingData.paymentMethod === 'online') {
          // Redirect to payment gateway
          window.location.href = data.paymentUrl;
        } else {
          alert('Reserva criada com sucesso! Aguarde confirmação do proprietário.');
          onClose();
        }
      } else {
        const error = await response.json();
        alert(`Erro: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao criar reserva. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Reservar Hangar</h2>
            <p className="text-sm text-blue-200">
              {listing.hangarNumber} - {listing.icaoCode} ({listing.city}/{listing.state})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-slate-50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              1. Aeronave
            </span>
            <span className={`font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              2. Datas
            </span>
            <span className={`font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              3. Confirmação
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Dados da Aeronave e Piloto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Matrícula da Aeronave *
                  </label>
                  <input
                    type="text"
                    placeholder="PP-ABC"
                    value={bookingData.aircraftRegistration}
                    onChange={(e) => setBookingData({ ...bookingData, aircraftRegistration: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo/Modelo *
                  </label>
                  <input
                    type="text"
                    placeholder="Cessna 172, Cirrus SR22..."
                    value={bookingData.aircraftType}
                    onChange={(e) => setBookingData({ ...bookingData, aircraftType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={bookingData.aircraftCategory}
                  onChange={(e) => setBookingData({ ...bookingData, aircraftCategory: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="single-engine">Monomotor</option>
                  <option value="multi-engine">Multimotor</option>
                  <option value="jet">Jato</option>
                  <option value="turboprop">Turbo-hélice</option>
                  <option value="helicopter">Helicóptero</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Envergadura (metros)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="10.5"
                    value={bookingData.aircraftWingspan}
                    onChange={(e) => setBookingData({ ...bookingData, aircraftWingspan: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Comprimento (metros)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    value={bookingData.aircraftLength}
                    onChange={(e) => setBookingData({ ...bookingData, aircraftLength: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nome do Piloto em Comando *
                </label>
                <input
                  type="text"
                  value={bookingData.pilotName}
                  onChange={(e) => setBookingData({ ...bookingData, pilotName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Número da Licença (CHT/CHT)
                  </label>
                  <input
                    type="text"
                    placeholder="CHT 123456"
                    value={bookingData.pilotLicense}
                    onChange={(e) => setBookingData({ ...bookingData, pilotLicense: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Telefone de Contato *
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={bookingData.pilotPhone}
                    onChange={(e) => setBookingData({ ...bookingData, pilotPhone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!bookingData.aircraftRegistration || !bookingData.aircraftType || !bookingData.pilotName || !bookingData.pilotPhone}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Datas e Horários</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Data de Entrada *
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkInDate}
                    onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Horário de Entrada
                  </label>
                  <input
                    type="time"
                    value={bookingData.checkInTime}
                    onChange={(e) => setBookingData({ ...bookingData, checkInTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Data de Saída *
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkOutDate}
                    onChange={(e) => setBookingData({ ...bookingData, checkOutDate: e.target.value })}
                    min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Horário de Saída
                  </label>
                  <input
                    type="time"
                    value={bookingData.checkOutTime}
                    onChange={(e) => setBookingData({ ...bookingData, checkOutTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {pricing.days > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-bold text-blue-900 mb-2">Resumo da Reserva</h4>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p>• Período: {pricing.days} dia{pricing.days > 1 ? 's' : ''}</p>
                    <p>• Tipo de tarifa: {pricing.periodType === 'daily' ? 'Diária' : 
                                          pricing.periodType === 'weekly' ? 'Semanal' : 'Mensal'}</p>
                    <p>• Valor: R$ {pricing.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Solicitações Especiais (opcional)
                </label>
                <textarea
                  placeholder="Necessidade de energia externa, água, limpeza, etc."
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!bookingData.checkInDate || !bookingData.checkOutDate || pricing.days === 0}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Confirmação e Pagamento</h3>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3">Resumo da Reserva</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Aeronave:</span>
                    <span className="font-bold">{bookingData.aircraftRegistration} ({bookingData.aircraftType})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Período:</span>
                    <span className="font-bold">
                      {bookingData.checkInDate} às {bookingData.checkInTime} → {bookingData.checkOutDate} às {bookingData.checkOutTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de dias:</span>
                    <span className="font-bold">{pricing.days}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3">Detalhamento de Valores</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({pricing.periodType === 'daily' ? 'diária' : pricing.periodType === 'weekly' ? 'semanal' : 'mensal'}):</span>
                    <span>R$ {pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa da plataforma (10%):</span>
                    <span>R$ {pricing.platformFee.toFixed(2)}</span>
                  </div>
                  {bookingData.paymentMethod === 'online' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Taxa de processamento:</span>
                      <span>R$ {pricing.paymentFee.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold text-blue-900">
                    <span>TOTAL:</span>
                    <span>R$ {pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="space-y-2">
                  {listing.acceptsOnlinePayment && (
                    <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={bookingData.paymentMethod === 'online'}
                        onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                      />
                      <div>
                        <p className="font-bold">💳 Pagamento Online (recomendado)</p>
                        <p className="text-xs text-slate-600">Confirmação instantânea via cartão de crédito</p>
                      </div>
                    </label>
                  )}
                  {listing.acceptsPaymentOnArrival && (
                    <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payment"
                        value="arrival"
                        checked={bookingData.paymentMethod === 'arrival'}
                        onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                      />
                      <div>
                        <p className="font-bold">✈️ Pagamento na Chegada</p>
                        <p className="text-xs text-slate-600">Pague diretamente ao proprietário na chegada</p>
                      </div>
                    </label>
                  )}
                  {listing.acceptsPaymentOnDeparture && (
                    <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payment"
                        value="departure"
                        checked={bookingData.paymentMethod === 'departure'}
                        onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                      />
                      <div>
                        <p className="font-bold">🛫 Pagamento na Saída</p>
                        <p className="text-xs text-slate-600">Pague diretamente ao proprietário na saída</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg"
                >
                  {loading ? 'Processando...' : bookingData.paymentMethod === 'online' ? '✓ Pagar e Reservar' : '✓ Confirmar Reserva'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
