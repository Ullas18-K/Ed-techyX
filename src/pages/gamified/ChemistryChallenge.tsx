
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronDown,
    RotateCcw,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Play,
    Trophy,
    ArrowRight,
    X,
    Home,
    PartyPopper,
    Volume2,
    VolumeX,
    Beaker,
    Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLearningStore } from '@/lib/learningStore';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { Translate } from '@/components/Translate';

// --- TYPES & GAME STATE ---

type LevelId = 1 | 2 | 3;

// Level 1: Identify Substance
interface Level1State {
    solution1: 'none' | 'acid' | 'base' | 'neutral';
    solution2: 'none' | 'acid' | 'base' | 'neutral';
    solution3: 'none' | 'acid' | 'base' | 'neutral';
    indicator: 'none' | 'litmus_blue' | 'litmus_red' | 'phenolphthalein';
    testedSolutions: Set<number>; // Track which solutions have been tested
}

// Level 2: Gas Mystery
interface Level2State {
    reactant1: 'none' | 'zn' | 'na2co3';
    reactant2: 'none' | 'hcl';
    gasTest: 'none' | 'pop' | 'limewater';
    gasIdentified: 'none' | 'h2' | 'co2';
}

// Level 3: Neutralization
interface Level3State {
    acidDrops: number; // 0-10
    phChecked: boolean;
}

// --- CONFETTI COMPONENT ---
const ConfettiRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: { x: number, y: number, color: string, speed: number, size: number }[] = [];
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: 3 + Math.random() * 4,
                size: 4 + Math.random() * 6
            });
        }

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y += p.speed;
                if (p.y > canvas.height) p.y = -10;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
};

