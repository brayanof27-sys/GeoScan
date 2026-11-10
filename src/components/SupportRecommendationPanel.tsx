import React from 'react';
import { ShieldCheck, HardHat, Wrench, Layers, CheckCircle2 } from 'lucide-react';
import { SupportRecommendation, RMRData } from '../types';

interface SupportRecommendationPanelProps {
  support: SupportRecommendation;
  rmr: RMRData;
  tunnelSpanMeters: number;
}

export const SupportRecommendationPanel: React.FC<SupportRecommendationPanelProps> = ({
  support,
  rmr,
  tunnelSpanMeters = 5.0,
}) => {
  return (
    <div id="support-recommendation-panel" className="bg-black rounded-xl border border-zinc-800 p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              Diseño de Sostenimiento Minero Recomendado
              <span className="text-xs px-2 py-0.5 bg-zinc-900 text-white border border-zinc-700 rounded font-mono font-bold">
                {rmr.classRating.split(' ')[0]}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Prescripción técnica según Cartilla Bieniawski 1989 & Cartilla Barton para Labor de {tunnelSpanMeters}m de Luz
            </p>
          </div>
        </div>
      </div>

      {/* Main Support Category Banner */}
      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0 border border-zinc-700">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
              Categoría de Sostenimiento:
            </span>
            <span className="text-sm font-bold text-white uppercase tracking-wide">{support.category}</span>
          </div>
        </div>
      </div>

      {/* Support Details Grid + Visual Tunnel Cross-Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Support items breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {/* Item 1: Pernos */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 mt-0.5 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Pernos de Anclaje (Rock Bolts)
              </h4>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{support.rockBolts}</p>
            </div>
          </div>

          {/* Item 2: Shotcrete */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 mt-0.5 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Hormigón Proyectado (Shotcrete)
              </h4>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{support.shotcrete}</p>
            </div>
          </div>

          {/* Item 3: Malla */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 mt-0.5 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Malla Electrosoldada (Wire Mesh)
              </h4>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{support.wireMesh}</p>
            </div>
          </div>

          {/* Item 4: Seguridad */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 mt-0.5 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Medidas Preventivas de Seguridad
              </h4>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">{support.additionalSafety}</p>
            </div>
          </div>
        </div>

        {/* Visual Tunnel Cross Section Schematic (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-950 rounded-lg border border-zinc-800 p-3 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1 border-b border-zinc-800">
            <span className="uppercase font-bold">Esquema de Instalación</span>
            <span className="text-white font-bold">Luz = {tunnelSpanMeters}m</span>
          </div>

          {/* SVG Horseshoe Tunnel */}
          <svg viewBox="0 0 200 180" className="w-44 h-44 my-1">
            {/* Rock mass surrounding */}
            <rect x="0" y="0" width="200" height="180" fill="#09090b" />

            {/* Natural fracture joint lines */}
            <line x1="20" y1="20" x2="60" y2="70" stroke="#27272a" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="140" y1="20" x2="180" y2="80" stroke="#27272a" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="10" y1="120" x2="50" y2="160" stroke="#27272a" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Tunnel Horseshoe Opening */}
            <path
              d="M 40 160 L 40 90 A 60 60 0 0 1 160 90 L 160 160 Z"
              fill="#000000"
              stroke="#52525b"
              strokeWidth="2"
            />

            {/* Shotcrete Layer if RMR <= 80 */}
            {rmr.totalScore <= 80 && (
              <path
                d="M 36 160 L 36 90 A 64 64 0 0 1 164 90 L 164 160"
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="3.5"
                opacity="0.9"
              />
            )}

            {/* Wire Mesh Layer if RMR <= 60 */}
            {rmr.totalScore <= 60 && (
              <path
                d="M 33 160 L 33 90 A 67 67 0 0 1 167 90 L 167 160"
                fill="none"
                stroke="#71717a"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            {/* Radial Rockbolts (Pernos) */}
            <line x1="40" y1="110" x2="10" y2="105" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="40" cy="110" r="3" fill="#ffffff" />

            <line x1="65" y1="55" x2="40" y2="25" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="65" cy="55" r="3" fill="#ffffff" />

            <line x1="100" y1="30" x2="100" y2="5" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="100" cy="30" r="3" fill="#ffffff" />

            <line x1="135" y1="55" x2="160" y2="25" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="135" cy="55" r="3" fill="#ffffff" />

            <line x1="160" y1="110" x2="190" y2="105" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="160" cy="110" r="3" fill="#ffffff" />

            {/* Excavation Floor */}
            <line x1="30" y1="160" x2="170" y2="160" stroke="#71717a" strokeWidth="2" />
          </svg>

          {/* Legend */}
          <div className="w-full flex flex-wrap justify-center gap-3 text-[10px] font-mono text-zinc-300 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-white rounded-full"></span> Perno Helicoidal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-zinc-400 rounded-full"></span> Shotcrete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-zinc-600 rounded-full"></span> Malla
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
