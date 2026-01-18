
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
    VolumeX
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

interface GameState {
    level: LevelId;
    score: number;
    hintsUsed: number;
    penmanText: string;
    showHint: boolean;
    levelComplete: boolean;
    history: string[];
}

// Level 1 Config (Reflection)
interface Level1State {
    m1Angle: number; // 0, 45, 90, 135
    m2Angle: number; // 0, 45, 90, 135
}

// Level 2 Config (Refraction)
interface Level2State {
    lensType: 'glass_convex' | 'glass_concave' | 'air';
    lensPos: 'near' | 'mid' | 'far'; // Relative to source
}

// Level 3 Config (TIR)
interface Level3State {
    incidentAngle: 30 | 45 | 60;
    coreMaterial: 'water' | 'glass' | 'diamond';
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
                y: Math.random() * -canvas.height, // Start above
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
                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider"><Translate>Optics Guide</Translate></span>
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

export default function OpticsPuzzle() {
    const navigate = useNavigate();
    const { savePuzzleScore } = useLearningStore();
    const { roomId, submitPuzzleScore, updateMyPuzzleScore } = useRealtimeStudyRoomStore();

    // Game Logic State
    const [gameStarted, setGameStarted] = useState(false);
    const [level, setLevel] = useState<LevelId>(1);
    const [score, setScore] = useState(60); // Starting Score Updated to 60
    const [hintsCount, setHintsCount] = useState(0); // Track total hints used

    // UI State
    const [penmanText, setPenmanText] = useState("Let's solve some light mysteries!");
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
                // This triggers voice loading in some browsers
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
        utterance.pitch = 1.2; // Slightly higher pitch for Penman

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
    const [l1, setL1] = useState<Level1State>({ m1Angle: 0, m2Angle: 0 });
    const [l2, setL2] = useState<Level2State>({ lensType: 'air', lensPos: 'mid' });
    const [l3, setL3] = useState<Level3State>({ incidentAngle: 45, coreMaterial: 'glass' });

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- LEVEL LOGIC & SCENARIOS ---

    const LEVELS = {
        1: {
            title: "Reflection",
            goal: "Hit the Sensor",
            desc: "The sensor is hidden behind a wall. Use mirrors to guide the laser.",
            correct: (s: Level1State) => s.m1Angle === 45 && s.m2Angle === 45,
            hint: "Light reflects at the same angle it hits. You need two 90-degree turns.",
            constraints: "Use exactly 2 mirrors. 45° increments only."
        },
        2: {
            title: "Refraction",
            goal: "Focus the Beam",
            desc: "The detector needs intense light. Focus the parallel rays.",
            correct: (s: Level2State) => s.lensType === 'glass_convex' && s.lensPos === 'mid',
            hint: "Convex lenses converge light. Place it where the focal point hits the sensor.",
            constraints: "Select the correct lens type and position."
        },
        3: {
            title: "Total Internal Reflection",
            goal: "Trap the Light",
            desc: "Keep the signal inside the fiber core. Don't let it leak!",
            correct: (s: Level3State) => s.coreMaterial === 'diamond' || (s.coreMaterial === 'glass' && s.incidentAngle === 60),
            hint: "High Refractive Index or shallow angles keep light trapped (TIR).",
            constraints: "Choose material and incident angle carefully."
        }
    };

    // --- ENGINE (SIMULATION LOOP) ---

    useEffect(() => {
        if (!gameStarted) return; // Don't render game loop if valid start not triggered

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
        const src = { x: 50, y: H - 100 };
        const m1Pos = { x: 50, y: 100 };
        const m2Pos = { x: W - 100, y: 100 };
        const target = { x: W - 100, y: H - 100 };

        // Background grid/box
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(150, 150, W - 300, H - 300);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 150, W - 300, H - 300);

        // Target Sensor with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.arc(target.x, target.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("SENSOR", target.x, target.y + 35);

        // Laser Source
        ctx.fillStyle = '#22c55e';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22c55e';
        ctx.fillRect(src.x - 15, src.y - 15, 30, 30);
        ctx.shadowBlur = 0;

        const drawMirror = (x: number, y: number, angle: number, label: string) => {
            ctx.save();
            ctx.translate(x, y);

            let rotation = 0;
            if (angle === 45) rotation = 135;
            else if (angle === 135) rotation = 45;
            else rotation = angle;

            ctx.rotate((rotation * Math.PI) / 180);

            // Mirror body
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255,255,255,0.3)';
            const mirrorGradient = ctx.createLinearGradient(-25, 0, 25, 0);
            mirrorGradient.addColorStop(0, '#94a3b8');
            mirrorGradient.addColorStop(0.5, '#f8fafc');
            mirrorGradient.addColorStop(1, '#94a3b8');
            ctx.fillStyle = mirrorGradient;
            ctx.fillRect(-25, -3, 50, 6);

            // Reflective surface
            ctx.fillStyle = '#fff';
            ctx.fillRect(-25, -3, 50, 2);

            ctx.restore();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, x, y - 45);
        };

