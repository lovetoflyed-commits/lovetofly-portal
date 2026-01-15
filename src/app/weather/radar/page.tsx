'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Image from 'next/image';

export default function RadarPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('brasil');
  const [radarLayer, setRadarLayer] = useState<string>('satellite');
  const [radarSource, setRadarSource] = useState<string>('inpe'); // 'inpe' or 'openweather'
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const regions = [
    { id: 'brasil', name: 'Brasil', center: [-15.7801, -47.9292], zoom: 4 },
    { id: 'sudeste', name: 'Sudeste', center: [-23.5505, -46.6333], zoom: 6 },
    { id: 'sul', name: 'Sul', center: [-29.6833, -51.1833], zoom: 6 },
    { id: 'nordeste', name: 'Nordeste', center: [-12.9714, -38.5014], zoom: 6 },
    { id: 'norte', name: 'Norte', center: [-3.1190, -60.0217], zoom: 6 },
    { id: 'centro-oeste', name: 'Centro-Oeste', center: [-15.8267, -47.9218], zoom: 6 },
  ];

  const layers = [
    { id: 'satellite', name: 'Satélite', icon: '🛰️' },
    { id: 'precipitation', name: 'Precipitação', icon: '🌧️' },
    { id: 'clouds', name: 'Nuvens', icon: '☁️' },
    { id: 'temperature', name: 'Temperatura', icon: '🌡️' },
  ];

  const sources = [
    { id: 'inpe', name: 'NOAA GOES-16', flag: '🇧🇷', description: 'Satélite América do Sul' },
    { id: 'openweather', name: 'OpenWeatherMap', flag: '🌍', description: 'Fonte Internacional' },
  ];

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdate(new Date());
    setTimeout(() => setLoading(false), 1000);
  };

  const currentRegion = regions.find((r) => r.id === selectedRegion)!;
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

          {/* Source Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Fonte de Dados</h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setRadarSource(source.id)}
                  className={`px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-3 ${
                    radarSource === source.id
                      ? 'bg-green-600 text-white shadow-md ring-2 ring-green-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl">{source.flag}</span>
                  <div className="text-left">
                    <div className="font-bold">{source.name}</div>
                    <div className="text-xs opacity-80">{source.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Visualização</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {layers.map((layer) => {
                // INPE only supports satellite layer
                const isDisabled = radarSource === 'inpe' && layer.id !== 'satellite';
                return (
                  <button
                    key={layer.id}
                    onClick={() => !isDisabled && setRadarLayer(layer.id)}
                    disabled={isDisabled}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      radarLayer === layer.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{layer.icon}</span>
                    <span>{layer.name}</span>
                  </button>
                );
              })}
            </div>
            {radarSource === 'inpe' && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded flex items-start gap-2">
                <span>ℹ️</span>
                <span>NOAA GOES-16 fornece apenas imagens de satélite. Para outras camadas, selecione a fonte internacional.</span>
              </div>
            )}
          </div>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {layers.find((l) => l.id === radarLayer)?.icon} {currentRegion.name} - {layers.find((l) => l.id === radarLayer)?.name}
              </h2>
              <div className="text-sm text-gray-500">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </div>
            </div>

            {/* Radar Image Display */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg border-2 border-gray-300 overflow-hidden" style={{ height: '600px' }}>
              {radarSource === 'inpe' ? (
                // INPE GOES-16 Satellite Image (Brazilian Source)
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  {imageError ? (
                    <div className="text-center space-y-4">
                      <div className="text-6xl">🛰️</div>
                      <div className="text-white space-y-2">
                        <p className="text-xl font-bold">Imagem de satélite temporariamente indisponível</p>
                        <p className="text-sm text-gray-300">O servidor INPE/CPTEC pode estar em manutenção ou atualização.</p>
                      </div>
                      <button
                        onClick={() => {
                          setImageError(false);
                          setLastUpdate(new Date());
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🔄 Tentar Novamente
                      </button>
                      <div className="pt-4 border-t border-gray-600">
                        <p className="text-sm text-gray-400 mb-3">Ou use a fonte internacional:</p>
                        <button
                          onClick={() => setRadarSource('openweather')}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          🌍 Trocar para OpenWeatherMap
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={`https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/13/GOES16-SSA-13-600x600.gif?${lastUpdate.getTime()}`}
                        alt="Satélite GOES-16"
                        className="max-w-full max-h-full object-contain"
                        onError={() => setImageError(true)}
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
                        <span>🇧🇷</span>
                        <span>Fonte: NOAA GOES-16 - América do Sul</span>
                      </div>
                      <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
                        <span>✓</span>
                        <span>Atualização automática a cada 15 min</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // OpenWeatherMap (International Source)
                <div className="absolute inset-0">
                  <iframe
                    src={`https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${radarLayer === 'satellite' ? 'satellite' : radarLayer === 'precipitation' ? 'precipitation' : radarLayer === 'clouds' ? 'clouds' : 'temp'}&lat=${currentRegion.center[0]}&lon=${currentRegion.center[1]}&zoom=${currentRegion.zoom}`}
                    className="w-full h-full border-0"
                    title={`Mapa Meteorológico - ${layers.find((l) => l.id === radarLayer)?.name}`}
                  />
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
                    <span>🌍</span>
                    <span>Fonte: OpenWeatherMap</span>
                  </div>
                </div>
              )}
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
                <li>• 🇧🇷 NOAA GOES-16: Satélite geoestacionário sobre América do Sul</li>
                <li>• 🌍 OpenWeatherMap: Dados globais com múltiplas camadas</li>
                <li>• Atualização automática a cada 15 minutos</li>
                <li>• Cobertura de todo território nacional e internacional</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
