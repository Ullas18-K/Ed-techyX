import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check,
  X,
  ChevronDown,
  Star,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Formula {
  id: string;
  name: string;
  equation: string;
  variables: { symbol: string; meaning: string; unit: string }[];
  example?: string;
  starred?: boolean;
}

interface FormulaReferenceProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  topic: string;
}

const formulas: Record<string, Formula[]> = {
  biology: [
    {
      id: '1',
      name: 'Photosynthesis Equation',
      equation: '6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂',
      variables: [
        { symbol: 'CO₂', meaning: 'Carbon Dioxide', unit: 'molecules' },
        { symbol: 'H₂O', meaning: 'Water', unit: 'molecules' },
        { symbol: 'C₆H₁₂O₆', meaning: 'Glucose', unit: 'molecules' },
        { symbol: 'O₂', meaning: 'Oxygen', unit: 'molecules' }
      ],
      example: '6 molecules of CO₂ + 6 molecules of H₂O = 1 molecule of glucose + 6 molecules of O₂',
      starred: true
    },
    {
      id: '2',
      name: 'Respiration Equation',
      equation: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (ATP)',
      variables: [
        { symbol: 'C₆H₁₂O₆', meaning: 'Glucose', unit: 'molecules' },
        { symbol: 'O₂', meaning: 'Oxygen', unit: 'molecules' },
        { symbol: 'ATP', meaning: 'Adenosine Triphosphate', unit: 'energy currency' }
      ]
    },
    {
      id: '3',
      name: 'Rate of Photosynthesis',
      equation: 'Rate ∝ Light × CO₂ × Temperature (optimal)',
      variables: [
        { symbol: '∝', meaning: 'Proportional to', unit: '-' },
        { symbol: 'Rate', meaning: 'Photosynthesis rate', unit: 'ml O₂/min' }
      ]
    }
  ],
  physics: [
    {
      id: '1',
      name: "Ohm's Law",
      equation: 'V = I × R',
      variables: [
        { symbol: 'V', meaning: 'Voltage', unit: 'Volts (V)' },
        { symbol: 'I', meaning: 'Current', unit: 'Amperes (A)' },
        { symbol: 'R', meaning: 'Resistance', unit: 'Ohms (Ω)' }
      ],
      example: 'If V = 12V and R = 4Ω, then I = 12/4 = 3A',
      starred: true
    },
    {
      id: '2',
      name: 'Electrical Power',
      equation: 'P = V × I = I²R = V²/R',
      variables: [
        { symbol: 'P', meaning: 'Power', unit: 'Watts (W)' },
        { symbol: 'V', meaning: 'Voltage', unit: 'Volts (V)' },
        { symbol: 'I', meaning: 'Current', unit: 'Amperes (A)' }
      ],
      starred: true
    },
    {
      id: '3',
      name: 'Series Resistance',
      equation: 'R_total = R₁ + R₂ + R₃ + ...',
      variables: [
        { symbol: 'R_total', meaning: 'Total Resistance', unit: 'Ohms (Ω)' },
        { symbol: 'R₁, R₂', meaning: 'Individual Resistances', unit: 'Ohms (Ω)' }
      ],
      example: 'R₁ = 5Ω, R₂ = 10Ω → R_total = 15Ω'
    },
    {
      id: '4',
      name: 'Parallel Resistance',
      equation: '1/R_total = 1/R₁ + 1/R₂ + 1/R₃ + ...',
      variables: [
        { symbol: 'R_total', meaning: 'Equivalent Resistance', unit: 'Ohms (Ω)' },
        { symbol: 'R₁, R₂', meaning: 'Branch Resistances', unit: 'Ohms (Ω)' }
      ],
      example: 'R₁ = 10Ω, R₂ = 10Ω → R_total = 5Ω'
    },
    {
      id: '5',
      name: 'Electrical Energy',
      equation: 'E = P × t = V × I × t',
      variables: [
        { symbol: 'E', meaning: 'Energy', unit: 'Joules (J) or kWh' },
        { symbol: 'P', meaning: 'Power', unit: 'Watts (W)' },
        { symbol: 't', meaning: 'Time', unit: 'seconds (s)' }
      ]
    }
  ]
};

export function FormulaReference({ isOpen, onClose, subject, topic }: FormulaReferenceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [starredFormulas, setStarredFormulas] = useState<string[]>(['1']);

  const subjectKey = subject.toLowerCase();
  const allFormulas = formulas[subjectKey] || formulas.physics;
  
  const filteredFormulas = allFormulas.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.equation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (equation: string, id: string) => {
    navigator.clipboard.writeText(equation);
    setCopiedId(id);
    toast.success('Formula copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStar = (id: string) => {
    setStarredFormulas(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 right-4 w-[380px] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Formula Reference</h3>
                  <p className="text-xs text-muted-foreground">{subject} formulas</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Formulas list */}
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
            {filteredFormulas.map((formula) => (
              <motion.div
                key={formula.id}
                layout
                className="bg-secondary rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFormula(expandedFormula === formula.id ? null : formula.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-foreground text-sm">{formula.name}</h4>
                        {starredFormulas.includes(formula.id) && (
                          <Star className="w-3 h-3 text-warning fill-warning" />
                        )}
                      </div>
                      <p className="text-lg font-mono font-semibold text-primary">
                        {formula.equation}
                      </p>
                    </div>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ml-2",
                      expandedFormula === formula.id && "rotate-180"
                    )} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedFormula === formula.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3">
                        {/* Variables */}
                        <div className="bg-card rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Variables</p>
                          <div className="space-y-1.5">
                            {formula.variables.map((v, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-mono font-semibold text-accent">{v.symbol}</span>
                                <span className="text-muted-foreground">—</span>
                                <span className="text-foreground">{v.meaning}</span>
                                <span className="text-xs text-muted-foreground">({v.unit})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Example */}
                        {formula.example && (
                          <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                            <p className="text-xs font-medium text-success mb-1">Example</p>
                            <p className="text-sm text-foreground">{formula.example}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(formula.equation, formula.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === formula.id ? (
                              <><Check className="w-3 h-3" /> Copied!</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                          <button
                            onClick={() => toggleStar(formula.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                              starredFormulas.includes(formula.id)
                                ? "bg-warning/10 text-warning"
                                : "bg-card text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Star className={cn(
                              "w-3 h-3",
                              starredFormulas.includes(formula.id) && "fill-warning"
                            )} />
                            {starredFormulas.includes(formula.id) ? 'Starred' : 'Star'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
