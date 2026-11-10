import { RockSample } from '../types';

export const DEFAULT_EMPTY_SAMPLE: RockSample = {
  id: 'empty-sample',
  name: 'Frente Rocoso No Cargado',
  lithology: 'Andesita',
  location: 'Estación Principal',
  description: 'Suba una fotografía o carpeta para comenzar la caracterización geomecánica.',
  defaultScaleCm: 100,
  scaleType: 'metric_rod',
  imageUrl: '',
  analysis: {
    lithology: 'Andesita',
    qualityValidation: {
      isValid: false,
      sharpnessScore: 0,
      lightingScore: 0,
      contrastScore: 0,
      scaleDetected: false,
      message: 'Sin fotografía cargada. Suba una imagen o active la cámara.',
      checks: { sharpness: false, lighting: false, contrast: false, scale: false },
    },
    families: [],
    rqd: {
      value: 0,
      ratingPalmstrom: 0,
      ratingScanline: 0,
      category: 'Muy Mala',
      jvVolumetricJointCount: 0,
    },
    rmr: {
      totalScore: 0,
      classRating: 'Clase V (Muy Mala)',
      cohesionKPa: 50,
      frictionAngleDeg: 15,
      standUpTime: 'Pendiente de evaluación',
      breakdown: {
        r1_ucsRating: 0,
        r2_rqdRating: 0,
        r3_spacingRating: 0,
        r4_conditionRating: 0,
        r5_waterRating: 15,
        r6_orientationAdjustment: 0,
      },
    },
    gsi: {
      value: 0,
      structureCategory: 'Disintegrated',
      surfaceCategory: 'Very Poor',
      description: 'Pendiente de evaluación visual',
    },
    bartonQ: {
      qValue: 0.1,
      jn: 9,
      jr: 1,
      ja: 4,
      jw: 1,
      srf: 5,
      classification: 'Excepcionalmente Mala',
    },
    supportRecommendations: {
      category: 'Pendiente',
      rockBolts: 'Pendiente de evaluación',
      shotcrete: 'Pendiente de evaluación',
      wireMesh: 'Pendiente de evaluación',
      additionalSafety: 'Pendiente de evaluación',
    },
    thesisComparison: {
      manualCartillaTimeMinutes: 25,
      aiVisionTimeSeconds: 2.1,
      timeSavedPercent: 98,
      interObserverVariabilityReductionPercent: 85,
    },
  },
};

// Initial preloaded samples is empty as requested by user (0 dummy images)
export const ROCK_SAMPLES: RockSample[] = [];
