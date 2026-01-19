import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, TrendingUp, Download, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { DailyPlanCard } from './DailyPlanCard';

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
}

interface StudyPlanDisplayProps {
  plan: {
    _id: string;
    examDate: string;
    totalDays: number;
    revisionDays: number;
    dailyStudyHours: number;
    subjects: { name: string; topics: string[] }[];
    dailyPlans: DailyPlan[];
    metadata: {
      totalChapters: number;
      totalTopics: number;
      estimatedTotalHours: number;
      difficultyLevel: string;
      examBoard: string;
    };
  };
}

export const StudyPlanDisplay = ({ plan }: StudyPlanDisplayProps) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // First day expanded by default

  const toggleDay = (day: number) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const daysUntilExam = Math.ceil(
    (new Date(plan.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const studyDays = plan.totalDays - plan.revisionDays;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="glass-panel p-6 rounded-2xl border border-primary/20">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Your Exam Plan Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Days Left</span>
            </div>
            <p className="text-2xl font-bold text-primary">{daysUntilExam}</p>
          </div>

          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Study Days</span>
            </div>
            <p className="text-2xl font-bold text-accent">{studyDays}</p>
          </div>

          <div className="p-4 rounded-xl bg-warm/10 border border-warm/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-warm" />
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-warm">{plan.metadata.estimatedTotalHours}</p>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Chapters</span>
            </div>
            <p className="text-2xl font-bold text-primary">{plan.metadata.totalChapters}</p>
          </div>
        </div>

        {/* Subjects */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Subjects Covered</h3>
          <div className="flex flex-wrap gap-2">
            {plan.subjects.map((subject, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
              >
                {subject.name}
              </div>
            ))}
          </div>
        </div>

        {/* Revision Info */}
        {plan.revisionDays > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong>{plan.revisionDays} days</strong> reserved for revision at the end
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Day-wise Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">Day-wise Study Plan</h3>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Export Plan</span>
          </button>
        </div>

        <div className="space-y-3">
          {plan.dailyPlans.map((dayPlan) => (
            <DailyPlanCard
              key={dayPlan.day}
              dayPlan={dayPlan}
              planId={plan._id}
              isExpanded={expandedDays.includes(dayPlan.day)}
              onToggle={() => toggleDay(dayPlan.day)}
            />
          ))}
        </div>

        {/* Revision Days Notice */}
        {plan.revisionDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-accent/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/20">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Revision Period</h4>
                <p className="text-sm text-muted-foreground">
                  The last {plan.revisionDays} days are dedicated to comprehensive revision.
                  Focus on PYQs, formula sheets, and weak areas during this time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
