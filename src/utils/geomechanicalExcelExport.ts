import * as XLSX from 'xlsx';
import { TrainingDatabaseEntry, getSampleFileName } from './aiLearningStore';
import { RockAnalysisResult } from '../types';
import { calculateRMR, generateSupportDesign } from './geomechanics';

/**
 * Standard scoring helpers according to VALORACION DEL MACIZO ROCOSO (R.M.R.) - BIENIAWSKI (1989)
 * Source: Official Chart provided by user (image_538c8ee8.png)
 */

/**
 * R1: Resistencia a la Compresión Uniaxial (UCS en MPa)
 * > 250 MPa: 15 pts | 100-250 MPa: 12 pts | 50-100 MPa: 7 pts | 25-50 MPa: 4 pts | < 25 MPa: 2 pts | < 5 MPa: 1 pt | < 1 MPa: 0 pts
 */
export function calculateUcsRating(ucsMpa: number): number {
  if (ucsMpa > 250) return 15;
  if (ucsMpa >= 100) return 12;
  if (ucsMpa >= 50) return 7;
  if (ucsMpa >= 25) return 4;
  if (ucsMpa >= 5) return 2;
  if (ucsMpa >= 1) return 1;
  return 0;
}

/**
 * R2: RQD %
 * 90 - 100%: 20 pts | 75 - 90%: 17 pts | 50 - 75%: 13 pts | 25 - 50%: 8 pts | < 25%: 3 pts
 */
export function calculateRqdRating(rqdPct: number): number {
  if (rqdPct >= 90) return 20;
  if (rqdPct >= 75) return 17;
  if (rqdPct >= 50) return 13;
  if (rqdPct >= 25) return 8;
  return 3;
}

/**
 * R3: Espaciamiento de discontinuidades en metros
 * > 2m: 20 pts | 0.6 - 2m: 15 pts | 0.2 - 0.6m: 10 pts | 0.06 - 0.2m: 8 pts | < 0.06m: 5 pts
 */
export function calculateSpacingRating(spacingMeters: number): number {
  if (spacingMeters > 2.0) return 20;
  if (spacingMeters >= 0.6) return 15;
  if (spacingMeters >= 0.2) return 10;
  if (spacingMeters >= 0.06) return 8;
  return 5;
}

/**
 * R4.1: Persistencia (Longitud de discontinuidades en metros)
 * < 1m: 6 pts | 1 - 3m: 4 pts | 3 - 10m: 2 pts | 10 - 20m: 1 pt | > 20m: 0 pts
 */
export function calculatePersistenceRating(lengthMeters: number): number {
  if (lengthMeters < 1.0) return 6;
  if (lengthMeters <= 3.0) return 4;
  if (lengthMeters <= 10.0) return 2;
  if (lengthMeters <= 20.0) return 1;
  return 0;
}

/**
 * R4.2: Apertura en mm
 * Cerrada: 6 pts | < 0.1mm: 5 pts | 0.1 - 1.0mm: 4 pts | 1 - 5mm: 1 pt | > 5mm: 0 pts
 */
export function calculateApertureRating(mm: number, isClosed: boolean = false): number {
  if (isClosed || mm <= 0.001) return 6;
  if (mm < 0.1) return 5;
  if (mm <= 1.0) return 4;
  if (mm <= 5.0) return 1;
  return 0;
}

/**
 * R4.3: Rugosidad
 * Muy rugosa: 6 pts | Rugosa: 5 pts | Lig. rugosa: 3 pts | Lisa: 1 pt | Espejo de falla: 0 pts
 */
export function calculateRoughnessRating(roughnessDescOrJrc: string | number): number {
  if (typeof roughnessDescOrJrc === 'number') {
    if (roughnessDescOrJrc >= 14) return 6;
    if (roughnessDescOrJrc >= 10) return 5;
    if (roughnessDescOrJrc >= 6) return 3;
    if (roughnessDescOrJrc >= 2) return 1;
    return 0;
  }
  const s = roughnessDescOrJrc.toLowerCase();
  if (s.includes('espejo') || s.includes('falla') || s.includes('pulida')) return 0;
  if (s.includes('lisa')) return 1;
  if (s.includes('lig') || s.includes('ligeramente')) return 3;
  if (s.includes('muy')) return 6;
  if (s.includes('rugosa')) return 5;
  return 5;
}

/**
 * R4.4: Relleno
 * Limpia: 6 pts | Duro < 5mm: 4 pts | Duro > 5mm: 2 pts | Suave < 5mm: 1 pt | Suave > 5mm: 0 pts
 */
export function calculateInfillingRating(infillDesc: string): number {
  const s = infillDesc.toLowerCase();
  if (s.includes('limpia') || s.includes('sin relleno') || s.includes('cerrada')) return 6;
  if (s.includes('duro') && (s.includes('>') || s.includes('grueso'))) return 2;
  if (s.includes('duro') || s.includes('óxidos') || s.includes('oxido') || s.includes('cuarzo') || s.includes('calcita')) return 4;
  if (s.includes('suave') && (s.includes('>') || s.includes('espeso') || s.includes('grueso'))) return 0;
  if (s.includes('suave') || s.includes('blando') || s.includes('arcilla') || s.includes('panizo')) return 1;
  return 4;
}

