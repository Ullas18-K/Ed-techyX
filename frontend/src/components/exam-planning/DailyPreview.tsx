import { motion } from 'framer-motion';
import { Lightbulb, Target, BookMarked } from 'lucide-react';

interface DailyPreviewProps {
  preview: {
    coreConcepts: string[];
    learningObjectives: string[];
    importantSubtopics: string[];
  };
}

export const DailyPreview = ({ preview }: DailyPreviewProps) => {
  return (
    <div className="space-y-3">
      <h5 className="text-sm font-semibold text-foreground">Daily Preview</h5>

      <div className="grid gap-3">
        {/* Core Concepts */}
        {preview.coreConcepts && preview.coreConcepts.length > 0 && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Core Concepts</span>
            </div>
            <ul className="space-y-1">
              {preview.coreConcepts.map((concept, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{concept}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Learning Objectives */}
        {preview.learningObjectives && preview.learningObjectives.length > 0 && (
          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent">Learning Objectives</span>
            </div>
            <ul className="space-y-1">
              {preview.learningObjectives.map((objective, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important Subtopics */}
        {preview.importantSubtopics && preview.importantSubtopics.length > 0 && (
          <div className="p-3 rounded-xl bg-warm/5 border border-warm/10">
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-4 h-4 text-warm" />
              <span className="text-xs font-semibold text-warm">Important Subtopics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {preview.importantSubtopics.map((subtopic, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-warm/10 text-foreground border border-warm/20"
                >
                  {subtopic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
