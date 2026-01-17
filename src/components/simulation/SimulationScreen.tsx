import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronDown, ChevronUp, ArrowRight, BookOpen,
  FileText, Lightbulb, GraduationCap, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { SimulationAIBot } from './SimulationAIBot';
<<<<<<< HEAD
import { Translate } from '@/components/Translate';
=======
import { TextToSpeech } from './TextToSpeech';
>>>>>>> 6091495 (implemented cloud TTS)

interface SimulationScreenProps {
  onComplete: () => void;
}

export function SimulationScreen({ onComplete }: SimulationScreenProps) {
  const navigate = useNavigate();
  const {
    currentScenario,
    aiScenarioData,
    pyqData
  } = useLearningStore();

  const [expandedConcepts, setExpandedConcepts] = useState<Set<number>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'notes' | 'formulas'>('notes');

  const toggleConcept = (index: number) => {
    const newExpanded = new Set(expandedConcepts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedConcepts(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  if (!currentScenario || !aiScenarioData) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading learning content...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 glass-strong flex-shrink-0">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-xl text-foreground">{aiScenarioData.title}</h1>
            <p className="text-sm text-muted-foreground">
              Class {aiScenarioData.gradeLevel} • {aiScenarioData.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate('/');
              toast('Returning to home...', { icon: '🏠' });
            }}
            className="gap-2"
          >
            <Home className="w-4 h-4" /> <Translate>Home</Translate>
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={onComplete}
            className="gap-2"
          >
            <Translate>Continue to Quiz</Translate> <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN - AI Theory */}
        <div className="w-1/2 border-r border-border/50 overflow-y-auto p-6 space-y-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
<<<<<<< HEAD
              <div>
                <h3 className="font-semibold text-foreground mb-2"><Translate>Welcome!</Translate></h3>
=======
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
<<<<<<< HEAD
                  <h3 className="font-semibold text-foreground">Welcome!</h3>
                  <TextToSpeech 
                    text={aiScenarioData.greeting} 
=======
                  <h3 className="font-semibold text-foreground"><Translate>Welcome!</Translate></h3>
                  <TextToSpeech
                    text={aiScenarioData.greeting}
>>>>>>> 7ddcdce (Enhanced PYQ section)
                    autoPlay={true}
                  />
                </div>
>>>>>>> 6091495 (implemented cloud TTS)
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiScenarioData.greeting}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Scenario Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-5"
          >
<<<<<<< HEAD
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <Translate>Overview</Translate>
            </h3>
=======
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Overview
              </h3>
              <TextToSpeech text={aiScenarioData.scenarioDescription} />
            </div>
>>>>>>> 6091495 (implemented cloud TTS)
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {aiScenarioData.scenarioDescription}
            </p>
          </motion.div>

          {/* Key Concepts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-5"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <Translate>Key Concepts</Translate>
            </h3>
            <div className="space-y-2">
              {aiScenarioData.keyConcepts.map((concept, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="border border-border/50 rounded-lg overflow-hidden group"
                >
                  <button
                    onClick={() => toggleConcept(index)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                        {concept.stepNumber}
                      </span>
                      <span className="text-sm font-medium text-foreground text-left">
                        {concept.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextToSpeech
                          text={`${concept.description}. ${concept.details}`}
                        />
                      </div>
                      {expandedConcepts.has(index) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedConcepts.has(index) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 text-sm text-muted-foreground bg-accent/20 border-t border-border/50">
                          {concept.details}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Notes & Formulas Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-5"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'notes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('notes')}
                className="flex-1"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <Translate>Notes</Translate>
              </Button>
              <Button
                variant={activeTab === 'formulas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('formulas')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                <Translate>Formulas & Derivations</Translate>
              </Button>
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comprehensive Notes</h4>
                    {aiScenarioData.notes && (
                      <TextToSpeech text={aiScenarioData.notes} />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {aiScenarioData.notes ? (
                      <div className="whitespace-pre-wrap">{aiScenarioData.notes}</div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground/50">No notes available</p>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'formulas' && (
                <div className="space-y-4">
                  {/* Formulas List */}
                  {currentScenario.formulas && currentScenario.formulas.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-foreground mb-2">Formulas:</h4>
                      {currentScenario.formulas.map((formula, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-secondary/30 rounded-lg border border-border/50 font-mono text-xs break-words"
                        >
                          {formula}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Markdown Derivations */}
                  {currentScenario.derivations && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm text-foreground mb-2">Derivations:</h4>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {typeof currentScenario.derivations === 'string'
                            ? currentScenario.derivations
                            : JSON.stringify(currentScenario.derivations)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {(!currentScenario.formulas || currentScenario.formulas.length === 0) &&
                    !currentScenario.derivations && (
                      <p className="text-center py-8 text-muted-foreground/50">No formulas or derivations available</p>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - PYQ Practice Panel */}
        <div className="w-1/2 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <Translate>Practice Questions</Translate>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <Translate>Previous Year Questions from NCERT</Translate>
                </p>
              </div>
              {pyqData && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{pyqData.totalCount}</span> questions
                </div>
              )}
            </div>

            {/* Questions List */}
            {pyqData && pyqData.questions.length > 0 ? (
              <div className="space-y-3">
                {pyqData.questions.map((question, index) => (
                  <motion.div
                    key={question.questionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="glass-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="p-4">
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {question.year && (
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                              {question.year}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-muted-foreground">
                            Q{index + 1}
                          </span>
                        </div>
                        {question.source === 'pyq' && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                            PYQ
                          </span>
                        )}
                        {question.source === 'generated' && (
                          <span className="text-xs bg-info/10 text-info px-2 py-1 rounded">
                            AI Generated
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {question.questionText}
                      </p>

                      {/* Image if available */}
                      {question.hasImage && question.imageUrl && (
                        <div className="mb-3">
                          <img
                            src={question.imageUrl}
                            alt={question.imageDescription || 'Question diagram'}
                            className="max-w-full h-auto rounded-lg border border-border/50"
                          />
                          {question.imageDescription && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {question.imageDescription}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show Answer Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleQuestion(question.questionId)}
                        className="w-full text-xs gap-2"
                      >
                        {expandedQuestions.has(question.questionId) ? (
                          <>
                            Hide Answer <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Show Answer <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </Button>

                      {/* Answer Section */}
                      <AnimatePresence>
                        {expandedQuestions.has(question.questionId) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                              {/* Answer Section */}
                              {question.answer && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="glass-card rounded-xl p-4 border-l-4 border-l-success"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-success/10 text-success">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <h5 className="text-sm font-bold text-foreground">Core Answer</h5>
                                  </div>
                                  <div className="prose prose-sm prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-strong:text-success prose-strong:font-bold">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    >
                                      {question.answer}
                                    </ReactMarkdown>
                                  </div>
                                </motion.div>
                              )}

                              {/* Explanation Section */}
                              {question.answerExplanation && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                  className="glass-card rounded-xl p-4 border-l-4 border-l-primary"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                      <Lightbulb className="w-4 h-4" />
                                    </div>
                                    <h5 className="text-sm font-bold text-foreground">Step-by-Step Explanation</h5>
                                  </div>
                                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed prose-headings:text-foreground prose-headings:text-sm prose-headings:font-bold prose-ol:list-decimal prose-ul:list-disc">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    >
                                      {question.answerExplanation}
                                    </ReactMarkdown>
                                  </div>
                                </motion.div>
                              )}

                              {/* Footer Info */}
                              <div className="flex items-center justify-between px-1">
                                {question.pageNumber && (
                                  <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground bg-accent/30 px-2 py-1 rounded-full border border-border/50">
                                    <BookOpen className="w-3 h-3" />
                                    <span>NCERT Page {question.pageNumber}</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-muted-foreground italic">
                                  Verified by AI Assistant
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  {pyqData
                    ? 'No practice questions available for this topic.'
                    : 'Loading practice questions...'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* AI Chatbot - Floating bottom-right */}
      {aiScenarioData && currentScenario && (
        <SimulationAIBot
          scenarioId={aiScenarioData.scenarioId}
          currentTaskId={1}
          context={{
            greeting: aiScenarioData.greeting,
            scenario: aiScenarioData.scenarioDescription,
            concepts: aiScenarioData.keyConcepts,
            simulationConfig: aiScenarioData.simulationConfig,
            learningObjectives: aiScenarioData.learningObjectives
          }}
        />
      )}
    </motion.div>
  );
}
