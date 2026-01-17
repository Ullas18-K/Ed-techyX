import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Lock,
  Activity,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  hint?: string;
  completed: boolean;
  locked: boolean;
}

interface TaskSidebarProps {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onSkipTask?: (taskId: string) => void;
  title?: string;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  activeTaskId,
  onTaskSelect,
  onSkipTask,
  title = "Mission Log"
}) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / Math.max(tasks.length, 1)) * 100;
  const allComplete = completedCount === tasks.length;

  return (
    <motion.div
      className="w-full h-full flex flex-col bg-white overflow-hidden"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 flex items-center justify-between shrink-0">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-primary" /> {title}
        </h2>
        <div className="flex items-center gap-2">
          {!allComplete && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Progress Bar */}
        <Card className="bg-blue-50 border-blue-100 shadow-none overflow-hidden shrink-0">
          <CardContent className="p-4 relative">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Activity className="w-12 h-12 text-blue-600 rotate-12" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 tracking-wider uppercase">Progress</span>
              <span className="text-xs font-mono text-gray-700">
                {completedCount}/{tasks.length}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-blue-600 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="space-y-3 pb-8">
          {tasks.map((task, index) => {
            const isActive = activeTaskId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "transition-all duration-300 relative overflow-hidden group rounded-xl border select-none",
                    isActive
                      ? "shadow-md shadow-blue-100 bg-white border-blue-300"
                      : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50",
                    task.completed && "border-green-200 bg-green-50",
                    task.locked ? "opacity-50 grayscale cursor-not-allowed bg-gray-50" : "cursor-pointer hover:scale-[1.01]"
                  )}
                  onClick={() => {
                    if (task.locked) {
                      return;
                    }
                    onTaskSelect(task.id);
                  }}
                >
                  {/* Active Indicator Line */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                  <div className={cn("p-3 pb-2", isActive ? 'pl-4' : 'pl-3')}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {task.locked ? (
                          <div className="p-0.5 bg-gray-200 rounded-full border border-gray-300">
                            <Lock className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                        ) : task.completed ? (
                          <div className="p-0.5 bg-green-100 rounded-full border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          </div>
                        ) : (
                          <div className="relative">
                            <Target className={cn("w-4 h-4 transition-all", isActive ? "text-primary" : "text-gray-400 group-hover:text-primary")} />
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 bg-primary/20 rounded-full"
                                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-muted-foreground opacity-70">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className={cn("text-xs font-semibold tracking-wide", isActive ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors')}>
                            {task.title}
                          </h3>
                        </div>
                        {!isActive && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isActive && !task.locked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="p-3 pt-0 pl-10 pr-3 pb-4">
                          <div className="text-[10px] text-gray-600 space-y-3">
                            <p className="leading-relaxed border-l-2 border-primary/20 pl-2 italic">
                              {task.description}
                            </p>

                            <div className="space-y-2 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                              <p className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider text-[9px]">
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

                            {task.hint && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-700">
                                <p className="flex gap-2">
                                  <span className="font-bold">💡 HINT:</span> <span>{task.hint}</span>
                                </p>
                              </div>
                            )}

                            {task.completed ? (
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-100 border border-green-200 rounded-lg p-2 text-green-700 text-center"
                              >
                                <p className="font-bold flex items-center justify-center gap-1.5 tracking-wider uppercase">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mission Complete
                                </p>
                              </motion.div>
                            ) : isActive && onSkipTask && (
                              <div className="mt-3 p-2 border border-amber-200 rounded-lg bg-amber-50">
                                <p className="text-[10px] text-amber-700 mb-2">Having trouble? You can skip this task and come back later.</p>
                                <button
                                  onClick={() => onSkipTask(task.id)}
                                  className="w-full px-2 py-1 text-[10px] bg-white border border-amber-300 rounded text-amber-700 hover:bg-amber-100 transition-all duration-200 shadow-sm"
                                >
                                  Skip Task
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {allComplete && (
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 shrink-0">
            <CardContent className="p-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring" }}
                className="text-3xl mb-2 inline-block"
              >🎉</motion.div>
              <p className="text-foreground font-bold text-sm uppercase tracking-widest">Training Complete</p>
              <p className="text-green-400 text-xs mt-1">Ready for the next module!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};
