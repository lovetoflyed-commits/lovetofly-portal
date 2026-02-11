'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Company {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  industry: string;
  country: string;
  description: string;
  openPositions: number;
}

export default function CompaniesPage() {
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'LATAM Airlines',
      logo: '🏢',
      rating: 4.5,
      reviews: 234,
      industry: 'Aviação Comercial',
      country: 'Brasil',
      description: 'Maior companhia aérea da América Latina',
      openPositions: 8,
    },
    {
      id: '2',
      name: 'Azul Linhas Aéreas',
      logo: '✈️',
      rating: 4.3,
      reviews: 187,
      industry: 'Aviação Comercial',
      country: 'Brasil',
      description: 'Conectando Brasil e o mundo',
      openPositions: 5,
    },
    {
      id: '3',
      name: 'EMBRAER',
      logo: '🛩️',
      rating: 4.7,
      reviews: 156,
      industry: 'Manufatura Aeronáutica',
      country: 'Brasil',
      description: 'Líderes em aviação regional e executiva',
      openPositions: 12,
    },
    {
      id: '4',
      name: 'TAP Air Portugal',
      logo: '🌍',
      rating: 4.4,
      reviews: 203,
      industry: 'Aviação Comercial',
      country: 'Portugal',
      description: 'Conectando Portugal com o mundo',
      openPositions: 4,
    },
    {
      id: '5',
      name: 'Gol Linhas Aéreas',
      logo: '🛫',
      rating: 4.2,
      reviews: 145,
      industry: 'Aviação Comercial',
      country: 'Brasil',
      description: 'Voando mais longe com você',
      openPositions: 6,
    },
    {
      id: '6',
      name: 'Infraero',
      logo: '🏗️',
      rating: 3.8,
      reviews: 98,
      industry: 'Infraestrutura Aeroportuária',
      country: 'Brasil',
      description: 'Gerenciadora de infraestrutura aeroportuária',
      openPositions: 3,
    },
  ]);

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  const filteredCompanies = companies.filter((company) => {
    if (selectedRating && company.rating < selectedRating) return false;
    if (selectedIndustry && company.industry !== selectedIndustry) return false;
    return true;
  });

  const industries = Array.from(new Set(companies.map((c) => c.industry)));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <Link href="/career" className="inline-block mb-6 px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-bold">
            ← Voltar ao Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Conheça as Empresas
            </h1>
            <p className="text-gray-600">
              Explore perfis de empresas de aviação e leia avaliações de colaboradores
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classificação Mínima
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedRating === null}
                      onChange={() => setSelectedRating(null)}
                      className="mr-2"
                    />
                    <span>Todas as classificações</span>
                  </label>
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(rating)}
                        className="mr-2"
                      />
                      <span>Mínimo {rating}+ ⭐</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setor
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Setor"
                >
                  <option value="">Todos os setores</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6"
              >
                {/* Logo and Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{company.logo}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-600">{company.industry}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {company.rating}
                  </span>
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm text-gray-600">
                    ({company.reviews} avaliações)
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4">{company.description}</p>

                {/* Location and Open Positions */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-600">
                    📍 {company.country}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {company.openPositions} vagas abertas
                  </span>
                </div>

                {/* Actions */}
                <button className="w-full px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition">
                  Ver Perfil
                </button>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Nenhuma empresa encontrada com os filtros selecionados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
