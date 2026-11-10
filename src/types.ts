export interface DiscontinuityFamily {
  id: string;
  name: string;
  type: 'Diaclasa' | 'Estratificación' | 'Falla menor' | 'Foliación';
  dip: number; // Inclinación en grados (0-90)
  dipDirection: number; // Dirección de buzamiento (0-360)
  strike: number; // Rumbo (0-180)
  spacingCm: number; // Espaciamiento medio
  persistenceM: number; // Longitud / persistencia visible en metros
  apertureMm: number; // Apertura en mm
  roughnessJRC: number; // Coeficiente de rugosidad de junta (0-20)
  weathering: 'Sana / Sin meteorización' | 'Ligeramente meteorizada' | 'Moderadamente meteorizada' | 'Muy meteorizada';
  infilling: 'Sin relleno (cerrada)' | 'Óxidos de hierro / Clorita <1mm' | 'Arcilla <5mm' | 'Arcilla blanda >5mm';
  color: string;
  traceLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

export interface RMRBreakdown {
  r1_ucsRating: number; // Resistencia a compresión uniaxial (0-15)
  r2_rqdRating: number; // RQD (3-20)
  r3_spacingRating: number; // Espaciamiento de discontinuidades (5-20)
  r4_conditionRating: number; // Condición de juntas (0-30)
  r5_waterRating: number; // Presencia de agua subterránea (0-15)
  r6_orientationAdjustment: number; // Ajuste por orientación de túnel (-12 a 0)
}

export interface RMRData {
  totalScore: number;
  classRating: 'Clase I (Muy Buena)' | 'Clase II (Buena)' | 'Clase III (Regular)' | 'Clase IV (Mala)' | 'Clase V (Muy Mala)';
  cohesionKPa: number;
  frictionAngleDeg: number;
  standUpTime: string;
  breakdown: RMRBreakdown;
}

export interface GSIData {
  value: number; // 10 a 90
  structureCategory: 'Blocky' | 'Very Blocky' | 'Blocky/Seamy' | 'Disintegrated';
  surfaceCategory: 'Very Good' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  description: string;
}

export interface BartonQData {
  qValue: number;
  jn: number;
  jr: number;
  ja: number;
  jw: number;
  srf: number;
  classification: string;
}

export interface QualityValidation {
  isValid: boolean;
  sharpnessScore: number; // 0-100
  lightingScore: number; // 0-100
  contrastScore: number; // 0-100
  scaleDetected: boolean;
  message: string;
  checks: {
    sharpness: boolean;
    lighting: boolean;
    contrast: boolean;
    scale: boolean;
  };
}

export interface SupportRecommendation {
  category: string;
  rockBolts: string;
  shotcrete: string;
  wireMesh: string;
  additionalSafety: string;
}

export interface ThesisComparison {
  manualCartillaTimeMinutes: number;
  aiVisionTimeSeconds: number;
  timeSavedPercent: number;
  interObserverVariabilityReductionPercent: number;
}

export interface RockUCSData {
  rockName: string;
  group: 'Ígnea Plutónica' | 'Ígnea Volcánica' | 'Sedimentaria' | 'Metamórfica' | 'Personalizada';
  ucsMinMpa: number;
  ucsTypMpa: number;
  ucsMaxMpa: number;
  confirmedUcsMpa: number;
  isrmGrade: string;
  isrmGradeCode: string;
  r1Rating: number;
  weathering: string;
  fieldIdentification?: string;
  isUserConfirmed?: boolean;
}

export interface RockAnalysisResult {
  lithology: string;
  geologicalRockName?: string;
  ucsData?: RockUCSData;
  qualityValidation: QualityValidation;
  families: DiscontinuityFamily[];
  rqd: {
    value: number;
    ratingPalmstrom: number;
    ratingScanline: number;
    category: 'Muy Mala' | 'Mala' | 'Regular' | 'Buena' | 'Excelente';
    jvVolumetricJointCount: number;
  };
  rmr: RMRData;
  gsi: GSIData;
  bartonQ: BartonQData;
  supportRecommendations: SupportRecommendation;
  thesisComparison: ThesisComparison;
  analyzedAt?: string;
  stationName?: string;
  tunnelSection?: string;
  isCalibratedByEngineer?: boolean;
  engineerRationale?: string;
  engineerObservations?: string;
  calibratedAt?: string;
  calibratedBy?: string;
  learnedRulesApplied?: string[];
  aiLearningNotes?: string;
  matchedSampleLesson?: {
    sampleTitle: string;
    recommendations: string;
    similarityPercent: number;
    lessonAuthor: string;
  };
}

export interface RockSample {
  id: string;
  name: string;
  lithology: string;
  location: string;
  description: string;
  imageUrl: string;
  defaultScaleCm: number;
  scaleType: 'hammer' | 'metric_rod' | 'laser' | 'coin';
  analysis: RockAnalysisResult;
}

export interface ScanlineIntersection {
  posMeters: number;
  familyId: string;
  familyName: string;
  color: string;
  apparentAngleDeg: number;
}
