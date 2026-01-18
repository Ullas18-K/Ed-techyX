import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, BookOpen, Clock, ChevronRight, ChevronLeft, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { useExamPlanningStore } from '@/lib/examPlanningStore';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

interface ExamPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated?: () => void;
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];
const EXAM_BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];

export const ExamPlanningModal = ({ isOpen, onClose, onPlanGenerated }: ExamPlanningModalProps) => {
  const { generatePlan, isGenerating } = useExamPlanningStore();
  const { token } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    examDate: '',
    subjects: [] as string[],
    topics: '',
    dailyStudyHours: 6,
    grade: 12,
    examBoard: 'CBSE'
  });

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.examDate) {
      toast.error('Please select an exam date');
      return;
    }
    if (step === 2 && formData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    if (step === 3 && !formData.topics.trim()) {
      toast.error('Please enter topics to study');
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('Please login to create an exam plan');
      return;
    }

    try {
      const topicsArray = formData.topics
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await generatePlan(
        {
          examDate: formData.examDate,
          subjects: formData.subjects,
          topics: topicsArray,
          dailyStudyHours: formData.dailyStudyHours,
          grade: formData.grade,
          examBoard: formData.examBoard
        },
        token
      );

      toast.success('Exam plan generated successfully!');
      onPlanGenerated?.();
      onClose();
      
      // Reset form
      setFormData({
        examDate: '',
        subjects: [],
        topics: '',
        dailyStudyHours: 6,
        grade: 12,
        examBoard: 'CBSE'
      });
      setStep(1);
    } catch (error) {
      toast.error('Failed to generate exam plan');
    }
  };

  if (!isOpen) return null;

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
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-3xl shadow-2xl border border-primary/20">
            {/* Header */}
            <div className="relative p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">AI Exam Planner</h2>
                    <p className="text-sm text-muted-foreground">Step {step} of 4</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-destructive/10 transition-colors"
                  disabled={isGenerating}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1 bg-border/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: '25%' }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {/* Step 1: Exam Date */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">When is your exam?</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Exam Date
                        </label>
                        <input
                          type="date"
                          value={formData.examDate}
                          onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-xl glass-panel border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Grade/Class
                          </label>
                          <select
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl glass-panel border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          >
                            {[9, 10, 11, 12].map(grade => (
                              <option key={grade} value={grade}>Class {grade}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Exam Board
                          </label>
                          <select
                            value={formData.examBoard}
                            onChange={(e) => setFormData({ ...formData, examBoard: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl glass-panel border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          >
                            {EXAM_BOARDS.map(board => (
                              <option key={board} value={board}>{board}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Subjects */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Select your subjects</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {SUBJECTS.map(subject => (
                        <motion.button
                          key={subject}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSubjectToggle(subject)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.subjects.includes(subject)
                              ? 'border-primary bg-primary/10 shadow-glow-sm'
                              : 'border-border/30 hover:border-primary/30'
                          }`}
                        >
                          <span className={`font-medium ${
                            formData.subjects.includes(subject) ? 'text-primary' : 'text-foreground'
                          }`}>
                            {subject}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                      Selected: {formData.subjects.length} subject{formData.subjects.length !== 1 ? 's' : ''}
                    </p>
                  </motion.div>
                )}

                {/* Step 3: Topics */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">What topics do you need to cover?</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Topics (one per line)
                      </label>
                      <textarea
                        value={formData.topics}
                        onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                        placeholder="Example:&#10;Ray Optics&#10;Thermodynamics&#10;Calculus - Integration&#10;Electrochemistry"
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl glass-panel border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Enter specific chapters or topics you want to study
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Study Hours */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Daily study hours</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-4">
                        How many hours can you study per day?
                      </label>
                      
                      <div className="space-y-4">
                        <input
                          type="range"
                          min="2"
                          max="12"
                          step="1"
                          value={formData.dailyStudyHours}
                          onChange={(e) => setFormData({ ...formData, dailyStudyHours: parseInt(e.target.value) })}
                          className="w-full h-2 bg-border/30 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        
                        <div className="flex items-center justify-center">
                          <div className="px-6 py-3 rounded-xl bg-primary/10 border border-primary/20">
                            <span className="text-3xl font-bold text-primary">{formData.dailyStudyHours}</span>
                            <span className="text-sm text-muted-foreground ml-2">hours/day</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>2h</span>
                          <span>6h</span>
                          <span>12h</span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Pro Tip</p>
                            <p className="text-sm text-muted-foreground">Be realistic about your daily capacity. Quality matters more than quantity!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/50">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handleBack}
                  disabled={step === 1 || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </button>

                {step < 4 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-glow transition-all"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Plan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
