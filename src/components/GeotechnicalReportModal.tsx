import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Layers,
  ShieldCheck,
  Edit3,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Brain,
  HelpCircle,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RockAnalysisResult } from '../types';
import { exportSingleCartillaToExcel, formatDateTime } from '../utils/geomechanicalExcelExport';

interface GeotechnicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: RockAnalysisResult;
  imageSrc: string;
  stationName: string;
  evaluatorName: string;
  mineName: string;
  onStationNameChange: (v: string) => void;
  onEvaluatorNameChange: (v: string) => void;
  onMineNameChange: (v: string) => void;
  onUpdateAnalysis?: (updated: RockAnalysisResult, rationale: string) => void;
}

export const GeotechnicalReportModal: React.FC<GeotechnicalReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  imageSrc,
  stationName,
  evaluatorName,
  mineName,
  onStationNameChange,
  onEvaluatorNameChange,
  onMineNameChange,
  onUpdateAnalysis,
}) => {
  if (!isOpen) return null;

  // Toggle Edit/Correction mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Editable Form State
  const [editedLithology, setEditedLithology] = useState<string>(
    analysis.geologicalRockName || analysis.lithology
  );
  const [editedUcs, setEditedUcs] = useState<number>(
    analysis.ucsData?.confirmedUcsMpa || 160
  );
  const [editedRmr, setEditedRmr] = useState<number>(analysis.rmr.totalScore);
  const [editedRmrClass, setEditedRmrClass] = useState<string>(analysis.rmr.classRating);
  const [editedRqd, setEditedRqd] = useState<number>(analysis.rqd.value);
  const [editedGsi, setEditedGsi] = useState<number>(analysis.gsi.value);
  const [editedGsiStructure, setEditedGsiStructure] = useState<any>(analysis.gsi.structureCategory);
  const [editedQ, setEditedQ] = useState<number>(analysis.bartonQ.qValue);
  const [editedCohesion, setEditedCohesion] = useState<number>(analysis.rmr.cohesionKPa);
  const [editedFriction, setEditedFriction] = useState<number>(analysis.rmr.frictionAngleDeg);

  // Individual RMR 89 Parameter Ratings (User Requirement: RQD score e.g. 6 pts, etc.)
  const [editedR1, setEditedR1] = useState<number>(analysis.rmr.breakdown.r1_ucsRating);
  const [editedR2, setEditedR2] = useState<number>(analysis.rmr.breakdown.r2_rqdRating);
  const [editedR3, setEditedR3] = useState<number>(analysis.rmr.breakdown.r3_spacingRating);
  const [editedR4, setEditedR4] = useState<number>(analysis.rmr.breakdown.r4_conditionRating);
  const [editedR5, setEditedR5] = useState<number>(analysis.rmr.breakdown.r5_waterRating);
  const [editedR6, setEditedR6] = useState<number>(analysis.rmr.breakdown.r6_orientationAdjustment);

  // R4 Condition Sub-Parameters (0-6 each according to Bieniawski 1989 chart)
  const initialR4 = analysis.rmr.breakdown.r4_conditionRating || 23;
  const baseSub = Math.floor(initialR4 / 5);
  const remSub = initialR4 % 5;
  const [editedR4_1, setEditedR4_1] = useState<number>(Math.min(6, baseSub + (remSub > 0 ? 1 : 0)));
  const [editedR4_2, setEditedR4_2] = useState<number>(Math.min(6, baseSub + (remSub > 1 ? 1 : 0)));
  const [editedR4_3, setEditedR4_3] = useState<number>(Math.min(6, baseSub + (remSub > 2 ? 1 : 0)));
  const [editedR4_4, setEditedR4_4] = useState<number>(Math.min(6, baseSub + (remSub > 3 ? 1 : 0)));
  const [editedR4_5, setEditedR4_5] = useState<number>(
    Math.max(0, initialR4 - (Math.min(6, baseSub + (remSub > 0 ? 1 : 0)) + Math.min(6, baseSub + (remSub > 1 ? 1 : 0)) + Math.min(6, baseSub + (remSub > 2 ? 1 : 0)) + Math.min(6, baseSub + (remSub > 3 ? 1 : 0))))
  );
  const [showR4Details, setShowR4Details] = useState<boolean>(false);

  // Handle R4 sub-parameter edit
  const handleSubR4Change = (subKey: 'r4_1' | 'r4_2' | 'r4_3' | 'r4_4' | 'r4_5', val: number) => {
    const clamped = Math.max(0, Math.min(6, val));
    const v1 = subKey === 'r4_1' ? clamped : editedR4_1;
    const v2 = subKey === 'r4_2' ? clamped : editedR4_2;
    const v3 = subKey === 'r4_3' ? clamped : editedR4_3;
    const v4 = subKey === 'r4_4' ? clamped : editedR4_4;
    const v5 = subKey === 'r4_5' ? clamped : editedR4_5;
    if (subKey === 'r4_1') setEditedR4_1(clamped);
    if (subKey === 'r4_2') setEditedR4_2(clamped);
    if (subKey === 'r4_3') setEditedR4_3(clamped);
    if (subKey === 'r4_4') setEditedR4_4(clamped);
    if (subKey === 'r4_5') setEditedR4_5(clamped);
    const sumR4 = v1 + v2 + v3 + v4 + v5;
    setEditedR4(sumR4);
    updateScoresFromComponents(editedR1, editedR2, editedR3, sumR4, editedR5, editedR6);
  };

  // Formatted Date and Time for Cartilla and Excel Export
  const initialDateTime = formatDateTime(analysis.analyzedAt);
  const [cartillaDate, setCartillaDate] = useState<string>(initialDateTime.dateStr);
  const [cartillaTime, setCartillaTime] = useState<string>(initialDateTime.timeStr);

  // Editable Support Recommendations
  const [editedBolts, setEditedBolts] = useState<string>(analysis.supportRecommendations.rockBolts);
  const [editedShotcrete, setEditedShotcrete] = useState<string>(analysis.supportRecommendations.shotcrete);
  const [editedWireMesh, setEditedWireMesh] = useState<string>(analysis.supportRecommendations.wireMesh);
  const [editedStandUp, setEditedStandUp] = useState<string>(analysis.rmr.standUpTime);

  // Free-form Observations and Technical Corrections Rationale
  const [engineerObservations, setEngineerObservations] = useState<string>(
    analysis.engineerObservations ||
      analysis.engineerRationale ||
      'Se verificaron las discontinuidades en campo mediante flexómetro y brújula Brunton. Los parámetros geomecánicos fueron validados y ajustados según las condiciones geológicas observadas en la labor.'
  );

  const [hasUnsavedEdits, setHasUnsavedEdits] = useState<boolean>(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Recalculate total RMR from R1 to R6
  const updateScoresFromComponents = (r1: number, r2: number, r3: number, r4: number, r5: number, r6: number) => {
    const total = Math.min(100, Math.max(0, r1 + r2 + r3 + r4 + r5 + r6));
    setEditedRmr(total);
    if (total > 80) setEditedRmrClass('Clase I (Muy Buena)');
    else if (total > 60) setEditedRmrClass('Clase II (Buena)');
    else if (total > 40) setEditedRmrClass('Clase III (Regular)');
    else if (total > 20) setEditedRmrClass('Clase IV (Mala)');
    else setEditedRmrClass('Clase V (Muy Mala)');
    setHasUnsavedEdits(true);
  };

  const handlePrint = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (_) {}
    window.print();
  };

  // Download Cartilla in Excel (.xlsx) format
  const handleDownloadExcel = () => {
    exportSingleCartillaToExcel(
      {
        ...analysis,
        lithology: editedLithology,
        geologicalRockName: editedLithology,
        ucsData: analysis.ucsData
          ? {
              ...analysis.ucsData,
              rockName: editedLithology,
              confirmedUcsMpa: editedUcs,
            }
          : undefined,
        rmr: {
          ...analysis.rmr,
          totalScore: editedRmr,
          classRating: editedRmrClass as any,
          cohesionKPa: editedCohesion,
          frictionAngleDeg: editedFriction,
          standUpTime: editedStandUp,
          breakdown: {
            r1_ucsRating: editedR1,
            r2_rqdRating: editedR2,
            r3_spacingRating: editedR3,
            r4_conditionRating: editedR4,
            r5_waterRating: editedR5,
            r6_orientationAdjustment: editedR6,
          },
        },
        rqd: {
          ...analysis.rqd,
          value: editedRqd,
        },
        engineerObservations,
      },
      {
        stationName,
        evaluatorName,
        mineName,
        dateStr: cartillaDate,
        timeStr: cartillaTime,
      }
    );
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Apply edits to technical sheet and propagate to main app
  const handleApplyCorrections = () => {
    const updatedAnalysis: RockAnalysisResult = {
      ...analysis,
      lithology: editedLithology,
      geologicalRockName: editedLithology,
      ucsData: analysis.ucsData
        ? {
            ...analysis.ucsData,
            rockName: editedLithology,
            confirmedUcsMpa: editedUcs,
          }
        : undefined,
      rmr: {
        ...analysis.rmr,
        totalScore: editedRmr,
        classRating: editedRmrClass as any,
        cohesionKPa: editedCohesion,
        frictionAngleDeg: editedFriction,
        standUpTime: editedStandUp,
      },
      rqd: {
        ...analysis.rqd,
        value: editedRqd,
        category: editedRqd >= 75 ? 'Buena' : editedRqd >= 50 ? 'Regular' : 'Mala',
      },
      gsi: {
        ...analysis.gsi,
        value: editedGsi,
        structureCategory: editedGsiStructure,
      },
      bartonQ: {
        ...analysis.bartonQ,
        qValue: editedQ,
      },
      supportRecommendations: {
        ...analysis.supportRecommendations,
        rockBolts: editedBolts,
        shotcrete: editedShotcrete,
        wireMesh: editedWireMesh,
      },
      isCalibratedByEngineer: true,
      engineerObservations: engineerObservations,
      engineerRationale: engineerObservations,
      calibratedAt: new Date().toISOString(),
      calibratedBy: evaluatorName,
    };

    if (onUpdateAnalysis) {
      onUpdateAnalysis(updatedAnalysis, engineerObservations);
    }

    setHasUnsavedEdits(false);
    setIsEditMode(false);
    setSaveSuccessNotification('¡Correcciones aplicadas a la Ficha Técnica y registradas para el aprendizaje de la IA!');
    setTimeout(() => setSaveSuccessNotification(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 lg:p-6 print:p-0 print:bg-white animate-fadeIn">
      <div className="bg-[#16191D] print:bg-white text-gray-100 print:text-black w-full max-w-4xl rounded-xl print:rounded-none border border-[#2D333B] print:border-none shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="p-4 bg-[#0F1113] border-b border-[#2D333B] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Ficha Técnica Geomecánica Oficial de Macizo Rocoso
                {(analysis.isCalibratedByEngineer || hasUnsavedEdits) && (
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Modo Calibrado
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                Puede editar valores numéricos y redactar observaciones que quedarán impresas en el informe.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Edit Values Button */}
            <button
              id="toggle-edit-mode-btn"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                isEditMode
                  ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-[#1F2329] text-amber-300 border-amber-700/60 hover:bg-[#252A30]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Cerrar Edición' : 'Editar Valores & Observaciones'}</span>
            </button>

            {/* Download Excel Button */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-1.5 rounded bg-[#1F2329] hover:bg-[#252A30] text-emerald-300 border border-emerald-500/60 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              title="Descargar Cartilla Oficial RMR89 en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Descargar Excel</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#1F2329] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification inside modal */}
        {saveSuccessNotification && (
          <div className="p-3 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotification}</span>
          </div>
        )}

        {/* APARTADO DE EDICIÓN INTERACTIVA (VISIBLE CUANDO isEditMode ESTÁ ACTIVO) */}
        {isEditMode && (
          <div className="p-5 bg-[#0F1113] border-b-2 border-amber-500/60 space-y-4 print:hidden animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Panel de Corrección Manual de Valores (Sobrescribir Cálculos de la Ficha)
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                Los cambios se reflejarán instantáneamente en la Ficha Técnica impresa
              </span>
            </div>

            {/* Row 1: Litología, UCS, RMR, RQD, GSI, Q */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  Litología / Roca:
                </label>
                <input
                  type="text"
                  value={editedLithology}
                  onChange={(e) => {
                    setEditedLithology(e.target.value);
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-white font-sans focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  UCS (MPa):
                </label>
                <input
                  type="number"
                  value={editedUcs}
                  onChange={(e) => {
                    setEditedUcs(Number(e.target.value));
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  RMR89 Total:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedRmr}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEditedRmr(val);
                    if (val > 80) setEditedRmrClass('Clase I (Muy Buena)');
                    else if (val > 60) setEditedRmrClass('Clase II (Buena)');
                    else if (val > 40) setEditedRmrClass('Clase III (Regular)');
                    else if (val > 20) setEditedRmrClass('Clase IV (Mala)');
                    else setEditedRmrClass('Clase V (Muy Mala)');
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  RQD (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedRqd}
                  onChange={(e) => {
                    setEditedRqd(Number(e.target.value));
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  GSI (10-90):
                </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={editedGsi}
                  onChange={(e) => {
                    setEditedGsi(Number(e.target.value));
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  Sistema Q:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editedQ}
                  onChange={(e) => {
                    setEditedQ(Number(e.target.value));
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-purple-300 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Row 1.5: Individual RMR Parameter Scores & Date/Time (User requirement: e.g. RQD score 6 pts, etc.) */}
            <div className="p-3 bg-[#16191D] rounded border border-amber-600/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-300 uppercase">
                  Puntajes Individuales de la Cartilla RMR89 (Bieniawski 1989):
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  La suma recalcula automáticamente el Total RMR y la Clase
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs font-mono">
                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate" title="R1 Resistencia UCS (0-15 pts)">
                    R1 UCS (0-15):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={editedR1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR1(val);
                      updateScoresFromComponents(val, editedR2, editedR3, editedR4, editedR5, editedR6);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-cyan-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-amber-300 text-[9px] uppercase font-bold block truncate" title="R2 Puntuación RQD (3-20 pts)">
                    R2 RQD (3-20):
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={editedR2}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR2(val);
                      updateScoresFromComponents(editedR1, val, editedR3, editedR4, editedR5, editedR6);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-amber-500 rounded text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate" title="R3 Espaciamiento (5-20 pts)">
                    R3 Espac. (5-20):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={editedR3}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR3(val);
                      updateScoresFromComponents(editedR1, editedR2, val, editedR4, editedR5, editedR6);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-emerald-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate" title="R4 Condición de juntas (0-30 pts)">
                    R4 Cond. (0-30):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={editedR4}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR4(val);
                      updateScoresFromComponents(editedR1, editedR2, editedR3, val, editedR5, editedR6);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-purple-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate" title="R5 Agua subterránea (0-15 pts)">
                    R5 Agua (0-15):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={editedR5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR5(val);
                      updateScoresFromComponents(editedR1, editedR2, editedR3, editedR4, val, editedR6);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-blue-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate" title="R6 Ajuste orientación (-12 a 0 pts)">
                    R6 Ajuste (-12 a 0):
                  </label>
                  <input
                    type="number"
                    min="-12"
                    max="0"
                    value={editedR6}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedR6(val);
                      updateScoresFromComponents(editedR1, editedR2, editedR3, editedR4, editedR5, val);
                    }}
                    className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-rose-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate">
                    Fecha Cartilla:
                  </label>
                  <input
                    type="date"
                    value={cartillaDate}
                    onChange={(e) => {
                      setCartillaDate(e.target.value);
                      setHasUnsavedEdits(true);
                    }}
                    className="w-full px-1.5 py-1 bg-[#0F1113] border border-gray-700 rounded text-white text-[10px] focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-[9px] uppercase font-bold block truncate">
                    Hora Cartilla:
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={cartillaTime}
                    onChange={(e) => {
                      setCartillaTime(e.target.value);
                      setHasUnsavedEdits(true);
                    }}
                    className="w-full px-1.5 py-1 bg-[#0F1113] border border-gray-700 rounded text-white text-[10px] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Collapsible Sub-Parameters for R4 Condition of Joints (0-6 pts each, Bieniawski 1989) */}
              <div className="pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowR4Details(!showR4Details)}
                  className="text-[10px] font-mono text-purple-300 hover:text-purple-200 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <span>{showR4Details ? '▼ Ocultar' : '▶ Ver / Modificar'} Desglose de Sub-Puntajes R4 Condición de Juntas (0 a 6 pts cada uno)</span>
                </button>

                {showR4Details && (
                  <div className="mt-2 p-2 bg-[#0A0C0E] rounded border border-purple-500/30 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono animate-fadeIn">
                    <div>
                      <label className="text-purple-300 block font-bold truncate" title="Persistencia (<1m:6, 1-3m:4, 3-10m:2, 10-20m:1, >20m:0)">
                        R4.1 Persistencia (0-6):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={editedR4_1}
                        onChange={(e) => handleSubR4Change('r4_1', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#16191D] border border-purple-800 rounded text-purple-200 text-center font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 block font-bold truncate" title="Apertura (Cerrada:6, <0.1mm:5, 0.1-1mm:4, 1-5mm:1, >5mm:0)">
                        R4.2 Apertura (0-6):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={editedR4_2}
                        onChange={(e) => handleSubR4Change('r4_2', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#16191D] border border-purple-800 rounded text-purple-200 text-center font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 block font-bold truncate" title="Rugosidad (Muy rugosa:6, Rugosa:5, Lig. rugosa:3, Lisa:1, Espejo:0)">
                        R4.3 Rugosidad (0-6):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={editedR4_3}
                        onChange={(e) => handleSubR4Change('r4_3', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#16191D] border border-purple-800 rounded text-purple-200 text-center font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 block font-bold truncate" title="Relleno (Limpia:6, Duro <5mm:4, Duro >5mm:2, Suave <5mm:1, Suave >5mm:0)">
                        R4.4 Relleno (0-6):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={editedR4_4}
                        onChange={(e) => handleSubR4Change('r4_4', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#16191D] border border-purple-800 rounded text-purple-200 text-center font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 block font-bold truncate" title="Intemperización (Sana:6, Lig:5, Mod:3, Muy:2, Descomp:0)">
                        R4.5 Alteración (0-6):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={editedR4_5}
                        onChange={(e) => handleSubR4Change('r4_5', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#16191D] border border-purple-800 rounded text-purple-200 text-center font-bold focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Support Prescriptions Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  Pernos de Anclaje:
                </label>
                <input
                  type="text"
                  value={editedBolts}
                  onChange={(e) => {
                    setEditedBolts(e.target.value);
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-gray-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  Concreto Lanzado (Shotcrete):
                </label>
                <input
                  type="text"
                  value={editedShotcrete}
                  onChange={(e) => {
                    setEditedShotcrete(e.target.value);
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-gray-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 text-[10px] uppercase font-bold block">
                  Malla Electrosoldada:
                </label>
                <input
                  type="text"
                  value={editedWireMesh}
                  onChange={(e) => {
                    setEditedWireMesh(e.target.value);
                    setHasUnsavedEdits(true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-gray-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Row 3: Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                Al guardar, la IA aprenderá estas correcciones para calibrar los próximos análisis.
              </span>
              <button
                type="button"
                onClick={handleApplyCorrections}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar Correcciones a la Ficha Técnica</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 print:text-xs">
          {/* Company & Mine Header */}
          <div className="border-b-2 border-[#2D333B] print:border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-mono text-emerald-400 print:text-gray-600 font-bold block">
                DEPARTAMENTO DE GEOTECNIA Y MECÁNICA DE ROCAS
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white print:text-black tracking-tight uppercase">
                INFORME DE CARACTERIZACIÓN GEOMECÁNICA & SOSTENIMIENTO
              </h1>
              <p className="text-xs text-gray-400 font-mono print:text-gray-600">
                Sistema Automatizado de Visión Artificial GeoScan AI • Protocolo Internacional ISRM
              </p>
            </div>
            <div className="text-right text-xs font-mono text-gray-300 print:text-black">
              <span className="block font-bold">Ficha N°: GEO-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="text-gray-400 print:text-gray-600 text-[11px]">{currentDate}</span>
              {(analysis.isCalibratedByEngineer || hasUnsavedEdits) && (
                <span className="block text-[10px] text-emerald-400 print:text-gray-700 font-bold uppercase mt-0.5">
                  ★ Validado con Corrección Humana
                </span>
              )}
            </div>
          </div>

          {/* Station & Project Metadata Row (Editable inputs on screen, flat text in print) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0F1113] print:bg-gray-100 p-3 rounded print:rounded border border-[#2D333B] print:border-gray-300">
            <div>
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                Unidad Minera / Proyecto:
              </span>
              <input
                type="text"
                value={mineName}
                onChange={(e) => onMineNameChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white print:text-black border-b border-[#2D333B] print:border-none focus:outline-none w-full"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                Estación Geomecánica / Labor:
              </span>
              <input
                type="text"
                value={stationName}
                onChange={(e) => onStationNameChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-400 print:text-black border-b border-[#2D333B] print:border-none focus:outline-none w-full font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                Especialista / Evaluador:
              </span>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => onEvaluatorNameChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white print:text-black border-b border-[#2D333B] print:border-none focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Rock Mass Image & Summary Classification Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Image Preview */}
            <div className="sm:col-span-5 aspect-video sm:aspect-square rounded overflow-hidden border border-[#2D333B] print:border-gray-400 relative">
              <img
                src={imageSrc}
                alt="Frente Analizado"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-emerald-400">
                Escala Calibrada
              </div>
            </div>

            {/* Main Score Index */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
              <div className="bg-[#0F1113] print:bg-gray-100 p-3 rounded print:rounded border border-[#2D333B] print:border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                    Litología & Identificación Geológica
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 print:text-gray-700 font-bold">
                    UCS Estimado: {editedUcs} MPa
                  </span>
                </div>
                <span className="text-sm font-bold text-white print:text-black block">
                  {editedLithology}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-[#0F1113] print:bg-gray-100 rounded print:rounded border border-[#2D333B] print:border-gray-300 text-center">
                  <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                    RMR89
                  </span>
                  <span className="text-xl font-black text-emerald-400 print:text-black font-mono">
                    {editedRmr}
                  </span>
                  <span className="text-[9px] text-gray-300 print:text-gray-700 block font-mono">
                    {editedRmrClass.split('(')[0]}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0F1113] print:bg-gray-100 rounded print:rounded border border-[#2D333B] print:border-gray-300 text-center">
                  <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                    GSI
                  </span>
                  <span className="text-xl font-black text-emerald-400 print:text-black font-mono">
                    {editedGsi}
                  </span>
                  <span className="text-[9px] text-gray-300 print:text-gray-700 block font-mono">
                    {editedGsiStructure}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0F1113] print:bg-gray-100 rounded print:rounded border border-[#2D333B] print:border-gray-300 text-center">
                  <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold block font-mono">
                    RQD
                  </span>
                  <span className="text-xl font-black text-amber-400 print:text-black font-mono">
                    {editedRqd}%
                  </span>
                  <span className="text-[9px] text-gray-300 print:text-gray-700 block font-mono">
                    Jv = {analysis.rqd.jvVolumetricJointCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0F1113] print:bg-gray-100 p-2.5 rounded print:rounded border border-[#2D333B] print:border-gray-300">
                <div>
                  <span className="text-gray-400 print:text-gray-600 text-[10px] block">Cohesión (c):</span>
                  <span className="font-bold text-white print:text-black">{editedCohesion} kPa</span>
                </div>
                <div>
                  <span className="text-gray-400 print:text-gray-600 text-[10px] block">Ángulo de Fricción (φ):</span>
                  <span className="font-bold text-white print:text-black">{editedFriction}°</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARTILLA FINAL RMR89 BIENIAWSKI (1989) OFICIAL */}
          <div className="bg-[#0F1113] print:bg-white rounded-xl p-4 border-2 border-emerald-500/70 print:border-black space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2D333B] print:border-gray-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 print:text-black border border-emerald-500/40">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white print:text-black uppercase tracking-wider font-mono flex items-center gap-2">
                    Cartilla Oficial de Clasificación RMR89 (Bieniawski 1989)
                    <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 print:border-black print:text-black">
                      Cartilla Final
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400 print:text-gray-600 font-mono">
                    Puntuaciones individuales validadas • Sustitución digital de cartilla manual de campo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  title="Descargar esta cartilla geomecánica en Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar Cartilla Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Header Metadata Grid: Estación, Fecha, Hora, Puntuación RMR, Clase */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono bg-[#16191D] print:bg-gray-100 p-3 rounded-lg border border-[#2D333B] print:border-gray-300">
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase block font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Estación:
                </span>
                <span className="text-white print:text-black font-bold truncate block">{stationName || 'EST-01'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase block font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" /> Fecha:
                </span>
                <span className="text-emerald-400 print:text-black font-bold block">{cartillaDate}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase block font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> Hora:
                </span>
                <span className="text-emerald-400 print:text-black font-bold block">{cartillaTime}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase block font-bold">
                  Puntuación RMR:
                </span>
                <span className="text-amber-300 print:text-black font-black text-sm block">
                  {editedRmr} <span className="text-[10px] text-gray-400">/ 100</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase block font-bold">
                  Clase de Macizo:
                </span>
                <span className="text-cyan-300 print:text-black font-bold block truncate">
                  {editedRmrClass}
                </span>
              </div>
            </div>

            {/* Detailed RMR Parameter Rows Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#2D333B] print:border-gray-400">
                <thead className="bg-[#16191D] print:bg-gray-200 text-gray-300 print:text-black text-[10px] uppercase font-bold font-mono">
                  <tr>
                    <th className="p-2 border-b border-[#2D333B] print:border-gray-300 w-12 text-center">Ítem</th>
                    <th className="p-2 border-b border-[#2D333B] print:border-gray-300">Parámetro Geomecánico RMR 89</th>
                    <th className="p-2 border-b border-[#2D333B] print:border-gray-300">Valor / Condición Evaluada</th>
                    <th className="p-2 border-b border-[#2D333B] print:border-gray-300 text-center w-28">Rango Estándar</th>
                    <th className="p-2 border-b border-[#2D333B] print:border-gray-300 text-right w-28">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D333B] print:divide-gray-300 text-gray-200 print:text-black font-mono text-[11px]">
                  <tr className="hover:bg-[#16191D]/50">
                    <td className="p-2 text-center font-bold text-cyan-400 print:text-black">R1</td>
                    <td className="p-2 font-sans font-medium">Resistencia a la compresión uniaxial de la roca intacta (UCS)</td>
                    <td className="p-2">{editedUcs} MPa ({analysis.ucsData?.isrmGradeCode || 'R5'} {analysis.ucsData?.isrmGrade?.split('(')[0] || 'Muy Resistente'})</td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">0 - 15 pts</td>
                    <td className="p-2 text-right font-bold text-cyan-400 print:text-black">{editedR1} pts</td>
                  </tr>
                  <tr className="hover:bg-[#16191D]/50 bg-amber-950/10">
                    <td className="p-2 text-center font-bold text-amber-300 print:text-black">R2</td>
                    <td className="p-2 font-sans font-semibold text-white print:text-black">
                      Índice de Calidad de la Roca (RQD %)
                    </td>
                    <td className="p-2 text-amber-300 print:text-black font-bold">
                      {editedRqd}% (Palmström Jv = {analysis.rqd.jvVolumetricJointCount} j/m³)
                    </td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">3 - 20 pts</td>
                    <td className="p-2 text-right font-bold text-amber-300 print:text-black text-sm">{editedR2} pts</td>
                  </tr>
                  <tr className="hover:bg-[#16191D]/50">
                    <td className="p-2 text-center font-bold text-emerald-400 print:text-black">R3</td>
                    <td className="p-2 font-sans font-medium">Espaciamiento medio entre discontinuidades</td>
                    <td className="p-2">
                      {analysis.families.length > 0 ? (analysis.families.reduce((a, b) => a + b.spacingCm, 0) / analysis.families.length).toFixed(1) : '45'} cm
                    </td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">5 - 20 pts</td>
                    <td className="p-2 text-right font-bold text-emerald-400 print:text-black">{editedR3} pts</td>
                  </tr>
                  <tr className="hover:bg-[#16191D]/50 bg-purple-950/10">
                    <td className="p-2 text-center font-bold text-purple-400 print:text-black">R4</td>
                    <td className="p-2 font-sans font-semibold text-white print:text-black">
                      Condición de las discontinuidades (Suma R4.1 a R4.5)
                    </td>
                    <td className="p-2 text-purple-300 print:text-black">
                      Persistencia + Apertura + Rugosidad + Relleno + Alteración
                    </td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">0 - 30 pts</td>
                    <td className="p-2 text-right font-bold text-purple-400 print:text-black text-sm">{editedR4} pts</td>
                  </tr>
                  <tr className="text-[10px] bg-[#0A0C0E]/40 print:bg-white text-gray-400 print:text-gray-700">
                    <td className="p-1.5 text-center text-purple-300 font-mono">4.1</td>
                    <td className="p-1.5 pl-6 font-sans">↳ Persistencia (Longitud de fracturas)</td>
                    <td className="p-1.5">&lt;1m (6), 1-3m (4), 3-10m (2), 10-20m (1), &gt;20m (0)</td>
                    <td className="p-1.5 text-center">0 - 6 pts</td>
                    <td className="p-1.5 text-right font-bold text-purple-300 print:text-black">{editedR4_1} pts</td>
                  </tr>
                  <tr className="text-[10px] bg-[#0A0C0E]/40 print:bg-white text-gray-400 print:text-gray-700">
                    <td className="p-1.5 text-center text-purple-300 font-mono">4.2</td>
                    <td className="p-1.5 pl-6 font-sans">↳ Apertura (Separación entre bordes)</td>
                    <td className="p-1.5">Cerrada (6), &lt;0.1mm (5), 0.1-1.0mm (4), 1-5mm (1), &gt;5mm (0)</td>
                    <td className="p-1.5 text-center">0 - 6 pts</td>
                    <td className="p-1.5 text-right font-bold text-purple-300 print:text-black">{editedR4_2} pts</td>
                  </tr>
                  <tr className="text-[10px] bg-[#0A0C0E]/40 print:bg-white text-gray-400 print:text-gray-700">
                    <td className="p-1.5 text-center text-purple-300 font-mono">4.3</td>
                    <td className="p-1.5 pl-6 font-sans">↳ Rugosidad superficial de discontinuidad</td>
                    <td className="p-1.5">Muy rugosa (6), Rugosa (5), Lig. rugosa (3), Lisa (1), Espejo falla (0)</td>
                    <td className="p-1.5 text-center">0 - 6 pts</td>
                    <td className="p-1.5 text-right font-bold text-purple-300 print:text-black">{editedR4_3} pts</td>
                  </tr>
                  <tr className="text-[10px] bg-[#0A0C0E]/40 print:bg-white text-gray-400 print:text-gray-700">
                    <td className="p-1.5 text-center text-purple-300 font-mono">4.4</td>
                    <td className="p-1.5 pl-6 font-sans">↳ Relleno de discontinuidades</td>
                    <td className="p-1.5">Limpia (6), Duro &lt;5mm (4), Duro &gt;5mm (2), Suave &lt;5mm (1), Suave &gt;5mm (0)</td>
                    <td className="p-1.5 text-center">0 - 6 pts</td>
                    <td className="p-1.5 text-right font-bold text-purple-300 print:text-black">{editedR4_4} pts</td>
                  </tr>
                  <tr className="text-[10px] bg-[#0A0C0E]/40 print:bg-white text-gray-400 print:text-gray-700">
                    <td className="p-1.5 text-center text-purple-300 font-mono">4.5</td>
                    <td className="p-1.5 pl-6 font-sans">↳ Alteración / Intemperización</td>
                    <td className="p-1.5">Sana (6), Lig. intempe. (5), Mod. intempe. (3), Muy intempe. (2), Descomp. (0)</td>
                    <td className="p-1.5 text-center">0 - 6 pts</td>
                    <td className="p-1.5 text-right font-bold text-purple-300 print:text-black">{editedR4_5} pts</td>
                  </tr>
                  <tr className="hover:bg-[#16191D]/50">
                    <td className="p-2 text-center font-bold text-blue-400 print:text-black">R5</td>
                    <td className="p-2 font-sans font-medium">Condiciones de agua subterránea / Humedad</td>
                    <td className="p-2">Húmedo (Humedad superficial en juntas)</td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">0 - 15 pts</td>
                    <td className="p-2 text-right font-bold text-blue-400 print:text-black">{editedR5} pts</td>
                  </tr>
                  <tr className="hover:bg-[#16191D]/50">
                    <td className="p-2 text-center font-bold text-rose-400 print:text-black">R6</td>
                    <td className="p-2 font-sans font-medium">Ajuste por orientación de discontinuidades en excavaciones</td>
                    <td className="p-2">Orientación Regular para avance de túnel</td>
                    <td className="p-2 text-center text-gray-400 print:text-gray-600">-12 a 0 pts</td>
                    <td className="p-2 text-right font-bold text-rose-400 print:text-black">{editedR6} pts</td>
                  </tr>
                  <tr className="bg-[#16191D] print:bg-gray-100 font-bold border-t-2 border-emerald-500/80">
                    <td colSpan={2} className="p-2.5 text-white print:text-black uppercase tracking-wider text-xs font-bold">
                      PUNTUACIÓN TOTAL FINAL RMR89 (Bieniawski)
                    </td>
                    <td className="p-2.5 text-emerald-400 print:text-black font-extrabold text-sm">
                      {editedRmr} / 100 PUNTOS
                    </td>
                    <td className="p-2.5 text-center text-cyan-300 print:text-black font-bold">
                      {editedRmrClass.split('(')[0]}
                    </td>
                    <td className="p-2.5 text-right text-emerald-400 print:text-black font-black text-base">
                      {editedRmr} pts
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Geomechanical Properties Output Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-mono">
              <div className="p-2 bg-[#16191D] print:bg-gray-100 rounded border border-[#2D333B] print:border-gray-300">
                <span className="text-[10px] text-gray-400 print:text-gray-600 block">Cohesión Equivalente:</span>
                <span className="font-bold text-white print:text-black text-sm">{editedCohesion} kPa</span>
              </div>
              <div className="p-2 bg-[#16191D] print:bg-gray-100 rounded border border-[#2D333B] print:border-gray-300">
                <span className="text-[10px] text-gray-400 print:text-gray-600 block">Ángulo de Fricción:</span>
                <span className="font-bold text-emerald-400 print:text-black text-sm">{editedFriction}°</span>
              </div>
              <div className="p-2 bg-[#16191D] print:bg-gray-100 rounded border border-[#2D333B] print:border-gray-300">
                <span className="text-[10px] text-gray-400 print:text-gray-600 block">Tiempo Auto-Soporte:</span>
                <span className="font-bold text-cyan-300 print:text-black text-xs truncate block">{editedStandUp}</span>
              </div>
            </div>
          </div>

          {/* Discontinuity Families Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 print:text-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Caracterización de Familias de Discontinuidades
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#2D333B] print:border-gray-400">
                <thead className="bg-[#0F1113] print:bg-gray-200 text-gray-400 print:text-black text-[10px] uppercase font-bold font-mono">
                  <tr>
                    <th className="p-2">Familia</th>
                    <th className="p-2">Buzamiento (Dip)</th>
                    <th className="p-2">Dir. Buzamiento</th>
                    <th className="p-2">Espaciamiento</th>
                    <th className="p-2">Persistencia</th>
                    <th className="p-2">Rugosidad JRC</th>
                    <th className="p-2">Relleno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D333B] print:divide-gray-300 text-gray-300 print:text-black font-mono text-[11px]">
                  {analysis.families.map((fam) => (
                    <tr key={fam.id}>
                      <td className="p-2 font-bold font-sans">{fam.name}</td>
                      <td className="p-2">{fam.dip}°</td>
                      <td className="p-2">{fam.dipDirection}°</td>
                      <td className="p-2">{fam.spacingCm} cm</td>
                      <td className="p-2">{fam.persistenceM} m</td>
                      <td className="p-2">JRC {fam.roughnessJRC}</td>
                      <td className="p-2 font-sans text-[10px]">{fam.infilling}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sostenimiento Minero Prescrito */}
          <div className="bg-[#0F1113] print:bg-gray-100 p-4 rounded print:rounded border border-[#2D333B] print:border-gray-400 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 print:text-black uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4" />
              Prescripción Técnica de Sostenimiento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <strong className="text-white print:text-black block text-[11px]">Pernos de Anclaje:</strong>
                <span className="text-gray-300 print:text-black font-mono">{editedBolts}</span>
              </div>
              <div>
                <strong className="text-white print:text-black block text-[11px]">Concreto Lanzado (Shotcrete):</strong>
                <span className="text-gray-300 print:text-black font-mono">{editedShotcrete}</span>
              </div>
              <div>
                <strong className="text-white print:text-black block text-[11px]">Malla Electrosoldada:</strong>
                <span className="text-gray-300 print:text-black font-mono">{editedWireMesh}</span>
              </div>
              <div>
                <strong className="text-white print:text-black block text-[11px]">Tiempo de Auto-Soporte:</strong>
                <span className="text-gray-300 print:text-black font-mono">{editedStandUp}</span>
              </div>
            </div>
          </div>

          {/* Matched Sample Lesson (Sample-specific learned recommendation) */}
          {analysis.matchedSampleLesson && (
            <div className="bg-[#0F1113] print:bg-gray-100 p-3 rounded print:rounded border border-emerald-600/70 print:border-gray-400 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-emerald-400 print:text-black font-bold text-[10px] uppercase flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recomendación Aprendida de Muestra Similar ({analysis.matchedSampleLesson.similarityPercent}% Similitud)</span>
                </span>
                <span className="text-[10px] text-gray-400 print:text-gray-600">
                  {analysis.matchedSampleLesson.sampleTitle}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 print:text-black italic pl-5">
                "{analysis.matchedSampleLesson.recommendations}"
              </p>
            </div>
          )}

          {/* Criterios de Aprendizaje Activo Asimilados por la IA */}
          {analysis.learnedRulesApplied && analysis.learnedRulesApplied.length > 0 && (
            <div className="bg-[#0F1113] print:bg-gray-100 p-3 rounded print:rounded border border-cyan-800/60 print:border-gray-400 space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-cyan-300 print:text-black font-bold text-[10px] uppercase">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Directrices de Aprendizaje Previo Asimiladas por la IA en este Frente:</span>
              </div>
              <ul className="space-y-0.5 text-[11px] text-gray-300 print:text-gray-800 list-disc list-inside">
                {analysis.learnedRulesApplied.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {analysis.aiLearningNotes && (
                <p className="text-[10px] text-gray-400 print:text-gray-600 italic pt-1">
                  Nota del modelo: "{analysis.aiLearningNotes}"
                </p>
              )}
            </div>
          )}

          {/* APARTADO OFICIAL DE OBSERVACIONES, CORRECCIONES Y DICTAMEN DEL INGENIERO (CRITICAL REQUIREMENT) */}
          <div className="bg-[#0F1113] print:bg-gray-50 p-4 rounded print:rounded border-2 border-emerald-500/60 print:border-gray-400 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 print:text-black uppercase tracking-wider flex items-center gap-2 font-mono">
                <Edit3 className="w-4 h-4" />
                <span>Apartado de Observaciones & Correcciones Técnicas del Ingeniero</span>
              </h4>
              <span className="text-[10px] font-mono text-gray-400 print:text-gray-600 uppercase">
                Dictamen Oficial
              </span>
            </div>

            {/* Editable directly on screen; printed verbatim */}
            <div className="space-y-1.5">
              <textarea
                value={engineerObservations}
                onChange={(e) => {
                  setEngineerObservations(e.target.value);
                  setHasUnsavedEdits(true);
                }}
                rows={3}
                placeholder="Escriba aquí sus observaciones técnicas, correcciones de campo o justificación de cambio de valores..."
                className="w-full px-3 py-2 bg-[#16191D] print:bg-transparent border border-[#2D333B] print:border-none rounded text-xs text-gray-200 print:text-black font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-500 print:text-gray-600 font-mono">
                <span>Evaluador: {evaluatorName}</span>
                <span>Estado: Dictamen Calibrado & Validado</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 print:pt-16 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-[#2D333B] print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">{evaluatorName}</span>
              <span className="text-[10px] text-gray-400 print:text-gray-600 font-mono">
                Ingeniero Geomecánico Responsable (CIP)
              </span>
            </div>
            <div className="border-t border-[#2D333B] print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">Superintendencia de Geotecnia</span>
              <span className="text-[10px] text-gray-400 print:text-gray-600 font-mono">
                Aprobación & Liberación de Labor
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
