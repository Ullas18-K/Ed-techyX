import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  ListOrdered, 
  Globe, 
  GraduationCap, 
  ChevronRight,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';

interface ExplanationScreenProps {
  onComplete: () => void;
}

export function ExplanationScreen({ onComplete }: ExplanationScreenProps) {
  const { currentScenario } = useLearningStore();
  const [activeTab, setActiveTab] = useState('visual');

  if (!currentScenario) return null;

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'visual':
        return Eye;
      case 'step-by-step':
        return ListOrdered;
      case 'real-life':
        return Globe;
      case 'exam-tip':
        return GraduationCap;
      default:
        return Lightbulb;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-info text-sm font-semibold mb-4">
          <Lightbulb className="w-4 h-4" />
          <span>Deep Understanding</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Understanding {currentScenario.topic}
        </h1>
        <p className="text-muted-foreground text-lg">
          Multiple perspectives to solidify your learning
        </p>
      </motion.div>

      {/* Tabs with glass styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 glass-panel p-1.5 rounded-2xl h-auto">
            {currentScenario.explanations.map((explanation) => {
              const Icon = getTabIcon(explanation.type);
              return (
                <TabsTrigger
                  key={explanation.type}
                  value={explanation.type}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
                    "data-[state=active]:glass-card data-[state=active]:shadow-soft data-[state=active]:text-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{explanation.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {currentScenario.explanations.map((explanation) => (
            <TabsContent key={explanation.type} value={explanation.type}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={explanation.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel rounded-3xl p-6"
                >
                  {/* Visual diagram placeholder */}
                  {explanation.type === 'visual' && (
                    <div className="mb-6">
                      <div className="aspect-video glass-subtle rounded-2xl flex items-center justify-center">
                        <PhotosynthesisDiagram />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none">
                    {explanation.type === 'step-by-step' ? (
                      <div className="space-y-4">
                        {explanation.content.split('\n').map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 glass-subtle p-4 rounded-2xl"
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                              {index + 1}
                            </div>
                            <p className="text-foreground pt-1">{step.replace(/^\d+\.\s*/, '')}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-foreground leading-relaxed text-lg">
                        {explanation.content}
                      </p>
                    )}
                  </div>

                  {/* Exam tip callout */}
                  {explanation.type === 'exam-tip' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 p-5 glass-card rounded-2xl border-warning/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-warning/10">
                          <GraduationCap className="w-5 h-5 text-warning" />
                        </div>
                        <span className="font-bold text-foreground">Pro Tip</span>
                      </div>
                      <p className="text-foreground/80">
                        This concept is commonly asked in board exams. Make sure to memorize the equation!
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Key takeaways */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 glass-card rounded-3xl p-6 border-primary/20"
      >
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          Key Takeaways
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {currentScenario.concepts.slice(0, 4).map((concept, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-3 p-4 glass-subtle rounded-2xl hover:glass-card transition-all"
            >
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-foreground">{concept}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center"
      >
        <Button
          variant="hero"
          size="xl"
          onClick={onComplete}
          className="gap-3 rounded-2xl"
        >
          <span>Test Your Understanding</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Ready for a quick quiz?
        </p>
      </motion.div>
    </motion.div>
  );
}

// Simple SVG diagram for photosynthesis
function PhotosynthesisDiagram() {
  return (
    <svg viewBox="0 0 400 200" className="w-full max-w-md h-auto">
      {/* Sun */}
      <circle cx="50" cy="30" r="20" fill="hsl(38 92% 50%)" />
      <g stroke="hsl(38 92% 50%)" strokeWidth="2">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1={50 + Math.cos((angle * Math.PI) / 180) * 25}
            y1={30 + Math.sin((angle * Math.PI) / 180) * 25}
            x2={50 + Math.cos((angle * Math.PI) / 180) * 35}
            y2={30 + Math.sin((angle * Math.PI) / 180) * 35}
          />
        ))}
      </g>
      <text x="50" y="75" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        Sunlight
      </text>

      {/* Arrow to leaf */}
      <path d="M 80 40 L 130 80" stroke="hsl(38 92% 50%)" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* Leaf */}
      <ellipse cx="200" cy="100" rx="60" ry="30" fill="hsl(150 60% 45%)" />
      <ellipse cx="200" cy="100" rx="50" ry="25" fill="hsl(150 60% 50%)" />
      <line x1="140" y1="100" x2="260" y2="100" stroke="hsl(150 60% 35%)" strokeWidth="2" />
      <text x="200" y="105" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
        Chloroplast
      </text>

      {/* CO2 */}
      <text x="100" y="140" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" fontWeight="500">
        CO₂
      </text>
      <path d="M 115 135 L 145 115" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* H2O */}
      <text x="100" y="170" textAnchor="middle" fontSize="12" fill="hsl(200 80% 50%)" fontWeight="500">
        H₂O
      </text>
      <path d="M 115 165 L 150 125" stroke="hsl(200 80% 50%)" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* Outputs */}
      {/* O2 */}
      <path d="M 255 90 L 300 60" stroke="hsl(200 80% 50%)" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="320" y="55" textAnchor="middle" fontSize="12" fill="hsl(200 80% 50%)" fontWeight="500">
        O₂
      </text>

      {/* Glucose */}
      <path d="M 255 110 L 300 140" stroke="hsl(38 92% 50%)" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="340" y="150" textAnchor="middle" fontSize="12" fill="hsl(38 92% 50%)" fontWeight="500">
        C₆H₁₂O₆
      </text>
      <text x="340" y="165" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
        (Glucose)
      </text>

      {/* Arrow marker */}
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}