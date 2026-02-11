'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HangarSharePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchICAO, setSearchICAO] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchICAO) params.append('icao', searchICAO);
    if (searchCity) params.append('city', searchCity);
    if (minPrice > 0) params.append('minPrice', minPrice.toString());
    if (maxPrice < 20000) params.append('maxPrice', maxPrice.toString());
    router.push(`/hangarshare/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span className="text-lg">←</span>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Encontre o hangar perfeito para sua aeronave
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Conectando proprietários de hangares com pilotos e operadores que precisam de estacionamento seguro para suas aeronaves
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 gap-6">
              {/* ICAO and City Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">Código ICAO</label>
                  <input
                    type="text"
                    placeholder="SBSP, SBGR..."
                    maxLength={4}
                    value={searchICAO}
                    onChange={(e) => setSearchICAO(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo, Campinas..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 shadow-lg text-lg"
                  >
                    🔍 Buscar Hangares
                  </button>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="border-t border-slate-200 pt-6">
                <label className="block text-left text-sm font-bold text-slate-700 mb-3">
                  💰 Faixa de Preço Mensal
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span className="font-bold text-blue-900">
                      R$ {minPrice.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-slate-500">até</span>
                    <span className="font-bold text-blue-900">
                      {maxPrice >= 20000 ? 'R$ 20.000+' : `R$ ${maxPrice.toLocaleString('pt-BR')}`}
                    </span>
                  </div>
                  
                  {/* Min Price Slider */}
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Preço Mínimo</label>
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={minPrice}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value < maxPrice) {
                          setMinPrice(value);
                        }
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      title="Preco minimo"
                    />
                  </div>

                  {/* Max Price Slider */}
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Preço Máximo</label>
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={maxPrice}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > minPrice) {
                          setMaxPrice(value);
                        }
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                      title="Preco maximo"
                    />
                  </div>

                  {/* Quick Price Filters */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => { setMinPrice(0); setMaxPrice(3500); }}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-full font-bold transition-colors"
                    >
                      💰 Econômico (até R$ 3.500)
                    </button>
                    <button
                      onClick={() => { setMinPrice(3500); setMaxPrice(6000); }}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-full font-bold transition-colors"
                    >
                      💼 Standard (R$ 3.500-6.000)
                    </button>
                    <button
                      onClick={() => { setMinPrice(6000); setMaxPrice(10000); }}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-full font-bold transition-colors"
                    >
                      🌟 Executivo (R$ 6K-10K)
                    </button>
                    <button
                      onClick={() => { setMinPrice(10000); setMaxPrice(20000); }}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-full font-bold transition-colors"
                    >
                      👑 Premium (R$ 10K+)
                    </button>
                    <button
                      onClick={() => { setMinPrice(0); setMaxPrice(20000); }}
                      className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold transition-colors"
                    >
                      ✖️ Limpar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h3 className="text-3xl font-black text-center text-blue-900 mb-12">Como funciona</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h4 className="text-xl font-bold text-blue-900 mb-2">1. Busque</h4>
            <p className="text-slate-600">
              Encontre hangares disponíveis em aeródromos públicos e privados por código ICAO ou localização
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h4 className="text-xl font-bold text-blue-900 mb-2">2. Reserve</h4>
            <p className="text-slate-600">
              Escolha o período (pernoite, diária, semanal ou mensal) e faça sua reserva online com segurança
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
            <div className="text-5xl mb-4">✈️</div>
            <h4 className="text-xl font-bold text-blue-900 mb-2">3. Voe tranquilo</h4>
            <p className="text-slate-600">
              Receba confirmação automática e informações do hangar. Sua aeronave segura e protegida
            </p>
          </div>
        </div>
      </section>

      {/* CTA for Owners */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-black mb-4">Tem um hangar? Monetize seu espaço!</h3>
          <p className="text-xl text-emerald-50 mb-8">
            Cadastre seu hangar e comece a receber aeronaves visitantes. Processo 100% seguro e verificado.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isMounted && user ? (
              <button
                onClick={() => router.push('/hangarshare/owner/register')}
                className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg shadow-lg hover:bg-emerald-50 text-lg"
              >
                🏢 Anunciar Meu Hangar
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg shadow-lg hover:bg-emerald-50 text-lg"
                >
                  Fazer Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-8 py-4 bg-emerald-800 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-900 text-lg"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-2xl font-bold text-blue-900 mb-4">Para Pilotos e Operadores</h4>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Reserva online rápida e segura</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Confirmação automática por e-mail e SMS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Pagamento online ou no local</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Política de cancelamento flexível</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Suporte 24/7</span>
              </li>
            </ul>
          </div>
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
            <h4 className="text-2xl font-bold text-emerald-900 mb-4">Para Proprietários de Hangares</h4>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Monetize espaços ociosos do seu hangar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Gestão completa de reservas online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Repasse automático de pagamentos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Controle total de disponibilidade e preços</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Sistema de avaliação e reputação</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300">
            © 2025 HangarShare by Love To Fly Portal | Conectando a aviação com segurança
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm text-slate-400">
            <button className="hover:text-white">Termos de Uso</button>
            <button className="hover:text-white">Política de Privacidade</button>
            <button className="hover:text-white">Contrato de Anúncio</button>
            <button className="hover:text-white">Suporte</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
