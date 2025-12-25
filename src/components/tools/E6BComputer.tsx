'use client';

import { useState, useEffect } from 'react';
import * as e6b from '@/utils/e6bLogic';

// --- TIPAGEM ---
type E6BMode = 'MENU' | 'CONV' | 'ALT' | 'SPEED' | 'FUEL' | 'WIND' | 'TIMER';
type Language = 'EN' | 'PT';

type SubFunction = 
  | 'NONE' 
  | 'DENSITY_ALT' | 'TAS_CALC' | 'DIST_TIME' | 'FUEL_BURN'
  | 'CONV_NM_KM' | 'CONV_GAL_L'
  | 'HDG_GS_CALC' | 'X_WIND_CALC'
  | 'STOPWATCH'; // Nova função

// --- DICIONÁRIO DE TRADUÇÃO ---
const i18n = {
  EN: {
    mode: 'MODE',
    selectMode: 'SELECT MODE',
    pressEnter: 'PRESS ENTER',
    stopwatch: 'STOPWATCH',
    startStop: 'ENTER: Start/Stop',
    reset: 'CLR: Reset',
    menu: {
      alt: 'ALT: Altitude',
      tas: 'TAS: Speed',
      hdg: 'HDG: Plan',
      wind: 'WIND: X-Wind'
    },
    buttons: {
      flt: 'FLT', plan: 'PLAN', timer: 'TIMER', menu: 'MENU',
      wind: 'WIND', hdg: 'HDG', tas: 'TAS', alt: 'ALT',
      unit: 'UNIT', conv: 'CONV', back: 'BACK', clr: 'CLR', enter: 'ENTER'
    },
    labels: {
      DENSITY_ALT: ['Ind Alt (ft)', 'QNH (inHg)', 'Temp (°C)', ''],
      TAS_CALC: ['CAS (kts)', 'Press Alt', 'Temp (°C)', ''],
      DIST_TIME: ['Speed (kts)', 'Dist (NM)', '', ''],
      FUEL_BURN: ['GPH', 'Time (Hr)', '', ''],
      CONV_NM_KM: ['NM Value', '', '', ''],
      CONV_GAL_L: ['Gal Value', '', '', ''],
      HDG_GS_CALC: ['Course (°)', 'TAS (kt)', 'Wind Dir (°)', 'Wind Spd (kt)'],
      X_WIND_CALC: ['Rwy Hdg (°)', 'Wind Dir (°)', 'Wind Spd (kt)', ''],
      STOPWATCH: ['', '', '', '']
    },
    results: {
      time: 'Time',
      burn: 'Burn',
      head: 'Head',
      tail: 'Tail',
      xwind: 'X-Wind'
    }
  },
  PT: {
    mode: 'MODO',
    selectMode: 'SELECIONE MODO',
    pressEnter: 'APERTE ENTER',
    stopwatch: 'CRONÔMETRO',
    startStop: 'ENTER: Iniciar/Parar',
    reset: 'CLR: Zerar',
    menu: {
      alt: 'ALT: Altitude',
      tas: 'TAS: Velocid.',
      hdg: 'HDG: Planej.',
      wind: 'WIND: Vento X'
    },
    buttons: {
      flt: 'COMB', plan: 'PLAN', timer: 'CRON', menu: 'MENU',
      wind: 'VENTO', hdg: 'PROA', tas: 'TAS', alt: 'ALT',
      unit: 'UNID', conv: 'CONV', back: 'VOLTAR', clr: 'LIMPAR', enter: 'ENTRAR'
    },
    labels: {
      DENSITY_ALT: ['Alt Ind (ft)', 'QNH (inHg)', 'Temp (°C)', ''],
      TAS_CALC: ['CAS (kt)', 'Alt Pressão', 'Temp (°C)', ''],
      DIST_TIME: ['Veloc (kt)', 'Dist (NM)', '', ''],
      FUEL_BURN: ['GPH (Gal/h)', 'Tempo (Hr)', '', ''],
      CONV_NM_KM: ['Valor NM', '', '', ''],
      CONV_GAL_L: ['Valor Gal', '', '', ''],
      HDG_GS_CALC: ['Curso (°)', 'TAS (kt)', 'Dir Vento (°)', 'Vel Vento (kt)'],
      X_WIND_CALC: ['Rumo Pista(°)', 'Dir Vento (°)', 'Vel Vento (kt)', ''],
      STOPWATCH: ['', '', '', '']
    },
    results: {
      time: 'Tempo',
      burn: 'Consumo',
      head: 'Proa',
      tail: 'Cauda',
      xwind: 'Través'
    }
  }
};

