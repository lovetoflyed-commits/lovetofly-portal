'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function FlightPlanPage() {
  const [flightData, setFlightData] = useState({
    departure: 'SBSP',
    arrival: 'SBRF',
    aircraft: 'B737',
    cruise_altitude: '35000',
    route: 'SBSP TECON TEROM UBIRE SBRF',
  });

  const [calculations, setCalculations] = useState({
    distance: 0,
    flightTime: 0,
    fuelRequired: 0,
    headwind: 0
  });

  const calculateFlightPlan = () => {
    // Mock calculations
    const distance = Math.floor(Math.random() * 2000) + 1000;
    const flightTime = (distance / 450).toFixed(2);
    const fuelRequired = (distance * 4.5).toFixed(0);
    const headwind = Math.floor(Math.random() * 40) - 20;

    setCalculations({
      distance,
      flightTime: parseFloat(flightTime as string),
      fuelRequired: parseInt(fuelRequired as string),
      headwind
    });
  };

  const savedFlightPlans = [
    {
      id: 1,
      name: 'SBSP → SBRF (Recife)',
      departure: 'SBSP',
      arrival: 'SBRF',
      distance: 2047,
      flightTime: 4.5,
      fuelRequired: 9211,
      createdAt: '2025-12-20'
    },
    {
      id: 2,
      name: 'SBSP → SBBR (Brasília)',
      departure: 'SBSP',
      arrival: 'SBBR',
      distance: 1001,
      flightTime: 2.2,
      fuelRequired: 4505,
      createdAt: '2025-12-19'
    },
    {
      id: 3,
      name: 'SBSP → SBGP (Porto Alegre)',
      departure: 'SBSP',
      arrival: 'SBGP',
      distance: 1100,
      flightTime: 2.4,
      fuelRequired: 4950,
      createdAt: '2025-12-18'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Sidebar onFeatureClick={() => {}} disabled={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">✈️ Planejamento de Voo</h1>
            <p className="text-lg text-slate-600">Planeje rotas, calcule combustível e tempo de voo</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold">
            ← Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Plan Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📋 Novo Plano de Voo</h2>

              <div className="space-y-4">
                {/* Route Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Aeródromo de Saída</label>
                    <input
                      type="text"
                      value={flightData.departure}
                      onChange={(e) => setFlightData({ ...flightData, departure: e.target.value.toUpperCase() })}
                      placeholder="Ex: SBSP"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Aeródromo de Destino</label>
                    <input
                      type="text"
                      value={flightData.arrival}
                      onChange={(e) => setFlightData({ ...flightData, arrival: e.target.value.toUpperCase() })}
                      placeholder="Ex: SBRF"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Aircraft */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Aeronave</label>
                  <select
                    value={flightData.aircraft}
                    onChange={(e) => setFlightData({ ...flightData, aircraft: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="B737">Boeing 737</option>
                    <option value="A320">Airbus A320</option>
                    <option value="B777">Boeing 777</option>
                    <option value="C208">Cessna 208</option>
                    <option value="PC12">Pilatus PC-12</option>
                  </select>
                </div>

                {/* Route */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Rota (Navegação Aérea)</label>
                  <textarea
                    value={flightData.route}
                    onChange={(e) => setFlightData({ ...flightData, route: e.target.value.toUpperCase() })}
                    placeholder="Ex: SBSP TECON TEROM UBIRE SBRF"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono h-20"
                  ></textarea>
                  <p className="text-xs text-slate-600 mt-1">Use os nomes de radiofarol ou pontos de navegação aérea</p>
                </div>

                {/* Cruise Altitude */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Altitude de Cruzeiro (pés)</label>
                  <input
                    type="number"
                    value={flightData.cruise_altitude}
                    onChange={(e) => setFlightData({ ...flightData, cruise_altitude: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={calculateFlightPlan}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition text-lg"
                >
                  🧮 Calcular Plano de Voo
                </button>
              </div>
            </div>

            {/* Results */}
            {calculations.distance > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 mt-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">📊 Resultados do Cálculo</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-bold mb-1">DISTÂNCIA</p>
                    <p className="text-3xl font-black text-blue-900">{calculations.distance} NM</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-bold mb-1">TEMPO DE VOO</p>
                    <p className="text-3xl font-black text-green-900">{calculations.flightTime}h</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-xs text-orange-600 font-bold mb-1">COMBUSTÍVEL NECESSÁRIO</p>
                    <p className="text-3xl font-black text-orange-900">{calculations.fuelRequired} L</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-xs text-purple-600 font-bold mb-1">VENTO NA PROA</p>
                    <p className="text-3xl font-black text-purple-900">{calculations.headwind} kt</p>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold transition">
                  💾 Salvar Plano de Voo
                </button>
              </div>
            )}
          </div>

          {/* Saved Flight Plans Sidebar */}
          <div>
            <div className="bg-white border border-slate-200 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">📁 Planos Salvos</h2>

              <div className="space-y-3">
                {savedFlightPlans.map((plan) => (
                  <div key={plan.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 cursor-pointer transition">
                    <p className="font-bold text-slate-900 text-sm mb-1">{plan.name}</p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>📏 {plan.distance} NM</p>
                      <p>⏱️ {plan.flightTime}h</p>
                      <p>⛽ {plan.fuelRequired} L</p>
                      <p className="text-slate-500 pt-2 border-t border-slate-200">{plan.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm transition">
                ➕ Novo Plano
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-900 mb-3">💡 Dicas para Planejamento:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800 text-sm">
            <li>✈️ Sempre planeje com 10% de combustível extra</li>
            <li>🗺️ Considere ventos em altitude ao calcular tempo</li>
            <li>🛫 Verifique NOTAMs e condições meteorológicas</li>
            <li>📡 Use radiofarol ou waypoints da rota RNAV</li>
            <li>⛽ Calcule combustível alternativa e de reserva</li>
            <li>🛬 Sempre tenha aeródromo de alternativa planejado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
