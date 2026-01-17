import { useState, useCallback, useRef } from 'react';

interface AIResponse {
    response: string;
    action: string;
}

interface UsePenmanAIProps {
    subject: string;
    topic: string;
    generateSignature: (state: any) => string;
}

export const usePenmanAI = ({ subject, topic, generateSignature }: UsePenmanAIProps) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const cache = useRef<Map<string, string>>(new Map());

    const explainState = useCallback(async (state: any) => {
        const signature = generateSignature(state);

        // 1. Check Cache
        if (cache.current.has(signature)) {
            console.log(`[usePenmanAI] Cache hit for: ${signature}`);
            setExplanation(cache.current.get(signature)!);
            return;
        }

        // 2. API Call
        setIsThinking(true);
        try {
            const response = await fetch('http://localhost:8001/api/conversation/guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_id: "generic",
                    current_task_id: 0,
                    student_input: "Explain the current state",
                    mode: "state_explanation",
                    subject: subject,
                    simulation_state: state,
                    context: { topic }
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch AI explanation');

            const data: AIResponse = await response.json();
            const aiText = data.response;

            // 3. Update State & Cache
            setExplanation(aiText);
            cache.current.set(signature, aiText);
        } catch (error) {
            console.error('[usePenmanAI] Error:', error);
            setExplanation("I'm sorry, I'm having trouble analyzing the simulation right now. Please try again in a moment.");
        } finally {
            setIsThinking(false);
        }
    }, [subject, topic, generateSignature]);

    const clearExplanation = useCallback(() => {
        setExplanation(null);
    }, []);

    return {
        explanation,
        isThinking,
        explainState,
        clearExplanation
    };
};