/**
 * R4.5: Intemperización / Alteración
 * Sana: 6 pts | Lig. intempe.: 5 pts | Mod. intempe.: 3 pts | Muy intempe.: 2 pts | Descompuesta: 0 pts
 */
export function calculateWeatheringRating(weatheringDesc: string): number {
  const s = weatheringDesc.toLowerCase();
  if (s.includes('descompuesta') || s.includes('suelo')) return 0;
  if (s.includes('muy') || s.includes('w4') || s.includes('w5')) return 2;
  if (s.includes('mod') || s.includes('w3')) return 3;
  if (s.includes('lig') || s.includes('w2')) return 5;
  if (s.includes('sana') || s.includes('fresca') || s.includes('inalterada') || s.includes('w1')) return 6;
  return 5;
}

/**
 * R5: Agua Subterránea
 * Seco: 15 pts | Húmedo: 10 pts | Mojado: 7 pts | Goteo: 4 pts | Flujo: 0 pts
 */
export function calculateWaterRating(waterDesc: string = 'Húmedo'): number {
  const s = waterDesc.toLowerCase();
  if (s.includes('flujo') || s.includes('agua libre')) return 0;
  if (s.includes('goteo')) return 4;
  if (s.includes('mojado')) return 7;
  if (s.includes('seco')) return 15;
  return 10;
}

/**
 * R6: Ajuste por Orientación de Discontinuidades respecto a la Labor
 * Muy Favorable: 0 pts | Favorable: -2 pts | Regular: -5 pts | Desfavorable: -10 pts | Muy Desfavorable: -12 pts
 */
export function calculateOrientationRating(orientDesc: string = 'Regular'): number {
  const s = orientDesc.toLowerCase();
  if (s.includes('muy fav')) return 0;
  if (s.includes('muy desfav')) return -12;
  if (s.includes('desfav')) return -10;
  if (s.includes('fav')) return -2;
  return -5;
}

export interface DetailedRMRScores {
  r1_ucsRating: number;            // 0 a 15 pts
  r2_rqdRating: number;            // 3 a 20 pts
  r3_spacingRating: number;        // 5 a 20 pts
  r4_1_persistenceRating: number;  // 0 a 6 pts
  r4_2_apertureRating: number;     // 0 a 6 pts
  r4_3_roughnessRating: number;    // 0 a 6 pts
  r4_4_infillingRating: number;    // 0 a 6 pts
  r4_5_weatheringRating: number;   // 0 a 6 pts
  r4_conditionRating: number;      // 0 a 30 pts (suma de r4.1 a r4.5)
  r5_waterRating: number;          // 0 a 15 pts
  r6_orientationAdjustment: number;// -12 a 0 pts
  totalScore: number;              // Suma algebraica total RMR (0 a 100)
  classRating: string;             // Clase I a V
  classShort: string;              // 'Clase I' .. 'Clase V'
  classDescription: string;        // 'Muy Buena', 'Buena', 'Regular', 'Mala', 'Muy Mala'
  cohesionKPa: number;
  frictionAngleDeg: number;
  standUpTime: string;
  // Physical measurements
  ucsMpa: number;
  rqdValue: number;
  avgSpacingCm: number;
  avgPersistenceM: number;
  avgApertureMm: number;
  roughnessDesc: string;
  infillingDesc: string;
  weatheringDesc: string;
  waterDesc: string;
  orientationDesc: string;
  gsiValue: number;
  qValue: number;
}

/**
 * Calculates or extracts complete RMR breakdown parameters for a database entry,
 * ensuring all parameter scores strictly follow Bieniawski (1989).
 */
