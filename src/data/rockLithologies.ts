/**
 * Catálogo Geológico Estándar de Litologías y Resistencia a la Compresión Uniaxial (UCS / σci)
 * Basado en las tablas de referencia de:
 * - ISRM (1981): International Society for Rock Mechanics - Suggested Methods
 * - Bieniawski (1989): Engineering Rock Mass Classifications
 * - Hoek & Brown (1997, 2019): Hoek-Brown Failure Criterion mi constants
 */

export interface GeologicalRockType {
  id: string;
  name: string;
  group: 'Ígnea Plutónica' | 'Ígnea Volcánica' | 'Sedimentaria' | 'Metamórfica' | 'Personalizada';
  ucsMinMpa: number;
  ucsTypMpa: number;
  ucsMaxMpa: number;
  hoekMi: number;
  isrmGrade: string; // ej: R5 (100 - 250 MPa)
  fieldHammerTest: string; // Criterio de campo con piqueta/martillo
  densityGcm3: number;
  description: string;
  isCustom?: boolean;
}

export const GEOLOGICAL_ROCK_CATALOG: GeologicalRockType[] = [
  // ÍGNEAS PLUTÓNICAS
  {
    id: 'granito',
    name: 'Granito',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 130,
    ucsTypMpa: 190,
    ucsMaxMpa: 270,
    hoekMi: 32,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Requiere muchos golpes de piqueta geológica para romper una probeta; sonido metálico agudo.',
    densityGcm3: 2.65,
    description: 'Roca plutónica félsica con textura granular holocristalina compuesta por cuarzo, feldespato potásico y plagioclasa.',
  },
  {
    id: 'granodiorita',
    name: 'Granodiorita',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 120,
    ucsTypMpa: 180,
    ucsMaxMpa: 250,
    hoekMi: 29,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Resistente a múltiples impactos directos de piqueta geológica.',
    densityGcm3: 2.70,
    description: 'Roca ígnea intrusiva con mayor proporción de plagioclasa que feldespato potásico, biotita y anfíbol.',
  },
  {
    id: 'diorita',
    name: 'Diorita',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 110,
    ucsTypMpa: 170,
    ucsMaxMpa: 240,
    hoekMi: 25,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Sonido sordo metálico al golpear, requiere varios golpes firmes con martillo geológico.',
    densityGcm3: 2.85,
    description: 'Roca intermedia plutónica compuesta por plagioclasa sódico-cálcica y minerales máficos.',
  },
  {
    id: 'gabro',
    name: 'Gabro',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 140,
    ucsTypMpa: 210,
    ucsMaxMpa: 290,
    hoekMi: 27,
    isrmGrade: 'R5-R6: Muy a Extremadamente Resistente',
    fieldHammerTest: 'Muy tenaz y denso; salta astillas de roca únicamente bajo impactos intensos.',
    densityGcm3: 3.0,
    description: 'Roca básica plutónica rica en piroxeno y plagioclasa cálcica, de alta densidad y dureza.',
  },
  {
    id: 'sienita',
    name: 'Sienita',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 100,
    ucsTypMpa: 160,
    ucsMaxMpa: 220,
    hoekMi: 19,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Fractura concoide a irregular ante golpes repetidos con piqueta.',
    densityGcm3: 2.68,
    description: 'Roca ígnea intermedia sin cuarzo libre relevante, dominada por feldespatos alcalinos.',
  },
  {
    id: 'peridotita',
    name: 'Peridotita',
    group: 'Ígnea Plutónica',
    ucsMinMpa: 130,
    ucsTypMpa: 200,
    ucsMaxMpa: 280,
    hoekMi: 25,
    isrmGrade: 'R5: Muy Resistente',
    fieldHammerTest: 'Roca ultramáfica muy pesada; difícil de fracturar en muestra de mano.',
    densityGcm3: 3.25,
    description: 'Roca ultramáfica compuesta primordialmente por olivino y piroxeno.',
  },

  // ÍGNEAS VOLCÁNICAS
  {
    id: 'basalto',
    name: 'Basalto',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 150,
    ucsTypMpa: 230,
    ucsMaxMpa: 320,
    hoekMi: 25,
    isrmGrade: 'R5-R6: Extremadamente Resistente (>250 MPa)',
    fieldHammerTest: 'Se requieren más de 10 impactos concentrados con piqueta; las esquinas pueden despostillarse.',
    densityGcm3: 2.9,
    description: 'Roca volcánica máfica de matriz afanítica densa y dura, comúnmente con disyunción columnar.',
  },
  {
    id: 'andesita',
    name: 'Andesita',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 100,
    ucsTypMpa: 165,
    ucsMaxMpa: 240,
    hoekMi: 25,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Resistente a impactos; emite sonido metálico claro al ser percutida.',
    densityGcm3: 2.65,
    description: 'Roca volcánica intermedia típica de la cordillera andina, comúnmente porfídica con fenocristales de plagioclasa.',
  },
  {
    id: 'riolita',
    name: 'Riolita',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 120,
    ucsTypMpa: 185,
    ucsMaxMpa: 260,
    hoekMi: 25,
    isrmGrade: 'R5: Muy Resistente',
    fieldHammerTest: 'Fractura subconcoidal de bordes afilados bajo impacto.',
    densityGcm3: 2.55,
    description: 'Equivalente volcánico del granito, de color claro y sílice abundante.',
  },
  {
    id: 'dacita',
    name: 'Dacita',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 110,
    ucsTypMpa: 170,
    ucsMaxMpa: 230,
    hoekMi: 25,
    isrmGrade: 'R5: Muy Resistente',
    fieldHammerTest: 'Exige varios golpes vigorosos con martillo para fragmentarse.',
    densityGcm3: 2.6,
    description: 'Roca volcánica intermedia a félsica con fenocristales de cuarzo y plagioclasa.',
  },
  {
    id: 'toba-volcanica',
    name: 'Toba Volcánica',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 15,
    ucsTypMpa: 45,
    ucsMaxMpa: 80,
    hoekMi: 13,
    isrmGrade: 'R2-R3: Débil a Moderadamente Resistente (25 - 50 MPa)',
    fieldHammerTest: 'Se fragmenta con 1 o 2 golpes firmes de martillo; muescas superficiales con cortaplumas.',
    densityGcm3: 2.1,
    description: 'Roca piroclástica consolidada formada por cenizas y fragmentos vítreos volcánicos.',
  },
  {
    id: 'brecha-volcanica',
    name: 'Brecha Volcánica',
    group: 'Ígnea Volcánica',
    ucsMinMpa: 30,
    ucsTypMpa: 70,
    ucsMaxMpa: 120,
    hoekMi: 19,
    isrmGrade: 'R3-R4: Moderadamente a Resistente (50 - 100 MPa)',
    fieldHammerTest: 'Se rompe preferentemente por la matriz de cementación entre los clastos angulosos.',
    densityGcm3: 2.45,
    description: 'Roca piroclástica con clastos angulosos mayores a 2 mm englobados en matriz volcánica.',
  },

  // SEDIMENTARIAS
  {
    id: 'caliza-masiva',
    name: 'Caliza Masiva',
    group: 'Sedimentaria',
    ucsMinMpa: 60,
    ucsTypMpa: 115,
    ucsMaxMpa: 180,
    hoekMi: 12,
    isrmGrade: 'R4-R5: Resistente a Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Requiere más de 3 golpes firmes de piqueta; efervesce vivamente con HCl diluido.',
    densityGcm3: 2.68,
    description: 'Roca sedimentaria carbonatada de carbonato de calcio denso con escasas oclusiones.',
  },
  {
    id: 'arenisca-cuarzo',
    name: 'Arenisca de Cuarzo',
    group: 'Sedimentaria',
    ucsMinMpa: 50,
    ucsTypMpa: 95,
    ucsMaxMpa: 150,
    hoekMi: 17,
    isrmGrade: 'R3-R4: Moderada a Resistente (50 - 100 MPa)',
    fieldHammerTest: 'Se rompe con 2 a 3 golpes firmes; textura áspera al tacto tipo lija.',
    densityGcm3: 2.5,
    description: 'Roca sedimentaria detrítica formada por granos de cuarzo bien cementados por sílice o calcita.',
  },
  {
    id: 'dolomita',
    name: 'Dolomita',
    group: 'Sedimentaria',
    ucsMinMpa: 80,
    ucsTypMpa: 140,
    ucsMaxMpa: 210,
    hoekMi: 9,
    isrmGrade: 'R4-R5: Resistente a Muy Resistente',
    fieldHammerTest: 'Requiere varios golpes directos con piqueta; efervescencia débil con HCl en frío.',
    densityGcm3: 2.82,
    description: 'Roca carbonatada rica en magnesio CaMg(CO3)2, más dura y tenaz que la caliza ordinaria.',
  },
  {
    id: 'lutita-arcillita',
    name: 'Lutita / Arcillita',
    group: 'Sedimentaria',
    ucsMinMpa: 10,
    ucsTypMpa: 35,
    ucsMaxMpa: 70,
    hoekMi: 6,
    isrmGrade: 'R2-R3: Débil a Moderadamente Resistente (25 - 50 MPa)',
    fieldHammerTest: 'Se exfolia o parte fácilmente con un golpe firme de piqueta; puede rayarse con cortaplumas.',
    densityGcm3: 2.35,
    description: 'Roca sedimentaria de grano muy fino compuesta por partículas arcillosas y láminas de estratificación.',
  },
  {
    id: 'limolita',
    name: 'Limolita',
    group: 'Sedimentaria',
    ucsMinMpa: 25,
    ucsTypMpa: 60,
    ucsMaxMpa: 105,
    hoekMi: 7,
    isrmGrade: 'R3: Moderadamente Resistente (25 - 50 MPa)',
    fieldHammerTest: 'Se rompe con facilidad al martillear; no se raya fácilmente con la uña.',
    densityGcm3: 2.45,
    description: 'Roca sedimentaria clástica con tamaño de grano entre arenisca y lutita.',
  },
  {
    id: 'conglomerado',
    name: 'Conglomerado',
    group: 'Sedimentaria',
    ucsMinMpa: 35,
    ucsTypMpa: 75,
    ucsMaxMpa: 130,
    hoekMi: 21,
    isrmGrade: 'R3-R4: Moderada a Resistente',
    fieldHammerTest: 'Los clastos redondeados pueden desprenderse de la matriz con golpes sucesivos.',
    densityGcm3: 2.55,
    description: 'Roca sedimentaria compuesta por cantos rodados consolidados en matriz arenosa o arcillosa.',
  },
  {
    id: 'yeso-anhidrita',
    name: 'Yeso / Anhidrita',
    group: 'Sedimentaria',
    ucsMinMpa: 15,
    ucsTypMpa: 30,
    ucsMaxMpa: 60,
    hoekMi: 8,
    isrmGrade: 'R2: Débil (5 - 25 MPa)',
    fieldHammerTest: 'Se raya fácilmente con la uña o cortaplumas; se fractura con un solo golpe suave.',
    densityGcm3: 2.3,
    description: 'Roca evaporítica blanda compuesta por sulfato de calcio dihidratado.',
  },
  {
    id: 'travertino',
    name: 'Travertino',
    group: 'Sedimentaria',
    ucsMinMpa: 25,
    ucsTypMpa: 55,
    ucsMaxMpa: 90,
    hoekMi: 10,
    isrmGrade: 'R3: Moderadamente Resistente',
    fieldHammerTest: 'Se fractura a lo largo de las cavidades porosas bajo impacto de piqueta.',
    densityGcm3: 2.4,
    description: 'Roca carbonatada porosa formada por precipitación química de carbonato de calcio en manantiales.',
  },
  {
    id: 'carbon-antracita',
    name: 'Carbón / Antracita',
    group: 'Sedimentaria',
    ucsMinMpa: 5,
    ucsTypMpa: 18,
    ucsMaxMpa: 35,
    hoekMi: 7,
    isrmGrade: 'R1-R2: Muy Débil a Débil (5 - 25 MPa)',
    fieldHammerTest: 'Se desmorona y astilla fácilmente con piqueta; mancha ligeramente.',
    densityGcm3: 1.45,
    description: 'Roca sedimentaria orgánica combustible rica en carbono.',
  },

  // METAMÓRFICAS
  {
    id: 'cuarcita',
    name: 'Cuarcita',
    group: 'Metamórfica',
    ucsMinMpa: 180,
    ucsTypMpa: 260,
    ucsMaxMpa: 360,
    hoekMi: 20,
    isrmGrade: 'R6: Extremadamente Resistente (>250 MPa)',
    fieldHammerTest: 'Desprende chispas y sonido metálico agudo ante el martillo; casi imposible romper sin masa pesada.',
    densityGcm3: 2.65,
    description: 'Roca metamórfica constituida casi exclusivamente por cuarzo recristalizado extremadamente tenaz.',
  },
  {
    id: 'gneis',
    name: 'Gneis',
    group: 'Metamórfica',
    ucsMinMpa: 90,
    ucsTypMpa: 155,
    ucsMaxMpa: 230,
    hoekMi: 28,
    isrmGrade: 'R5: Muy Resistente (100 - 250 MPa)',
    fieldHammerTest: 'Se rompe con varios golpes fuertes; foliación bandeada clara (gneissic banding).',
    densityGcm3: 2.75,
    description: 'Roca de alto grado metamórfico con bandas alternas de minerales claros (cuarzo/feldespato) y oscuros.',
  },
  {
    id: 'esquisto',
    name: 'Esquisto Micáceo',
    group: 'Metamórfica',
    ucsMinMpa: 35,
    ucsTypMpa: 70,
    ucsMaxMpa: 125,
    hoekMi: 12,
    isrmGrade: 'R3-R4: Moderadamente Resistente (anisotrópico)',
    fieldHammerTest: 'Se exfolia fácilmente en láminas a lo largo de los planos de esquistosidad micácea.',
    densityGcm3: 2.7,
    description: 'Roca metamórfica con marcada foliación y abundancia de micas (biotita/moscovita).',
  },
  {
    id: 'pizarra',
    name: 'Pizarra',
    group: 'Metamórfica',
    ucsMinMpa: 55,
    ucsTypMpa: 110,
    ucsMaxMpa: 175,
    hoekMi: 7,
    isrmGrade: 'R4: Resistente (50 - 100 MPa paralela / >100 MPa perpendicular)',
    fieldHammerTest: 'Se parte en lajas planas muy delgadas al golpear en la dirección del clivaje pizarroso.',
    densityGcm3: 2.72,
    description: 'Roca metamórfica de grano muy fino con clivaje planar perfecto.',
  },
  {
    id: 'filita',
    name: 'Filita',
    group: 'Metamórfica',
    ucsMinMpa: 30,
    ucsTypMpa: 65,
    ucsMaxMpa: 110,
    hoekMi: 7,
    isrmGrade: 'R3: Moderadamente Resistente',
    fieldHammerTest: 'Presenta brillo sedoso y se divide en láminas onduladas bajo impacto.',
    densityGcm3: 2.7,
    description: 'Roca metamórfica intermedia entre pizarra y esquisto, con brillo sericítico característico.',
  },
  {
    id: 'marmol',
    name: 'Mármol',
    group: 'Metamórfica',
    ucsMinMpa: 65,
    ucsTypMpa: 115,
    ucsMaxMpa: 170,
    hoekMi: 9,
    isrmGrade: 'R4-R5: Resistente a Muy Resistente',
    fieldHammerTest: 'Requiere más de dos golpes firmes con martillo; efervesce con ácido en polvo.',
    densityGcm3: 2.71,
    description: 'Roca metamórfica recristalizada a partir de calizas o dolomías.',
  },
  {
    id: 'anfibolita',
    name: 'Anfibolita',
    group: 'Metamórfica',
    ucsMinMpa: 120,
    ucsTypMpa: 195,
    ucsMaxMpa: 280,
    hoekMi: 26,
    isrmGrade: 'R5: Muy Resistente',
    fieldHammerTest: 'Muy tenaz, requiere fuertes golpes repetidos para fracturarse.',
    densityGcm3: 3.0,
    description: 'Roca metamórfica compuesta primordialmente por anfíbol (hornblenda) y plagioclasa.',
  },
  {
    id: 'serpentinita',
    name: 'Serpentinita',
    group: 'Metamórfica',
    ucsMinMpa: 40,
    ucsTypMpa: 85,
    ucsMaxMpa: 140,
    hoekMi: 13,
    isrmGrade: 'R3-R4: Moderada a Resistente',
    fieldHammerTest: 'Tacto ceroso/jabonoso, rayable con navaja de acero; fractura concoide a astillosa.',
    densityGcm3: 2.6,
    description: 'Roca metamórfica producida por la hidratación de peridotitas rica en minerales del grupo serpentina.',
  },
];

