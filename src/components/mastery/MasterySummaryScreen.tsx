import { motion } from 'framer-motion';
import { Trophy, Target, BookOpen, Brain, Award, GraduationCap, Sparkles, RotateCcw, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center mb-10">
        <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-hero shadow-glow flex items-center justify-center">
          <Trophy className="w-14 h-14 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">🎉 Learning Complete!</h1>
        <p className="text-xl text-muted-foreground">You've mastered the basics of {currentScenario.topic}</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Sparkles, label: 'Total Points', value: totalPoints, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: Target, label: 'Quiz Score', value: `${correctAnswers}/${totalQuestions}`, color: 'text-success', bg: 'bg-success/10' },
          { icon: Brain, label: 'Reflections', value: reflectionCount, color: 'text-accent', bg: 'bg-accent/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 text-center hover-lift">
            <div className={cn("w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center", bg)}><Icon className={cn("w-7 h-7", color)} /></div>
            <p className="text-4xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">Confidence Level</h3></div>
        <div className="relative h-4 glass-subtle rounded-full overflow-hidden mb-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${masteryScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={cn("absolute h-full rounded-full", mastery.bg)} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>Beginner</span><span>Developing</span><span>Confident</span><span>Mastery</span></div>
        <div className="mt-4 text-center"><span className={cn("text-2xl font-bold", mastery.color)}>{mastery.level}</span></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-info" /><h3 className="font-bold text-foreground">Concepts Covered</h3></div>
        <div className="flex flex-wrap gap-2">
          {currentScenario.concepts.map((concept, index) => (
            <span key={index} className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm text-success border border-success/30"><span>✓</span><span>{concept}</span></span>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6 mb-8 border-warning/20">
        <div className="flex items-center gap-2 mb-4"><GraduationCap className="w-5 h-5 text-warning" /><h3 className="font-bold text-foreground">Exam Connection</h3></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><p className="text-xs text-muted-foreground mb-1">NCERT Chapter</p><p className="text-sm font-semibold text-foreground">{currentScenario.examConnection.ncertChapter}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Board Relevance</p><p className="text-sm font-semibold text-foreground">{currentScenario.examConnection.boardRelevance}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Competitive Exams</p><div className="flex flex-wrap gap-1">{currentScenario.examConnection.competitiveExams.map((exam, i) => (<span key={i} className="px-2 py-0.5 glass-subtle rounded text-xs text-warning font-semibold">{exam}</span>))}</div></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-4 justify-center">
        <Button variant="outline" size="lg" onClick={onRestart} className="gap-2 rounded-xl"><RotateCcw className="w-4 h-4" />Try Similar Question</Button>
        <Button variant="hero" size="xl" onClick={onNewQuestion} className="gap-2 rounded-2xl"><Sparkles className="w-5 h-5" />Ask New Question</Button>
        <Button variant="outline" size="lg" onClick={() => saveToNotes(`Completed learning session on ${currentScenario.topic}`)} className="gap-2 rounded-xl"><BookmarkPlus className="w-4 h-4" />Save to Study Notes</Button>
      </motion.div>
    </motion.div>
  );
}