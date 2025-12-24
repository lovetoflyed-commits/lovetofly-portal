'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CLOCKS_DATA = [
  { label: 'UTC (Zulu)', offset: 0 },
  { label: 'Brasília', offset: -3 },
  { label: 'Nova York', offset: -5 },
  { label: 'Londres', offset: 0 },
  { label: 'Tóquio', offset: 9 },
];

export default function WorldClocks() {
  // Estado para forçar atualização do relógio a cada minuto
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  const getTime = (offset: number) => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * offset));
    return nd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 backdrop-blur-sm">
      <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
        <Clock size={14} /> FUSOS
      </h3>
      <div className="space-y-2">
        {CLOCKS_DATA.map((clock, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-slate-700/30 pb-1 
last:border-0">
            <span className="text-[10px] text-slate-400 uppercase">{clock.label}</span>
            <span className="text-xs font-mono text-slate-200">{getTime(clock.offset)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

