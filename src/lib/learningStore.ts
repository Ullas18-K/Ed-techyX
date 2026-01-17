// Simple state management for the learning app
import { create } from 'zustand';
import { LearningScenario, findScenarioForQuestion } from './mockData';
import { toast } from 'sonner';
import { generateAIScenario, AIScenarioResponse, fetchPracticeQuestions, PYQResponse } from './aiService';

interface StudyNote {
  id: string;
  question: string;
  topic: string;
  timestamp: Date;
  notes: string;
  completed: boolean;
}

interface QuizResult {
  questionId: string;
  correct: boolean;
  selectedAnswer: number;
}

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'explore' | 'experiment' | 'observe' | 'analyze' | 'validate';
  completed: boolean;
  validationCriteria?: {
    type: 'value_check' | 'experiment_run' | 'observation' | 'time_spent';
    target?: number | string;
    threshold?: number;
  };
}

interface LearningState {
  // Current session
  currentQuestion: string;
  currentScenario: LearningScenario | null;
  currentPhase: 'home' | 'thinking' | 'plan' | 'simulation' | 'explanation' | 'quiz' | 'reflection' | 'mastery';
  isAIGenerated: boolean;
  isAIScenarioReady: boolean; // Flag to track when AI scenario is fully generated
  aiScenarioData: AIScenarioResponse | null;
  pyqData: PYQResponse | null;
  
  // Simulation state
  simulationValues: Record<string, number | boolean | string>;
  simulationResults: Record<string, number>;
  completedTasks: string[];
  learningSteps: LearningStep[];
  currentStepIndex: number;
  experimentCount: number;
  timeSpentInSimulation: number;
  
  // Quiz state
  quizResults: QuizResult[];
  currentQuizIndex: number;
  
  // Reflection state
  reflectionAnswers: Record<string, string>;
  
  // Progress tracking
  studyNotes: StudyNote[];
  topicsCovered: string[];
  totalPoints: number;
  
  // Actions
  setQuestion: (question: string) => void;
  setAIScenario: (topic: string, token: string) => Promise<void>;
  startLearning: () => void;
  setPhase: (phase: LearningState['currentPhase']) => void;
  updateSimulationValue: (id: string, value: number | boolean | string) => void;
  runExperiment: () => void;
  completeTask: (task: string) => void;
  checkStepCompletion: () => void;
  advanceToNextStep: () => void;
  initializeLearningSteps: () => void;
  submitQuizAnswer: (questionId: string, answer: number, correct: boolean) => void;
  nextQuizQuestion: () => void;
  saveReflection: (question: string, answer: string) => void;
  saveToNotes: (notes: string) => void;
  resetSession: () => void;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  // Initial state
  currentQuestion: '',
  currentScenario: null,
  currentPhase: 'home',
  isAIGenerated: false,
  isAIScenarioReady: false,
  aiScenarioData: null,
  pyqData: null,
  simulationValues: {},
  simulationResults: {},
  completedTasks: [],
  learningSteps: [],
  currentStepIndex: 0,
  experimentCount: 0,
  timeSpentInSimulation: 0,
  quizResults: [],
  currentQuizIndex: 0,
  reflectionAnswers: {},
  studyNotes: [],
  topicsCovered: [],
  totalPoints: 0,
  
  // Actions
  setQuestion: (question) => {
    const scenario = findScenarioForQuestion(question);
    const defaultValues: Record<string, number | boolean | string> = {};
    
    scenario.simulation.controls.forEach(control => {
      defaultValues[control.id] = control.default;
    });
    
    set({
      currentQuestion: question,
      currentScenario: scenario,
      isAIGenerated: false,
      isAIScenarioReady: false,
      aiScenarioData: null,
      pyqData: null,
      simulationValues: defaultValues,
      simulationResults: {},
      completedTasks: [],
      learningSteps: [],
      currentStepIndex: 0,
      experimentCount: 0,
      timeSpentInSimulation: 0,
      quizResults: [],
      currentQuizIndex: 0,
      reflectionAnswers: {},
    });
  },

