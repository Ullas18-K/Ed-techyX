// AI Service API integration
import { toast } from 'sonner';
import { useTranslationStore } from './translationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

// Types for AI responses (matching actual API format)
export interface AIScenarioResponse {
  scenarioId: string;
  title: string;
  subject: string;
  gradeLevel: number;
  greeting: string;
  scenarioDescription: string;
  keyConcepts: Array<{
    stepNumber: number;
    description: string;
    details: string;
  }>;
  learningObjectives: Array<{
    stepNumber: number;
    description: string;
    details: string;
  }>;
  tasks: Array<{
    id: number;
    instruction: string;
    checkQuestion: string;
    hint: string;
    encouragement: string;
    expectedAction?: string;
  }>;
  simulationConfig: {
    type: string;
    title: string;
    description: string;
    controls: Array<{
      name: string;
      label: string;
      min?: number | null;
      max?: number | null;
      default?: number | string;
      unit?: string;
      step?: number;
      description?: string;
      effect?: string;
      options?: string[] | null;
      controlType?: string;
    }>;
    outputs: string[];
    visualElements: string[];
    instructions?: string;
    controlGuide?: string;
  };
  interactionTypes: string[];
  progressSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    isCompleted: boolean;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  notes: string;
  formulas: string[];
  estimatedDuration: string;
  difficultyLevel: string;
  ncertChapter: string;
  ncertPageRefs: string[];
}

export interface RAGSource {
  chapter: string;
  page: number;
  excerpt: string;
}

export interface AIConversationResponse {
  response: string;
  action: string; // 'continue' | 'next_task' | 'hint' | 'repeat'
  task_complete: boolean;
  next_task_id?: number;
}

export interface PYQQuestion {
  questionId: string;
  questionText: string;
  topic: string;
  subject: string;
  grade: number;
  year?: number;
  difficulty?: string;
  hasImage: boolean;
  imageUrl?: string;
  imageDescription?: string;
  answer?: string;
  answerExplanation?: string;
  options?: string[];
  correctOption?: string;
  source: 'pyq' | 'generated';
  sourcePdf?: string;
  pageNumber?: number;
}

export interface PYQResponse {
  questions: PYQQuestion[];
  totalCount: number;
  pyqCount: number;
  generatedCount: number;
  topic: string;
  grade: number;
}

// Generate AI-powered learning scenario
export async function generateAIScenario(topic: string, token: string): Promise<AIScenarioResponse> {
  try {
    console.log(`🤖 Generating AI scenario for: ${topic}`);
    console.log('⏳ This may take 30-60 seconds, please wait...');

    const language = useTranslationStore.getState().currentLanguage;

    // No timeout - let it complete naturally
    const response = await fetch(`${API_URL}/ai/scenario/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-language': language
      },
      body: JSON.stringify({
        grade: 10,
        subject: 'science',
        topic: topic,
        difficulty: 'medium'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to generate scenario');
    }

    console.log('✅ AI scenario generated successfully:', data.data.scenarioId);
    return data.data;

  } catch (error: any) {
    console.error('❌ AI scenario generation failed:', error);
    toast.error('Failed to generate AI scenario. Please try again.');
    throw error;
  }
}

// Get conversational AI guidance
export async function getAIGuidance(
  scenarioId: string,
  currentTaskId: number,
  studentInput: string,
  context: any,
  token: string
): Promise<AIConversationResponse> {
  try {
    const language = useTranslationStore.getState().currentLanguage;
    const response = await fetch(`${API_URL}/ai/conversation/guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-language': language
      },
      body: JSON.stringify({
        scenario_id: scenarioId,
        current_task_id: currentTaskId,
        student_input: studentInput,
        context: context
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to get AI guidance');
    }

    return data.data;

  } catch (error) {
    console.error('❌ AI guidance failed:', error);
    // Return fallback response
    return {
      response: "Keep exploring! I'm here to help when you're ready.",
      action: 'continue',
      task_complete: false
    };
  }
}

// Fetch practice questions (PYQ)
export async function fetchPracticeQuestions(
  topic: string,
  grade: number,
  subject: string,
  token: string,
  count: number = 5,
  difficulty: string = 'medium'
): Promise<PYQResponse> {
  try {
    const language = useTranslationStore.getState().currentLanguage;
    console.log(`📚 Fetching practice questions for: ${topic}`);

    // No timeout - let it complete naturally
    const response = await fetch(`${API_URL}/ai/questions/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-language': language
      },
      body: JSON.stringify({
        topic: topic,
        grade: grade,
        subject: subject,
        count: count,
        difficulty: difficulty,
        includeGenerated: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.data.totalCount} practice questions`);
    return data.data;

  } catch (error: any) {
    console.error('❌ PYQ fetch failed:', error);
    toast.error('Failed to load practice questions. Please try again.');
    throw error;
  }
}

// Check AI service health
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/ai/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
