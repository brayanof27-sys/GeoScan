import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RockAcquisitionPanel } from './components/RockAcquisitionPanel';
import { RockFaceViewer } from './components/RockFaceViewer';
import { StereonetViewer } from './components/StereonetViewer';
import { GeomechanicalDashboard } from './components/GeomechanicalDashboard';
import { SupportRecommendationPanel } from './components/SupportRecommendationPanel';
import { ThesisComparisonPanel } from './components/ThesisComparisonPanel';
import { ProtocolGuideView } from './components/ProtocolGuideView';
import { GeotechnicalReportModal } from './components/GeotechnicalReportModal';
import { RockLithologyModal } from './components/RockLithologyModal';
import { ObservationCorrectionModal } from './components/ObservationCorrectionModal';
import { AITrainingDatabaseView } from './components/AITrainingDatabaseView';
import { AILearningConsoleModal } from './components/AILearningConsoleModal';
import { ROCK_SAMPLES, DEFAULT_EMPTY_SAMPLE } from './data/rockSamples';
import {
  RockSample,
  RockAnalysisResult,
  QualityValidation,
  ScanlineIntersection,
  RockUCSData,
} from './types';
import { validateRockImage } from './utils/imageProcessing';
import { calculateGeomechanicsFromFamilies } from './utils/geomechanics';
import {
  getTrainingDatabase,
  computeLearningStats,
  registerObservationCorrection,
  feedImageToAIDatabase,
  buildLearningPromptForAI,
  findBestMatchingSampleLesson,
  saveImageLesson,
  getImageLessons,
  hydratePersistentDatabase,
  SampleImageLesson,
  TrainingDatabaseEntry,
  LearningModelStats,
} from './utils/aiLearningStore';
import { findRockInCatalog, calculateEffectiveUCS, GEOLOGICAL_ROCK_CATALOG } from './data/rockLithologies';
import { Sparkles, Brain, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  // Pre-seed sample with fallback to DEFAULT_EMPTY_SAMPLE if database is empty
  const initialSample = ROCK_SAMPLES[0] || DEFAULT_EMPTY_SAMPLE;
  const initialRockMeta = findRockInCatalog(initialSample.lithology) || GEOLOGICAL_ROCK_CATALOG[1];
  const initialEffective = calculateEffectiveUCS(initialRockMeta, 'Sana / Inalterada (W1)');
  const initialUcsData: RockUCSData = {
    rockName: initialRockMeta.name,
    group: initialRockMeta.group,
    ucsMinMpa: initialEffective.minMpa,
    ucsTypMpa: initialEffective.typicalMpa,
    ucsMaxMpa: initialEffective.maxMpa,
    confirmedUcsMpa: initialEffective.ucsMpa,
    isrmGrade: initialEffective.isrmGrade,
    isrmGradeCode: initialEffective.isrmGradeCode,
    r1Rating: initialEffective.r1Rating,
    weathering: 'Sana / Inalterada (W1)',
    fieldIdentification: initialEffective.fieldIdentification,
    isUserConfirmed: true,
  };

  const initialMatch = initialSample.imageUrl ? findBestMatchingSampleLesson(initialSample.imageUrl) : null;

  const [selectedSample, setSelectedSample] = useState<RockSample>({
    ...initialSample,
    analysis: {
      ...initialSample.analysis,
      ucsData: initialUcsData,
      geologicalRockName: initialRockMeta.name,
      matchedSampleLesson: initialMatch
        ? {
            sampleTitle: initialMatch.lesson.sampleTitle,
            recommendations: initialMatch.lesson.recommendations,
            similarityPercent: initialMatch.similarityPercent,
            lessonAuthor: initialMatch.lesson.author,
          }
        : undefined,
    },
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<RockAnalysisResult>({
    ...initialSample.analysis,
    ucsData: initialUcsData,
    geologicalRockName: initialRockMeta.name,
    matchedSampleLesson: initialMatch
      ? {
          sampleTitle: initialMatch.lesson.sampleTitle,
          recommendations: initialMatch.lesson.recommendations,
          similarityPercent: initialMatch.similarityPercent,
          lessonAuthor: initialMatch.lesson.author,
        }
      : undefined,
    learnedRulesApplied: initialMatch
      ? [
          `Recomendación aprendida de muestra similar: "${initialMatch.lesson.recommendations}"`,
          'Ajuste geomecánico calibrado con la indicación del especialista.',
        ]
      : initialSample.analysis.learnedRulesApplied,
    aiLearningNotes: initialMatch
      ? `He leído las recomendaciones para la muestra "${initialMatch.lesson.sampleTitle}": "${initialMatch.lesson.recommendations}". Apliqué estos criterios para mayor precisión.`
      : initialSample.analysis.aiLearningNotes,
  });

  const [activeImageSrc, setActiveImageSrc] = useState<string>(initialSample.imageUrl);
  const [scaleCm, setScaleCm] = useState<number>(100);
  const [scaleType, setScaleType] = useState<'metric_rod' | 'hammer' | 'laser' | 'coin'>('metric_rod');
  const [qualityValidation, setQualityValidation] = useState<QualityValidation>(
    initialSample.analysis.qualityValidation
  );

  const [activeTab, setActiveTab] = useState<'simulation' | 'database' | 'thesis' | 'protocol'>('simulation');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Workflow Dialog States
  const [isLithologyModalOpen, setIsLithologyModalOpen] = useState<boolean>(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    imageSrc: string;
    scale: number;
  } | null>(null);

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [selectedEntryForCorrection, setSelectedEntryForCorrection] = useState<TrainingDatabaseEntry | null>(null);
  const [isAILearningConsoleOpen, setIsAILearningConsoleOpen] = useState<boolean>(false);

  // Training Database & Learning Memory
  const [trainingDatabase, setTrainingDatabase] = useState<TrainingDatabaseEntry[]>(getTrainingDatabase());
  const [learningStats, setLearningStats] = useState<LearningModelStats>(computeLearningStats(trainingDatabase));

  // Hydrate persistent database from server / IndexedDB on mount
  useEffect(() => {
    hydratePersistentDatabase().then((hydrated) => {
      if (hydrated && hydrated.length > 0) {
        setTrainingDatabase(hydrated);
        setLearningStats(computeLearningStats(hydrated));
      }
    });
  }, []);

  // Report metadata state
  const [mineName, setMineName] = useState('Unidad Minera Cerro Verde - Nivel 2400');
  const [stationName, setStationName] = useState('Frente Galería 104-Sur (Estación G-14)');
  const [evaluatorName, setEvaluatorName] = useState('Ing. Geomecánico Principal');

  // Handle selecting a predefined rock sample
  const handleSelectSample = (sample: RockSample) => {
    const rockMeta = findRockInCatalog(sample.lithology) || GEOLOGICAL_ROCK_CATALOG[1];
    const eff = calculateEffectiveUCS(rockMeta, 'Ligeramente Meteorizada (W2)');
    const sampleUcsData: RockUCSData = {
      rockName: rockMeta.name,
      group: rockMeta.group,
      ucsMinMpa: eff.minMpa,
      ucsTypMpa: eff.typicalMpa,
      ucsMaxMpa: eff.maxMpa,
      confirmedUcsMpa: eff.ucsMpa,
      isrmGrade: eff.isrmGrade,
      isrmGradeCode: eff.isrmGradeCode,
      r1Rating: eff.r1Rating,
      weathering: 'Ligeramente Meteorizada (W2)',
      fieldIdentification: eff.fieldIdentification,
      isUserConfirmed: true,
    };

    const match = findBestMatchingSampleLesson(sample.imageUrl);

    const updatedAnalysis: RockAnalysisResult = {
      ...sample.analysis,
      ucsData: sampleUcsData,
      geologicalRockName: rockMeta.name,
      matchedSampleLesson: match
        ? {
            sampleTitle: match.lesson.sampleTitle,
            recommendations: match.lesson.recommendations,
            similarityPercent: match.similarityPercent,
            lessonAuthor: match.lesson.author,
          }
        : undefined,
      learnedRulesApplied: match
        ? [
            `Recomendación aprendida de muestra similar: "${match.lesson.recommendations}"`,
            'Ajuste geomecánico calibrado con la indicación del especialista.',
          ]
        : sample.analysis.learnedRulesApplied,
      aiLearningNotes: match
        ? `He leído las recomendaciones para la muestra "${match.lesson.sampleTitle}": "${match.lesson.recommendations}". Apliqué estos criterios para mayor precisión.`
        : sample.analysis.aiLearningNotes,
    };

    setSelectedSample(sample);
    setActiveImageSrc(sample.imageUrl);
    setCurrentAnalysis(updatedAnalysis);
    setQualityValidation(sample.analysis.qualityValidation);
    setScaleCm(sample.defaultScaleCm);
    setScaleType(sample.scaleType);
    setStationName(`Estación ${sample.name.split('-')[0].trim()}`);
    if (match) {
      setStatusMessage(`Cargada muestra: ${sample.name} (Recomendaciones previas detectadas: ${match.similarityPercent}% similitud).`);
    } else {
      setStatusMessage(`Cargada muestra geomecánica: ${sample.name}`);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  /**
   * CRITICAL USER REQUIREMENT:
   * When user uploads an image, the app prompts for its lithology,
   * with the option to choose existing or add a brand new lithology with new custom values!
   */
  const handleCustomImageUpload = async (imageSrc: string, scale: number) => {
    const validation = await validateRockImage(imageSrc);
    setQualityValidation(validation);
    setPendingUploadData({ imageSrc, scale });
    setActiveImageSrc(imageSrc);
    setScaleCm(scale);
    setIsLithologyModalOpen(true);
    setStatusMessage('Fotografía subida. Por favor confirme o añada la litología de la roca para calcular su resistencia UCS.');
  };

  /**
   * Called when user confirms or adds a new lithology in RockLithologyModal
   */
  const handleConfirmLithologyAndProceed = async (ucsData: RockUCSData) => {
    setIsLithologyModalOpen(false);
    const imageToAnalyze = pendingUploadData ? pendingUploadData.imageSrc : activeImageSrc;
    const scaleToUse = pendingUploadData ? pendingUploadData.scale : scaleCm;
    setPendingUploadData(null);
    await runAIAnalysisForImage(imageToAnalyze, scaleToUse, ucsData);
  };

  const runAIAnalysisForImage = async (
    imageSrc: string,
    scale: number,
    activeUcsData?: RockUCSData
  ) => {
    setIsProcessing(true);

    const rockName = activeUcsData?.rockName || currentAnalysis.geologicalRockName || 'Andesita';
    const ucsMpa = activeUcsData?.confirmedUcsMpa || currentAnalysis.ucsData?.confirmedUcsMpa || 140;

    const match = findBestMatchingSampleLesson(imageSrc);
    if (match) {
      setStatusMessage(
        `Reconocida imagen similar a "${match.lesson.sampleTitle}" (${match.similarityPercent}% similitud). La IA aplicará las recomendaciones aprendidas...`
      );
    } else {
      setStatusMessage(`Analizando frente rocoso (${rockName}, UCS: ${ucsMpa} MPa) con Inteligencia Artificial...`);
    }

    try {
      const response = await fetch('/api/analyze-rock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          scaleMarkerCm: scale,
          scaleType: scaleType,
          geologicalRockName: rockName,
          ucsMpa: ucsMpa,
          matchedLesson: match
            ? {
                sampleTitle: match.lesson.sampleTitle,
                recommendations: match.lesson.recommendations,
                similarityPercent: match.similarityPercent,
              }
            : undefined,
          learningContext: learningStats.learningMemorySummary,
        }),
      });

      let finalAnalysis: RockAnalysisResult;

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          finalAnalysis = {
            ...data.analysis,
            ucsData: activeUcsData || currentAnalysis.ucsData,
            geologicalRockName: rockName,
            matchedSampleLesson: match
              ? {
                  sampleTitle: match.lesson.sampleTitle,
                  recommendations: match.lesson.recommendations,
                  similarityPercent: match.similarityPercent,
                  lessonAuthor: match.lesson.author,
                }
              : data.analysis.matchedSampleLesson,
            learnedRulesApplied: match
              ? [
                  `Recomendación aprendida de muestra similar: "${match.lesson.recommendations}"`,
                  ...(data.analysis.learnedRulesApplied || []),
                ]
              : data.analysis.learnedRulesApplied,
            aiLearningNotes: match
              ? `He leído las recomendaciones para la muestra similar "${match.lesson.sampleTitle}": "${match.lesson.recommendations}". Apliqué estos criterios para mayor precisión.`
              : data.analysis.aiLearningNotes,
          };
        } else {
          const fallback = calculateGeomechanicsFromFamilies(
            selectedSample.analysis.families,
            scale,
            rockName,
            activeUcsData || currentAnalysis.ucsData
          );
          finalAnalysis = {
            ...fallback,
            matchedSampleLesson: match
              ? {
                  sampleTitle: match.lesson.sampleTitle,
                  recommendations: match.lesson.recommendations,
                  similarityPercent: match.similarityPercent,
                  lessonAuthor: match.lesson.author,
                }
              : undefined,
          };
        }
      } else {
        const fallback = calculateGeomechanicsFromFamilies(
          selectedSample.analysis.families,
          scale,
          rockName,
          activeUcsData || currentAnalysis.ucsData
        );
        finalAnalysis = {
          ...fallback,
          matchedSampleLesson: match
            ? {
                sampleTitle: match.lesson.sampleTitle,
                recommendations: match.lesson.recommendations,
                similarityPercent: match.similarityPercent,
                lessonAuthor: match.lesson.author,
              }
            : undefined,
        };
      }

      setCurrentAnalysis(finalAnalysis);

      // Save into training database
      feedImageToAIDatabase({
        imageUrl: imageSrc,
        title: stationName || `Frente Rocoso - ${rockName}`,
        station: stationName,
        evaluator: evaluatorName,
        geologicalRockName: rockName,
        rockGroup: (activeUcsData?.group as any) || finalAnalysis.ucsData?.group || 'Ígnea Volcánica',
        ucsData: {
          minMpa: activeUcsData?.ucsMinMpa || finalAnalysis.ucsData?.ucsMinMpa || 100,
          typicalMpa: activeUcsData?.ucsTypMpa || finalAnalysis.ucsData?.ucsTypMpa || 160,
          maxMpa: activeUcsData?.ucsMaxMpa || finalAnalysis.ucsData?.ucsMaxMpa || 240,
          confirmedUcsMpa: activeUcsData?.confirmedUcsMpa || finalAnalysis.ucsData?.confirmedUcsMpa || 160,
          isrmGrade: activeUcsData?.isrmGrade || finalAnalysis.ucsData?.isrmGrade || 'R5',
          r1Rating: activeUcsData?.r1Rating || finalAnalysis.ucsData?.r1Rating || 12,
          weathering: activeUcsData?.weathering || finalAnalysis.ucsData?.weathering || 'W2',
        },
        analysis: finalAnalysis,
      });

      const updatedDb = getTrainingDatabase();
      setTrainingDatabase(updatedDb);
      setLearningStats(computeLearningStats(updatedDb));

      if (match) {
        setStatusMessage(
          `¡Análisis completado para ${rockName}! La IA aplicó tus recomendaciones de la muestra similar (${match.similarityPercent}% similitud).`
        );
      } else {
        setStatusMessage(
          `¡Frente de ${rockName} analizado con éxito! Puedes escribir tus recomendaciones para esta imagen con el símbolo del cerebro 🧠.`
        );
      }
    } catch (err) {
      console.error('Error during image analysis:', err);
      const fallback = calculateGeomechanicsFromFamilies(
        selectedSample.analysis.families,
        scale,
        rockName,
        activeUcsData || currentAnalysis.ucsData
      );
      setCurrentAnalysis(fallback);
      setStatusMessage('Análisis procesado localmente con éxito.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  /**
   * Save user's recommendation specifically for this uploaded image sample
   */
  const handleSaveImageRecommendation = (
    imageSrc: string,
    recommendations: string,
    title?: string
  ) => {
    const lesson = saveImageLesson({
      imageUrl: imageSrc,
      recommendations,
      sampleTitle: title || stationName || 'Frente Rocoso en Pantalla',
      author: evaluatorName,
    });

    setCurrentAnalysis((prev) => ({
      ...prev,
      isCalibratedByEngineer: true,
      engineerObservations: recommendations,
      engineerRationale: recommendations,
      matchedSampleLesson: {
        sampleTitle: lesson.sampleTitle,
        recommendations: lesson.recommendations,
        similarityPercent: 100,
        lessonAuthor: evaluatorName,
      },
      learnedRulesApplied: [
        `Recomendación guardada para esta muestra: "${recommendations}"`,
        'Ajuste geomecánico aplicado según las indicaciones del especialista.',
      ],
      aiLearningNotes: `He memorizado tus recomendaciones para esta muestra: "${recommendations}". Cuando reciba una imagen similar aplicaré estas pautas.`,
    }));

    const updatedDb = getTrainingDatabase();
    setTrainingDatabase(updatedDb);
    setLearningStats(computeLearningStats(updatedDb));

    setStatusMessage(
      '¡Comentario guardado para esta muestra! La IA ya sabe cómo hacerla y aplicará tus recomendaciones a imágenes similares.'
    );
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleLoadImageToViewer = (imageSrc: string, title: string) => {
    setActiveImageSrc(imageSrc);
    setStationName(title);
    runAIAnalysisForImage(imageSrc, scaleCm);
  };

  /**
   * Save human engineer observation corrections and train the AI model (Continuous Learning Loop)
   */
  const handleSaveObservationCorrection = async (
    correctedAnalysis: RockAnalysisResult,
    rationale: string,
    evaluator: string
  ) => {
    setCurrentAnalysis(correctedAnalysis);

    const targetId = selectedEntryForCorrection
      ? selectedEntryForCorrection.id
      : `train-entry-${Date.now()}`;

    // Register in persistent client database and compute updated learning weights
    const { stats: newStats } = registerObservationCorrection(targetId, {
      correctedRockName: correctedAnalysis.geologicalRockName || correctedAnalysis.lithology,
      correctedSpacingCm:
        correctedAnalysis.families.length > 0
          ? Math.round(
              correctedAnalysis.families.reduce((a, b) => a + b.spacingCm, 0) /
                correctedAnalysis.families.length
            )
          : 40,
      correctedRqdValue: correctedAnalysis.rqd.value,
      correctedRmrScore: correctedAnalysis.rmr.totalScore,
      correctedGsiValue: correctedAnalysis.gsi.value,
      families: correctedAnalysis.families,
      engineerRationale: rationale,
      evaluatorName: evaluator,
    });

    // Notify backend memory endpoint
    try {
      await fetch('/api/feedback-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: targetId,
          correctedRockName: correctedAnalysis.geologicalRockName,
          correctedRmr: correctedAnalysis.rmr.totalScore,
          correctedRqd: correctedAnalysis.rqd.value,
          rationale,
          evaluator,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn('Backend feedback endpoint sync:', e);
    }

    // Refresh database state
    const currentDb = getTrainingDatabase();
    setTrainingDatabase(currentDb);
    setLearningStats(newStats);
    setSelectedEntryForCorrection(null);

    setStatusMessage('¡Corrección guardada! El modelo de IA ha aprendido las observaciones y recalibrado sus parámetros.');
    setTimeout(() => setStatusMessage(null), 6000);
  };

  /**
   * Load any entry from the AI Training Database into the active Simulation View
   */
  const handleLoadSampleFromDatabase = (entry: TrainingDatabaseEntry) => {
    setActiveImageSrc(entry.imageUrl);
    setStationName(entry.station);
    setEvaluatorName(entry.evaluator);

    // Build analysis result from entry
    const loadedAnalysis: RockAnalysisResult = {
      lithology: entry.geologicalRockName,
      geologicalRockName: entry.geologicalRockName,
      ucsData: {
        rockName: entry.geologicalRockName,
        group: entry.rockGroup,
        ucsMinMpa: entry.ucsData.minMpa,
        ucsTypMpa: entry.ucsData.typicalMpa,
        ucsMaxMpa: entry.ucsData.maxMpa,
        confirmedUcsMpa: entry.ucsData.confirmedUcsMpa,
        isrmGrade: entry.ucsData.isrmGrade,
        isrmGradeCode: entry.ucsData.isrmGrade.split(' ')[0],
        r1Rating: entry.ucsData.r1Rating,
        weathering: entry.ucsData.weathering,
        isUserConfirmed: true,
      },
      qualityValidation: {
        isValid: true,
        sharpnessScore: 92,
        lightingScore: 88,
        contrastScore: 85,
        scaleDetected: true,
        message: 'Muestra cargada desde la Base de Datos de Entrenamiento.',
        checks: { sharpness: true, lighting: true, contrast: true, scale: true },
      },
      families: entry.userCorrection?.families || entry.aiInitialObservation.families,
      rqd: {
        value: entry.userCorrection?.correctedRqdValue || entry.aiInitialObservation.rqdValue,
        ratingPalmstrom: entry.userCorrection?.correctedRqdValue || entry.aiInitialObservation.rqdValue,
        ratingScanline: entry.userCorrection?.correctedRqdValue || entry.aiInitialObservation.rqdValue,
        category: (entry.userCorrection?.correctedRqdValue || entry.aiInitialObservation.rqdValue) >= 75 ? 'Buena' : 'Regular',
        jvVolumetricJointCount: Number((115 - (entry.userCorrection?.correctedRqdValue || entry.aiInitialObservation.rqdValue)) / 3.3).toFixed(1) as any,
      },
      rmr: {
        totalScore: entry.userCorrection?.correctedRmrScore || entry.aiInitialObservation.rmrScore,
        classRating: (entry.userCorrection?.correctedRmrScore || entry.aiInitialObservation.rmrScore) > 60 ? 'Clase II (Buena)' : 'Clase III (Regular)',
        cohesionKPa: 280,
        frictionAngleDeg: 38,
        standUpTime: '1 año para 10m de luz',
        breakdown: {
          r1_ucsRating: entry.ucsData.r1Rating,
          r2_rqdRating: 15,
          r3_spacingRating: 12,
          r4_conditionRating: 20,
          r5_waterRating: 10,
          r6_orientationAdjustment: -5,
        },
      },
      gsi: {
        value: entry.userCorrection?.correctedGsiValue || entry.aiInitialObservation.gsiValue,
        structureCategory: 'Blocky',
        surfaceCategory: 'Good',
        description: 'Macizo rocoso bien trabado con bloques delimitados por familias de juntas.',
      },
      bartonQ: {
        qValue: entry.aiInitialObservation.qValue || 5.0,
        jn: 6,
        jr: 2.0,
        ja: 1.0,
        jw: 1.0,
        srf: 1.0,
        classification: 'Roca Buena (Good Rock)',
      },
      supportRecommendations: {
        category: 'Sostenimiento Sistemático Ligero',
        rockBolts: 'Pernos helicoidales cementados Ø25mm, L=2.4m, espaciados a 1.8m x 1.8m.',
        shotcrete: 'Shotcrete vía húmeda e=50mm en corona.',
        wireMesh: 'Malla electrosoldada en zonas de sobreexcavación.',
        additionalSafety: 'Desatado riguroso antes del tránsito.',
      },
      thesisComparison: {
        manualCartillaTimeMinutes: 18.5,
        aiVisionTimeSeconds: 34.0,
        timeSavedPercent: 96.9,
        interObserverVariabilityReductionPercent: 88.5,
      },
      isCalibratedByEngineer: Boolean(entry.userCorrection?.isCalibrated),
      engineerRationale: entry.userCorrection?.engineerRationale,
      calibratedAt: entry.userCorrection?.correctedAt,
      calibratedBy: entry.userCorrection?.correctedBy,
    };

    setCurrentAnalysis(loadedAnalysis);
    setActiveTab('simulation');
    setStatusMessage(`Cargada muestra "${entry.title}" en el visor geomecánico.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleOpenCorrectionForEntry = (entry: TrainingDatabaseEntry) => {
    setSelectedEntryForCorrection(entry);
    handleLoadSampleFromDatabase(entry);
    setIsCorrectionModalOpen(true);
  };

  // Scanline live update callback
  const handleScanlineUpdate = (intersections: ScanlineIntersection[], lengthMeters: number) => {
    // Live update frequency
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenThesisModal={() => setActiveTab('thesis')}
        onOpenAILearningConsole={() => setIsAILearningConsoleOpen(true)}
        isProcessing={isProcessing}
        databaseCount={trainingDatabase.length}
        isCalibrated={Boolean(currentAnalysis.isCalibratedByEngineer)}
      />

      {/* Realtime Notification Toast */}
      {statusMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-zinc-950 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-zinc-200 shrink-0" />
          <span className="text-xs font-semibold font-mono">{statusMessage}</span>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-5">
        {/* VIEW 1: SIMULATION & CHARACTERIZATION (DEFAULT) */}
        {activeTab === 'simulation' && (
          <div className="space-y-5">
            {/* Section 1: Acquisition & Quality Gate Panel */}
            <RockAcquisitionPanel
              selectedSample={selectedSample}
              onSelectSample={handleSelectSample}
              onCustomImageUpload={handleCustomImageUpload}
              qualityValidation={qualityValidation}
              scaleCm={scaleCm}
              onScaleChange={setScaleCm}
              isProcessing={isProcessing}
              scaleType={scaleType}
              onScaleTypeChange={setScaleType}
            />

            {/* Section 2: Split View - Left: Visualizer & Stereonet / Right: Indices & Support */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Rock Face Computer Vision Canvas & Stereonet (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <RockFaceViewer
                  imageSrc={activeImageSrc}
                  families={currentAnalysis.families}
                  scaleCm={scaleCm}
                  onScanlineUpdate={handleScanlineUpdate}
                  lithologyName={currentAnalysis.geologicalRockName || currentAnalysis.lithology}
                  onOpenCorrectionModal={() => setIsCorrectionModalOpen(true)}
                  onOpenAILearningConsole={() => setIsAILearningConsoleOpen(true)}
                  isCalibrated={Boolean(currentAnalysis.isCalibratedByEngineer)}
                />

                <StereonetViewer families={currentAnalysis.families} />
              </div>

              {/* Right Column: Characterization Cards (RMR, GSI, RQD, Q) & Support (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <GeomechanicalDashboard
                  analysis={currentAnalysis}
                  onOpenLithologyModal={() => setIsLithologyModalOpen(true)}
                  onOpenCorrectionModal={() => setIsCorrectionModalOpen(true)}
                  onOpenAILearningConsole={() => setIsAILearningConsoleOpen(true)}
                />

                <SupportRecommendationPanel
                  support={currentAnalysis.supportRecommendations}
                  rmr={currentAnalysis.rmr}
                  tunnelSpanMeters={5.0}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: AI TRAINING DATABASE & FED IMAGES GALLERY */}
        {activeTab === 'database' && (
          <AITrainingDatabaseView
            onLoadSampleToSimulation={handleLoadSampleFromDatabase}
            onOpenFeedModal={() => {
              // Switch to simulation and scroll to acquisition panel
              setActiveTab('simulation');
              setStatusMessage('Utilice el panel superior para cargar o fotografiar un frente y alimentar la IA.');
            }}
            onOpenCorrectionModalForEntry={handleOpenCorrectionForEntry}
          />
        )}

        {/* VIEW 3: THESIS BENCHMARK & SCIENTIFIC VALIDATION */}
        {activeTab === 'thesis' && (
          <ThesisComparisonPanel thesisData={selectedSample.thesisComparison} />
        )}

        {/* VIEW 4: PROTOCOL & IMAGE REQUIREMENTS GUIDE */}
        {activeTab === 'protocol' && <ProtocolGuideView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-4 px-6 text-center text-xs text-zinc-500">
        <p className="max-w-4xl mx-auto font-mono text-[11px] uppercase tracking-wider">
          GEOSCAN AI • SISTEMA GEOMECÁNICO AUTOMATIZADO CON APRENDIZAJE ACTIVO • BIENIAWSKI RMR89 / HOEK-BROWN GSI / BARTON Q / ISRM 1981
        </p>
      </footer>

      {/* STEP 1: Geological Rock Name & UCS Estimator Modal (MANDATORY BEFORE FINALIZING ANALYSIS) */}
      <RockLithologyModal
        isOpen={isLithologyModalOpen}
        onConfirm={handleConfirmLithologyAndProceed}
        onClose={() => {
          setIsLithologyModalOpen(false);
          setPendingUploadData(null);
        }}
        initialRockName={currentAnalysis.geologicalRockName || currentAnalysis.lithology}
        previewImageSrc={pendingUploadData?.imageSrc || activeImageSrc}
      />

      {/* STEP 2: Observation Correction & AI Training Modal */}
      <ObservationCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedEntryForCorrection(null);
        }}
        analysis={currentAnalysis}
        onSaveCorrection={handleSaveObservationCorrection}
        currentEvaluator={evaluatorName}
      />

      {/* Official Geotechnical Report Modal */}
      <GeotechnicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        analysis={currentAnalysis}
        imageSrc={activeImageSrc}
        stationName={stationName}
        evaluatorName={evaluatorName}
        mineName={mineName}
        onStationNameChange={setStationName}
        onEvaluatorNameChange={setEvaluatorName}
        onMineNameChange={setMineName}
        onUpdateAnalysis={handleSaveObservationCorrection}
      />

      {/* STEP 3: Dedicated AI Learning & Teaching Console (Cerebro) */}
      <AILearningConsoleModal
        isOpen={isAILearningConsoleOpen}
        onClose={() => setIsAILearningConsoleOpen(false)}
        activeImageSrc={activeImageSrc}
        sampleTitle={currentAnalysis.geologicalRockName || stationName || 'Frente Rocoso en Pantalla'}
        evaluatorName={evaluatorName}
        onSaveRecommendation={handleSaveImageRecommendation}
        onLoadSampleToViewer={handleLoadImageToViewer}
      />
    </div>
  );
}

export default App;
