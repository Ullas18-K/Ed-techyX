export type ExperimentMode =
    | 'indicators'
    | 'metal_acid'
    | 'carbonate'
    | 'neutralization'
    | 'ph_scale'
    | 'salt_heating';

export type ApparatusType =
    | 'test_tube'
    | 'beaker'
    | 'flask'
    | 'burette_flask'
    | 'china_dish'
    | 'none';

export type ChemicalType =
    | 'hcl'
    | 'h2so4'
    | 'naoh'
    | 'ch3cooh'
    | 'water'
    | 'hco3' // Carbonate/Bicarbonate
    | 'caco3'
    | 'na2co3'
    | 'cuso4' // Salt
    | 'feso4'
    | 'none';

export type MetalType = 'zn' | 'mg' | 'fe' | 'cu' | 'none';

export type IndicatorType = 'litmus_red' | 'litmus_blue' | 'phenolphthalein' | 'methyl_orange' | 'universal' | 'none';

export interface ChemistryState {
    experimentMode: ExperimentMode;
    apparatus: ApparatusType;
    chemicalA: ChemicalType; // Usually the distinct one (Acid/Base)
    chemicalB: ChemicalType; // The reactor
    metal: MetalType;
    indicator: IndicatorType;

    // Dynamic State
    volume: number; // 0-100%
    temperature: number; // 20 - 100+
    phValue: number; // 0-14
    color: string; // Hex code for current liquid color

    // Reaction Flags
    isReacting: boolean;
    gasProduced: 'h2' | 'co2' | 'none';
    bubblesActive: boolean;
    precipitate: boolean;
    popTestResult: 'success' | 'failure' | 'none';
    limeWaterTest: 'milky' | 'clear' | 'none';

    // User Actions
    heatApplied: boolean;
    stirring: boolean;

    // Task Tracking
    activeTaskId: string | null;
    completedTasks: string[];
}

export interface Task {
    id: string;
    title: string;
    description: string;
    instructions: string;
    experimentMode: ExperimentMode;
    validationFn: (state: ChemistryState) => boolean;
    setupFn: (store: any) => void; // Function to reset state for this task
    hint?: string;
}
