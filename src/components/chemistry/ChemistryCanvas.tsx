import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChemistryStore } from './chemistryStore';
import { Flame, CloudFog, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const ChemistryCanvas: React.FC = () => {
    const {
        experimentMode,
        apparatus,
        chemicalA,
        chemicalB,
        indicator,
        metal,
        heatApplied,
        color,
        gasProduced,
        bubblesActive,
        setColor,
        updateState,
        popTestResult,
        setPopTestResult
    } = useChemistryStore();

    // Reaction Engine / Physics Loop
    useEffect(() => {
        let reactionTimer: NodeJS.Timeout;

        // 1. Indicator Reactions
        if (experimentMode === 'indicators') {
            if (chemicalA === 'hcl') {
                if (indicator === 'litmus_blue') setColor('#FF4444'); // Red
                else if (indicator === 'litmus_red') setColor('#FF4444'); // Stays Red
                else if (indicator === 'phenolphthalein') setColor('rgba(255, 255, 255, 0.2)'); // Clear
                else setColor('rgba(255, 255, 255, 0.2)');
            } else if (chemicalA === 'naoh') {
                if (indicator === 'litmus_red') setColor('#3B82F6'); // Blue
                else if (indicator === 'litmus_blue') setColor('#3B82F6'); // Stays Blue
                else if (indicator === 'phenolphthalein') setColor('#EC4899'); // Pink
                else setColor('rgba(255, 255, 255, 0.2)');
            } else {
                setColor('rgba(255, 255, 255, 0.2)');
            }
        }

        // 2. Metal + Acid -> H2
        if (experimentMode === 'metal_acid') {
            if (metal !== 'none' && chemicalA === 'hcl') {
                updateState({ isReacting: true, bubblesActive: true, gasProduced: 'h2' });
            } else {
                updateState({ isReacting: false, bubblesActive: false, gasProduced: 'none' });
            }
        }

        // 3. Carbonate + Acid -> CO2
        if (experimentMode === 'carbonate') {
            if ((chemicalA === 'na2co3' || chemicalA === 'caco3') && chemicalB === 'hcl') {
                updateState({ isReacting: true, bubblesActive: true, gasProduced: 'co2', limeWaterTest: 'milky' });
                setColor('#F8FAFC'); // Milky appearance
            } else {
                updateState({ isReacting: false, bubblesActive: false, gasProduced: 'none', limeWaterTest: 'clear' });
                setColor('rgba(255, 255, 255, 0.2)');
            }
        }

        // 4. pH Scale
        if (experimentMode === 'ph_scale' && indicator === 'universal') {
            if (chemicalA === 'hcl') {
                setColor('#EF4444'); // Red for strong acid
                updateState({ phValue: 1 });
            } else if (chemicalA === 'ch3cooh') {
                setColor('#F97316'); // Orange for weak acid
                updateState({ phValue: 4 });
            } else if (chemicalA === 'water') {
                setColor('#22C55E'); // Green for neutral
                updateState({ phValue: 7 });
            } else if (chemicalA === 'naoh') {
                setColor('#3B82F6'); // Blue for strong base
                updateState({ phValue: 14 });
            } else {
                setColor('rgba(255, 255, 255, 0.1)');
            }
        }

        // 5. Neutralization
        if (experimentMode === 'neutralization') {
            if (chemicalA === 'naoh' && indicator === 'phenolphthalein') {
                if (chemicalB === 'hcl') {
                    updateState({ phValue: 7, isReacting: true });
                    setColor('rgba(255, 255, 255, 0.1)'); // Pink fades to clear
                } else {
                    setColor('#EC4899');
                    updateState({ phValue: 14 });
                }
            }
        }

        return () => clearTimeout(reactionTimer);
    }, [experimentMode, chemicalA, chemicalB, indicator, metal, heatApplied]);


    const handlePopTest = () => {
        setPopTestResult('success');
        toast.success("POP! Hydrogen confirmed!");
        setTimeout(() => setPopTestResult('none'), 2000);
    };

    return (
        <div className="w-full h-full bg-[#0f172a] rounded-xl overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center p-8 select-none">
            {/* Laboratory Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            {/* Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

            {/* Floor/Table */}
            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-slate-900 to-slate-950 border-t border-slate-800" />

            <div className="relative flex items-center justify-center w-full h-full">

                {/* 1. TEST TUBE SETUP */}
                {apparatus === 'test_tube' && (
                    <div className="relative w-24 h-64 flex flex-col items-center">
                        {/* Glass Body with Highlights */}
                        <div className="absolute inset-0 rounded-b-full border-2 border-slate-700/50 bg-white/5 backdrop-blur-[2px] overflow-hidden group">
                            {/* Inner Shine */}
                            <div className="absolute left-1 top-0 bottom-0 w-1.5 bg-white/10 rounded-full" />
                            <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-white/5 rounded-full" />

                            {/* Liquid */}
                            <motion.div
                                className="absolute bottom-0 w-full"
                                style={{
                                    height: '60%',
                                    background: color ? `linear-gradient(to right, ${color}dd, ${color}, ${color}dd)` : 'rgba(255,255,255,0.05)',
                                    boxShadow: color ? `0 0 40px ${color}33` : 'none'
                                }}
                                animate={{ backgroundColor: color }}
                                transition={{ duration: 0.8 }}
                            >
                                {/* Liquid Surface */}
                                <div className="absolute top-0 w-full h-[2px] bg-white/30" />
                            </motion.div>

                            {/* Bubbles */}
                            <AnimatePresence>
                                {bubblesActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-3/5 pointer-events-none overflow-hidden">
                                        {[...Array(8)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute bg-white/40 rounded-full border border-white/20"
                                                initial={{ bottom: '0%', left: `${20 + Math.random() * 60}%`, width: 3 + Math.random() * 4, height: 3 + Math.random() * 4, opacity: 0 }}
                                                animate={{
                                                    bottom: '100%',
                                                    opacity: [0, 0.6, 0.4, 0],
                                                    x: [0, (Math.random() - 0.5) * 10, 0]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 1.5 + Math.random() * 2,
                                                    delay: Math.random() * 2
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Metal Chunks with specific styles */}
                            {metal !== 'none' && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1">
                                    <motion.div
                                        className="w-4 h-4 bg-slate-400 rounded-sm rotate-12 shadow-lg"
                                        animate={isReacting ? { y: [0, -2, 0], rotate: [12, 10, 12] } : {}}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                    />
                                    <motion.div
                                        className="w-3 h-3 bg-slate-500 rounded-sm -rotate-12 shadow-lg"
                                        animate={isReacting ? { y: [0, -1, 0], rotate: [-12, -10, -12] } : {}}
                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Rim */}
                        <div className="absolute -top-2 w-28 h-4 bg-white/10 border-2 border-slate-700/50 rounded-full backdrop-blur-sm" />
                    </div>
                )}

                {/* 2. FLASK SETUP (Improved) */}
                {(apparatus === 'flask' || apparatus === 'burette_flask') && (
                    <div className="relative flex flex-col items-center">
                        {/* Burette (Titration) */}
                        {apparatus === 'burette_flask' && (
                            <div className="flex flex-col items-center mb-[-5px] z-20">
                                <div className="w-3 h-64 bg-white/5 border border-slate-700/50 relative rounded-t-sm shadow-inner group">
                                    {/* Glass Shine */}
                                    <div className="absolute left-0.5 top-0 bottom-0 w-[1px] bg-white/10" />

                                    {/* Graduations */}
                                    {[...Array(15)].map((_, i) => (
                                        <div key={i} className="absolute right-0 w-2 h-[1px] bg-white/30" style={{ top: `${(i + 1) * 6}%` }} />
                                    ))}

                                    {/* Liquid in Burette */}
                                    <motion.div
                                        className="absolute bottom-0 w-full bg-blue-400/30 border-t border-blue-400/50"
                                        initial={{ height: '80%' }}
                                        animate={chemicalB === 'hcl' ? { height: '30%' } : { height: '80%' }}
                                        transition={{ duration: 3 }}
                                    />

                                    {/* Drop Animation when reacting */}
                                    {chemicalB === 'hcl' && (
                                        <motion.div
                                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400/60 rounded-full"
                                            animate={{ y: [0, 60], opacity: [1, 1, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.6 }}
                                        />
                                    )}
                                </div>
                                {/* Nozzle & Valve */}
                                <div className="w-5 h-2 bg-slate-700 rounded-sm flex items-center justify-center">
                                    <div className="w-1 h-3 bg-red-800 rounded-full" />
                                </div>
                                <div className="w-1.5 h-6 bg-slate-600/50" />
                            </div>
                        )}

                        {/* Erlenmeyer Flask */}
                        <div className="relative w-40 h-48 mt-2">
                            {/* Glass Body Shapes */}
                            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
                                    </linearGradient>
                                    <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor={color || 'transparent'} stopOpacity="0.8" />
                                        <stop offset="100%" stopColor={color || 'transparent'} stopOpacity="1" />
                                    </linearGradient>
                                    <mask id="flaskMask">
                                        <path d="M40 0 H60 V30 L95 100 Q100 110 90 110 H10 Q0 110 5 100 L40 30 Z" fill="white" />
                                    </mask>
                                </defs>

                                {/* Background Shadow/Glow */}
                                {color && color !== 'transparent' && (
                                    <circle cx="50" cy="80" r="30" fill={color} opacity="0.15" filter="blur(15px)" />
                                )}

                                {/* Outer Glass */}
                                <path
                                    d="M40 0 H60 V30 L95 100 Q100 110 90 110 H10 Q0 110 5 100 L40 30 Z"
                                    fill="url(#glassGrad)"
                                    stroke="rgba(100, 116, 139, 0.4)"
                                    strokeWidth="1.5"
                                />

                                {/* Liquid inside Mask */}
                                <g mask="url(#flaskMask)">
                                    <motion.rect
                                        x="0" width="100"
                                        animate={{
                                            y: color ? 60 : 120,
                                            height: 60,
                                            fill: color || 'transparent'
                                        }}
                                        transition={{ duration: 1 }}
                                    />
                                    {/* Surface highlight */}
                                    <motion.rect
                                        x="0" width="100" height="2" fill="white" opacity="0.2"
                                        animate={{ y: color ? 60 : 120 }}
                                        transition={{ duration: 1 }}
                                    />
                                </g>

                                {/* Highlights */}
                                <path d="M45 5 V25" stroke="white" strokeOpacity="0.1" strokeWidth="1" strokeLinecap="round" />
                                <path d="M15 95 L35 45" stroke="white" strokeOpacity="0.05" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* 3. CRYSTAL HEATING SETUP (China Dish) */}
                {experimentMode === 'salt_heating' && (
                    <div className="flex flex-col items-center">
                        <div className="relative pt-10">
                            {/* Dish with porcelain look */}
                            <div className="w-36 h-12 bg-[#F8F8F8] rounded-b-[40px] border-b-4 border-slate-300 shadow-xl relative overflow-hidden ring-1 ring-slate-200">
                                {/* Powder/Crystals */}
                                <motion.div
                                    className="absolute inset-x-2 bottom-1 h-3 rounded-full filter blur-[1px]"
                                    animate={{
                                        backgroundColor: color,
                                        opacity: [0.6, 0.8, 0.6],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                {/* Surface highlights */}
                                <div className="absolute top-0 left-4 w-4 h-full bg-white/20 skew-x-[-20deg]" />
                            </div>

                            {/* Tripod Stand */}
                            <div className="relative w-40 h-24 -mt-2">
                                <div className="absolute left-0 right-0 h-1.5 bg-slate-700 shadow-md" /> {/* Wire gauze */}
                                <div className="absolute left-2 w-1.5 h-full bg-slate-600 rounded-full" />
                                <div className="absolute right-2 w-1.5 h-full bg-slate-600 rounded-full" />
                                <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-slate-800 rounded-full" />
                            </div>
                        </div>

                        {/* Bunsen Burner - High Fidelity Flame */}
                        <div className="mt-[-10px] w-24 h-24 flex flex-col items-center justify-end">
                            <AnimatePresence>
                                {heatApplied && (
                                    <motion.div
                                        className="relative flex justify-center items-end"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        {/* Glow around flame */}
                                        <div className="absolute w-16 h-16 bg-blue-500/20 rounded-full blur-xl" />

                                        {/* Inner Flame (Blue) */}
                                        <motion.div
                                            className="w-4 h-12 bg-gradient-to-t from-blue-600 to-cyan-300 rounded-full relative z-10"
                                            animate={{
                                                scaleY: [1, 1.2, 1],
                                                scaleX: [1, 0.9, 1],
                                                skewX: [-1, 1, -1]
                                            }}
                                            transition={{ repeat: Infinity, duration: 0.4 }}
                                        />

                                        {/* Outer Flame (Orange) */}
                                        <motion.div
                                            className="absolute w-8 h-16 bg-gradient-to-t from-orange-600/60 via-yellow-500/40 to-transparent rounded-full -mb-2"
                                            animate={{
                                                scaleY: [1, 1.3, 1],
                                                scaleX: [1, 1.1, 1],
                                                y: [-2, 2, -2]
                                            }}
                                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Burner Body */}
                            <div className="w-6 h-12 bg-slate-400 border-x-2 border-slate-500 rounded-t-sm z-20 shadow-lg" />
                            <div className="w-12 h-3 bg-slate-600 rounded-sm z-20" />
                        </div>
                    </div>
                )}

                {/* Pop Test Interaction Overlay */}
                {experimentMode === 'metal_acid' && gasProduced === 'h2' && (
                    <div className="absolute top-20 right-[-100px] flex flex-col items-center group">
                        <motion.button
                            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg border-2 border-white/20 relative cursor-pointer overflow-hidden"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePopTest}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            <Flame className="w-8 h-8 relative z-10" />
                        </motion.button>
                        <span className="mt-2 text-[10px] font-bold text-blue-400 tracking-wider uppercase">Pop Test</span>
                    </div>
                )}

                {/* SUCCESS EFFECTS */}
                <AnimatePresence>
                    {popTestResult === 'success' && (
                        <motion.div
                            className="absolute z-50 pointer-events-none"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [1, 1.5, 0.8], opacity: [0, 1, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="bg-yellow-400 text-blue-900 font-black text-4xl px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(250,204,21,0.8)] border-4 border-white transform rotate-[-5deg]">
                                POP!
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* pH Scale Interface */}
                {experimentMode === 'ph_scale' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 translate-y-1/2 p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl backdrop-blur-md shadow-2xl">
                        <div className="text-[10px] text-slate-400 font-bold mb-3 tracking-widest text-center">pH INDICATOR</div>
                        <div className="w-14 h-80 bg-slate-800 rounded-xl p-2 relative shadow-inner">
                            {/* Gradient Background */}
                            <div className="absolute inset-2 bg-gradient-to-b from-blue-700 via-green-500 via-yellow-400 via-orange-500 to-red-600 rounded-full opacity-90 shadow-lg" />

                            {/* Marker Line */}
                            <motion.div
                                className="absolute left-0 right-0 h-[3px] bg-white z-20 shadow-[0_0_10px_white]"
                                animate={{ bottom: `${(useChemistryStore.getState().phValue / 14) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            />

                            {/* Labels */}
                            <div className="absolute -left-10 inset-y-2 flex flex-col justify-between text-[11px] font-mono text-slate-500">
                                <span>14</span>
                                <span>10</span>
                                <span>7</span>
                                <span>4</span>
                                <span>0</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-black">Value</div>
                            <div className="text-xl font-mono font-bold text-white leading-none mt-1">
                                {useChemistryStore.getState().phValue || 7}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* REACTIVE OVERLAYS */}
            <AnimatePresence>
                {isReacting && (
                    <motion.div
                        className="absolute top-10 w-full flex justify-center pointer-events-none"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                    >
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                            <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">Chemical Reaction in Progress</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
