// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Lightbulb, 
//   Brain, 
//   CheckCircle2, 
//   XCircle,
//   ArrowRight,
//   Sparkles
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';

// interface Prediction {
//   id: string;
//   question: string;
//   options: string[];
//   correct: number;
//   userAnswer?: number;
// }

// interface HypothesisModeProps {
//   isActive: boolean;
//   onClose: () => void;
//   simulationType: string;
//   onPredictionComplete: (correct: boolean) => void;
//   aiQuizQuestions?: Array<{
//     id: string;
//     question: string;
//     options: string[];
//     correctAnswer: string | number;
//     explanation: string;
//   }>;
// }

// const predictions: Record<string, Prediction[]> = {
//   photosynthesis: [
//     {
//       id: '1',
//       question: 'If you reduce sunlight intensity to 20%, what will happen to oxygen output?',
//       options: ['Increase', 'Stay the same', 'Decrease', 'Stop completely'],
//       correct: 2
//     },
//     {
//       id: '2',
//       question: 'If you increase CO₂ while keeping sunlight low, will plant health improve significantly?',
//       options: ['Yes, dramatically', 'Slightly improve', 'No change', 'It will get worse'],
//       correct: 2
//     },
//     {
//       id: '3',
//       question: 'At what temperature range will photosynthesis be most efficient?',
//       options: ['10-15°C', '25-35°C', '40-45°C', 'Temperature has no effect'],
//       correct: 1
//     }
//   ],
//   circuit: [
//     {
//       id: '1',
//       question: 'If you double the voltage while keeping resistance constant, what happens to current?',
//       options: ['Stays the same', 'Doubles', 'Halves', 'Quadruples'],
//       correct: 1
//     },
//     {
//       id: '2',
//       question: 'In a series circuit with two identical resistors, if you switch to parallel, what happens to brightness?',
//       options: ['Decreases', 'Stays the same', 'Increases', 'Bulbs go out'],
//       correct: 2
//     },
//     {
//       id: '3',
//       question: 'If you add a third resistor in series, what happens to total current?',
//       options: ['Increases', 'Decreases', 'Stays the same', 'Becomes zero'],
//       correct: 1
//     }
//   ]
// };

// export function HypothesisMode({ isActive, onClose, simulationType, onPredictionComplete }: HypothesisModeProps) {
//   const [currentPrediction, setCurrentPrediction] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
//   const [hasSubmitted, setHasSubmitted] = useState(false);
//   const [score, setScore] = useState(0);

//   const allPredictions = predictions[simulationType] || predictions.photosynthesis;
//   const prediction = allPredictions[currentPrediction];
//   const isCorrect = selectedAnswer === prediction?.correct;
//   const isComplete = currentPrediction >= allPredictions.length;

//   const handleSubmit = () => {
//     if (selectedAnswer === null) return;
//     setHasSubmitted(true);
    
//     if (isCorrect) {
//       setScore(s => s + 1);
//       onPredictionComplete(true);
//     } else {
//       onPredictionComplete(false);
//     }
//   };

//   const handleNext = () => {
//     setCurrentPrediction(c => c + 1);
//     setSelectedAnswer(null);
//     setHasSubmitted(false);
//   };

//   const handleRestart = () => {
//     setCurrentPrediction(0);
//     setSelectedAnswer(null);
//     setHasSubmitted(false);
//     setScore(0);
//   };

//   if (!isActive) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="absolute inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//     >
//       <motion.div
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full overflow-hidden"
//       >
//         {/* Header */}
//         <div className="p-4 bg-gradient-ai">
//           <div className="flex items-center gap-3">
//             <div className="p-2 rounded-lg bg-card/20">
//               <Brain className="w-6 h-6 text-primary-foreground" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-primary-foreground">Hypothesis Mode</h3>
//               <p className="text-sm text-primary-foreground/80">Predict before you experiment!</p>
//             </div>
//           </div>
//         </div>

