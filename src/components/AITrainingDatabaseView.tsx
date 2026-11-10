import React, { useState, useRef, useEffect } from 'react';
import {
  TrainingDatabaseEntry,
  LearningModelStats,
  GeotechnicalProject,
  GeotechnicalSubfolder,
  getTrainingDatabase,
  saveTrainingDatabase,
  computeLearningStats,
  deleteDatabaseEntry,
  deleteMultipleDatabaseEntries,
  clearAllDatabaseEntries,
  duplicateDatabaseEntry,
  getSampleFileName,
  getGeotechnicalProjects,
  saveGeotechnicalProjects,
  createGeotechnicalProject,
  createSubfolderInProject,
  deleteSubfolderFromProject,
  deleteGeotechnicalProject,
  getActiveProjectId,
  setActiveProjectId,
  getActiveSubfolderId,
  setActiveSubfolderId,
  clearEntireDatabaseAndMemory,
  estimateRockBaselineParameters,
} from '../utils/aiLearningStore';
import { compressRockImage } from '../utils/persistentStorage';
import { getAllLithologies, GeologicalRockType, GEOLOGICAL_ROCK_CATALOG } from '../data/rockLithologies';
import { analyzeRockFaceImage } from '../utils/rockImageVisionAnalyzer';
import {
  exportDatabaseToExcel,
  exportSingleCartillaToExcel,
  getRMRBreakdownFromEntry,
  formatDateTime,
} from '../utils/geomechanicalExcelExport';
import {
  Database,
  Brain,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  HardDrive,
  Server,
  FolderPlus,
  FolderUp,
  Folder,
  FolderOpen,
  X,
  Trash2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Copy,
  ChevronRight,
  Plus,
  ArrowRight,
  MoveRight,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Info,
  Maximize2,
} from 'lucide-react';

interface AITrainingDatabaseViewProps {
  onLoadSampleToSimulation: (entry: TrainingDatabaseEntry) => void;
  onOpenFeedModal: () => void;
  onOpenCorrectionModalForEntry: (entry: TrainingDatabaseEntry) => void;
}