/**
 * Weathering modifier to calibrate estimated UCS within typical min-max range
 */
export type WeatheringDegree =
  | 'Sana / Inalterada (W1)'
  | 'Ligeramente Meteorizada (W2)'
  | 'Moderadamente Meteorizada (W3)'
  | 'Muy Meteorizada (W4)'
  | 'Completamente Descompuesta (W5)';

/**
 * Calculates Bieniawski RMR (1989) Parameter A1 rating based on UCS (MPa)
 * Bieniawski Table 1 - Parameter 1 (Strength of intact rock material)
 */
export function getBieniawskiUCSRating(ucsMpa: number): number {
  if (ucsMpa > 250) return 15;
  if (ucsMpa >= 100) return 12;
  if (ucsMpa >= 50) return 7;
  if (ucsMpa >= 25) return 4;
  if (ucsMpa >= 5) return 2;
  if (ucsMpa >= 1) return 1;
  return 0;
}

/**
 * Returns ISRM (1981) classification grade based on UCS (MPa)
 */
export function getISRMGrade(ucsMpa: number): {
  grade: 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
  label: string;
  fieldId: string;
} {
  if (ucsMpa > 250) {
    return {
      grade: 'R6',
      label: 'Extremadamente Resistente (>250 MPa)',
      fieldId: 'Solo despostillable con martillo geológico pesado. Probetas de cuarcita fresca o basalto denso.',
    };
  }
  if (ucsMpa >= 100) {
    return {
      grade: 'R5',
      label: 'Muy Resistente (100 - 250 MPa)',
      fieldId: 'Requiere muchos golpes directos con piqueta geológica para romperse. Granito, diorita, caliza densa.',
    };
  }
  if (ucsMpa >= 50) {
    return {
      grade: 'R4',
      label: 'Resistente (50 - 100 MPa)',
      fieldId: 'Requiere más de un golpe firme con martillo geológico. Areniscas cuarcíticas, pizarras compactas.',
    };
  }
  if (ucsMpa >= 25) {
    return {
      grade: 'R3',
      label: 'Moderadamente Resistente (25 - 50 MPa)',
      fieldId: 'Se rompe con un golpe firme de piqueta; no se raya con cortaplumas común.',
    };
  }
  if (ucsMpa >= 5) {
    return {
      grade: 'R2',
      label: 'Débil (5 - 25 MPa)',
      fieldId: 'Se descascara con navaja de acero; se fragmenta con un golpe leve de martillo.',
    };
  }
  if (ucsMpa >= 1) {
    return {
      grade: 'R1',
      label: 'Muy Débil (1 - 5 MPa)',
      fieldId: 'Se desmenuza con la punta de la navaja geológica; huella marcada al clavar.',
    };
  }
  return {
    grade: 'R0',
    label: 'Extremadamente Débil (< 1 MPa)',
    fieldId: 'Se marca con la uña del pulgar.',
  };
}

