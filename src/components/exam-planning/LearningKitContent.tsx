import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calculator, BookOpen, Award, Download } from 'lucide-react';
import { useState } from 'react';

interface Derivation {
  title: string;
  steps: string[];
  difficulty: string;
}

interface Formula {
  name: string;
  formula: string;
  application: string;
  units: string;
}

interface PYQ {
  question: string;
  year: number;
  examBoard: string;
  marks: number;
  solution: string;
  difficulty: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface LearningKit {
  notes: string;
  derivations: Derivation[];
  formulas: Formula[];
  pyqs: PYQ[];
  tips: string[];
  commonMistakes: string[];
  scenarios?: any[]; // Scenario objects from AI service
  practiceQuestions?: any[]; // Practice question objects
}

interface LearningKitContentProps {
  learningKit: LearningKit;
  day: number;
  onClose: () => void;
}

const DIFFICULTY_COLORS = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  hard: 'text-red-500 bg-red-500/10 border-red-500/20'
};

export const LearningKitContent = ({ learningKit, day, onClose }: LearningKitContentProps) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'derivations' | 'formulas' | 'pyqs'>('notes');

  const tabs = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'derivations', label: 'Derivations', icon: Calculator, count: learningKit.derivations?.length || 0 },
    { id: 'formulas', label: 'Formulas', icon: BookOpen, count: Math.min(learningKit.formulas?.length || 0, 5) },
    { id: 'pyqs', label: 'PYQs', icon: Award, count: Math.min(learningKit.pyqs?.length || 0, 10) }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-3xl shadow-2xl border border-primary/20">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Day {day} Learning Kit</h2>
                <p className="text-sm text-muted-foreground mt-1">Complete study materials for today</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
                  <Download className="w-5 h-5 text-primary" />
                </button>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border/50 overflow-x-auto">
              <div className="flex gap-2 p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-primary text-white shadow-glow-sm'
                          : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                          activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {!learningKit.notes || learningKit.notes === '' ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Generating notes...</p>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">NCERT-Based Notes</h3>
                        </div>
                        <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {learningKit.notes}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Derivations Tab */}
                {activeTab === 'derivations' && (
                  <motion.div
                    key="derivations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {!learningKit.derivations || learningKit.derivations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Generating derivations...</p>
                      </div>
                    ) : (
                      learningKit.derivations.map((derivation, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-foreground">{derivation.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              DIFFICULTY_COLORS[derivation.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.medium
                            }`}>
                              {derivation.difficulty}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {derivation.steps.map((step, stepIdx) => (
                              <div key={stepIdx} className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Formulas Tab */}
                {activeTab === 'formulas' && (
                  <motion.div
                    key="formulas"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    {!learningKit.formulas || learningKit.formulas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Generating formulas...</p>
                      </div>
                    ) : (
                      learningKit.formulas.slice(0, 5).map((formula, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                          <h4 className="font-semibold text-foreground mb-2">{formula.name}</h4>
                          <div className="p-3 rounded-lg bg-background/50 font-mono text-primary mb-2">
                            {formula.formula}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Application:</span>
                              <p className="text-foreground">{formula.application}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Units:</span>
                              <p className="text-foreground">{formula.units}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* PYQs Tab */}
                {activeTab === 'pyqs' && (
                  <motion.div
                    key="pyqs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {!learningKit.pyqs || learningKit.pyqs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Generating PYQs...</p>
                      </div>
                    ) : (
                      learningKit.pyqs.slice(0, 10).map((pyq, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                {pyq.examBoard} {pyq.year}
                              </span>
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {pyq.marks} marks
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              DIFFICULTY_COLORS[pyq.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.medium
                            }`}>
                              {pyq.difficulty}
                            </span>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-foreground mb-2">Question:</h5>
                            <p className="text-sm text-foreground leading-relaxed">{pyq.question}</p>
                          </div>
                          {pyq.options && pyq.options.length > 0 && (
                            <div className="mb-3 space-y-1">
                              {pyq.options.map((option: string, optIdx: number) => (
                                <div key={optIdx} className="text-sm text-muted-foreground pl-4">
                                  {String.fromCharCode(65 + optIdx)}. {option}
                                </div>
                              ))}
                              {pyq.correctAnswer && (
                                <div className="text-sm text-green-500 font-medium mt-2 pl-4">
                                  ✓ Correct Answer: {pyq.correctAnswer}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <h5 className="text-sm font-semibold text-primary mb-2">Solution:</h5>
                            <p className="text-sm text-foreground leading-relaxed">{pyq.solution || pyq.explanation}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
