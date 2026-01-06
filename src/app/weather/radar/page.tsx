'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

export default function RadarPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('brasil');

  const regions = [
    { id: 'brasil', name: 'Brasil', center: [-15.7801, -47.9292] },
    { id: 'sudeste', name: 'Sudeste', center: [-23.5505, -46.6333] },
    { id: 'sul', name: 'Sul', center: [-29.6833, -51.1833] },
    { id: 'nordeste', name: 'Nordeste', center: [-12.9714, -38.5014] },
    { id: 'norte', name: 'Norte', center: [-3.1190, -60.0217] },
    { id: 'centro-oeste', name: 'Centro-Oeste', center: [-15.8267, -47.9218] },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">🌦️ Radar Meteorológico</h1>
            <p className="text-gray-600">Visualize condições meteorológicas em tempo real</p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">←</span>
                Voltar ao Dashboard
              </Link>
            </div>
          </div>

          {/* Region Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecione a Região</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region.id)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedRegion === region.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          {/* Radar Display */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Radar - {regions.find((r) => r.id === selectedRegion)?.name}
            </h2>
            
            {/* Placeholder for radar integration */}
            <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-gray-300 overflow-hidden" style={{ height: '600px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8 bg-white/90 rounded-lg shadow-lg max-w-md">
                  <div className="text-6xl mb-4">🛰️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Integração REDEMET em Desenvolvimento
                  </h3>
                  <p className="text-gray-600 mb-4">
                    A visualização do radar meteorológico será integrada com dados oficiais da REDEMET (DECEA/FAB).
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Imagens de satélite em tempo real</p>
                    <p>• Radar meteorológico nacional</p>
                    <p>• Animação de movimento de nuvens</p>
                    <p>• Alertas meteorológicos SIGMET/AIRMET</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-700">Céu limpo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-700">Nuvens esparsas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-gray-700">Chuva moderada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-700">Chuva forte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-700">Tempestade</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🔗 Links Úteis</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://redemet.decea.mil.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    REDEMET - Portal Oficial
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.cptec.inpe.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    CPTEC/INPE - Previsão Meteorológica
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.inmet.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    INMET - Instituto Nacional de Meteorologia
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ Sobre o Radar</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Dados em tempo real da REDEMET</li>
                <li>• Cobertura de todo território nacional</li>
                <li>• Atualização automática a cada 15 minutos</li>
                <li>• Integração com alertas SIGMET/AIRMET</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
