'use client';

import React from 'react';
import { Search } from 'lucide-react';

export default function QuickAccess() {
  return (
    <div className="flex-1 bg-gradient-to-b from-slate-800/40 to-slate-900/40 rounded-lg border 
border-slate-700/50 p-4 flex flex-col justify-end relative overflow-hidden backdrop-blur-sm group">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none"></div>

      <div className="relative z-10">
        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded mb-2 inline-block shadow-lg 
shadow-blue-900/50">
          BETA
        </span>
        <h4 className="text-sm font-bold text-white mb-1">Portal Love To Fly</h4>
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
          Acesse simulados, consulte a RAB e gerencie sua carreira em um só lugar.
        </p>

        <div className="relative group/input">
          <Search className="absolute left-2 top-2 text-slate-500 group-focus-within/input:text-blue-400 
transition-colors" size={12} />
          <input 
            type="text" 
            placeholder="Buscar matrícula (ex: PT-ABC)..." 
            className="w-full bg-slate-950 border border-slate-700 rounded py-1.5 pl-7 pr-2 text-xs 
text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none 
transition-all"
          />
        </div>
      </div>
    </div>
  );
}

