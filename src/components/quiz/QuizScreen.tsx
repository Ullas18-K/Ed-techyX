import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowRight,
  Trophy,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';

interface QuizScreenProps {
  onComplete: () => void;
}

export function QuizScreen({ onComplete }: QuizScreenProps) {
  const { 
    currentScenario, 
    quizResults, 
    currentQuizIndex, 
    submitQuizAnswer, 
    nextQuizQuestion 
  } = useLearningStore();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!currentScenario) return null;

  const questions = currentScenario.quiz;
  const currentQuestion = questions[currentQuizIndex];
  const isLastQuestion = currentQuizIndex >= questions.length - 1;
  const currentResult = quizResults.find(r => r.questionId === currentQuestion?.id);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    submitQuizAnswer(currentQuestion.id, selectedAnswer, isCorrect);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      nextQuizQuestion();
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const correctCount = quizResults.filter(r => r.correct).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-primary text-sm font-semibold mb-4">
          <Trophy className="w-4 h-4" />
          <span>Quiz Time</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Check Your Understanding
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's see what you've learned about {currentScenario.topic}
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground font-medium">
            Question {currentQuizIndex + 1} of {questions.length}
          </span>
          <span className="font-semibold text-success">
            {correctCount} correct
          </span>
        </div>
        <div className="flex gap-1.5 p-1.5 glass-subtle rounded-full">
          {questions.map((_, index) => {
            const result = quizResults.find(r => r.questionId === questions[index].id);
            return (
              <div
                key={index}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  index === currentQuizIndex 
                    ? "bg-primary shadow-glow" 
                    : result 
                      ? result.correct 
                        ? "bg-success" 
                        : "bg-destructive"
                      : "bg-muted"
                )}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuizIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="glass-panel rounded-3xl p-6 mb-6"
        >
          {/* Question type badge */}
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full glass-subtle text-muted-foreground text-xs font-semibold mb-4">
            {currentQuestion.type === 'mcq' && 'Multiple Choice'}
            {currentQuestion.type === 'truefalse' && 'True or False'}
            {currentQuestion.type === 'predict' && 'Predict the Outcome'}
          </div>

          {/* Question text */}
          <h2 className="text-xl font-bold text-foreground mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrectness = showFeedback;

              return (
                <motion.button
                  key={index}
                  whileHover={!showFeedback ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!showFeedback ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all glass-subtle",
                    !showFeedback && isSelected && "border-primary bg-primary/5 glass-card",
                    !showFeedback && !isSelected && "border-transparent hover:border-primary/30 hover:glass-card",
                    showFeedback && isCorrect && "border-success bg-success/10",
                    showFeedback && !isCorrect && isSelected && "border-destructive bg-destructive/10",
                    showFeedback && !isCorrect && !isSelected && "border-transparent opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Option indicator */}
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors",
                      !showFeedback && isSelected && "bg-primary text-primary-foreground",
                      !showFeedback && !isSelected && "bg-muted text-muted-foreground",
                      showFeedback && isCorrect && "bg-success text-success-foreground",
                      showFeedback && !isCorrect && isSelected && "bg-destructive text-destructive-foreground",
                      showFeedback && !isCorrect && !isSelected && "bg-muted text-muted-foreground"
                    )}>
                      {showCorrectness && isCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : showCorrectness && isSelected && !isCorrect ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>

                    {/* Option text */}
                    <span className={cn(
                      "flex-1 text-foreground font-medium",
                      showFeedback && !isCorrect && !isSelected && "text-muted-foreground"
                    )}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mb-6"
          >
            <div className={cn(
              "p-5 rounded-2xl glass-card",
              currentResult?.correct 
                ? "border-success/30" 
                : "border-destructive/30"
            )}>
              <div className="flex items-center gap-2 mb-3">
                {currentResult?.correct ? (
                  <>
                    <div className="p-1.5 rounded-lg bg-success/10">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-bold text-success">Correct!</span>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 rounded-lg bg-destructive/10">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="font-bold text-destructive">Not quite right</span>
                  </>
                )}
              </div>
              <p className="text-foreground/80 text-sm">
                {currentQuestion.explanation}
              </p>
              
              {/* Misconception warning */}
              {!currentResult?.correct && currentQuestion.misconception && (
                <div className="mt-4 p-4 glass-subtle rounded-xl border border-warning/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-bold text-warning">Common Misconception</span>
                  </div>
                  <p className="text-xs text-foreground/70">
                    {currentQuestion.misconception}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-4"
      >
        {!showFeedback ? (
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="gap-2 rounded-xl"
          >
            <span>Submit Answer</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="hero"
            size="lg"
            onClick={handleNextQuestion}
            className="gap-2 rounded-xl"
          >
            <span>{isLastQuestion ? 'View Results' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Points display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-accent">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">
            +{currentResult?.correct ? 20 : 0} points this question
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}