import { PenmanMessage } from '../assistant/Penman';

/**
 * Example: Chemistry Penman Messages
 * 
 * This shows how any subject can define their own Penman messages.
 * Simply map task IDs to instruction/completion messages.
 */
export const chemistryPenmanMessages: Record<string, PenmanMessage> = {
  'task-1': {
    instruction: "Welcome to the chemistry lab! Let's start by mixing two compounds. Adjust the concentration slider and observe the reaction.",
    completion: "Excellent! You've successfully observed a chemical reaction. Notice how the products have different properties!",
    hint: "Try different concentration levels to see how they affect the reaction rate"
  },
  
  'task-2': {
    instruction: "Now let's explore pH levels! Change the solution type and watch how the pH indicator changes color.",
    completion: "Great work! You've learned how different solutions have different acidity levels!",
    hint: "Remember: pH less than 7 is acidic, pH greater than 7 is basic"
  },
  
  'task-3': {
    instruction: "Time for temperature effects! Increase the temperature and see how it affects the reaction speed.",
    completion: "Perfect! Higher temperature usually increases reaction rates by giving molecules more energy!",
    hint: "Most reactions roughly double in speed for every 10°C temperature increase"
  }
};

/**
 * Example: Biology Penman Messages
 */
export const biologyPenmanMessages: Record<string, PenmanMessage> = {
  'task-1': {
    instruction: "Let's explore photosynthesis! Adjust the sunlight level and watch how the plant responds.",
    completion: "Amazing! You've seen how plants convert sunlight into energy. This is the foundation of all life on Earth!",
    hint: "Try different light intensities to see the optimal conditions for photosynthesis"
  },
  
  'task-2': {
    instruction: "Now let's look at cellular respiration. Change the oxygen levels and observe the energy production.",
    completion: "Well done! You've learned how cells break down glucose to release energy for life processes!",
    hint: "Notice how oxygen is essential for efficient energy production"
  }
};

// Template for creating new subject messages
export const templatePenmanMessages: Record<string, PenmanMessage> = {
  'task-1': {
    instruction: "Welcome to [SUBJECT]! Let's start with [BASIC_CONCEPT]. Try [ACTION_INSTRUCTION].",
    completion: "Excellent! You've successfully [ACHIEVEMENT]. [EDUCATIONAL_INSIGHT]!",
    hint: "[HELPFUL_HINT_FOR_STRUGGLING_STUDENTS]"
  },
  
  'task-2': {
    instruction: "Great! Now let's explore [NEXT_CONCEPT]. [SPECIFIC_INSTRUCTION].",
    completion: "Perfect! You've learned [LEARNING_OUTCOME]!",
    hint: "[CONTEXTUAL_HINT]"
  }
  
  // Add more tasks as needed...
};