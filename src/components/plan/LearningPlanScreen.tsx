import { useState } from 'react';
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
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { StudyRoomModal } from '@/components/simulation/StudyRoomModal';

interface LearningPlanScreenProps {
  onStart: () => void;
}

export function LearningPlanScreen({ onStart }: LearningPlanScreenProps) {
  const { currentScenario } = useLearningStore();
  const [isStudyRoomModalOpen, setIsStudyRoomModalOpen] = useState(false);

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
      className="min-h-screen bg-gradient-mesh noise overflow-hidden flex flex-col"
    >
      {/* Header - Compact */}
      <motion.div variants={itemVariants} className="text-center pt-6 pb-4 px-8 flex-shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-success text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Learning Experience Generated</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Your AI-Generated Learning Journey
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Personalized learning experience tailored for you
        </p>
      </motion.div>

      {/* Main content - Non-scrollable grid */}
      <div className="flex-1 overflow-hidden px-12 pb-6 flex justify-center">
        <div className="w-full max-w-5xl h-full flex flex-col gap-4">
          {/* Row 1: Topic and Scenario */}
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            {/* Topic card */}
            <motion.div
              variants={itemVariants}
              className="glass-panel rounded-xl p-4 hover-lift col-span-1"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-foreground mb-0.5 line-clamp-2">
                    {currentScenario.topic}
                  </h2>
                  <p className="text-muted-foreground text-xs">{currentScenario.subject}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: GraduationCap, label: 'Level', value: currentScenario.level },
                  { icon: Brain, label: 'Style', value: currentScenario.learningStyle },
                  { icon: Clock, label: 'Duration', value: currentScenario.estimatedTime },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center p-2 glass-subtle rounded-lg">
                    <div className="flex items-center justify-center text-primary mb-0.5">
                      <Icon className="w-3 h-3" />
                    </div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-semibold text-foreground truncate">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Scenario card */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-xl p-4 border-primary/20 hover-lift col-span-2"
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">AI-Generated Scenario</h3>
              </div>
              <p className="text-foreground/80 leading-relaxed italic text-xs line-clamp-3">
                "{currentScenario.scenario}"
              </p>
            </motion.div>
          </div>

          {/* Row 2: Concepts and Objectives */}
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {/* Concepts */}
            <motion.div
              variants={itemVariants}
              className="glass-panel rounded-xl p-4 hover-lift overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-info/10 flex-shrink-0">
                  <Target className="w-4 h-4 text-info" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Key Concepts</h3>
              </div>
              <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                {currentScenario.concepts.slice(0, 4).map((concept, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 text-foreground/80 text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-info mt-1 flex-shrink-0" />
                    <span className="line-clamp-1">{concept}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Objectives */}
            <motion.div
              variants={itemVariants}
              className="glass-panel rounded-xl p-4 hover-lift overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-success/10 flex-shrink-0">
                  <ListChecks className="w-4 h-4 text-success" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Learning Objectives</h3>
              </div>
              <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                {currentScenario.objectives.slice(0, 4).map((objective, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 text-foreground/80 text-xs"
                  >
                    <div className="w-4 h-4 rounded-lg border border-success/50 flex items-center justify-center text-xs text-success font-semibold bg-success/5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="line-clamp-1">{objective}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Row 3: What you'll do and Study button */}
          <div className="flex gap-4 flex-shrink-0">
            {/* What you'll do */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-xl p-4 border-primary/20 flex-1"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <FlaskConical className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">What You Will Do</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['Run experiments', 'Make choices', 'Observe outcomes', 'Answer questions'].map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    className="text-center p-2.5 glass-subtle rounded-lg hover:glass-card transition-all cursor-default"
                  >
                    <p className="text-xs font-medium text-foreground line-clamp-2">{action}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Study with Others Button */}
            <motion.div
              variants={itemVariants}
              className="flex-shrink-0 flex items-center"
            >
              <Button
                variant="hero"
                size="sm"
                onClick={() => setIsStudyRoomModalOpen(true)}
                className="gap-2 rounded-lg text-xs h-full min-w-36 px-4 py-2"
              >
                <Users className="w-4 h-4" />
                <span>Study with Others</span>
              </Button>
            </motion.div>
          </div>

          {/* Row 4: Start Simulation Button */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 mt-auto w-96 mx-auto"
          >
            <Button
              variant="hero"
              size="sm"
              onClick={onStart}
              className="gap-2 rounded-lg w-full text-xs h-9"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Simulation</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Study Room Modal */}
      <StudyRoomModal
        isOpen={isStudyRoomModalOpen}
        onClose={() => setIsStudyRoomModalOpen(false)}
        simulationType={currentScenario.simulation.type}
        topic={currentScenario.topic}
        subject={currentScenario.subject}
        onRoomCreated={() => {
          // Modal closes on creation
        }}
      />
    </motion.div>
  );
}