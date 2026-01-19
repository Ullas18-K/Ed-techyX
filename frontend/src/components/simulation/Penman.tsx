import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Sparkles, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ---------------- TYPES ---------------- */

export interface PenmanMessage {
    id: string;
    instruction: string;
    voiceInstruction?: string;
    completion: string;
    hint?: string;
}

interface PenmanProps {
    activeTaskId: string | null;
    completedTasks: string[];
    messages: Record<string, PenmanMessage>;
    onSkipTask?: (taskId: string) => void;
    enabled?: boolean; // Global toggle
}

/* ---------------- COMPONENT ---------------- */

export const Penman: React.FC<PenmanProps> = ({
    activeTaskId,
    completedTasks,
    messages,
    onSkipTask,
    enabled = true,
}) => {
    if (!enabled) return null;

    const [isOpen, setIsOpen] = useState(true);          // per-task close
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [userInteracted, setUserInteracted] = useState(false);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const prevCompletedCountRef = useRef(completedTasks.length);

    /* ---------- Enable speech AFTER user interaction ---------- */
    useEffect(() => {
        const unlock = () => setUserInteracted(true);
        window.addEventListener('click', unlock, { once: true });
        return () => window.removeEventListener('click', unlock);
    }, []);

    /* ---------- Init speech synthesis ---------- */
    useEffect(() => {
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;

            // Required for Chrome / Safari
            synthRef.current.onvoiceschanged = () => {
                synthRef.current?.getVoices();
            };
        }

        return () => synthRef.current?.cancel();
    }, []);

    /* ---------- Speak function ---------- */
    const speak = (text: string) => {
        // Strict guard: User must interact first (browser policy)
        if (!userInteracted) return;

        if (isMuted || !isOpen || !synthRef.current) return;

        // Cancel any ongoing speech to prevent overlap
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Slightly slower for clarity
        utterance.pitch = 1.05;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Robust Voice Selection
        const voices = synthRef.current.getVoices();
        const friendly =
            voices.find(v => v.name.includes("Google US English")) ||
            voices.find(v => v.lang === "en-US") ||
            voices.find(v => v.lang.startsWith("en"));

        if (friendly) utterance.voice = friendly;

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        synthRef.current?.cancel();
        setIsSpeaking(false);
    };

    /* ---------- Task change handling {NO LOOPS} ---------- */
    // Track the last task we actually spoke/processed to avoid re-running on every render
    const lastSpokenTaskRef = useRef<string | null>(null);

    useEffect(() => {
        // Safety guard for missing messages/ids
        if (!activeTaskId || !messages[activeTaskId]) return;

        // Only trigger if we effectively changed tasks
        if (activeTaskId !== lastSpokenTaskRef.current) {
            const msg = messages[activeTaskId];

            setIsOpen(true);
            setCurrentText(msg.instruction);

            // Speak logic
            const textToSpeak = msg.voiceInstruction || msg.instruction;
            speak(textToSpeak);

            // Mark as processed
            lastSpokenTaskRef.current = activeTaskId;
        }

    }, [activeTaskId, messages, completedTasks.length, userInteracted, isMuted]);
    // ^ Depend on .length, not the array itself. Added userInteracted/isMuted to retry speech if conditions change.

    /* ---------- Close / Open ---------- */
    const handleClose = () => {
        setIsOpen(false);
        stopSpeaking();
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (!isMuted && currentText) speak(currentText);
    };

    if (!activeTaskId || !messages[activeTaskId]) return null;

    /* ---------------- RENDER ---------------- */

    return (
        <>
            {/* Closed Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={handleOpen}
                            className="w-12 h-12 rounded-full shadow-xl bg-primary text-white"
                        >
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Open Penman */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute bottom-20 right-6 z-50 flex items-end gap-3"
                    >
                        {/* Bubble */}
                        <div className="bg-white p-4 rounded-xl shadow-2xl max-w-[280px] border pointer-events-auto">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                    Lab Guide
                                </span>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={handleClose}>
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed mb-3">{currentText}</p>

                            {onSkipTask && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={() => onSkipTask(activeTaskId)}
                                >
                                    <SkipForward className="w-3 h-3 mr-1" />
                                    Skip this step
                                </Button>
                            )}
                        </div>

                        {/* Avatar */}
                        <div
                            className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-white ${isSpeaking ? 'ring-4 ring-primary/30' : ''
                                }`}
                        >
                            <Sparkles className="text-white w-7 h-7" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
