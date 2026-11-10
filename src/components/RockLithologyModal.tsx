import React, { useState } from 'react';
import {
  GEOLOGICAL_ROCK_CATALOG,
  GeologicalRockType,
  WeatheringDegree,
  calculateEffectiveUCS,
  getAllLithologies,
  saveCustomLithology,
  deleteCustomLithology,
} from '../data/rockLithologies';
import { RockUCSData } from '../types';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Gauge,
  Sparkles,
  Info,
  Hammer,
  HelpCircle,
  Layers,
  ChevronRight,
  PlusCircle,
  Trash2,
  Tag,
  Sliders,
  X,
} from 'lucide-react';

interface RockLithologyModalProps {
  isOpen: boolean;
  onConfirm: (ucsData: RockUCSData) => void;
  onClose?: () => void;
  initialRockName?: string;
  previewImageSrc?: string;
}

export const RockLithologyModal: React.FC<RockLithologyModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
  initialRockName,
  previewImageSrc,
}) => {
  if (!isOpen) return null;

  const [allRocks, setAllRocks] = useState<GeologicalRockType[]>(getAllLithologies());

  // Find initial rock or default to Granodiorita / Andesita
  const defaultRock =
    allRocks.find((r) =>
      initialRockName ? r.name.toLowerCase().includes(initialRockName.toLowerCase()) : false
    ) || allRocks[1] || allRocks[0];

  const [selectedRock, setSelectedRock] = useState<GeologicalRockType>(defaultRock);
  const [selectedGroup, setSelectedGroup] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [weathering, setWeathering] = useState<WeatheringDegree>('Ligeramente Meteorizada (W2)');
  const [customUcsInput, setCustomUcsInput] = useState<string>('');

  // Form for adding brand new lithology with custom values
  const [isAddingNewLithology, setIsAddingNewLithology] = useState<boolean>(false);
  const [newRockName, setNewRockName] = useState<string>('');
  const [newRockGroup, setNewRockGroup] = useState<
    'Ígnea Plutónica' | 'Ígnea Volcánica' | 'Sedimentaria' | 'Metamórfica' | 'Personalizada'
  >('Ígnea Plutónica');
  const [newUcsMin, setNewUcsMin] = useState<number>(80);
  const [newUcsTyp, setNewUcsTyp] = useState<number>(140);
  const [newUcsMax, setNewUcsMax] = useState<number>(210);
  const [newDescription, setNewDescription] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Calculate live UCS parameters
  const customNum = customUcsInput ? parseFloat(customUcsInput) : undefined;
  const effectiveResult = calculateEffectiveUCS(selectedRock, weathering, customNum);

  // Filter rocks
  const filteredRocks = allRocks.filter((rock) => {
    const matchesGroup =
      selectedGroup === 'Todas' ||
      rock.group === selectedGroup ||
      (selectedGroup === 'Personalizadas' && rock.isCustom);
    const matchesSearch =
      rock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rock.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rock.group.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleSaveNewLithologySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRockName.trim()) return;

    const min = Number(newUcsMin) || 50;
    const typ = Number(newUcsTyp) || 120;
    const max = Number(newUcsMax) || 200;

    const created = saveCustomLithology({
      name: newRockName.trim(),
      group: newRockGroup,
      ucsMinMpa: Math.min(min, typ),
      ucsTypMpa: typ,
      ucsMaxMpa: Math.max(typ, max),
      description: newDescription.trim() || `Litología ${newRockName.trim()} agregada por el usuario.`,
    });

    const updatedCatalog = getAllLithologies();
    setAllRocks(updatedCatalog);
    setSelectedRock(created);
    setIsAddingNewLithology(false);

    // Reset form
    setNewRockName('');
    setNewDescription('');
    setNewUcsMin(80);
    setNewUcsTyp(140);
    setNewUcsMax(210);

    setNotificationMsg(`¡Litología "${created.name}" guardada en el catálogo y seleccionada!`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteCustomLithology(id);
    const remaining = getAllLithologies();
    setAllRocks(remaining);
    if (selectedRock.id === id) {
      setSelectedRock(remaining[0]);
    }
  };

  const handleConfirmSelection = () => {
    const ucsData: RockUCSData = {
      rockName: selectedRock.name,
      group: selectedRock.group,
      ucsMinMpa: effectiveResult.minMpa,
      ucsTypMpa: effectiveResult.typicalMpa,
      ucsMaxMpa: effectiveResult.maxMpa,
      confirmedUcsMpa: effectiveResult.ucsMpa,
      isrmGrade: effectiveResult.isrmGrade,
      isrmGradeCode: effectiveResult.isrmGradeCode,
      r1Rating: effectiveResult.r1Rating,
      weathering: weathering,
      fieldIdentification: effectiveResult.fieldIdentification,
      isUserConfirmed: true,
    };

    onConfirm(ucsData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header HUD */}
        <div className="px-5 py-4 bg-black border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                  Identificación Litológica Requerida
                </span>
                <span className="text-xs font-mono text-white font-bold">
                  {allRocks.length} Litologías Disponibles
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                Seleccionar o Añadir Litología de la Roca
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {previewImageSrc && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-800">
                <img
                  src={previewImageSrc}
                  alt="Frente Rocoso Subido"
                  className="w-12 h-10 object-cover rounded border border-zinc-700 shadow"
                />
                <div className="text-[10px] font-mono text-zinc-400">
                  <span>Muestra Subida</span>
                  <div className="text-white font-semibold">Listo p/ Analizar</div>
                </div>
              </div>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="px-5 py-2.5 bg-black border-b border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">¿Por qué es indispensable este paso?</strong> La resistencia a la compresión uniaxial (<span className="font-mono font-bold text-white">UCS / σci</span>) es la base del parámetro <span className="font-mono text-white font-bold">R1</span> del RMR y Hoek-Brown. Selecciona la litología de este frente o añade una nueva con sus valores propios de laboratorio.
          </p>
        </div>

        {/* Notification Toast */}
        {notificationMsg && (
          <div className="p-3 bg-zinc-900 border-b border-zinc-700 text-white text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Modal Main Content: Split 2 columns on desktop */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1: Rock Selector, Search & Add New Lithology Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Action Bar: Search & "Añadir Nueva Litología" Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar roca (ej. Granito, Andesita, Caliza, Basalto...)"
                  className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-sans"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNewLithology(!isAddingNewLithology)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isAddingNewLithology
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'
                }`}
                title="Añadir una nueva litología con nuevos valores al catálogo"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAddingNewLithology ? 'Ver Catálogo' : '+ Nueva Litología'}</span>
              </button>
            </div>

            {/* FORM TO ADD NEW LITHOLOGY WITH NEW VALUES */}
            {isAddingNewLithology ? (
              <form
                onSubmit={handleSaveNewLithologySubmit}
                className="p-4 bg-[#0F1113] border-2 border-amber-500/60 rounded-xl space-y-3 shadow-xl animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>Añadir Nueva Litología con Nuevos Valores</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Se guardará en el catálogo permanente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Rock Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-300 uppercase block font-bold">
                      Nombre Geológico de la Roca *:
                    </label>
                    <input
                      type="text"
                      required
                      value={newRockName}
                      onChange={(e) => setNewRockName(e.target.value)}
                      placeholder="Ej. Monzodiorita Porfirítica, Skarn de Granate, Brecha Volcánica..."
                      className="w-full px-3 py-2 bg-[#16191D] border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>

                  {/* Rock Group */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-300 uppercase block font-bold">
                      Grupo o Familia Geológica:
                    </label>
                    <select
                      value={newRockGroup}
                      onChange={(e) => setNewRockGroup(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Ígnea Plutónica">Ígnea Plutónica (Intrusiva)</option>
                      <option value="Ígnea Volcánica">Ígnea Volcánica (Extrusiva)</option>
                      <option value="Sedimentaria">Sedimentaria</option>
                      <option value="Metamórfica">Metamórfica</option>
                      <option value="Personalizada">Brecha / Skarn / Personalizada</option>
                    </select>
                  </div>

                  {/* UCS Min */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase block">
                      UCS Mínimo (MPa):
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={600}
                      value={newUcsMin}
                      onChange={(e) => setNewUcsMin(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* UCS Typical */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-amber-300 uppercase block font-bold">
                      UCS Típico / Medio (MPa) *:
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={600}
                      value={newUcsTyp}
                      onChange={(e) => setNewUcsTyp(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#16191D] border border-amber-500 rounded text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  {/* UCS Max */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase block">
                      UCS Máximo (MPa):
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={600}
                      value={newUcsMax}
                      onChange={(e) => setNewUcsMax(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 uppercase block">
                      Descripción Geológica o Notas de Campo:
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Ej. Roca de alteración hidrotermal, textura porfídica con plagioclasa y cuarzo."
                      className="w-full px-2.5 py-1.5 bg-[#16191D] border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewLithology(false)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-mono transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={!newRockName.trim()}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardar y Seleccionar Esta Litología</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Filter Tabs by Group */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                  {['Todas', 'Ígnea Plutónica', 'Ígnea Volcánica', 'Sedimentaria', 'Metamórfica', 'Personalizadas'].map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroup(grp)}
                      className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                        selectedGroup === grp
                          ? 'bg-white text-black font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                {/* Geological Rock Cards List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredRocks.map((rock) => {
                    const isSelected = selectedRock.id === rock.id;
                    return (
                      <div
                        key={rock.id}
                        onClick={() => setSelectedRock(rock)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-zinc-900 border-white ring-2 ring-white/30 shadow-md'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white tracking-wide truncate">
                              {rock.name}
                            </span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                              {rock.group}
                            </span>
                            {rock.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700 shrink-0">
                                ★ Personalizada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-1">{rock.description}</p>
                        </div>

                        <div className="flex items-center gap-2 pl-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-white">
                              {rock.ucsTypMpa} <span className="text-[10px] text-zinc-400">MPa typ</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              [{rock.ucsMinMpa} - {rock.ucsMaxMpa}]
                            </div>
                          </div>

                          {rock.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustom(e, rock.id)}
                              className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                              title="Eliminar litología personalizada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Column 2: Live UCS Estimation & Weathering Adjustment (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F1113] border border-[#2D333B] rounded-lg p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-gray-800 pb-2">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  Litología Seleccionada para este Frente
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedRock.name}</span>
                  {selectedRock.isCustom && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      Personalizada
                    </span>
                  )}
                </h3>
                <span className="text-xs text-gray-400">{selectedRock.group}</span>
              </div>

              {/* Estimated UCS Hero Value */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Resistencia UCS Estimada (σci):</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700">
                    {effectiveResult.isrmGradeCode}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-white tracking-tight">
                    {effectiveResult.ucsMpa}
                  </span>
                  <span className="text-sm font-mono text-zinc-400">MPa (N/mm²)</span>
                </div>

                {/* Range Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Mín: {effectiveResult.minMpa} MPa</span>
                    <span className="text-white font-semibold">Típico: {effectiveResult.typicalMpa} MPa</span>
                    <span>Máx: {effectiveResult.maxMpa} MPa</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-white transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            10,
                            ((effectiveResult.ucsMpa - effectiveResult.minMpa) /
                              (effectiveResult.maxMpa - effectiveResult.minMpa || 1)) *
                              100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Bieniawski R1 Rating */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-xs font-mono">
                  <span className="text-zinc-400">Puntaje RMR Parameter A1 (UCS):</span>
                  <span className="font-bold text-black bg-white px-2 py-0.5 rounded">
                    {effectiveResult.r1Rating} / 15 pts
                  </span>
                </div>
              </div>

              {/* Weathering Condition Modifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-white" />
                  <span>Grado de Meteorización (Ajusta la Resistencia):</span>
                </label>
                <select
                  value={weathering}
                  onChange={(e) => setWeathering(e.target.value as WeatheringDegree)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-white font-sans"
                >
                  <option value="Sana / Inalterada (W1)">W1 - Sana / Inalterada (100% - 105% UCS)</option>
                  <option value="Ligeramente Meteorizada (W2)">W2 - Ligeramente Meteorizada (90% - 95% UCS)</option>
                  <option value="Moderadamente Meteorizada (W3)">W3 - Moderadamente Meteorizada (65% UCS)</option>
                  <option value="Muy Meteorizada (W4)">W4 - Muy Meteorizada (40% UCS)</option>
                  <option value="Completamente Descompuesta (W5)">W5 - Completamente Descompuesta (20% UCS)</option>
                </select>
              </div>

              {/* Optional Custom Laboratory UCS Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">¿Tiene ensayo de laboratorio específico?</span>
                  <span className="text-[10px] text-zinc-500">(Opcional)</span>
                </div>
                <input
                  type="number"
                  value={customUcsInput}
                  onChange={(e) => setCustomUcsInput(e.target.value)}
                  placeholder={`Valor específico en MPa (ej. ${effectiveResult.typicalMpa})`}
                  className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
                />
              </div>

              {/* Field Hammer Criteria Tip */}
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-white font-mono font-bold">
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Criterio de Identificación en Campo (ISRM):</span>
                </div>
                <p className="leading-snug">{selectedRock.fieldHammerTest}</p>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={handleConfirmSelection}
                className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Confirmar Litología & Proceder al Análisis</span>
                <ChevronRight className="w-4 h-4 text-black" />
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-mono text-center cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
