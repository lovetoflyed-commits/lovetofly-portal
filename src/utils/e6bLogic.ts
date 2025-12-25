// src/utils/e6bLogic.ts

// --- CONVERSÕES ---
export const convert = {
  nmToSm: (nm: number) => nm * 1.15078,
  smToNm: (sm: number) => sm / 1.15078,
  nmToKm: (nm: number) => nm * 1.852,
  kmToNm: (km: number) => km / 1.852,
  galToLiters: (gal: number) => gal * 3.78541,
  litersToGal: (liters: number) => liters / 3.78541,
  ftToMeters: (ft: number) => ft * 0.3048,
  metersToFt: (m: number) => m / 0.3048,
  cToF: (c: number) => (c * 9/5) + 32,
  fToC: (f: number) => (f - 32) * 5/9,
  lbsToKg: (lbs: number) => lbs * 0.453592,
  kgToLbs: (kg: number) => kg / 0.453592,
};

// --- ALTITUDE E ATMOSFERA ---
export const atmosphere = {
  // Calcula Altitude Pressão baseada no QNH (inHg)
  pressureAltitude: (indicatedAlt: number, qnh: number) => {
    return indicatedAlt + (29.92 - qnh) * 1000;
  },

  // Calcula Altitude Densidade
  densityAltitude: (pressureAlt: number, tempC: number) => {
    const isaTemp = 15 - (2 * (pressureAlt / 1000)); // Temp ISA naquela altitude
    return pressureAlt + (120 * (tempC - isaTemp));
  },

  // Calcula Mach Number (simplificado para baixas altitudes/subsom)
  machNumber: (tas: number, tempC: number) => {
    // Velocidade do som (a) em nós = 39 * sqrt(Temp Kelvin)
    const tempK = tempC + 273.15;
    const speedOfSound = 38.967854 * Math.sqrt(tempK); 
    return tas / speedOfSound;
  }
};

// --- VELOCIDADE E TEMPO (Lado A Clássico) ---
export const navigation = {
  // Velocidade = Distância / Tempo
  groundSpeed: (distNM: number, timeHours: number) => distNM / timeHours,

  // Tempo = Distância / Velocidade
  timeEnroute: (distNM: number, speedKts: number) => distNM / speedKts,

  // Distância = Velocidade * Tempo
  distance: (speedKts: number, timeHours: number) => speedKts * timeHours,

  // Combustível Necessário
  fuelBurn: (gph: number, timeHours: number) => gph * timeHours,

  // Autonomia (Endurance)
  endurance: (fuelGal: number, gph: number) => fuelGal / gph,
};

// --- CÁLCULO DE TAS (True Airspeed) ---
export const performance = {
  calculateTAS: (cas: number, pressureAlt: number, tempC: number) => {
    // Método prático E6B:
    // 1. Achar Densidade Altitude primeiro
    // 2. Usar fator de correção aproximado: TAS = CAS * (1 + (DA / 1000) * 0.02)
    const da = atmosphere.densityAltitude(pressureAlt, tempC);
    return cas * (1 + (da / 1000) * 0.02); 
  }
};

// --- CÁLCULOS DE VENTO (Lado B) ---
export const wind = {
  toRad: (deg: number) => (deg * Math.PI) / 180,
  toDeg: (rad: number) => (rad * 180) / Math.PI,

  // 1. Calcular Proa (Heading) e Velocidade Solo (GS)
  // Inputs: Curso Desejado (Course), TAS, Direção do Vento, Velocidade do Vento
  calculateHeadingAndGS: (course: number, tas: number, windDir: number, windSpd: number) => {
    const radCourse = (course * Math.PI) / 180;
    const radWindDir = (windDir * Math.PI) / 180;

    // Ângulo do vento relativo ao curso
    // Se o vento vem da direita (ex: Curso 90, Vento 135), o ângulo é positivo.
    const windAngle = radWindDir - radCourse;

    // Componente de Vento Cruzado (X-Wind)
    // Usamos seno positivo. Se vento vem da direita, seno é positivo.
    const crossWind = windSpd * Math.sin(windAngle); 

    // WCA em radianos
    const wcaRad = Math.asin(crossWind / tas);
    const wcaDeg = (wcaRad * 180) / Math.PI;

    // Proa Verdadeira (Heading) = Curso + WCA
    // Se o vento vem da direita (WCA positivo), somamos para virar o nariz para o vento.
    let heading = course + wcaDeg;

    // Normalizar para 0-360
    heading = (heading + 360) % 360;

    // Velocidade Solo (GS)
    // GS = TAS * cos(WCA) - Headwind
    // Headwind component = WindSpd * cos(WindAngle)
    const headWind = windSpd * Math.cos(windAngle);
    const groundSpeed = (tas * Math.cos(wcaRad)) - headWind;

    return {
      heading: heading,
      groundSpeed: groundSpeed,
      wca: wcaDeg
    };
  },

  // 2. Calcular Componentes de Vento (Pouso)
  calculateWindComponents: (runwayHdg: number, windDir: number, windSpd: number) => {
    const angleDiff = (windDir - runwayHdg) * (Math.PI / 180);
    const crosswind = Math.abs(windSpd * Math.sin(angleDiff));
    const headwind = windSpd * Math.cos(angleDiff);
    return { crosswind, headwind };
  }
};
