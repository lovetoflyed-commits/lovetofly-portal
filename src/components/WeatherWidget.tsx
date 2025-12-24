'use client';

import React from 'react';
import { Cloud, Plane, AlertTriangle } from 'lucide-react';

export default function WeatherWidget() {
  // Dados mockados para o layout (futuramente virão da API Redemet)
  const mockData = {
    icao: 'SBMT',
    raw: 'METAR SBMT 231400Z 14008KT 9999 FEW030 24/18 Q1018=',
    wind: '140°/08kt',
    qnh: '1018 hPa',
    temp: '24°C'
  };

  return (
    <div className="h-1/3 bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 relative overflow-hidden group backdrop-blur-sm">
      {/* Ícone de Fundo Decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Cloud size={100} />
      </div>

      {/* Cabeçalho do Widget */}
      <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-3">
        <Plane size={14} /> METEOROLOGIA ({mockData.icao})
      </h3>

      {/* Código METAR */}
      <div className="bg-slate-900/60 rounded border border-slate-700 p-3 font-mono text-xs text-green-400 leading-relaxed shadow-inner">
        {mockData.raw}
      </div>

      {/* Decodificação Rápida */}
      <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <AlertTriangle size={10} className="text-yellow-500"/> 
          Vento: <span className="text-slate-200">{mockData.wind}</span>
        </span>
        <span>
          QNH: <span className="text-slate-200">{mockData.qnh}</span>
        </span>
        <span>
          Temp: <span className="text-slate-200">{mockData.temp}</span>
        </span>
      </div>
    </div>
  );
}
