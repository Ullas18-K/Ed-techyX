import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle2, Circle, Sparkles, ArrowRight, BookOpen, 
  FileText, X, Home, ChevronLeft, ChevronRight, Sliders, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLearningStore } from '@/lib/learningStore';
import { useStudyRoomStore } from '@/lib/studyRoomStore';
import { cn } from '@/lib/utils';
import { UnifiedSimulationLayout } from './UnifiedSimulationLayout';
import { TaskItem } from './TaskSidebar';
import { PenmanMessage } from '../assistant/Penman';
import { toast } from 'sonner';

interface GenericSimulationScreenProps {
  onComplete: () => void;
}

/**
 * Generic Simulation Screen using UnifiedSimulationLayout
 * This provides a clean, unified interface for all subjects
 */
export function GenericSimulationScreen({ onComplete }: GenericSimulationScreenProps) {
  const { 
    currentScenario, 
    simulationValues, 
    simulationResults, 
    completedTasks, 
    learningSteps,
    currentStepIndex,
    updateSimulationValue, 
    runExperiment, 
    completeTask, 
    setPhase
  } = useLearningStore();
  
  const { currentStudyRoom, currentUser, leaveStudyRoom } = useStudyRoomStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showDataLogger, setShowDataLogger] = useState(false);

  // Create generic tasks from learning steps
  const tasks: TaskItem[] = learningSteps.map((step, index) => ({
    id: `task-${index + 1}`,
    title: step.title,
    description: step.description,
    instructions: step.instructions || [`Complete the ${step.title.toLowerCase()} activity`],
    hint: step.hint,
    completed: completedTasks.includes(`task-${index + 1}`),
    locked: index > 0 && !completedTasks.includes(`task-${index}`)
  }));

  // Create generic Penman messages from learning steps
  const penmanMessages: Record<string, PenmanMessage> = learningSteps.reduce((acc, step, index) => {
    const taskId = `task-${index + 1}`;
    acc[taskId] = {
      instruction: step.description || `Let's work on ${step.title.toLowerCase()}. Follow the instructions to complete this task.`,
      completion: `Great job! You've completed the ${step.title.toLowerCase()} task successfully!`,
      hint: step.hint || "Take your time and try different approaches"
    };
    return acc;
  }, {} as Record<string, PenmanMessage>);

  // Auto-select first uncompleted task
  useEffect(() => {
    if (!activeTaskId) {
      const firstIncomplete = tasks.find(t => !t.completed && !t.locked);
      if (firstIncomplete) {
        setActiveTaskId(firstIncomplete.id);
      }
    }
  }, [tasks, activeTaskId]);

  // Canvas rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = () => {
      const simulation = currentScenario?.simulation;
      if (!simulation) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Generic simulation rendering based on type
      if (simulation.type === 'photosynthesis') {
        drawPhotosynthesis(ctx, canvas.width, canvas.height);
      } else if (simulation.type === 'circuit') {
        drawCircuit(ctx, canvas.width, canvas.height);
      } else {
        drawDefault(ctx, canvas.width, canvas.height);
      }
    };

    const drawPhotosynthesis = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const sunlight = (simulationValues.sunlight as number) || 50;
      const health = simulationResults.health || 50;
      
      // Sky gradient
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

      // Plant rendering with health-based size and color
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, h - 50, w, 50);
      
      const plantH = 40 + health * 0.7;
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w/2, h - 50);
      ctx.lineTo(w/2, h - 50 - plantH);
      ctx.stroke();
    };

    const drawCircuit = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const voltage = (simulationValues.voltage as number) || 6;
      const current = simulationResults.current || 0;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      // Battery
      ctx.fillStyle = '#333';
      ctx.fillRect(50, h/2 - 25, 30, 50);
      ctx.fillStyle = '#4CAF50';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${voltage}V`, 65, h/2 + 40);

      // Wires with current indication
      ctx.strokeStyle = current > 0 ? '#FFD700' : '#666';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(65, h/2 - 30);
      ctx.lineTo(65, 50);
      ctx.lineTo(w - 65, 50);
      ctx.lineTo(w - 65, h/2 - 15);
      ctx.stroke();
    };

    const drawDefault = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Generic visualization
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, w, h);

      // Central visualization area
      const centerX = w / 2;
      const centerY = h / 2;

      // Draw simulation state
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50 + (simulationResults.energy || 0) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Title
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentScenario?.simulation?.title || 'Simulation', centerX, 30);
    };

    let animId: number;
    const animate = () => { 
      if (isPlaying) draw(); 
      animId = requestAnimationFrame(animate); 
    };
    animate();
    
    return () => cancelAnimationFrame(animId);
  }, [currentScenario, simulationValues, simulationResults, isPlaying]);

  const handleRunExperiment = () => {
    setIsExperimentRunning(true);
    runExperiment();
    
    // Auto-complete active task
    if (activeTaskId && !completedTasks.includes(activeTaskId)) {
      completeTask(activeTaskId);
      toast.success('Experiment completed!', {
        description: 'Great job! Task completed.'
      });
    }
    
    setTimeout(() => setIsExperimentRunning(false), 1200);
  };

  const handleSkipTask = (taskId: string) => {
    completeTask(taskId);
    toast.info("Task Skipped", {
      description: "Moving to the next challenge."
    });
    
    // Move to next task
    const nextTask = tasks.find(t => !t.completed && !t.locked);
    if (nextTask) {
      setActiveTaskId(nextTask.id);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.locked) {
      setActiveTaskId(taskId);
    }
  };

  const handleHome = () => {
    if (currentStudyRoom && currentUser) {
      leaveStudyRoom(currentStudyRoom.id, currentUser.id);
    }
    setPhase('mastery');
    toast('Returning to home...', { icon: '🏠' });
  };

  if (!currentScenario?.simulation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No simulation available</p>
      </div>
    );
  }

  const simulation = currentScenario.simulation;

  // Create controls for the simulation
  const simulationControls = (
    <div className="flex gap-4 items-end">
      {/* Controls Card */}
      <Card className="glass-panel border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden w-[320px]">
        <CardHeader className="p-4 pb-2 border-b border-white/5">
          <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <Sliders className="w-3 h-3" /> Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {simulation.controls?.map((control) => (
            <div key={control.id} className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>{control.label}</span>
                <span className="font-mono text-primary">
                  {simulationValues[control.id] || control.defaultValue}{control.unit || ''}
                </span>
              </div>
              
              {control.type === 'slider' && (
                <Slider
                  value={[simulationValues[control.id] as number || control.defaultValue]}
                  onValueChange={(v) => updateSimulationValue(control.id, v[0])}
                  min={control.min}
                  max={control.max}
                  step={control.step || 1}
                  className="w-full"
                />
              )}
              
              {control.type === 'select' && (
                <select
                  value={simulationValues[control.id] as string || control.defaultValue}
                  onChange={(e) => updateSimulationValue(control.id, e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-background/50 border border-border text-foreground text-xs"
                >
                  {control.options.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          
          <Button 
            variant="default" 
            className="w-full mt-4 h-8 text-xs gap-2" 
            onClick={handleRunExperiment} 
            disabled={isExperimentRunning}
          >
            <Play className="w-3 h-3" /> Run Experiment
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const dataLoggerContent = showDataLogger ? (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-2">
        <Activity className="w-3 h-3" /> Results
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {Object.entries(simulationResults).map(([key, value]) => (
          <div key={key} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
            <span className="text-muted-foreground block mb-0.5 capitalize">{key}</span>
            <span className="text-white font-mono">{typeof value === 'number' ? value.toFixed(1) : value}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <UnifiedSimulationLayout
      title={simulation.title}
      subject={currentScenario.subject}
      onHome={handleHome}
      onReset={() => window.location.reload()}
      tasks={tasks}
      activeTaskId={activeTaskId}
      onTaskSelect={handleTaskSelect}
      onSkipTask={handleSkipTask}
      penmanMessages={penmanMessages}
      controls={simulationControls}
      showDataLogger={showDataLogger}
      onToggleDataLogger={() => setShowDataLogger(!showDataLogger)}
      dataLoggerContent={dataLoggerContent}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>
    </UnifiedSimulationLayout>
  );
}