/**
 * Calculates estimated UCS taking into account the rock base values and weathering adjustment
 */
export function calculateEffectiveUCS(
  baseRock: GeologicalRockType,
  weathering: WeatheringDegree = 'Ligeramente Meteorizada (W2)',
  customUcsMpa?: number
): {
  ucsMpa: number;
  minMpa: number;
  typicalMpa: number;
  maxMpa: number;
  r1Rating: number;
  isrmGrade: string;
  isrmGradeCode: string;
  fieldIdentification: string;
  weatheringFactor: number;
} {
  // Weathering reduction factors:
  // W1 (Sana): 1.0 (approaches Max)
  // W2 (Ligera): 0.9 (approaches Typical)
  // W3 (Moderada): 0.65 (approaches Min)
  // W4 (Muy meteorizada): 0.4 (below Min)
  // W5 (Descompuesta): 0.2
  let factor = 0.9;
  if (weathering.includes('W1')) factor = 1.05;
  else if (weathering.includes('W2')) factor = 0.95;
  else if (weathering.includes('W3')) factor = 0.65;
  else if (weathering.includes('W4')) factor = 0.40;
  else if (weathering.includes('W5')) factor = 0.20;

  let calculatedUcs: number;
  if (customUcsMpa && customUcsMpa > 0) {
    calculatedUcs = customUcsMpa;
  } else {
    calculatedUcs = Math.round(baseRock.ucsTypMpa * factor);
    // Keep in reasonable range
    calculatedUcs = Math.max(2, calculatedUcs);
  }

  const isrm = getISRMGrade(calculatedUcs);
  const r1 = getBieniawskiUCSRating(calculatedUcs);

  return {
    ucsMpa: calculatedUcs,
    minMpa: baseRock.ucsMinMpa,
    typicalMpa: baseRock.ucsTypMpa,
    maxMpa: baseRock.ucsMaxMpa,
    r1Rating: r1,
    isrmGrade: isrm.label,
    isrmGradeCode: isrm.grade,
    fieldIdentification: isrm.fieldId,
    weatheringFactor: factor,
  };
}

