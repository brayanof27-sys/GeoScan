import React from 'react';
import { Activity, FileText, BookOpen, ShieldCheck, Database, Brain } from 'lucide-react';

interface HeaderProps {
  onOpenReport: () => void;
  onOpenThesisModal: () => void;
  onOpenAILearningConsole?: () => void;
  activeTab: 'simulation' | 'database' | 'thesis' | 'protocol';
  setActiveTab: (tab: 'simulation' | 'database' | 'thesis' | 'protocol') => void;
  isProcessing: boolean;
  databaseCount?: number;
  isCalibrated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenReport,
  onOpenThesisModal,
  onOpenAILearningConsole,
  activeTab,
  setActiveTab,
  isProcessing,
  databaseCount = 0,
}) => {
  return (
    <header id="main-header" className="bg-[#09090b] border-b border-zinc-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Technical Monochrome Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-white text-black rounded flex items-center justify-center shadow-sm shrink-0 font-black">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-sans">
                  GEOSCAN<span className="text-zinc-400">.AI</span>
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded font-mono font-bold">
                  B&W EDITION
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block font-mono tracking-wide">
                CARACTERIZACIÓN GEOMECÁNICA RMR89 & GESTIÓN DE PROYECTOS
              </p>
            </div>
          </div>

          {/* Center Hardware HUD (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded border border-zinc-700 text-zinc-200">
              <Brain className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>APRENDIZAJE ADAPTATIVO: ACTIVO</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded border border-zinc-800 text-zinc-400">
              <span>LATENCY: 12ms</span>
            </div>
          </div>

          {/* Navigation & Mode selector */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex items-center">
              <button
                id="tab-simulation-btn"
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'simulation'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulación</span>
              </button>

              <button
                id="tab-database-btn"
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'database'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Base Proyectos</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  activeTab === 'database' ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-200 border border-zinc-700'
                }`}>
                  {databaseCount}
                </span>
              </button>

              <button
                id="tab-thesis-btn"
                onClick={() => setActiveTab('thesis')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'thesis'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tesis</span>
              </button>

              <button
                id="tab-protocol-btn"
                onClick={() => setActiveTab('protocol')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'protocol'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Protocolo</span>
                <span className="sm:hidden">Guía</span>
              </button>
            </div>

            {/* AI Brain Button */}
            {onOpenAILearningConsole && (
              <button
                id="header-brain-btn"
                onClick={onOpenAILearningConsole}
                className="px-2.5 py-1.5 sm:px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] sm:text-xs font-mono font-bold rounded border border-zinc-700 uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                title="Cerebro de la IA: Recomendaciones por imagen y calibración continua"
              >
                <Brain className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="hidden sm:inline">Cerebro IA</span>
              </button>
            )}

            {/* Generate Report Button */}
            <button
              id="generate-report-btn"
              onClick={onOpenReport}
              className="px-3.5 py-1.5 sm:py-2 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-bold rounded border border-zinc-300 shadow uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-black" />
              <span className="hidden md:inline">FICHA TÉCNICA</span>
              <span className="md:hidden">FICHA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time processing progress bar */}
      {isProcessing && (
        <div className="w-full bg-zinc-950 h-1 overflow-hidden">
          <div className="h-full bg-white animate-pulse w-full shadow-[0_0_8px_#ffffff]"></div>
        </div>
      )}
    </header>
  );
};
