import React, { useState } from 'react';
import { Compass, Info, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { DiscontinuityFamily } from '../types';
import { dipDipDirToStereonetPole, generateGreatCirclePoints } from '../utils/imageProcessing';

interface StereonetViewerProps {
  families: DiscontinuityFamily[];
  tunnelStrike?: number; // Optional tunnel axis orientation
}

export const StereonetViewer: React.FC<StereonetViewerProps> = ({
  families,
  tunnelStrike = 45,
}) => {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [showPoles, setShowPoles] = useState(true);
  const [showGreatCircles, setShowGreatCircles] = useState(true);
  const [showDensityContour, setShowDensityContour] = useState(true);

  // Stereonet dimensions (radius = 120px)
  const radius = 120;
  const center = 150;

  // Calculate pole and great circle paths for each family
  const familyProjections = families.map((fam) => {
    const pole = dipDipDirToStereonetPole(fam.dip, fam.dipDirection);
    const poleCanvasX = center + pole.x * radius;
    const poleCanvasY = center + pole.y * radius;

    const circlePoints = generateGreatCirclePoints(fam.dip, fam.dipDirection);
    const circlePath = circlePoints
      .map((p, i) => {
        const cx = center + p.x * radius;
        const cy = center + p.y * radius;
        return `${i === 0 ? 'M' : 'L'} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
      })
      .join(' ');

    return {
      ...fam,
      poleX: poleCanvasX,
      poleY: poleCanvasY,
      circlePath,
    };
  });

  return (
    <div id="stereonet-viewer-card" className="bg-black rounded-xl border border-zinc-800 p-4 sm:p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Proyección Estereográfica (Schmidt)</h3>
            <p className="text-[11px] text-zinc-400 font-mono">Hemisferio Inferior • Polos & Trazas Ciclográficas</p>
          </div>
        </div>

        {/* View toggles in monochrome */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setShowPoles(!showPoles)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer ${
              showPoles
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Polos
          </button>
          <button
            onClick={() => setShowGreatCircles(!showGreatCircles)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer ${
              showGreatCircles
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Ciclográficas
          </button>
        </div>
      </div>

      {/* SVG Stereonet Canvas */}
      <div className="my-3 flex justify-center items-center">
        <svg
          viewBox="0 0 300 300"
          className="w-56 h-56 sm:w-64 sm:h-64 select-none drop-shadow-md"
        >
          {/* Background net circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#0F1113"
            stroke="#2D333B"
            strokeWidth="2"
          />

          {/* Concentric dip guide circles (30°, 60°) */}
          <circle
            cx={center}
            cy={center}
            r={radius * Math.SQRT2 * Math.sin((30 * Math.PI) / 360)}
            fill="none"
            stroke="#1F2329"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={center}
            cy={center}
            r={radius * Math.SQRT2 * Math.sin((60 * Math.PI) / 360)}
            fill="none"
            stroke="#1F2329"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* North-South & East-West Crosshairs */}
          <line
            x1={center}
            y1={center - radius}
            x2={center}
            y2={center + radius}
            stroke="#2D333B"
            strokeWidth="1"
          />
          <line
            x1={center - radius}
            y1={center}
            x2={center + radius}
            y2={center}
            stroke="#2D333B"
            strokeWidth="1"
          />

          {/* Density Contours (Simulated Fisher distribution rings around main pole) */}
          {showDensityContour && familyProjections.length > 0 && (
            <g opacity="0.35">
              {familyProjections.map((fam) => (
                <circle
                  key={`density-${fam.id}`}
                  cx={fam.poleX}
                  cy={fam.poleY}
                  r="22"
                  fill={fam.color}
                  filter="blur(8px)"
                />
              ))}
            </g>
          )}

          {/* Great Circles (Ciclográficas) */}
          {showGreatCircles &&
            familyProjections.map((fam) => (
              <path
                key={`circle-${fam.id}`}
                d={fam.circlePath}
                fill="none"
                stroke={fam.color}
                strokeWidth={selectedFamilyId === fam.id ? '3' : '2'}
                strokeOpacity={selectedFamilyId === fam.id ? '1' : '0.8'}
              />
            ))}

          {/* Poles (Polos de Diaclasas) */}
          {showPoles &&
            familyProjections.map((fam) => (
              <g
                key={`pole-${fam.id}`}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedFamilyId(selectedFamilyId === fam.id ? null : fam.id)
                }
              >
                <circle
                  cx={fam.poleX}
                  cy={fam.poleY}
                  r="6"
                  fill={fam.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="hover:scale-125 transition-transform"
                />
                <text
                  x={fam.poleX + 8}
                  y={fam.poleY - 6}
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {fam.id}
                </text>
              </g>
            ))}

          {/* Cardinal direction labels */}
          <text x={center} y={center - radius - 6} textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">
            N
          </text>
          <text x={center + radius + 10} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="11">
            E
          </text>
          <text x={center} y={center + radius + 14} textAnchor="middle" fill="#64748b" fontSize="11">
            S
          </text>
          <text x={center - radius - 10} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="11">
            W
          </text>
        </svg>
      </div>

      {/* Families Polar Table */}
      <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
        <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 pb-1 uppercase tracking-wider">
          <span>Familia</span>
          <span>Buzamiento</span>
          <span>Dir. Buz.</span>
          <span>Rumbo</span>
        </div>
        {families.map((fam) => (
          <div
            key={fam.id}
            onClick={() => setSelectedFamilyId(fam.id)}
            className={`grid grid-cols-4 text-xs font-mono p-1.5 rounded cursor-pointer transition-colors border ${
              selectedFamilyId === fam.id
                ? 'bg-zinc-900 border-white text-white shadow-sm'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5" style={{ color: fam.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: fam.color }} />
              {fam.id}
            </span>
            <span>{fam.dip}°</span>
            <span>{fam.dipDirection}°</span>
            <span>{fam.strike}°</span>
          </div>
        ))}
      </div>

      {/* Kinematic Assessment hint */}
      <div className="mt-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
        <span>Intersección de F1 y F2 genera potencial cuña en bóveda con línea de caída de 42°.</span>
      </div>
    </div>
  );
};
