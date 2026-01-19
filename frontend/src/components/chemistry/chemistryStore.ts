import { create } from 'zustand';
import { ChemistryState, ExperimentMode, ApparatusType, ChemicalType, MetalType, IndicatorType, Task } from './types';
import { chemistryTasks } from './tasks';

interface ChemistryStore extends ChemistryState {
    // Actions
    setExperimentMode: (mode: ExperimentMode) => void;
    setApparatus: (apparatus: ApparatusType) => void;
    setChemicalA: (chem: ChemicalType) => void;
    setChemicalB: (chem: ChemicalType) => void;
    setMetal: (metal: MetalType) => void;
    setIndicator: (indicator: IndicatorType) => void;
    setHeatApplied: (heat: boolean) => void;
    setPopTestResult: (result: 'success' | 'failure' | 'none') => void;
    setLimeWaterTest: (result: 'milky' | 'clear' | 'none') => void;
    setColor: (color: string) => void;

    // Interactions
    reset: () => void;
    setActiveTask: (taskId: string | null) => void;
    completeTask: (taskId: string) => void;
    getTasks: () => Task[];
    getActiveTask: () => Task | null;

    // Generic State setter for complex updates (reaction logic)
    updateState: (updates: Partial<ChemistryState>) => void;
}

const initialState: ChemistryState = {
    experimentMode: 'indicators',
    apparatus: 'test_tube',
    chemicalA: 'none',
    chemicalB: 'none',
    metal: 'none',
    indicator: 'none',

    volume: 0,
    temperature: 25,
    phValue: 7,
    color: 'transparent',

    isReacting: false,
    gasProduced: 'none',
    bubblesActive: false,
    precipitate: false,
    popTestResult: 'none',
    limeWaterTest: 'none',

    heatApplied: false,
    stirring: false,

    activeTaskId: null,
    completedTasks: [],
};

export const useChemistryStore = create<ChemistryStore>((set, get) => ({
    ...initialState,

    setExperimentMode: (mode) => set({ experimentMode: mode }),
    setApparatus: (apparatus) => set({ apparatus }),
    setChemicalA: (chemicalA) => set({ chemicalA }),
    setChemicalB: (chemicalB) => set({ chemicalB }),
    setMetal: (metal) => set({ metal }),
    setIndicator: (indicator) => set({ indicator }),
    setHeatApplied: (heatApplied) => set({ heatApplied }),
    setPopTestResult: (popTestResult) => set({ popTestResult }),
    setLimeWaterTest: (limeWaterTest) => set({ limeWaterTest }),
    setColor: (color) => set({ color }),

    updateState: (updates) => set((state) => ({ ...state, ...updates })),

    reset: () => set(initialState),

    setActiveTask: (taskId) => {
        set({ activeTaskId: taskId });
        // Auto-setup logic handled in component usually, but could be here if we avoid side-effects
    },

    completeTask: (taskId) =>
        set((state) => ({
            completedTasks: [...state.completedTasks, taskId],
            activeTaskId: null,
        })),

    getTasks: () => chemistryTasks,

    getActiveTask: () => {
        const state = get();
        if (!state.activeTaskId) return null;
        return chemistryTasks.find((t) => t.id === state.activeTaskId) || null;
    },
}));
