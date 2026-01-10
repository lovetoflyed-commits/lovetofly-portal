'use client';

import React from 'react';
import Link from 'next/link';
import { Filter, Tag, MapPin, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

// Dados mockados de aeronaves
const AIRCRAFT_LIST = [
  { id: 1, model: 'Cessna 172 Skyhawk', year: 1982, price: 'R$ 850.000', location: 'São Paulo, SP', image: 
'https://images.unsplash.com/photo-1559627748-c44e6f64e6df?auto=format&fit=crop&q=80&w=300&h=200' },
  { id: 2, model: 'Piper Seneca III', year: 1994, price: 'R$ 1.200.000', location: 'Curitiba, PR', image: 
'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=300&h=200' },
  { id: 3, model: 'Cirrus SR22 G3', year: 2008, price: 'R$ 3.500.000', location: 'Belo Horizonte, MG', image: 
'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=300&h=200' },
  { id: 4, model: 'Robinson R44 Raven II', year: 2010, price: 'R$ 2.100.000', location: 'Goiânia, GO', image: 
'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&q=80&w=300&h=200' },
  { id: 5, model: 'Baron G58', year: 2015, price: 'US$ 950.000', location: 'Jundiaí, SP', image: 
'https://images.unsplash.com/photo-1583068758063-944f8065b63f?auto=format&fit=crop&q=80&w=300&h=200' },
  { id: 6, model: 'Phenom 100', year: 2012, price: 'US$ 2.800.000', location: 'Sorocaba, SP', image: 
'https://images.unsplash.com/photo-1559087867-ce4c91325525?auto=format&fit=crop&q=80&w=300&h=200' },
];

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <span className="text-lg">←</span>
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Classificados de Aviação</h1>
                <p className="text-purple-100">
                  Encontre aeronaves, peças, equipamentos e hangares
                </p>
              </div>
              <button className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                <Filter size={18} /> Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto p-8">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por modelo, marca ou tipo..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {['Todos', 'Aeronaves', 'Helicópteros', 'Peças', 'Equipamentos', 'Hangares'].map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  cat === 'Todos'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AIRCRAFT_LIST.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-purple-600 flex items-center gap-1 shadow-md">
                    <Tag size={12} /> À Venda
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{item.model}</h3>
                  <p className="text-sm text-gray-500 mb-4">Ano {item.year}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 font-bold text-lg">{item.price}</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} /> {item.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

