import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslationStore } from '@/lib/translationStore';
import { Translate } from '@/components/Translate';
import API_CONFIG from '@/config/api';

const TTS_URL = `${API_CONFIG.AI_SERVICE_API_URL}/tts/synthesize`;

export const HomePenman = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [message, setMessage] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasSpoken = useRef(false);
    const { currentLanguage, translate } = useTranslationStore();

    const getGreeting = useCallback(() => {
        const visits = parseInt(localStorage.getItem('penman_visits') || '0');
        if (visits === 0) {
            return "Hello! I am Penman, welcome to EduVerse, the only platform where you learn through simulations!";
        } else {
            return "Welcome back! I'm so excited to continue our learning journey together today. Where shall we start?";
        }
    }, []);

    const synthesizeSpeech = useCallback(async (textToSpeak: string) => {
        if (!textToSpeak || isMuted) return;

        try {
            setIsLoading(true);

            // Translate the greeting if not in English
            let finalMsg = textToSpeak;
            if (currentLanguage !== 'en') {
                const result = await translate(textToSpeak);
                finalMsg = Array.isArray(result) ? result[0] : (result as string);
            }

            const response = await fetch(TTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: finalMsg,
                    language_code: getLanguageCodeForTTS(currentLanguage),
                    speaking_rate: 1.0,
                    pitch: 0.0,
                }),
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('HomePenman TTS Error:', error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    }, [currentLanguage, isMuted, translate]);

    // Internal helper for language codes (copying logic from TextToSpeech component to avoid unnecessary dependency)
    const getLanguageCodeForTTS = (language: string): string => {
        const languageMap: Record<string, string> = {
            en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ml: 'ml-IN',
            ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
            bn: 'bn-IN', pa: 'pa-IN'
        };
        return languageMap[language] || 'en-IN';
    };

    useEffect(() => {
        const greeting = getGreeting();
        setMessage(greeting);

        // Delay appearance and speech for better UX
        const timer = setTimeout(() => {
            setIsVisible(true);
            if (!hasSpoken.current) {
                synthesizeSpeech(greeting);
                hasSpoken.current = true;

                // Track visits
                const visits = parseInt(localStorage.getItem('penman_visits') || '0');
                localStorage.setItem('penman_visits', (visits + 1).toString());
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            if (audioRef.current) audioRef.current.pause();
        };
    }, [getGreeting, synthesizeSpeech]);

    // Handle language shifts - re-greet in new language if it's the first time in that language during session
    useEffect(() => {
        if (hasSpoken.current && !isLoading && !isPlaying) {
            synthesizeSpeech(message);
        }
    }, [currentLanguage]);

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            synthesizeSpeech(message);
        } else {
            setIsMuted(true);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    initial={{ opacity: 0, x: -200 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -200 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.5
                    }}
                >
                    <div className="relative flex items-center">
                        {/* Penman Character */}
                        <motion.div
                            className="relative z-20 pointer-events-auto"
                            animate={{
                                y: [-8, 8, -8],
                                rotate: [-12, -18, -12]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="relative w-56 h-56 ml-[-40px]">
                                {/* Outer Glow */}
                                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full scale-150" />

                                {/* Image with refined rotation */}
                                <img
                                    src="/penman.png"
                                    alt="Penman"
                                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)] brightness-105"
                                    style={{ transform: 'rotate(40deg)' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/public/penman.png';
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* Speech Bubble */}
                        <AnimatePresence>
                            {(hasSpoken.current || isPlaying) && (
                                <motion.div
                                    className="absolute left-[200px] bottom-[120px] z-10 pointer-events-auto"
                                    initial={{ opacity: 0, scale: 0.2, x: -50, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                        delay: 0.3
                                    }}
                                >
                                    <div className="relative">
                                        {/* Professional Content Box */}
                                        <div className="bg-white/95 backdrop-blur-2xl border-[1.5px] border-blue-50 p-6 rounded-[2.5rem] rounded-bl-sm shadow-[0_25px_60px_-15px_rgba(30,58,138,0.25)] ring-1 ring-black/5 max-w-[320px]">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600/90">
                                                        Penman Assistant
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-blue-50 text-slate-400 transition-colors"
                                                    onClick={toggleMute}
                                                >
                                                    {isMuted ? (
                                                        <VolumeX className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <Volume2 className={cn("h-4 w-4", isPlaying && "text-blue-500 animate-pulse")} />
                                                    )}
                                                </Button>
                                            </div>

                                            <p className="text-[15px] font-semibold text-slate-800 leading-[1.6] tracking-tight">
                                                <Translate>{message}</Translate>
                                            </p>

                                            {isLoading && (
                                                <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center gap-2.5 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                                                    <div className="flex gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce"></div>
                                                    </div>
                                                    <span>Synthesizing</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tail / Connector */}
                                        <svg
                                            className="absolute -left-4 bottom-0 w-10 h-10 text-white/95 drop-shadow-[-5px_5px_10px_rgba(0,0,0,0.05)]"
                                            viewBox="0 0 32 32"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M32 0C32 0 24 4 16 12C8 20 0 32 0 32L32 32V0Z"
                                                fill="currentColor"
                                                stroke="rgba(219, 234, 254, 0.8)"
                                                strokeWidth="1"
                                            />
                                        </svg>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};