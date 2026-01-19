import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    RotateCcw,
    Database,
    ArrowLeft,
    ChevronUp,
    ChevronDown,
    Sparkles,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskSidebar, TaskItem } from './TaskSidebar';
import { Badge } from '@/components/ui/badge';
import { Penman, PenmanMessage } from '../assistant/Penman';
import { Translate } from '@/components/Translate';

interface UnifiedSimulationLayoutProps {
    title: string;
    subject: string;
    onHome: () => void;
    onReset: () => void;

    // Tasks
    tasks: TaskItem[];
    activeTaskId: string | null;
    onTaskSelect: (taskId: string) => void;
    onSkipTask?: (taskId: string) => void;

    // Penman
    penmanMessages?: Record<string, PenmanMessage>;

    // Main Content
    children: React.ReactNode; // The Canvas

    // Custom Controls (Bottom panel)
    controls: React.ReactNode;

    // Data Logger
    showDataLogger?: boolean;
    onToggleDataLogger?: () => void;
    dataLoggerContent?: React.ReactNode;

    // AI State Explanation
    onExplainState?: () => void;
    penmanTextOverride?: string | null;
    onClearExplanation?: () => void;
    isThinking?: boolean;
}

export const UnifiedSimulationLayout: React.FC<UnifiedSimulationLayoutProps> = ({
    title,
    subject,
    onHome,
    onReset,
    tasks,
    activeTaskId,
    onTaskSelect,
    onSkipTask,
    penmanMessages,
    children,
    controls,
    showDataLogger = false,
    onToggleDataLogger,
    dataLoggerContent,
    onExplainState,
    penmanTextOverride,
    onClearExplanation,
    isThinking = false
}) => {
    const [isAssistanceEnabled, setIsAssistanceEnabled] = useState(true);

    // Derive completed list for Penman
    const completedTaskIds = useMemo(() => tasks.filter(t => t.completed).map(t => t.id), [tasks]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white text-black relative font-sans">

            {/* 1. Universal Header */}
            <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 z-40 rounded-b-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onHome}
                        className="rounded-full hover:bg-gray-100 w-8 h-8 text-gray-600 hover:text-black"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h1 className="text-lg font-bold tracking-tight text-black">
                            <Translate>{title}</Translate>
                        </h1>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold text-primary border-primary/30 bg-primary/5">
                            <Translate>{subject}</Translate>
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={isAssistanceEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsAssistanceEnabled(!isAssistanceEnabled)}
                        className={`gap - 2 h - 8 text - xs font - semibold tracking - wide transition - all ${isAssistanceEnabled ? "bg-primary text-primary-foreground" : "text-gray-400 border-gray-200"
                            } `}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <Translate>{isAssistanceEnabled ? "Assistance: ON" : "Assistance: OFF"}</Translate>
                    </Button>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    {onExplainState && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExplainState}
                            disabled={isThinking}
                            className="gap-2 h-8 text-xs font-semibold tracking-wide border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            {isThinking ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <Translate>{isThinking ? "Thinking..." : "Explain State"}</Translate>
                        </Button>
                    )}

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    {onToggleDataLogger && (
                        <Button
                            variant={showDataLogger ? "secondary" : "ghost"}
                            size="sm"
                            onClick={onToggleDataLogger}
                            className={`gap - 2 h - 8 text - xs font - semibold tracking - wide transition - all ${showDataLogger
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : "text-gray-500 hover:text-black hover:bg-gray-100"
                                } `}
                        >
                            <Database className="w-3.5 h-3.5" />
                            <Translate>DATA LOGGER</Translate>
                        </Button>
                    )}

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 h-8 text-xs text-gray-500 hover:text-black hover:bg-gray-100">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <Translate>Reset Lab</Translate>
                    </Button>
                </div>
            </header>

            {/* 2. Main Workspace Grid */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* CENTER: Canvas Stage & Controls Overlay */}
                <div className="flex-1 flex flex-col relative min-w-0">

                    {/* A. Canvas Area */}
                    <div className="flex-1 relative bg-gray-50 overflow-hidden select-none rounded-2xl m-4 shadow-sm">
                        {/* The Simulation Canvas */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {children}
                        </div>

                        {/* Controls Overlay (Full Screen, Pointer Events None by default) */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {/* Children within 'controls' must have pointer-events-auto */}
                            {controls}
                        </div>

                        {/* 3. Penman Overlay (Inside Canvas Container) */}
                        {penmanMessages && (
                            <Penman
                                activeTaskId={activeTaskId}
                                completedTasks={completedTaskIds}
                                messages={penmanMessages}
                                onSkipTask={onSkipTask}
                                enabled={isAssistanceEnabled}
                            />
                        )}
                    </div>
                </div>

                {/* RIGHT: Sidebar (Tasks + Data Logger) */}
                <div className="w-[350px] shrink-0 border-l border-gray-200 bg-gray-50 z-30 flex flex-col">
                    {/* Top: Task Sidebar (Takes more space) */}
                    <div className="h-[65%] overflow-hidden relative border-b border-gray-200 bg-white">
                        <TaskSidebar
                            tasks={tasks}
                            activeTaskId={activeTaskId}
                            onTaskSelect={onTaskSelect}
                            onSkipTask={onSkipTask}
                        />
                    </div>

                    {/* Bottom: Data Logger (Takes remaining space) */}
                    <div className="flex-1 flex flex-col bg-gray-50 min-h-0 rounded-tl-2xl overflow-hidden">
                        <div className="h-10 flex items-center px-4 border-b border-gray-200 bg-gray-100 shrink-0">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Database className="w-3 h-3" /> <Translate>Data Logger</Translate>
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {dataLoggerContent ? dataLoggerContent : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 opacity-50">
                                    <Database className="w-8 h-8" />
                                    <span className="text-xs"><Translate>No active data</Translate></span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Penman Overlay (Global - Top Layer) */}
            {/* Placed at root to ensure it floats above everything else */}

            <AnimatePresence>
                {penmanTextOverride && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative"
                        >
                            <div className="absolute top-4 right-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClearExplanation}
                                    className="rounded-full hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </Button>
                            </div>

                            <div className="p-8 pb-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            <Translate>Simulation Insight</Translate>
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                                            <Translate>Powered by Penman AI</Translate>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <p className="text-gray-700 leading-relaxed text-lg italic">
                                        "{penmanTextOverride}"
                                    </p>
                                </div>

                                <div className="mt-8 flex justify-center">
                                    <Button
                                        onClick={onClearExplanation}
                                        className="rounded-full px-8 h-12 font-bold text-base shadow-lg shadow-primary/20"
                                    >
                                        <Translate>Got it, thanks!</Translate>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