  setAIScenario: async (topic: string, token: string) => {
    try {
      // Call both APIs in parallel
      console.log('🚀 Fetching AI scenario and PYQs in parallel...');
      const [aiData, pyqData] = await Promise.all([
        generateAIScenario(topic, token),
        fetchPracticeQuestions(topic, 10, 'science', token, 5, 'medium')
      ]);
      
      console.log('🔄 Converting AI scenario data...');
      console.log('📦 Full AI Data received:', JSON.stringify(aiData, null, 2));
      console.log('📚 PYQ Data received:', pyqData.totalCount, 'questions');
      console.log('📋 Scenario Description:', aiData.scenarioDescription);
      console.log('💡 Key Concepts:', aiData.keyConcepts);
      console.log('🎯 Learning Objectives:', aiData.learningObjectives);
      
      // Convert AI response to LearningScenario format
      // Extract safe values with defaults
      const simulationConfig = (aiData.simulationConfig || {}) as any;
      const simulationType = ((simulationConfig as any)?.type || 'photosynthesis') as any;
      
      const scenario: LearningScenario = {
        id: aiData.scenarioId,
        topic: aiData.title,
        subject: aiData.subject,
        level: `Class ${aiData.gradeLevel}`,
        learningStyle: 'AI-Powered Interactive',
        estimatedTime: aiData.estimatedDuration || '45 minutes',
        scenario: aiData.scenarioDescription,
        concepts: aiData.keyConcepts?.map(kc => kc.description) || [],
        objectives: aiData.learningObjectives?.map(lo => lo.description) || [],
        simulation: {
          type: simulationType,
          title: simulationConfig?.title || aiData.title,
          description: simulationConfig?.description || aiData.scenarioDescription,
          controls: (simulationConfig?.controls || []).map(ctrl => {
            const isDropdown = ctrl.controlType === 'dropdown';
            const control: any = {
              id: ctrl.name,
              label: ctrl.label,
              type: isDropdown ? 'select' : 'slider',
              unit: ctrl.unit || ''
            };
            
            if (isDropdown) {
              control.options = ctrl.options || [];
              control.default = ctrl.default || ctrl.options?.[0] || '';
            } else {
              control.min = ctrl.min ?? 0;
              control.max = ctrl.max ?? 100;
              control.step = ctrl.step ?? 1;
              control.default = ctrl.default ?? ctrl.min ?? 0;
            }
            
            return control;
          }),
          outputs: (simulationConfig?.outputs || []).map((out, i) => ({
            id: out,
            label: typeof out === 'string' ? out.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : out,
            unit: '',
            color: ['success', 'info', 'warning'][i % 3]
          })),
          tasks: aiData.tasks?.map(t => t.instruction) || [],
          tutorMessages: []
        },
        explanations: [{
          title: 'AI Generated Explanation',
          type: 'step-by-step',
          content: aiData.notes || ''
        }],
        quiz: (aiData.quiz || []).map((q, i) => {
          console.log(`📝 Mapping quiz question ${i}:`, {
            question: q.question,
            optionsCount: q.options?.length,
            correctAnswer: q.correctAnswer
          });
          return {
            id: `q${i}`,
            type: 'mcq',
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer || 0,
            explanation: q.explanation || 'Check the NCERT textbook for detailed explanation.'
          };
        }),
        reflections: [
          "What was the most surprising thing you learned?",
          "How would you explain this to a friend?",
          "What real-world applications can you think of?"
        ],
        examConnection: {
          ncertChapter: aiData.ncertChapter || aiData.title,
          boardRelevance: aiData.ncertPageRefs ? `Pages: ${aiData.ncertPageRefs.join(', ')}` : 'Check NCERT textbook',
          competitiveExams: []
        },
        formulas: aiData.formulas || [],
        notes: aiData.notes || aiData.scenarioDescription,
        derivations: (aiData as any).formulasAndDerivationsMarkdown || undefined
      };

      const defaultValues: Record<string, number | boolean | string> = {};
      scenario.simulation.controls.forEach(control => {
        defaultValues[control.id] = control.default;
      });

      console.log('✅ Scenario converted successfully');
      console.log('Scenario details:', {
        id: scenario.id,
        topic: scenario.topic,
        simulationType: scenario.simulation.type,
        controlsCount: scenario.simulation.controls.length,
        controls: scenario.simulation.controls.map(c => ({ id: c.id, label: c.label, default: c.default })),
        quizCount: scenario.quiz.length,
        firstQuizQuestion: scenario.quiz[0]?.question,
        allQuizQuestions: scenario.quiz.map(q => q.question),
        formulasCount: scenario.formulas?.length || 0,
        hasNotes: !!scenario.notes
      });

      set({
        currentQuestion: topic,
        currentScenario: scenario,
        isAIGenerated: true,
        isAIScenarioReady: true,
        aiScenarioData: aiData,
        pyqData: pyqData,
        simulationValues: defaultValues,
        simulationResults: {},
        completedTasks: [],
        learningSteps: [],
        currentStepIndex: 0,
        experimentCount: 0,
        timeSpentInSimulation: 0,
        quizResults: [],
        currentQuizIndex: 0,
        reflectionAnswers: {},
      });

      console.log('✅ State updated with AI scenario');
      console.log('📊 Final state check:', {
        currentScenarioId: scenario.id,
        currentScenarioQuizCount: scenario.quiz.length,
        firstQuestion: scenario.quiz[0]?.question
      });

      toast.success('🤖 AI scenario generated!', {
        description: aiData.title
      });

    } catch (error) {
      console.error('❌ Failed to generate AI scenario:', error);
      toast.error('AI service unavailable. Using legacy mode.');
      // Fallback to legacy
      get().setQuestion(topic);
    }
  },
  
