import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  joinedDate: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  learningStats?: {
    sessions: number;
    questionsAsked: number;
    totalTimeSpent: number;
    totalPoints?: number;
  };
  simulationHistory?: Array<{
    query: string;
    timestamp: string;
  }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateLearningStats: (stats: { sessions?: number; questionsAsked?: number; totalTimeSpent?: number }) => Promise<void>;
  addSimulationHistory: (query: string, context?: Record<string, unknown>) => Promise<void>;
  fetchSimulationHistory: () => Promise<void>;
  submitSessionResult: (payload: { question: string; points: number; accuracy?: number; duration?: number }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
        token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.success && data.user && data.token) {
            set({ 
              user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                avatar: data.user.avatar,
                bio: data.user.bio,
                joinedDate: data.user.joinedDate,
                location: data.user.location,
                preferences: data.user.preferences,
                learningStats: data.user.learningStats,
                simulationHistory: data.user.simulationHistory || []
              }, 
              token: data.token,
              isAuthenticated: true 
            });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      register: async (email: string, password: string, name: string) => {
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (data.success && data.user && data.token) {
            set({ 
              user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                avatar: data.user.avatar,
                bio: data.user.bio,
                joinedDate: data.user.joinedDate,
                location: data.user.location,
                preferences: data.user.preferences,
                learningStats: data.user.learningStats || { sessions: 0, questionsAsked: 0, totalTimeSpent: 0 },
                simulationHistory: data.user.simulationHistory || []
              }, 
              token: data.token,
              isAuthenticated: true 
            });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Register error:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: async (updates: Partial<User>) => {
        const token = get().token;
        const currentUser = get().user;
        
        if (!token || !currentUser) return;

        try {
          const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });

          const data = await response.json();

          if (data.success && data.user) {
            set({ 
              user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                avatar: data.user.avatar,
                bio: data.user.bio,
                joinedDate: data.user.joinedDate,
                location: data.user.location,
                preferences: data.user.preferences,
                learningStats: data.user.learningStats,
                simulationHistory: data.user.simulationHistory || currentUser.simulationHistory || []
              }
            });
          }
        } catch (error) {
          console.error('Update profile error:', error);
        }
      },

      updateLearningStats: async (stats: { sessions?: number; questionsAsked?: number; totalTimeSpent?: number }) => {
        const token = get().token;
        const currentUser = get().user;
        
        if (!token || !currentUser) return;

        try {
          const response = await fetch(`${API_URL}/auth/learning-stats`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(stats),
          });

          const data = await response.json();

          if (data.success && data.learningStats) {
            set({ 
              user: {
                ...currentUser,
                learningStats: data.learningStats
              }
            });
          }
        } catch (error) {
          console.error('Update stats error:', error);
        }
      },

      addSimulationHistory: async (query: string, context: Record<string, unknown> = {}) => {
        const token = get().token;
        const currentUser = get().user;
        if (!token || !currentUser) return;

        try {
          const response = await fetch(`${API_URL}/auth/simulations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ query, context }),
          });

          const data = await response.json();

          if (data.success && data.simulationHistory) {
            set({
              user: {
                ...currentUser,
                simulationHistory: data.simulationHistory,
              },
            });
          }
        } catch (error) {
          console.error('Add simulation history error:', error);
        }
      },

      fetchSimulationHistory: async () => {
        const token = get().token;
        const currentUser = get().user;
        if (!token || !currentUser) return;

        try {
          const response = await fetch(`${API_URL}/auth/simulations`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success && data.simulationHistory) {
            set({ user: { ...currentUser, simulationHistory: data.simulationHistory } });
          }
        } catch (error) {
          console.error('Fetch simulation history error:', error);
        }
      },

      submitSessionResult: async ({ question, points, accuracy = 0, duration = 0 }) => {
        const token = get().token;
        const currentUser = get().user;
        if (!token || !currentUser) return;

        try {
          const response = await fetch(`${API_URL}/auth/session-results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ question, points, accuracy, duration }),
          });

          const data = await response.json();
          if (data.success && typeof data.totalPoints === 'number') {
            set({ user: { ...currentUser, learningStats: { ...(currentUser.learningStats || { sessions: 0, questionsAsked: 0, totalTimeSpent: 0 }), totalPoints: data.totalPoints } } });
          }
        } catch (error) {
          console.error('Submit session result error:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