const CUSTOM_LITHOLOGIES_STORAGE_KEY = 'geoscan_custom_lithologies_v1';

export function getCustomLithologies(): GeologicalRockType[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LITHOLOGIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomLithology(rock: {
  name: string;
  group: 'Ígnea Plutónica' | 'Ígnea Volcánica' | 'Sedimentaria' | 'Metamórfica' | 'Personalizada';
  ucsMinMpa: number;
  ucsTypMpa: number;
  ucsMaxMpa: number;
  description?: string;
  hoekMi?: number;
}): GeologicalRockType {
  const current = getCustomLithologies();
  const id = `custom-rock-${Date.now()}`;

  let isrmGrade = 'R4: Resistente (50 - 100 MPa)';
  if (rock.ucsTypMpa > 250) isrmGrade = 'R6: Extremadamente Resistente (>250 MPa)';
  else if (rock.ucsTypMpa >= 100) isrmGrade = 'R5: Muy Resistente (100 - 250 MPa)';
  else if (rock.ucsTypMpa >= 50) isrmGrade = 'R4: Resistente (50 - 100 MPa)';
  else if (rock.ucsTypMpa >= 25) isrmGrade = 'R3: Medianamente Resistente (25 - 50 MPa)';
  else if (rock.ucsTypMpa >= 5) isrmGrade = 'R2: Roca Blanda (5 - 25 MPa)';
  else isrmGrade = 'R1: Roca Muy Blanda (1 - 5 MPa)';

  const newRock: GeologicalRockType = {
    id,
    name: rock.name.trim(),
    group: rock.group,
    ucsMinMpa: rock.ucsMinMpa,
    ucsTypMpa: rock.ucsTypMpa,
    ucsMaxMpa: rock.ucsMaxMpa,
    hoekMi: rock.hoekMi || 18,
    isrmGrade,
    fieldHammerTest: `Resistencia personalizada asignada: ${rock.ucsTypMpa} MPa [${rock.ucsMinMpa} - ${rock.ucsMaxMpa} MPa].`,
    densityGcm3: 2.7,
    description: rock.description?.trim() || `Litología personalizada agregada por el ingeniero (${rock.name}).`,
    isCustom: true,
  };

  current.unshift(newRock);
  try {
    localStorage.setItem(CUSTOM_LITHOLOGIES_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving custom lithology:', e);
  }
  return newRock;
}

export function deleteCustomLithology(id: string): GeologicalRockType[] {
  const current = getCustomLithologies();
  const next = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(CUSTOM_LITHOLOGIES_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Error deleting custom lithology:', e);
  }
  return next;
}

export function getAllLithologies(): GeologicalRockType[] {
  const custom = getCustomLithologies();
  return [...custom, ...GEOLOGICAL_ROCK_CATALOG];
}

/**
 * Searches rock catalog by query string
 */
export function findRockInCatalog(query: string): GeologicalRockType | undefined {
  const q = query.toLowerCase().trim();
  const all = getAllLithologies();
  return all.find(
    (r) =>
      r.id.toLowerCase() === q ||
      r.name.toLowerCase() === q ||
      r.name.toLowerCase().includes(q) ||
      q.includes(r.name.toLowerCase())
  );
}