  startLearning: () => {
    set({ currentPhase: 'thinking' });
  },
  
  setPhase: (phase) => {
    set({ currentPhase: phase });
  },
  
  updateSimulationValue: (id, value) => {
    set((state) => ({
      simulationValues: { ...state.simulationValues, [id]: value },
    }));
  },
  
  runExperiment: () => {
    const { simulationValues, currentScenario, isAIGenerated } = get();
    if (!currentScenario) return;
    
    // Increment experiment count and time
    set((state) => ({ 
      experimentCount: state.experimentCount + 1,
      timeSpentInSimulation: state.timeSpentInSimulation + 5 
    }));
    
    // Calculate mock results based on simulation type
    let results: Record<string, number> = {};
    
    if (currentScenario.simulation.type === 'photosynthesis') {
      const sunlight = (simulationValues.sunlight as number) || 50;
      const water = (simulationValues.water as number) || 50;
      const co2 = (simulationValues.co2 as number) || 50;
      const temp = (simulationValues.temperature as number) || 25;
      
      // Calculate outputs based on inputs
      const tempFactor = temp >= 20 && temp <= 35 ? 1 : 0.5;
      const efficiency = (sunlight + water + co2) / 3 * tempFactor;
      
      results = {
        health: Math.min(100, Math.round(efficiency)),
        oxygen: Math.round(efficiency * 0.8),
        sugar: Math.round(efficiency * 0.5),
      };
    } else if (currentScenario.simulation.type === 'circuit') {
      const voltage = (simulationValues.voltage as number) || 6;
      const r1 = (simulationValues.resistance1 as number) || 10;
      const r2 = (simulationValues.resistance2 as number) || 10;
      const circuitType = (simulationValues.circuitType as string) || 'series';
      
      const totalR = circuitType === 'series' ? r1 + r2 : (r1 * r2) / (r1 + r2);
      const current = voltage / totalR;
      const power = voltage * current;
      
      results = {
        current: Math.round(current * 100) / 100,
        power: Math.round(power * 100) / 100,
        brightness: Math.min(100, Math.round((current / 2) * 100)),
      };
    } else {
      // For AI-generated or other simulations - calculate generic results
      // Take all numeric control values and calculate outputs proportionally
      const controls = currentScenario.simulation.controls;
      const outputs = currentScenario.simulation.outputs;
      
      // Get all numeric values
      const numericValues = controls
        .filter(c => c.type === 'slider')
        .map(c => {
          const val = simulationValues[c.id] as number;
          const max = c.max || 100;
          return (val || c.default as number || 0) / max; // Normalize to 0-1
        });
      
      // Calculate average normalized value
      const avgNormalized = numericValues.length > 0 
        ? numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length 
        : 0.5;
      
      // Generate results for each output
      outputs.forEach((output, i) => {
        // Vary results slightly based on output index
        const variance = 0.8 + (i * 0.1); // 0.8, 0.9, 1.0, etc.
        const value = Math.round(avgNormalized * 100 * variance);
        results[output.id] = Math.min(100, Math.max(0, value));
      });
      
      console.log('🔬 Experiment Results:', {
        controls: controls.map(c => ({ id: c.id, value: simulationValues[c.id] })),
        outputs: results,
        avgNormalized,
        isAIGenerated
      });
    }
    
    set({ simulationResults: results });
    
    // Check step completion after experiment
    setTimeout(() => get().checkStepCompletion(), 500);
  },
  
  completeTask: (task) => {
    set((state) => ({
      completedTasks: [...state.completedTasks, task],
      totalPoints: state.totalPoints + 10,
    }));
  },
  
  submitQuizAnswer: (questionId, answer, correct) => {
    set((state) => ({
      quizResults: [...state.quizResults, { questionId, selectedAnswer: answer, correct }],
      totalPoints: state.totalPoints + (correct ? 20 : 0),
    }));
  },
  
