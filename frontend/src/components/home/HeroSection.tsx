import { motion } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, Microscope, Atom } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Translate } from '@/components/Translate';
import { useTranslationStore } from '@/lib/translationStore';

export function HeroSection() {
  const { currentLanguage, translate } = useTranslationStore();
  const [targetText, setTargetText] = useState('Learn by Doing.');
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const initTranslate = async () => {
      if (currentLanguage !== 'en') {
        const result = await translate("Learn by Doing.");
        setTargetText(result as string);
      } else {
        setTargetText("Learn by Doing.");
      }
    };
    initTranslate();
  }, [currentLanguage, translate]);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < targetText.length) {
        setDisplayedText(targetText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50); // Typing speed: 50ms per character

    return () => clearInterval(timer);
  }, [targetText]);

  const floatingIcons = [
    // Far corners - spread far from text
    { Icon: Brain, delay: 0, x: -280, y: -200 },
    { Icon: Lightbulb, delay: 0.2, x: 280, y: -200 },
    { Icon: Microscope, delay: 0.4, x: -260, y: 220 },
    { Icon: Sparkles, delay: 0.6, x: 260, y: 220 },
    { Icon: Atom, delay: 0.8, x: 0, y: -280 },
  ];

  return (
    <div className="relative text-center w-full py-2 md:py-3">
      {/* Ambient orbs are now in the main page background */}

      {/* AI Badge - glass pill */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card mb-4"
        layout={false}
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-primary" />
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 0 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <Sparkles className="w-4 h-4 text-primary/50" />
          </motion.div>
        </div>
        <span className="text-sm font-semibold text-foreground"><Translate>AI-Powered Learning</Translate></span>
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2 tracking-tight"
        layout={false}
        style={{ willChange: 'opacity, transform' }}
      >
        <span className="text-foreground"><Translate>Ask Anything.</Translate></span>
        <br />
        <span className="inline-block">
          <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">
            {displayedText}
          </span>
          {displayedText.length < targetText.length && (
            <motion.span
              className="inline-block w-1 h-8 md:h-12 lg:h-16 ml-1 bg-primary rounded-sm"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          )}
        </span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-2"
        layout={false}
        style={{ willChange: 'opacity, transform' }}
      >
        <Translate>Textbooks → AI-Generated Simulations → True Understanding</Translate>
      </motion.p>

      {/* Learning path visualization with glass cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="flex items-center justify-center gap-2 mt-4 flex-wrap"
        layout={false}
        style={{ willChange: 'opacity, transform' }}
      >
        {['Ask', 'Explore', 'Simulate', 'Master'].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + index * 0.4, duration: 0.6, ease: "easeOut" }}
            layout={false}
          >
            <motion.span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${index === 3
                ? 'glass-card border-primary/40 text-primary glow-subtle'
                : 'glass-subtle text-muted-foreground hover:text-foreground hover:glass-card'
                }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2 + index * 0.4, duration: 0.5 }}
            >
              <Translate>{step}</Translate>
            </motion.span>
            {index < 3 && (
              <motion.span
                className="text-primary/40 font-light"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + index * 0.4, duration: 0.5 }}
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