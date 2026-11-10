import React, { useState } from 'react';
import { DiscontinuityFamily, RockAnalysisResult } from '../types';
import { calculateGeomechanicsFromFamilies } from '../utils/geomechanics';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Layers,
  Compass,
  FileText,
  X,
  TrendingUp,
} from 'lucide-react';

interface ObservationCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: RockAnalysisResult;
  onSaveCorrection: (
    correctedAnalysis: RockAnalysisResult,
    rationale: string,
    evaluator: string
  ) => void;
  currentEvaluator?: string;
}

export const ObservationCorrectionModal: React.FC<ObservationCorrectionModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onSaveCorrection,
  currentEvaluator = 'Ing. Geomecánico',
}) => {
  if (!isOpen) return null;

  // Editable copies of families
  const [families, setFamilies] = useState<DiscontinuityFamily[]>(
    JSON.parse(JSON.stringify(analysis.families))
  );

  const [lithology, setLithology] = useState<string>(analysis.lithology);
  const [evaluator, setEvaluator] = useState<string>(currentEvaluator);
  const [rationale, setRationale] = useState<string>(
    'Calibración directa en frente minero mediante flexómetro y brújula Brunton. Se corrigieron los espaciados y la condición de rugosidad de juntas.'
  );

  // Live recalculate geomechanical values as user adjusts sliders/inputs
  const recalculated = React.useMemo(() => {
    return calculateGeomechanicsFromFamilies(families, 100, lithology);
  }, [families, lithology]);

  const handleSpacingChange = (index: number, val: number) => {
    const next = [...families];
    next[index].spacingCm = Math.max(2, val);
    setFamilies(next);
  };

  const handleDipChange = (index: number, val: number) => {
    const next = [...families];
    next[index].dip = Math.max(5, Math.min(90, val));
    setFamilies(next);
  };

  const handleApertureChange = (index: number, val: number) => {
    const next = [...families];
    next[index].apertureMm = Math.max(0.1, val);
    setFamilies(next);
  };

  const handleJRCChange = (index: number, val: number) => {
    const next = [...families];
    next[index].roughnessJRC = Math.max(1, Math.min(20, val));
    setFamilies(next);
  };

  const handleSave = () => {
    const finalResult: RockAnalysisResult = {
      ...recalculated,
      lithology,
      isCalibratedByEngineer: true,
      engineerRationale: rationale,
      calibratedAt: new Date().toISOString(),
      calibratedBy: evaluator,
      ucsData: analysis.ucsData,
    };

    onSaveCorrection(finalResult, rationale, evaluator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#16191D] border border-emerald-500/60 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#1F2329] border-b border-[#2D333B] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Aprendizaje Activo & Retroalimentación
                </span>
                <span className="text-xs font-mono text-gray-400">Calibración Experta Humana</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                Corregir Observaciones de la IA & Entrenar Modelo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252A30]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-2 bg-[#0F1113] border-b border-[#2D333B] text-xs text-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>
              Tus correcciones serán registradas en la <strong>Base de Datos de Entrenamiento</strong> para que el modelo de IA aprenda con el tiempo y ajuste sus pesos predictivos.
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Discontinuity Families Correction */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Geometría & Parámetros de Discontinuidades ({families.length} Familias)</span>
              </h3>
              <span className="text-[11px] font-mono text-gray-400">
                Ajuste deslizante interactivo con recálculo geomecánico inmediato
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {families.map((fam, idx) => (
                <div
                  key={fam.id}
                  className="p-3.5 bg-[#1F2329] border border-[#2D333B] rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: fam.color }}
                      ></span>
                      <span className="text-xs font-bold text-white uppercase">{fam.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{fam.type}</span>
                  </div>

                  {/* Spacing Slider & Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">Espaciamiento (cm):</span>
                      <span className="font-bold text-emerald-400">{fam.spacingCm} cm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      value={fam.spacingCm}
                      onChange={(e) => handleSpacingChange(idx, Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Dip & Aperture inputs */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-gray-400 text-[10px]">Buzamiento (Dip °):</span>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={fam.dip}
                        onChange={(e) => handleDipChange(idx, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-white text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 text-[10px]">Apertura (mm):</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="20"
                        value={fam.apertureMm}
                        onChange={(e) => handleApertureChange(idx, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-white text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 text-[10px]">Rugosidad (JRC):</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={fam.roughnessJRC}
                        onChange={(e) => handleJRCChange(idx, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#0F1113] border border-gray-700 rounded text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Realtime Live Geomechanical Comparison Preview */}
          <div className="p-4 bg-zinc-950 border border-zinc-700 rounded-lg space-y-3">
            <div className="text-xs font-mono text-white font-bold uppercase tracking-wider">
              Comparativa: Observación Inicial de la IA vs. Calibración del Ingeniero
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-black rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">RQD Palmström</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-zinc-500 line-through">{analysis.rqd.value}%</span>
                  <span className="text-sm font-bold text-white">
                    {recalculated.rqd.value}%
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 block">
                  {recalculated.rqd.category}
                </span>
              </div>

              <div className="p-2.5 bg-black rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Bieniawski RMR89</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-zinc-500 line-through">
                    {analysis.rmr.totalScore}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {recalculated.rmr.totalScore}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 block">
                  {recalculated.rmr.classRating.split(' ')[1]}
                </span>
              </div>

              <div className="p-2.5 bg-black rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Índice GSI</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-zinc-500 line-through">{analysis.gsi.value}</span>
                  <span className="text-sm font-bold text-white">
                    {recalculated.gsi.value}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 block">
                  {recalculated.gsi.structureCategory}
                </span>
              </div>

              <div className="p-2.5 bg-black rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Sistema Q de Barton</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-zinc-500 line-through">
                    {analysis.bartonQ.qValue}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {recalculated.bartonQ.qValue}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 block">
                  {recalculated.bartonQ.classification.split('(')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Rationale & Metadata */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Justificación Geológica / Razón Técnica de la Corrección:</span>
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={3}
                placeholder="Explique el criterio observado en terreno (ej. Medición directa de espaciado con cinta, ensayo de campo, pátinas de óxido, etc.)..."
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Ingeniero / Evaluador:</label>
                <input
                  type="text"
                  value={evaluator}
                  onChange={(e) => setEvaluator(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-white font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Litología Calibrada:</label>
                <input
                  type="text"
                  value={lithology}
                  onChange={(e) => setLithology(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-white font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white rounded border border-zinc-700 hover:bg-zinc-900 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Brain className="w-4 h-4 text-black" />
            <span>Guardar Corrección & Entrenar IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
