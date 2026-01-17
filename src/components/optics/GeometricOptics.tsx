import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useOpticsStore } from './opticsStore';
import { OpticsRenderer } from './scene';
import { OpticsEngine } from './opticsEngine';
import { InteractionHandler } from './interactions';
import { DataLogger } from './DataLogger';
import { Lens, Mirror } from './types';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  RotateCcw,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lightbulb,
  Settings2,
  Database,
  Maximize2,
  Info,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

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
    showFormula,
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
    toggleFormula,
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

  const tasks = getTasks();
  const activeTask = getActiveTask();
  const navigate = useNavigate();

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
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [object, elements, showRays, showFocalPoints, showVirtualImage, showLabels, showMeasurements]);

  // Check task completion
  useEffect(() => {
    if (!activeTask) return;

    const isComplete = activeTask.validationFn(useOpticsStore.getState());

    if (isComplete && !completedTasks.includes(activeTask.id)) {
      completeTask(activeTask.id);
      toast.success(`🎉 Task Complete: ${activeTask.title}`, {
        description: 'Great job! You mastered this concept!',
      });
    }
  }, [object, elements, image, activeTask]);

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

  return (
    <motion.div
      className="flex flex-col h-screen overflow-hidden bg-background bg-gradient-mesh noise relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Orbs */}
      <motion.div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="orb orb-primary w-[100vw] h-[100vh] fixed top-0 left-0"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0 }}
        />
        <motion.div
          className="orb orb-accent w-[90vw] h-[90vh] fixed top-0 right-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2, repeatDelay: 0 }}
        />
        <motion.div
          className="orb orb-warm w-[80vw] h-[80vh] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4, repeatDelay: 0 }}
        />
      </motion.div>

      {/* Header */}
      <div className="glass-card z-20 mx-3 mt-3 rounded-2xl border border-white/10 p-3 shadow-md backdrop-blur-2xl relative shrink-0">
        <div className="max-w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-primary/10 w-9 h-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Geometric Optics Lab
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2 glass-button h-8 text-xs hover:text-primary transition-all">
              Continue Journey
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="gap-2 glass-button h-8 text-xs hover:text-primary transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lab
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout: Canvas Area (Left) + Task Sidebar (Right) */}
      <div className="flex-1 flex overflow-hidden relative z-10 p-3 gap-3">

        {/* CANVAS STAGE & FLOATING OVERLAYS */}
        <div className="flex-1 relative bg-slate-950/30 overflow-hidden group rounded-2xl border border-white/10 shadow-2xl">

          {/* 1. THE CANVAS LAYER */}
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair w-full h-full object-cover"
              style={{ touchAction: 'none' }}
            />
            <div className="absolute bottom-4 left-4 text-[10px] text-white/50 pointer-events-none font-mono bg-black/40 px-2 py-1 rounded">
              {CANVAS_WIDTH}x{CANVAS_HEIGHT}
            </div>
          </div>

          {/* 2. TOP LEFT: MENUS (Mode & View) */}
          <div className="absolute top-6 left-6 flex gap-3 z-30">
            {/* Mode Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-10 px-4 glass-panel border-white/10 hover:border-primary/50  rounded-full gap-2 shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 backdrop-blur-xl bg-white/5">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-xs tracking-wide">{mode === 'lens' ? 'LENS MODE' : 'MIRROR MODE'}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 glass-panel border-white/10 backdrop-blur-2xl">
                <DropdownMenuItem onClick={() => setMode('lens')} className="cursor-pointer gap-2 py-2 focus:bg-primary/20 focus:text-primary">
                  <Circle className="w-3 h-3" /> Lens
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('mirror')} className="cursor-pointer gap-2 py-2 focus:bg-primary/20 focus:text-primary">
                  <Circle className="w-3 h-3" /> Mirror
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Options Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="h-10 px-4 glass-panel border-white/10 hover:border-primary/50 rounded-full gap-2 shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 backdrop-blur-xl bg-white/5">
                  <Maximize2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wide">VIEW OPTIONS</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 glass-panel border-white/10 p-5 backdrop-blur-2xl shadow-2xl" align="start">
                <h4 className="font-bold mb-4 text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Visual Aids
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Show Rays</Label>
                    <Switch checked={showRays} onCheckedChange={toggleRays} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Normal Line</Label>
                    <Switch checked={showNormal} onCheckedChange={toggleNormal} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Ray Extensions</Label>
                    <Switch checked={showRayExtensions} onCheckedChange={toggleRayExtensions} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Focal Points</Label>
                    <Switch checked={showFocalPoints} onCheckedChange={toggleFocalPoints} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Virtual Image</Label>
                    <Switch checked={showVirtualImage} onCheckedChange={toggleVirtualImage} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Labels</Label>
                    <Switch checked={showLabels} onCheckedChange={toggleLabels} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between group">
                    <Label className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Measurements</Label>
                    <Switch checked={showMeasurements} onCheckedChange={toggleMeasurements} className="scale-75 data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 3. TOP RIGHT: DATA LOGGER TOGGLE */}
          <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDataExpanded(!isDataExpanded)}
              className="h-10 px-4 glass-panel border-white/10 hover:border-primary/50 rounded-full gap-2 shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 backdrop-blur-xl bg-white/5"
            >
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-wide">DATA LOGGER</span>
              {isDataExpanded ? <ChevronUp className="w-3 h-3 opacity-50" /> : <ChevronDown className="w-3 h-3 opacity-50" />}
            </Button>

            {/* Floating Data Panel */}
            <AnimatePresence>
              {isDataExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel border-primary/20 p-5 rounded-2xl w-[400px] shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                >
                  {/* Tech decoration line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                  {image && elements.length > 0 ? (
                    <div className="space-y-4">
                      <DataLogger
                        objectDistance={Math.abs(elements[0].position.x - object.position.x)}
                        objectHeight={object.height}
                        imageDistance={Math.abs(image.position.x - elements[0].position.x)}
                        imageHeight={Math.abs(image.height)}
                        magnification={image.magnification}
                        focalLength={Math.abs(elements[0].focalLength)}
                      />
                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-white/5">
                        <div className="flex justify-between p-2 rounded bg-white/5">
                          <span className="text-muted-foreground">Magnification</span>
                          <span className="font-mono text-primary font-bold">{image.magnification.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-white/5">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-bold text-primary">{image.isReal ? 'Real' : 'Virtual'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-xs flex flex-col items-center gap-2">
                      <Database className="w-8 h-8 opacity-20" />
                      <p>No simulation data available.</p>
                      <p className="opacity-50">Add an optical element to begin data logging.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. BOTTOM LEFT: PARAMETERS CARD */}
          <div className="absolute bottom-6 left-6 z-30 w-[280px]">
            <Card className="glass-panel border-white/10 shadow-2xl backdrop-blur-2xl relative group overflow-hidden">
              {/* Tech Deco: Corners */}
              <svg className="absolute top-0 left-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M1 10V1H10" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute top-0 right-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M9 10V1H0" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute bottom-0 left-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M1 0V9H10" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute bottom-0 right-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M9 0V9H0" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>

              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {/* Object Distance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Object Dist (u)</span>
                    <span className="font-mono text-primary">{objectDistance}px</span>
                  </div>
                  <Slider value={[objectDistance]} onValueChange={(v) => handleObjectDistanceChange(v)} min={50} max={500} step={10} className="w-full" />
                </div>

                {/* Object Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Object Height (h)</span>
                    <span className="font-mono text-primary">{object.height}px</span>
                  </div>
                  <Slider value={[object.height]} onValueChange={(v) => setObjectHeight(v[0])} min={30} max={150} step={5} className="w-full" />
                </div>

                {/* Element Specifics */}
                {elements.length > 0 && (
                  <>
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span>Focal Length (f)</span>
                        <span className="font-mono text-primary">{focalLength}px</span>
                      </div>
                      <Slider
                        value={[focalLength]}
                        onValueChange={(v) => {
                          setFocalLength(v[0]);
                          if (elements[0]) updateElement(elements[0].id, { focalLength: elements[0].type === 'concave' ? -v[0] : v[0] });
                        }}
                        min={50} max={300} step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span>Diameter</span>
                        <span className="font-mono text-primary">{diameter}px</span>
                      </div>
                      <Slider
                        value={[diameter]}
                        onValueChange={(v) => {
                          setDiameter(v[0]);
                          if (elements[0]) {
                            updateElement(elements[0].id, { diameter: v[0] });
                          }
                        }}
                        min={100}
                        max={400}
                        step={20}
                        className="w-full"
                      />
                    </div>
                    {mode === 'lens' && 'refractiveIndex' in elements[0] && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          <span>Refr. Index</span>
                          <span className="font-mono text-primary">{refractiveIndex.toFixed(2)}</span>
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
                          min={1.0}
                          max={2.5}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. BOTTOM RIGHT: ACTION CARD */}
          <div className="absolute bottom-6 right-6 z-30 w-[240px]">
            <Card className="glass-panel border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              {/* Tech Deco: Corners */}
              <svg className="absolute top-0 left-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M1 10V1H10" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute top-0 right-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M9 10V1H0" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute bottom-0 left-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M1 0V9H10" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
              <svg className="absolute bottom-0 right-0 w-4 h-4 text-primary/40" viewBox="0 0 10 10"><path d="M9 0V9H0" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>

              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Add Element</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {mode === 'lens' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleAddLens('convex')} className="h-9 text-xs glass-button hover:bg-primary/20 hover:text-primary transition-all duration-300">
                      <Plus className="w-3 h-3 mr-1" /> Convex
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAddLens('concave')} className="h-9 text-xs glass-button hover:bg-primary/20 hover:text-primary transition-all duration-300">
                      <Plus className="w-3 h-3 mr-1" /> Concave
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm" onClick={() => handleAddMirror('plane')} className="w-full h-9 text-xs glass-button hover:bg-primary/20 hover:text-primary transition-all duration-300">
                      <Plus className="w-3 h-3 mr-1" /> Plane Mirror
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleAddMirror('concave')} className="h-9 text-xs glass-button hover:bg-primary/20 hover:text-primary transition-all duration-300">
                        <Plus className="w-3 h-3 mr-1" /> Concave
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleAddMirror('convex')} className="h-9 text-xs glass-button hover:bg-primary/20 hover:text-primary transition-all duration-300">
                        <Plus className="w-3 h-3 mr-1" /> Convex
                      </Button>
                    </div>
                  </div>
                )}

                {elements.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeElement(elements[0].id)}
                    className="w-full h-9 text-xs mt-1 shadow-lg shadow-red-500/10 hover:shadow-red-500/30 transition-all font-semibold"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> REMOVE SELECTED
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* RIGHT PANEL: TASKS */}
        <motion.div
          className="w-[320px] glass-panel rounded-2xl border border-white/10 flex flex-col shrink-0 relative bg-black/20 overflow-hidden"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-primary" /> Mission Log
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Progress Bar */}
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-none overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <Activity className="w-12 h-12 text-primary rotate-12" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">Progress</span>
                  <span className="text-xs font-mono text-foreground">
                    {completedTasks.length}/{tasks.length}
                  </span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-gradient-to-r from-primary via-blue-400 to-primary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {tasks.map((task, index) => {
                const isCompleted = completedTasks.includes(task.id);
                const isActive = activeTaskId === task.id;
                const isLocked = index > 0 && !completedTasks.includes(tasks[index - 1].id);

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`transition-all duration-300 relative overflow-hidden group ${isActive
                        ? 'shadow-lg shadow-primary/10 bg-gradient-to-r from-primary/5 to-transparent border-primary/30'
                        : 'glass-subtle border-transparent hover:bg-white/5 hover:border-white/10'
                        } ${isCompleted ? 'border-green-500/30' : ''} ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer'
                        }`}
                      onClick={() => !isLocked && setActiveTask(isActive ? null : task.id)}
                    >
                      {/* Active Indicator Line */}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}

                      <CardHeader className={`p-3 pb-2 ${isActive ? 'pl-4' : 'pl-3'}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {isCompleted ? (
                              <div className="p-0.5 bg-green-500/20 rounded-full border border-green-500/50">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              </div>
                            ) : isLocked ? (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <div className="relative">
                                <Circle className="w-4 h-4 text-primary group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-all" />
                                {isActive && (
                                  <motion.div
                                    className="absolute inset-0 bg-primary/30 rounded-full"
                                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-muted-foreground opacity-70">0{index + 1}</span>
                              <CardTitle className={`text-xs font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                                {task.title}
                              </CardTitle>
                            </div>
                            {!isActive && (
                              <CardDescription className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                {task.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isActive && !isLocked && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <CardContent className="p-3 pt-0 pl-4">
                              <div className="text-[10px] text-muted-foreground ml-7 space-y-3">
                                <p className="leading-relaxed border-l-2 border-white/5 pl-2 italic">{task.description}</p>

                                <div className="space-y-2 bg-gradient-to-br from-white/5 to-transparent rounded-lg p-3 border border-white/5">
                                  <p className="font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-[9px]">
                                    <BookOpen className="w-3 h-3 text-primary" /> Directive
                                  </p>
                                  <ul className="space-y-1.5">
                                    {task.instructions.map((instruction, idx) => (
                                      <li key={idx} className="flex gap-2">
                                        <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <span>{instruction}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-blue-400">
                                  <p className="flex gap-2">
                                    <span className="font-bold">💡 HINT:</span> <span>{task.hint}</span>
                                  </p>
                                </div>

                                {isCompleted && (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-green-400 text-center"
                                  >
                                    <p className="font-bold flex items-center justify-center gap-1.5 tracking-wider uppercase">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Mission Complete
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {completedTasks.length === tasks.length && (
              <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring" }}
                    className="text-3xl mb-2 inline-block"
                  >🎉</motion.div>
                  <p className="text-foreground font-bold text-sm uppercase tracking-widest">Training Complete</p>
                  <p className="text-green-400 text-xs mt-1">You are now a certified Optics Specialist.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