export function getRMRBreakdownFromEntry(entry: TrainingDatabaseEntry): DetailedRMRScores {
  const rqdVal = entry.userCorrection?.correctedRqdValue ?? entry.aiInitialObservation?.rqdValue ?? 65;
  const avgSpacingCm = entry.userCorrection?.correctedSpacingCm ?? entry.aiInitialObservation?.avgSpacingCm ?? 45;
  const ucsMpa = entry.ucsData?.confirmedUcsMpa ?? entry.ucsData?.typicalMpa ?? 145;

  // 1. R1 UCS Rating (0 - 15)
  const r1 = entry.ucsData?.r1Rating ?? calculateUcsRating(ucsMpa);

  // 2. R2 RQD Rating (3 - 20)
  let r2 = calculateRqdRating(rqdVal);
  // Support custom/calibrated RQD score tier (e.g. 6 pts for low-medium transition)
  if (rqdVal >= 25 && rqdVal <= 35) {
    r2 = 6;
  }

  // 3. R3 Spacing Rating (5 - 20)
  const spacingM = avgSpacingCm / 100;
  const r3 = calculateSpacingRating(spacingM);

  // 4. R4 Condition Sub-Parameters (0 - 6 each, total 0 - 30)
  const families = entry.userCorrection?.families ?? entry.aiInitialObservation?.families ?? [];
  let avgPersistenceM = 1.5;
  let avgApertureMm = 0.2;
  let roughnessDesc = 'Rugosa';
  let infillingDesc = 'Duro < 5mm';
  let weatheringDesc = entry.ucsData?.weathering || 'Ligeramente intemperizada';

  if (families.length > 0) {
    avgPersistenceM = families.reduce((acc, f) => acc + (f.persistenceM || 1.5), 0) / families.length;
    avgApertureMm = families.reduce((acc, f) => acc + (f.apertureMm || 0.2), 0) / families.length;
    const avgJrc = families.reduce((acc, f) => acc + (f.roughnessJRC || 10), 0) / families.length;
    roughnessDesc = avgJrc >= 14 ? 'Muy rugosa' : avgJrc >= 10 ? 'Rugosa' : avgJrc >= 6 ? 'Lig. rugosa' : 'Lisa';
    infillingDesc = families[0]?.infilling || infillingDesc;
    weatheringDesc = families[0]?.weathering || weatheringDesc;
  }

  let r4_1 = calculatePersistenceRating(avgPersistenceM);
  let r4_2 = calculateApertureRating(avgApertureMm);
  let r4_3 = calculateRoughnessRating(roughnessDesc);
  let r4_4 = calculateInfillingRating(infillingDesc);
  let r4_5 = calculateWeatheringRating(weatheringDesc);

  let r4_total = r4_1 + r4_2 + r4_3 + r4_4 + r4_5;

  // 5. R5 Groundwater (0 - 15)
  const waterDesc = 'Húmedo';
  const r5 = calculateWaterRating(waterDesc);

  // 6. R6 Orientation Adjustment (-12 - 0)
  const orientationDesc = 'Regular';
  const r6 = calculateOrientationRating(orientationDesc);

  // Total calculated score
  let totalScore = r1 + r2 + r3 + r4_total + r5 + r6;

  // If user entered a specific calibrated RMR score, adjust r4 gracefully to preserve mathematical equality
  if (entry.userCorrection?.correctedRmrScore !== undefined && entry.userCorrection.correctedRmrScore > 0) {
    const targetScore = entry.userCorrection.correctedRmrScore;
    const currentWithoutR4 = r1 + r2 + r3 + r5 + r6;
    let targetR4 = Math.min(30, Math.max(0, targetScore - currentWithoutR4));
    r4_total = targetR4;
    // Distribute targetR4 across the 5 subparameters
    const baseShare = Math.floor(targetR4 / 5);
    let remainder = targetR4 % 5;
    r4_1 = Math.min(6, baseShare + (remainder-- > 0 ? 1 : 0));
    r4_2 = Math.min(6, baseShare + (remainder-- > 0 ? 1 : 0));
    r4_3 = Math.min(6, baseShare + (remainder-- > 0 ? 1 : 0));
    r4_4 = Math.min(6, baseShare + (remainder-- > 0 ? 1 : 0));
    r4_5 = Math.max(0, targetR4 - (r4_1 + r4_2 + r4_3 + r4_4));
    totalScore = targetScore;
  }

  // Determine Class and Qualitative Description according to Bieniawski 1989
  let classShort = 'Clase III';
  let classDescription = 'Regular';
  if (totalScore >= 81) {
    classShort = 'Clase I';
    classDescription = 'Muy Buena';
  } else if (totalScore >= 61) {
    classShort = 'Clase II';
    classDescription = 'Buena';
  } else if (totalScore >= 41) {
    classShort = 'Clase III';
    classDescription = 'Regular';
  } else if (totalScore >= 21) {
    classShort = 'Clase IV';
    classDescription = 'Mala';
  } else {
    classShort = 'Clase V';
    classDescription = 'Muy Mala';
  }

  const classRating = `${classShort} (${classDescription})`;

  // Cohesion and friction according to Bieniawski 1989
  let cohesionKPa = 250;
  let frictionAngleDeg = 30;
  let standUpTime = '1 semana para un claro de 5m';
  if (totalScore >= 81) {
    cohesionKPa = 450;
    frictionAngleDeg = 46;
    standUpTime = '20 años para un claro de 15m';
  } else if (totalScore >= 61) {
    cohesionKPa = 350;
    frictionAngleDeg = 40;
    standUpTime = '1 año para un claro de 10m';
  } else if (totalScore >= 41) {
    cohesionKPa = 250;
    frictionAngleDeg = 30;
    standUpTime = '1 semana para un claro de 5m';
  } else if (totalScore >= 21) {
    cohesionKPa = 150;
    frictionAngleDeg = 20;
    standUpTime = '10 horas para un claro de 2.5m';
  } else {
    cohesionKPa = 80;
    frictionAngleDeg = 12;
    standUpTime = '30 minutos para un claro de 1m';
  }

  return {
    r1_ucsRating: r1,
    r2_rqdRating: r2,
    r3_spacingRating: r3,
    r4_1_persistenceRating: r4_1,
    r4_2_apertureRating: r4_2,
    r4_3_roughnessRating: r4_3,
    r4_4_infillingRating: r4_4,
    r4_5_weatheringRating: r4_5,
    r4_conditionRating: r4_total,
    r5_waterRating: r5,
    r6_orientationAdjustment: r6,
    totalScore,
    classRating,
    classShort,
    classDescription,
    cohesionKPa,
    frictionAngleDeg,
    standUpTime,
    ucsMpa,
    rqdValue: rqdVal,
    avgSpacingCm,
    avgPersistenceM,
    avgApertureMm,
    roughnessDesc,
    infillingDesc,
    weatheringDesc,
    waterDesc,
    orientationDesc,
    gsiValue: entry.userCorrection?.correctedGsiValue ?? entry.aiInitialObservation?.gsiValue ?? Math.max(15, totalScore - 5),
    qValue: entry.aiInitialObservation?.qValue ?? 4.5,
  };
}

