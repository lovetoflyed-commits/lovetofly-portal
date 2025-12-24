'use client';

import React from 'react';
import { FileText } from 'lucide-react';

// Dados mockados (futuramente virão de uma API)
const NEWS_FEED = [
  { source: 'Instrução', time: '2h atrás', title: 'Como interpretar METAR e TAF corretamente: Guia essencial.' },
  { source: 'Legislação', time: '4h atrás', title: 'Atualizações recentes nos RBACs da ANAC: O que mudou?' },
  { source: 'Carreira', time: '6h atrás', title: 'Caminhos possíveis na aviação: Geral, Executiva e Linha Aérea.' 
},
  { source: 'Segurança', time: '8h atrás', title: 'CENIPA divulga relatório final sobre ocorrência em Jundiaí.' },
  { source: 'Internacional', time: '12h atrás', title: 'FAA propõe novas regras para eVTOLs em espaço urbano.' },
  { source: 'Tecnologia', time: '1d atrás', title: 'Garmin anuncia novos aviônicos para aviação experimental.' },
];

export default function NewsFeed() {
  return (
    <div className="flex-1 bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex flex-col overflow-hidden 
backdrop-blur-sm">
      <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
        <FileText size={14} /> FEED DE NOTÍCIAS
      </h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
        {NEWS_FEED.map((news, idx) => (
          <div key={idx} className="bg-slate-900/40 p-3 rounded border border-slate-800 hover:border-blue-500/30 
hover:bg-slate-800 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">{news.source}</span>
              <span className="text-[9px] text-slate-600">{news.time}</span>
            </div>
            <h4 className="text-sm text-slate-300 group-hover:text-white font-medium leading-tight">
              {news.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}

