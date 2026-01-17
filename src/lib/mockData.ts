// Mock data for the AI Learning Experience Engine

export interface LearningScenario {
  id: string;
  topic: string;
  subject: string;
  level: string;
  learningStyle: string;
  estimatedTime: string;
  scenario: string;
  concepts: string[];
  objectives: string[];
  simulation: SimulationConfig;
  explanations: Explanation[];
  quiz: QuizQuestion[];
  reflections: string[];
  examConnection: ExamConnection;
}

export interface SimulationConfig {
  type: 'photosynthesis' | 'circuit' | 'pendulum' | 'chemistry' | 'ecosystem';
  title: string;
  description: string;
  controls: SimulationControl[];
  outputs: SimulationOutput[];
  tasks: string[];
  tutorMessages: TutorMessage[];
}

export interface SimulationControl {
  id: string;
  label: string;
  type: 'slider' | 'toggle' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  unit?: string;
}

export interface SimulationOutput {
  id: string;
  label: string;
  unit: string;
  color: string;
}

export interface TutorMessage {
  trigger: string;
  message: string;
  options?: string[];
}

export interface Explanation {
  title: string;
  type: 'visual' | 'step-by-step' | 'real-life' | 'exam-tip';
  content: string;
  diagram?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'dragdrop' | 'truefalse' | 'predict';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  misconception?: string;
}

export interface ExamConnection {
  ncertChapter: string;
  boardRelevance: string;
  competitiveExams: string[];
}

// Question-to-topic mapping
export const questionTopicMapping: Record<string, string> = {
  'photosynthesis': 'photosynthesis',
  'plant': 'photosynthesis',
  'chlorophyll': 'photosynthesis',
  'sunlight': 'photosynthesis',
  'oxygen': 'photosynthesis',
  'carbon dioxide': 'photosynthesis',
  'ohm': 'circuits',
  'resistance': 'circuits',
  'current': 'circuits',
  'voltage': 'circuits',
  'circuit': 'circuits',
  'electric': 'circuits',
  'pendulum': 'pendulum',
  'oscillation': 'pendulum',
  'swing': 'pendulum',
  'period': 'pendulum',
  'gravity': 'pendulum',
  'acid': 'chemistry',
  'base': 'chemistry',
  'ph': 'chemistry',
  'reaction': 'chemistry',
  'neutral': 'chemistry',
  'ecosystem': 'ecosystem',
  'food chain': 'ecosystem',
  'habitat': 'ecosystem',
  'biodiversity': 'ecosystem',
};

export const subjectMapping: Record<string, string> = {
  'photosynthesis': 'Biology',
  'circuits': 'Physics',
  'pendulum': 'Physics',
  'chemistry': 'Chemistry',
  'ecosystem': 'Biology',
};

// AI thinking steps
export const aiThinkingSteps = [
  { id: 1, text: 'Understanding your question...', duration: 800 },
  { id: 2, text: 'Identifying subject area...', duration: 600 },
  { id: 3, text: 'Analyzing class level...', duration: 500 },
  { id: 4, text: 'Extracting key concepts...', duration: 700 },
  { id: 5, text: 'Generating learning scenario...', duration: 900 },
  { id: 6, text: 'Designing interactive simulation...', duration: 1000 },
  { id: 7, text: 'Preparing personalized quiz...', duration: 600 },
  { id: 8, text: 'Finalizing your learning journey...', duration: 500 },
];