        drawMirror(m1Pos.x, m1Pos.y, l1.m1Angle, "M1");
        drawMirror(m2Pos.x, m2Pos.y, l1.m2Angle, "M2");

        // LASER RAY TRACING
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);

        let path = [{ x: src.x, y: src.y }];
        let hitM1 = false;
        let hitM2 = false;

        // Ray 1: Up
        if (l1.m1Angle === 45) {
            path.push(m1Pos);
            hitM1 = true;
        } else {
            path.push({ x: src.x, y: 0 });
        }

        if (hitM1) {
            // Ray 2: Right
            if (l1.m2Angle === 45) {
                path.push(m2Pos);
                path.push(target);
                hitM2 = true;
            } else {
                path.push({ x: W, y: m1Pos.y });
            }
        }

        // Draw Laser Beam with Glow
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();

        // Inner Beam
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();

        if (hitM2) {
            // Success hit effect
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(target.x, target.y, 22 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    };

    const renderLevel2 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const srcY = H / 2;
        const lensX = W / 2;
        const screenX = W - 50;

        // Optical Axis
        ctx.strokeStyle = '#334155'; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(0, srcY); ctx.lineTo(W, srcY); ctx.stroke(); ctx.setLineDash([]);

        const srcX = l2.lensPos === 'near' ? lensX - 120 : l2.lensPos === 'mid' ? lensX - 220 : lensX - 320;

        // Light Source
        const sourceGradient = ctx.createRadialGradient(srcX, srcY, 2, srcX, srcY, 12);
        sourceGradient.addColorStop(0, '#fff');
        sourceGradient.addColorStop(0.5, '#fbbf24');
        sourceGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = sourceGradient;
        ctx.beginPath(); ctx.arc(srcX, srcY, 12, 0, Math.PI * 2); ctx.fill();

        // Lens
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(147, 197, 253, 0.5)';
        ctx.fillStyle = 'rgba(191, 219, 254, 0.3)';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (l2.lensType === 'glass_convex') {
            ctx.ellipse(lensX, srcY, 12, 90, 0, 0, Math.PI * 2);
        } else if (l2.lensType === 'glass_concave') {
            ctx.moveTo(lensX - 8, srcY - 90); ctx.lineTo(lensX + 8, srcY - 90);
            ctx.quadraticCurveTo(lensX + 2, srcY, lensX + 8, srcY + 90);
            ctx.lineTo(lensX - 8, srcY + 90);
            ctx.quadraticCurveTo(lensX - 2, srcY, lensX - 8, srcY - 90);
        }
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;

        // Screen Sensor
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(screenX, srcY - 60, 15, 120);
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';
        ctx.fillRect(screenX, srcY - 5, 10, 10);
        ctx.shadowBlur = 0;

        // RAY TRACING
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.shadowBlur = 8; ctx.shadowColor = '#fbbf24';

        const rays = [-0.15, -0.07, 0, 0.07, 0.15];
        rays.forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(srcX, srcY);
            const dy = Math.tan(angle) * (lensX - srcX);
            const hitY = srcY + dy;
            ctx.lineTo(lensX, hitY);

            if (l2.lensType === 'glass_convex') {
                const f = 160;
                const do_ = lensX - srcX;

                if (do_ > f) {
                    const di = (f * do_) / (do_ - f);
                    const focalPointX = lensX + di;
                    const slope = (srcY - hitY) / (focalPointX - lensX);
                    const yAtScreen = srcY + slope * (screenX - focalPointX);
                    ctx.lineTo(screenX, yAtScreen);
                } else {
                    ctx.lineTo(W, hitY + (hitY - srcY) * 2);
                }
            } else if (l2.lensType === 'glass_concave') {
                ctx.lineTo(W, hitY + (hitY - srcY) * 2);
            } else {
                ctx.lineTo(W, hitY + dy * 2);
            }
            ctx.stroke();
        });
        ctx.shadowBlur = 0;
    };

    const renderLevel3 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const cy = H / 2;

        // Draw Optical Fiber with Cladding
        ctx.beginPath();
        const fiberGradient = ctx.createLinearGradient(0, cy - 30, 0, cy + 30);
        fiberGradient.addColorStop(0, '#0f172a');
        fiberGradient.addColorStop(0.5, '#1e293b');
        fiberGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = fiberGradient;
        ctx.fillRect(100, cy - 30, W - 200, 60);

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, cy - 30, W - 200, 60);

        // Core
        ctx.fillStyle = 'rgba(147, 197, 253, 0.1)';
        ctx.fillRect(100, cy - 15, W - 200, 30);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(100, cy - 15); ctx.lineTo(W - 100, cy - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(100, cy + 15); ctx.lineTo(W - 100, cy + 15); ctx.stroke();

        const n = l3.coreMaterial === 'diamond' ? 2.4 : l3.coreMaterial === 'glass' ? 1.5 : 1.33;
        const criticalAngleDeg = Math.asin(1.0 / n) * (180 / Math.PI);

        // WAVEGUIDE RAY
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(100, cy);

        const segments = 4;
        const segW = (W - 200) / segments;
        let x = 100;
        let y = cy;

        if (l3.incidentAngle > criticalAngleDeg) {
            for (let i = 0; i < segments; i++) {
                x += segW;
                y = (i % 2 === 0) ? cy - 15 : cy + 15;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, cy + (Math.random() - 0.5) * 40);
        } else {
            // Leaks at first bounce
            ctx.lineTo(100 + segW, cy - 15);
            ctx.lineTo(100 + segW + 50, cy - 80);

            // Leak point effect
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(100 + segW, cy - 15, 6, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        ctx.stroke();

        // Inner beam
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Info label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Critical Angle: ${criticalAngleDeg.toFixed(1)}°`, W / 2, cy + 80);
    };

    // --- GAME ACTIONS ---

    const handleStart = () => {
        setGameStarted(true);
        setPenmanText("Scan the room. Where should the light go?");
        setPenmanEmotion('neutral');
    };

    const handleLevelCheck = () => {
        let passed = false;
        if (level === 1 && LEVELS[1].correct(l1)) passed = true;
        if (level === 2 && LEVELS[2].correct(l2)) passed = true;
        if (level === 3 && LEVELS[3].correct(l3)) passed = true;

        if (passed) {
            setPenmanText(level === 3 ? "Brilliant! You've mastered them all!" : "Perfect alignment! Ready for the next challenge?");
            setPenmanVisible(true);
            setPenmanEmotion('happy');
            setScore(s => s + 30); // Reward for completion
            setLevelComplete(true);
        } else {
            // Penalty Logic
            setScore(s => Math.max(0, s - 10)); // -10 for wrong config
            setPenmanText("Not quite. Check the physics.");
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
        // Save puzzle score locally
        savePuzzleScore(finalScore);

        // If in multiplayer, sync score
        if (roomId) {
            submitPuzzleScore(finalScore);
            updateMyPuzzleScore(finalScore);
        }

        toast.success(`Puzzle completed! You earned ${finalScore} points!`);
    };

    const handleSkipPuzzle = () => {
        // Award 0 points for skipping
        savePuzzleScore(0);

        // If in multiplayer, sync 0 score
        if (roomId) {
            submitPuzzleScore(0);
            updateMyPuzzleScore(0);
        }

        toast.info('Puzzle skipped. Moving to reflection...');
        navigate('/reflection');
    };

    const handleContinueToReflection = () => {
        // If game is complete but not navigated yet, handle score
        if (gameComplete && !roomId) {
            // For solo, score is already saved via handlePuzzleComplete
        }
        navigate('/reflection');
    };

    const useHint = () => {
        const cost = (hintsCount * 10) + 10; // 1st=-10, 2nd=-20, 3rd=-30...
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

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex flex-col text-gray-800 font-sans overflow-hidden fixed inset-0">

            {/* GAME START OVERLAY - FLOATING */}
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
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed"><Translate>Use the controls to solve the optics puzzles. Watch your score!</Translate></p>

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
                        <h1 className="font-bold text-lg tracking-wide text-gray-900"><Translate>RAY OPTICS</Translate> <span className="text-primary"><Translate>CHALLENGE</Translate></span></h1>
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

                {/* PROBLEM PANEL - FIXED HEADER */}
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

                        {/* SHOW PROBLEM BUTTON - When panel is closed */}
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

                        {/* LEVEL COMPLETE MODAL - FLOATING */}
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

                        {/* GAME COMPLETE MODAL - FLOATING POPUP */}
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
                                            <Translate>You've successfully completed the Ray Optics Challenge with a score of</Translate> <span className="text-green-600 font-bold">{score}</span>.
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

                    {/* SIDEBAR */}
                    <div className="w-80 glass-card border-l border-gray-200/60 p-6 flex flex-col gap-6 z-20 shadow-xl rounded-l-2xl">
                        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {level}
                            </div>
                            <h2 className="font-bold text-gray-900"><Translate>Control Panel</Translate></h2>
                        </div>

                        <div className="space-y-6 flex-1">
                            {level === 1 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Input Mirror</Translate></label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[0, 45, 90, 135].map(a => (
                                                <Button
                                                    key={a}
                                                    variant={l1.m1Angle === a ? "default" : "outline"}
                                                    className={l1.m1Angle === a ? "bg-primary text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                                                    onClick={() => updateL1({ m1Angle: a })}
                                                    disabled={levelComplete}
                                                >
                                                    {a}°
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Output Mirror</Translate></label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[0, 45, 90, 135].map(a => (
                                                <Button
                                                    key={a}
                                                    variant={l1.m2Angle === a ? "default" : "outline"}
                                                    className={l1.m2Angle === a ? "bg-primary text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                                                    onClick={() => updateL1({ m2Angle: a })}
                                                    disabled={levelComplete}
                                                >
                                                    {a}°
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {level === 2 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Lens Type</Translate></label>
                                        <div className="flex flex-col gap-2">
                                            <Button disabled={levelComplete} variant={l2.lensType === 'glass_convex' ? "default" : "outline"} onClick={() => setL2(p => ({ ...p, lensType: 'glass_convex' }))}><Translate>Convex (Converging)</Translate></Button>
                                            <Button disabled={levelComplete} variant={l2.lensType === 'glass_concave' ? "default" : "outline"} onClick={() => setL2(p => ({ ...p, lensType: 'glass_concave' }))}><Translate>Concave (Diverging)</Translate></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Source Position</Translate></label>
                                        <div className="flex gap-2">
                                            {(['near', 'mid', 'far'] as const).map(p => (
                                                <Button key={p} size="sm" disabled={levelComplete} variant={l2.lensPos === p ? "default" : "outline"} onClick={() => setL2(prev => ({ ...prev, lensPos: p }))} className="flex-1">{p.toUpperCase()}</Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {level === 3 && (
                                <>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Core Material</Translate></label>
                                        <div className="flex flex-col gap-2">
                                            <Button disabled={levelComplete} variant={l3.coreMaterial === 'water' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'water' }))}><Translate>Water (n=1.33)</Translate></Button>
                                            <Button disabled={levelComplete} variant={l3.coreMaterial === 'glass' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'glass' }))}><Translate>Glass (n=1.5)</Translate></Button>
                                            <Button disabled={levelComplete} variant={l3.coreMaterial === 'diamond' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'diamond' }))}><Translate>Diamond (n=2.4)</Translate></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase"><Translate>Incident Angle</Translate></label>
                                        <div className="flex gap-2">
                                            {([30, 45, 60] as const).map(a => (
                                                <Button key={a} disabled={levelComplete} variant={l3.incidentAngle === a ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, incidentAngle: a }))} className="flex-1">{a}°</Button>
                                            ))}
                                        </div>
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
