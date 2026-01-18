import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { Translate } from '@/components/Translate';

interface LearningPlanScreenProps {
  onStart: () => void;
}

export function LearningPlanScreen({ onStart }: LearningPlanScreenProps) {
  const { currentScenario } = useLearningStore();
  const [isStudyRoomModalOpen, setIsStudyRoomModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentScenario) return null;

  // Determine which simulation page to navigate to based on topic/type
  const getSimulationRoute = () => {
    const topic = currentScenario.topic.toLowerCase();
    const simulationType = currentScenario.simulation?.type?.toLowerCase() || '';
    const combined = `${topic} ${simulationType}`;
    
    // Optics-related keywords (check first for priority)
    const opticsKeywords = [
      'ray optic', 'geometric optic', 'light', 'mirror', 'lens', 'reflection',
      'refraction', 'focal', 'image formation', 'concave', 'convex', 'prism',
      'spherical mirror', 'refract', 'reflect'
    ];
    
    // Chemistry-related keywords (more specific to avoid conflicts)
    const chemistryKeywords = [
      'acid', 'base', 'salt', 'chemical reaction', 'chemistry', 
      'neutralization', 'indicator', 'ph', 'litmus', 'phenolphthalein',
      'metal oxide', 'hydroxide', 'carbonate', 'bicarbonate',
      'sulfate', 'chloride', 'nitrate', 'alkali', 'corrosion',
      'titration', 'precipitation'
    ];
    
    // Check optics first (higher priority for 'ray optics' etc.)
    const isOptics = opticsKeywords.some(keyword => combined.includes(keyword));
    
    // Check chemistry
    const isChemistry = chemistryKeywords.some(keyword => combined.includes(keyword));
    
    if (isOptics) return '/optics';
    if (isChemistry) return '/chemistry';
    
    // Default fallback
    return '/simulation';
  };

  const simulationRoute = getSimulationRoute();

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
          <span><Translate>Learning Experience Generated</Translate></span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          <Translate>Your AI-Generated Learning Journey</Translate>
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          <Translate>Personalized learning experience tailored for you</Translate>
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
                    <Translate>{currentScenario.topic}</Translate>
                  </h2>
                  <p className="text-muted-foreground text-xs"><Translate>{currentScenario.subject}</Translate></p>
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
                    <p className="text-xs text-muted-foreground"><Translate>{label}</Translate></p>
                    <p className="text-xs font-semibold text-foreground truncate"><Translate>{value?.toString() || ''}</Translate></p>
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
                <h3 className="font-semibold text-foreground text-sm"><Translate>AI-Generated Scenario</Translate></h3>
              </div>
              <p className="text-foreground/80 leading-relaxed italic text-xs line-clamp-3">
                "<Translate>{currentScenario.scenario}</Translate>"
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
                <h3 className="font-semibold text-foreground text-sm"><Translate>Key Concepts</Translate></h3>
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
                    <span className="line-clamp-1"><Translate>{concept}</Translate></span>
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
                <h3 className="font-semibold text-foreground text-sm"><Translate>Learning Objectives</Translate></h3>
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
                    <span className="line-clamp-1"><Translate>{objective}</Translate></span>
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
                <h3 className="font-semibold text-foreground text-sm"><Translate>What You Will Do</Translate></h3>
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
                    <p className="text-xs font-medium text-foreground line-clamp-2"><Translate>{action}</Translate></p>
                  </motion.div>
                ))}
              </div>
            </motion.div>


          </div>

          {/* Row 4: Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 mt-auto flex flex-col sm:flex-row gap-3 w-full max-w-96 mx-auto"
          >
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate(simulationRoute)}
              className="gap-2 rounded-lg w-full text-xs h-9"
            >
              <Play className="w-3.5 h-3.5" />
              <span><Translate>Start Simulation</Translate></span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/simulation')}
              className="gap-2 rounded-lg w-full text-xs h-9 border-primary/20 hover:bg-primary/5 hover:text-foreground"
            >
              <Play className="w-3.5 h-3.5" />
              <span><Translate>Start Without Simulation</Translate></span>
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