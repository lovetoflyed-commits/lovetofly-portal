'use client';

import { useEffect, useMemo, useState } from 'react';

type Drill = {
  id: string;
  category: 'WIND' | 'TAS' | 'ALT' | 'PLAN' | 'CONV';
  prompt: string;
  type: 'number' | 'multi';
  unit?: string;
  choices?: Array<{ key: string; label: string }>;
  correctAnswer: number | string;
  tolerance?: number; // for numeric answers
  explanation: string;
};

const DEFAULT_DRILLS: Drill[] = [
  {
    id: 'wca-1',
    category: 'WIND',
    prompt: 'Com vento de 020°/15 kt e proa desejada 010°, qual é a WCA aproximada?',
    type: 'multi',
    choices: [
      { key: '+2°', label: '+2° à direita' },
      { key: '+4°', label: '+4° à direita' },
      { key: '+6°', label: '+6° à direita' },
    ],
    correctAnswer: '+4°',
    explanation: 'Com vento próximo pela direita e intensidade moderada, a correção típica neste cenário fica perto de +4°. Ajuste conforme GS/TAS reais.',
  },
  {
    id: 'tas-1',
    category: 'TAS',
    prompt: 'IAS 110 kt, FL050, OAT -5°C. Qual a TAS aproximada?',
    type: 'number',
    unit: 'kt',
    correctAnswer: 118,
    tolerance: 3,
    explanation: 'A TAS aumenta com altitude e temperatura. Para FL050 e OAT -5°C, a TAS fica alguns nós acima da IAS, ~118 kt.',
  },
  {
    id: 'plan-1',
    category: 'PLAN',
    prompt: 'Distância 86 NM e GS 115 kt. Qual o tempo de voo?',
    type: 'number',
    unit: 'min',
    correctAnswer: 45,
    tolerance: 2,
    explanation: 'Tempo ≈ Distância / GS = 86 / 115 ≈ 0,75 h ≈ 45 min.',
  },
  {
    id: 'conv-1',
    category: 'CONV',
    prompt: 'Converta 25 galões para litros (aprox.).',
    type: 'number',
    unit: 'L',
    correctAnswer: 95,
    tolerance: 2,
    explanation: '1 gal ≈ 3,785 L. 25 × 3,785 ≈ 94,6 L, arredondando ~95 L.',
  },
];

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

export default function E6BDrills({ drills = DEFAULT_DRILLS }: { drills?: Drill[] }) {
  const [index, setIndex] = useLocalStorage<number>('e6b_drills_index', 0);
  const [answer, setAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useLocalStorage<boolean>('e6b_drills_completed', false);

  const current = useMemo(() => drills[index % drills.length], [drills, index]);

  const onSubmit = () => {
    if (!current) return;
    const user = answer.trim();
    let isCorrect = false;
    if (current.type === 'multi') {
      isCorrect = user === String(current.correctAnswer);
    } else {
      const num = Number(user.replace(',', '.'));
      const target = Number(current.correctAnswer);
      const tol = current.tolerance ?? 0;
      isCorrect = !Number.isNaN(num) && Math.abs(num - target) <= tol;
    }
    setFeedback(isCorrect ? '✅ Correto!' : '❌ Confira sua resposta');
    setShowExplanation(true);
    if (isCorrect) {
      setCompleted(true);
    }
  };

  const onNext = () => {
    setIndex((prev) => (prev + 1) % drills.length);
    setAnswer('');
    setFeedback('');
    setShowExplanation(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-600">Exercício {index + 1} / {drills.length} • Categoria: <span className="font-bold">{current.category}</span></div>
        {completed && <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Progresso salvo</div>}
      </div>
      <div className="text-slate-900 font-bold mb-2">{current.prompt}</div>

      {current.type === 'multi' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          {current.choices?.map((c) => (
            <button
              key={c.key}
              onClick={() => setAnswer(c.key)}
              className={`px-3 py-2 rounded border ${answer === c.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}
            >{c.label}</button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`Resposta (${current.unit ?? ''})`}
            className="px-3 py-2 border border-slate-300 rounded w-40"
          />
          {current.unit && <span className="text-slate-700 text-sm">{current.unit}</span>}
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button onClick={onSubmit} className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold">Confirmar</button>
        <button onClick={onNext} className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-bold">Próximo</button>
      </div>

      {!!feedback && <div className="text-sm mb-2">{feedback}</div>}
      {showExplanation && (
        <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-900">
          {current.explanation}
        </div>
      )}
    </div>
  );
}
