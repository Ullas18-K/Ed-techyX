import { motion } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, Microscope, Atom } from 'lucide-react';

export function HeroSection() {
  const floatingIcons = [
    { Icon: Brain, delay: 0, x: -140, y: -80 },
    { Icon: Lightbulb, delay: 0.2, x: 150, y: -60 },
    { Icon: Microscope, delay: 0.4, x: -120, y: 70 },
    { Icon: Sparkles, delay: 0.6, x: 130, y: 90 },
    { Icon: Atom, delay: 0.8, x: 0, y: -100 },
  ];

  return (
    <div className="relative text-center mb-12">
      {/* Ambient orbs - warm beige theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="orb orb-primary w-[500px] h-[500px] -top-48 -left-32"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="orb orb-accent w-[400px] h-[400px] -top-20 -right-24"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="orb orb-warm w-[350px] h-[350px] top-40 left-1/2 -translate-x-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* Floating icons with glass effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [y, y - 15, y],
            }}
            transition={{ 
              delay: delay + 0.5,
              duration: 0.5,
              y: {
                delay: delay + 1,
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          >
            <div className="p-3 rounded-2xl glass-card hover-lift">
              <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Badge - glass pill */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card mb-8"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-primary" />
          <motion.div 
            className="absolute inset-0"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary/50" />
          </motion.div>
        </div>
        <span className="text-sm font-semibold text-foreground">AI-Powered Learning</span>
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
      >
        <span className="text-foreground">Ask Anything.</span>
        <br />
        <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">
          Learn by Doing.
        </span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        Textbooks → AI-Generated Simulations → True Understanding
      </motion.p>

      {/* Learning path visualization with glass cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3 mt-10"
      >
        {['Ask', 'Explore', 'Simulate', 'Master'].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <span className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              index === 3 
                ? 'glass-card border-primary/40 text-primary glow-subtle' 
                : 'glass-subtle text-muted-foreground hover:text-foreground hover:glass-card'
            }`}>
              {step}
            </span>
            {index < 3 && (
              <motion.span 
                className="text-primary/40 font-light"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
              >
                →
              </motion.span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}