export const AITrainingDatabaseView: React.FC<AITrainingDatabaseViewProps> = ({
  onLoadSampleToSimulation,
  onOpenCorrectionModalForEntry,
}) => {
  // Database & Projects State
  const [entries, setEntries] = useState<TrainingDatabaseEntry[]>(getTrainingDatabase());
  const [projects, setProjects] = useState<GeotechnicalProject[]>(getGeotechnicalProjects());
  const [stats, setStats] = useState<LearningModelStats>(computeLearningStats(entries));

  // Active Project & Subfolder Selection
  const [activeProjId, setActiveProjId] = useState<string | null>(getActiveProjectId());
  const [activeSubfId, setActiveSubfId] = useState<string | null>(getActiveSubfolderId());

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('Todas');
  const [viewMode, setViewMode] = useState<'hybrid' | 'table' | 'all_grid'>('hybrid');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal dialog states
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isNewSubfolderModalOpen, setIsNewSubfolderModalOpen] = useState<boolean>(false);
  const [sampleToMove, setSampleToMove] = useState<TrainingDatabaseEntry | null>(null);
  const [sampleToDelete, setSampleToDelete] = useState<{ id: string; title: string; fileName: string } | null>(null);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label?: string }>({ current: 0, total: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Project Wizard Form State (USER REQUIREMENT: Asks for host rock first!)
  const [newProjectStep, setNewProjectStep] = useState<1 | 2>(1);
  const [selectedHostRockName, setSelectedHostRockName] = useState<string>('Granodiorita');
  const [hostRockSearch, setHostRockSearch] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectCode, setNewProjectCode] = useState<string>('');
  const [newProjectMine, setNewProjectMine] = useState<string>('');
  const [newProjectEvaluator, setNewProjectEvaluator] = useState<string>('Ing. Geomecánico');
  const [newProjectInitialFolders, setNewProjectInitialFolders] = useState<string>('Nivel 2400 - Rampa Sur, Galería 104, Frente de Avance');

  // New Subfolder Form State
  const [newSubfolderName, setNewSubfolderName] = useState<string>('');
  const [newSubfolderDesc, setNewSubfolderDesc] = useState<string>('');

  // Target subfolder when moving samples
  const [targetMoveSubfolderId, setTargetMoveSubfolderId] = useState<string>('');

  // File Inputs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const importJsonInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync active project if none selected but projects exist
  useEffect(() => {
    if (!activeProjId && projects.length > 0) {
      setActiveProjId(projects[0].id);
      setActiveProjectId(projects[0].id);
      if (projects[0].subfolders[0]) {
        setActiveSubfId(projects[0].subfolders[0].id);
        setActiveSubfolderId(projects[0].subfolders[0].id);
      }
    }
  }, [projects, activeProjId]);

  // Current active project object
  const activeProject = projects.find((p) => p.id === activeProjId) || null;
  // Current active subfolder object
  const activeSubfolder = activeProject?.subfolders.find((s) => s.id === activeSubfId) || null;

  // Selected Host Rock Metadata (dynamic calculation)
  const currentHostRockMeta = estimateRockBaselineParameters(selectedHostRockName);

  // Refresh
  const refreshData = () => {
    const curEntries = getTrainingDatabase();
    const curProjects = getGeotechnicalProjects();
    setEntries(curEntries);
    setProjects(curProjects);
    setStats(computeLearningStats(curEntries));
    showToast('Base de datos y proyectos sincronizados.');
  };

  // Change active project
  const handleSelectProject = (projId: string | null) => {
    setActiveProjId(projId);
    setActiveProjectId(projId);
    if (projId) {
      const proj = projects.find((p) => p.id === projId);
      const firstSub = proj?.subfolders[0]?.id || null;
      setActiveSubfId(firstSub);
      setActiveSubfolderId(firstSub);
    } else {
      setActiveSubfId(null);
      setActiveSubfolderId(null);
    }
  };

  // Change active subfolder
  const handleSelectSubfolder = (subfId: string | null) => {
    setActiveSubfId(subfId);
    setActiveSubfolderId(subfId);
  };

  // Open Create Project Modal
  const openNewProjectModal = () => {
    setNewProjectStep(1);
    setSelectedHostRockName('Granodiorita');
    setNewProjectName('');
    setNewProjectCode(`PRJ-${String(new Date().getFullYear())}-${String(Math.floor(Math.random() * 900 + 100))}`);
    setNewProjectMine('Unidad Minera Subterránea');
    setNewProjectEvaluator('Ing. Geomecánico');
    setNewProjectInitialFolders('Nivel 2400 - Rampa Sur, Galería 104, Frente de Avance');
    setIsNewProjectModalOpen(true);
  };

  // Submit Create Project
  const handleCreateProjectSubmit = () => {
    if (!newProjectName.trim()) {
      alert('Por favor ingrese el nombre del proyecto.');
      return;
    }

    const folderNames = newProjectInitialFolders
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const created = createGeotechnicalProject({
      name: newProjectName.trim(),
      code: newProjectCode.trim(),
      mineName: newProjectMine.trim(),
      evaluator: newProjectEvaluator.trim(),
      hostRockName: selectedHostRockName,
      initialSubfolders: folderNames,
    });

    const updatedProjects = getGeotechnicalProjects();
    setProjects(updatedProjects);
    setActiveProjId(created.id);
    setActiveProjectId(created.id);
    if (created.subfolders[0]) {
      setActiveSubfId(created.subfolders[0].id);
      setActiveSubfolderId(created.subfolders[0].id);
    }
    setIsNewProjectModalOpen(false);
    showToast(`¡Proyecto "${created.name}" creado con roca de emplazamiento ${created.hostRock.rockName}!`);
  };

  // Submit Create Subfolder
  const handleCreateSubfolderSubmit = () => {
    if (!activeProject) {
      alert('Primero seleccione o cree un proyecto.');
      return;
    }
    if (!newSubfolderName.trim()) {
      alert('Por favor ingrese el nombre de la sub-carpeta.');
      return;
    }

    const subf = createSubfolderInProject(activeProject.id, newSubfolderName.trim(), newSubfolderDesc.trim());
    if (subf) {
      const updatedProjects = getGeotechnicalProjects();
      setProjects(updatedProjects);
      setActiveSubfId(subf.id);
      setIsNewSubfolderModalOpen(false);
      setNewSubfolderName('');
      setNewSubfolderDesc('');
      showToast(`Sub-carpeta "${subf.name}" creada en ${activeProject.name}.`);
    }
  };

  // Delete Subfolder
  const handleDeleteSubfolder = (subfId: string) => {
    if (!activeProject) return;
    if (confirm('¿Está seguro de que desea eliminar esta sub-carpeta?')) {
      deleteSubfolderFromProject(activeProject.id, subfId);
      const updatedProjects = getGeotechnicalProjects();
      setProjects(updatedProjects);
      showToast('Sub-carpeta eliminada.');
    }
  };

  // Move sample to another subfolder
  const handleConfirmMoveSample = () => {
    if (!sampleToMove || !targetMoveSubfolderId) return;

    let targetProj: GeotechnicalProject | undefined;
    let targetSubf: GeotechnicalSubfolder | undefined;

    for (const p of projects) {
      const foundSub = p.subfolders.find((s) => s.id === targetMoveSubfolderId);
      if (foundSub) {
        targetProj = p;
        targetSubf = foundSub;
        break;
      }
    }

    if (!targetProj || !targetSubf) {
      alert('Seleccione una sub-carpeta válida.');
      return;
    }

    const updatedEntries = entries.map((entry) => {
      if (entry.id === sampleToMove.id) {
        return {
          ...entry,
          projectId: targetProj!.id,
          projectName: targetProj!.name,
          subfolderId: targetSubf!.id,
          subfolderName: targetSubf!.name,
        };
      }
      return entry;
    });

    saveTrainingDatabase(updatedEntries);
    setEntries(updatedEntries);
    setSampleToMove(null);
    showToast(`Muestra trasladada a "${targetSubf.name}" (${targetProj.name}).`);
  };

  // Filter entries according to Project, Subfolder, Search, and Groups
  const filteredEntries = entries.filter((item) => {
    // Project filter
    if (activeProjId && item.projectId && item.projectId !== activeProjId) {
      return false;
    }
    // Subfolder filter
    if (activeSubfId && item.subfolderId && item.subfolderId !== activeSubfId) {
      return false;
    }

    const fileName = getSampleFileName(item);
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.geologicalRockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.evaluator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subfolderName && item.subfolderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'Todas' || item.rockGroup === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  // 10 first entries visual, rest in file list
  const first10Entries = filteredEntries.slice(0, 10);
  const remainingEntries = filteredEntries.slice(10);

  // Multi-selection
  const toggleSelectSample = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
    setIsSelectionMode(true);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirmDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = deleteMultipleDatabaseEntries(Array.from(selectedIds));
    setEntries(updated);
    setStats(computeLearningStats(updated));
    setSelectedIds(new Set());
    setIsDeleteSelectedModalOpen(false);
    showToast(`Se eliminaron ${count} muestras seleccionadas.`);
  };

  // USER REQUIREMENT: Empty database completely (Borrar toda la información / que esté vacío)
  const handleConfirmClearAll = () => {
    clearEntireDatabaseAndMemory();
    setEntries([]);
    setStats(computeLearningStats([]));
    setSelectedIds(new Set());
    setIsClearAllModalOpen(false);
    showToast('Base de datos vaciada por completo (0 muestras). Listo para nuevos proyectos.');
  };

  // Duplicate sample
  const handleDuplicate = (entry: TrainingDatabaseEntry) => {
    const { updated, duplicated } = duplicateDatabaseEntry(entry.id);
    if (duplicated) {
      setEntries(updated);
      setStats(computeLearningStats(updated));
      showToast(`Muestra duplicada: "${duplicated.title}".`);
    }
  };

  // Single delete
  const promptDelete = (entry: TrainingDatabaseEntry, index?: number) => {
    const fileName = getSampleFileName(entry, index);
    setSampleToDelete({ id: entry.id, title: entry.title, fileName });
  };

  const confirmDelete = () => {
    if (!sampleToDelete) return;
    const updated = deleteDatabaseEntry(sampleToDelete.id);
    setEntries(updated);
    setStats(computeLearningStats(updated));
    showToast(`Muestra "${sampleToDelete.title}" eliminada.`);
    setSampleToDelete(null);
  };

  // Export full JSON dataset
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `geoscan_dataset_${entries.length}_muestras_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Dataset JSON exportado (${entries.length} muestras).`);
  };

  // Export to Excel with Puntuaciones RMR89
  const handleExportExcel = (filteredOnly: boolean = false) => {
    let toExport = filteredOnly ? filteredEntries : entries;

    if (!toExport || toExport.length === 0) {
      alert('No hay muestras disponibles para exportar a Excel.');
      return;
    }

    const scopeName = activeSubfolder ? activeSubfolder.name : activeProject ? activeProject.name : 'Completa';
    const cleanScope = scopeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Cartilla_Puntuaciones_RMR89_${cleanScope}_${toExport.length}_muestras_${new Date().toISOString().slice(0, 10)}.xlsx`;

    exportDatabaseToExcel(toExport, fileName);
    showToast(`¡Excel descargado! Se exportaron ${toExport.length} muestras con puntuaciones numéricas RMR89.`);
  };

  // Single sample Excel export
  const handleExportSingleSampleExcel = (entry: TrainingDatabaseEntry) => {
    const dt = formatDateTime(entry.createdAt);
    const fileName = getSampleFileName(entry);
    exportDatabaseToExcel([entry], `Muestra_Puntuaciones_RMR89_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dt.dateStr}.xlsx`);
    showToast(`¡Muestra "${entry.title}" exportada a Excel!`);
  };

  /**
   * USER REQUIREMENT:
   * Process Folder Upload using Real Computer Vision (analyzeRockFaceImage)
   * Evaluates each image individually (fracture density, Jv, RQD %, spacing, JRC, weathering, Bieniawski points)
   * Files it into the Active Project and Subfolder!
   */
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const imageFiles = (Array.from(fileList) as File[]).filter((f) =>
      f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      alert('No se encontraron imágenes válidas en la carpeta seleccionada.');
      e.target.value = '';
      return;
    }

    // Ensure we have an active project
    let currentProj = activeProject;
    if (!currentProj) {
      currentProj = createGeotechnicalProject({
        name: 'Proyecto Principal de Mina',
        hostRockName: 'Granodiorita',
      });
      const projs = getGeotechnicalProjects();
      setProjects(projs);
      setActiveProjId(currentProj.id);
    }

    const currentSubf = activeSubfolder || currentProj.subfolders[0] || null;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: imageFiles.length, label: 'Iniciando visión artificial en lote...' });

    const newSamples: TrainingDatabaseEntry[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setBatchProgress({
        current: i + 1,
        total: imageFiles.length,
        label: `Analizando fracturamiento en ${file.name}...`,
      });

      try {
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const compressed = await compressRockImage(rawDataUrl, 1600, 1200, 0.85);

        // TRUE COMPUTER VISION ANALYSIS: Evaluates real pixels of this exact photo
        const visionResult = await analyzeRockFaceImage(compressed, {
          hostRockName: currentProj.hostRock.rockName,
          hostRockUcsMpa: currentProj.hostRock.typicalUcsMpa,
          hostRockGroup: currentProj.hostRock.rockGroup,
          learningBias: {
            spacingFactor: stats.spacingCorrectionFactor,
            rqdDelta: stats.rqdCorrectionDelta,
            rmrDelta: stats.rmrCorrectionDelta,
          },
          stationName: `Estación ${currentSubf?.name || 'Labor'} #${i + 1}`,
          evaluatorName: currentProj.evaluator,
        });

        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        newSamples.push({
          id: `train-vis-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString(),
          title: cleanName.length > 2 ? cleanName : `Muestra #${i + 1} - ${currentProj.hostRock.rockName}`,
          station: `Estación ${currentSubf?.name || 'Frente'} #${i + 1}`,
          evaluator: currentProj.evaluator,
          imageUrl: compressed,
          fileName: file.name,
          projectId: currentProj.id,
          projectName: currentProj.name,
          subfolderId: currentSubf?.id,
          subfolderName: currentSubf?.name,
          geologicalRockName: currentProj.hostRock.rockName,
          rockGroup: currentProj.hostRock.rockGroup,
          ucsData: {
            minMpa: currentProj.hostRock.minUcsMpa,
            typicalMpa: currentProj.hostRock.typicalUcsMpa,
            maxMpa: currentProj.hostRock.maxUcsMpa,
            confirmedUcsMpa: visionResult.effectiveUcsMpa,
            isrmGrade: currentProj.hostRock.isrmGrade,
            r1Rating: visionResult.r1_ucsRating,
            weathering: visionResult.weatheringDegree,
          },
          aiInitialObservation: {
            lithology: currentProj.hostRock.rockName,
            familiesCount: visionResult.analysisResult.families.length,
            avgSpacingCm: visionResult.meanSpacingCm,
            rqdValue: visionResult.rqdCalculated,
            rmrScore: visionResult.totalRmrScore,
            gsiValue: visionResult.analysisResult.gsi.value,
            qValue: visionResult.analysisResult.bartonQ.qValue,
            families: visionResult.analysisResult.families,
          },
          status: 'user_uploaded',
          learningEpoch: 1,
        });
      } catch (err) {
        console.error('Error procesando imagen con visión:', file.name, err);
      }
    }

    const currentAll = getTrainingDatabase();
    const merged = [...newSamples, ...currentAll];
    saveTrainingDatabase(merged);
    setEntries(merged);
    setStats(computeLearningStats(merged));
    setIsBatchProcessing(false);
    showToast(`¡Carpeta procesada! ${newSamples.length} imágenes analizadas individualmente con visión artificial.`);
    e.target.value = '';
  };

  /**
   * Batch Files Upload using Real Computer Vision (analyzeRockFaceImage)
   */
  const handleBatchFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let currentProj = activeProject;
    if (!currentProj) {
      currentProj = createGeotechnicalProject({
        name: 'Proyecto Principal de Mina',
        hostRockName: 'Granodiorita',
      });
      const projs = getGeotechnicalProjects();
      setProjects(projs);
      setActiveProjId(currentProj.id);
    }

    const currentSubf = activeSubfolder || currentProj.subfolders[0] || null;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: files.length, label: 'Cargando lote de archivos...' });

    const newSamples: TrainingDatabaseEntry[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchProgress({
        current: i + 1,
        total: files.length,
        label: `Analizando fracturamiento en ${file.name}...`,
      });

      try {
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const compressed = await compressRockImage(rawDataUrl, 1600, 1200, 0.85);

        // Individual Computer Vision Analysis
        const visionResult = await analyzeRockFaceImage(compressed, {
          hostRockName: currentProj.hostRock.rockName,
          hostRockUcsMpa: currentProj.hostRock.typicalUcsMpa,
          hostRockGroup: currentProj.hostRock.rockGroup,
          learningBias: {
            spacingFactor: stats.spacingCorrectionFactor,
            rqdDelta: stats.rqdCorrectionDelta,
            rmrDelta: stats.rmrCorrectionDelta,
          },
          stationName: `Estación ${currentSubf?.name || 'Labor'} #${i + 1}`,
          evaluatorName: currentProj.evaluator,
        });

        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        newSamples.push({
          id: `train-vis-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString(),
          title: cleanName.length > 2 ? cleanName : `Muestra #${i + 1} - ${currentProj.hostRock.rockName}`,
          station: `Estación ${currentSubf?.name || 'Frente'} #${i + 1}`,
          evaluator: currentProj.evaluator,
          imageUrl: compressed,
          fileName: file.name,
          projectId: currentProj.id,
          projectName: currentProj.name,
          subfolderId: currentSubf?.id,
          subfolderName: currentSubf?.name,
          geologicalRockName: currentProj.hostRock.rockName,
          rockGroup: currentProj.hostRock.rockGroup,
          ucsData: {
            minMpa: currentProj.hostRock.minUcsMpa,
            typicalMpa: currentProj.hostRock.typicalUcsMpa,
            maxMpa: currentProj.hostRock.maxUcsMpa,
            confirmedUcsMpa: visionResult.effectiveUcsMpa,
            isrmGrade: currentProj.hostRock.isrmGrade,
            r1Rating: visionResult.r1_ucsRating,
            weathering: visionResult.weatheringDegree,
          },
          aiInitialObservation: {
            lithology: currentProj.hostRock.rockName,
            familiesCount: visionResult.analysisResult.families.length,
            avgSpacingCm: visionResult.meanSpacingCm,
            rqdValue: visionResult.rqdCalculated,
            rmrScore: visionResult.totalRmrScore,
            gsiValue: visionResult.analysisResult.gsi.value,
            qValue: visionResult.analysisResult.bartonQ.qValue,
            families: visionResult.analysisResult.families,
          },
          status: 'user_uploaded',
          learningEpoch: 1,
        });
      } catch (err) {
        console.error('Error procesando lote de imágenes:', file.name, err);
      }
    }

    const currentAll = getTrainingDatabase();
    const merged = [...newSamples, ...currentAll];
    saveTrainingDatabase(merged);
    setEntries(merged);
    setStats(computeLearningStats(merged));
    setIsBatchProcessing(false);
    showToast(`¡Lote procesado! Se caracterizaron ${newSamples.length} imágenes individualmente.`);
    e.target.value = '';
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const currentAll = getTrainingDatabase();
          const merged = [...parsed, ...currentAll];
          saveTrainingDatabase(merged);
          setEntries(merged);
          setStats(computeLearningStats(merged));
          showToast(`¡Importadas ${parsed.length} muestras! Total: ${merged.length}.`);
        } else {
          alert('El archivo JSON no contiene un array válido de muestras.');
        }
      } catch (err: any) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter host rocks in project modal
  const filteredHostRocks = GEOLOGICAL_ROCK_CATALOG.filter((r) =>
    r.name.toLowerCase().includes(hostRockSearch.toLowerCase()) ||
    r.group.toLowerCase().includes(hostRockSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fadeIn pb-16 font-sans text-zinc-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black border border-white/80 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-mono text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL: Fullscreen Image Zoom */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="max-w-5xl max-h-[90vh] relative border border-zinc-700 rounded-lg overflow-hidden">
            <img src={selectedPreviewImage} alt="Frente Zoom" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Move Sample to Another Subfolder */}
      {sampleToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                <MoveRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Mover Muestra Geomecánica</h3>
                <p className="text-xs text-zinc-400 font-mono">{sampleToMove.title}</p>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <label className="text-zinc-400 block uppercase font-bold text-[10px]">
                Seleccione la Sub-Carpeta de Destino:
              </label>
              <select
                value={targetMoveSubfolderId}
                onChange={(e) => setTargetMoveSubfolderId(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
              >
                <option value="">-- Seleccionar Sub-Carpeta --</option>
                {projects.map((proj) => (
                  <optgroup key={proj.id} label={`Proyecto: ${proj.name}`}>
                    {proj.subfolders.map((subf) => (
                      <option key={subf.id} value={subf.id}>
                        {proj.name} → {subf.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSampleToMove(null)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveSample}
                className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 cursor-pointer"
              >
                Confirmar Traslado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Single Delete Confirmation */}
      {sampleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Confirmar Eliminación</h3>
                <p className="text-xs text-zinc-400 font-mono">Esta acción eliminará la muestra</p>
              </div>
            </div>

            <div className="p-3 bg-black rounded border border-zinc-800 space-y-1 font-mono text-xs">
              <div className="text-zinc-400">
                Muestra: <span className="text-white font-bold">{sampleToDelete.title}</span>
              </div>
              <div className="text-zinc-400">
                Archivo: <span className="text-zinc-300">{sampleToDelete.fileName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSampleToDelete(null)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete SELECTED Samples */}
      {isDeleteSelectedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Borrar Seleccionadas</h3>
                <p className="text-xs text-zinc-400 font-mono">{selectedIds.size} muestras seleccionadas</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              ¿Desea eliminar las <strong className="text-white">{selectedIds.size}</strong> muestras seleccionadas de la base de datos?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 cursor-pointer"
              >
                Borrar {selectedIds.size} Muestras
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clear ALL Samples (Borrar Todo / Empezar Vacío) */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border-2 border-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <AlertOctagon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider">Vaciar Base de Datos</h3>
                <p className="text-xs text-zinc-400 font-mono">Elimina todas las muestras para empezar desde cero</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Esta acción eliminará todas las <strong className="text-white">{entries.length}</strong> muestras actualmente registradas tanto en disco como en IndexedDB. La base de datos quedará completamente vacía (0 muestras) para crear nuevos proyectos limpios.
            </p>

            <div className="space-y-2 pt-2 font-mono text-xs">
              <button
                onClick={handleConfirmClearAll}
                className="w-full px-4 py-2.5 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Sí, Vaciar Todo (0 Muestras)
              </button>
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PROJECT (USER REQUIREMENT: Asks for Host Rock first to estimate UCS and RQD!) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white text-black rounded font-black">
                  <FolderPlus className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                    Crear Nuevo Proyecto Geomecánico
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {newProjectStep === 1
                      ? 'Paso 1: Seleccione la Roca de Emplazamiento para estimar Resistencia (UCS) y RQD Base'
                      : 'Paso 2: Defina los datos de la labor y sub-carpetas del proyecto'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => setNewProjectStep(1)}
                className={`py-2 px-3 rounded border text-left flex items-center justify-between ${
                  newProjectStep === 1
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <span>1. Roca de Emplazamiento & Parámetros</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200">Requerido</span>
              </button>
              <button
                onClick={() => setNewProjectStep(2)}
                className={`py-2 px-3 rounded border text-left flex items-center justify-between ${
                  newProjectStep === 2
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <span>2. Identificación & Sub-Carpetas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* STEP 1: ROCA DE EMPLAZAMIENTO & ESTIMACIONES GEOMECÁNICAS */}
            {newProjectStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="text-xs font-mono text-zinc-300">
                    Seleccione la litología predominante donde se desarrollará el proyecto:
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar roca (ej: Granodiorita, Caliza)..."
                      value={hostRockSearch}
                      onChange={(e) => setHostRockSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-black border border-zinc-700 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>

                {/* Grid of selectable rocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-zinc-800 rounded bg-black">
                  {filteredHostRocks.map((r) => {
                    const isSelected = selectedHostRockName === r.name;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedHostRockName(r.name)}
                        className={`p-2.5 rounded text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 border-white text-white shadow-sm'
                            : 'bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">{r.name}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{r.group}</div>
                        <div className="text-[10px] font-mono mt-1 text-zinc-300">
                          UCS: {r.ucsTypMpa} MPa
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* DYNAMIC ESTIMATION CARD (USER REQUIREMENT) */}
                <div className="p-4 bg-black rounded-lg border-2 border-zinc-700 space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-white tracking-wider">
                        Estimación Geomecánica Base: {currentHostRockMeta.rockName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-900 text-zinc-200 border border-zinc-700 rounded">
                        {currentHostRockMeta.rockGroup}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">ISRM / Hoek-Brown</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold">
                        Resistencia Uniaxial (UCS):
                      </span>
                      <span className="text-base font-black text-white block mt-0.5">
                        {currentHostRockMeta.typicalUcsMpa} MPa
                      </span>
                      <span className="text-[9px] text-zinc-400 block">
                        Rango: {currentHostRockMeta.minUcsMpa} - {currentHostRockMeta.maxUcsMpa} MPa
                      </span>
                    </div>

                    <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold">
                        RQD Base Estimado:
                      </span>
                      <span className="text-base font-black text-white block mt-0.5">
                        {currentHostRockMeta.estimatedRqdBaseline}%
                      </span>
                      <span className="text-[9px] text-zinc-400 block">
                        Patrón estructural típico
                      </span>
                    </div>

                    <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold">
                        Clasificación ISRM:
                      </span>
                      <span className="text-xs font-bold text-white block mt-1 truncate" title={currentHostRockMeta.isrmGrade}>
                        {currentHostRockMeta.isrmGrade.split('(')[0]}
                      </span>
                      <span className="text-[9px] text-zinc-400 block">
                        Grado de dureza
                      </span>
                    </div>

                    <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold">
                        Constante mi Hoek-Brown:
                      </span>
                      <span className="text-base font-black text-white block mt-0.5">
                        mi = {currentHostRockMeta.hoekMi}
                      </span>
                      <span className="text-[9px] text-zinc-400 block">
                        Densidad: {currentHostRockMeta.densityGcm3} g/cm³
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Criterio de campo:</strong> {currentHostRockMeta.fieldHammerTest}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setNewProjectStep(2)}
                    className="px-5 py-2.5 bg-white text-black font-bold uppercase text-xs font-mono rounded hover:bg-zinc-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar al Paso 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PROJECT METADATA & INITIAL SUBFOLDERS */}
            {newProjectStep === 2 && (
              <div className="space-y-4 animate-fadeIn font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                      Nombre del Proyecto Geomecánico:
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Mina Subterránea San Rafael - Nivel 2400"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                      Código / Identificador:
                    </label>
                    <input
                      type="text"
                      value={newProjectCode}
                      onChange={(e) => setNewProjectCode(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                      Unidad Minera / Concesión:
                    </label>
                    <input
                      type="text"
                      value={newProjectMine}
                      onChange={(e) => setNewProjectMine(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                      Ingeniero Evaluador Responsable:
                    </label>
                    <input
                      type="text"
                      value={newProjectEvaluator}
                      onChange={(e) => setNewProjectEvaluator(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                    Sub-Carpetas Iniciales (separadas por coma):
                  </label>
                  <input
                    type="text"
                    value={newProjectInitialFolders}
                    onChange={(e) => setNewProjectInitialFolders(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Puede crear más sub-carpetas en cualquier momento para organizar labores, frentes o niveles.
                  </p>
                </div>

                {/* Host rock recap */}
                <div className="p-3 bg-black rounded border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Roca de Emplazamiento:</span>
                    <span className="text-white font-bold">{selectedHostRockName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">UCS Estimado / RQD Base:</span>
                    <span className="text-white font-bold">{currentHostRockMeta.typicalUcsMpa} MPa • {currentHostRockMeta.estimatedRqdBaseline}% RQD</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProjectStep(1)}
                    className="px-2.5 py-1 text-[10px] border border-zinc-700 text-zinc-300 rounded hover:text-white"
                  >
                    Cambiar Roca
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setNewProjectStep(1)}
                    className="px-3 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 cursor-pointer"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProjectSubmit}
                    className="px-5 py-2.5 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200 cursor-pointer shadow"
                  >
                    Crear Proyecto Geomecánico
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW SUB-FOLDER */}
      {isNewSubfolderModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Nueva Sub-Carpeta
                </h3>
              </div>
              <button onClick={() => setIsNewSubfolderModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Proyecto: <strong className="text-white">{activeProject.name}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                  Nombre de la Sub-Carpeta / Labor:
                </label>
                <input
                  type="text"
                  placeholder="ej: Nivel 2600 - Tajo 03, Galería Sur..."
                  value={newSubfolderName}
                  onChange={(e) => setNewSubfolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block uppercase font-bold text-[10px] mb-1">
                  Descripción / Ubicación (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="ej: Frente este en avance con perforación jumbo"
                  value={newSubfolderDesc}
                  onChange={(e) => setNewSubfolderDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsNewSubfolderModalOpen(false)}
                className="px-3 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateSubfolderSubmit}
                className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 cursor-pointer"
              >
                Crear Sub-Carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOP BAR: PROJECT & SUB-FOLDER MANAGEMENT (USER REQUIREMENT)
      ========================================================================= */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          {/* Active Project Dropdown & Information */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-zinc-900 text-white border border-zinc-700">
                <Folder className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                PROYECTO:
              </span>
            </div>

            {projects.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={activeProjId || ''}
                  onChange={(e) => handleSelectProject(e.target.value || null)}
                  className="px-3 py-1.5 bg-black border border-zinc-700 rounded text-xs font-mono font-bold text-white focus:outline-none focus:border-white"
                >
                  <option value="">-- Todos los Proyectos --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} • {p.name}
                    </option>
                  ))}
                </select>

                {activeProject && (
                  <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 bg-zinc-950 rounded border border-zinc-800 text-zinc-300">
                    <span className="text-zinc-500">Roca Emplazamiento:</span>
                    <strong className="text-white">{activeProject.hostRock.rockName}</strong>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">UCS: {activeProject.hostRock.typicalUcsMpa} MPa</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">RQD Base: {activeProject.hostRock.estimatedRqdBaseline}%</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs font-mono text-zinc-500 italic">
                No hay proyectos creados aún.
              </span>
            )}

            <button
              onClick={openNewProjectModal}
              className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[11px] font-mono rounded hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden Inputs */}
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
            <input
              type="file"
              ref={batchFileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleBatchFilesUpload}
            />
            <input
              type="file"
              ref={importJsonInputRef}
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />

            {/* Folder Upload Button (USER REQUIREMENT: subir archivos desde una carpeta) */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-zinc-700 cursor-pointer shadow-sm"
              title="Subir todas las fotografías directamente desde una carpeta del equipo"
            >
              <FolderPlus className="w-3.5 h-3.5 text-white" />
              <span>Subir Carpeta</span>
            </button>

            {/* Batch Files Upload */}
            <button
              onClick={() => batchFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              title="Seleccionar múltiples fotos sueltas"
            >
              <FolderUp className="w-3.5 h-3.5 text-white" />
              <span>Lote Fotos</span>
            </button>

            {/* Export Excel (PUNTUACIONES NUMÉRICAS RMR89) */}
            <button
              onClick={() => handleExportExcel(filteredEntries.length < entries.length)}
              className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer transition-colors"
              title="Descargar Excel con puntuaciones de cartilla Bieniawski 1989"
            >
              <FileSpreadsheet className="w-4 h-4 text-black" />
              <span>Descargar Excel</span>
            </button>

            {/* Vaciar Base de Datos (USER REQUIREMENT: que esté vacío) */}
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-xs font-mono border border-zinc-800 cursor-pointer"
              title="Borrar todas las muestras para dejar la base de datos limpia"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vaciar Todo</span>
            </button>
          </div>
        </div>

        {/* SUB-FOLDERS TABS (Inside Active Project) */}
        {activeProject ? (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
            <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1 mr-1">
              <FolderOpen className="w-3 h-3 text-zinc-400" /> Sub-Carpetas:
            </span>

            <button
              onClick={() => handleSelectSubfolder(null)}
              className={`px-3 py-1 rounded border text-[11px] font-bold uppercase transition-all ${
                activeSubfId === null
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Todas las Sub-Carpetas ({entries.filter((e) => !activeProjId || e.projectId === activeProjId).length})
            </button>

            {activeProject.subfolders.map((sf) => {
              const count = entries.filter((e) => e.subfolderId === sf.id).length;
              const isActive = activeSubfId === sf.id;
              return (
                <div key={sf.id} className="flex items-center">
                  <button
                    onClick={() => handleSelectSubfolder(sf.id)}
                    className={`px-3 py-1 rounded-l border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span>{sf.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      isActive ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubfolder(sf.id)}
                    className="p-1 bg-black border border-l-0 border-zinc-800 text-zinc-600 hover:text-white rounded-r"
                    title="Eliminar esta sub-carpeta"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setIsNewSubfolderModalOpen(true)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nueva Sub-Carpeta</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500 py-1">
            Mostrando todas las muestras de la base de datos sin filtro de proyecto.
          </div>
        )}
      </div>

      {/* BATCH PROCESSING PROGRESS BAR */}
      {isBatchProcessing && (
        <div className="p-4 bg-black border border-white rounded-xl shadow-2xl space-y-2 font-mono animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-white animate-pulse" />
              {batchProgress.label || 'Procesando imágenes fotográficas con visión convolucional...'}
            </span>
            <span className="text-zinc-300 font-bold">
              {batchProgress.current} / {batchProgress.total} ({Math.round((batchProgress.current / Math.max(1, batchProgress.total)) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#09090b] p-3 rounded-lg border border-zinc-800 font-mono text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por estación, archivo, litología..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-zinc-700 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Multi-Selection Toggle */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds(new Set());
            }}
            className={`px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer ${
              isSelectionMode
                ? 'bg-white text-black border-white'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {isSelectionMode ? `Selección (${selectedIds.size})` : 'Modo Seleccionar'}
          </button>

          {isSelectionMode && (
            <>
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 bg-zinc-900 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs cursor-pointer"
              >
                Todos ({filteredEntries.length})
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 bg-zinc-900 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs cursor-pointer"
              >
                Ninguno
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setIsDeleteSelectedModalOpen(true)}
                  className="px-3 py-1.5 bg-white text-black font-bold uppercase rounded text-xs hover:bg-zinc-200 cursor-pointer"
                >
                  Borrar ({selectedIds.size})
                </button>
              )}
            </>
          )}

          <div className="flex items-center gap-1 border border-zinc-800 rounded p-0.5 bg-black">
            <button
              onClick={() => setViewMode('hybrid')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                viewMode === 'hybrid' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="10 primeras fotos + Lista indexada"
            >
              Híbrido (10 Visual)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                viewMode === 'table' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista en tabla técnica"
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('all_grid')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                viewMode === 'all_grid' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Todas las imágenes en mosaico"
            >
              Mosaico
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN SAMPLES DISPLAY: EMPTY STATE OR SAMPLES LIST
      ========================================================================= */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-[#09090b] border-2 border-dashed border-zinc-800 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-white">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
              {entries.length === 0 ? 'Base de Datos Vacía (0 Muestras)' : 'No hay muestras con el filtro seleccionado'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-mono">
              {projects.length === 0
                ? 'Comience creando su primer Proyecto Geomecánico seleccionando la roca de emplazamiento para estimar su resistencia UCS y RQD base.'
                : 'Sube una carpeta de fotografías o archivos para caracterizar cada frente rocoso con visión artificial y generar la cartilla RMR89.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            {projects.length === 0 ? (
              <button
                onClick={openNewProjectModal}
                className="px-4 py-2.5 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Proyecto Geomecánico</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer shadow"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Subir Carpeta de Fotografías</span>
                </button>
                <button
                  onClick={() => batchFileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-900 text-white font-bold uppercase rounded hover:bg-zinc-800 border border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Subir Lote de Fotos</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* USER REQUIREMENT: First 10 samples visual in cards */}
          {(viewMode === 'hybrid' || viewMode === 'all_grid') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800 font-mono text-xs">
                <span className="font-bold uppercase text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  {viewMode === 'hybrid'
                    ? `Primeras 10 Muestras (Visualización Detallada - ${first10Entries.length})`
                    : `Todas las Muestras en Mosaico (${filteredEntries.length})`}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Valores evaluados individualmente por visión artificial
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {(viewMode === 'all_grid' ? filteredEntries : first10Entries).map((entry, idx) => {
                  const rmr = getRMRBreakdownFromEntry(entry);
                  const fileName = getSampleFileName(entry, idx);
                  const isSelected = selectedIds.has(entry.id);

                  return (
                    <div
                      key={entry.id}
                      className={`bg-[#09090b] rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                        isSelected ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Image header */}
                      <div className="relative aspect-video bg-black overflow-hidden group">
                        <img
                          src={entry.imageUrl}
                          alt={entry.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => setSelectedPreviewImage(entry.imageUrl)}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-zinc-800 text-white rounded border border-zinc-700"
                          title="Ampliar imagen"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-mono border border-zinc-700">
                          RMR: {rmr.totalScore} pts ({rmr.classShort})
                        </div>

                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div
                            onClick={() => toggleSelectSample(entry.id)}
                            className="absolute top-2 left-2 p-1 bg-black/80 rounded border border-zinc-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-white" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content body */}
                      <div className="p-3 space-y-2 text-xs font-mono flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 truncate">
                            <span className="truncate">{entry.station}</span>
                            <span className="text-zinc-500 font-bold">#{idx + 1}</span>
                          </div>
                          <div className="font-bold text-white text-xs truncate mt-0.5" title={entry.title}>
                            {entry.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5" title={fileName}>
                            📄 {fileName}
                          </div>
                        </div>

                        {/* Subfolder & Project tags */}
                        {entry.subfolderName && (
                          <div className="text-[10px] text-zinc-400 px-2 py-1 bg-zinc-950 rounded border border-zinc-800 truncate">
                            📁 {entry.projectName || 'Proyecto'} → {entry.subfolderName}
                          </div>
                        )}

                        {/* Scores grid */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] bg-black p-2 rounded border border-zinc-900 text-center">
                          <div>
                            <span className="text-zinc-500 block">R1 UCS</span>
                            <span className="font-bold text-white">{rmr.r1_ucsRating} pts</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">R2 RQD</span>
                            <span className="font-bold text-white">{rmr.r2_rqdRating} pts</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">R3 Espac.</span>
                            <span className="font-bold text-white">{rmr.r3_spacingRating} pts</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-zinc-800 text-[10px]">
                          <button
                            onClick={() => onLoadSampleToSimulation(entry)}
                            className="py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 font-bold"
                            title="Cargar al visor interactivo"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => setSampleToMove(entry)}
                            className="py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700"
                            title="Mover a otra sub-carpeta"
                          >
                            Mover
                          </button>
                          <button
                            onClick={() => handleExportSingleSampleExcel(entry)}
                            className="py-1 bg-white text-black hover:bg-zinc-200 rounded font-bold"
                            title="Exportar cartilla en Excel"
                          >
                            Excel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* USER REQUIREMENT: Remaining samples in file list */}
          {(viewMode === 'hybrid' && remainingEntries.length > 0) && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800 font-mono text-xs">
                <span className="font-bold uppercase text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  Muestras en Lista de Archivos (Muestras #11 en adelante - {remainingEntries.length} archivos)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Nombre de archivo según la imagen geomecánica
                </span>
              </div>

              <div className="bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                    <tr>
                      {isSelectionMode && <th className="p-3 w-10 text-center">Sel</th>}
                      <th className="p-3 w-12 text-center">N°</th>
                      <th className="p-3">Nombre de Archivo / Muestra</th>
                      <th className="p-3">Sub-Carpeta / Labor</th>
                      <th className="p-3">Litología</th>
                      <th className="p-3 text-center">R1 (UCS)</th>
                      <th className="p-3 text-center">R2 (RQD)</th>
                      <th className="p-3 text-center">R3 (Espac.)</th>
                      <th className="p-3 text-center font-bold text-white">RMR Total</th>
                      <th className="p-3 text-center">Clase</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-[11px]">
                    {remainingEntries.map((entry, idx) => {
                      const rmr = getRMRBreakdownFromEntry(entry);
                      const fileName = getSampleFileName(entry, 10 + idx);
                      const isSelected = selectedIds.has(entry.id);

                      return (
                        <tr
                          key={entry.id}
                          className={`hover:bg-zinc-950 transition-colors ${
                            isSelected ? 'bg-zinc-900/60' : ''
                          }`}
                        >
                          {isSelectionMode && (
                            <td className="p-3 text-center" onClick={() => toggleSelectSample(entry.id)}>
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-white inline" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-500 inline" />
                              )}
                            </td>
                          )}
                          <td className="p-3 text-center font-bold text-zinc-500">{11 + idx}</td>
                          <td className="p-3 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400">📄</span>
                              <span>{fileName}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-normal block pl-5">
                              {entry.title} ({entry.station})
                            </span>
                          </td>
                          <td className="p-3 text-zinc-300">
                            {entry.subfolderName ? (
                              <span>📁 {entry.subfolderName}</span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                          <td className="p-3 text-zinc-300">{entry.geologicalRockName}</td>
                          <td className="p-3 text-center text-zinc-300">{rmr.r1_ucsRating} pts</td>
                          <td className="p-3 text-center text-zinc-300">{rmr.r2_rqdRating} pts</td>
                          <td className="p-3 text-center text-zinc-300">{rmr.r3_spacingRating} pts</td>
                          <td className="p-3 text-center font-black text-white">{rmr.totalScore} pts</td>
                          <td className="p-3 text-center font-bold text-zinc-300">{rmr.classShort}</td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => onLoadSampleToSimulation(entry)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 text-[10px]"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => setSampleToMove(entry)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700 text-[10px]"
                            >
                              Mover
                            </button>
                            <button
                              onClick={() => handleExportSingleSampleExcel(entry)}
                              className="px-2 py-1 bg-white text-black hover:bg-zinc-200 rounded font-bold text-[10px]"
                            >
                              Excel
                            </button>
                            <button
                              onClick={() => promptDelete(entry, 10 + idx)}
                              className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded border border-zinc-800 text-[10px]"
                            >
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE VIEW (when user switches to table mode) */}
          {viewMode === 'table' && (
            <div className="bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-black text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                  <tr>
                    {isSelectionMode && <th className="p-3 w-10 text-center">Sel</th>}
                    <th className="p-3 w-12 text-center">N°</th>
                    <th className="p-3">Nombre de Archivo / Muestra</th>
                    <th className="p-3">Proyecto & Sub-Carpeta</th>
                    <th className="p-3">Litología</th>
                    <th className="p-3 text-center">R1 (UCS)</th>
                    <th className="p-3 text-center">R2 (RQD)</th>
                    <th className="p-3 text-center">R3 (Espac.)</th>
                    <th className="p-3 text-center">R4 (Juntas)</th>
                    <th className="p-3 text-center">R5 (Agua)</th>
                    <th className="p-3 text-center">R6 (Orient.)</th>
                    <th className="p-3 text-center font-bold text-white">RMR Total</th>
                    <th className="p-3 text-center">Clase</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-[11px]">
                  {filteredEntries.map((entry, idx) => {
                    const rmr = getRMRBreakdownFromEntry(entry);
                    const fileName = getSampleFileName(entry, idx);
                    const isSelected = selectedIds.has(entry.id);

                    return (
                      <tr key={entry.id} className={`hover:bg-zinc-950 ${isSelected ? 'bg-zinc-900/60' : ''}`}>
                        {isSelectionMode && (
                          <td className="p-3 text-center" onClick={() => toggleSelectSample(entry.id)}>
                            {isSelected ? <CheckSquare className="w-4 h-4 text-white inline" /> : <Square className="w-4 h-4 text-zinc-500 inline" />}
                          </td>
                        )}
                        <td className="p-3 text-center font-bold text-zinc-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-white">
                          <div>{fileName}</div>
                          <span className="text-[10px] text-zinc-400 font-normal">{entry.title}</span>
                        </td>
                        <td className="p-3 text-zinc-300">
                          {entry.subfolderName ? `${entry.projectName || 'P'} → ${entry.subfolderName}` : '-'}
                        </td>
                        <td className="p-3 text-zinc-300">{entry.geologicalRockName}</td>
                        <td className="p-3 text-center">{rmr.r1_ucsRating} pts</td>
                        <td className="p-3 text-center">{rmr.r2_rqdRating} pts</td>
                        <td className="p-3 text-center">{rmr.r3_spacingRating} pts</td>
                        <td className="p-3 text-center">{rmr.r4_conditionRating} pts</td>
                        <td className="p-3 text-center">{rmr.r5_waterRating} pts</td>
                        <td className="p-3 text-center">{rmr.r6_orientationAdjustment} pts</td>
                        <td className="p-3 text-center font-black text-white">{rmr.totalScore} pts</td>
                        <td className="p-3 text-center font-bold text-zinc-300">{rmr.classShort}</td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => onLoadSampleToSimulation(entry)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 text-[10px]"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleExportSingleSampleExcel(entry)}
                            className="px-2 py-1 bg-white text-black hover:bg-zinc-200 rounded font-bold text-[10px]"
                          >
                            Excel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
