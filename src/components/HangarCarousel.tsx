import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface Hangar {
  id: number;
  hangar_number: string;
  icao_code: string;
  aerodrome_name: string;
  daily_rate: number;
  photos?: string[];
}

const fetchHangars = async (): Promise<Hangar[]> => {
  try {
    const res = await fetch('/api/hangarshare/listing/highlighted');
    if (!res.ok) throw new Error('Erro ao buscar hangares');
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
};

export default function HangarCarousel() {
  const { user } = useAuth();
  const [hangars, setHangars] = useState<Hangar[]>([]);
  const [current, setCurrent] = useState(0);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  useEffect(() => {
    fetchHangars().then(setHangars);
  }, []);

  if (!hangars.length) return null;

  const next = () => setCurrent((c) => (c + 1) % hangars.length);
  const prev = () => setCurrent((c) => (c - 1 + hangars.length) % hangars.length);

  const handleAction = (hangarId: number) => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    window.location.href = `/hangarshare/listing/${hangarId}`;
  };

  // Seleciona a imagem principal do hangar
  const getMainPhoto = (hangar: Hangar) => {
    if (Array.isArray(hangar.photos) && hangar.photos.length > 0) {
      // Remove o prefixo /public se existir
      const raw = hangar.photos[0];
      if (raw.startsWith('/public/')) {
        return raw.replace('/public', '');
      }
      return raw;
    }
    return '/no-image.png';
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm relative bg-white">
        <div className="flex items-center justify-between mb-1 px-5 pt-5">
          <div>
            <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">HangarShare</div>
            <h3 className="text-lg font-black text-blue-900">Hangares em Destaque</h3>
          </div>
        </div>
        <div className="relative">
          <img
            src={getMainPhoto(hangars[current])}
            alt={hangars[current].aerodrome_name}
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-3 right-3 z-10">
            {/* Espaço reservado para botão de favorito futuro */}
          </div>
        </div>
        <div className="p-5 space-y-2">
          <div>
            <h4 className="text-base font-bold text-blue-900">{hangars[current].icao_code} - {hangars[current].aerodrome_name}</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-green-700">R$ {hangars[current].daily_rate?.toLocaleString('pt-BR')} / dia</span>
          </div>
          <div className="flex gap-2 mt-2">
            {user ? (
              <button
                onClick={() => handleAction(hangars[current].id)}
                className="flex-1 px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded hover:bg-blue-800"
              >
                Reservar hangar
              </button>
            ) : (
              <button
                onClick={() => setShowLoginAlert(true)}
                className="flex-1 px-3 py-2 bg-gray-400 text-white text-xs font-bold rounded cursor-not-allowed"
                disabled
              >
                Faça login ou cadastre-se para reservar
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 px-5 pb-4">
          <button
            aria-label="Anterior"
            onClick={prev}
            className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
          >
            ‹
          </button>
          <div className="flex gap-1.5">
            {hangars.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${idx === current ? 'bg-blue-900 w-6' : 'bg-slate-300 w-2 hover:bg-slate-400'}`}
                aria-label={`Ir para oferta ${idx + 1}`}
              />
            ))}
          </div>
          <button
            aria-label="Próximo"
            onClick={next}
            className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
          >
            ›
          </button>
        </div>
      </div>
      {showLoginAlert && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-center">
          Faça login ou cadastre-se para acessar detalhes e reservar um hangar.
          <div className="mt-2 flex gap-2 justify-center">
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Login</Link>
            <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Cadastrar</Link>
            <button onClick={() => setShowLoginAlert(false)} className="ml-2 text-slate-500 underline">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