// Learning scenarios
export const learningScenarios: Record<string, LearningScenario> = {
  photosynthesis: {
    id: 'photosynthesis',
    topic: 'Photosynthesis',
    subject: 'Biology',
    level: 'Class 7-9',
    learningStyle: 'Visual + Interactive',
    estimatedTime: '20 minutes',
    scenario: 'You are a young scientist working at a botanical research lab. Your mission is to help a rare plant species survive in varying environmental conditions. By understanding and controlling photosynthesis, you must find the optimal conditions for the plant to thrive.',
    concepts: [
      'Light Reaction',
      'Dark Reaction (Calvin Cycle)',
      'Role of Chlorophyll',
      'Factors affecting photosynthesis',
      'Importance in the ecosystem',
    ],
    objectives: [
      'Understand the process of photosynthesis',
      'Identify inputs and outputs',
      'Experiment with environmental factors',
      'Observe cause and effect relationships',
    ],
    simulation: {
      type: 'photosynthesis',
      title: 'Plant Lab Simulator',
      description: 'Control environmental factors and observe how the plant responds',
      controls: [
        { id: 'sunlight', label: 'Sunlight Intensity', type: 'slider', min: 0, max: 100, step: 10, default: 50, unit: '%' },
        { id: 'water', label: 'Water Supply', type: 'slider', min: 0, max: 100, step: 10, default: 50, unit: 'ml' },
        { id: 'co2', label: 'CO₂ Level', type: 'slider', min: 0, max: 100, step: 10, default: 50, unit: 'ppm' },
        { id: 'temperature', label: 'Temperature', type: 'slider', min: 10, max: 45, step: 5, default: 25, unit: '°C' },
      ],
      outputs: [
        { id: 'health', label: 'Plant Health', unit: '%', color: 'success' },
        { id: 'oxygen', label: 'Oxygen Output', unit: 'ml/hr', color: 'info' },
        { id: 'sugar', label: 'Sugar Production', unit: 'mg/hr', color: 'warning' },
      ],
      tasks: [
        'Identify the inputs needed for photosynthesis',
        'Set optimal conditions for the plant',
        'Run the experiment and observe results',
        'Record what happens when you reduce sunlight',
        'Explain why the plant needs CO₂',
      ],
      tutorMessages: [
        { trigger: 'start', message: 'Welcome to the Plant Lab! Let\'s discover how plants make their own food. What do you think plants need to survive?' },
        { trigger: 'low_sunlight', message: 'Interesting choice! What do you think will happen to the plant with less sunlight?', options: ['It will grow slower', 'It won\'t be affected', 'It will die immediately'] },
        { trigger: 'experiment_run', message: 'Great observation! Did you notice how oxygen production changed? This is because...' },
        { trigger: 'optimal', message: 'Excellent! You\'ve found the sweet spot. The plant is thriving because all inputs are balanced.' },
      ],
    },
    explanations: [
      {
        title: 'Visual Explanation',
        type: 'visual',
        content: 'Photosynthesis is like a food factory inside plant cells. The chloroplasts (green parts) capture sunlight energy and combine water (H₂O) from roots with carbon dioxide (CO₂) from air to produce glucose (sugar) and oxygen (O₂).',
        diagram: 'photosynthesis-diagram',
      },
      {
        title: 'Step-by-Step Process',
        type: 'step-by-step',
        content: '1. Light is absorbed by chlorophyll in leaves\n2. Water is split into hydrogen and oxygen\n3. Oxygen is released into the air\n4. Carbon dioxide enters through stomata\n5. Hydrogen combines with CO₂ to form glucose\n6. Glucose is stored or used for energy',
      },
      {
        title: 'Real-Life Connection',
        type: 'real-life',
        content: 'This is why forests are called the "lungs of the Earth" - they produce the oxygen we breathe! It\'s also why plants in your room die if you keep them in a dark corner for too long.',
      },
      {
        title: 'Exam Tip',
        type: 'exam-tip',
        content: 'Remember the equation: 6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂. Common question: "What are the products of photosynthesis?" Answer: Glucose and Oxygen.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'mcq',
        question: 'What is the primary pigment that captures light energy in plants?',
        options: ['Chlorophyll', 'Melanin', 'Hemoglobin', 'Carotene'],
        correctAnswer: 0,
        explanation: 'Chlorophyll is the green pigment found in chloroplasts that absorbs light energy for photosynthesis.',
        misconception: 'Some students confuse chlorophyll with chloroplast. Chloroplast is the organelle; chlorophyll is the pigment inside it.',
      },
      {
        id: 'q2',
        type: 'truefalse',
        question: 'Photosynthesis can occur in complete darkness.',
        options: ['True', 'False'],
        correctAnswer: 1,
        explanation: 'The light reaction of photosynthesis requires light energy. Without light, this reaction cannot proceed.',
      },
      {
        id: 'q3',
        type: 'mcq',
        question: 'If you increase the amount of CO₂ available to a plant (with sufficient light and water), what will happen?',
        options: ['Rate of photosynthesis increases', 'Rate of photosynthesis decreases', 'No change occurs', 'The plant dies'],
        correctAnswer: 0,
        explanation: 'Up to a certain point, increasing CO₂ increases the rate of photosynthesis as it\'s one of the raw materials needed.',
      },
      {
        id: 'q4',
        type: 'predict',
        question: 'A plant is placed in a sealed container with limited CO₂. Predict what will happen over 24 hours.',
        options: ['Photosynthesis will continue normally', 'Photosynthesis will slow and eventually stop', 'The plant will start producing CO₂', 'The plant will grow faster'],
        correctAnswer: 1,
        explanation: 'As CO₂ is consumed and not replenished, photosynthesis will slow down and eventually stop when CO₂ is depleted.',
      },
    ],
    reflections: [
      'What surprised you most about how plants make food?',
      'If CO₂ levels in the atmosphere doubled, what might happen to plant growth worldwide?',
      'In your own words, explain why photosynthesis is essential for life on Earth.',
      'How might understanding photosynthesis help solve climate change?',
    ],
    examConnection: {
      ncertChapter: 'Chapter 1: Life Processes (Class 10)',
      boardRelevance: 'Frequently asked in CBSE Board exams - 3-5 marks questions',
      competitiveExams: ['NEET Biology', 'NTSE', 'Science Olympiad'],
    },
  },
  circuits: {
    id: 'circuits',
    topic: 'Ohm\'s Law & Electric Circuits',
    subject: 'Physics',
    level: 'Class 8-10',
    learningStyle: 'Hands-on + Analytical',
    estimatedTime: '25 minutes',
    scenario: 'You\'re an electrical engineer designing a safe lighting system for a new building. Understanding how voltage, current, and resistance work together is crucial for creating an efficient and safe circuit.',
    concepts: [
      'Ohm\'s Law (V = IR)',
      'Series and Parallel Circuits',
      'Electrical Resistance',
      'Power in Circuits',
      'Safety in Electrical Systems',
    ],
    objectives: [
      'Understand the relationship between V, I, and R',
      'Build and test virtual circuits',
      'Calculate unknown values using Ohm\'s Law',
      'Compare series and parallel configurations',
    ],
    simulation: {
      type: 'circuit',
      title: 'Circuit Builder Lab',
      description: 'Build circuits and observe how current flows',
      controls: [
        { id: 'voltage', label: 'Battery Voltage', type: 'slider', min: 1, max: 12, step: 1, default: 6, unit: 'V' },
        { id: 'resistance1', label: 'Resistor 1', type: 'slider', min: 1, max: 100, step: 1, default: 10, unit: 'Ω' },
        { id: 'resistance2', label: 'Resistor 2', type: 'slider', min: 1, max: 100, step: 1, default: 10, unit: 'Ω' },
        { id: 'circuitType', label: 'Circuit Type', type: 'select', default: 'series' },
      ],
      outputs: [
        { id: 'current', label: 'Current', unit: 'A', color: 'info' },
        { id: 'power', label: 'Power', unit: 'W', color: 'warning' },
        { id: 'brightness', label: 'Bulb Brightness', unit: '%', color: 'success' },
      ],
      tasks: [
        'Set up a basic circuit with one resistor',
        'Observe how current changes with voltage',
        'Add a second resistor in series',
        'Compare series vs parallel configurations',
        'Calculate the expected current and verify',
      ],
      tutorMessages: [
        { trigger: 'start', message: 'Welcome to the Circuit Lab! Today we\'ll discover Ohm\'s Law. Ready to become an electrical engineer?' },
        { trigger: 'high_current', message: 'Careful! High current can be dangerous. Notice how the bulb gets brighter but also hotter?' },
        { trigger: 'ohm_verified', message: 'You just verified Ohm\'s Law! V = I × R. When you doubled the resistance, what happened to current?' },
      ],
    },
    explanations: [
      {
        title: 'Visual Explanation',
        type: 'visual',
        content: 'Think of electricity like water flowing through pipes. Voltage is the water pressure, current is the flow rate, and resistance is how narrow the pipe is. Higher pressure (voltage) or wider pipes (lower resistance) means more flow (current).',
        diagram: 'circuit-diagram',
      },
      {
        title: 'Step-by-Step Process',
        type: 'step-by-step',
        content: '1. Voltage (V) is the "push" that moves electrons\n2. Resistance (R) opposes the flow of electrons\n3. Current (I) is the actual flow of electrons\n4. Ohm\'s Law: V = I × R\n5. Rearranged: I = V/R or R = V/I',
      },
      {
        title: 'Real-Life Connection',
        type: 'real-life',
        content: 'Your phone charger uses these principles! It converts 220V from the wall to 5V for your phone. The resistors inside control the current to safely charge the battery without overheating.',
      },
      {
        title: 'Exam Tip',
        type: 'exam-tip',
        content: 'Always check units! Voltage in Volts (V), Current in Amperes (A), Resistance in Ohms (Ω). Common mistake: mixing up series (add resistances) and parallel (add reciprocals) formulas.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'mcq',
        question: 'If the voltage is 12V and resistance is 4Ω, what is the current?',
        options: ['48 A', '3 A', '0.33 A', '8 A'],
        correctAnswer: 1,
        explanation: 'Using Ohm\'s Law: I = V/R = 12V ÷ 4Ω = 3A',
      },
      {
        id: 'q2',
        type: 'truefalse',
        question: 'In a parallel circuit, the total resistance is always less than the smallest individual resistor.',
        options: ['True', 'False'],
        correctAnswer: 0,
        explanation: 'In parallel, 1/R_total = 1/R₁ + 1/R₂ + ... This always gives a value smaller than any individual resistor.',
      },
      {
        id: 'q3',
        type: 'predict',
        question: 'What happens to the brightness of a bulb if you add another identical bulb in series?',
        options: ['Both bulbs are dimmer', 'Both bulbs are brighter', 'No change', 'One bulb is brighter than the other'],
        correctAnswer: 0,
        explanation: 'Adding resistance in series reduces total current, making both bulbs dimmer as they share the reduced current.',
      },
    ],
    reflections: [
      'Why do you think homes use parallel circuits instead of series circuits?',
      'What would happen if a single light bulb breaks in a series circuit vs a parallel circuit?',
      'Explain in your own words what Ohm\'s Law tells us about electricity.',
    ],
    examConnection: {
      ncertChapter: 'Chapter 12: Electricity (Class 10)',
      boardRelevance: 'High-weightage chapter - 8-10 marks in CBSE Physics',
      competitiveExams: ['JEE Main', 'NEET Physics', 'KVPY'],
    },
  },
};

