import { motion } from 'framer-motion';
import { Calendar, Brain, Target, TrendingUp } from 'lucide-react';

interface ExamPlanningCardProps {
  onClick: () => void;
}

export const ExamPlanningCard = ({ onClick }: ExamPlanningCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div className="glass-panel p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-glow-sm hover:shadow-glow">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">AI-Powered</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            AI Exam Planner
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Get a personalized, NCERT-aligned study plan optimized for maximum marks in limited time
          </p>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Day-wise study schedule</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-warm" />
              <span>PYQ & formula prioritization</span>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            className="mt-4 pt-4 border-t border-border/50"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Create Your Plan</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
