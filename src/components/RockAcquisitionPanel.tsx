import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Video,
  VideoOff,
  Info,
  FolderPlus,
  Trash2,
  CheckSquare,
  Square,
  ListChecks,
  RotateCcw,
  X,
  AlertOctagon,
} from 'lucide-react';
import { RockSample, QualityValidation } from '../types';
import { ROCK_SAMPLES, DEFAULT_EMPTY_SAMPLE } from '../data/rockSamples';
import { analyzeRockFaceImage } from '../utils/rockImageVisionAnalyzer';

interface RockAcquisitionPanelProps {
  selectedSample: RockSample;
  onSelectSample: (sample: RockSample) => void;
  onCustomImageUpload: (imageSrc: string, scaleCm: number) => void;
  qualityValidation: QualityValidation;
  scaleCm: number;
  onScaleChange: (scale: number) => void;
  isProcessing: boolean;
  scaleType: string;
  onScaleTypeChange: (type: 'metric_rod' | 'hammer' | 'laser' | 'coin') => void;
}

export const RockAcquisitionPanel: React.FC<RockAcquisitionPanelProps> = ({
  selectedSample,
  onSelectSample,
  onCustomImageUpload,
  qualityValidation,
  scaleCm,
  onScaleChange,
  isProcessing,
  scaleType,
  onScaleTypeChange,
}) => {
  const [acquisitionMode, setAcquisitionMode] = useState<'gallery' | 'upload' | 'camera'>('gallery');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic samples list with clean persistence (filtering out any old dummy samples)
  const [samplesList, setSamplesList] = useState<RockSample[]>(() => {
    try {
      const raw = localStorage.getItem('geoscan_rock_samples_panel_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out dummy sample IDs from previous versions
          const filtered = parsed.filter((s: RockSample) => !s.id.startsWith('sample-'));
          return filtered;
        }
      }
    } catch (e) {
      console.error('Error loading stored samples:', e);
    }
    return [];
  });

  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set());
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [singleSampleToDelete, setSingleSampleToDelete] = useState<RockSample | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const saveSamplesList = (updated: RockSample[]) => {
    setSamplesList(updated);
    try {
      localStorage.setItem('geoscan_rock_samples_panel_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving samples to localStorage:', e);
    }
  };

  // Stop camera when leaving camera mode
  useEffect(() => {
    if (acquisitionMode !== 'camera' && isCameraActive) {
      stopCamera();
    }
  }, [acquisitionMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara web o del dispositivo. Verifique los permisos.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      onCustomImageUpload(dataUrl, scaleCm);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onCustomImageUpload(event.target.result as string, scaleCm);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload multiple files from a folder in this panel with real Computer Vision
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsBatchProcessing(true);
    const validImageFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(file.name)) {
        validImageFiles.push(file);
      }
    }

    if (validImageFiles.length === 0) {
      setIsBatchProcessing(false);
      return;
    }

    const newSamples: RockSample[] = [];

    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        // Process with real computer vision
        const visionAnalysis = await analyzeRockFaceImage(dataUrl, scaleCm || 100);

        newSamples.push({
          id: `panel-folder-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name: cleanName.length > 2 ? cleanName : `Muestra #${samplesList.length + i + 1}`,
          lithology: visionAnalysis.analysisResult.lithology || 'Macizo Rocoso en Exploración',
          location: `Carpeta Local - ${file.name}`,
          description: `Fotografía importada (${file.name}). RMR: ${visionAnalysis.totalRmrScore} (${visionAnalysis.classRating}).`,
          defaultScaleCm: scaleCm || 100,
          scaleType: (scaleType as any) || 'metric_rod',
          imageUrl: dataUrl,
          analysis: visionAnalysis.analysisResult,
        });
      } catch (err) {
        console.error('Error al procesar imagen de carpeta:', file.name, err);
      }
    }

    if (newSamples.length > 0) {
      const updated = [...newSamples, ...samplesList];
      saveSamplesList(updated);
      onSelectSample(newSamples[0]);
    }

    setIsBatchProcessing(false);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onCustomImageUpload(event.target.result as string, scaleCm);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle selection for multiple samples
  const toggleSelectSample = (sampleId: string) => {
    const next = new Set(selectedSampleIds);
    if (next.has(sampleId)) {
      next.delete(sampleId);
    } else {
      next.add(sampleId);
    }
    setSelectedSampleIds(next);
  };

  // Select all samples
  const handleSelectAll = () => {
    const allIds = new Set(samplesList.map((s) => s.id));
    setSelectedSampleIds(allIds);
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedSampleIds(new Set());
  };

  // Confirm delete selected samples
  const handleConfirmDeleteSelected = () => {
    const remaining = samplesList.filter((s) => !selectedSampleIds.has(s.id));
    saveSamplesList(remaining);
    setSelectedSampleIds(new Set());
    setIsDeleteSelectedModalOpen(false);
    setIsSelectionMode(false);

    if (selectedSampleIds.has(selectedSample.id) && remaining.length > 0) {
      onSelectSample(remaining[0]);
    }
  };

  // Confirm delete single sample
  const handleConfirmDeleteSingle = () => {
    if (!singleSampleToDelete) return;
    const remaining = samplesList.filter((s) => s.id !== singleSampleToDelete.id);
    saveSamplesList(remaining);
    if (selectedSample.id === singleSampleToDelete.id && remaining.length > 0) {
      onSelectSample(remaining[0]);
    }
    setSingleSampleToDelete(null);
  };

  // Clear all samples directly (separate button)
  const handleClearAll = () => {
    saveSamplesList([]);
    setSelectedSampleIds(new Set());
    setIsClearAllModalOpen(false);
  };

  return (
    <div id="rock-acquisition-panel" className="bg-black rounded-xl border border-zinc-800 p-4 sm:p-5 shadow-2xl">
      {/* Hidden Folder Input for directory upload */}
      <input
        type="file"
        ref={folderInputRef}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderUpload}
      />

      {/* MODAL 1: Delete SELECTED Samples Confirmation */}
      {isDeleteSelectedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center space-x-3 text-zinc-100">
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Borrar Muestras Seleccionadas
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {selectedSampleIds.size} muestra{selectedSampleIds.size > 1 ? 's' : ''} para eliminación
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              ¿Está seguro de que desea borrar <strong className="text-white">{selectedSampleIds.size}</strong> muestra{selectedSampleIds.size > 1 ? 's' : ''} seleccionada{selectedSampleIds.size > 1 ? 's' : ''} de este panel?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs font-mono transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-bold rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                Confirmar Borrado ({selectedSampleIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Single Sample Confirmation */}
      {singleSampleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center space-x-3 text-zinc-100">
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Eliminar Muestra
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Acción individual</p>
              </div>
            </div>

            <div className="p-3 bg-black rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500">Muestra: </span>
              <strong className="text-white">{singleSampleToDelete.name}</strong>
            </div>

            <p className="text-xs text-zinc-300">
              ¿Desea eliminar esta muestra del panel de estudio?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSingleSampleToDelete(null)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs font-mono transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-bold rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Clear ALL Samples Confirmation */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center space-x-3 text-zinc-100">
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  ¿Borrar Todo el Apartado de Muestras?
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {samplesList.length} muestras en este panel
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Esta acción eliminará todas las <strong className="text-white">{samplesList.length}</strong> muestras de este apartado.
            </p>

            <div className="pt-2">
              <button
                onClick={handleClearAll}
                className="w-full px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4 text-black" />
                <span>Vaciar Todo Completamente (0 Muestras)</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Acquisition Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <Camera className="w-4 h-4 text-white" />
            Adquisición & Validación del Frente Rocoso
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Cargue o capture una fotografía de alta resolución con escala métrica para análisis 100% automático.
          </p>
        </div>

        {/* Mode selector in stark monochrome */}
        <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            id="mode-gallery-btn"
            onClick={() => setAcquisitionMode('gallery')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              acquisitionMode === 'gallery'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Muestras</span>
          </button>
          <button
            id="mode-upload-btn"
            onClick={() => setAcquisitionMode('upload')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              acquisitionMode === 'upload'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Foto</span>
          </button>
          <button
            id="mode-camera-btn"
            onClick={() => {
              setAcquisitionMode('camera');
              if (!isCameraActive) startCamera();
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              acquisitionMode === 'camera'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Cámara</span>
          </button>
        </div>
      </div>

      {/* Main Mode Content */}
      <div className="py-4">
        {/* MODE 1: APARTADO DE MUESTRAS */}
        {acquisitionMode === 'gallery' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                  Frentes y Muestras de Estudio:
                </span>
                <span className="text-[11px] text-white font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                  {samplesList.length} CASOS
                </span>
              </div>

              {/* ACTION BUTTONS IN MONOCHROME */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Subir archivos desde una carpeta */}
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isBatchProcessing}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer disabled:opacity-50"
                  title="Subir todas las fotos desde una carpeta local del equipo"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-white" />
                  <span>{isBatchProcessing ? 'Procesando...' : 'Subir Carpeta'}</span>
                </button>

                {/* Botón para seleccionar */}
                {samplesList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelectionMode && selectedSampleIds.size > 0) {
                        setSelectedSampleIds(new Set());
                      }
                      setIsSelectionMode(!isSelectionMode);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      isSelectionMode
                        ? 'bg-zinc-800 text-white border-zinc-500 ring-1 ring-zinc-500'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700 hover:border-zinc-500'
                    }`}
                    title="Activar casillas para seleccionar muestras y borrarlas"
                  >
                    <ListChecks className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{isSelectionMode ? 'Salir Selección' : 'Seleccionar'}</span>
                  </button>
                )}

                {/* Sub-actions when in selection mode */}
                {isSelectionMode && samplesList.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs font-mono flex items-center gap-1 border border-zinc-700 cursor-pointer"
                      title="Seleccionar todas las muestras"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                      <span>Todo ({samplesList.length})</span>
                    </button>

                    {selectedSampleIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-xs font-mono border border-zinc-700 cursor-pointer"
                      >
                        Deseleccionar
                      </button>
                    )}
                  </>
                )}

                {/* Botón para borrar lo seleccionado */}
                {selectedSampleIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteSelectedModalOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-black rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    title="Borrar las muestras seleccionadas"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-black" />
                    <span>Borrar Seleccionadas ({selectedSampleIds.size})</span>
                  </button>
                )}

                {/* Visual Separator */}
                {samplesList.length > 0 && (
                  <span className="h-4 w-px bg-zinc-800 hidden sm:inline-block"></span>
                )}

                {/* Botón para borrar todo aparte */}
                {samplesList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer"
                    title="Borrar todas las muestras del apartado sin necesidad de seleccionar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Borrar Todo Aparte</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty state if empty (0 samples) */}
            {samplesList.length === 0 ? (
              <div className="p-8 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <ImageIcon className="w-6 h-6 text-zinc-300" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Apartado de Muestras Vacío (0 Casos)
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                    No hay fotografías cargadas. Puede subir una foto individual, cargar una carpeta con múltiples frentes o capturar directamente con la cámara.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black rounded text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Fotografía</span>
                  </button>
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-bold flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Subir Carpeta</span>
                  </button>
                  <button
                    onClick={() => {
                      setAcquisitionMode('camera');
                      startCamera();
                    }}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs font-mono font-bold flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Usar Cámara</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {samplesList.map((sample) => {
                  const isSelected = selectedSample.id === sample.id;
                  const isChecked = selectedSampleIds.has(sample.id);

                  return (
                    <div
                      key={sample.id}
                      id={`sample-card-${sample.id}`}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelectSample(sample.id);
                        } else {
                          onSelectSample(sample);
                        }
                      }}
                      className={`text-left rounded-lg p-2.5 transition-all border relative overflow-hidden group cursor-pointer ${
                        isChecked
                          ? 'border-white ring-2 ring-white/50 bg-zinc-900'
                          : isSelected
                          ? 'bg-zinc-900 border-white ring-2 ring-white/30 shadow-lg'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60'
                      }`}
                    >
                      {/* Checkbox for selection */}
                      {(isSelectionMode || isChecked) && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectSample(sample.id);
                          }}
                          className={`absolute top-2 left-2 z-20 p-1 rounded border backdrop-blur-md transition-colors ${
                            isChecked
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-black/85 text-zinc-300 border-zinc-600'
                          }`}
                        >
                          {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5" />}
                        </div>
                      )}

                      <div className="aspect-video w-full rounded overflow-hidden mb-2 bg-zinc-900 relative border border-zinc-800">
                        {sample.imageUrl ? (
                          <img
                            src={sample.imageUrl}
                            alt={sample.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/90 backdrop-blur-sm text-[10px] font-mono text-white font-bold border border-zinc-700">
                          RMR {sample.analysis.rmr.totalScore}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="truncate flex-1">
                          <h3 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors uppercase">
                            {sample.name.split('-')[1] || sample.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 font-mono">
                            {sample.lithology.split(' ')[0]}
                          </p>
                        </div>

                        {/* Quick Delete Single Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSingleSampleToDelete(sample);
                          }}
                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0 ml-1"
                          title="Eliminar esta muestra"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: FILE UPLOAD */}
        {acquisitionMode === 'upload' && (
          <div className="space-y-3">
            <div
              id="file-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-white bg-zinc-950 hover:bg-zinc-900/60 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform text-white">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                  Arrastre aquí la fotografía del macizo o haga clic para examinar
                </p>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Formatos soportados: JPG, PNG de alta resolución. Procure incluir escala métrica visible.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded border border-zinc-700">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                <span>Segmentación Neural Automática & Cartilla Digital</span>
              </div>
            </div>

            {/* Option to also upload folder from upload tab */}
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                <FolderPlus className="w-4 h-4 text-zinc-400" />
                <span>¿Tiene una carpeta con múltiples frentes fotografiados?</span>
              </div>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isBatchProcessing}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FolderPlus className="w-3.5 h-3.5 text-white" />
                <span>{isBatchProcessing ? 'Procesando...' : 'Subir Carpeta Completa'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: LIVE CAMERA */}
        {acquisitionMode === 'camera' && (
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 bg-zinc-950 border border-zinc-700 rounded-xl text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-zinc-300 mx-auto" />
                <p className="text-xs text-zinc-300 font-mono">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono border border-zinc-700"
                >
                  Reintentar Cámara
                </button>
              </div>
            ) : (
              <div className="relative aspect-video max-w-xl mx-auto rounded-xl overflow-hidden bg-black border border-zinc-700">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Frente</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-mono border border-zinc-700 cursor-pointer"
                  >
                    Detener
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Scale Configuration Toolbar */}
      <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
            Referencia de Escala:
          </span>
          <select
            value={scaleType}
            onChange={(e) => onScaleTypeChange(e.target.value as any)}
            className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono text-xs focus:outline-none focus:border-white"
          >
            <option value="metric_rod">Mira / Jalón Métrico (100 cm)</option>
            <option value="hammer">Martillo Geológico Schmidt (30 cm)</option>
            <option value="laser">Láser Distanciómetro (50 cm)</option>
            <option value="coin">Moneda / Escala Menor (3 cm)</option>
          </select>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            <Ruler className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="number"
              value={scaleCm}
              onChange={(e) => onScaleChange(Math.max(1, Number(e.target.value) || 100))}
              className="w-14 bg-transparent text-white font-bold text-center focus:outline-none"
            />
            <span className="text-zinc-400">cm</span>
          </div>
        </div>

        {/* Quality indicator in clean monochrome */}
        <div className="flex items-center gap-2">
          {qualityValidation.isValid ? (
            <span className="text-zinc-200 flex items-center gap-1.5 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Calidad Óptima ({qualityValidation.sharpnessScore}% Nitidez)</span>
            </span>
          ) : (
            <span className="text-zinc-400 flex items-center gap-1.5 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-300" />
              <span>Sin fotografía cargada / Verificar Iluminación</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
