import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { chemistryPenmanMessages } from './penmanMessages';
import { useChemistryStore } from './chemistryStore';
import { UnifiedSimulationLayout } from '../simulation/UnifiedSimulationLayout';
import { TaskItem } from '../simulation/TaskSidebar';
import { Translate } from '@/components/Translate';
import { usePenmanAI } from '@/hooks/usePenmanAI';
import { ChemistryCanvas } from './ChemistryCanvas'; // We will create this
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    FlaskConical,
    TestTube,
    Flame,
    Droplet,
    ArrowRight,
    Thermometer,
    RefreshCw,
    Beaker,
    CheckCircle2
} from 'lucide-react';

export const ChemistrySim: React.FC = () => {
    const navigate = useNavigate();

    const {
        experimentMode,
        apparatus,
        chemicalA,
        chemicalB,
        indicator,
        metal,
        activeTaskId,
        completedTasks,
        setExperimentMode,
        setApparatus,
        setChemicalA,
        setChemicalB,
        setIndicator,
        setMetal,
        setHeatApplied,
        reset,
        setActiveTask,
        completeTask,
        getTasks,
        getActiveTask,
        updateState,
        gasProduced,
        isReacting,
        phValue
    } = useChemistryStore();

    // Tasks & Navigation Logic
    const rawTasks = getTasks();
    const tasks: TaskItem[] = useMemo(() => rawTasks.map((t, index) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        instructions: [t.instructions],
        hint: t.hint,
        completed: completedTasks.includes(t.id),
        locked: index > 0 && !completedTasks.includes(rawTasks[index - 1].id)
    })), [rawTasks, completedTasks]);

    // Check if all tasks are completed
    const allTasksCompleted = useMemo(() => 
        rawTasks.length > 0 && rawTasks.every(task => completedTasks.includes(task.id)),
        [rawTasks, completedTasks]
    );

    const handleContinue = () => {
        navigate('/simulation');
        toast.success('Great work! Proceeding to notes and insights.', { icon: '📚' });
    };

    const handleSkip = (taskId: string) => {
        completeTask(taskId);
        const currentIndex = rawTasks.findIndex(t => t.id === taskId);
        if (currentIndex !== -1 && currentIndex < rawTasks.length - 1) {
            const nextTask = rawTasks[currentIndex + 1];
            // Run setup for next task
            if (nextTask.setupFn) {
                nextTask.setupFn(useChemistryStore.getState());
            }
            setActiveTask(nextTask.id);
        }
        toast.info("Task Skipped");
    };

    // Run setup function whenever active task changes
    useEffect(() => {
        if (activeTaskId) {
            const activeTaskData = rawTasks.find(t => t.id === activeTaskId);
            if (activeTaskData && activeTaskData.setupFn) {
                activeTaskData.setupFn(useChemistryStore.getState());
            }
        }
    }, [activeTaskId, rawTasks]);

    // Auto-advance
    useEffect(() => {
        if (activeTaskId === null) {
            const nextTask = rawTasks.find(t => !completedTasks.includes(t.id));
            if (nextTask) {
                setActiveTask(nextTask.id);
            }
        }
    }, [activeTaskId, completedTasks, rawTasks]);

    // Task Validation Loop
    useEffect(() => {
        if (activeTaskId && !completedTasks.includes(activeTaskId)) {
            const activeTaskData = rawTasks.find(t => t.id === activeTaskId);
            if (activeTaskData && activeTaskData.validationFn) {
                const currentState = useChemistryStore.getState();
                if (activeTaskData.validationFn(currentState)) {
                    completeTask(activeTaskId);
                    toast.success(`Task Complete: ${activeTaskData.title}`, {
                        description: "Great job! Moving to next challenge.",
                        duration: 3000
                    });
                }
            }
        }
    }, [experimentMode, chemicalA, chemicalB, indicator, metal, activeTaskId, completedTasks, rawTasks, completeTask]);

    // Penman AI
    const {
        explanation: penmanExplanation,
        isThinking: penmanThinking,
        explainState,
        clearExplanation
    } = usePenmanAI({
        subject: "Chemistry",
        topic: "Acids, Bases and Salts",
        generateSignature: (state: any) => {
            // Create a signature of the current visual state
            return `MODE:${experimentMode}|APP:${apparatus}|CHEMA:${chemicalA}|CHEMB:${chemicalB}|IND:${indicator}|METAL:${metal}`;
        }
    });

    const handleExplainState = () => {
        explainState({
            experimentMode,
            apparatus,
            chemicalA,
            chemicalB,
            indicator,
            metal,
            // Add other relevant state
        });
    };

    // Controls Configuration
    // Dynamic controls based on Experiment Mode
    const renderControls = () => {
        return (
            <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-auto">
                {/* Mode Indicator - Read Only or Switcher if free play allowed (but prompt says Task Bound) */}
                <div className="bg-black/80 backdrop-blur-xl shadow-2xl p-2 rounded-xl border border-white/10">
                    <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest px-2">
                        {experimentMode.replace('_', ' ')}
                    </span>
                </div>

                {/* Dynamic Action Panel */}
                <div className="bg-black/60 backdrop-blur-xl shadow-xl border border-white/10 rounded-2xl p-4 w-[220px] space-y-3">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2"><Translate>Lab Bench</Translate></h3>

                    {/* Chemical Selection */}
                    {(experimentMode === 'indicators' || experimentMode === 'neutralization' || experimentMode === 'ph_scale') && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 font-bold">SOLUTIONS</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={chemicalA === 'hcl' ? 'default' : 'outline'} onClick={() => setChemicalA('hcl')} className="text-xs h-8">HCl (Acid)</Button>
                                <Button size="sm" variant={chemicalA === 'naoh' ? 'default' : 'outline'} onClick={() => setChemicalA('naoh')} className="text-xs h-8">NaOH (Base)</Button>
                                {experimentMode === 'ph_scale' && (
                                    <>
                                        <Button size="sm" variant={chemicalA === 'water' ? 'default' : 'outline'} onClick={() => setChemicalA('water')} className="text-xs h-8">Water</Button>
                                        <Button size="sm" variant={chemicalA === 'ch3cooh' ? 'default' : 'outline'} onClick={() => setChemicalA('ch3cooh')} className="text-xs h-8">Acetic Acid</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Indicators */}
                    {(experimentMode === 'indicators' || experimentMode === 'neutralization') && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold">INDICATORS</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={indicator === 'litmus_blue' ? 'default' : 'outline'} onClick={() => setIndicator('litmus_blue')} className="text-xs h-8 text-blue-400">Blue Litmus</Button>
                                <Button size="sm" variant={indicator === 'litmus_red' ? 'default' : 'outline'} onClick={() => setIndicator('litmus_red')} className="text-xs h-8 text-red-400">Red Litmus</Button>
                                <Button size="sm" variant={indicator === 'phenolphthalein' ? 'default' : 'outline'} onClick={() => setIndicator('phenolphthalein')} className="text-xs h-8 col-span-2">Phenolphthalein</Button>
                            </div>
                        </div>
                    )}

                    {/* Neutralization - Add Acid Button */}
                    {experimentMode === 'neutralization' && (
                        <div className="pt-2 border-t border-white/5">
                            <Button
                                size="sm"
                                onClick={() => setChemicalB('hcl')}
                                variant={chemicalB === 'hcl' ? 'default' : 'outline'}
                                className="w-full text-xs h-8"
                            >
                                Add HCl Dropwise
                            </Button>
                        </div>
                    )}

                    {/* Metals */}
                    {experimentMode === 'metal_acid' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 font-bold">METALS</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={metal === 'zn' ? 'default' : 'outline'} onClick={() => setMetal('zn')} className="text-xs h-8">Zinc Gel</Button>
                                <Button size="sm" variant={metal === 'mg' ? 'default' : 'outline'} onClick={() => setMetal('mg')} className="text-xs h-8">Magnesium</Button>
                            </div>
                            <Button size="sm" onClick={() => setChemicalA('hcl')} variant={chemicalA === 'hcl' ? 'default' : 'outline'} className="w-full text-xs h-8 mt-2">Add Dil. HCl</Button>
                        </div>
                    )}

                    {/* Carbonates */}
                    {experimentMode === 'carbonate' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 font-bold">CARBONATES</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={chemicalA === 'na2co3' ? 'default' : 'outline'} onClick={() => setChemicalA('na2co3')} className="text-xs h-8">Na₂CO₃</Button>
                                <Button size="sm" variant={chemicalA === 'caco3' ? 'default' : 'outline'} onClick={() => setChemicalA('caco3')} className="text-xs h-8">CaCO₃</Button>
                            </div>
                            <Button size="sm" onClick={() => setChemicalB('hcl')} variant={chemicalB === 'hcl' ? 'default' : 'outline'} className="w-full text-xs h-8 mt-2">Add Dil. HCl</Button>
                        </div>
                    )}

                    {/* pH Scale Mode */}
                    {experimentMode === 'ph_scale' && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold">INDICATOR</p>
                            <Button size="sm" variant={indicator === 'universal' ? 'default' : 'outline'} onClick={() => setIndicator('universal')} className="w-full text-xs h-8">Universal Indicator</Button>
                        </div>
                    )}

                    {/* Heating */}
                    {experimentMode === 'salt_heating' && (
                        <div className="space-y-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                className="w-full gap-2"
                                onMouseDown={() => setHeatApplied(true)}
                                onMouseUp={() => setHeatApplied(false)}
                                onMouseLeave={() => setHeatApplied(false)}
                            >
                                <Flame className="w-4 h-4" /> <Translate>Hold to Heat</Translate>
                            </Button>
                            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => {
                                setChemicalA('cuso4');
                                updateState({ color: '#0000FF' }); // Reset color
                            }}>
                                <RefreshCw className="w-4 h-4" /> <Translate>Reset Crystals</Translate>
                            </Button>
                        </div>
                    )}

                    <Button variant="ghost" size="sm" onClick={reset} className="w-full mt-4 text-xs text-muted-foreground hover:text-white">
                        <RefreshCw className="w-3 h-3 mr-2" /> Reset Lab
                    </Button>
                </div>
            </div>
        );
    };

    const dataLoggerContent = (
        <div className="p-4 text-xs text-muted-foreground">
            <h4 className="font-bold text-white mb-2">Observations</h4>
            <div className="grid grid-cols-2 gap-y-1">
                <span>Reaction:</span> <span className="text-right text-cyan-400">{isReacting ? 'Active' : 'None'}</span>
                <span>Gas:</span> <span className="text-right text-yellow-400">{gasProduced.toUpperCase()}</span>
                <span>pH:</span> <span className="text-right text-green-400">{phValue}</span>
            </div>
        </div>
    );

    return (
        <UnifiedSimulationLayout
            title="Chemistry Lab: Acids, Bases & Salts"
            subject="Chemistry"
            onHome={() => navigate('/')}
            onReset={reset}
            tasks={tasks}
            activeTaskId={activeTaskId}
            onTaskSelect={setActiveTask}
            onSkipTask={handleSkip}
            penmanMessages={chemistryPenmanMessages}
            controls={renderControls()}
            dataLoggerContent={dataLoggerContent}
            onExplainState={handleExplainState}
            penmanTextOverride={penmanExplanation}
            onClearExplanation={clearExplanation}
            isThinking={penmanThinking}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950">
                <ChemistryCanvas />
                
                {/* Completion Overlay with Continue Button */}
                <AnimatePresence>
                    {allTasksCompleted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.8, y: 50 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4"
                            >
                                <div className="text-center">
                                    {/* Success Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                        className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                                    </motion.div>

                                    {/* Title */}
                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                        <Translate>All Tasks Completed!</Translate>
                                    </h2>

                                    {/* Description */}
                                    <p className="text-gray-600 mb-8 text-lg">
                                        <Translate>Excellent work! You've mastered the chemistry experiments. Ready to review your notes and derivations?</Translate>
                                    </p>

                                    {/* Continue Button */}
                                    <Button
                                        onClick={handleContinue}
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all gap-3"
                                    >
                                        <Translate>Continue to Notes</Translate>
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>

                                    {/* Secondary Action */}
                                    <Button
                                        onClick={reset}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-3 text-gray-500 hover:text-gray-700"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        <Translate>Reset and Practice Again</Translate>
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </UnifiedSimulationLayout>
    );
};
