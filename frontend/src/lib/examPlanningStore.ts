import { create } from 'zustand';
import axios from 'axios';
import API_CONFIG from '@/config/api';

const API_URL = API_CONFIG.BACKEND_BASE_URL;

interface Subject {
  name: string;
  topics: string[];
}

interface ChapterPriority {
  subject: string;
  chapter: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  ncertRelevance: number;
  derivationHeavy: boolean;
  formulaIntensive: boolean;
  pyqDominant: boolean;
  estimatedTime: number;
  weightage: number;
}

interface DailySubject {
  name: string;
  chapters: string[];
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  estimatedTime: number;
}

interface DailyPreview {
  coreConcepts: string[];
  learningObjectives: string[];
  importantSubtopics: string[];
}

interface Derivation {
  title: string;
  steps: string[];
  difficulty: string;
}

interface Formula {
  name: string;
  formula: string;
  application: string;
  units: string;
}

interface PYQ {
  question: string;
  year: number;
  examBoard: string;
  marks: number;
  solution: string;
  difficulty: string;
}

interface LearningKit {
  notes: string;
  derivations: Derivation[];
  formulas: Formula[];
  pyqs: PYQ[];
  tips: string[];
  commonMistakes: string[];
}

interface DailyPlan {
  day: number;
  date: string;
  subjects: DailySubject[];
  rationale: string;
  preview: DailyPreview;
  learningKit?: LearningKit;
}

interface ExamPlan {
  _id: string;
  userId: string;
  examDate: string;
  currentDate: string;
  totalDays: number;
  subjects: Subject[];
  dailyStudyHours: number;
  chapterPriorities: ChapterPriority[];
  dailyPlans: DailyPlan[];
  revisionDays: number;
  metadata: {
    totalChapters: number;
    totalTopics: number;
    estimatedTotalHours: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    examBoard: 'CBSE' | 'ICSE' | 'State Board' | 'Other';
  };
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface ExamPlanningState {
  // Current plan being created/viewed
  currentPlan: ExamPlan | null;
  
  // List of saved plans
  savedPlans: ExamPlan[];
  
  // UI state
  isGenerating: boolean;
  isLoadingPlans: boolean;
  isLoadingDailyContent: boolean;
  error: string | null;
  
  // Active day for viewing details
  activeDay: number | null;
  
  // Actions
  generatePlan: (data: {
    examDate: string;
    currentDate?: string;
    subjects: string[];
    topics: string[];
    dailyStudyHours?: number;
    grade?: number;
    examBoard?: string;
  }, token: string) => Promise<void>;
  
  fetchPlans: (token: string, status?: string) => Promise<void>;
  fetchPlanById: (planId: string, token: string) => Promise<void>;
  fetchDailyContent: (planId: string, day: number, token: string, regenerate?: boolean) => Promise<void>;
  deletePlan: (planId: string, token: string) => Promise<void>;
  updatePlanStatus: (planId: string, status: string, token: string) => Promise<void>;
  
  setActiveDay: (day: number | null) => void;
  clearCurrentPlan: () => void;
  clearError: () => void;
}

export const useExamPlanningStore = create<ExamPlanningState>((set, get) => ({
  currentPlan: null,
  savedPlans: [],
  isGenerating: false,
  isLoadingPlans: false,
  isLoadingDailyContent: false,
  error: null,
  activeDay: null,

  generatePlan: async (data, token) => {
    set({ isGenerating: true, error: null });
    
    try {
      const response = await axios.post(
        `${API_URL}/api/exam-planning/generate`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Fetch the complete plan
        await get().fetchPlanById(response.data.data.planId, token);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate exam plan';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  fetchPlans: async (token, status = 'active') => {
    set({ isLoadingPlans: true, error: null });
    
    try {
      const response = await axios.get(
        `${API_URL}/api/exam-planning/plans`,
        {
          params: { status },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        set({ savedPlans: response.data.data });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch plans';
      set({ error: errorMessage });
    } finally {
      set({ isLoadingPlans: false });
    }
  },

  fetchPlanById: async (planId, token) => {
    set({ isLoadingPlans: true, error: null });
    
    try {
      const response = await axios.get(
        `${API_URL}/api/exam-planning/plans/${planId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        set({ currentPlan: response.data.data });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch plan';
      set({ error: errorMessage });
    } finally {
      set({ isLoadingPlans: false });
    }
  },

  fetchDailyContent: async (planId, day, token, regenerate = false) => {
    set({ isLoadingDailyContent: true, error: null });
    
    try {
      console.log(`🔄 Fetching daily content for Day ${day}...`);
      
      const response = await axios.get(
        `${API_URL}/api/exam-planning/daily-content/${planId}/${day}`,
        {
          params: { regenerate },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(`📦 Received daily content:`, response.data);

      if (response.data.success) {
        const learningKit = response.data.data.learningKit;
        
        console.log(`✅ Learning kit data:`, {
          hasNotes: !!learningKit?.notes,
          derivationsCount: learningKit?.derivations?.length || 0,
          formulasCount: learningKit?.formulas?.length || 0,
          pyqsCount: learningKit?.pyqs?.length || 0,
          tipsCount: learningKit?.tips?.length || 0,
          scenariosCount: learningKit?.scenarios?.length || 0,
          practiceQuestionsCount: learningKit?.practiceQuestions?.length || 0
        });
        
        // Update the daily plan in current plan
        const currentPlan = get().currentPlan;
        if (currentPlan) {
          const updatedDailyPlans = currentPlan.dailyPlans.map(dp => 
            dp.day === day ? { ...dp, learningKit: learningKit } : dp
          );
          
          set({
            currentPlan: {
              ...currentPlan,
              dailyPlans: updatedDailyPlans
            }
          });
          
          console.log(`✅ Updated store with learning kit for Day ${day}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch daily content';
      console.error('❌ Error fetching daily content:', error);
      set({ error: errorMessage });
    } finally {
      set({ isLoadingDailyContent: false });
    }
  },

  deletePlan: async (planId, token) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/exam-planning/plans/${planId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Remove from saved plans
        set(state => ({
          savedPlans: state.savedPlans.filter(p => p._id !== planId),
          currentPlan: state.currentPlan?._id === planId ? null : state.currentPlan
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete plan';
      set({ error: errorMessage });
      throw error;
    }
  },

  updatePlanStatus: async (planId, status, token) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/exam-planning/plans/${planId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update in saved plans and current plan
        set(state => ({
          savedPlans: state.savedPlans.map(p => 
            p._id === planId ? { ...p, status: status as any } : p
          ),
          currentPlan: state.currentPlan?._id === planId 
            ? { ...state.currentPlan, status: status as any }
            : state.currentPlan
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update plan status';
      set({ error: errorMessage });
      throw error;
    }
  },

  setActiveDay: (day) => set({ activeDay: day }),
  clearCurrentPlan: () => set({ currentPlan: null, activeDay: null }),
  clearError: () => set({ error: null })
}));
