import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Zap,
  HelpCircle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Brain,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Calendar,
  MapPin,
} from 'lucide-react';
import { RMRData, GSIData, BartonQData, RockAnalysisResult } from '../types';
import { exportSingleCartillaToExcel, formatDateTime } from '../utils/geomechanicalExcelExport';

interface GeomechanicalDashboardProps {
  analysis: RockAnalysisResult;
  onOpenLithologyModal?: () => void;
  onOpenCorrectionModal?: () => void;
  onOpenAILearningConsole?: () => void;
}

export const GeomechanicalDashboard: React.FC<GeomechanicalDashboardProps> = ({
  analysis,
  onOpenLithologyModal,
  onOpenCorrectionModal,
  onOpenAILearningConsole,
}) => {
  const [showRmrDetails, setShowRmrDetails] = useState(false);
  const [showGsiMatrix, setShowGsiMatrix] = useState(false);

  const {
    rmr,
    gsi,
    rqd,
    bartonQ,
    ucsData,
    isCalibratedByEngineer,
    engineerRationale,
    learnedRulesApplied,
    aiLearningNotes,
  } = analysis;

  // Monochrome styling for RMR class
  const getRmrClassColor = (totalScore: number) => {
    return { bg: 'bg-zinc-950', text: 'text-white', border: 'border-zinc-700', badge: 'bg-white text-black font-bold' };
  };

  const rmrColors = getRmrClassColor(rmr.totalScore);

  return (
    <div id="geomechanical-dashboard" className="space-y-4">
      {/* Geological Litology & Estimated UCS Hero Card */}
      <div className="p-4 bg-black rounded-xl border border-zinc-800 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Litología & Resistencia Intacta
                </span>
                {isCalibratedByEngineer && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    <span>Calibrado</span>
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {ucsData?.rockName || analysis.lithology}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAILearningConsole && (
              <button
                type="button"
                onClick={onOpenAILearningConsole}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Escribir instrucciones y comentarios para que la IA aprenda"
              >
                <Brain className="w-3.5 h-3.5 text-zinc-300" />
                <span>Enseñar a la IA</span>
              </button>
            )}

            {onOpenLithologyModal && (
              <button
                type="button"
                onClick={onOpenLithologyModal}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Cambiar o ajustar nombre geológico y resistencia UCS"
              >
                <Sliders className="w-3 h-3 text-zinc-400" />
                <span>Ajustar UCS</span>
              </button>
            )}

            {onOpenCorrectionModal && (
              <button
                type="button"
                onClick={onOpenCorrectionModal}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Corregir observaciones de la IA"
              >
                <span>Corregir IA</span>
              </button>
            )}
          </div>
        </div>

        {/* UCS Telemetry Readouts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block uppercase">Resistencia (UCS)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-white">
                {ucsData?.confirmedUcsMpa || 160}
              </span>
              <span className="text-[10px] text-gray-400">MPa</span>
            </div>
          </div>

          <div className="p-2 bg-[#0F1113] rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Grado ISRM</span>
            <span className="text-xs font-bold text-white block truncate">
              {ucsData?.isrmGradeCode || 'R5'}
            </span>
            <span className="text-[9px] text-gray-500 block truncate">
              {ucsData?.isrmGrade?.split('(')[0] || 'Muy Resistente'}
            </span>
          </div>

          <div className="p-2 bg-[#0F1113] rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Puntaje RMR A1</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-cyan-400">
                {rmr.breakdown.r1_ucsRating}
              </span>
              <span className="text-[10px] text-gray-400">/ 15 pts</span>
            </div>
          </div>

          <div className="p-2 bg-[#0F1113] rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Rango Litológico</span>
            <span className="text-xs font-bold text-amber-300 block">
              [{ucsData?.ucsMinMpa || 100} - {ucsData?.ucsMaxMpa || 250}]
            </span>
            <span className="text-[9px] text-gray-500 block">MPa min-max</span>
          </div>
        </div>

        {/* Engineer's Observations & Ficha Técnica Connection Block */}
        <div className="p-3 bg-[#0F1113] rounded border border-emerald-800/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-emerald-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Observaciones & Correcciones para la Ficha Técnica Final:</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {isCalibratedByEngineer ? 'Modificado por Evaluador' : 'Generado por IA'}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-sans leading-relaxed italic">
            "{analysis.engineerObservations || engineerRationale || 'El especialista puede escribir aquí sus observaciones técnicas y correcciones de campo, las cuales se imprimen directamente en la Ficha Técnica Oficial.'}"
          </p>
        </div>

        {/* Matched Sample Lesson Banner */}
        {analysis.matchedSampleLesson && (
          <div className="p-3 bg-[#0A1A17] rounded-lg border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)] space-y-2 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase text-emerald-300">
                  Recomendación Aprendida de Muestra Similar ({analysis.matchedSampleLesson.similarityPercent}% Similitud)
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                Muestra: {analysis.matchedSampleLesson.sampleTitle}
              </span>
            </div>

            <div className="p-2.5 bg-[#0F1113] rounded border border-emerald-700/50 text-xs text-emerald-100 font-sans italic">
              "{analysis.matchedSampleLesson.recommendations}"
            </div>

            <p className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
              <span>✓</span>
              <span>La IA leyó tus comentarios sobre esta muestra para no equivocarse y ajustar su predicción.</span>
            </p>
          </div>
        )}

        {/* AI Learning Memory & Applied Rules Block */}
        {learnedRulesApplied && learnedRulesApplied.length > 0 && (
          <div className="p-3 bg-[#0F1113] rounded border border-cyan-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-300 font-bold text-[10px] uppercase flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reglas & Comentarios Aprendidos que la IA Aplicó en este Frente:</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700">
                {learnedRulesApplied.length} Reglas Asimiladas
              </span>
            </div>

            <div className="space-y-1">
              {learnedRulesApplied.map((ruleText, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] font-mono text-gray-300">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>{ruleText}</span>
                </div>
              ))}
            </div>

            {aiLearningNotes && (
              <p className="text-[10px] font-mono text-gray-400 italic pt-1 border-t border-gray-800">
                Nota de la IA: "{aiLearningNotes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4 Main Parameter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: RMR BIENIAWSKI */}
        <div className={`p-4 rounded-xl border ${rmrColors.border} ${rmrColors.bg} shadow-lg relative overflow-hidden flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              RMR (Bieniawski 1989)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${rmrColors.badge}`}>
              {rmr.classRating.split(' ')[0]}
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {rmr.totalScore}
              </span>
              <span className="text-sm font-bold text-gray-400 ml-1">/ 100</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-200 block uppercase">
                {rmr.classRating.split('(')[1]?.replace(')', '') || 'Regular'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">c = {rmr.cohesionKPa} kPa</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2D333B] flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Ángulo Fricción:</span>
            <span className="font-mono font-bold text-emerald-400">{rmr.frictionAngleDeg}°</span>
          </div>
        </div>

        {/* CARD 2: GSI HOEK-BROWN */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              GSI (Hoek & Brown)
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
              {gsi.structureCategory}
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {gsi.value}
              </span>
              <span className="text-sm font-bold text-zinc-400 ml-1">/ 100</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-200 block uppercase">{gsi.surfaceCategory}</span>
              <span className="text-[10px] text-zinc-400 font-mono">Macizo Trabado</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Estructura:</span>
            <span className="font-mono font-bold text-white">{gsi.structureCategory}</span>
          </div>
        </div>

        {/* CARD 3: RQD CALCULATION */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              RQD (Palmström)
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
              {rqd.category}
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {rqd.value}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-200 block font-mono">Jv = {rqd.jvVolumetricJointCount}</span>
              <span className="text-[10px] text-zinc-400">juntas / m³</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Fórmula Palmström:</span>
            <span className="font-mono font-bold text-white">115 - 3.3·Jv</span>
          </div>
        </div>

        {/* CARD 4: BARTON Q-SYSTEM */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-black shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Sistema Q (Barton)
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
              Jn = {bartonQ.jn}
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {bartonQ.qValue}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-200 block uppercase">{bartonQ.classification.split('(')[0]}</span>
              <span className="text-[10px] text-zinc-400 font-mono">Jr/Ja = {(bartonQ.jr / bartonQ.ja).toFixed(1)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Calidad:</span>
            <span className="font-mono font-bold text-white">{bartonQ.classification.split('(')[0]}</span>
          </div>
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Jw / SRF:</span>
            <span className="font-mono font-bold text-white">{(bartonQ.jw / bartonQ.srf).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Expandable Bieniawski 1989 Cartilla Breakdown */}
      <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <button
          id="toggle-rmr-breakdown-btn"
          onClick={() => setShowRmrDetails(!showRmrDetails)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1F2329]/60 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-zinc-900 text-white border border-zinc-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Desglose de Parámetros RMR (Bieniawski 1989)
                <span className="text-xs px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded font-mono font-bold">
                  Sustitución de Cartilla Manual
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Puntaje total automatizado por visión artificial: <strong className="text-white">{rmr.totalScore} / 100 puntos</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
            <span>{showRmrDetails ? 'Ocultar Cartilla' : 'Ver Detalle de Cartilla'}</span>
            {showRmrDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showRmrDetails && (
          <div className="p-4 pt-0 border-t border-zinc-800 space-y-4">
            {/* Field Geomechanical Metadata Banner (User requirement: Estación, Fecha, Hora, Puntuación, Clase) */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-white" /> Estación:
                  </span>
                  <span className="text-white font-bold truncate block">
                    {analysis.stationName || 'EST-01 Frente'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-300" /> Fecha:
                  </span>
                  <span className="text-white font-bold block">
                    {formatDateTime(analysis.analyzedAt).dateStr}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-300" /> Hora:
                  </span>
                  <span className="text-white font-bold block">
                    {formatDateTime(analysis.analyzedAt).timeStr}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold">
                    Puntuación RMR:
                  </span>
                  <span className="text-white font-black block">
                    {rmr.totalScore} / 100 pts
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold">
                    Clase Macizo:
                  </span>
                  <span className="text-zinc-200 font-bold truncate block">
                    {rmr.classRating.split('(')[0]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const dt = formatDateTime(analysis.analyzedAt);
                  exportSingleCartillaToExcel(analysis, {
                    stationName: analysis.stationName || 'EST-01',
                    evaluatorName: analysis.calibratedBy || 'Ing. Geomecánico',
                    mineName: 'Unidad Minera',
                    dateStr: dt.dateStr,
                    timeStr: dt.timeStr,
                  });
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer shrink-0"
                title="Descargar esta cartilla individual RMR89 en Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Cartilla a Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* R1 */}
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-300">R1: Resistencia Roca Sana (UCS)</span>
                  <span className="text-xs font-mono font-bold text-white">{rmr.breakdown.r1_ucsRating} / 15 pts</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-white h-full rounded-full" style={{ width: `${(rmr.breakdown.r1_ucsRating / 15) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-zinc-400">Estimado por litología y textura superficial ({ucsData?.confirmedUcsMpa || 160} MPa).</p>
              </div>

              {/* R2 - User requirement: RQD puntuación */}
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-700 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">R2: RQD (Designación Calidad)</span>
                  <span className="text-xs font-mono font-bold text-black bg-white px-1.5 py-0.5 rounded">
                    Puntaje: {rmr.breakdown.r2_rqdRating} / 20 pts
                  </span>
                </div>
                <div className="w-full bg-[#1F2329] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(rmr.breakdown.r2_rqdRating / 20) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-300">
                  RQD = <strong className="text-amber-300">{rqd.value}%</strong> (Palmström Jv = {rqd.jvVolumetricJointCount} j/m³).
                </p>
              </div>

              {/* R3 */}
              <div className="p-3 bg-[#0F1113] rounded border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-300">R3: Espaciamiento de Juntas</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{rmr.breakdown.r3_spacingRating} / 20 pts</span>
                </div>
                <div className="w-full bg-[#1F2329] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(rmr.breakdown.r3_spacingRating / 20) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-400">Medido mediante procesamiento de líneas de discontinuidad en escala.</p>
              </div>

              {/* R4 */}
              <div className="p-3 bg-[#0F1113] rounded border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-300">R4: Condición de Discontinuidades</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{rmr.breakdown.r4_conditionRating} / 30 pts</span>
                </div>
                <div className="w-full bg-[#1F2329] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(rmr.breakdown.r4_conditionRating / 30) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-400">Rugosidad JRC, persistencia métrica, apertura y estado de paredes.</p>
              </div>

              {/* R5 */}
              <div className="p-3 bg-[#0F1113] rounded border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-300">R5: Presencia de Agua Subterránea</span>
                  <span className="text-xs font-mono font-bold text-blue-400">{rmr.breakdown.r5_waterRating} / 15 pts</span>
                </div>
                <div className="w-full bg-[#1F2329] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(rmr.breakdown.r5_waterRating / 15) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-400">Evaluado por reflectancia de humedad en la superficie rocosa.</p>
              </div>

              {/* R6 */}
              <div className="p-3 bg-[#0F1113] rounded border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-300">R6: Ajuste por Orientación de Labor</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{rmr.breakdown.r6_orientationAdjustment} pts</span>
                </div>
                <div className="w-full bg-[#1F2329] h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.abs(rmr.breakdown.r6_orientationAdjustment / 12) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-400">Ajuste angular según rumbo del túnel vs dirección de discontinuidades.</p>
              </div>
            </div>

            {/* Stand-up Time Banner */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-zinc-300">
                <Clock className="w-4 h-4 text-white shrink-0" />
                <span className="font-bold">Tiempo de Auto-Soporte Estimado:</span>
              </div>
              <span className="font-bold text-white font-mono">{rmr.standUpTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive GSI (Geological Strength Index) 2D Matrix Viewer */}
      <div className="bg-black rounded-xl border border-zinc-800 p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Matriz GSI (Hoek & Brown)</h3>
              <p className="text-[11px] text-zinc-400 font-mono">Mapeo bidimensional de estructura y calidad superficial de juntas</p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">GSI = {gsi.value}</span>
          </div>
        </div>

        {/* 2D GSI Table Visualizer */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] font-mono uppercase">
                <th className="p-2 bg-zinc-950 font-bold">Estructura del Macizo \ Condición</th>
                <th className="p-2 text-center bg-zinc-950">Muy Buena</th>
                <th className="p-2 text-center bg-zinc-950">Buena (Good)</th>
                <th className="p-2 text-center bg-zinc-950">Regular (Fair)</th>
                <th className="p-2 text-center bg-zinc-950">Pobre (Poor)</th>
                <th className="p-2 text-center bg-zinc-950">Muy Pobre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300 font-mono">
              {['Blocky', 'Very Blocky', 'Blocky/Seamy', 'Disintegrated'].map((struct) => (
                <tr key={struct} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-2.5 font-sans font-semibold text-white bg-zinc-950/60 border-r border-zinc-800">
                    {struct}
                  </td>
                  {['Very Good', 'Good', 'Fair', 'Poor', 'Very Poor'].map((surf) => {
                    const isCurrent = struct === gsi.structureCategory && surf === gsi.surfaceCategory;
                    return (
                      <td
                        key={`${struct}-${surf}`}
                        className={`p-2 text-center transition-all ${
                          isCurrent
                            ? 'bg-white text-black font-bold border-2 border-white shadow-lg'
                            : 'text-zinc-600'
                        }`}
                      >
                        {isCurrent ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-extrabold text-black">GSI {gsi.value}</span>
                            <span className="text-[9px] text-zinc-800 font-sans uppercase font-bold">Punto Actual</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-700">●</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-zinc-400 font-mono mt-2 italic bg-zinc-950 p-2 rounded-lg border border-zinc-800">
          {gsi.description}
        </p>
      </div>
    </div>
  );
};
