import { Task, ChemistryState } from './types';

export const chemistryTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Indicators: Acid or Base?',
        description: 'Use various indicators to identify whether the solution is an Acid or a Base.',
        instructions: 'Select HCl or NaOH. Then dip the Litmus paper or add Phenolphthalein. Observe the color change.',
        experimentMode: 'indicators',
        hint: 'Acids turn Blue Litmus -> Red. Bases turn Red Litmus -> Blue.',
        setupFn: (store) => {
            store.setExperimentMode('indicators');
            store.setApparatus('test_tube');
            store.setChemicalA('none');
            store.setChemicalB('none');
            store.setIndicator('none');
            store.setMetal('none');
            store.setColor('transparent');
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false
            });
        },
        validationFn: (state: ChemistryState) => {
            // Validate that user has selected a chemical AND an indicator, and reaction happened
            return (state.chemicalA !== 'none' && state.indicator !== 'none' && state.color !== 'transparent' && state.color !== '');
        }
    },
    {
        id: 'task-2',
        title: 'Metals Reacting with Acids',
        description: 'Observe the reaction between Metals and Acids. Test for Hydrogen gas.',
        instructions: 'Add Zinc granules to the test tube. Add HCl. Bring the flame close to the mouth of the tube.',
        experimentMode: 'metal_acid',
        hint: 'Active metals react with acid to release H2 gas, which burns with a POP sound.',
        setupFn: (store) => {
            store.setExperimentMode('metal_acid');
            store.setApparatus('test_tube');
            store.setChemicalA('none');
            store.setChemicalB('none');
            store.setMetal('none');
            store.setIndicator('none');
            store.setColor('transparent');
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false
            });
        },
        validationFn: (state: ChemistryState) => {
            return state.gasProduced === 'h2' && state.popTestResult === 'success';
        }
    },
    {
        id: 'task-3',
        title: 'Reaction with Carbonates',
        description: 'How do Acids react with Metal Carbonates?',
        instructions: 'Add Sodium Carbonate to the flask. Add HCl. Pass the gas through Lime Water.',
        experimentMode: 'carbonate',
        hint: 'Acids + Carbonates -> Salt + H2O + CO2. CO2 turns lime water milky.',
        setupFn: (store) => {
            store.setExperimentMode('carbonate');
            store.setApparatus('flask');
            store.setChemicalA('none');
            store.setChemicalB('none');
            store.setMetal('none');
            store.setIndicator('none');
            store.setColor('transparent');
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false
            });
        },
        validationFn: (state: ChemistryState) => {
            return state.gasProduced === 'co2' && state.limeWaterTest === 'milky';
        }
    },
    {
        id: 'task-4',
        title: 'Neutralisation Reaction',
        description: 'Mix an Acid and a Base to form Salt and Water.',
        instructions: 'Take NaOH in the flask. Add Phenolphthalein (turns pink). Slowly add HCl dropwise until color disappears.',
        experimentMode: 'neutralization',
        hint: 'When Acid and Base neutralize, the PH becomes 7.',
        setupFn: (store) => {
            store.setExperimentMode('neutralization');
            store.setApparatus('burette_flask');
            store.setChemicalA('naoh');
            store.setChemicalB('none');
            store.setIndicator('phenolphthalein');
            store.setMetal('none');
            store.setColor('#FF69B4'); // Pink from phenolphthalein + base
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false,
                phValue: 14
            });
        },
        validationFn: (state: ChemistryState) => {
            return state.phValue === 7 && state.color === 'transparent'; // simplistic check for completion
        }
    },
    {
        id: 'task-5',
        title: 'pH Scale & Strength',
        description: 'Determine the pH of different solutions using Universal Indicator.',
        instructions: 'Select different common solutions. Dip the pH paper and match the color on the pH scale.',
        experimentMode: 'ph_scale',
        hint: 'Red (pH 1) is strong acid, Violet (pH 14) is strong base. Green is neutral.',
        setupFn: (store) => {
            store.setExperimentMode('ph_scale');
            store.setApparatus('test_tube');
            store.setChemicalA('none');
            store.setChemicalB('none');
            store.setMetal('none');
            store.setIndicator('none');
            store.setColor('transparent');
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false,
                phValue: 7
            });
        },
        validationFn: (state: ChemistryState) => {
            return state.chemicalA !== 'none' && state.indicator === 'universal';
        }
    },
    {
        id: 'task-6',
        title: 'Heating of Salts',
        description: 'Observe the effect of heat on Hydrated Copper Sulphate.',
        instructions: 'Heat the blue crystals of Copper Sulphate. Watch them turn white. Add water back to restore color.',
        experimentMode: 'salt_heating',
        hint: 'Blue CuSO4.5H2O loses water on heating to become white CuSO4.',
        setupFn: (store) => {
            store.setExperimentMode('salt_heating');
            store.setApparatus('china_dish');
            store.setChemicalA('cuso4');
            store.setChemicalB('none');
            store.setMetal('none');
            store.setIndicator('none');
            store.setColor('#0000FF'); // Blue CuSO4.5H2O
            store.updateState({
                gasProduced: 'none',
                bubblesActive: false,
                popTestResult: 'none',
                limeWaterTest: 'none',
                heatApplied: false,
                isReacting: false
            });
        },
        validationFn: (state: ChemistryState) => {
            // Task complete if they heated it AND then rehydrated it? Or just heated?
            // Let's simplified: Heat until white.
            return state.color === '#FFFFFF' || state.color === 'white';
        }
    }
];
