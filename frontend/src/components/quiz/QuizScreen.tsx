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
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { cn } from '@/lib/utils';
import { Translate } from '@/components/Translate';
import React from 'react';

interface QuizScreenProps {
  onComplete: () => void;
}

export function QuizScreen({ onComplete }: QuizScreenProps) {
  const {
    currentScenario,
    quizResults,
    currentQuizIndex,
    submitQuizAnswer,
    nextQuizQuestion,
    isAIGenerated
  } = useLearningStore();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!currentScenario) return null;

  const questions = currentScenario.quiz;
  const currentQuestion = questions[currentQuizIndex];
  const isLastQuestion = currentQuizIndex >= questions.length - 1;
  const currentResult = quizResults.find(r => r.questionId === currentQuestion?.id);

  // Debug logging
  React.useEffect(() => {
    console.log('📝 QuizScreen Debug:', {
      isAIGenerated,
      scenarioId: currentScenario.id,
      topic: currentScenario.topic,
      totalQuestions: questions.length,
      currentQuestionIndex: currentQuizIndex,
      currentQuestion: currentQuestion.question,
      firstQuestion: questions[0]?.question,
      allQuestions: questions.map(q => q.question)
    });
  }, [currentQuizIndex, currentScenario, questions, currentQuestion, isAIGenerated]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    // Handle both numeric index and letter-based correct answer (like "B")
    let correctAnswerIndex: number;
    if (typeof currentQuestion.correctAnswer === 'string') {
      // Convert "A", "B", "C", "D" to 0, 1, 2, 3
      correctAnswerIndex = currentQuestion.correctAnswer.charCodeAt(0) - 65;
    } else {
      correctAnswerIndex = currentQuestion.correctAnswer as number;
    }

    const isCorrect = selectedAnswer === correctAnswerIndex;
    submitQuizAnswer(currentQuestion.id, selectedAnswer, isCorrect);
    setShowFeedback(true);

    // Update score in real-time for study room
    const { roomId, updateMyScore } = useRealtimeStudyRoomStore.getState();
    if (roomId) {
      const currentScore = quizResults.filter(r => r.correct).length + (isCorrect ? 1 : 0);
      updateMyScore(currentScore);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate final score and submit to study room if in one
      const { roomId, submitScore } = useRealtimeStudyRoomStore.getState();
      if (roomId) {
        const finalScore = quizResults.filter(r => r.correct).length;
        const totalQuestions = questions.length;
        submitScore(finalScore, totalQuestions);
      }
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
      className="w-full max-w-6xl mx-auto px-3 py-3 flex flex-col gap-3"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center flex-shrink-0"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-primary text-xs font-semibold mb-2">
          <Trophy className="w-3 h-3" />
          <span><Translate>Quiz</Translate></span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          <Translate>Check Your Understanding</Translate>
        </h1>
        <p className="text-muted-foreground text-sm">
          <Translate>{`Let's see what you've learned about ${currentScenario.topic}`}</Translate>
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0"
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground font-medium">
            <Translate>{`Q${currentQuizIndex + 1}/${questions.length}`}</Translate>
          </span>
          <span className="font-semibold text-success">
            <Translate>{`${correctCount} correct`}</Translate>
          </span>
        </div>
        <div className="flex gap-1 p-1 glass-subtle rounded-full">
          {questions.map((_, index) => {
            const result = quizResults.find(r => r.questionId === questions[index].id);
            return (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
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
          className="glass-panel rounded-2xl p-4 flex-shrink-0"
        >
          {/* Question type badge */}
          <div className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full glass-subtle text-muted-foreground text-xs font-semibold mb-2">
            {currentQuestion.type === 'mcq' && 'MCQ'}
            {currentQuestion.type === 'truefalse' && 'T/F'}
            {currentQuestion.type === 'predict' && 'Predict'}
          </div>

          {/* Question text */}
          <h2 className="text-base font-bold text-foreground mb-3">
            <Translate>{currentQuestion.question}</Translate>
          </h2>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = selectedAnswer === index;
              // Handle both numeric index and letter-based correct answer
              let correctAnswerIndex: number;
              if (typeof currentQuestion.correctAnswer === 'string') {
                correctAnswerIndex = currentQuestion.correctAnswer.charCodeAt(0) - 65;
              } else {
                correctAnswerIndex = currentQuestion.correctAnswer as number;
              }
              const isCorrect = index === correctAnswerIndex;
              const showCorrectness = showFeedback;

              return (
                <motion.button
                  key={index}
                  whileHover={!showFeedback ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!showFeedback ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border-2 transition-all glass-subtle",
                    !showFeedback && isSelected && "border-primary bg-primary/5 glass-card",
                    !showFeedback && !isSelected && "border-transparent hover:border-primary/30 hover:glass-card",
                    showFeedback && isCorrect && "border-success bg-success/10",
                    showFeedback && !isCorrect && isSelected && "border-destructive bg-destructive/10",
                    showFeedback && !isCorrect && !isSelected && "border-transparent opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Option indicator */}
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0",
                      !showFeedback && isSelected && "bg-primary text-primary-foreground",
                      !showFeedback && !isSelected && "bg-muted text-muted-foreground",
                      showFeedback && isCorrect && "bg-success text-success-foreground",
                      showFeedback && !isCorrect && isSelected && "bg-destructive text-destructive-foreground",
                      showFeedback && !isCorrect && !isSelected && "bg-muted text-muted-foreground"
                    )}>
                      {showCorrectness && isCorrect ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : showCorrectness && isSelected && !isCorrect ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>

                    {/* Option text */}
                    <span className={cn(
                      "flex-1 text-foreground font-medium text-sm",
                      showFeedback && !isCorrect && !isSelected && "text-muted-foreground"
                    )}>
                      <Translate>{option}</Translate>
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
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="flex-shrink-0"
          >
            <div className={cn(
              "p-3 rounded-xl glass-card text-sm",
              currentResult?.correct
                ? "border border-success/30"
                : "border border-destructive/30"
            )}>
              <div className="flex items-center gap-1.5 mb-2">
                {currentResult?.correct ? (
                  <>
                    <div className="p-1 rounded-lg bg-success/10">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <span className="font-bold text-success text-xs"><Translate>Correct!</Translate></span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded-lg bg-destructive/10">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="font-bold text-destructive text-xs"><Translate>Not quite right</Translate></span>
                  </>
                )}
              </div>
              <p className="text-foreground/80 text-xs mb-2">
                <Translate>{currentQuestion.explanation}</Translate>
              </p>

              {/* Misconception warning */}
              {!currentResult?.correct && currentQuestion.misconception && (
                <div className="mt-2 p-2 glass-subtle rounded-lg border border-warning/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    <span className="text-xs font-bold text-warning"><Translate>Misconception</Translate></span>
                  </div>
                  <p className="text-xs text-foreground/70">
                    <Translate>{currentQuestion.misconception || ''}</Translate>
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
        className="flex justify-center gap-3 flex-shrink-0"
      >
        {!showFeedback ? (
          <Button
            variant="hero"
            size="sm"
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="gap-1.5 rounded-lg text-xs"
          >
            <span><Translate>Submit</Translate></span>
            <ChevronRight className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            variant="hero"
            size="sm"
            onClick={handleNextQuestion}
            className="gap-1.5 rounded-lg text-xs"
          >
            <span><Translate>{isLastQuestion ? 'Results' : 'Next'}</Translate></span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </motion.div>

      {/* Points display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center flex-shrink-0"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-accent text-xs">
          <Sparkles className="w-3 h-3" />
          <span className="text-xs font-semibold">
            <Translate>{`+${currentResult?.correct ? 20 : 0} pts`}</Translate>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}