// --- PENMAN COMPONENT ---
const PuzzlePenman = ({
    text,
    visible,
    onHint,
    canHint,
    onClose,
    emotion = 'neutral',
    isSpeechEnabled,
    onToggleSpeech
}: {
    text: string;
    visible: boolean;
    onHint: () => void;
    canHint: boolean;
    onClose: () => void;
    emotion?: 'neutral' | 'happy' | 'start';
    isSpeechEnabled: boolean;
    onToggleSpeech: () => void;
}) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-none"
                >
                    {/* Bubble */}
                    <div className="glass-card p-4 rounded-2xl shadow-xl border border-gray-200/60 max-w-[280px] pointer-events-auto relative">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider"><Translate>Chemistry Guide</Translate></span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={onToggleSpeech}
                                    className={`p-1 rounded-md transition-colors ${isSpeechEnabled ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                                    title={isSpeechEnabled ? "Turn off speech" : "Turn on speech"}
                                >
                                    {isSpeechEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-gray-100"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                            <Translate>{text}</Translate>
                        </p>
                        {canHint && (
                            <div className="mt-3 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg"
                                    onClick={onHint}
                                >
                                    <Lightbulb className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-500" />
                                    <Translate>Need a Hint?</Translate>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    <motion.div
                        className="relative w-24 h-24 -mb-2 shrink-0 z-10"
                        animate={emotion === 'happy' || emotion === 'start' ? {
                            y: [-8, 0, -8],
                            rotate: [-5, 5, -5],
                            scale: [1.1, 1, 1.1]
                        } : {
                            y: [-4, 4, -4],
                            rotate: [-2, 2, -2]
                        }}
                        transition={{ duration: emotion === 'happy' ? 0.5 : 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full scale-75 translate-y-4" />
                        <img src="/penman.png" alt="Penman" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

export default function ChemistryChallenge() {
    const navigate = useNavigate();
    const { savePuzzleScore } = useLearningStore();
    const { roomId, submitPuzzleScore, updateMyPuzzleScore } = useRealtimeStudyRoomStore();

    // Game Logic State
    const [gameStarted, setGameStarted] = useState(false);
    const [level, setLevel] = useState<LevelId>(1);
    const [score, setScore] = useState(60);
    const [hintsCount, setHintsCount] = useState(0);

    // UI State
    const [penmanText, setPenmanText] = useState("Let's solve some chemistry mysteries!");
    const [penmanVisible, setPenmanVisible] = useState(true);
    const [hintAvailable, setHintAvailable] = useState(false);
    const [penmanEmotion, setPenmanEmotion] = useState<'neutral' | 'happy' | 'start'>('start');
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize speech synthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;

            const handleVoicesChanged = () => {
                if (synthRef.current) synthRef.current.getVoices();
            };

            synthRef.current.addEventListener('voiceschanged', handleVoicesChanged);
            return () => {
                if (synthRef.current) {
                    synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged);
                    synthRef.current.cancel();
                }
            };
        }
    }, []);

    const speakText = (text: string) => {
        if (!synthRef.current || !isSpeechEnabled) return;

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.2;

        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'))
            || voices.find(v => v.lang.startsWith('en'))
            || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        synthRef.current.speak(utterance);
    };

    // Auto-speak when Penman text changes
    useEffect(() => {
        if (penmanText && isSpeechEnabled) {
            speakText(penmanText);
        }
    }, [penmanText, isSpeechEnabled]);

    const [problemPanelOpen, setProblemPanelOpen] = useState(true);
    const [levelComplete, setLevelComplete] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    // Level Specific State
    const [l1, setL1] = useState<Level1State>({
        solution1: 'none',
        solution2: 'none',
        solution3: 'none',
        indicator: 'none',
        testedSolutions: new Set()
    });
    const [l2, setL2] = useState<Level2State>({
        reactant1: 'none',
        reactant2: 'none',
        gasTest: 'none',
        gasIdentified: 'none'
    });
    const [l3, setL3] = useState<Level3State>({
        acidDrops: 0,
        phChecked: false
    });

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- LEVEL LOGIC & SCENARIOS ---

    const LEVELS = {
        1: {
            title: "Identify the Substance",
            goal: "Use Indicators Wisely",
            desc: "Three unlabeled solutions. Use indicators to identify them as Acid, Base, or Neutral.",
            correct: (s: Level1State) => {
                // Correct answers: Solution 1 = Acid, Solution 2 = Base, Solution 3 = Neutral
                return s.solution1 === 'acid' && s.solution2 === 'base' && s.solution3 === 'neutral';
            },
            hint: "Blue litmus turns red in acid. Red litmus turns blue in base. Phenolphthalein turns pink in base.",
            constraints: "Limited tests. Choose indicators carefully."
        },
        2: {
            title: "The Gas Mystery",
            goal: "Identify the Gas",
            desc: "Two reactions produce gases. Identify which gas is produced using the correct test.",
            correct: (s: Level2State) => {
                // Zn + HCl -> H2 (pop test)
                // Na2CO3 + HCl -> CO2 (limewater test)
                if (s.reactant1 === 'zn' && s.reactant2 === 'hcl') {
                    return s.gasTest === 'pop' && s.gasIdentified === 'h2';
                }
                if (s.reactant1 === 'na2co3' && s.reactant2 === 'hcl') {
                    return s.gasTest === 'limewater' && s.gasIdentified === 'co2';
                }
                return false;
            },
            hint: "Metals + Acid produce Hydrogen (burns with pop). Carbonates + Acid produce CO2 (turns limewater milky).",
            constraints: "One test per reaction. Choose wisely."
        },
        3: {
            title: "Neutralise the Lab",
            goal: "Achieve pH 7",
            desc: "Add acid dropwise to the base until neutral. Don't overshoot!",
            correct: (s: Level3State) => {
                // pH 7 is achieved at exactly 5 drops
                return s.acidDrops === 5 && s.phChecked;
            },
            hint: "Start with strong base (pH 14). Each drop lowers pH. Neutral is pH 7.",
            constraints: "Minimum steps for maximum score."
        }
    };

    // --- ENGINE (SIMULATION LOOP) ---

    useEffect(() => {
        if (!gameStarted) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !containerRef.current) return;

        // Resize
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        const W = canvas.width;
        const H = canvas.height;

        // Clear
        ctx.fillStyle = '#020617'; // Slate 950
        ctx.fillRect(0, 0, W, H);

        if (level === 1) renderLevel1(ctx, W, H);
        if (level === 2) renderLevel2(ctx, W, H);
        if (level === 3) renderLevel3(ctx, W, H);

    }, [gameStarted, level, l1, l2, l3, containerRef.current?.clientWidth, levelComplete]);

    // --- RENDERERS ---

    const renderLevel1 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        // Lab table with gradient
        const tableGradient = ctx.createLinearGradient(0, H - 100, 0, H);
        tableGradient.addColorStop(0, '#1e293b');
        tableGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = tableGradient;
        ctx.fillRect(0, H - 100, W, 100);

        // Table edge highlight
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - 100);
        ctx.lineTo(W, H - 100);
        ctx.stroke();

        // Three test tubes
        const tubes = [
            { x: W * 0.25, label: '1', identified: l1.solution1 },
            { x: W * 0.5, label: '2', identified: l1.solution2 },
            { x: W * 0.75, label: '3', identified: l1.solution3 }
        ];

        tubes.forEach((tube, idx) => {
            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            // Test tube glass with gradient
            const glassGradient = ctx.createLinearGradient(tube.x - 20, 0, tube.x + 20, 0);
            glassGradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
            glassGradient.addColorStop(0.5, 'rgba(203, 213, 225, 0.5)');
            glassGradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');

            ctx.fillStyle = glassGradient;
            ctx.fillRect(tube.x - 20, H - 200, 40, 100);

            // Glass rim (top)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tube.x - 22, H - 202, 44, 4);

            // Test tube outline
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(tube.x - 20, H - 200);
            ctx.lineTo(tube.x - 20, H - 100);
            ctx.lineTo(tube.x + 20, H - 100);
            ctx.lineTo(tube.x + 20, H - 200);
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Liquid color based on indicator
            let liquidColor = '#334155';
            let glowColor = '';
            if (l1.testedSolutions.has(idx + 1)) {
                if (l1.indicator === 'litmus_blue') {
                    liquidColor = idx === 0 ? '#ef4444' : '#3b82f6';
                    glowColor = idx === 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
                } else if (l1.indicator === 'litmus_red') {
                    liquidColor = idx === 1 ? '#3b82f6' : '#ef4444';
                    glowColor = idx === 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                } else if (l1.indicator === 'phenolphthalein') {
                    liquidColor = idx === 1 ? '#ec4899' : 'rgba(100, 116, 139, 0.2)';
                    glowColor = idx === 1 ? 'rgba(236, 72, 153, 0.5)' : '';
                }
            }

            // Liquid with glow effect
            if (glowColor) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 20;
            }

            ctx.fillStyle = liquidColor;
            ctx.fillRect(tube.x - 18, H - 150, 36, 48);

            // Liquid surface shine
            const shineGradient = ctx.createLinearGradient(tube.x - 18, H - 150, tube.x - 18, H - 145);
            shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shineGradient;
            ctx.fillRect(tube.x - 18, H - 150, 36, 5);

            ctx.shadowBlur = 0;

            // Label with background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(tube.x - 15, H - 90, 30, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tube.label, tube.x, H - 80);

            // Identification badge
            if (tube.identified !== 'none') {
                ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
                ctx.fillRect(tube.x - 30, H - 220, 60, 20);
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 2;
                ctx.strokeRect(tube.x - 30, H - 220, 60, 20);
                ctx.fillStyle = '#22c55e';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(tube.identified.toUpperCase(), tube.x, H - 210);
            }
        });

        // Title with glow
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Indicators Available:', W / 2, 30);
        ctx.shadowBlur = 0;
    };

    const renderLevel2 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        // Lab table with gradient
        const tableGradient = ctx.createLinearGradient(0, H - 100, 0, H);
        tableGradient.addColorStop(0, '#1e293b');
        tableGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = tableGradient;
        ctx.fillRect(0, H - 100, W, 100);

        // Table edge
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - 100);
        ctx.lineTo(W, H - 100);
        ctx.stroke();

        // Test tube with delivery tube
        const tubeX = W * 0.3;
        const tubeY = H - 200;

        // Shadow for test tube
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // Test tube glass gradient
        const glassGradient = ctx.createLinearGradient(tubeX - 30, 0, tubeX + 30, 0);
        glassGradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
        glassGradient.addColorStop(0.5, 'rgba(203, 213, 225, 0.5)');
        glassGradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');
        ctx.fillStyle = glassGradient;
        ctx.fillRect(tubeX - 30, tubeY, 60, H - 100 - tubeY);

        // Test tube outline
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tubeX - 30, tubeY);
        ctx.lineTo(tubeX - 30, H - 100);
        ctx.lineTo(tubeX + 30, H - 100);
        ctx.lineTo(tubeX + 30, tubeY);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Reactants
        if (l2.reactant1 !== 'none') {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tubeX - 25, H - 130, 50, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(l2.reactant1.toUpperCase(), tubeX, H - 115);
        }

        if (l2.reactant2 !== 'none') {
            const liquidGradient = ctx.createLinearGradient(tubeX - 25, H - 150, tubeX - 25, H - 132);
            liquidGradient.addColorStop(0, 'rgba(100, 200, 255, 0.6)');
            liquidGradient.addColorStop(1, 'rgba(100, 200, 255, 0.3)');
            ctx.fillStyle = liquidGradient;
            ctx.fillRect(tubeX - 25, H - 150, 50, 18);
        }

        // Animated gas bubbles if reacting
        if (l2.reactant1 !== 'none' && l2.reactant2 !== 'none') {
            const time = Date.now() / 1000;
            for (let i = 0; i < 8; i++) {
                const offset = (time + i * 0.3) % 2;
                const y = tubeY + 60 - (offset * 40);
                const opacity = 1 - (offset / 2);

                ctx.beginPath();
                ctx.arc(tubeX - 15 + (i % 3) * 15, y, 3 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(200, 220, 255, ${opacity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Delivery tube with gradient
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tubeX + 30, tubeY + 50);
        ctx.lineTo(tubeX + 100, tubeY + 50);
        ctx.lineTo(tubeX + 100, tubeY + 100);
        ctx.stroke();

        // Limewater container
        const lwX = W * 0.7;

        // Shadow for container
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lwX, H - 150, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Limewater (milky if CO2)
        if (l2.gasTest === 'limewater' && l2.reactant1 === 'na2co3') {
            const milkyGradient = ctx.createRadialGradient(lwX, H - 150, 0, lwX, H - 150, 35);
            milkyGradient.addColorStop(0, '#f3f4f6');
            milkyGradient.addColorStop(1, '#e5e7eb');
            ctx.fillStyle = milkyGradient;
            ctx.beginPath();
            ctx.arc(lwX, H - 150, 35, 0, Math.PI * 2);
            ctx.fill();

            // Milky label
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('MILKY!', lwX, H - 180);
        }

        // Flame (for pop test) with animation
        if (l2.gasTest === 'pop') {
            const time = Date.now() / 100;
            const flicker = Math.sin(time) * 3;

            // Flame glow
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 20;

            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(tubeX + 100, tubeY + 40 + flicker);
            ctx.lineTo(tubeX + 90, tubeY + 20 + flicker / 2);
            ctx.lineTo(tubeX + 110, tubeY + 20 + flicker / 2);
            ctx.fill();

            // Inner flame
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(tubeX + 100, tubeY + 35 + flicker);
            ctx.lineTo(tubeX + 95, tubeY + 25 + flicker / 2);
            ctx.lineTo(tubeX + 105, tubeY + 25 + flicker / 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        // Title
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Gas Production & Testing', W / 2, 30);
        ctx.shadowBlur = 0;
    };

    const renderLevel3 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        // Lab table with gradient
        const tableGradient = ctx.createLinearGradient(0, H - 100, 0, H);
        tableGradient.addColorStop(0, '#1e293b');
        tableGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = tableGradient;
        ctx.fillRect(0, H - 100, W, 100);

        // Table edge
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - 100);
        ctx.lineTo(W, H - 100);
        ctx.stroke();

        // Burette
        const buretteX = W * 0.3;

        // Burette stand
        ctx.fillStyle = '#475569';
        ctx.fillRect(buretteX - 2, 30, 4, H - 200);

        // Burette glass
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(buretteX - 8, 50);
        ctx.lineTo(buretteX - 8, H - 200);
        ctx.lineTo(buretteX + 8, H - 200);
        ctx.lineTo(buretteX + 8, 50);
        ctx.stroke();

        // Graduations
        for (let i = 0; i <= 10; i++) {
            const y = 50 + (i * 10);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buretteX + 8, y);
            ctx.lineTo(buretteX + 12, y);
            ctx.stroke();

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(String(i), buretteX + 14, y + 3);
        }

        // Acid level in burette with gradient
        const acidHeight = 100 - (l3.acidDrops * 10);
        if (acidHeight > 0) {
            const acidGradient = ctx.createLinearGradient(buretteX - 6, 50, buretteX + 6, 50);
            acidGradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
            acidGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.8)');
            acidGradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
            ctx.fillStyle = acidGradient;
            ctx.fillRect(buretteX - 6, 50, 12, acidHeight);
        }

        // Burette tip
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(buretteX - 3, H - 200);
        ctx.lineTo(buretteX, H - 195);
        ctx.lineTo(buretteX + 3, H - 200);
        ctx.fill();

        // Flask
        const flaskX = W * 0.5;

        // Shadow for flask
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // Flask body
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(flaskX, H - 150, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Flask neck
        ctx.beginPath();
        ctx.moveTo(flaskX - 15, H - 210);
        ctx.lineTo(flaskX - 15, H - 170);
        ctx.lineTo(flaskX + 15, H - 170);
        ctx.lineTo(flaskX + 15, H - 210);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Solution color (changes with pH)
        const pH = 14 - (l3.acidDrops * 1.4);
        let solutionColor = '#ec4899'; // Pink (base)
        let glowColor = 'rgba(236, 72, 153, 0.5)';

        if (pH < 8) {
            solutionColor = 'rgba(100, 116, 139, 0.3)'; // Neutral/acid
            glowColor = '';
        }

        // Solution with glow
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 25;
        }

        ctx.fillStyle = solutionColor;
        ctx.beginPath();
        ctx.arc(flaskX, H - 150, 55, 0, Math.PI * 2);
        ctx.fill();

        // Surface shine
        const shineGradient = ctx.createRadialGradient(flaskX - 20, H - 170, 0, flaskX, H - 150, 55);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGradient;
        ctx.beginPath();
        ctx.arc(flaskX, H - 150, 55, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // pH indicator with background
        if (l3.phChecked) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(flaskX - 50, H - 235, 100, 30);
            ctx.strokeStyle = pH === 7 ? '#22c55e' : '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(flaskX - 50, H - 235, 100, 30);

            ctx.fillStyle = pH === 7 ? '#22c55e' : '#fff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`pH: ${pH.toFixed(1)}`, flaskX, H - 220);
        }

        // pH scale (right side) with gradient
        const scaleX = W * 0.8;
        const scaleGradient = ctx.createLinearGradient(scaleX - 10, 100, scaleX - 10, H - 100);
        scaleGradient.addColorStop(0, '#ef4444');      // Red (acidic)
        scaleGradient.addColorStop(0.5, '#22c55e');    // Green (neutral)
        scaleGradient.addColorStop(1, '#3b82f6');      // Blue (basic)

        ctx.fillStyle = scaleGradient;
        ctx.fillRect(scaleX - 15, 100, 10, H - 200);

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(scaleX - 15, 100, 10, H - 200);

        // pH markers
        for (let i = 0; i <= 14; i++) {
            const y = 100 + ((H - 200) / 14) * i;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(String(14 - i), scaleX + 5, y + 4);

            // Tick marks
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(scaleX - 15, y);
            ctx.lineTo(scaleX - 20, y);
            ctx.stroke();
        }

        // Current pH indicator on scale
        if (l3.phChecked) {
            const currentY = 100 + ((H - 200) / 14) * (14 - pH);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(scaleX - 25, currentY);
            ctx.lineTo(scaleX - 15, currentY - 5);
            ctx.lineTo(scaleX - 15, currentY + 5);
            ctx.fill();
        }

        // Title
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Acid-Base Neutralization', W / 2, 30);
        ctx.shadowBlur = 0;
    };

    // --- GAME ACTIONS ---

    const handleStart = () => {
        setGameStarted(true);
        setPenmanText("Look carefully. What do you see?");
        setPenmanEmotion('neutral');
    };

    const handleLevelCheck = () => {
        let passed = false;
        if (level === 1 && LEVELS[1].correct(l1)) passed = true;
        if (level === 2 && LEVELS[2].correct(l2)) passed = true;
        if (level === 3 && LEVELS[3].correct(l3)) passed = true;

        if (passed) {
            setPenmanText(level === 3 ? "Brilliant! You've mastered chemistry!" : "Perfect! Ready for the next challenge?");
            setPenmanVisible(true);
            setPenmanEmotion('happy');
            setScore(s => s + 30);
            setLevelComplete(true);
        } else {
            setScore(s => Math.max(0, s - 10));
            setPenmanText("Not quite. Check the chemistry.");
            setPenmanEmotion('neutral');
            setPenmanVisible(true);
            setHintAvailable(true);

            // Shake visual
            if (canvasRef.current) {
                canvasRef.current.style.transform = "translateX(5px)";
                setTimeout(() => canvasRef.current!.style.transform = "none", 100);
            }
        }
    };

    const nextLevel = () => {
        if (level === 3) {
            setGameComplete(true);
            handlePuzzleComplete(score);
            return;
        }

        setLevelComplete(false);
        setLevel(prev => (prev + 1) as LevelId);

        setPenmanText("New scenario loaded. Observe carefully.");
        setPenmanEmotion('neutral');
        setPenmanVisible(true);
        setProblemPanelOpen(true);
    };

    const handlePuzzleComplete = (finalScore: number) => {
        savePuzzleScore(finalScore);

        if (roomId) {
            submitPuzzleScore(finalScore);
            updateMyPuzzleScore(finalScore);
        }

        toast.success(`Puzzle completed! You earned ${finalScore} points!`);
    };

    const handleSkipPuzzle = () => {
        savePuzzleScore(0);

        if (roomId) {
            submitPuzzleScore(0);
            updateMyPuzzleScore(0);
        }

        toast.info('Puzzle skipped. Moving to reflection...');
        navigate('/reflection');
    };

    const handleContinueToReflection = () => {
        navigate('/reflection');
    };

    const useHint = () => {
        const cost = (hintsCount * 10) + 10;
        if (score >= cost) {
            setScore(s => s - cost);
            setHintsCount(h => h + 1);
            setPenmanText(LEVELS[level].hint);
            setPenmanVisible(true);
            setHintAvailable(false);
            toast.info(`Hint used! -${cost} points`);
        } else {
            setPenmanText("Not enough points for a hint!");
            setPenmanVisible(true);
        }
    };

    const updateL1 = (updates: Partial<Level1State>) => setL1(prev => ({ ...prev, ...updates }));
    const updateL2 = (updates: Partial<Level2State>) => setL2(prev => ({ ...prev, ...updates }));
    const updateL3 = (updates: Partial<Level3State>) => setL3(prev => ({ ...prev, ...updates }));

    // Level 1: Test solution with indicator
    const testSolution = (solutionNum: 1 | 2 | 3) => {
        if (l1.indicator === 'none') {
            toast.error("Select an indicator first!");
            return;
        }

        setL1(prev => ({
            ...prev,
            testedSolutions: new Set([...prev.testedSolutions, solutionNum])
        }));
    };

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex flex-col text-gray-800 font-sans overflow-hidden fixed inset-0">

            {/* GAME START OVERLAY */}
            {!gameStarted && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="glass-card border border-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
                    >
                        <motion.div
                            animate={{ rotate: [-5, 5, -5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-28 h-28 mx-auto mb-6 relative"
                        >
                            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                            <img src="/penman.png" alt="Penman" className="w-full h-full object-contain relative z-10" />
                        </motion.div>

                        <h1 className="text-2xl font-black text-gray-900 mb-3"><Translate>Ready to Start?</Translate></h1>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed"><Translate>Use chemistry logic to solve the puzzles. Watch your score!</Translate></p>

                        <Button
                            onClick={handleStart}
                            className="w-full h-12 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg glow-subtle hover:scale-105 transition-all"
                        >
                            <Play className="mr-2 w-5 h-5 fill-white" />
                            <Translate>LET'S GO!</Translate>
                        </Button>
                    </motion.div>
                </div>
            )}

            {gameComplete && <ConfettiRain />}

            {/* TOP BAR */}
            <div className="h-16 border-b border-gray-200 glass-subtle flex items-center justify-between px-6 shrink-0 z-20 rounded-b-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowRight className="w-5 h-5 rotate-180 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide text-gray-900"><Translate>CHEMISTRY</Translate> <span className="text-primary"><Translate>CHALLENGE</Translate></span></h1>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500">
                            <span><Translate>Level</Translate> {level}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span><Translate>{LEVELS[level].title}</Translate></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-500"><Translate>Current Score</Translate></span>
                        <span className={`text-2xl font-mono font-bold ${score < 50 ? 'text-red-500' : 'text-green-600'}`}>
                            {score}
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* PROBLEM PANEL */}
                <AnimatePresence>
                    {problemPanelOpen && gameStarted && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 180, damping: 18 }}
                            className="shrink-0 border-b border-gray-200 glass-subtle shadow-sm z-30"
                        >
                            <div className="px-4 py-2">
                                <Card className="glass-card border border-gray-200/60 rounded-xl p-3 shadow-sm flex items-start gap-3 relative">
                                    <div className="w-0.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 absolute left-3 top-3 bottom-3" />
                                    <div className="flex-1 pl-2">
                                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5 text-sm">
                                            <Trophy className="w-3.5 h-3.5 text-amber-600" />
                                            <Translate>{LEVELS[level].title}</Translate>: <Translate>{LEVELS[level].goal}</Translate>
                                        </h3>
                                        <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
                                            <Translate>{LEVELS[level].desc}</Translate>
                                        </p>
                                        <Badge variant="outline" className="border-primary/40 bg-blue-50 text-primary font-mono text-[9px] rounded-md px-1.5 py-0.5">
                                            <Translate>Constraints</Translate>: <Translate>{LEVELS[level].constraints}</Translate>
                                        </Badge>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setProblemPanelOpen(false)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full shrink-0 w-6 h-6">
                                        <X size={14} />
                                    </Button>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MAIN GAME AREA */}
                <div className="flex-1 flex overflow-hidden">

                    {/* CANVAS */}
                    <div className="flex-1 relative bg-black rounded-2xl overflow-hidden" ref={containerRef}>

                        {/* SHOW PROBLEM BUTTON */}
                        {!problemPanelOpen && gameStarted && (
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
                            >
                                <Button
                                    onClick={() => setProblemPanelOpen(true)}
                                    className="glass-card border border-gray-200/60 shadow-lg text-gray-700 hover:text-gray-900 px-4 py-2 h-auto rounded-full"
                                    variant="ghost"
                                >
                                    <Trophy className="w-4 h-4 mr-2 text-amber-600" />
                                    <span className="text-xs font-semibold"><Translate>Show Task</Translate></span>
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                            </motion.div>
                        )}

                        {/* LEVEL COMPLETE MODAL */}
                        <AnimatePresence>
                            {levelComplete && !gameComplete && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
                                >
                                    <div className="glass-card border border-gray-200 p-6 rounded-2xl shadow-2xl w-[320px] text-center">
                                        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight"><Translate>Level Cleared!</Translate></h2>
                                        <p className="text-xs text-gray-600 mb-5"><Translate>Nice work! Penman is impressed with your logic. Ready for the next challenge?</Translate></p>
                                        <Button onClick={nextLevel} className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg">
                                            <Translate>Next Level</Translate> <ArrowRight className="ml-1.5 w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* GAME COMPLETE MODAL */}
                        <AnimatePresence>
                            {gameComplete && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                        className="glass-card border border-white/20 p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="inline-block mb-6 relative z-10"
                                        >
                                            <PartyPopper className="w-20 h-20 text-yellow-500 drop-shadow-lg" />
                                        </motion.div>

                                        <h1 className="text-4xl font-black text-gradient mb-4 relative z-10">
                                            <Translate>YOU DID IT!</Translate>
                                        </h1>

                                        <p className="text-lg text-gray-700 mb-8 font-light leading-relaxed relative z-10">
                                            <Translate>You've successfully completed the Chemistry Challenge with a score of</Translate> <span className="text-green-600 font-bold">{score}</span>.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                                            <Button
                                                onClick={() => navigate('/')}
                                                variant="outline"
                                                className="h-12 px-6 text-lg rounded-xl font-bold border-gray-300 hover:bg-gray-50 flex-1"
                                            >
                                                <Home className="mr-2 w-5 h-5" /> <Translate>Home</Translate>
                                            </Button>
                                            <Button
                                                onClick={handleContinueToReflection}
                                                className="h-12 px-6 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg glow-subtle flex-1"
                                            >
                                                <Translate>Continue</Translate> <ArrowRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <canvas
                            ref={canvasRef}
                            className="w-full h-full block"
                        />

                        <PuzzlePenman
                            text={penmanText}
                            visible={penmanVisible && !levelComplete && !gameComplete && gameStarted}
                            canHint={hintAvailable && score >= 10}
                            onHint={useHint}
                            onClose={() => setPenmanVisible(false)}
                            emotion={penmanEmotion}
                            isSpeechEnabled={isSpeechEnabled}
                            onToggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
                        />
                    </div>

                    {/* SIDEBAR - CONTROLS */}
                    <div className="w-80 glass-card border-l border-gray-200/60 p-6 flex flex-col gap-6 z-20 shadow-xl rounded-l-2xl">
                        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {level}
                            </div>
                            <h2 className="font-bold text-gray-900"><Translate>Control Panel</Translate></h2>
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* LEVEL 1 CONTROLS */}
                            {level === 1 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Select Indicator</Translate></label>
                                        <div className="flex flex-col gap-2">
                                            <Button disabled={levelComplete} variant={l1.indicator === 'litmus_blue' ? "default" : "outline"} onClick={() => updateL1({ indicator: 'litmus_blue' })}><Translate>Blue Litmus</Translate></Button>
                                            <Button disabled={levelComplete} variant={l1.indicator === 'litmus_red' ? "default" : "outline"} onClick={() => updateL1({ indicator: 'litmus_red' })}><Translate>Red Litmus</Translate></Button>
                                            <Button disabled={levelComplete} variant={l1.indicator === 'phenolphthalein' ? "default" : "outline"} onClick={() => updateL1({ indicator: 'phenolphthalein' })}><Translate>Phenolphthalein</Translate></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Test Solutions</Translate></label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button size="sm" disabled={levelComplete} onClick={() => testSolution(1)}>1</Button>
                                            <Button size="sm" disabled={levelComplete} onClick={() => testSolution(2)}>2</Button>
                                            <Button size="sm" disabled={levelComplete} onClick={() => testSolution(3)}>3</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Label Solutions</Translate></label>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <span className="text-xs w-8">1:</span>
                                                <select disabled={levelComplete} value={l1.solution1} onChange={(e) => updateL1({ solution1: e.target.value as any })} className="flex-1 text-xs p-1 rounded border">
                                                    <option value="none">?</option>
                                                    <option value="acid">Acid</option>
                                                    <option value="base">Base</option>
                                                    <option value="neutral">Neutral</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-xs w-8">2:</span>
                                                <select disabled={levelComplete} value={l1.solution2} onChange={(e) => updateL1({ solution2: e.target.value as any })} className="flex-1 text-xs p-1 rounded border">
                                                    <option value="none">?</option>
                                                    <option value="acid">Acid</option>
                                                    <option value="base">Base</option>
                                                    <option value="neutral">Neutral</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-xs w-8">3:</span>
                                                <select disabled={levelComplete} value={l1.solution3} onChange={(e) => updateL1({ solution3: e.target.value as any })} className="flex-1 text-xs p-1 rounded border">
                                                    <option value="none">?</option>
                                                    <option value="acid">Acid</option>
                                                    <option value="base">Base</option>
                                                    <option value="neutral">Neutral</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* LEVEL 2 CONTROLS */}
                            {level === 2 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Choose Reactants</Translate></label>
                                        <div className="flex flex-col gap-2">
                                            <Button disabled={levelComplete} variant={l2.reactant1 === 'zn' ? "default" : "outline"} onClick={() => updateL2({ reactant1: 'zn' })}><Translate>Zinc (Zn)</Translate></Button>
                                            <Button disabled={levelComplete} variant={l2.reactant1 === 'na2co3' ? "default" : "outline"} onClick={() => updateL2({ reactant1: 'na2co3' })}><Translate>Sodium Carbonate</Translate></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Add Acid</Translate></label>
                                        <Button disabled={levelComplete} variant={l2.reactant2 === 'hcl' ? "default" : "outline"} onClick={() => updateL2({ reactant2: 'hcl' })} className="w-full"><Translate>Add HCl</Translate></Button>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Perform Gas Test</Translate></label>
                                        <div className="flex flex-col gap-2">
                                            <Button disabled={levelComplete} variant={l2.gasTest === 'pop' ? "default" : "outline"} onClick={() => updateL2({ gasTest: 'pop' })}><Flame className="w-4 h-4 mr-2" /><Translate>Pop Test</Translate></Button>
                                            <Button disabled={levelComplete} variant={l2.gasTest === 'limewater' ? "default" : "outline"} onClick={() => updateL2({ gasTest: 'limewater' })}><Beaker className="w-4 h-4 mr-2" /><Translate>Limewater Test</Translate></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Identify Gas</Translate></label>
                                        <div className="flex gap-2">
                                            <Button size="sm" disabled={levelComplete} variant={l2.gasIdentified === 'h2' ? "default" : "outline"} onClick={() => updateL2({ gasIdentified: 'h2' })} className="flex-1">H₂</Button>
                                            <Button size="sm" disabled={levelComplete} variant={l2.gasIdentified === 'co2' ? "default" : "outline"} onClick={() => updateL2({ gasIdentified: 'co2' })} className="flex-1">CO₂</Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* LEVEL 3 CONTROLS */}
                            {level === 3 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Add Acid Dropwise</Translate></label>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" disabled={levelComplete || l3.acidDrops >= 10} onClick={() => updateL3({ acidDrops: l3.acidDrops + 1 })}>+1 Drop</Button>
                                            <span className="text-sm font-mono">{l3.acidDrops} drops</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <Button disabled={levelComplete} variant={l3.phChecked ? "default" : "outline"} onClick={() => updateL3({ phChecked: true })} className="w-full"><Translate>Check pH</Translate></Button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-200 space-y-4">
                            <Button
                                variant="outline"
                                className="w-full h-10 text-sm font-medium text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg"
                                onClick={handleSkipPuzzle}
                            >
                                <Translate>Skip & Continue</Translate>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <div>
                                <Button
                                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg glow-subtle rounded-lg"
                                    onClick={handleLevelCheck}
                                    disabled={levelComplete}
                                >
                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                    <Translate>TEST CONFIGURATION</Translate>
                                </Button>
                                <p className="text-center text-[10px] text-gray-500 mt-2">
                                    <Translate>Penalty applies for incorrect attempts.</Translate>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
