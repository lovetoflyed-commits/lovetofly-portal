'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Tag, MapPin } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="h-screen w-full bg-slate-900 text-slate-200 overflow-hidden flex flex-col font-sans"
    >
      <Header />

      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden relative">

        {/* Reutilizando o Menu Lateral */}
        <Sidebar />

        {/* Área Principal de Conteúdo */}
        <section className="col-span-1 md:col-span-9 flex flex-col gap-3 overflow-hidden h-full">

          {/* Barra de Título e Filtros */}
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex justify-between 
items-center backdrop-blur-sm shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Classificados</h2>
              <p className="text-xs text-slate-400">Encontre aeronaves, peças e hangares.</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 
rounded-lg text-xs font-bold transition-colors">
              <Filter size={14} /> FILTRAR
            </button>
          </div>

          {/* Grid de Anúncios */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {AIRCRAFT_LIST.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden 
hover:border-blue-500/50 transition-all group cursor-pointer">
                  {/* Imagem */}
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    <img src={item.image} alt={item.model} className="w-full h-full object-cover opacity-80 
group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded 
text-[10px] font-bold text-white flex items-center gap-1">
                      <Tag size={10} /> VENDA
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm mb-1">{item.model}</h3>
                    <p className="text-xs text-slate-500 mb-3">Ano {item.year}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-blue-400 font-bold text-sm">{item.price}</span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <MapPin size={10} /> {item.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </motion.div>
  );
}

