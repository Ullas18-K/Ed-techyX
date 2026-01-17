import { motion } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  Brain, 
  Clock, 
  Target, 
  FlaskConical, 
  ListChecks,
  Play,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';

interface LearningPlanScreenProps {
  onStart: () => void;
}

export function LearningPlanScreen({ onStart }: LearningPlanScreenProps) {
  const { currentScenario } = useLearningStore();

  if (!currentScenario) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto p-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-success text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Learning Experience Generated</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Your AI-Generated Learning Journey
        </h1>
        <p className="text-muted-foreground text-lg">
          Personalized just for you based on your question
        </p>
      </motion.div>

      {/* Main info cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Topic card */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-3xl p-6 hover-lift"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {currentScenario.topic}
              </h2>
              <p className="text-muted-foreground text-sm">{currentScenario.subject}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: GraduationCap, label: 'Level', value: currentScenario.level, color: 'text-primary' },
              { icon: Brain, label: 'Style', value: currentScenario.learningStyle, color: 'text-accent' },
              { icon: Clock, label: 'Duration', value: currentScenario.estimatedTime, color: 'text-warning' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center p-3 glass-subtle rounded-xl">
                <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scenario card */}
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-3xl p-6 border-primary/20 hover-lift"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">AI-Generated Scenario</h3>
          </div>
          <p className="text-foreground/80 leading-relaxed italic text-lg">
            "{currentScenario.scenario}"
          </p>
        </motion.div>
      </div>

      {/* Concepts and Objectives */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Concepts */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-3xl p-6 hover-lift"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-info/10">
              <Target className="w-5 h-5 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Key Concepts</h3>
          </div>
          <ul className="space-y-3">
            {currentScenario.concepts.map((concept, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 text-foreground/80"
              >
                <div className="w-2 h-2 rounded-full bg-info" />
                <span>{concept}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Objectives */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-3xl p-6 hover-lift"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-success/10">
              <ListChecks className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Learning Objectives</h3>
          </div>
          <ul className="space-y-3">
            {currentScenario.objectives.map((objective, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 text-foreground/80"
              >
                <div className="w-6 h-6 rounded-lg border border-success/50 flex items-center justify-center text-xs text-success font-semibold bg-success/5">
                  {index + 1}
                </div>
                <span>{objective}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* What you'll do */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-6 mb-10 border-primary/20"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">What You Will Do</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Run experiments', 'Make choices', 'Observe outcomes', 'Answer questions'].map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="text-center p-4 glass-subtle rounded-2xl hover:glass-card transition-all cursor-default"
            >
              <p className="text-sm font-medium text-foreground">{action}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Start button */}
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <Button
          variant="hero"
          size="xl"
          onClick={onStart}
          className="gap-3 rounded-2xl"
        >
          <Play className="w-5 h-5" />
          <span>Start Simulation</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Your interactive learning experience awaits!
        </p>
      </motion.div>
    </motion.div>
  );
}