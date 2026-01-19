import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, BookOpen, Download, Loader2, Sparkles, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { useState } from 'react';
import { useExamPlanningStore } from '@/lib/examPlanningStore';
import { useAuthStore } from '@/lib/authStore';
import { DailyPreview } from './DailyPreview';
import { LearningKitContent } from './LearningKitContent';

interface Subject {
  name: string;
  chapters: string[];
  timeSlot: string;
  estimatedTime: number;
}

interface DailyPlan {
  day: number;
  date: string;
  subjects: Subject[];
  rationale: string;
  preview: {
    coreConcepts: string[];
    learningObjectives: string[];
    importantSubtopics: string[];
  };
  learningKit?: any;
}

interface DailyPlanCardProps {
  dayPlan: DailyPlan;
  planId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const TIME_SLOT_COLORS = {
  morning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  afternoon: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  evening: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  night: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30'
};

const TIME_SLOT_ICONS = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon
};

export const DailyPlanCard = ({ dayPlan, planId, isExpanded, onToggle }: DailyPlanCardProps) => {
  const { fetchDailyContent, isLoadingDailyContent, currentPlan } = useExamPlanningStore();
  const { token } = useAuthStore();
  const [showLearningKit, setShowLearningKit] = useState(false);

  // Get the latest dayPlan from the store to ensure we have the updated learningKit
  const latestDayPlan = currentPlan?.dailyPlans.find(dp => dp.day === dayPlan.day) || dayPlan;

  const totalTime = latestDayPlan.subjects.reduce((sum, s) => sum + s.estimatedTime, 0);
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;

  const handleLoadLearningKit = async () => {
    // Check if learningKit exists AND has actual data
    const hasData = latestDayPlan.learningKit && (
      latestDayPlan.learningKit.notes ||
      (latestDayPlan.learningKit.derivations && latestDayPlan.learningKit.derivations.length > 0) ||
      (latestDayPlan.learningKit.formulas && latestDayPlan.learningKit.formulas.length > 0) ||
      (latestDayPlan.learningKit.pyqs && latestDayPlan.learningKit.pyqs.length > 0)
    );

    // Open modal first to show loading state
    setShowLearningKit(true);

    if (!hasData && token) {
      console.log(`📚 Fetching learning kit for Day ${latestDayPlan.day}...`);
      const startTime = Date.now();
      try {
        await fetchDailyContent(planId, latestDayPlan.day, token);
        const duration = Date.now() - startTime;
        const wasCached = duration < 1000; // Sub-second = cache hit
        console.log(`${wasCached ? '⚡' : '✅'} Learning kit ${wasCached ? 'loaded from cache' : 'generated'} for Day ${latestDayPlan.day} (${duration}ms)`);
      } catch (error) {
        console.error(`❌ Failed to load learning kit for Day ${latestDayPlan.day}:`, error);
        setShowLearningKit(false); // Close modal on error
      }
    } else if (hasData) {
      console.log(`⚡ Learning kit already loaded for Day ${latestDayPlan.day} (pre-generated)`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <motion.div
      layout
      className="glass-panel rounded-2xl border border-border/50 hover:border-primary/30 transition-all overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <span className="text-xs text-muted-foreground">Day</span>
            <span className="text-xl font-bold text-primary">{latestDayPlan.day}</span>
          </div>

          <div className="text-left">
            <h4 className="font-semibold text-foreground">{formatDate(latestDayPlan.date)}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {hours}h {minutes}m
              </span>
              <span className="text-muted-foreground">•</span>
              <BookOpen className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {latestDayPlan.subjects.length} subject{latestDayPlan.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/50"
          >
            <div className="p-4 space-y-4">
              {/* Rationale */}
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-foreground">
                  <strong>Why this schedule:</strong> {latestDayPlan.rationale}
                </p>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-foreground">Today's Schedule</h5>
                {latestDayPlan.subjects.map((subject, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl bg-gradient-to-r ${TIME_SLOT_COLORS[subject.timeSlot as keyof typeof TIME_SLOT_COLORS] || TIME_SLOT_COLORS.morning} border`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {(() => {
                            const IconComponent = TIME_SLOT_ICONS[subject.timeSlot as keyof typeof TIME_SLOT_ICONS] || TIME_SLOT_ICONS.morning;
                            return <IconComponent className="w-4 h-4 text-primary" />;
                          })()}
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {subject.timeSlot}
                          </span>
                        </div>
                        <h6 className="font-semibold text-foreground">{subject.name}</h6>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {subject.chapters.map((chapter, chIdx) => (
                            <span
                              key={chIdx}
                              className="text-xs px-2 py-0.5 rounded-full bg-background/50 text-foreground"
                            >
                              {chapter}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {Math.floor(subject.estimatedTime / 60)}h {subject.estimatedTime % 60}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <DailyPreview preview={latestDayPlan.preview} />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleLoadLearningKit}
                  disabled={isLoadingDailyContent}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-glow transition-all disabled:opacity-50"
                >
                  {isLoadingDailyContent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>View Learning Kit</span>
                    </>
                  )}
                </button>

                <button className="px-4 py-2.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors">
                  <Download className="w-4 h-4 text-primary" />
                </button>
              </div>

              {/* Learning Kit Modal */}
              {showLearningKit && (
                <>
                  {isLoadingDailyContent ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="glass-panel p-8 rounded-3xl border border-primary/20 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-lg font-semibold text-foreground">Generating Learning Kit...</p>
                        <p className="text-sm text-muted-foreground">Fetching NCERT content and creating materials</p>
                      </div>
                    </div>
                  ) : latestDayPlan.learningKit ? (
                    <LearningKitContent
                      learningKit={latestDayPlan.learningKit}
                      day={latestDayPlan.day}
                      onClose={() => setShowLearningKit(false)}
                    />
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
