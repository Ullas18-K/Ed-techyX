import { create } from 'zustand';
import { OpticsState, OpticalObject, OpticalElement, Ray, ImageData, Task } from './types';
import { tasks } from './tasks';

interface OpticsStore extends OpticsState {
  // Actions
  setObjectPosition: (position: { x: number; y: number }) => void;
  setObjectHeight: (height: number) => void;
  addElement: (element: OpticalElement) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<OpticalElement>) => void;
  setRays: (rays: Ray[]) => void;
  setImage: (image: ImageData | null) => void;
  toggleRays: () => void;
  toggleFocalPoints: () => void;
  toggleVirtualImage: () => void;
  toggleLabels: () => void;
  toggleNormal: () => void;
  toggleRayExtensions: () => void;
  toggleMeasurements: () => void;
  toggleFormula: () => void;
  setAngleOfIncidence: (angle: number) => void;
  setMode: (mode: 'lens' | 'mirror') => void;
  reset: () => void;
  setActiveTask: (taskId: string | null) => void;
  completeTask: (taskId: string) => void;
  getTasks: () => Task[];
  getActiveTask: () => Task | null;
}

const initialState: OpticsState = {
  object: {
    type: 'arrow',
    position: { x: 200, y: 300 },
    height: 80,
    width: 20,
  },
  elements: [],
  rays: [],
  image: null,
  showRays: true,
  showFocalPoints: true,
  showVirtualImage: true,
  showLabels: true,
  showNormal: true,
  showRayExtensions: true,
  showMeasurements: true,
  showFormula: false,
  angleOfIncidence: 0,
  mode: 'lens',
  activeTaskId: null,
  completedTasks: [],
};

export const useOpticsStore = create<OpticsStore>((set, get) => ({
  ...initialState,

  setObjectPosition: (position) =>
    set((state) => ({
      object: { ...state.object, position },
    })),

  setObjectHeight: (height) =>
    set((state) => ({
      object: { ...state.object, height },
    })),

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
    })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  setRays: (rays) => set({ rays }),

  setImage: (image) => set({ image }),

  toggleRays: () => set((state) => ({ showRays: !state.showRays })),

  toggleFocalPoints: () =>
    set((state) => ({ showFocalPoints: !state.showFocalPoints })),

  toggleVirtualImage: () =>
    set((state) => ({ showVirtualImage: !state.showVirtualImage })),

  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  toggleNormal: () => set((state) => ({ showNormal: !state.showNormal })),

  toggleRayExtensions: () => set((state) => ({ showRayExtensions: !state.showRayExtensions })),

  toggleMeasurements: () => set((state) => ({ showMeasurements: !state.showMeasurements })),

  toggleFormula: () => set((state) => ({ showFormula: !state.showFormula })),

  setAngleOfIncidence: (angle) => set({ angleOfIncidence: angle }),

  setMode: (mode) => set({ mode, elements: [] }),

  reset: () => set(initialState),

  setActiveTask: (taskId) => set({ activeTaskId: taskId }),

  completeTask: (taskId) =>
    set((state) => ({
      completedTasks: [...state.completedTasks, taskId],
      activeTaskId: null,
    })),

  getTasks: () => tasks,

  getActiveTask: () => {
    const state = get();
    if (!state.activeTaskId) return null;
    return tasks.find((t) => t.id === state.activeTaskId) || null;
  },
}));