//         <div className="p-6">
//           {isComplete ? (
//             // Completion screen
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="text-center py-6"
//             >
//               <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-ai flex items-center justify-center">
//                 <Sparkles className="w-10 h-10 text-primary-foreground" />
//               </div>
//               <h4 className="text-xl font-bold text-foreground mb-2">Predictions Complete!</h4>
//               <p className="text-muted-foreground mb-4">
//                 You got {score} out of {allPredictions.length} predictions correct.
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <Button variant="outline" onClick={handleRestart}>Try Again</Button>
//                 <Button onClick={onClose}>Start Experiment</Button>
//               </div>
//             </motion.div>
//           ) : (
//             <>
//               {/* Progress */}
//               <div className="flex items-center justify-between mb-4">
//                 <span className="text-sm text-muted-foreground">
//                   Question {currentPrediction + 1} of {allPredictions.length}
//                 </span>
//                 <span className="text-sm font-medium text-primary">
//                   Score: {score}
//                 </span>
//               </div>
//               <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
//                 <motion.div 
//                   className="h-full bg-gradient-hero"
//                   initial={{ width: 0 }}
//                   animate={{ width: `${((currentPrediction) / allPredictions.length) * 100}%` }}
//                 />
//               </div>

//               {/* Question */}
//               <div className="mb-6">
//                 <div className="flex items-start gap-3 mb-4">
//                   <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
//                   <p className="text-foreground font-medium">{prediction.question}</p>
//                 </div>

//                 {/* Options */}
//                 <div className="space-y-2">
//                   {prediction.options.map((option, index) => (
//                     <motion.button
//                       key={index}
//                       whileHover={{ scale: hasSubmitted ? 1 : 1.01 }}
//                       whileTap={{ scale: hasSubmitted ? 1 : 0.99 }}
//                       onClick={() => !hasSubmitted && setSelectedAnswer(index)}
//                       disabled={hasSubmitted}
//                       className={cn(
//                         "w-full p-4 rounded-xl text-left transition-all border-2",
//                         hasSubmitted && index === prediction.correct
//                           ? "bg-success/10 border-success text-success"
//                           : hasSubmitted && index === selectedAnswer && !isCorrect
//                             ? "bg-destructive/10 border-destructive text-destructive"
//                             : selectedAnswer === index
//                               ? "bg-primary/10 border-primary text-foreground"
//                               : "bg-secondary border-transparent text-secondary-foreground hover:bg-secondary/80"
//                       )}
//                     >
//                       <div className="flex items-center justify-between">
//                         <span>{option}</span>
//                         {hasSubmitted && index === prediction.correct && (
//                           <CheckCircle2 className="w-5 h-5 text-success" />
//                         )}
//                         {hasSubmitted && index === selectedAnswer && !isCorrect && (
//                           <XCircle className="w-5 h-5 text-destructive" />
//                         )}
//                       </div>
//                     </motion.button>
//                   ))}
//                 </div>
//               </div>

//               {/* Feedback */}
//               <AnimatePresence>
//                 {hasSubmitted && (
//                   <motion.div
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className={cn(
//                       "p-4 rounded-xl mb-4",
//                       isCorrect ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"
//                     )}
//                   >
//                     <p className="text-sm text-foreground">
//                       {isCorrect 
//                         ? "Excellent prediction! Your scientific intuition is developing well." 
//                         : `Good attempt! The correct answer is "${prediction.options[prediction.correct]}". Now run the experiment to see why!`
//                       }
//                     </p>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Actions */}
//               <div className="flex gap-3">
//                 <Button variant="outline" onClick={onClose} className="flex-1">
//                   Skip
//                 </Button>
//                 {!hasSubmitted ? (
//                   <Button 
//                     onClick={handleSubmit} 
//                     disabled={selectedAnswer === null}
//                     className="flex-1 gap-2"
//                   >
//                     Submit Prediction
//                   </Button>
//                 ) : (
//                   <Button onClick={handleNext} className="flex-1 gap-2">
//                     Next <ArrowRight className="w-4 h-4" />
//                   </Button>
//                 )}
//               </div>
//             </>
//           )}
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// }
