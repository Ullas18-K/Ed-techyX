import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { opticsPenmanMessages } from './penmanMessages';
import { useOpticsStore } from './opticsStore';
import { useLearningStore } from '@/lib/learningStore';
import { OpticsRenderer } from './scene';
import { OpticsEngine } from './opticsEngine';
import { InteractionHandler } from './interactions';
import { DataLogger } from './DataLogger';
import { Lens, Mirror } from './types';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { UnifiedSimulationLayout } from '../simulation/UnifiedSimulationLayout';
import { TaskItem } from '../simulation/TaskSidebar';
import { Translate } from '@/components/Translate';

import {
  Plus,
  Trash2,
  Settings2,
  Maximize2,
  ChevronDown,
  Circle,
  Activity,
  Database,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

export const GeometricOptics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OpticsRenderer | null>(null);
  const interactionHandlerRef = useRef<InteractionHandler | null>(null);
  const animationFrameRef = useRef<number>();

  const {
    object,
    elements,
    rays,
    image,
    showRays,
    showFocalPoints,
    showVirtualImage,
    showLabels,
    showNormal,
    showRayExtensions,
    showMeasurements,
    mode,
    activeTaskId,
    completedTasks,
    setObjectPosition,
    setObjectHeight,
    addElement,
    removeElement,
    updateElement,
    setRays,
    setImage,
    toggleRays,
    toggleFocalPoints,
    toggleVirtualImage,
    toggleLabels,
    toggleNormal,
    toggleRayExtensions,
    toggleMeasurements,
    setMode,
    reset,
    setActiveTask,
    completeTask,
    getTasks,
    getActiveTask,
  } = useOpticsStore();

  const [objectDistance, setObjectDistance] = useState(200);
  const [focalLength, setFocalLength] = useState(100);
  const [diameter, setDiameter] = useState(200);
  const [refractiveIndex, setRefractiveIndex] = useState(1.5);
  const [radiusOfCurvature, setRadiusOfCurvature] = useState(200);
  const [isDataExpanded, setIsDataExpanded] = useState(false);

  const rawTasks = getTasks();
  const activeTask = getActiveTask();
  const navigate = useNavigate();

  // Transform tasks to Unified Layout format with Locking Logic
  const tasks: TaskItem[] = useMemo(() => rawTasks.map((t, index) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    instructions: t.instructions,
    hint: t.hint,
    completed: completedTasks.includes(t.id),
    // Lock if previous task is not complete AND this is not the first task
    locked: index > 0 && !completedTasks.includes(rawTasks[index - 1].id)
  })), [rawTasks, completedTasks]);

  // Handle Skip Task
  const handleSkip = (taskId: string) => {
    // 1. Mark current task as complete
    completeTask(taskId);

    // 2. Immediately calculate and set next task using INDEX to avoid async state issues
    // This is more robust than filtering by 'completedTasks' which might be stale in this closure
    const currentIndex = rawTasks.findIndex(t => t.id === taskId);
    if (currentIndex !== -1 && currentIndex < rawTasks.length - 1) {
      const nextTask = rawTasks[currentIndex + 1];
      setActiveTask(nextTask.id);
    } // else: activeTaskId remains null (handled by auto-advance or end of simulation)

    toast.info("Task Skipped", {
      description: "Moving to the next challenge."
    });
  };

  // Initialize canvas and renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    rendererRef.current = new OpticsRenderer(canvas);

    interactionHandlerRef.current = new InteractionHandler(
      canvas,
      (position) => setObjectPosition(position),
      (id, position) => updateElement(id, { position })
    );

    return () => {
      interactionHandlerRef.current?.cleanup();
    };
  }, []);

  // Setup mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactionHandlerRef.current) return;

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      interactionHandlerRef.current?.startDrag(pos, object, elements);
    };

    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [object, elements]);

  // Physics update and rendering loop
  useEffect(() => {
    const updatePhysics = () => {
      if (elements.length === 0) {
        setRays([]);
        setImage(null);
        return;
      }

      const element = elements[0];
      let calculatedRays: any[] = [];

      if ('refractiveIndex' in element) {
        const rayResults = OpticsEngine.traceLensPrincipalRays(object, element);
        rayResults.forEach(result => {
          calculatedRays.push(...result.rays);
        });
      } else {
        const rayResults = OpticsEngine.traceMirrorRays(object, element);
        rayResults.forEach(result => {
          calculatedRays.push(...result.rays);
        });
      }

      setRays(calculatedRays);

      const calculatedImage = OpticsEngine.calculateImage(object, element);
      setImage(calculatedImage);
    };

    // Task validation - check if active task conditions are met
    const checkTaskCompletion = () => {
      if (activeTaskId && !completedTasks.includes(activeTaskId)) {
        const activeTaskData = rawTasks.find(t => t.id === activeTaskId);
        if (activeTaskData && activeTaskData.validationFn) {
          const currentState = {
            object,
            elements,
            rays,
            image,
            showRays,
            showFocalPoints,
            showVirtualImage,
            showLabels,
            showNormal,
            showRayExtensions,
            showMeasurements,
            mode,
            angleOfIncidence: 0,
            showFormula: false,
            activeTaskId,
            completedTasks
          };

          if (activeTaskData.validationFn(currentState)) {
            completeTask(activeTaskId);
            toast.success(`Task Complete: ${activeTaskData.title}`, {
              description: "Great job! Moving to next challenge.",
              duration: 3000
            });
          }
        }
      }
    };

    const render = () => {
      if (!rendererRef.current) return;

      rendererRef.current.render(object, elements, rays, image, {
        showRays,
        showFocalPoints,
        showVirtualImage,
        showLabels,
        showMeasurements,
        highlightObject: interactionHandlerRef.current?.getDragState().isDragging,
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    updatePhysics();
    checkTaskCompletion();
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [object, elements, showRays, showFocalPoints, showVirtualImage, showLabels, showMeasurements]);

  // Auto-advance to next task when current one is completed
  useEffect(() => {
    if (activeTaskId === null) {
      // Find the first task that is NOT in the completed list
      const nextTask = rawTasks.find(t => !completedTasks.includes(t.id));
      if (nextTask) {
        setActiveTask(nextTask.id);
      }
    }
  }, [activeTaskId, completedTasks, rawTasks, setActiveTask]);

  const handleAddLens = (type: 'convex' | 'concave') => {
    const lens: Lens = {
      id: `lens-${Date.now()}`,
      type,
      position: { x: 600, y: 300 },
      focalLength: type === 'convex' ? focalLength : -focalLength,
      diameter,
      refractiveIndex,
      radiusOfCurvature,
    };
    addElement(lens);
    toast.success(`Added ${type} lens`);
  };

  const handleAddMirror = (type: 'plane' | 'concave' | 'convex') => {
    const mirror: Mirror = {
      id: `mirror-${Date.now()}`,
      type,
      position: { x: 600, y: 300 },
      focalLength: type === 'plane' ? 0 : radiusOfCurvature / 2,
      diameter,
      radiusOfCurvature,
    };
    addElement(mirror);
    toast.success(`Added ${type} mirror`);
  };

  const handleObjectDistanceChange = (value: number[]) => {
    const newDistance = value[0];
    setObjectDistance(newDistance);
    const elementX = elements.length > 0 ? elements[0].position.x : 600;
    setObjectPosition({ x: elementX - newDistance, y: object.position.y });
  };

  // Define the custom controls for Geometric Optics
  // SPLIT CONTROLS into corners for cleaner "Pure Lab" feel
  const opticsControls = (
    <>
      {/* TOP LEFT: Mode Selection & Add/Remove Actions */}
      <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-3">

        {/* Mode Switcher */}
        <div className="bg-white/90 backdrop-blur shadow-md p-1 rounded-lg border border-gray-200 flex gap-1 w-fit">
          <button
            onClick={() => setMode('lens')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'lens'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}
          >
            <Circle className="w-3 h-3 fill-current" />
            <Translate>LENS</Translate>
          </button>
          <button
            onClick={() => setMode('mirror')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'mirror'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}
          >
            <Circle className="w-3 h-3 fill-current" />
            <Translate>MIRROR</Translate>
          </button>
        </div>

        {/* Add Actions Card */}
        <Card className="w-[180px] bg-white/90 backdrop-blur shadow-xl border-gray-200">
          <CardHeader className="p-3 pb-2 border-b border-gray-100">
            <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Translate>Tools</Translate></CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {mode === 'lens' ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddLens('convex')} className="h-8 text-[10px] px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  + <Translate>Convex</Translate>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddLens('concave')} className="h-8 text-[10px] px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  + <Translate>Concave</Translate>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => handleAddMirror('plane')} className="w-full h-8 text-[10px] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  + <Translate>Plane Mirror</Translate>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddMirror('concave')} className="h-8 text-[10px] px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                    + <Translate>Concave</Translate>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddMirror('convex')} className="h-8 text-[10px] px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                    + <Translate>Convex</Translate>
                  </Button>
                </div>
              </div>
            )}

            {elements.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeElement(elements[0].id)}
                className="w-full h-7 text-[10px] mt-1"
              >
                <Trash2 className="w-3 h-3 mr-1" /> <Translate>Remove</Translate>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TOP RIGHT: View Options */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur shadow-md border-gray-200 hover:bg-white text-gray-700">
              <Maximize2 className="w-4 h-4 mr-2 text-primary" />
              <Translate>VIEW</Translate>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-white/95 backdrop-blur-xl border-gray-200 p-4 shadow-xl mr-4" align="end">
            <h4 className="font-bold mb-4 text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-3 h-3" /> <Translate>Visual Aids</Translate>
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Show Rays', checked: showRays, toggle: toggleRays },
                { label: 'Normal Line', checked: showNormal, toggle: toggleNormal },
                { label: 'Ray Extensions', checked: showRayExtensions, toggle: toggleRayExtensions },
                { label: 'Focal Points', checked: showFocalPoints, toggle: toggleFocalPoints },
                { label: 'Virtual Image', checked: showVirtualImage, toggle: toggleVirtualImage },
                { label: 'Labels', checked: showLabels, toggle: toggleLabels },
                { label: 'Measurements', checked: showMeasurements, toggle: toggleMeasurements },
              ].map((opt, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 font-medium"><Translate>{opt.label}</Translate></Label>
                  <Switch checked={opt.checked} onCheckedChange={opt.toggle} className="scale-75" />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* BOTTOM LEFT: Object Parameters */}
      <div className="absolute bottom-4 left-4 pointer-events-auto w-[240px]">
        <Card className="bg-white/90 backdrop-blur shadow-xl border-gray-200">
          <CardHeader className="p-3 pb-2 border-b border-gray-100">
            <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Translate>Object Properties</Translate></CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium text-gray-500">
                <span><Translate>Distance (u)</Translate></span>
                <span className="font-mono text-primary font-bold">{(objectDistance / 10).toFixed(1)} <Translate>cm</Translate></span>
              </div>
              <Slider
                value={[objectDistance]}
                onValueChange={(v) => handleObjectDistanceChange(v)}
                min={50} max={500} step={10}
                className="[&_.slider-thumb]:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium text-gray-500">
                <span><Translate>Height (h)</Translate></span>
                <span className="font-mono text-primary font-bold">{(object.height / 10).toFixed(1)} <Translate>cm</Translate></span>
              </div>
              <Slider
                value={[object.height]}
                onValueChange={(v) => setObjectHeight(v[0])}
                min={30} max={150} step={5}
                className="[&_.slider-thumb]:border-primary/50"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM RIGHT: Element Parameters */}
      {elements.length > 0 && (
        <div className="absolute bottom-4 right-4 pointer-events-auto w-[240px]">
          <Card className="bg-white/90 backdrop-blur shadow-xl border-gray-200">
            <CardHeader className="p-3 pb-2 border-b border-gray-100">
              <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <Translate>{`${mode === 'lens' ? 'Lens' : 'Mirror'} Properties`}</Translate>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {/* Focal Length */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-gray-500">
                  <span><Translate>Focal Length (f)</Translate></span>
                  <span className="font-mono text-primary font-bold">{(focalLength / 10).toFixed(1)} <Translate>cm</Translate></span>
                </div>
                <Slider
                  value={[focalLength]}
                  onValueChange={(v) => {
                    setFocalLength(v[0]);
                    if (elements[0]) updateElement(elements[0].id, { focalLength: elements[0].type === 'concave' ? -v[0] : v[0] });
                  }}
                  min={50} max={300} step={10}
                  className="[&_.slider-thumb]:border-primary/50"
                />
              </div>
              {/* Diameter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-gray-500">
                  <span><Translate>Diameter (D)</Translate></span>
                  <span className="font-mono text-primary font-bold">{(diameter / 10).toFixed(1)} <Translate>cm</Translate></span>
                </div>
                <Slider
                  value={[diameter]}
                  onValueChange={(v) => {
                    setDiameter(v[0]);
                    if (elements[0]) {
                      updateElement(elements[0].id, { diameter: v[0] });
                    }
                  }}
                  min={100} max={400} step={20}
                  className="[&_.slider-thumb]:border-primary/50"
                />
              </div>
              {/* Refractive Index (Lens Only) */}
              {mode === 'lens' && 'refractiveIndex' in elements[0] && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium text-gray-500">
                    <span><Translate>Refractive Index (n)</Translate></span>
                    <span className="font-mono text-primary font-bold">{refractiveIndex.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[refractiveIndex]}
                    onValueChange={(v) => {
                      const newIndex = v[0];
                      setRefractiveIndex(newIndex);
                      if (elements[0] && 'refractiveIndex' in elements[0]) {
                        updateElement(elements[0].id, { refractiveIndex: newIndex });
                      }
                    }}
                    min={1.0} max={2.5} step={0.1}
                    className="[&_.slider-thumb]:border-primary/50"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );

  const dataLoggerContent = (
    image && elements.length > 0 ? (
      <div className="space-y-4">
        <DataLogger
          objectDistance={Math.abs(elements[0].position.x - object.position.x)}
          objectHeight={object.height}
          imageDistance={Math.abs(image.position.x - elements[0].position.x)}
          imageHeight={Math.abs(image.height)}
          magnification={image.magnification}
          focalLength={Math.abs(elements[0].focalLength)}
        />
        <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-200">
          <div className="flex justify-between p-2 rounded bg-gray-50 border border-gray-100">
            <span className="text-gray-500"><Translate>Magnification</Translate></span>
            <span className="font-mono text-blue-600 font-bold">{image.magnification.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-gray-50 border border-gray-100">
            <span className="text-gray-500"><Translate>Type</Translate></span>
            <span className="font-bold text-blue-600"><Translate>{image.isReal ? 'Real' : 'Virtual'}</Translate></span>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center gap-2">
        <Database className="w-8 h-8 opacity-20" />
        <p><Translate>No simulation data available.</Translate></p>
        <p className="opacity-50"><Translate>Add an optical element to begin data logging.</Translate></p>
      </div>
    )
  );

  const allTasksCompleted = rawTasks.length > 0 && completedTasks.length === rawTasks.length;

  const handleContinueLearning = () => {
    navigate('/simulation');
  };

  return (
    <UnifiedSimulationLayout
      title="Geometric Optics Lab"
      subject="Physics"
      onHome={() => navigate('/')}
      onReset={reset}
      tasks={tasks}
      activeTaskId={activeTaskId}
      onTaskSelect={(id) => setActiveTask(id)}
      onSkipTask={handleSkip}
      penmanMessages={opticsPenmanMessages}
      controls={opticsControls}
      dataLoggerContent={dataLoggerContent}
    >
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair w-full h-full object-cover"
          style={{ touchAction: 'none' }}
        />
        <div className="absolute bottom-4 left-4 text-[10px] text-white/50 pointer-events-none font-mono bg-black/40 px-2 py-1 rounded">
          {CANVAS_WIDTH}x{CANVAS_HEIGHT}
        </div>

        {/* Continue Learning Button - Appears when all tasks are complete */}
        <AnimatePresence>
          {allTasksCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            >
              <Button
                size="lg"
                onClick={handleContinueLearning}
                className="bg-green-600 hover:bg-green-700 text-white shadow-2xl border-4 border-green-400/30 rounded-full h-14 px-8 text-lg font-bold tracking-wide animate-pulse hover:animate-none transition-all flex items-center gap-2"
              >
                <span><Translate>Continue Learning</Translate></span>
                <ArrowRight className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UnifiedSimulationLayout>
  );
};
