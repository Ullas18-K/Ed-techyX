
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    RotateCcw,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Play,
    Trophy,
    ArrowRight,
    X,
    Home,
    PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLearningStore } from '@/lib/learningStore';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';

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
    emotion = 'neutral'
}: {
    text: string;
    visible: boolean;
    onHint: () => void;
    canHint: boolean;
    onClose: () => void;
    emotion?: 'neutral' | 'happy' | 'start';
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
                    <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-blue-100 max-w-[280px] pointer-events-auto relative">
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Optics Guide</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                            {text}
                        </p>
                        {canHint && (
                            <div className="mt-3 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                                    onClick={onHint}
                                >
                                    <Lightbulb className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-500" />
                                    Need a Hint?
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

        ctx.fillStyle = '#334155';
        ctx.fillRect(150, 150, W - 300, H - 300);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(150, 150, W - 300, H - 300);

        ctx.beginPath();
        ctx.arc(target.x, target.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '10px sans-serif';
        ctx.fillText("SENSOR", target.x, target.y + 25);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(src.x - 10, src.y - 10, 20, 20);

        const drawMirror = (x: number, y: number, angle: number, label: string) => {
            ctx.save();
            ctx.translate(x, y);
            // Visual rotation logic:
            // Input 0 -> 0 (Vertical)
            // Input 45 -> 135 (Backslash \). Reflects Up->Right. Correct Physics placement.
            // Input 90 -> 90 (Horizontal)
            // Input 135 -> 45 (Forward Slash /). Reflects Up->Left.

            let rotation = 0;
            if (angle === 45) rotation = 135;
            else if (angle === 135) rotation = 45;
            else rotation = angle;

            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(-25, -2, 50, 4);
            ctx.fillStyle = '#fff'; ctx.fillRect(-25, -2, 50, 1);
            ctx.restore();
            ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
            ctx.fillText(label, x - 10, y - 40);
        };

        drawMirror(m1Pos.x, m1Pos.y, l1.m1Angle, "M1");
        drawMirror(m2Pos.x, m2Pos.y, l1.m2Angle, "M2");

        // RAY TRACING
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);

        let path = [{ x: src.x, y: src.y }];
        let hitM1 = false;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';

        // Ray 1: Up
        if (l1.m1Angle === 45) { // Correct M1 (Visually \)
            path.push(m1Pos);
            hitM1 = true;
        } else if (l1.m1Angle === 135) { // Left deflection
            path.push(m1Pos);
            // Ray goes left?
        } else {
            path.push({ x: src.x, y: 0 }); // Miss Top
        }

        if (hitM1) {
            // Ray 2: Right
            if (l1.m2Angle === 45) { // Correct M2 (Visually \)
                path.push(m2Pos);
                path.push(target); // Success (Down)
            } else {
                path.push({ x: W, y: m1Pos.y }); // Miss right
            }
        }

        if (path.length > 0) {
            ctx.lineTo(path[1].x, path[1].y);
            if (path[2]) ctx.lineTo(path[2].x, path[2].y);
            if (path[3]) ctx.lineTo(path[3].x, path[3].y);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    };

    const renderLevel2 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const srcY = H / 2;
        const lensX = W / 2;
        const screenX = W - 50;

        ctx.strokeStyle = '#334155'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);

        const srcX = l2.lensPos === 'near' ? lensX - 100 : l2.lensPos === 'mid' ? lensX - 200 : lensX - 300;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(srcX, srcY, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.beginPath();
        if (l2.lensType === 'glass_convex') {
            ctx.ellipse(lensX, srcY, 10, 80, 0, 0, Math.PI * 2);
        } else if (l2.lensType === 'glass_concave') {
            ctx.moveTo(lensX - 5, srcY - 80); ctx.lineTo(lensX + 5, srcY - 80);
            ctx.lineTo(lensX, srcY); ctx.lineTo(lensX + 5, srcY + 80);
            ctx.lineTo(lensX - 5, srcY + 80); ctx.lineTo(lensX - 10, srcY);
        }
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.fillRect(screenX, srcY - 50, 10, 100);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(screenX, srcY - 5, 10, 10);

        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;

        const rays = [-0.2, -0.1, 0, 0.1, 0.2];
        rays.forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(srcX, srcY);
            const dy = Math.tan(angle) * (lensX - srcX);
            const hitY = srcY + dy;
            ctx.lineTo(lensX, hitY);

            if (l2.lensType === 'glass_convex') {
                const f = 150;
                const do_ = lensX - srcX;
                const di = (f * do_) / (do_ - f);

                if (do_ === f) {
                    ctx.lineTo(W, hitY);
                } else if (do_ < f) {
                    ctx.lineTo(W, hitY + (hitY - srcY) * 2);
                } else {
                    const focalPointX = lensX + di;
                    ctx.lineTo(focalPointX, srcY);
                    const slope = (srcY - hitY) / (focalPointX - lensX);
                    // Continue ray to screen or beyond
                    const yAtScreen = srcY + slope * (screenX - focalPointX);
                    ctx.lineTo(screenX, yAtScreen);
                }
            } else if (l2.lensType === 'glass_concave') {
                ctx.lineTo(W, hitY + (hitY - srcY) * 2);
            } else {
                ctx.lineTo(W, hitY + dy * 2);
            }
            ctx.stroke();
        });
    };

    const renderLevel3 = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const cy = H / 2;

        // Draw Fiber
        ctx.beginPath();
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.moveTo(100, cy); ctx.lineTo(W - 100, cy); // Full width
        ctx.stroke();

        ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(100, cy - 20); ctx.lineTo(W - 100, cy - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(100, cy + 20); ctx.lineTo(W - 100, cy + 20); ctx.stroke();

        const n = l3.coreMaterial === 'diamond' ? 2.4 : l3.coreMaterial === 'glass' ? 1.5 : 1.33;
        const criticalAngleDeg = Math.asin(1.0 / n) * (180 / Math.PI);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(100, cy);

        const b1x = 300;
        const b1y = cy - 20;

        ctx.lineTo(b1x, b1y);

        if (l3.incidentAngle > criticalAngleDeg) {
            // Bounce 1 -> 2
            const b2x = 500;
            const b2y = cy + 20;
            ctx.lineTo(b2x, b2y);

            // Bounce 2 -> 3 (Exit)
            const b3x = 700;
            const b3y = cy - 20;
            ctx.lineTo(b3x, b3y);

            // Exit ray out
            ctx.lineTo(W, cy + 50); // Angle out

            ctx.stroke();
            ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
        } else {
            // Leaks at b1
            ctx.lineTo(b1x + 40, b1y - 80);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(b1x, b1y, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fill();
        }
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
        <div className="w-full h-screen bg-slate-950 flex flex-col text-slate-100 font-sans overflow-hidden">

            {/* GAME START OVERLAY */}
            {!gameStarted && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full"
                    >
                        <motion.div
                            animate={{ rotate: [-5, 5, -5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-40 h-40 mx-auto mb-8 relative"
                        >
                            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                            <img src="/penman.png" alt="Penman" className="w-full h-full object-contain relative z-10" />
                        </motion.div>

                        <h1 className="text-4xl font-black text-white mb-4">Ready to Start?</h1>
                        <p className="text-slate-400 mb-8 text-lg">Use the controls to solve the optics puzzles. Watch your score!</p>

                        <Button
                            onClick={handleStart}
                            className="h-16 px-12 text-xl font-bold bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:scale-105 transition-all"
                        >
                            <Play className="mr-3 w-6 h-6 fill-white" />
                            LET'S GO!
                        </Button>
                    </motion.div>
                </div>
            )}

            {gameComplete && <ConfettiRain />}

            {/* TOP BAR */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowRight className="w-5 h-5 rotate-180 text-slate-400" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide text-white">RAY OPTICS <span className="text-blue-500">CHALLENGE</span></h1>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                            <span>Level {level}</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            <span>{LEVELS[level].title}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Current Score</span>
                        <span className={`text-2xl font-mono font-bold ${score < 50 ? 'text-red-400' : 'text-green-400'}`}>
                            {score}
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex overflow-hidden">

                {/* CANVAS */}
                <div className="flex-1 relative bg-black" ref={containerRef}>

                    {/* PROBLEM PANEL */}
                    <AnimatePresence>
                        {problemPanelOpen && gameStarted && (
                            <motion.div
                                initial={{ y: -80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -80, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                                className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4"
                            >
                                <Card className="w-full max-w-4xl bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 backdrop-blur-xl border border-indigo-300/40 rounded-2xl p-6 shadow-[0_20px_60px_rgba(79,70,229,0.25)] ring-1 ring-indigo-400/20 flex items-start gap-4 relative">
                                    <div className="w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 absolute left-6 top-6 bottom-6" />
                                    <div className="flex-1 pl-4">
                                        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-lg">
                                            <Trophy className="w-5 h-5 text-yellow-600" />
                                            {LEVELS[level].title}: {LEVELS[level].goal}
                                        </h3>
                                        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                            {LEVELS[level].desc}
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Badge variant="outline" className="border-indigo-400/40 bg-indigo-50 text-indigo-700 font-mono text-xs">
                                                Constraints: {LEVELS[level].constraints}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setProblemPanelOpen(false)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-full">
                                        <X size={18} />
                                    </Button>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* LEVEL COMPLETE MODAL */}
                    <AnimatePresence>
                        {levelComplete && !gameComplete && (
                            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
                                >
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2 leading-tight">Level Cleared!</h2>
                                    <p className="text-slate-400 mb-8">Nice work! Penman is impressed with your logic. Ready for the next challenge?</p>
                                    <Button onClick={nextLevel} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-500 rounded-xl">
                                        Next Level <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* GAME COMPLETE MODAL */}
                    <AnimatePresence>
                        {gameComplete && (
                            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-center max-w-lg"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="inline-block mb-6"
                                    >
                                        <PartyPopper className="w-24 h-24 text-yellow-500" />
                                    </motion.div>
                                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                                        YOU DID IT!
                                    </h1>
                                    <p className="text-xl text-slate-300 mb-8 font-light">
                                        You’ve successfully completed the Ray Optics Challenge with a score of <span className="text-green-400 font-bold">{score}</span>.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Button onClick={() => navigate('/')} variant="outline" className="h-14 px-8 text-xl rounded-full font-bold">
                                            <Home className="mr-2 w-5 h-5" /> Home
                                        </Button>
                                        <Button onClick={handleContinueToReflection} className="h-14 px-8 text-xl bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                            Continue to Reflection <ArrowRight className="ml-2 w-5 h-5" />
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
                    />
                </div>

                {/* SIDEBAR */}
                <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 z-20 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                            {level}
                        </div>
                        <h2 className="font-bold text-white">Control Panel</h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        {level === 1 && (
                            <>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Input Mirror</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[0, 45, 90, 135].map(a => (
                                            <Button
                                                key={a}
                                                variant={l1.m1Angle === a ? "default" : "outline"}
                                                className={l1.m1Angle === a ? "bg-blue-600" : "border-slate-700 text-slate-300"}
                                                onClick={() => updateL1({ m1Angle: a })}
                                                disabled={levelComplete}
                                            >
                                                {a}°
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Output Mirror</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[0, 45, 90, 135].map(a => (
                                            <Button
                                                key={a}
                                                variant={l1.m2Angle === a ? "default" : "outline"}
                                                className={l1.m2Angle === a ? "bg-blue-600" : "border-slate-700 text-slate-300"}
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
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Lens Type</label>
                                    <div className="flex flex-col gap-2">
                                        <Button disabled={levelComplete} variant={l2.lensType === 'glass_convex' ? "default" : "outline"} onClick={() => setL2(p => ({ ...p, lensType: 'glass_convex' }))}>Convex (Converging)</Button>
                                        <Button disabled={levelComplete} variant={l2.lensType === 'glass_concave' ? "default" : "outline"} onClick={() => setL2(p => ({ ...p, lensType: 'glass_concave' }))}>Concave (Diverging)</Button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Source Position</label>
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
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Core Material</label>
                                    <div className="flex flex-col gap-2">
                                        <Button disabled={levelComplete} variant={l3.coreMaterial === 'water' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'water' }))}>Water (n=1.33)</Button>
                                        <Button disabled={levelComplete} variant={l3.coreMaterial === 'glass' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'glass' }))}>Glass (n=1.5)</Button>
                                        <Button disabled={levelComplete} variant={l3.coreMaterial === 'diamond' ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, coreMaterial: 'diamond' }))}>Diamond (n=2.4)</Button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Incident Angle</label>
                                    <div className="flex gap-2">
                                        {([30, 45, 60] as const).map(a => (
                                            <Button key={a} disabled={levelComplete} variant={l3.incidentAngle === a ? "default" : "outline"} onClick={() => setL3(p => ({ ...p, incidentAngle: a }))} className="flex-1">{a}°</Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-10 text-sm font-medium text-slate-400 hover:text-white border-slate-700 hover:border-slate-600"
                            onClick={handleSkipPuzzle}
                        >
                            Skip & Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <div>
                            <Button
                                className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
                                onClick={handleLevelCheck}
                                disabled={levelComplete}
                            >
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                TEST CONFIGURATION
                            </Button>
                            <p className="text-center text-[10px] text-slate-500 mt-2">
                                Penalty applies for incorrect attempts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
