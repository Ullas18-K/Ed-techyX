import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle2, Circle, Sparkles, ArrowRight, BookOpen, 
  FileText, Maximize2, Minimize2, Settings, Layers, X, Home, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLearningStore } from '@/lib/learningStore';
import { useStudyRoomStore } from '@/lib/studyRoomStore';
import { cn } from '@/lib/utils';
import { SimulationTools, RulerOverlay, StopwatchWidget, CalculatorWidget, MagnifierOverlay } from './SimulationTools';
import { NotesPanel } from './NotesPanel';
import { AIChatPanel } from './AIChatPanel';
import { DataLogger } from './DataLogger';
import { CanvasAnnotations } from './CanvasAnnotations';
import { FormulaReference } from './FormulaReference';
import { SpeedControl } from './SpeedControl';
import { LearningProgressBar } from './LearningProgressBar';
import { StudyRoomPanel } from './StudyRoomPanel';
import { ConversationalVoiceGuide } from './ConversationalVoiceGuide';
import { AIContextChat } from './AIContextChat';
import { toast } from 'sonner';

interface SimulationScreenProps {
  onComplete: () => void;
}

export function SimulationScreen({ onComplete }: SimulationScreenProps) {
  const { 
    currentScenario, 
    isAIGenerated,
    aiScenarioData,
    simulationValues, 
    simulationResults, 
    completedTasks, 
    learningSteps,
    currentStepIndex,
    updateSimulationValue, 
    runExperiment, 
    completeTask, 
    setPhase,
    initializeLearningSteps 
  } = useLearningStore();
  const { currentStudyRoom, currentUser, leaveStudyRoom } = useStudyRoomStore();

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState<boolean>(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeTrackingRef = useRef<NodeJS.Timeout>();

  const simulation = currentScenario?.simulation;

  // Debug logging
  useEffect(() => {
    console.log('🎮 SimulationScreen - Current State:', {
      hasScenario: !!currentScenario,
      isAIGenerated,
      scenarioId: currentScenario?.id,
      topic: currentScenario?.topic,
      simulationType: simulation?.type,
      controlsCount: simulation?.controls?.length,
      controls: simulation?.controls?.map(c => ({ id: c.id, label: c.label, type: c.type }))
    });
  }, [currentScenario, isAIGenerated, simulation]);

  // Track time spent in simulation
  useEffect(() => {
    timeTrackingRef.current = setInterval(() => {
      const store = useLearningStore.getState();
      store.checkStepCompletion();
    }, 2000);

    return () => {
      if (timeTrackingRef.current) clearInterval(timeTrackingRef.current);
    };
  }, []);

  // Initialize learning steps on mount
  useEffect(() => {
    if (currentScenario && learningSteps.length === 0) {
      initializeLearningSteps();
    }
  }, [currentScenario, learningSteps.length, initializeLearningSteps]);

  // Canvas drawing
  useEffect(() => {
    if (!canvasRef.current || !simulation) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (simulation.type === 'photosynthesis') drawPhotosynthesis(ctx, canvas.width, canvas.height);
      else if (simulation.type === 'circuit') drawCircuit(ctx, canvas.width, canvas.height);
      else drawDefault(ctx, canvas.width, canvas.height);
    };

    const drawPhotosynthesis = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const sunlight = (simulationValues.sunlight as number) || 50;
      const health = simulationResults.health || 50;
      
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, `rgb(${180 + sunlight * 0.7}, ${200 + sunlight * 0.5}, 255)`);
      sky.addColorStop(1, `rgb(${150 + sunlight * 0.5}, ${180 + sunlight * 0.5}, 255)`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sun
      const sunSize = 25 + sunlight * 0.4;
      ctx.beginPath();
      ctx.arc(w - 70, 50, sunSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${200 + sunlight * 0.5}, 50, ${0.5 + sunlight / 200})`;
      ctx.fill();

      // Ground & pot
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, h - 50, w, 50);
      ctx.fillStyle = '#A0522D';
      ctx.beginPath();
      ctx.moveTo(w/2 - 45, h - 50);
      ctx.lineTo(w/2 + 45, h - 50);
      ctx.lineTo(w/2 + 35, h - 100);
      ctx.lineTo(w/2 - 35, h - 100);
      ctx.fill();

      // Plant
      const plantH = 40 + health * 0.7;
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w/2, h - 100);
      ctx.lineTo(w/2, h - 100 - plantH);
      ctx.stroke();

      // Leaves
      const leafSize = 12 + health * 0.15;
      ctx.fillStyle = `rgb(34, ${90 + health * 0.6}, 34)`;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(w/2, h - 120 - i * 22);
        ctx.rotate((i % 2 === 0 ? 1 : -1) * 0.4);
        ctx.beginPath();
        ctx.ellipse(leafSize, 0, leafSize, leafSize/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // O2 bubbles
      if (simulationResults.oxygen > 0) {
        ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
        const t = Date.now() / 800;
        for (let i = 0; i < Math.min(5, simulationResults.oxygen / 15); i++) {
          const bx = w/2 - 35 + Math.sin(t + i) * 25;
          const by = h - 160 - (t * 25 + i * 18) % 80;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawCircuit = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const voltage = (simulationValues.voltage as number) || 6;
      const current = simulationResults.current || 0;
      const brightness = simulationResults.brightness || 0;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(100,100,150,0.15)';
      for (let i = 0; i < w; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let i = 0; i < h; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

      // Battery
      ctx.fillStyle = '#333';
      ctx.fillRect(35, h/2 - 35, 25, 70);
      ctx.fillStyle = '#4CAF50';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${voltage}V`, 47, h/2 + 50);

      // Wires
      ctx.strokeStyle = current > 0 ? '#FFD700' : '#666';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(47, h/2 - 40);
      ctx.lineTo(47, 40);
      ctx.lineTo(w - 47, 40);
      ctx.lineTo(w - 47, h/2 - 25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(47, h/2 + 35);
      ctx.lineTo(47, h - 40);
      ctx.lineTo(w - 47, h - 40);
      ctx.lineTo(w - 47, h/2 + 25);
      ctx.stroke();

      // Bulb
      const glow = ctx.createRadialGradient(w - 47, h/2, 0, w - 47, h/2, 45);
      glow.addColorStop(0, `rgba(255,255,100,${brightness/100})`);
      glow.addColorStop(1, 'rgba(255,255,100,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(w - 92, h/2 - 45, 90, 90);
      ctx.beginPath();
      ctx.arc(w - 47, h/2, 22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,${150 + brightness},${0.3 + brightness/200})`;
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawDefault = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Generic dynamic visualization for AI-generated simulations
      const t = Date.now() / 1000;
      
      // Gradient background based on first output value
      const outputs = simulation.outputs || [];
      const firstOutput = outputs[0];
      const outputValue = firstOutput ? (simulationResults[firstOutput.id] || 0) : 50;
      
      // Create dynamic gradient based on output intensity
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      const intensity = outputValue / 100;
      gradient.addColorStop(0, `hsl(210, ${40 + intensity * 40}%, ${85 - intensity * 15}%)`);
      gradient.addColorStop(1, `hsl(220, ${30 + intensity * 30}%, ${75 - intensity * 10}%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Draw control representations (bars on the left)
      const controls = simulation.controls.filter(c => c.type === 'slider').slice(0, 4);
      const barWidth = 40;
      const barSpacing = (h - 80) / Math.max(controls.length, 1);
      
      controls.forEach((control, i) => {
        const value = (simulationValues[control.id] as number) || (control.default as number) || 0;
        const maxVal = control.max || 100;
        const normalized = value / maxVal;
        const barHeight = normalized * 80;
        
        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(20, 40 + i * barSpacing, barWidth, 80);
        
        // Bar fill
        const hue = 200 - i * 30;
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
        ctx.fillRect(20, 40 + i * barSpacing + (80 - barHeight), barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(control.label.substring(0, 8), 40, 35 + i * barSpacing);
        ctx.fillText(Math.round(value).toString(), 40, 130 + i * barSpacing);
      });

      // Draw output visualizations (center)
      const centerX = w / 2 + 40;
      const centerY = h / 2;
      
      // Main visualization - pulsing circles representing outputs
      outputs.forEach((output, i) => {
        const val = simulationResults[output.id] || 0;
        const normalized = val / 100;
        const radius = 30 + (outputs.length - i) * 25;
        const pulseRadius = radius + Math.sin(t * 2 + i) * 5 * normalized;
        
        // Outer glow
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius + 20);
        const hue = 200 + i * 40;
        glow.addColorStop(0, `hsla(${hue}, 70%, 60%, ${normalized * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(centerX - pulseRadius - 20, centerY - pulseRadius - 20, 
                     (pulseRadius + 20) * 2, (pulseRadius + 20) * 2);
        
        // Main circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${0.6 + normalized * 0.4})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner fill
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${normalized * 0.2})`;
        ctx.fill();
      });

      // Center indicator
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
      ctx.fill();

      // Draw output value bars (right side)
      const rightX = w - 120;
      outputs.forEach((output, i) => {
        const val = simulationResults[output.id] || 0;
        const barY = 40 + i * (h - 80) / Math.max(outputs.length, 1);
        const barH = 60;
        const normalized = val / 100;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(rightX, barY, 80, barH);
        
        // Fill
        const fillWidth = normalized * 80;
        const hue = 120 + i * 60;
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
        ctx.fillRect(rightX, barY, fillWidth, barH);
        
        // Label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(output.label.substring(0, 10), rightX + 40, barY - 5);
        ctx.fillText(`${Math.round(val)}`, rightX + 40, barY + barH / 2 + 5);
      });

      // Animated particles showing activity
      if (outputValue > 20) {
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        const particleCount = Math.floor(outputValue / 20);
        for (let i = 0; i < particleCount; i++) {
          const angle = (t + i) * 0.5;
          const dist = 60 + Math.sin(t * 2 + i) * 20;
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Title overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(w/2 - 120, 10, 240, 30);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(simulation.title || 'Simulation', w/2, 30);
    };

    let animId: number;
    const animate = () => { if (isPlaying) draw(); animId = requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [simulation, simulationValues, simulationResults, isPlaying]);

  const handleRunExperiment = () => {
    setIsExperimentRunning(true);
    runExperiment();
    if (!completedTasks.includes(simulation?.tasks[0] || '')) completeTask(simulation?.tasks[0] || '');
    toast.success('Experiment completed!');
    setTimeout(() => setIsExperimentRunning(false), 1200);
  };

  if (!simulation || !currentScenario) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col bg-background bg-gradient-mesh noise">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 glass-strong">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{simulation.title}</h2>
          <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{currentScenario.subject}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showVoiceGuide ? "default" : "glass"} 
            size="sm" 
            onClick={() => setShowVoiceGuide(!showVoiceGuide)} 
            className="gap-1.5"
            title={showVoiceGuide ? "Hide voice guide" : "Show voice guide"}
          >
            <Mic className="w-4 h-4" /> {showVoiceGuide ? "Guide On" : "Guide Off"}
          </Button>
          <Button variant="glass" size="sm" onClick={() => setIsFormulaOpen(!isFormulaOpen)} className="gap-1.5">
            <FileText className="w-4 h-4" /> Formulas
          </Button>
          <Button variant="glass" size="sm" onClick={() => setIsNotesOpen(true)} className="gap-1.5">
            <BookOpen className="w-4 h-4" /> Notes
          </Button>
          <Button variant="glass" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => {
              if (currentStudyRoom && currentUser) {
                leaveStudyRoom(currentStudyRoom.id, currentUser.id);
              }
              setPhase('mastery');
              toast('Returning to home...', { icon: '🏠' });
            }}
            className="gap-1.5"
          >
            <Home className="w-4 h-4" /> Home
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Left: Simulation */}
        <div className={cn("flex flex-col gap-4", isFullscreen ? "flex-1" : "w-1/2")}>
          <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">
            <div className="relative flex-1 bg-muted min-h-[300px]">
              <canvas ref={canvasRef} width={600} height={400} className="w-full h-full" />
              
              {/* Tool overlays */}
              <AnimatePresence>
                {activeTool === 'ruler' && <RulerOverlay />}
                {activeTool === 'timer' && <StopwatchWidget />}
                {activeTool === 'calculator' && <CalculatorWidget />}
                {activeTool === 'magnifier' && <MagnifierOverlay />}
              </AnimatePresence>

              <CanvasAnnotations isActive={isAnnotating} onToggle={() => setIsAnnotating(!isAnnotating)} canvasRef={canvasRef} />

              {isExperimentRunning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-card rounded-full shadow-medium">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="font-medium text-sm">Running...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom controls */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
              <SimulationTools onToolSelect={setActiveTool} activeTool={activeTool} />
              <SpeedControl speed={simulationSpeed} onSpeedChange={setSimulationSpeed} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} onReset={() => { updateSimulationValue('sunlight', 50); updateSimulationValue('water', 50); }} />
            </div>
          </div>

          {/* Controls & Results */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Controls</h3>
              <div className="space-y-4">
                {simulation.controls.map((control) => (
                  <div key={control.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{control.label}</span>
                      <span className="text-primary font-medium">
                        {simulationValues[control.id] ?? control.default}{control.unit}
                      </span>
                    </div>
                    {control.type === 'slider' && (
                      <Slider 
                        value={[(simulationValues[control.id] as number) ?? (control.default as number)]} 
                        min={control.min} 
                        max={control.max} 
                        step={control.step} 
                        onValueChange={(v) => {
                          updateSimulationValue(control.id, v[0]);
                          // Track interaction time
                          const store = useLearningStore.getState();
                          useLearningStore.setState({ 
                            timeSpentInSimulation: store.timeSpentInSimulation + 2 
                          });
                        }}
                        className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/50" 
                      />
                    )}
                    {control.type === 'select' && control.options && (
                      <select
                        value={String((simulationValues[control.id] as string) ?? control.default)}
                        onChange={(e) => updateSimulationValue(control.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm"
                      >
                        {control.options.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="hero" className="w-full mt-4 gap-2" onClick={handleRunExperiment} disabled={isExperimentRunning}>
                <Play className="w-4 h-4" /> Run Experiment
              </Button>
            </div>

            <DataLogger isRecording={isRecording} onToggleRecording={() => setIsRecording(!isRecording)} simulationResults={simulationResults} outputs={simulation.outputs} />
          </div>
        </div>

        {/* Right: Tasks & Chat */}
        {!isFullscreen && (
          <div className="w-1/2 flex flex-col gap-4">
            {/* Study Room Panel - Show if in room */}
            <AnimatePresence>
              {currentStudyRoom && (
                <StudyRoomPanel 
                  room={currentStudyRoom} 
                  onLeave={() => {
                    // Room left, panel will disappear
                  }}
                />
              )}
            </AnimatePresence>

            {/* Learning Progress Bar */}
            <div className="glass-card rounded-2xl p-6">
              <LearningProgressBar steps={learningSteps} currentIndex={currentStepIndex} />
            </div>

            {/* Learning Steps */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Learning Progress</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  {learningSteps.filter(s => s.completed).length}/{learningSteps.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {learningSteps.map((step, i) => {
                  const isCurrent = i === currentStepIndex;
                  const isLocked = i > currentStepIndex;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "p-3 rounded-xl transition-all text-sm",
                        step.completed && "glass border-success/30 bg-success/10",
                        isCurrent && !step.completed && "glass ring-2 ring-primary/30",
                        isLocked && "glass-subtle opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Circle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 fill-primary/20" />
                          </motion.div>
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1">
                          <div className={cn(
                            "font-medium",
                            step.completed && "text-success",
                            isCurrent && "text-primary"
                          )}>
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </div>
                          
                          {isCurrent && !step.completed && (
                            <div className="mt-2 text-xs text-primary/80 flex items-center gap-1">
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                ✨
                              </motion.div>
                              Current task - keep experimenting!
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {learningSteps.filter(s => s.completed).length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button variant="hero" className="w-full mt-4 gap-2" onClick={onComplete}>
                    Continue to Explanation <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* AI Chat - Use AI-powered chat if scenario is AI-generated */}
            <div className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden">
              {isAIGenerated && aiScenarioData ? (
                <AIContextChat
                  scenarioId={aiScenarioData.scenarioId}
                  currentTaskId={currentStepIndex + 1}
                  context={{
                    greeting: aiScenarioData.greeting,
                    grade: aiScenarioData.gradeLevel,
                    subject: aiScenarioData.subject,
                    topic: aiScenarioData.title,
                    currentValues: simulationValues,
                    results: simulationResults,
                    task: aiScenarioData.tasks[currentStepIndex] || {}
                  }}
                  onTaskComplete={(taskId) => {
                    toast.success(`Task ${taskId} completed!`);
                  }}
                />
              ) : (
                <AIChatPanel topicName={currentScenario.topic} subject={currentScenario.subject} simulationType={simulation.type} onRequestHint={() => toast.info('Hint: Try changing one variable at a time!')} onRequestExplanation={() => {}} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panels */}
      <NotesPanel 
        isOpen={isNotesOpen} 
        onClose={() => setIsNotesOpen(false)} 
        topicName={currentScenario.topic} 
        subject={currentScenario.subject}
        aiNotes={currentScenario.notes}
      />
      <FormulaReference 
        isOpen={isFormulaOpen} 
        onClose={() => setIsFormulaOpen(false)} 
        subject={currentScenario.subject} 
        topic={currentScenario.topic}
        aiFormulas={currentScenario.formulas}
      />
      
      {/* Conversational AI Voice Guide */}
      {showVoiceGuide && (
        <ConversationalVoiceGuide
          topicName={currentScenario.topic}
          simulationType={simulation.type}
          onTaskComplete={(taskId) => {
            toast.success(`Task ${taskId} completed!`);
          }}
          onClose={() => setShowVoiceGuide(false)}
        />
      )}
    </motion.div>
  );
} 
