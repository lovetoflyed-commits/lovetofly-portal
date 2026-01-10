'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary_range: string;
  type: string;
  level: string;
  posted_days_ago: number;
  applications: number;
}

export default function CareerJobsPage() {
  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Piloto Capitão (B737)',
      company: 'LATAM Airlines',
      logo: '✈️',
      location: 'São Paulo, Brasil',
      salary_range: '$8,000 - $12,000 USD',
      type: 'Período Integral',
      level: 'Sênior',
      posted_days_ago: 2,
      applications: 145,
    },
    {
      id: '2',
      title: 'First Officer (A320)',
      company: 'Azul Linhas Aéreas',
      logo: '🛫',
      location: 'Viracopos, Brasil',
      salary_range: '$5,000 - $7,500 USD',
      type: 'Período Integral',
      level: 'Pleno',
      posted_days_ago: 5,
      applications: 87,
    },
    {
      id: '3',
      title: 'Engenheiro de Manutenção',
      company: 'EMBRAER',
      logo: '🏭',
      location: 'São José dos Campos, Brasil',
      salary_range: '$6,000 - $9,000 USD',
      type: 'Período Integral',
      level: 'Pleno',
      posted_days_ago: 7,
      applications: 62,
    },
    {
      id: '4',
      title: 'Despachante Aéreo',
      company: 'TAP Air Portugal',
      logo: '📋',
      location: 'Lisboa, Portugal',
      salary_range: '$3,500 - $5,000 USD',
      type: 'Período Integral',
      level: 'Júnior',
      posted_days_ago: 3,
      applications: 34,
    },
    {
      id: '5',
      title: 'Instrutor de Voo',
      company: 'Escola de Aviação Prática',
      logo: '🎓',
      location: 'Santos, Brasil',
      salary_range: '$4,000 - $6,000 USD',
      type: 'Período Integral',
      level: 'Pleno',
      posted_days_ago: 1,
      applications: 28,
    },
    {
      id: '6',
      title: 'Técnico de Manutenção (Aviónica)',
      company: 'Gol Linhas Aéreas',
      logo: '⚙️',
      location: 'Brasília, Brasil',
      salary_range: '$4,500 - $6,500 USD',
      type: 'Período Integral',
      level: 'Pleno',
      posted_days_ago: 4,
      applications: 41,
    },
  ]);

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredJobs = jobs.filter((job) => {
    const matchesLevel = !selectedLevel || job.level === selectedLevel;
    const matchesType = !selectedType || job.type === selectedType;
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesLevel && matchesType && matchesSearch;
  });

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
              Vagas de Emprego na Aviação
            </h1>
            <p className="text-gray-600">
              Encontre sua próxima oportunidade nas principais companhias aéreas, escolas e serviços de aviação
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Buscar cargo ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Level Filter */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os níveis</option>
                  <option value="Júnior">Júnior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Sênior">Sênior</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  <option value="Período Integral">Período Integral</option>
                  <option value="Contrato">Contrato</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedLevel || selectedType) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLevel('');
                    setSelectedType('');
                  }}
                  className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{job.logo}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{job.company}</p>

                        <div className="flex flex-wrap gap-3 mb-3">
                          <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                            📍 {job.location}
                          </span>
                          <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                            💰 {job.salary_range}
                          </span>
                          <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">
                            {job.level}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500">
                          {job.type} • Publicado há {job.posted_days_ago} dia{job.posted_days_ago > 1 ? 's' : ''} •
                          {job.applications} candidaturas
                        </p>
                      </div>
                    </div>

                    <button className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition">
                      Candidatar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">
                  Nenhuma vaga encontrada com os filtros selecionados
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLevel('');
                    setSelectedType('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtros e tentar novamente
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Mostrando <strong>{filteredJobs.length}</strong> de <strong>{jobs.length}</strong> vagas
          </div>
        </div>
      </div>
    </div>
  );
}
