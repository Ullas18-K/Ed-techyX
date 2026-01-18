import { PenmanMessage } from '../assistant/Penman';

export const chemistryPenmanMessages: Record<string, PenmanMessage> = {
    'task-1': {
        instruction: "Let's become detectives! Grab a test tube and test if 'Chemical A' is an Acid or Base using Litmus paper or Phenolphthalein.",
        completion: "Great job! Blue Litmus turning Red means ACID. Red Litmus turning Blue means BASE. Phenolphthalein turns Pink in Bases!",
        hint: "Select a chemical, then select an indicator to see the reaction."
    },
    'task-2': {
        instruction: "Explosive science time! Add Zinc metal to Acid and bring a flame near it. Listen carefully!",
        completion: "POP! That sound confirms Hydrogen gas was released. Metals + Acid -> Salt + Hydrogen gas.",
        hint: "Select 'Zn' metal and mix with 'HCl'. Then click the Flame icon."
    },
    'task-3': {
        instruction: "Let's make some fizz! React an Acid with a Carbonate and pass the gas through Lime Water.",
        completion: "It turned milky! That's the proof of Carbon Dioxide (CO2). Metal Carbonate + Acid -> Salt + Water + CO2.",
        hint: "Use Na2CO3 and HCl. Watch the lime water jar."
    },
    'task-4': {
        instruction: "Time for balance! Perform a Neutralisation reaction. Add Acid drop-by-drop to the Base until the Pink color *just* disappears.",
        completion: "Perfect balance! Acid + Base -> Salt + Water. The pH is now neutral (7).",
        hint: "Add HCl to NaOH + Phenolphthalein slowly. Stop when it's transparent."
    },
    'task-5': {
        instruction: "How strong is it? Use the Universal Indicator and pH paper to find the exact pH value.",
        completion: "You've mastered the scale! Red/Orange is Acidic, Green is Neutral, Blue/Violet is Basic.",
        hint: "Check the color chart to match the pH value."
    },
    'task-6': {
        instruction: "Let's heat things up! Heat the blue Copper Sulphate crystals. What happens to the water inside?",
        completion: "It turned white! You removed the Water of Crystallisation. Add water back to make it blue again!",
        hint: "Apply heat using the Bunsen burner control."
    }
};