// Default/fallback scenario for unrecognized questions
export const defaultScenario: LearningScenario = {
  id: 'default',
  topic: 'General Science Exploration',
  subject: 'Science',
  level: 'Class 6-8',
  learningStyle: 'Exploratory + Interactive',
  estimatedTime: '15 minutes',
  scenario: 'You\'re a curious young scientist exploring the wonders of the natural world. Every question leads to discovery!',
  concepts: ['Scientific Method', 'Observation', 'Hypothesis', 'Experimentation', 'Conclusion'],
  objectives: ['Think like a scientist', 'Ask questions', 'Explore possibilities', 'Draw conclusions'],
  simulation: {
    type: 'ecosystem',
    title: 'Science Explorer',
    description: 'Explore and discover scientific concepts',
    controls: [
      { id: 'variable1', label: 'Variable A', type: 'slider', min: 0, max: 100, step: 10, default: 50, unit: '' },
      { id: 'variable2', label: 'Variable B', type: 'slider', min: 0, max: 100, step: 10, default: 50, unit: '' },
    ],
    outputs: [
      { id: 'result', label: 'Result', unit: '', color: 'info' },
    ],
    tasks: [
      'Observe the initial state',
      'Make a hypothesis',
      'Change variables and observe',
      'Record your findings',
      'Draw a conclusion',
    ],
    tutorMessages: [
      { trigger: 'start', message: 'Welcome, young scientist! Let\'s explore and discover together. What do you think will happen when we change these variables?' },
    ],
  },
  explanations: [
    {
      title: 'The Scientific Method',
      type: 'step-by-step',
      content: '1. Observe something interesting\n2. Ask a question\n3. Form a hypothesis\n4. Conduct an experiment\n5. Analyze results\n6. Draw conclusions',
    },
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mcq',
      question: 'What is the first step in the scientific method?',
      options: ['Experiment', 'Observation', 'Conclusion', 'Hypothesis'],
      correctAnswer: 1,
      explanation: 'Science begins with observation - noticing something interesting that sparks curiosity.',
    },
  ],
  reflections: [
    'What question would you like to explore next?',
    'How does asking questions help us learn?',
  ],
  examConnection: {
    ncertChapter: 'Various chapters across subjects',
    boardRelevance: 'Foundation for scientific thinking',
    competitiveExams: ['Science Olympiad', 'NTSE'],
  },
};

// Helper function to find scenario based on question
export function findScenarioForQuestion(question: string): LearningScenario {
  const lowerQuestion = question.toLowerCase();
  
  for (const [keyword, topicId] of Object.entries(questionTopicMapping)) {
    if (lowerQuestion.includes(keyword)) {
      return learningScenarios[topicId] || defaultScenario;
    }
  }
  
  return defaultScenario;
}

// Sample questions for demo
export const sampleQuestions = [
  'Why is photosynthesis important for life on Earth?',
  'Explain Ohm\'s Law with examples',
  'How does a simple pendulum work?',
  'What happens when acids and bases mix?',
  'How do food chains work in an ecosystem?',
];