  nextQuizQuestion: () => {
    set((state) => ({
      currentQuizIndex: state.currentQuizIndex + 1,
    }));
  },
  
  saveReflection: (question, answer) => {
    set((state) => ({
      reflectionAnswers: { ...state.reflectionAnswers, [question]: answer },
      totalPoints: state.totalPoints + 15,
    }));
  },
  
  saveToNotes: (notes) => {
    const { currentQuestion, currentScenario, studyNotes, topicsCovered } = get();
    if (!currentScenario) return;
    
    const newNote: StudyNote = {
      id: Date.now().toString(),
      question: currentQuestion,
      topic: currentScenario.topic,
      timestamp: new Date(),
      notes,
      completed: true,
    };
    
    set({
      studyNotes: [...studyNotes, newNote],
      topicsCovered: topicsCovered.includes(currentScenario.topic) 
        ? topicsCovered 
        : [...topicsCovered, currentScenario.topic],
    });
  },
  
  initializeLearningSteps: () => {
    const { currentScenario } = get();
    if (!currentScenario) return;

    const steps: LearningStep[] = [
      {
        id: 'step1',
        title: 'Explore the Controls',
        description: 'Familiarize yourself with all available controls and their effects',
        type: 'explore',
        completed: false,
        validationCriteria: { type: 'time_spent', threshold: 10 }
      },
      {
        id: 'step2',
        title: 'Run Your First Experiment',
        description: 'Adjust the parameters and observe what happens',
        type: 'experiment',
        completed: false,
        validationCriteria: { type: 'experiment_run', threshold: 1 }
      },
      {
        id: 'step3',
        title: 'Test Extremes',
        description: 'Try minimum and maximum values to understand limits',
        type: 'experiment',
        completed: false,
        validationCriteria: { type: 'experiment_run', threshold: 3 }
      },
      {
        id: 'step4',
        title: 'Find Optimal Conditions',
        description: 'Achieve the best possible output by balancing all factors',
        type: 'analyze',
        completed: false,
        validationCriteria: { type: 'value_check', target: 'health', threshold: 80 }
      },
      {
        id: 'step5',
        title: 'Understand Cause and Effect',
        description: 'Observe how changing one factor impacts the outputs',
        type: 'observe',
        completed: false,
        validationCriteria: { type: 'experiment_run', threshold: 5 }
      }
    ];

    set({ learningSteps: steps });
  },

  checkStepCompletion: () => {
    const { learningSteps, currentStepIndex, experimentCount, simulationResults, timeSpentInSimulation } = get();
    if (currentStepIndex >= learningSteps.length) return;

    const currentStep = learningSteps[currentStepIndex];
    if (currentStep.completed) return;

    let shouldComplete = false;

    if (currentStep.validationCriteria) {
      const { type, threshold, target } = currentStep.validationCriteria;

      switch (type) {
        case 'experiment_run':
          shouldComplete = experimentCount >= (threshold || 1);
          break;
        case 'value_check':
          if (target && simulationResults[target] !== undefined) {
            shouldComplete = simulationResults[target] >= (threshold || 0);
          }
          break;
        case 'time_spent':
          shouldComplete = timeSpentInSimulation >= (threshold || 0);
          break;
        case 'observation':
          shouldComplete = experimentCount >= 2;
          break;
      }
    }

    if (shouldComplete) {
      const updatedSteps = [...learningSteps];
      updatedSteps[currentStepIndex] = { ...currentStep, completed: true };
      
      // Show completion toast
      toast.success(`✅ ${currentStep.title} completed! +15 points`, {
        description: currentStepIndex < learningSteps.length - 1 
          ? `Next: ${learningSteps[currentStepIndex + 1].title}` 
          : 'All steps completed!',
      });
      
      set((state) => ({
        learningSteps: updatedSteps,
        totalPoints: state.totalPoints + 15,
        completedTasks: [...state.completedTasks, currentStep.title]
      }));

      // Auto-advance to next step
      setTimeout(() => {
        get().advanceToNextStep();
      }, 800);
    }
  },

  advanceToNextStep: () => {
    const { learningSteps, currentStepIndex } = get();
    if (currentStepIndex < learningSteps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  resetSession: () => {
    set({
      currentQuestion: '',
      currentScenario: null,
      currentPhase: 'home',
      isAIScenarioReady: false,
      simulationValues: {},
      simulationResults: {},
      completedTasks: [],
      learningSteps: [],
      currentStepIndex: 0,
      experimentCount: 0,
      timeSpentInSimulation: 0,
      quizResults: [],
      currentQuizIndex: 0,
      reflectionAnswers: {},
    });
  },
}));
