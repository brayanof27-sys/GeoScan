import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  Clock,
  User,
  ArrowRight,
  Eye,
  AlertCircle,
  HelpCircle,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  SampleImageLesson,
  getImageLessons,
  saveImageLesson,
  deleteImageLesson,
  computeImageSimilarity,
  findBestMatchingSampleLesson,
} from '../utils/aiLearningStore';

interface AILearningConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImageSrc: string;
  sampleTitle?: string;
  evaluatorName?: string;
  onSaveRecommendation?: (imageSrc: string, recommendation: string, sampleTitle?: string) => void;
  onLoadSampleToViewer?: (imageSrc: string, title: string) => void;
}

export const AILearningConsoleModal: React.FC<AILearningConsoleModalProps> = ({
  isOpen,
  onClose,
  activeImageSrc,
  sampleTitle = 'Frente Rocoso en Pantalla',
  evaluatorName = 'Ing. Geomecánico',
  onSaveRecommendation,
  onLoadSampleToViewer,
}) => {
  if (!isOpen) return null;

  const [lessons, setLessons] = useState<SampleImageLesson[]>(getImageLessons());
  const [recommendationText, setRecommendationText] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>(sampleTitle || 'Muestra de Frente Rocoso');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Check if current active image already has a recommendation
  useEffect(() => {
    const existing = lessons.find((l) => l.imageUrl === activeImageSrc);
    if (existing) {
      setRecommendationText(existing.recommendations);
      setCustomTitle(existing.sampleTitle);
      setEditingLessonId(existing.id);
    } else {
      setRecommendationText('');
      setCustomTitle(sampleTitle || 'Muestra de Frente Rocoso');
      setEditingLessonId(null);
    }
  }, [activeImageSrc, lessons, sampleTitle]);

  // Compute similarity with each lesson for the active image
  const lessonsWithSimilarity = lessons.map((l) => ({
    ...l,
    similarity: computeImageSimilarity(activeImageSrc, l.imageUrl),
    isCurrentActive: l.imageUrl === activeImageSrc,
  }));

  const handleSaveRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendationText.trim()) return;

    const saved = saveImageLesson({
      imageUrl: activeImageSrc,
      recommendations: recommendationText.trim(),
      sampleTitle: customTitle.trim() || 'Muestra de Frente Rocoso',
      author: evaluatorName,
    });

    const updated = getImageLessons();
    setLessons(updated);
    setEditingLessonId(saved.id);

    setFeedbackSuccessMsg(
      `¡Recomendación guardada con éxito para esta muestra! La IA aplicará tus comentarios cuando procese esta imagen o reciba imágenes similares.`
    );

    if (onSaveRecommendation) {
      onSaveRecommendation(activeImageSrc, recommendationText.trim(), customTitle.trim());
    }

    setTimeout(() => setFeedbackSuccessMsg(null), 6000);
  };

  const handleDelete = (id: string) => {
    const updated = deleteImageLesson(id);
    setLessons(updated);
    if (editingLessonId === id) {
      setRecommendationText('');
      setEditingLessonId(null);
    }
  };

  const handleSelectToEdit = (lesson: SampleImageLesson) => {
    setRecommendationText(lesson.recommendations);
    setCustomTitle(lesson.sampleTitle);
    setEditingLessonId(lesson.id);
  };

  const currentMatch = findBestMatchingSampleLesson(activeImageSrc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#16191D] border-2 border-emerald-500/70 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-[#1F2329] border-b border-[#2D333B] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Cerebro de la IA • Memoria por Imagen
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {lessons.length} Muestras con Recomendaciones
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                Recomendaciones & Aprendizaje por Imagen
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252A30] cursor-pointer transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="px-5 py-2.5 bg-[#0F1113] border-b border-[#2D333B] text-xs text-gray-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-emerald-300">¿Cómo aprende la IA de cada imagen enviada?</strong>{' '}
            Escribe tus recomendaciones específicas para la fotografía subida. La IA guarda tu comentario
            asociado a esta muestra fotográfica. Cuando envíes esta misma imagen o una <strong>imagen similar</strong>,
            la IA recordará tus comentarios y recomendaciones para no equivocarse y aumentar su precisión.
          </p>
        </div>

        {/* Success toast banner */}
        {feedbackSuccessMsg && (
          <div className="p-3 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackSuccessMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: WRITE RECOMMENDATIONS FOR CURRENT UPLOADED/ACTIVE IMAGE */}
          <div className="bg-[#0F1113] p-4 sm:p-5 rounded-xl border border-emerald-500/50 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  Muestra Fotográfica Actual en Pantalla:
                </span>
              </div>
              {currentMatch && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono bg-[#1A1D21] px-2.5 py-1 rounded border border-gray-700 text-gray-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>
                    Similitud con memoria: <strong className="text-emerald-400">{currentMatch.similarityPercent}%</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Image Preview Thumbnail (4 cols) */}
              <div className="md:col-span-4 space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-black aspect-video sm:aspect-4/3 flex items-center justify-center group">
                  <img
                    src={activeImageSrc}
                    alt="Muestra activa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-gray-200 truncate">
                    {customTitle}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase block">
                    Nombre o Referencia de la Muestra:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ej. Frente Galería 104 - Nivel 2400"
                    className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Textarea for Recommendations (8 cols) */}
              <form onSubmit={handleSaveRecommendation} className="md:col-span-8 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Send className="w-3.5 h-3.5" />
                      Escribe tus recomendaciones y comentarios para esta imagen:
                    </span>
                    {editingLessonId && (
                      <span className="text-[10px] font-normal text-amber-400 lowercase">
                        (editando muestra guardada)
                      </span>
                    )}
                  </label>

                  <textarea
                    value={recommendationText}
                    onChange={(e) => setRecommendationText(e.target.value)}
                    rows={4}
                    placeholder="Ej: 'En esta imagen el espaciado de fracturas es mayor a 40cm en la parte superior, no confundir las marcas de voladura con diaclasas, y el RQD debe ser ~70% porque las fisuras son superficiales. Cuando recibas una imagen similar, aplica este criterio.'"
                    className="w-full h-28 px-3.5 py-2.5 bg-[#16191D] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-gray-400 font-mono">
                    La IA memorizará exactamente este texto para esta muestra e imágenes similares.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Evaluador: <strong className="text-gray-300">{evaluatorName}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={!recommendationText.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Guardar Recomendación para esta Imagen (Enseñar a la IA)</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* SECTION 2: BANK OF SAVED SAMPLE IMAGES WITH RECOMMENDATIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Muestras de Imágenes con Recomendaciones Aprendidas ({lessons.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">
                La IA consulta esta memoria visual en cada análisis
              </span>
            </div>

            {lessons.length === 0 ? (
              <div className="p-8 text-center bg-[#0F1113] rounded-xl border border-gray-800 text-gray-400 space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-600" />
                <p className="text-xs font-mono">Aún no hay recomendaciones guardadas para imágenes.</p>
                <p className="text-[11px] text-gray-500">
                  Escribe un comentario en el panel superior para la imagen actual para comenzar a enseñarle a la IA.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {lessonsWithSimilarity.map((lesson) => {
                  const isCurrent = lesson.isCurrentActive;
                  const similarity = lesson.similarity;

                  return (
                    <div
                      key={lesson.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center gap-4 ${
                        isCurrent
                          ? 'bg-[#1F2329] border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : similarity >= 80
                          ? 'bg-[#181B1F] border-teal-600/60'
                          : 'bg-[#121417] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-28 h-20 sm:w-32 sm:h-22 shrink-0 rounded-lg overflow-hidden border border-gray-700 bg-black">
                        <img
                          src={lesson.imageUrl}
                          alt={lesson.sampleTitle}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-600 text-white">
                            EN VISOR
                          </span>
                        )}
                      </div>

                      {/* Content & User Recommendations */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono truncate">
                              {lesson.sampleTitle}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              • Por: {lesson.author}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                similarity >= 90
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                  : similarity >= 70
                                  ? 'bg-teal-950 text-teal-300 border-teal-700'
                                  : 'bg-gray-900 text-gray-400 border-gray-700'
                              }`}
                            >
                              ⚡ {similarity}% Similitud con foto actual
                            </span>

                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(lesson.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Engineer's exact comments */}
                        <div className="p-2.5 bg-[#0A0C0E] rounded-lg border border-gray-800 text-xs text-gray-200 font-sans leading-relaxed italic">
                          "{lesson.recommendations}"
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {onLoadSampleToViewer && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadSampleToViewer(lesson.imageUrl, lesson.sampleTitle);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-[#1F2329] hover:bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700/60 text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Cargar esta muestra fotográfica en el visor principal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Probar en Visor</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectToEdit(lesson)}
                          className="px-2.5 py-1.5 bg-[#1F2329] hover:bg-[#252A30] text-gray-300 hover:text-white rounded border border-gray-700 text-[11px] font-mono transition-colors cursor-pointer"
                          title="Editar recomendaciones de esta muestra"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(lesson.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          title="Eliminar muestra de la memoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#1F2329] border-t border-[#2D333B] flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Memoria de muestras activa • Respaldada en almacenamiento local</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252A30] hover:bg-[#2D333B] text-white text-xs font-mono rounded cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
