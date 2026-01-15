"use client";

import { useState } from 'react';
import HangarCarousel from './HangarCarousel';
import LanguageSelector from './LanguageSelector';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export default function LandingPage({ onOpenLogin, onOpenRegister }: LandingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'pro'>('free');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-blue-900 font-black text-xl tracking-wider">
                LOVE TO FLY
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={onOpenLogin}
                className="text-slate-700 hover:text-blue-900 font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={onOpenRegister}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-bold"
              >
                Criar Conta
              </button>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onOpenLogin(); }}
                className="ml-2 text-xs text-slate-400 hover:text-blue-700 underline underline-offset-2 focus:outline-none"
                style={{ letterSpacing: '0.05em' }}
                tabIndex={0}
                aria-label="Acesso restrito ao staff"
              >
                Staff
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-blue-900 leading-tight">
                Seu Portal Completo<br />
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  da Aviação Civil
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto">
                Ferramentas profissionais, marketplace, hangares, cursos e comunidade.<br />
                Tudo em um só lugar para pilotos e entusiastas.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onOpenRegister}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                🚀 Começar Gratuitamente
              </button>
              <button
                onClick={onOpenLogin}
                className="px-8 py-4 bg-white text-blue-900 text-lg font-bold rounded-xl border-2 border-blue-900 hover:bg-blue-50 transition-all duration-200"
              >
                Já tenho conta
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Registro ANAC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Pagamentos Seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Conformidade LGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Suporte Brasileiro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HangarShare Featured */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-3">🏢 HangarShare</h2>
            <p className="text-lg text-blue-100">Reserve ou alugue hangares em aeródromos por todo o Brasil</p>
          </div>
          <HangarCarousel />
          <div className="text-center mt-8">
            <button
              onClick={onOpenRegister}
              className="px-6 py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition"
            >
              Ver Todos os Hangares
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-900 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-lg text-slate-600">Ferramentas profissionais, marketplace e comunidade ativa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Navigation Tools */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🧭</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Navegação</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>E6B Flight Computer</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Glass Cockpit Simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Simulador IFR</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-600">★</span>
                  <span>Planejamento de Voo</span>
                </li>
              </ul>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Meteorologia</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>METAR/TAF em Tempo Real</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-600">★</span>
                  <span>Radar Meteorológico</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Notificações de Alerta</span>
                </li>
              </ul>
            </div>

            {/* Training */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Treinamento</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Logbook Digital</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Cursos Online</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">★★</span>
                  <span>Simulador Avançado</span>
                </li>
              </ul>
            </div>

            {/* Marketplace */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Pilot Shop</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Compra/Venda de Aeronaves</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Peças e Equipamentos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Aviônicos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Pagamento Protegido</span>
                </li>
              </ul>
            </div>

            {/* Career */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Carreira</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-orange-600">★</span>
                  <span>Vagas de Emprego</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">★★</span>
                  <span>Mentoria com Profissionais</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-600">★</span>
                  <span>Network de Aviação</span>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Comunidade</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Fóruns de Discussão</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Grupos Especializados</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Eventos e Fly-ins</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <span className="mr-4"><span className="text-green-600">✓</span> Grátis</span>
            <span className="mr-4"><span className="text-orange-600">★</span> Premium</span>
            <span><span className="text-blue-600">★★</span> Pro</span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-900 mb-4">Escolha seu plano</h2>
            <p className="text-lg text-slate-600">Comece grátis e evolua conforme suas necessidades</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 hover:border-blue-500 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-blue-900 mb-2">Free</h3>
                <div className="text-4xl font-black text-blue-900 mb-1">R$ 0</div>
                <div className="text-sm text-slate-600">Para sempre</div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Ferramentas básicas de navegação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>METAR/TAF em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Logbook digital básico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Acesso ao fórum</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>HangarShare (reservas)</span>
                </li>
              </ul>
              <button
                onClick={onOpenRegister}
                className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition"
              >
                Começar Grátis
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-xl border-2 border-orange-500 p-8 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-blue-900 mb-2">Premium</h3>
                <div className="text-4xl font-black text-orange-600 mb-1">R$ 49</div>
                <div className="text-sm text-slate-600">/mês</div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Tudo do Free +</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <span>Planejamento de voo avançado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <span>Radar meteorológico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <span>Vagas de emprego exclusivas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <span>Prioridade no suporte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <span>Sem anúncios</span>
                </li>
              </ul>
              <button
                onClick={onOpenRegister}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Assinar Premium
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-900 p-8 hover:border-blue-700 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-blue-900 mb-2">Pro</h3>
                <div className="text-4xl font-black text-blue-900 mb-1">R$ 99</div>
                <div className="text-sm text-slate-600">/mês</div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Tudo do Premium +</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Simulador avançado (IFR/VFR)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Mentoria com profissionais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Análise de performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>API para integrações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Suporte prioritário 24/7</span>
                </li>
              </ul>
              <button
                onClick={onOpenRegister}
                className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition"
              >
                Assinar Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-900 mb-4">Junte-se a milhares de pilotos</h2>
            <p className="text-lg text-slate-600">Profissionais e entusiastas confiam no Love to Fly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  CP
                </div>
                <div>
                  <div className="font-bold text-blue-900">Carlos Pinto</div>
                  <div className="text-sm text-slate-600">Piloto Comercial</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 italic">
                "O E6B digital é perfeito para planejamento rápido. Economizo horas toda semana!"
              </p>
              <div className="mt-4 text-yellow-500">★★★★★</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  MS
                </div>
                <div>
                  <div className="font-bold text-blue-900">Marina Silva</div>
                  <div className="text-sm text-slate-600">Instrutora de Voo</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 italic">
                "HangarShare revolucionou como gerencio meus hangares. Plataforma impecável!"
              </p>
              <div className="mt-4 text-yellow-500">★★★★★</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  RA
                </div>
                <div>
                  <div className="font-bold text-blue-900">Roberto Alves</div>
                  <div className="text-sm text-slate-600">Dono de Aeroclube</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 italic">
                "Finalmente uma plataforma brasileira completa para aviação. Recomendo!"
              </p>
              <div className="mt-4 text-yellow-500">★★★★★</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-black">Pronto para decolar?</h2>
          <p className="text-xl text-blue-100">
            Junte-se à maior comunidade de aviação civil do Brasil.<br />
            Comece gratuitamente hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              onClick={onOpenRegister}
              className="px-8 py-4 bg-white text-blue-900 text-lg font-bold rounded-xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-200 shadow-lg"
            >
              🚀 Criar Conta Grátis
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 bg-transparent text-white text-lg font-bold rounded-xl border-2 border-white hover:bg-white hover:text-blue-900 transition-all duration-200"
            >
              Já sou membro
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Love to Fly</h4>
              <p className="text-sm text-slate-400">
                Portal completo da aviação civil brasileira
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Ferramentas</a></li>
                <li><a href="#" className="hover:text-white">HangarShare</a></li>
                <li><a href="#" className="hover:text-white">Marketplace</a></li>
                <li><a href="#" className="hover:text-white">Cursos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/privacy" className="hover:text-white">Privacidade</a></li>
                <li><a href="/terms" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
                <li><a href="#" className="hover:text-white">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2026 Love to Fly. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