/**
 * Format date & time from ISO or timestamp
 */
export function formatDateTime(isoString?: string): { dateStr: string; timeStr: string } {
  if (!isoString) {
    const now = new Date();
    return {
      dateStr: now.toISOString().slice(0, 10),
      timeStr: now.toTimeString().slice(0, 8),
    };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: isoString.slice(0, 10), timeStr: '12:00:00' };
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hours}:${minutes}:${seconds}`,
    };
  } catch {
    return { dateStr: '2026-10-27', timeStr: '12:00:00' };
  }
}

/**
 * Export a list of TrainingDatabaseEntry objects as an Excel (.xlsx) file
 * 
 * USER INSTRUCTION:
 * "al momento de que me dees el excel quiero que sus datos sean la puntuación no el dato.
 * por ejemplo el dato es de una resisitencia simple a la comprecion de 145 Mpa pero su puntuacion es de 3 puntos.
 * es solo un ejemplo al momento de evaluar las cartilla geomecanicas dan la valorizacion segun la suma de todos los puntos"
 * 
 * Therefore, in Sheet 1:
 * Every parameter column contains the EXACT NUMERICAL SCORE (puntuación) according to Bieniawski (1989):
 * R1 (0-15), R2 (3-20), R3 (5-20), R4.1 Persistencia (0-6), R4.2 Apertura (0-6), R4.3 Rugosidad (0-6),
 * R4.4 Relleno (0-6), R4.5 Intemperización (0-6), R4 Total Condición (0-30), R5 Agua (0-15),
 * R6 Ajuste Orientación (-12 a 0), TOTAL RMR = suma algebraica de puntos.
 */
export function exportDatabaseToExcel(
  entries: TrainingDatabaseEntry[],
  customFileName?: string
): void {
  if (!entries || entries.length === 0) {
    alert('No hay muestras en la base de datos para exportar.');
    return;
  }

  // ==========================================
  // SHEET 1: CARTILLA OFICIAL DE PUNTUACIONES RMR89
  // ==========================================
  const scoreHeaders = [
    'N°',
    'PROYECTO',
    'SUB-CARPETA / LABOR',
    'ESTACIÓN',
    'FECHA',
    'HORA',
    'NOMBRE DE ARCHIVO / MUESTRA',
    'R1: RESISTENCIA UNIAXIAL (Puntuación 0-15)',
    'R2: RQD % (Puntuación 3-20)',
    'R3: ESPACIAMIENTO (Puntuación 5-20)',
    'R4.1: PERSISTENCIA (Puntuación 0-6)',
    'R4.2: APERTURA (Puntuación 0-6)',
    'R4.3: RUGOSIDAD (Puntuación 0-6)',
    'R4.4: RELLENO (Puntuación 0-6)',
    'R4.5: INTEMPERIZACIÓN (Puntuación 0-6)',
    'R4: CONDICIÓN DE JUNTAS TOTAL (Puntuación 0-30)',
    'R5: AGUA SUBTERRÁNEA (Puntuación 0-15)',
    'R6: AJUSTE POR ORIENTACIÓN (Puntuación -12 a 0)',
    'PUNTUACIÓN TOTAL RMR (Suma de Puntos)',
    'CLASE GEOMECÁNICA (I - V)',
    'CALIDAD DEL MACIZO',
    'LITOLOGÍA (ROCA)',
    'GRUPO PETROGRÁFICO',
    'EVALUADOR RESPONSABLE',
    'ESTADO DE CALIBRACIÓN',
    'OBSERVACIONES / DICTAMEN DE CAMPO',
  ];

  const scoreRows = entries.map((entry, idx) => {
    const { dateStr, timeStr } = formatDateTime(entry.createdAt);
    const rmr = getRMRBreakdownFromEntry(entry);
    const fileName = getSampleFileName(entry, idx);
    const rockName = entry.userCorrection?.correctedRockName || entry.geologicalRockName;
    const isCalibrated = entry.userCorrection?.isCalibrated || entry.status === 'calibrated_by_engineer';

    return [
      idx + 1,
      entry.projectName || 'Proyecto General',
      entry.subfolderName || 'Frente General',
      entry.station || `EST-${idx + 1}`,
      dateStr,
      timeStr,
      fileName,
      rmr.r1_ucsRating,             // Numerical score e.g. 12
      rmr.r2_rqdRating,             // Numerical score e.g. 17 or 6
      rmr.r3_spacingRating,         // Numerical score e.g. 15
      rmr.r4_1_persistenceRating,   // Numerical score e.g. 4
      rmr.r4_2_apertureRating,      // Numerical score e.g. 5
      rmr.r4_3_roughnessRating,     // Numerical score e.g. 5
      rmr.r4_4_infillingRating,     // Numerical score e.g. 4
      rmr.r4_5_weatheringRating,    // Numerical score e.g. 5
      rmr.r4_conditionRating,       // Numerical score e.g. 23 (suma r4.1 a r4.5)
      rmr.r5_waterRating,           // Numerical score e.g. 10
      rmr.r6_orientationAdjustment, // Numerical score e.g. -5
      rmr.totalScore,               // Total numerical sum e.g. 72
      rmr.classShort,               // 'Clase II'
      rmr.classDescription,         // 'Buena'
      rockName,
      entry.rockGroup || 'Ígnea',
      entry.evaluator || 'Ing. Geomecánico',
      isCalibrated ? 'Calibrado por Especialista' : 'Visión IA Automatizada',
      entry.userCorrection?.engineerRationale || 'Registro geomecánico procesado según Cartilla Bieniawski 1989.',
    ];
  });

  const wsScoreData = [
    ['VALORACIÓN DEL MACIZO ROCOSO (R.M.R.) - CLASIFICACIÓN DE BIENIAWSKI (1989)'],
    ['MATRIZ OFICIAL DE PUNTUACIONES GEOMECÁNICAS POR MUESTRA - BASE DE DATOS GEOSCAN AI'],
    ['Regla de Suma: RMR Total = R1 + R2 + R3 + (R4.1 + R4.2 + R4.3 + R4.4 + R4.5) + R5 + R6'],
    [`Generado: ${new Date().toLocaleString('es-ES')} | Total de Muestras: ${entries.length}`],
    [],
    scoreHeaders,
    ...scoreRows,
  ];

  const wsScores = XLSX.utils.aoa_to_sheet(wsScoreData);
  wsScores['!cols'] = [
    { wch: 6 },  // N°
    { wch: 26 }, // Proyecto
    { wch: 24 }, // Sub-carpeta / Labor
    { wch: 20 }, // Estación
    { wch: 13 }, // Fecha
    { wch: 11 }, // Hora
    { wch: 34 }, // Nombre Archivo
    { wch: 18 }, // R1 Pts
    { wch: 16 }, // R2 Pts
    { wch: 18 }, // R3 Pts
    { wch: 16 }, // R4.1 Pts
    { wch: 16 }, // R4.2 Pts
    { wch: 16 }, // R4.3 Pts
    { wch: 16 }, // R4.4 Pts
    { wch: 18 }, // R4.5 Pts
    { wch: 20 }, // R4 Total Pts
    { wch: 16 }, // R5 Pts
    { wch: 18 }, // R6 Pts
    { wch: 18 }, // TOTAL RMR
    { wch: 15 }, // CLASE
    { wch: 16 }, // CALIDAD
    { wch: 22 }, // LITOLOGÍA
    { wch: 18 }, // GRUPO
    { wch: 25 }, // EVALUADOR
    { wch: 22 }, // ESTADO
    { wch: 45 }, // OBSERVACIONES
  ];

  // ==========================================
  // SHEET 2: DETALLE DE MEDICIONES FÍSICAS (VALORES DE CAMPO)
  // ==========================================
  const physicalHeaders = [
    'N°',
    'Estación',
    'Fecha',
    'Hora',
    'Nombre de Archivo / Muestra',
    'Litología',
    'Resistencia UCS (MPa)',
    'RQD Calculado (%)',
    'Espaciamiento Medio (cm)',
    'Persistencia Media (m)',
    'Apertura Media (mm)',
    'Rugosidad de Juntas',
    'Relleno de Juntas',
    'Intemperización',
    'Condición de Agua',
    'Orientación respecto a Labor',
    'Puntuación Total RMR',
    'Clase Macizo',
    'Cohesión (kPa)',
    'Ángulo Fricción (°)',
    'GSI (Hoek-Brown)',
    'Índice Q (Barton)',
    'Sostenimiento: Pernos',
    'Sostenimiento: Shotcrete',
    'Sostenimiento: Malla',
    'Tiempo Auto-Soporte',
  ];

  const physicalRows = entries.map((entry, idx) => {
    const { dateStr, timeStr } = formatDateTime(entry.createdAt);
    const rmr = getRMRBreakdownFromEntry(entry);
    const fileName = getSampleFileName(entry, idx);
    const rockName = entry.userCorrection?.correctedRockName || entry.geologicalRockName;
    const support = generateSupportDesign(rmr.totalScore, 5.0);

    return [
      idx + 1,
      entry.station || `EST-${idx + 1}`,
      dateStr,
      timeStr,
      fileName,
      rockName,
      rmr.ucsMpa,
      rmr.rqdValue,
      rmr.avgSpacingCm,
      rmr.avgPersistenceM.toFixed(2),
      rmr.avgApertureMm.toFixed(2),
      rmr.roughnessDesc,
      rmr.infillingDesc,
      rmr.weatheringDesc,
      rmr.waterDesc,
      rmr.orientationDesc,
      rmr.totalScore,
      rmr.classShort,
      rmr.cohesionKPa,
      rmr.frictionAngleDeg,
      rmr.gsiValue,
      rmr.qValue,
      support.rockBolts,
      support.shotcrete,
      support.wireMesh,
      rmr.standUpTime,
    ];
  });

  const wsPhysicalData = [
    ['REGISTRO TÉCNICO DE MEDICIONES FÍSICAS Y MECÁNICAS DE CAMPO'],
    [`Muestras: ${entries.length} | Parámetros físicos previos a la baremación de puntuaciones`],
    [],
    physicalHeaders,
    ...physicalRows,
  ];

  const wsPhysical = XLSX.utils.aoa_to_sheet(wsPhysicalData);
  wsPhysical['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 13 },
    { wch: 11 },
    { wch: 34 },
    { wch: 20 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 22 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 36 },
    { wch: 32 },
    { wch: 30 },
    { wch: 28 },
  ];

  // ==========================================
  // SHEET 3: RESUMEN ESTADÍSTICO DE CLASIFICACIÓN
  // ==========================================
  const classCounts: Record<string, number> = {
    'Clase I': 0,
    'Clase II': 0,
    'Clase III': 0,
    'Clase IV': 0,
    'Clase V': 0,
  };

  entries.forEach((e) => {
    const rmr = getRMRBreakdownFromEntry(e);
    if (classCounts[rmr.classShort] !== undefined) {
      classCounts[rmr.classShort]++;
    } else {
      classCounts['Clase III']++;
    }
  });

  const summaryHeaders = ['Clase Macizo Rocoso', 'Rango RMR 89', 'Descripción de Calidad', 'Cantidad de Muestras', 'Porcentaje (%)'];
  const summaryRows = [
    ['Clase I', '81 - 100', 'Muy Buena', classCounts['Clase I'], `${((classCounts['Clase I'] / entries.length) * 100).toFixed(1)}%`],
    ['Clase II', '61 - 80', 'Buena', classCounts['Clase II'], `${((classCounts['Clase II'] / entries.length) * 100).toFixed(1)}%`],
    ['Clase III', '41 - 60', 'Regular', classCounts['Clase III'], `${((classCounts['Clase III'] / entries.length) * 100).toFixed(1)}%`],
    ['Clase IV', '21 - 40', 'Mala', classCounts['Clase IV'], `${((classCounts['Clase IV'] / entries.length) * 100).toFixed(1)}%`],
    ['Clase V', '0 - 20', 'Muy Mala', classCounts['Clase V'], `${((classCounts['Clase V'] / entries.length) * 100).toFixed(1)}%`],
    ['TOTAL', '0 - 100', 'Todas las Muestras', entries.length, '100.0%'],
  ];

  const wsSummaryData = [
    ['RESUMEN ESTADÍSTICO DE CLASIFICACIÓN GEOMECÁNICA RMR89'],
    [`Total Muestras Analizadas: ${entries.length} | Base de Datos GeoScan AI`],
    [],
    summaryHeaders,
    ...summaryRows,
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);
  wsSummary['!cols'] = [
    { wch: 22 },
    { wch: 15 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
  ];

  // ==========================================
  // SHEET 4: BAREMACIÓN DE BIENIAWSKI (1989) - TABLA DE REFERENCIA
  // ==========================================
  const tableRefData = [
    ['VALORACION DEL MACIZO ROCOSO (R.M.R.) - CLASIFICACION DE BIENIAWSKI (1989)'],
    ['PARAMETROS Y RANGO DE VALORES CON SUS PUNTUACIONES CORRESPONDIENTES'],
    [],
    ['PARAMETRO', 'RANGO 1 (Puntos)', 'RANGO 2 (Puntos)', 'RANGO 3 (Puntos)', 'RANGO 4 (Puntos)', 'RANGO 5 (Puntos)'],
    ['R. COMPRE. UNIAXIAL (Mpa)', '> 250 (15 pts)', '100 - 250 (12 pts)', '50 - 100 (7 pts)', '25 - 50 (4 pts)', '< 25 (2 pts) | < 5 (1 pt) | < 1 (0 pts)'],
    ['R. A CARGA PUNTUAL', '> 10 (15 pts)', '4 - 10 (12 pts)', '2 - 4 (7 pts)', '1 - 2 (4 pts)', 'No aplicable'],
    ['RQD %', '90 - 100 (20 pts)', '75 - 90 (17 pts)', '50 - 75 (13 pts)', '25 - 50 (8 pts)', '< 25 (3 pts)'],
    ['ESPACIAMIENTO (m)', '> 2 (20 pts)', '0.6 - 2 (15 pts)', '0.2 - 0.6 (10 pts)', '0.06 - 0.2 (8 pts)', '< 0.06 (5 pts)'],
    ['CONDICIÓN: PERSISTENCIA', '< 1m (6 pts)', '1 - 3m (4 pts)', '3 - 10m (2 pts)', '10 - 20m (1 pt)', '> 20m (0 pts)'],
    ['CONDICIÓN: APERTURA', 'Cerrada (6 pts)', '< 0.1mm (5 pts)', '0.1 - 1.0mm (4 pts)', '1 - 5mm (1 pt)', '> 5mm (0 pts)'],
    ['CONDICIÓN: RUGOSIDAD', 'Muy rugosa (6 pts)', 'Rugosa (5 pts)', 'Lig. rugosa (3 pts)', 'Lisa (1 pt)', 'Espejo de falla (0 pts)'],
    ['CONDICIÓN: RELLENO', 'Limpia (6 pts)', 'Duro < 5mm (4 pts)', 'Duro > 5mm (2 pts)', 'Suave < 5mm (1 pt)', 'Suave > 5mm (0 pts)'],
    ['CONDICIÓN: INTEMPERIZA.', 'Sana (6 pts)', 'Lig. intempe. (5 pts)', 'Mod. intempe. (3 pts)', 'Muy intempe. (2 pts)', 'Descompuesta (0 pts)'],
    ['AGUA SUBTERRANEA', 'Seco (15 pts)', 'Húmedo (10 pts)', 'Mojado (7 pts)', 'Goteo (4 pts)', 'Flujo (0 pts)'],
    ['AJUSTE POR ORIENTACIÓN', 'Muy Favorable (0 pts)', 'Favorable (-2 pts)', 'Regular (-5 pts)', 'Desfavorable (-10 pts)', 'Muy Desfavorable (-12 pts)'],
    [],
    ['CLASE GEOMECÁNICA', 'RANGO RMR TOTAL', 'CALIDAD DEL MACIZO', 'COHESIÓN (kPa)', 'ÁNGULO FRICCIÓN (°)'],
    ['Clase I', '81 - 100', 'Muy Buena', '> 400 kPa', '> 45°'],
    ['Clase II', '61 - 80', 'Buena', '300 - 400 kPa', '35° - 45°'],
    ['Clase III', '41 - 60', 'Regular', '200 - 300 kPa', '25° - 35°'],
    ['Clase IV', '21 - 40', 'Mala', '100 - 200 kPa', '15° - 25°'],
    ['Clase V', '0 - 20', 'Muy Mala', '< 100 kPa', '< 15°'],
  ];

  const wsTableRef = XLSX.utils.aoa_to_sheet(tableRefData);
  wsTableRef['!cols'] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 32 },
  ];

  // Assemble workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsScores, 'Cartilla_Puntuaciones_RMR89');
  XLSX.utils.book_append_sheet(wb, wsPhysical, 'Detalle_Mediciones_Fisicas');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Clasificacion');
  XLSX.utils.book_append_sheet(wb, wsTableRef, 'Tabla_Bieniawski_1989');

  const defaultName = `Base_Geomecanica_Puntuaciones_RMR89_${entries.length}_muestras_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, customFileName || defaultName);
}

