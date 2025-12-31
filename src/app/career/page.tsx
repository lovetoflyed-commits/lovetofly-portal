'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, FileText, Upload } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Dados mockados de vagas
const JOBS = [
  {
    id: 1,
    role: 'Piloto Comercial (PC) - Caravan C208',
    company: 'Azul Conecta',
    location: 'Jundiaí, SP',
    salary: 'R$ 5.500 - R$ 7.000',
    type: 'Full-time',
    posted: '2 dias atrás'
  },
  {
    id: 2,
    role: 'Instrutor de Voo (INVA)',
    company: 'Aeroclube de São Paulo',
    location: 'São Paulo, SP',
    salary: 'R$ 80/hora',
    type: 'Freelance',
    posted: '5 dias atrás'
  },
  {
    id: 3,
    role: 'Co-Piloto King Air C90',
    company: 'Táxi Aéreo XYZ',
    location: 'Belo Horizonte, MG',
    salary: 'A combinar',
    type: 'Full-time',
    posted: '1 semana atrás'
  },
  {
    id: 4,
    role: 'Mecânico de Aeronaves (Célula)',
    company: 'Oficina Bravo',
    location: 'Sorocaba, SP',
    salary: 'R$ 4.500',
    type: 'Full-time',
    posted: '2 semanas atrás'
  }
];

export default function CareerPage() {
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

          {/* Cabeçalho */}
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex justify-between 
items-center backdrop-blur-sm shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Central de Carreira</h2>
              <p className="text-xs text-slate-400">Encontre oportunidades e gerencie seu currículo.</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 
rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-900/20">
              <FileText size={14} /> MEU CURRÍCULO
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">

            {/* Coluna Esquerda: Vagas */}
            <div className="lg:col-span-2 bg-slate-800/40 rounded-lg border border-slate-700/50 flex flex-col 
overflow-hidden">
              <div className="p-3 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase size={14} className="text-blue-400" /> Vagas Recentes
                </h3>
                <span className="text-[10px] text-slate-500">Mostrando 4 vagas</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {JOBS.map((job) => (
                  <div key={job.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg 
hover:border-blue-500/30 hover:bg-slate-800 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 
transition-colors">{job.role}</h4>
                        <p className="text-xs text-slate-400 font-medium">{job.company}</p>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border 
border-slate-700">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={10} /> {job.salary}</span>
                      <span className="ml-auto text-slate-600">{job.posted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita: Upload e Dicas */}
            <div className="flex flex-col gap-3">

              {/* Upload de CV */}
              <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex flex-col 
items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-3 
border border-slate-700 border-dashed">
                  <Upload size={20} className="text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Atualize seu CV</h4>
                <p className="text-[10px] text-slate-500 mb-3">Mantenha seu perfil atualizado para 
recrutadores.</p>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold 
py-2 rounded transition-colors">
                  ENVIAR PDF
                </button>
              </div>

              {/* Dicas Rápidas */}
              <div className="flex-1 bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 
overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-bold text-white mb-3 border-b border-slate-700 pb-2">Dicas de 
Carreira</h3>
                <ul className="space-y-3">
                  <li className="text-[10px] text-slate-400">
                    <strong className="text-blue-400 block mb-0.5">Inglês ICAO</strong>
                    Mantenha sua proficiência em dia. A maioria das companhias exige nível 4 ou superior.
                  </li>
                  <li className="text-[10px] text-slate-400">
                    <strong className="text-blue-400 block mb-0.5">Networking</strong>
                    Participe de eventos e mantenha contato com seus instrutores.
                  </li>
                  <li className="text-[10px] text-slate-400">
                    <strong className="text-blue-400 block mb-0.5">Jet Training</strong>
                    Um diferencial importante para quem busca a linha aérea.
                  </li>
                </ul>
              </div>

            </div>

          </div>

        </section>
      </main>
    </motion.div>
  );
}

