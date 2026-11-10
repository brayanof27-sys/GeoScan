import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Sliders,
  Move,
  Flame,
  Activity,
  Tag,
  Crosshair,
  Sparkles,
  Brain,
  Camera,
} from 'lucide-react';
import { DiscontinuityFamily, ScanlineIntersection } from '../types';

interface RockFaceViewerProps {
  imageSrc: string;
  families: DiscontinuityFamily[];
  scaleCm: number;
  onScanlineUpdate?: (intersections: ScanlineIntersection[], lengthMeters: number) => void;
  lithologyName: string;
  onOpenCorrectionModal?: () => void;
  onOpenAILearningConsole?: () => void;
  isCalibrated?: boolean;
}

export const RockFaceViewer: React.FC<RockFaceViewerProps> = ({
  imageSrc,
  families,
  scaleCm,
  onScanlineUpdate,
  lithologyName,
  onOpenCorrectionModal,
  onOpenAILearningConsole,
  isCalibrated,
}) => {
  // Layer toggles
  const [showOriginal, setShowOriginal] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showFamilies, setShowFamilies] = useState(true);
  const [showSpacingCotas, setShowSpacingCotas] = useState(true);
  const [showScanline, setShowScanline] = useState(true);
  const [showScaleBar, setShowScaleBar] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'canny' | 'contrast' | 'clahe'>('normal');

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Interactive Scanline Coordinates (normalized 0 to 1)
  const [scanlineStart, setScanlineStart] = useState({ x: 0.1, y: 0.5 });
  const [scanlineEnd, setScanlineEnd] = useState({ x: 0.9, y: 0.5 });
  const [draggingPoint, setDraggingPoint] = useState<'start' | 'end' | 'line' | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate scanline intersections with family traces
  const intersections: ScanlineIntersection[] = React.useMemo(() => {
    const results: ScanlineIntersection[] = [];

    // Helper: Line-line intersection
    const lineIntersect = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      p4: { x: number; y: number }
    ) => {
      const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      if (Math.abs(denom) < 0.0001) return null;
      const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
      const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
          x: p1.x + ua * (p2.x - p1.x),
          y: p1.y + ua * (p2.y - p1.y),
          t: ua,
        };
      }
      return null;
    };

    // Calculate real scanline length in meters based on scaleCm
    const dxNorm = scanlineEnd.x - scanlineStart.x;
    const dyNorm = scanlineEnd.y - scanlineStart.y;
    const lengthNorm = Math.sqrt(dxNorm * dxNorm + dyNorm * dyNorm);
    // Assuming image width represents approximately (scaleCm * 2.5) cm
    const imageSpanMeters = (scaleCm * 2.5) / 100;
    const scanlineMeters = Number((lengthNorm * imageSpanMeters).toFixed(2));

    families.forEach((fam) => {
      if (fam.traceLines) {
        fam.traceLines.forEach((trace) => {
          const hit = lineIntersect(
            scanlineStart,
            scanlineEnd,
            { x: trace.x1, y: trace.y1 },
            { x: trace.x2, y: trace.y2 }
          );
          if (hit) {
            results.push({
              posMeters: Number((hit.t * scanlineMeters).toFixed(2)),
              familyId: fam.id,
              familyName: fam.name,
              color: fam.color,
              apparentAngleDeg: Math.round(fam.dip),
            });
          }
        });
      }
    });

    results.sort((a, b) => a.posMeters - b.posMeters);
    return results;
  }, [families, scanlineStart, scanlineEnd, scaleCm]);

  // Handle Scanline Drags
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / (rect.width * zoom);
    const mouseY = (e.clientY - rect.top - pan.y) / (rect.height * zoom);

    // Check if clicked near start handle
    const distStart = Math.hypot(mouseX - scanlineStart.x, mouseY - scanlineStart.y);
    const distEnd = Math.hypot(mouseX - scanlineEnd.x, mouseY - scanlineEnd.y);

    if (distStart < 0.05) {
      setDraggingPoint('start');
    } else if (distEnd < 0.05) {
      setDraggingPoint('end');
    } else if (e.shiftKey || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }
    if (!draggingPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left - pan.x) / (rect.width * zoom)));
    const mouseY = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top - pan.y) / (rect.height * zoom)));

    if (draggingPoint === 'start') {
      setScanlineStart({ x: mouseX, y: mouseY });
    } else if (draggingPoint === 'end') {
      setScanlineEnd({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
    setIsPanning(false);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(3.5, Math.max(0.7, Number((prev + delta).toFixed(2)))));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setScanlineStart({ x: 0.1, y: 0.5 });
    setScanlineEnd({ x: 0.9, y: 0.5 });
  };

  const totalTracesCount = families.reduce((acc, f) => acc + (f.traceLines?.length || 0), 0);

  return (
    <div
      id="rock-face-viewer-container"
      className="bg-[#16191D] rounded-xl border border-[#2D333B] p-4 sm:p-5 shadow-xl flex flex-col space-y-3"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#2D333B]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-[#1F2329] text-emerald-400 border border-gray-700">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              Visor de Segmentación & Discontinuidades
            </h3>
            <p className="text-[11px] text-gray-400 font-mono">
              {lithologyName} • {families.length} Familias de Juntas • {totalTracesCount} Trazas Segmentadas
            </p>
          </div>
        </div>

        {/* Layer Toggle Chips */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            id="toggle-edges-btn"
            onClick={() => setShowEdges(!showEdges)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              showEdges
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'bg-[#0F1113] text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Filtro Fracturas</span>
          </button>

          <button
            id="toggle-families-btn"
            onClick={() => setShowFamilies(!showFamilies)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              showFamilies
                ? 'bg-[#1F2329] text-emerald-400 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'bg-[#0F1113] text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Familias (F1/F2/F3)</span>
          </button>

          <button
            id="toggle-cotas-btn"
            onClick={() => setShowSpacingCotas(!showSpacingCotas)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              showSpacingCotas
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                : 'bg-[#0F1113] text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cotas Espaciado (S)</span>
          </button>

          <button
            id="toggle-scanline-btn"
            onClick={() => setShowScanline(!showScanline)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              showScanline
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#0F1113] text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Scanline</span>
          </button>

          {onOpenCorrectionModal && (
            <button
              id="correct-observations-btn"
              onClick={onOpenCorrectionModal}
              className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer ${
                isCalibrated
                  ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-950/60 text-amber-300 border-amber-600 hover:bg-amber-900/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              }`}
              title="Corregir espaciado, discontinuidades o litología y calibrar el modelo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{isCalibrated ? 'IA Calibrada ✓' : 'Corregir Observaciones'}</span>
            </button>
          )}

          {onOpenAILearningConsole && (
            <button
              id="teach-ai-viewer-btn"
              onClick={onOpenAILearningConsole}
              className="px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border border-emerald-500/80 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)] cursor-pointer"
              title="Escribir recomendaciones a la IA para esta imagen"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Enseñar a la IA</span>
            </button>
          )}

          <button
            id="toggle-heatmap-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              showHeatmap
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-[#0F1113] text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Densidad Jv</span>
          </button>

          {/* Zoom & Reset Group */}
          <div className="flex items-center space-x-1 bg-[#0F1113] p-0.5 rounded border border-[#2D333B] ml-1">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1F2329]"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-emerald-400 px-1 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1F2329]"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1F2329]"
              title="Restablecer Vista"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#0F1113] rounded-lg overflow-hidden border border-[#2D333B] select-none cursor-crosshair"
      >
        {/* Geometric Corner Guides */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-zinc-600 pointer-events-none z-10"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-zinc-600 pointer-events-none z-10"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-zinc-600 pointer-events-none z-10"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-zinc-600 pointer-events-none z-10"></div>

        {/* Layer 1: Rock Image transformed by zoom and pan */}
        <div
          className="w-full h-full relative transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Frente Rocoso Geomecánico"
              className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
                activeFilter === 'canny'
                  ? 'grayscale contrast-200 invert'
                  : activeFilter === 'contrast'
                  ? 'contrast-150 brightness-90'
                  : ''
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400 space-y-3 p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Sin Fotografía de Frente Rocoso
                </h4>
                <p className="text-xs text-zinc-500 font-mono max-w-sm">
                  Cargue una imagen individual, suba una carpeta de frentes o capture con la cámara desde el panel superior.
                </p>
              </div>
            </div>
          )}

          {/* Layer 2: Simulated Computer Vision Canny Edge Highlight */}
          {showEdges && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen">
              <filter id="edgeGlow">
                <feGaussianBlur stdDeviation="1.2" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Synthetic subtle edge contours */}
              <path
                d="M 50 120 Q 150 180 320 140 T 600 220 T 900 160 M 80 400 Q 280 360 480 420 T 850 390"
                stroke="#00E5FF"
                strokeWidth="1.5"
                fill="none"
                filter="url(#edgeGlow)"
              />
            </svg>
          )}

          {/* Layer 3: Fracture Discontinuity Family Traces */}
          {showFamilies && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {families.map((fam) => (
                <g key={fam.id}>
                  {fam.traceLines?.map((line, idx) => (
                    <g key={`${fam.id}-trace-${idx}`}>
                      {/* Outer shadow for high visibility on any rock background */}
                      <line
                        x1={`${line.x1 * 100}%`}
                        y1={`${line.y1 * 100}%`}
                        x2={`${line.x2 * 100}%`}
                        y2={`${line.y2 * 100}%`}
                        stroke="#000000"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                      {/* Colored Joint Trace */}
                      <line
                        x1={`${line.x1 * 100}%`}
                        y1={`${line.y1 * 100}%`}
                        x2={`${line.x2 * 100}%`}
                        y2={`${line.y2 * 100}%`}
                        stroke={fam.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Family Tag at mid-point */}
                      <text
                        x={`${((line.x1 + line.x2) / 2) * 100}%`}
                        y={`${((line.y1 + line.y2) / 2) * 100}%`}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="bg-black/80 px-1 py-0.5 rounded shadow"
                        textAnchor="middle"
                        dy="-6"
                      >
                        {fam.id} ({fam.dip}°)
                      </text>
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          )}

          {/* Layer 3.5: Geometric Spacing Dimension Cotas & Dip Vectors */}
          {showSpacingCotas && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="cota-arrow-start"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 10 0 L 0 5 L 10 10 z" fill="#00E5FF" />
                </marker>
                <marker
                  id="cota-arrow-end"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#00E5FF" />
                </marker>
              </defs>

              {families.map((fam, fIdx) => {
                const traces = fam.traceLines;
                if (!traces || traces.length < 2) return null;
                // Draw dimension between first two traces of this family
                const t1 = traces[0];
                const t2 = traces[1];
                const mid1 = { x: (t1.x1 + t1.x2) / 2, y: (t1.y1 + t1.y2) / 2 };
                const mid2 = { x: (t2.x1 + t2.x2) / 2, y: (t2.y1 + t2.y2) / 2 };
                const center = { x: (mid1.x + mid2.x) / 2, y: (mid1.y + mid2.y) / 2 };

                return (
                  <g key={`cota-${fam.id}`}>
                    {/* Orthogonal dimension line between traces */}
                    <line
                      x1={`${mid1.x * 100}%`}
                      y1={`${mid1.y * 100}%`}
                      x2={`${mid2.x * 100}%`}
                      y2={`${mid2.y * 100}%`}
                      stroke={fam.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      markerStart="url(#cota-arrow-start)"
                      markerEnd="url(#cota-arrow-end)"
                    />
                    {/* Dimension Tag */}
                    <rect
                      x={`${center.x * 100 - 4}%`}
                      y={`${center.y * 100 - 3}%`}
                      width="8%"
                      height="6%"
                      rx="3"
                      fill="#0F1113"
                      stroke={fam.color}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x={`${center.x * 100}%`}
                      y={`${center.y * 100 + 1}%`}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      S={fam.spacingCm}cm
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Layer 4: Volumetric Joint Count / Heatmap Overlay */}
          {showHeatmap && (
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 via-amber-500/20 to-cyan-500/10 mix-blend-color-burn pointer-events-none flex items-center justify-center">
              <div className="px-3 py-1 bg-black/80 border border-rose-500 text-rose-300 font-mono text-xs rounded-full">
                ZONA DE ALTA FRECUENCIA DE FRACTURAMIENTO (Jv = 11.2 j/m³)
              </div>
            </div>
          )}

          {/* Layer 5: Interactive Virtual Scanline (Línea de Muestreo) */}
          {showScanline && (
            <svg className="absolute inset-0 w-full h-full pointer-events-auto">
              <defs>
                <marker
                  id="scanline-arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                </marker>
              </defs>

              {/* Base Scanline Bar */}
              <line
                x1={`${scanlineStart.x * 100}%`}
                y1={`${scanlineStart.y * 100}%`}
                x2={`${scanlineEnd.x * 100}%`}
                y2={`${scanlineEnd.y * 100}%`}
                stroke="#047857"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.8"
              />
              <line
                x1={`${scanlineStart.x * 100}%`}
                y1={`${scanlineStart.y * 100}%`}
                x2={`${scanlineEnd.x * 100}%`}
                y2={`${scanlineEnd.y * 100}%`}
                stroke="#34D399"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Intersection Points */}
              {intersections.map((inter, i) => {
                const posX = scanlineStart.x + (scanlineEnd.x - scanlineStart.x) * (inter.posMeters / (intersections[intersections.length - 1]?.posMeters || 1));
                const posY = scanlineStart.y + (scanlineEnd.y - scanlineStart.y) * (inter.posMeters / (intersections[intersections.length - 1]?.posMeters || 1));
                return (
                  <g key={`hit-${i}`}>
                    <circle
                      cx={`${posX * 100}%`}
                      cy={`${posY * 100}%`}
                      r="6"
                      fill={inter.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={`${posX * 100}%`}
                      y={`${posY * 100}%`}
                      dy="-10"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {inter.posMeters}m
                    </text>
                  </g>
                );
              })}

              {/* Draggable Start Handle */}
              <g
                transform={`translate(${scanlineStart.x * (containerRef.current?.clientWidth || 800) * zoom}, ${
                  scanlineStart.y * (containerRef.current?.clientHeight || 450) * zoom
                })`}
                className="cursor-move"
              >
                <circle cx="0" cy="0" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
                <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                  A
                </text>
              </g>

              {/* Draggable End Handle */}
              <g
                transform={`translate(${scanlineEnd.x * (containerRef.current?.clientWidth || 800) * zoom}, ${
                  scanlineEnd.y * (containerRef.current?.clientHeight || 450) * zoom
                })`}
                className="cursor-move"
              >
                <circle cx="0" cy="0" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
                <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                  B
                </text>
              </g>
            </svg>
          )}
        </div>

        {/* Metric Scale Bar Overlay in corner */}
        {showScaleBar && (
          <div className="absolute bottom-3 left-3 bg-[#0F1113]/90 backdrop-blur-md px-3 py-1.5 rounded border border-gray-700 text-white font-mono text-xs flex items-center gap-2.5 shadow-lg pointer-events-none">
            <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Escala Calibrada:</span>
            <div className="flex flex-col items-center">
              <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 via-white to-emerald-500 rounded border border-gray-900"></div>
              <span className="text-[10px] text-gray-300 mt-0.5">{scaleCm} cm</span>
            </div>
          </div>
        )}

        {/* Live HUD Indicator Top Right */}
        <div className="absolute top-3 right-3 bg-[#0F1113]/90 backdrop-blur-md px-3 py-2 rounded border border-emerald-800/80 text-xs font-mono text-emerald-300 flex flex-col space-y-1 shadow-lg pointer-events-none">
          <div className="flex items-center justify-between gap-3 text-[10px] uppercase font-bold">
            <span className="text-gray-400">Intersecciones Scanline:</span>
            <span className="font-bold text-emerald-400">{intersections.length} fracturas</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] uppercase font-bold">
            <span className="text-gray-400">Espaciamiento Medio:</span>
            <span className="font-bold text-amber-300">
              {intersections.length > 1
                ? (
                    (intersections[intersections.length - 1].posMeters / (intersections.length - 1)) *
                    100
                  ).toFixed(1)
                : '---'}{' '}
              cm
            </span>
          </div>
        </div>

        {/* Drag guide hint */}
        <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 bg-[#0F1113]/80 px-2 py-1 rounded font-mono border border-gray-800 pointer-events-none hidden sm:block">
          Arrastre los puntos A y B para mover la línea de muestreo
        </div>
      </div>

      {/* Discontinuity Families Color Legend & Readouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {families.map((fam) => (
          <div
            key={fam.id}
            id={`family-card-${fam.id}`}
            className="bg-[#1F2329] p-2.5 rounded border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-3.5 h-3.5 rounded shadow-sm"
                style={{ backgroundColor: fam.color }}
              ></div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">{fam.name}</h4>
                <p className="text-[11px] text-gray-400 font-mono">
                  Dip: <span className="text-emerald-400 font-semibold">{fam.dip}°</span> • DipDir:{' '}
                  <span className="text-emerald-400 font-semibold">{fam.dipDirection}°</span>
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-white block">{fam.spacingCm} cm</span>
              <span className="text-[10px] text-gray-400 uppercase">JRC {fam.roughnessJRC}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