export default function E6BComputer() {
  // --- ESTADOS ---
  const [lang, setLang] = useState<Language>('PT');
  const [mode, setMode] = useState<E6BMode>('MENU');
  const [subFunction, setSubFunction] = useState<SubFunction>('NONE');

  const [inputs, setInputs] = useState<string[]>(['', '', '', '']); 
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [result, setResult] = useState<string>('');

  // Estados do Cronômetro
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const t = i18n[lang];

  // --- EFEITO DO CRONÔMETRO ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && subFunction === 'STOPWATCH') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, subFunction]);

  // --- LÓGICA DE CÁLCULO ---
  const calculate = () => {
    const val = inputs.map(v => parseFloat(v));
    let res = '';

    try {
      switch (subFunction) {
        case 'DENSITY_ALT':
          const pa = e6b.atmosphere.pressureAltitude(val[0], val[1]);
          const da = e6b.atmosphere.densityAltitude(pa, val[2]);
          res = `DA: ${Math.round(da)} ft\nPA: ${Math.round(pa)} ft`;
          break;
        case 'TAS_CALC':
          const tas = e6b.performance.calculateTAS(val[0], val[1], val[2]);
          const mach = e6b.atmosphere.machNumber(tas, val[2]);
          res = `TAS: ${Math.round(tas)} kt\nMach: ${mach.toFixed(3)}`;
          break;
        case 'DIST_TIME':
          const time = e6b.navigation.timeEnroute(val[1], val[0]);
          const hours = Math.floor(time);
          const minutes = Math.round((time - hours) * 60);
          res = `${t.results.time}: ${hours}:${minutes.toString().padStart(2, '0')}`;
          break;
        case 'FUEL_BURN':
          const burn = e6b.navigation.fuelBurn(val[0], val[1]);
          res = `${t.results.burn}: ${burn.toFixed(1)} Gal`;
          break;
        case 'CONV_NM_KM':
          res = `${(val[0] * 1.852).toFixed(2)} KM`;
          break;
        case 'CONV_GAL_L':
          res = `${(val[0] * 3.785).toFixed(2)} L`;
          break;
        case 'HDG_GS_CALC':
          const sol = e6b.wind.calculateHeadingAndGS(val[0], val[1], val[2], val[3]);
          res = `HDG: ${Math.round(sol.heading)}°\nGS: ${Math.round(sol.groundSpeed)} kt\nWCA: ${sol.wca.toFixed(1)}°`;
          break;
        case 'X_WIND_CALC':
          const comp = e6b.wind.calculateWindComponents(val[0], val[1], val[2]);
          const type = comp.headwind >= 0 ? t.results.head : t.results.tail;
          res = `${t.results.xwind}: ${Math.round(comp.crosswind)} kt\n${type}: ${Math.abs(Math.round(comp.headwind))} kt`;
          break;
      }
    } catch (e) {
      res = 'ERROR';
    }
    setResult(res);
  };

  // --- MANIPULADOR DE TECLAS ---
  const handlePress = (key: string) => {
    // Teclas de Função (Mapeadas pelos IDs lógicos, não pelos rótulos)
    if (key === 'alt') { setMode('ALT'); setSubFunction('DENSITY_ALT'); resetInputs(); }
    if (key === 'tas') { setMode('SPEED'); setSubFunction('TAS_CALC'); resetInputs(); }
    if (key === 'plan') { setMode('SPEED'); setSubFunction('DIST_TIME'); resetInputs(); }
    if (key === 'flt') { setMode('FUEL'); setSubFunction('FUEL_BURN'); resetInputs(); }
    if (key === 'hdg') { setMode('WIND'); setSubFunction('HDG_GS_CALC'); resetInputs(); }
    if (key === 'wind') { setMode('WIND'); setSubFunction('X_WIND_CALC'); resetInputs(); }
    if (key === 'unit') { setMode('CONV'); setSubFunction('CONV_NM_KM'); resetInputs(); }
    if (key === 'conv') { setMode('CONV'); setSubFunction('CONV_GAL_L'); resetInputs(); }
    if (key === 'menu') { setMode('MENU'); setSubFunction('NONE'); resetInputs(); }

    // Lógica do Cronômetro
    if (key === 'timer') { 
      setMode('TIMER'); 
      setSubFunction('STOPWATCH'); 
      resetInputs(); 
    }

    // Numérico
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(key)) {
      if (subFunction !== 'STOPWATCH') {
        const newInputs = [...inputs];
        if (newInputs[currentInputIndex].length < 8) {
          newInputs[currentInputIndex] += key;
          setInputs(newInputs);
        }
      }
    }

    if (key === 'clr') {
      if (subFunction === 'STOPWATCH') {
        setTimerSeconds(0);
        setIsTimerRunning(false);
      } else {
        const newInputs = [...inputs];
        newInputs[currentInputIndex] = '';
        setInputs(newInputs);
        setResult('');
      }
    }

    if (key === 'enter') {
      if (subFunction === 'STOPWATCH') {
        setIsTimerRunning(!isTimerRunning);
      } else {
        const labels = t.labels[subFunction as keyof typeof t.labels] || [];
        const nextIndex = currentInputIndex + 1;
        if (labels[nextIndex] && labels[nextIndex] !== '') {
          setCurrentInputIndex(nextIndex);
        } else {
          calculate();
        }
      }
    }

    if (key === 'back') {
      if (subFunction !== 'STOPWATCH') {
        const newInputs = [...inputs];
        newInputs[currentInputIndex] = newInputs[currentInputIndex].slice(0, -1);
        setInputs(newInputs);
      }
    }
  };

  const resetInputs = () => {
    setInputs(['', '', '', '']);
    setCurrentInputIndex(0);
    setResult('');
    // Não resetamos o timer aqui para ele poder rodar em background se quiser, 
    // mas por simplicidade, ele pausa se sair do modo.
    setIsTimerRunning(false); 
  };

  // Formata segundos para HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- RENDERIZAÇÃO DA TELA LCD ---
  const renderScreen = () => {
    if (mode === 'MENU') {
      return (
        <div className="flex flex-col h-full justify-center items-center space-y-2">
          <div className="text-sm font-bold text-gray-700">{t.selectMode}</div>
          <div className="grid grid-cols-2 gap-2 w-full text-xs px-2">
            <div className="bg-black/5 p-1 rounded border border-black/10">{t.menu.alt}</div>
            <div className="bg-black/5 p-1 rounded border border-black/10">{t.menu.tas}</div>
            <div className="bg-black/5 p-1 rounded border border-black/10">{t.menu.hdg}</div>
            <div className="bg-black/5 p-1 rounded border border-black/10">{t.menu.wind}</div>
          </div>
        </div>
      );
    }

    if (subFunction === 'STOPWATCH') {
      return (
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-xs font-bold text-gray-500 mb-2">{t.stopwatch}</div>
          <div className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
            {formatTime(timerSeconds)}
          </div>
          <div className="mt-4 text-[10px] text-gray-600 flex flex-col items-center gap-1">
            <span>{t.startStop}</span>
            <span>{t.reset}</span>
          </div>
        </div>
      );
    }

    const labels = t.labels[subFunction as keyof typeof t.labels] || [];

    return (
      <div className="flex flex-col h-full">
        {/* Área de Inputs */}
        <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {labels.map((label, idx) => (
            label && (
              <div 
                key={idx} 
                onClick={() => setCurrentInputIndex(idx)}
                className={`flex justify-between items-center border-b border-gray-600/20 px-1 cursor-pointer ${currentInputIndex === idx ? 'bg-black/10' : ''}`}
              >
                <span className="text-[10px] font-bold text-gray-700 uppercase">{label}:</span>
                <span className="font-mono font-bold text-sm text-gray-900">{inputs[idx] || '-'}</span>
              </div>
            )
          ))}
        </div>

        {/* Área de Resultado */}
        <div className="mt-2 border-t-2 border-gray-700 pt-1 bg-black/5 rounded px-1 h-24 min-h-[6rem] flex flex-col justify-end relative">
          <div className="absolute inset-0 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
            <pre className="text-sm font-bold text-black whitespace-pre-wrap leading-tight text-right">
              {result || t.pressEnter}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center p-4 md:p-8 bg-slate-100 min-h-[80vh]">
      <div className="relative w-[340px] h-[680px] bg-gray-900 rounded-[36px] shadow-2xl border-4 border-gray-800 flex flex-col p-5 select-none ring-1 ring-white/10">

        {/* Header Marca e Idioma */}
        <div className="flex justify-between items-start mb-4">
          <div className="text-left">
            <h1 className="text-gray-500 font-bold tracking-widest text-[10px]">ELECTRONIC FLIGHT COMPUTER</h1>
            <div className="text-blue-500 font-black text-xs tracking-[0.3em] mt-1">LOVE TO FLY</div>
          </div>

          {/* Botão de Idioma */}
          <button 
            onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')}
            className="bg-gray-800 border border-gray-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            {lang === 'EN' ? '🇺🇸 EN' : '🇧🇷 PT'}
          </button>
        </div>

        {/* TELA LCD */}
        <div className="w-full h-64 bg-[#9ea792] rounded-lg border-[3px] border-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] mb-5 p-3 font-mono relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full text-gray-900">
            <div className="flex justify-between text-[10px] font-bold border-b border-gray-800/20 pb-1 mb-1 opacity-70">
              <span>{t.mode}: {subFunction.replace('_', ' ')}</span>
              <span>BAT OK</span>
            </div>
            {renderScreen()}
          </div>
        </div>

        {/* TECLADO DE FUNÇÕES */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Linha 1 */}
          <E6BButton label={t.buttons.flt} onClick={() => handlePress('flt')} color="gray" />
          <E6BButton label={t.buttons.plan} onClick={() => handlePress('plan')} color="gray" />
          <E6BButton label={t.buttons.timer} onClick={() => handlePress('timer')} color="gray" />
          <E6BButton label={t.buttons.menu} onClick={() => handlePress('menu')} color="gray" />

          {/* Linha 2 */}
          <E6BButton label={t.buttons.wind} onClick={() => handlePress('wind')} color="orange" />
          <E6BButton label={t.buttons.hdg} onClick={() => handlePress('hdg')} color="orange" />
          <E6BButton label={t.buttons.tas} onClick={() => handlePress('tas')} color="orange" />
          <E6BButton label={t.buttons.alt} onClick={() => handlePress('alt')} color="orange" />
        </div>

        {/* TECLADO NUMÉRICO */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          <E6BButton label={t.buttons.unit} onClick={() => handlePress('unit')} color="gray" />
          <E6BButton label={t.buttons.conv} onClick={() => handlePress('conv')} color="gray" />
          <E6BButton label={t.buttons.back} onClick={() => handlePress('back')} color="red" />
          <E6BButton label={t.buttons.clr} onClick={() => handlePress('clr')} color="red" />

          <E6BButton label="7" onClick={() => handlePress('7')} />
          <E6BButton label="8" onClick={() => handlePress('8')} />
          <E6BButton label="9" onClick={() => handlePress('9')} />
          <E6BButton label="÷" onClick={() => handlePress('/')} color="blue" />

          <E6BButton label="4" onClick={() => handlePress('4')} />
          <E6BButton label="5" onClick={() => handlePress('5')} />
          <E6BButton label="6" onClick={() => handlePress('6')} />
          <E6BButton label="×" onClick={() => handlePress('*')} color="blue" />

          <E6BButton label="1" onClick={() => handlePress('1')} />
          <E6BButton label="2" onClick={() => handlePress('2')} />
          <E6BButton label="3" onClick={() => handlePress('3')} />
          <E6BButton label="-" onClick={() => handlePress('-')} color="blue" />

          <E6BButton label="0" onClick={() => handlePress('0')} />
          <E6BButton label="." onClick={() => handlePress('.')} />
          <E6BButton label={t.buttons.enter} onClick={() => handlePress('enter')} color="orange" span={1} />
          <E6BButton label="+" onClick={() => handlePress('+')} color="blue" />
        </div>
      </div>
    </div>
  );
}

// Sub-componente de Botão (Ajustado para receber string no label)
function E6BButton({ label, onClick, color = 'black', span = 1 }: { label: string, onClick: () => void, color?: 'black' | 'gray' | 'orange' | 'blue' | 'red', span?: number }) {
  const colors = {
    black: 'bg-gray-800 text-white shadow-[0_4px_0_rgb(31,41,55)] border-gray-700 hover:bg-gray-700',
    gray: 'bg-gray-600 text-white shadow-[0_4px_0_rgb(75,85,99)] border-gray-500 hover:bg-gray-500',
    orange: 'bg-orange-600 text-white shadow-[0_4px_0_rgb(194,65,12)] border-orange-500 hover:bg-orange-500',
    blue: 'bg-blue-900 text-white shadow-[0_4px_0_rgb(30,58,138)] border-blue-800 hover:bg-blue-800',
    red: 'bg-red-800 text-white shadow-[0_4px_0_rgb(153,27,27)] border-red-700 hover:bg-red-700',
  };
  return (
    <button onClick={onClick} className={`${colors[color]} col-span-${span} h-12 rounded-lg font-bold text-[11px] md:text-sm active:shadow-none active:translate-y-[4px] transition-all border-t flex items-center justify-center uppercase`}>
      {label}
    </button>
  );
}