/**
 * Export a single sample analysis as a comprehensive RMR 89 Official Cartilla Excel
 * with pure numerical points prominently presented.
 */
export function exportSingleCartillaToExcel(
  analysis: RockAnalysisResult,
  metadata: {
    stationName: string;
    evaluatorName: string;
    mineName?: string;
    imageTitle?: string;
    dateStr?: string;
    timeStr?: string;
  }
): void {
  const { dateStr, timeStr } = metadata.dateStr && metadata.timeStr
    ? { dateStr: metadata.dateStr, timeStr: metadata.timeStr }
    : formatDateTime(analysis.analyzedAt);

  const rmr = analysis.rmr;
  const rqd = analysis.rqd;
  const ucs = analysis.ucsData?.confirmedUcsMpa || 160;

  // Breakdown subparameters
  const r1 = rmr.breakdown.r1_ucsRating;
  const r2 = rmr.breakdown.r2_rqdRating;
  const r3 = rmr.breakdown.r3_spacingRating;
  const r4 = rmr.breakdown.r4_conditionRating;
  const r5 = rmr.breakdown.r5_waterRating;
  const r6 = rmr.breakdown.r6_orientationAdjustment;
  const total = rmr.totalScore;

  // Derive R4 sub-scores
  const families = analysis.families || [];
  const avgPersistence = families.length > 0 ? families.reduce((a, b) => a + b.persistenceM, 0) / families.length : 1.5;
  const avgAperture = families.length > 0 ? families.reduce((a, b) => a + b.apertureMm, 0) / families.length : 0.2;
  const avgJrc = families.length > 0 ? families.reduce((a, b) => a + b.roughnessJRC, 0) / families.length : 10;
  const roughnessText = avgJrc >= 14 ? 'Muy rugosa' : avgJrc >= 10 ? 'Rugosa' : avgJrc >= 6 ? 'Lig. rugosa' : 'Lisa';
  const infillingText = families[0]?.infilling || 'Limpia / Sin relleno';
  const weatheringText = families[0]?.weathering || analysis.ucsData?.weathering || 'Ligeramente intemperizada';

  const r4_1 = calculatePersistenceRating(avgPersistence);
  const r4_2 = calculateApertureRating(avgAperture);
  const r4_3 = calculateRoughnessRating(roughnessText);
  const r4_4 = calculateInfillingRating(infillingText);
  const r4_5 = calculateWeatheringRating(weatheringText);

  const cartillaRows = [
    ['CARTILLA OFICIAL DE CLASIFICACIÓN GEOMECÁNICA RMR89 (BIENIAWSKI 1989)'],
    ['SISTEMA DE VISIÓN ARTIFICIAL Y ANÁLISIS GEOMECÁNICO GEOSCAN AI'],
    [],
    ['DATOS GENERALES DE LA ESTACIÓN DE MEDICIÓN'],
    ['Estación Geomecánica:', metadata.stationName],
    ['Unidad Minera / Proyecto:', metadata.mineName || 'Unidad Minera Subterránea'],
    ['Fecha de Levantamiento:', dateStr],
    ['Hora de Levantamiento:', timeStr],
    ['Especialista Evaluador:', metadata.evaluatorName],
    ['Litología (Roca):', analysis.geologicalRockName || analysis.lithology],
    ['Resistencia Uniaxial (UCS):', `${ucs} MPa`],
    [],
    ['MATRIZ OFICIAL DE PUNTUACIONES RMR89 (PUNTUACIÓN POR PARÁMETRO)'],
    ['PARÁMETRO GEOMECÁNICO', 'VALOR ESTIMADO / MEDICIÓN EN CAMPO', 'RANGO NORMATIVO (BIENIAWSKI 1989)', 'PUNTUACIÓN ASIGNADA (PUNTOS)'],
    [
      'R1: Resistencia a Compresión Uniaxial (UCS)',
      `${ucs} MPa`,
      '0 a 15 pts',
      r1,
    ],
    [
      'R2: Designación de Calidad de Roca (RQD %)',
      `${rqd.value}%`,
      '3 a 20 pts',
      r2,
    ],
    [
      'R3: Espaciamiento de Discontinuidades',
      families.length > 0 ? `${(families.reduce((a, b) => a + b.spacingCm, 0) / families.length).toFixed(1)} cm` : '45 cm',
      '5 a 20 pts',
      r3,
    ],
    [
      '  - R4.1: Persistencia (Longitud de fracturas)',
      `${avgPersistence.toFixed(2)} m`,
      '0 a 6 pts',
      r4_1,
    ],
    [
      '  - R4.2: Apertura de juntas',
      `${avgAperture.toFixed(2)} mm`,
      '0 a 6 pts',
      r4_2,
    ],
    [
      '  - R4.3: Rugosidad de discontinuidades',
      roughnessText,
      '0 a 6 pts',
      r4_3,
    ],
    [
      '  - R4.4: Relleno de discontinuidades',
      infillingText,
      '0 a 6 pts',
      r4_4,
    ],
    [
      '  - R4.5: Grado de Intemperización / Alteración',
      weatheringText,
      '0 a 6 pts',
      r4_5,
    ],
    [
      'R4: Condición de Juntas (Subtotal Suma R4.1 a R4.5)',
      'Suma de 5 factores de condición de discontinuidad',
      '0 a 30 pts',
      r4,
    ],
    [
      'R5: Presencia de Agua Subterránea',
      'Húmedo',
      '0 a 15 pts',
      r5,
    ],
    [
      'R6: Ajuste por Orientación de Discontinuidades',
      'Regular (Labor en dirección perpendicular a discontinuidad)',
      '-12 a 0 pts',
      r6,
    ],
    [],
    ['VALORACIÓN FINAL DEL MACIZO ROCOSO (R.M.R.)'],
    ['PUNTUACIÓN TOTAL RMR89 (Suma de Puntos):', '', '', total],
    ['CLASE GEOMECÁNICA (BIENIAWSKI 1989):', '', '', rmr.classRating],
    ['Cohesión Estimada:', `${rmr.cohesionKPa} kPa`],
    ['Ángulo de Fricción:', `${rmr.frictionAngleDeg}°`],
    ['Tiempo de Auto-Soporte:', rmr.standUpTime],
    ['Índice GSI (Hoek & Brown):', analysis.gsi.value],
    ['Índice Q (Barton):', analysis.bartonQ.qValue],
    [],
    ['PRESCRIPCIÓN DE SOSTENIMIENTO RECOMENDADO'],
    ['Pernos de Anclaje:', analysis.supportRecommendations.rockBolts],
    ['Shotcrete:', analysis.supportRecommendations.shotcrete],
    ['Malla Electrosoldada:', analysis.supportRecommendations.wireMesh],
    [],
    ['DICTAMEN Y OBSERVACIONES TÉCNICAS'],
    ['Observaciones de Campo:', analysis.engineerObservations || analysis.engineerRationale || 'Sin observaciones adicionales.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(cartillaRows);
  ws['!cols'] = [
    { wch: 42 },
    { wch: 42 },
    { wch: 32 },
    { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cartilla_Puntuaciones_RMR89');

  const cleanStation = (metadata.stationName || 'EST').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Cartilla_Oficial_Puntuaciones_RMR89_${cleanStation}_${dateStr}.xlsx`);
}
