'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function CareerPage() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: '🔍',
      title: 'Encontre sua próxima vaga',
      description: 'Busque entre milhares de oportunidades na aviação',
      action: 'Ver vagas',
      href: '/career/jobs',
    },
    {
      icon: '📋',
      title: 'Acompanhe suas candidaturas',
      description: 'Monitore o status em tempo real',
      action: 'Minhas candidaturas',
      href: user ? '/career/my-applications' : '/login',
    },
    {
      icon: '👤',
      title: 'Construa seu perfil',
      description: 'Mostre suas qualificações e experiência profissional',
      action: 'Criar perfil',
      href: user ? '/career/profile' : '/login',
    },
    {
      icon: '⭐',
      title: 'Conheça as empresas',
      description: 'Leia avaliações e pesquise empregadores',
      action: 'Ver empresas',
      href: '/career/companies',
    },
    {
      icon: '🤝',
      title: 'Encontre mentoria',
      description: 'Conecte-se com mentores experientes na aviação',
      action: 'Achar mentores',
      href: '/mentorship',
    },
    {
      icon: '💰',
      title: 'Dados de salários',
      description: 'Compare remuneração e negocie melhor',
      action: 'Ver dados',
      href: '/career/salary-data',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="max-w-6xl mx-auto">
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">
              Central de Carreira em Aviação
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Encontre sua vaga dos sonhos, conecte-se com mentores e avance na carreira
            </p>
            <button
              onClick={() => router.push('/career/jobs')}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Ver vagas agora →
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Tudo para sua carreira na aviação
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-blue-200 p-6 hover:shadow-lg transition"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <button
                    onClick={() => router.push(feature.href)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {feature.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-50 py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600 mb-2">500+</p>
                <p className="text-gray-700">Vagas ativas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600 mb-2">200+</p>
                <p className="text-gray-700">Empresas verificadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600 mb-2">50K+</p>
                <p className="text-gray-700">Membros na comunidade</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600 mb-2">1000+</p>
                <p className="text-gray-700">Contratações bem-sucedidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white py-16 px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para avançar sua carreira?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Junte-se a milhares de profissionais de aviação usando nossa plataforma
            </p>
            {user ? (
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/career/jobs')}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Explorar vagas
                </button>
                <button
                  onClick={() => router.push('/career/my-applications')}
                  className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition"
                >
                  Minhas candidaturas
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Criar conta gratuita
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

