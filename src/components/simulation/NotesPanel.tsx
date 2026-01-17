import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Bookmark,
  ChevronDown,
  Lightbulb,
  Copy,
  Check,
  X,
  StickyNote,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TopicNote {
  id: string;
  title: string;
  content: string;
  type: 'concept' | 'formula' | 'tip' | 'example';
}

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  subject: string;
  aiNotes?: string;
}

const topicNotes: Record<string, TopicNote[]> = {
  'Photosynthesis': [
    {
      id: '1',
      title: 'What is Photosynthesis?',
      content: 'Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. This process occurs primarily in the chloroplasts of plant cells.',
      type: 'concept'
    },
    {
      id: '2',
      title: 'The Equation',
      content: '6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\nCarbon Dioxide + Water + Light → Glucose + Oxygen',
      type: 'formula'
    },
    {
      id: '3',
      title: 'Light Reaction (Light-Dependent)',
      content: '• Occurs in thylakoid membranes\n• Requires light energy\n• Water molecules are split (photolysis)\n• ATP and NADPH are produced\n• Oxygen is released as a byproduct',
      type: 'concept'
    },
    {
      id: '4',
      title: 'Dark Reaction (Calvin Cycle)',
      content: '• Occurs in the stroma\n• Does not directly require light\n• Uses ATP and NADPH from light reaction\n• CO₂ is fixed into glucose\n• Also called carbon fixation',
      type: 'concept'
    },
    {
      id: '5',
      title: 'Factors Affecting Rate',
      content: '1. Light intensity - More light = faster rate (up to a point)\n2. CO₂ concentration - More CO₂ = faster rate\n3. Temperature - Optimal is 25-35°C\n4. Water availability - Essential for the process',
      type: 'tip'
    },
    {
      id: '6',
      title: 'Real World Application',
      content: 'Greenhouses control these factors to maximize plant growth:\n• Artificial lighting extends growing hours\n• CO₂ enrichment boosts production\n• Temperature regulation optimizes enzyme activity',
      type: 'example'
    }
  ],
  "Ohm's Law & Electric Circuits": [
    {
      id: '1',
      title: "What is Ohm's Law?",
      content: "Ohm's Law states that the current through a conductor between two points is directly proportional to the voltage across the two points, and inversely proportional to the resistance between them.",
      type: 'concept'
    },
    {
      id: '2',
      title: 'The Formula',
      content: 'V = I × R\n\nWhere:\n• V = Voltage (Volts, V)\n• I = Current (Amperes, A)\n• R = Resistance (Ohms, Ω)\n\nRearranged:\n• I = V/R\n• R = V/I',
      type: 'formula'
    },
    {
      id: '3',
      title: 'Series Circuits',
      content: '• Current is the same through all components\n• Total resistance = R₁ + R₂ + R₃...\n• Voltage is divided among components\n• If one component breaks, circuit opens',
      type: 'concept'
    },
    {
      id: '4',
      title: 'Parallel Circuits',
      content: '• Voltage is the same across all branches\n• 1/Rtotal = 1/R₁ + 1/R₂ + 1/R₃...\n• Current is divided among branches\n• If one branch breaks, others still work',
      type: 'concept'
    },
    {
      id: '5',
      title: 'Power Formula',
      content: 'P = V × I = I²R = V²/R\n\nWhere P = Power (Watts, W)\n\nPower tells us how much energy is used per second.',
      type: 'formula'
    }
  ]
};

const typeIcons = {
  concept: <BookOpen className="w-4 h-4" />,
  formula: <FileText className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
  example: <Bookmark className="w-4 h-4" />
};

const typeColors = {
  concept: 'bg-primary/10 text-primary border-primary/20',
  formula: 'bg-accent/10 text-accent border-accent/20',
  tip: 'bg-warning/10 text-warning border-warning/20',
  example: 'bg-success/10 text-success border-success/20'
};

export function NotesPanel({ isOpen, onClose, topicName, subject, aiNotes }: NotesPanelProps) {
  const [activeTab, setActiveTab] = useState<'topic' | 'personal'>('topic');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<{ id: string; content: string; timestamp: Date }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Use AI notes if available, otherwise fall back to topic notes
  const aiNotesConverted: TopicNote[] = aiNotes ? [{
    id: 'ai-1',
    title: 'AI Generated Notes',
    content: aiNotes,
    type: 'concept'
  }] : [];
  
  const notes = aiNotesConverted.length > 0 ? aiNotesConverted : (topicNotes[topicName] || topicNotes['Photosynthesis']);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveNote = () => {
    if (personalNotes.trim()) {
      setSavedNotes([...savedNotes, { 
        id: Date.now().toString(), 
        content: personalNotes, 
        timestamp: new Date() 
      }]);
      setPersonalNotes('');
      toast.success('Note saved!');
    }
  };

  const handleDownloadNotes = () => {
    const content = `
# ${topicName} - Study Notes
Subject: ${subject}
Date: ${new Date().toLocaleDateString()}

## Key Concepts
${notes.map(n => `### ${n.title}\n${n.content}`).join('\n\n')}

## My Personal Notes
${savedNotes.map(n => `- ${n.content}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topicName.replace(/\s+/g, '-')}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes downloaded!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 bottom-0 w-[400px] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Study Notes</h3>
                  <p className="text-xs text-muted-foreground">{topicName}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('topic')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'topic'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Topic Notes
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'personal'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                My Notes
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'topic' ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden",
                      typeColors[note.type]
                    )}
                  >
                    <button
                      onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        {typeIcons[note.type]}
                        <span className="font-medium text-sm">{note.title}</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        expandedNote === note.id && "rotate-180"
                      )} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedNote === note.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-0">
                            <div className="p-3 bg-card/50 rounded-lg">
                              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                                {note.content}
                              </pre>
                            </div>
                            <button
                              onClick={() => handleCopy(note.content, note.id)}
                              className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedId === note.id ? (
                                <><Check className="w-3 h-3" /> Copied!</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy to clipboard</>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Note input */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Add a note</span>
                  </div>
                  <Textarea
                    placeholder="Write your observations, questions, or key takeaways..."
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <Button onClick={handleSaveNote} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Save Note
                  </Button>
                </div>

                {/* Saved notes */}
                {savedNotes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Saved Notes</h4>
                    {savedNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-secondary rounded-xl">
                        <p className="text-sm text-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleDownloadNotes}
            >
              <Download className="w-4 h-4" />
              Download All Notes
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
