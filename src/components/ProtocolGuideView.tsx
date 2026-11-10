import React from 'react';
import { ShieldCheck, Camera, Check, X, AlertTriangle, Lightbulb, Ruler, Eye } from 'lucide-react';

export const ProtocolGuideView: React.FC = () => {
  return (
    <div id="protocol-guide-view" className="space-y-4">
      {/* Title Banner */}
      <div className="bg-black rounded-xl border border-zinc-800 p-5 shadow-2xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-zinc-800">
          <div className="p-2.5 rounded-lg bg-zinc-900 text-white border border-zinc-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              Protocolo de Adquisición de Imágenes Geomecánicas
              <span className="text-xs px-2.5 py-0.5 bg-zinc-900 text-white border border-zinc-700 rounded font-mono font-bold">
                100% Automático
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono">
              Criterios rigurosos de captura para garantizar la máxima exactitud en la caracterización sin intervención manual
            </p>
          </div>
        </div>

        {/* 4 Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-white mb-2">
              <Ruler className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">1. Escala Métrica Visible</h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Colocar una barra métrica de 1.0 m, picota geológica de 30 cm o puntero láser calibrado frente a la roca para convertir píxeles a cm reales.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-white mb-2">
              <Eye className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">2. Enfoque & Nitidez</h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              El algoritmo mide la varianza Laplaciana (&gt;50%). Evitar movimientos bruscos de la cámara y superficies borrosas o con polvo denso.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-white mb-2">
              <Lightbulb className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">3. Iluminación Homogénea</h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              En labores subterráneas, utilizar reflectores LED difusos para evitar sombras duras que confundan las sombras con fracturas reales.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-white mb-2">
              <Camera className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">4. Ángulo Perpendicular</h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              La cámara debe orientarse perpendicular (ortogonal a 90°) al frente rocoso para minimizar distorsiones de perspectiva en los espaciamientos.
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Criteria & Automated Quality Gate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approved criteria */}
        <div className="bg-black rounded-xl border border-zinc-800 p-5 shadow-2xl space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-200" />
            Condiciones de Fotografía Aprobada
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300 font-mono">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></span>
              <span>Superficie de roca limpia y visible con discontinuidades contrastadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></span>
              <span>Resolución mínima de 1280x720 píxeles.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></span>
              <span>Presencia de elemento de escala calibrada (vara métrica, picota o disco).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></span>
              <span>Rango de brillo entre 50 y 200 en escala de grises de 8 bits.</span>
            </li>
          </ul>
        </div>

        {/* Rejection criteria */}
        <div className="bg-black rounded-xl border border-zinc-800 p-5 shadow-2xl space-y-3">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
            <X className="w-4 h-4 text-zinc-400" />
            Condiciones de Descarte Automático
          </h3>
          <ul className="space-y-2 text-xs text-zinc-400 font-mono">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></span>
              <span>Imagen desenfocada o con trepidación por movimiento (score &lt; 40%).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></span>
              <span>Sombras extremas causadas por reflectores puntuales directos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></span>
              <span>Ausencia total de referencia dimensional (no permite cálculo métrico).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></span>
              <span>Obstrucción por maquinaria, mangueras o personal minero sobre el frente.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
