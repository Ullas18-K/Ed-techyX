import { motion } from 'framer-motion';
import { Trophy, Target, BookOpen, Brain, Award, GraduationCap, Sparkles, RotateCcw, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';
import { Translate } from '@/components/Translate';

interface MasterySummaryScreenProps {
  onRestart: () => void;
  onNewQuestion: () => void;
}

export function MasterySummaryScreen({ onRestart, onNewQuestion }: MasterySummaryScreenProps) {
  const { currentScenario, quizResults, reflectionAnswers, completedTasks, totalPoints, saveToNotes } = useLearningStore();
  if (!currentScenario) return null;

  const correctAnswers = quizResults.filter(r => r.correct).length;
  const totalQuestions = currentScenario.quiz.length;
  const quizScore = (correctAnswers / totalQuestions) * 100;
  const reflectionCount = Object.keys(reflectionAnswers).length;
  const masteryScore = (completedTasks.length / currentScenario.simulation.tasks.length) * 30 + quizScore * 0.5 + (reflectionCount / currentScenario.reflections.length) * 20;

  const getMasteryLevel = (score: number) => {
    if (score >= 90) return { level: 'Mastery', color: 'text-success', bg: 'bg-success' };
    if (score >= 70) return { level: 'Confident', color: 'text-primary', bg: 'bg-primary' };
    if (score >= 50) return { level: 'Developing', color: 'text-warning', bg: 'bg-warning' };
    return { level: 'Beginner', color: 'text-muted-foreground', bg: 'bg-muted' };
  };
  const mastery = getMasteryLevel(masteryScore);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl mx-auto px-3 py-4 flex flex-col gap-3">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center flex-shrink-0">
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-hero shadow-glow flex items-center justify-center">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1">🎉 <Translate>Learning Complete!</Translate></h1>
        <p className="text-base text-muted-foreground"><Translate>{`You've mastered the basics of ${currentScenario.topic}`}</Translate></p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-3 flex-shrink-0">
        {[
          { icon: Sparkles, label: 'Total Points', value: totalPoints, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: Target, label: 'Quiz Score', value: `${correctAnswers}/${totalQuestions}`, color: 'text-success', bg: 'bg-success/10' },
          { icon: Brain, label: 'Reflections', value: reflectionCount, color: 'text-accent', bg: 'bg-accent/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-3 text-center hover-lift flex-shrink-0">
            <div className={cn("w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center", bg)}><Icon className={cn("w-5 h-5", color)} /></div>
            <p className="text-2xl font-bold text-foreground"><Translate>{value?.toString() || ''}</Translate></p>
            <p className="text-xs text-muted-foreground"><Translate>{label}</Translate></p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2"><Award className="w-4 h-4 text-primary" /><h3 className="font-bold text-sm text-foreground"><Translate>Confidence Level</Translate></h3></div>
        <div className="relative h-3 glass-subtle rounded-full overflow-hidden mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: `${masteryScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={cn("absolute h-full rounded-full", mastery.bg)} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2"><span><Translate>Beginner</Translate></span><span><Translate>Developing</Translate></span><span><Translate>Confident</Translate></span><span><Translate>Mastery</Translate></span></div>
        <div className="text-center"><span className={cn("text-lg font-bold", mastery.color)}><Translate>{mastery.level}</Translate></span></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2"><BookOpen className="w-4 h-4 text-info" /><h3 className="font-bold text-sm text-foreground"><Translate>Concepts Covered</Translate></h3></div>
        <div className="flex flex-wrap gap-1.5">
          {currentScenario.concepts.map((concept, index) => (
            <span key={index} className="flex items-center gap-1 px-2.5 py-1 glass-card rounded-full text-xs text-success border border-success/30"><span>✓</span><span><Translate>{concept}</Translate></span></span>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-3 border-warning/20 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2"><GraduationCap className="w-4 h-4 text-warning" /><h3 className="font-bold text-sm text-foreground"><Translate>Exam Connection</Translate></h3></div>
        <div className="grid md:grid-cols-3 gap-2">
          <div><p className="text-xs text-muted-foreground mb-0.5"><Translate>NCERT Chapter</Translate></p><p className="text-xs font-semibold text-foreground"><Translate>{currentScenario.examConnection.ncertChapter}</Translate></p></div>
          <div><p className="text-xs text-muted-foreground mb-0.5"><Translate>Board Relevance</Translate></p><p className="text-xs font-semibold text-foreground"><Translate>{currentScenario.examConnection.boardRelevance}</Translate></p></div>
          <div><p className="text-xs text-muted-foreground mb-0.5"><Translate>Competitive Exams</Translate></p><div className="flex flex-wrap gap-0.5">{currentScenario.examConnection.competitiveExams.map((exam, i) => (<span key={i} className="px-1.5 py-0.5 glass-subtle rounded text-xs text-warning font-semibold"><Translate>{exam}</Translate></span>))}</div></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-2 justify-center flex-shrink-0">
        <Button variant="outline" size="sm" onClick={onRestart} className="gap-1.5 rounded-lg text-xs"><RotateCcw className="w-3 h-3" /><Translate>Try Similar</Translate></Button>
        <Button variant="hero" size="sm" onClick={onNewQuestion} className="gap-1.5 rounded-lg text-xs"><Sparkles className="w-3 h-3" /><Translate>New Question</Translate></Button>
        <Button variant="outline" size="sm" onClick={() => saveToNotes(`Completed learning session on ${currentScenario.topic}`)} className="gap-1.5 rounded-lg text-xs"><BookmarkPlus className="w-3 h-3" /><Translate>Save Notes</Translate></Button>
      </motion.div>
    </motion.div>
  );
}