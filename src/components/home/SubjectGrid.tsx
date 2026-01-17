import { motion } from 'framer-motion';
import { 
  Leaf, 
  Zap, 
  FlaskConical, 
  Calculator, 
  Globe, 
  Landmark, 
  ScrollText,
  Atom 
} from 'lucide-react';

const subjects = [
  { name: 'Biology', icon: Leaf, color: 'hsl(150 60% 45%)', bg: 'hsla(150, 60%, 45%, 0.12)' },
  { name: 'Physics', icon: Zap, color: 'hsl(200 80% 50%)', bg: 'hsla(200, 80%, 50%, 0.12)' },
  { name: 'Chemistry', icon: FlaskConical, color: 'hsl(280 70% 55%)', bg: 'hsla(280, 70%, 55%, 0.12)' },
  { name: 'Mathematics', icon: Calculator, color: 'hsl(38 92% 50%)', bg: 'hsla(38, 92%, 50%, 0.12)' },
  { name: 'Geography', icon: Globe, color: 'hsl(173 70% 42%)', bg: 'hsla(173, 70%, 42%, 0.12)' },
  { name: 'History', icon: Landmark, color: 'hsl(25 80% 50%)', bg: 'hsla(25, 80%, 50%, 0.12)' },
  { name: 'Civics', icon: ScrollText, color: 'hsl(340 75% 55%)', bg: 'hsla(340, 75%, 55%, 0.12)' },
  { name: 'Science', icon: Atom, color: 'hsl(220 80% 55%)', bg: 'hsla(220, 80%, 55%, 0.12)' },
];

export function SubjectGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="mt-20"
      layout={false}
      style={{ willChange: 'opacity, transform' }}
    >
      <h2 className="text-center text-lg font-semibold text-foreground/80 mb-8">
        Supports All Subjects • Class 1–12
      </h2>
      
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 max-w-4xl mx-auto">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.85 + index * 0.02, duration: 0.4 }}
            whileHover={{ scale: 1.08, y: -4 }}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl glass-card hover:shadow-medium transition-all duration-300 cursor-pointer group"
            layout={false}
          >
            <div 
              className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: subject.bg }}
            >
              <subject.icon 
                className="w-5 h-5 transition-all" 
                style={{ color: subject.color }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium text-center group-hover:text-foreground transition-colors">
              {subject.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}