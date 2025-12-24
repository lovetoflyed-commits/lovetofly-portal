'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, Plane, MapPin } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Dados mockados de voos
const FLIGHT_LOGS = [
  { id: 1, date: '23/10/2025', aircraft: 'PT-ABC', model: 'C172', dep: 'SBMT', arr: 'SBJD', time: '1.5', 
landings: 1, type: 'Instrução' },
  { id: 2, date: '25/10/2025', aircraft: 'PT-ABC', model: 'C172', dep: 'SBJD', arr: 'SBMT', time: '1.4', 
landings: 1, type: 'Instrução' },
  { id: 3, date: '28/10/2025', aircraft: 'PR-XYZ', model: 'PA28', dep: 'SBMT', arr: 'SDCO', time: '0.8', 
landings: 3, type: 'Navegação' },
  { id: 4, date: '30/10/2025', aircraft: 'PR-XYZ', model: 'PA28', dep: 'SDCO', arr: 'SBMT', time: '0.9', 
landings: 1, type: 'Navegação' },
  { id: 5, date: '02/11/2025', aircraft: 'PP-GHI', model: 'C152', dep: 'SBMT', arr: 'SBMT', time: '1.0', 
landings: 5, type: 'TGL' },
];

export default function LogbookPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="h-screen w-full bg-slate-900 text-slate-200 overflow-hidden flex flex-col font-sans"
    >
      <Header />

      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden relative">

        <Sidebar />

        <section className="col-span-1 md:col-span-9 flex flex-col gap-3 overflow-hidden h-full">

          {/* Cabeçalho da Seção */}
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex justify-between 
items-center backdrop-blur-sm shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Diário de Bordo</h2>
              <p className="text-xs text-slate-400">Gerencie seus registros de voo digitalmente.</p>
            </div>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 
rounded-lg text-xs font-bold transition-colors shadow-lg shadow-green-900/20">
              <Plus size={14} /> NOVO REGISTRO
            </button>
          </div>

          {/* Resumo de Horas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Geral</span>
              <div className="text-xl font-mono text-white font-bold">145.5</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Comando (PIC)</span>
              <div className="text-xl font-mono text-blue-400 font-bold">32.0</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Instrução</span>
              <div className="text-xl font-mono text-yellow-400 font-bold">113.5</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Últimos 30 dias</span>
              <div className="text-xl font-mono text-green-400 font-bold">5.6</div>
            </div>
          </div>

          {/* Tabela de Voos */}
          <div className="flex-1 bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden flex 
flex-col">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase 
tracking-wider">Data</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase 
tracking-wider">Aeronave</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Origem 
/ Destino</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase 
tracking-wider">Tempo</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase 
tracking-wider">Pousos</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase 
tracking-wider">Natureza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {FLIGHT_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="p-3 text-xs text-slate-300 font-mono flex items-center gap-2">
                        <Calendar size={12} className="text-slate-600 group-hover:text-blue-500" />
                        {log.date}
                      </td>
                      <td className="p-3 text-xs text-white font-bold">
                        <div className="flex flex-col">
                          <span>{log.aircraft}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{log.model}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-300 font-mono">
                        <div className="flex items-center gap-1">
                          {log.dep} <MapPin size={10} className="text-slate-600" /> {log.arr}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-white font-mono font-bold bg-slate-800/30">
                        {log.time}
                      </td>
                      <td className="p-3 text-xs text-slate-400 text-center w-16">
                        {log.landings}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-1 rounded border 
border-blue-900/50">
                          {log.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>
      </main>
    </motion.div>
  );
}

