'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { useLanguage } from '@/context/LanguageContext';

export default function WeatherPage() {
  const { t } = useLanguage();
  const [icao, setIcao] = useState('');
  const [loading, setLoading] = useState(false);
  const [metar, setMetar] = useState<string | null>(null);
  const [taf, setTaf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lista mínima de aeroportos com coordenadas para localizar o ICAO mais próximo
  const airports = [
    { icao: 'SBSP', name: 'São Paulo/Congonhas', lat: -23.626, lon: -46.654 },
    { icao: 'SBGR', name: 'São Paulo/Guarulhos', lat: -23.435, lon: -46.473 },
    { icao: 'SBRJ', name: 'Rio de Janeiro/Santos Dumont', lat: -22.910, lon: -43.163 },
    { icao: 'SBGL', name: 'Rio de Janeiro/Galeão', lat: -22.809, lon: -43.250 },
    { icao: 'SBCF', name: 'Belo Horizonte/Confins', lat: -19.635, lon: -43.968 },
    { icao: 'SBBR', name: 'Brasília', lat: -15.871, lon: -47.918 },
    { icao: 'SBCT', name: 'Curitiba/Afonso Pena', lat: -25.530, lon: -49.176 },
    { icao: 'SBFZ', name: 'Fortaleza', lat: -3.776, lon: -38.532 },
    { icao: 'SBSV', name: 'Salvador', lat: -12.908, lon: -38.322 },
    { icao: 'SBBE', name: 'Belém/Val-de-Cans', lat: -1.384, lon: -48.476 },
    { icao: 'SBEG', name: 'Manaus/Eduardo Gomes', lat: -3.039, lon: -60.049 },
    { icao: 'SBRF', name: 'Recife/Guararapes', lat: -8.126, lon: -34.923 },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t('weatherPage.geoNotSupported'));
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = airports[0];
        let minDist = haversineKm(latitude, longitude, nearest.lat, nearest.lon);
        for (const ap of airports) {
          const d = haversineKm(latitude, longitude, ap.lat, ap.lon);
          if (d < minDist) {
            minDist = d;
            nearest = ap;
          }
        }
        setIcao(nearest.icao);
        setTimeout(() => fetchWeather(), 50);
      },
      () => {
        setError(t('weatherPage.geoUnavailable'));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const fetchWeather = async () => {
    const normalized = icao.trim().toUpperCase();
    if (!normalized || normalized.length !== 4 || !/^[A-Z]{4}$/.test(normalized)) {
      setError(t('weatherPage.invalidIcao'));
      return;
    }

    setLoading(true);
    setError(null);
    setMetar(null);
    setTaf(null);

    try {
      const response = await fetch(`/api/weather/metar?icao=${normalized}`);
      const data = await response.json();

      if (response.ok) {
        const metarText = data.metar ?? data.raw ?? null;
        setMetar(metarText || t('weatherPage.metarUnavailable'));
        setTaf(data.taf || t('weatherPage.tafUnavailable'));
      } else {
        setError(data.message || data.error || t('weatherPage.fetchError'));
      }
    } catch (err) {
      setError(t('weatherPage.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">☁️ {t('weatherPage.title')}</h1>
            <p className="text-gray-600">{t('weatherPage.subtitle')}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">←</span>
                {t('weatherPage.backDashboard')}
              </Link>
              <button
                type="button"
                onClick={useMyLocation}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <span>📍</span>
                {t('weatherPage.useMyLocation')}
              </button>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="icao" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('weatherPage.icaoLabel')}
                </label>
                <input
                  id="icao"
                  type="text"
                  value={icao}
                  onChange={(e) => setIcao(e.target.value.toUpperCase())}
                  placeholder={t('weatherPage.icaoPlaceholder')}
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono uppercase"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors whitespace-nowrap"
                >
                  {loading ? t('weatherPage.searching') : t('weatherPage.search')}
                </button>
              </div>
            </form>

            {/* Quick Access Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">{t('weatherPage.quickAccess')}</span>
              {['SBSP', 'SBBR', 'SBGR', 'SBGL', 'SBCF', 'SBRJ'].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setIcao(code.trim());
                    setTimeout(() => fetchWeather(), 100);
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-mono"
                >
                  {code}
                </button>
              ))}
              <button
                onClick={useMyLocation}
                className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
              >
                📍 {t('weatherPage.location')}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">❌ {error}</p>
            </div>
          )}

          {/* METAR Display */}
          {metar && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🌤️</span>
                METAR - {(icao || '').trim().toUpperCase()}
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
                  {metar}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('weatherPage.metarReport')}
              </p>
            </div>
          )}

          {/* TAF Display */}
          {taf && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                TAF - {(icao || '').trim().toUpperCase()}
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
                  {taf}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('weatherPage.tafReport')}
              </p>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">{t('weatherPage.infoTitle')}</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>METAR:</strong> {t('weatherPage.infoMetar')}</li>
              <li>• <strong>TAF:</strong> {t('weatherPage.infoTaf')}</li>
              <li>• {t('weatherPage.infoSource')}</li>
              <li>• {t('weatherPage.infoUpdated')}</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
