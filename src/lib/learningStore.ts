// Simple state management for the learning app
import { create } from 'zustand';
import { LearningScenario, findScenarioForQuestion } from './mockData';

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

interface LearningState {
  // Current session
  currentQuestion: string;
  currentScenario: LearningScenario | null;
  currentPhase: 'home' | 'thinking' | 'plan' | 'simulation' | 'explanation' | 'quiz' | 'reflection' | 'mastery';
  
  // Simulation state
  simulationValues: Record<string, number | boolean | string>;
  simulationResults: Record<string, number>;
  completedTasks: string[];
  
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
  startLearning: () => void;
  setPhase: (phase: LearningState['currentPhase']) => void;
  updateSimulationValue: (id: string, value: number | boolean | string) => void;
  runExperiment: () => void;
  completeTask: (task: string) => void;
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
  simulationValues: {},
  simulationResults: {},
  completedTasks: [],
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
      simulationValues: defaultValues,
      simulationResults: {},
      completedTasks: [],
      quizResults: [],
      currentQuizIndex: 0,
      reflectionAnswers: {},
    });
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
    const { simulationValues, currentScenario } = get();
    if (!currentScenario) return;
    
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
      // Default calculation
      const v1 = (simulationValues.variable1 as number) || 50;
      const v2 = (simulationValues.variable2 as number) || 50;
      results = {
        result: Math.round((v1 + v2) / 2),
      };
    }
    
    set({ simulationResults: results });
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
  
  resetSession: () => {
    set({
      currentQuestion: '',
      currentScenario: null,
      currentPhase: 'home',
      simulationValues: {},
      simulationResults: {},
      completedTasks: [],
      quizResults: [],
      currentQuizIndex: 0,
      reflectionAnswers: {},
    });
  },
}));
