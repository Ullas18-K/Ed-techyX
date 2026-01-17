import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis } from 'react-speech-kit';
import { 
  Volume2, 
  VolumeX, 
  Pause, 
  Play,
  Mic,
  MicOff,
  MessageSquare,
  Sparkles,
  Settings,
  SkipForward,
  CheckCircle2,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIVoiceGuideProps {
  topicName: string;
  simulationType: string;
  currentStep?: number;
  totalSteps?: number;
  onVoiceCommand?: (command: string) => void;
  autoStart?: boolean;
}

interface VoiceStep {
  id: number;
  text: string;
  duration?: number;
  pauseAfter?: boolean;
}

const simulationGuidance: Record<string, {
  intro: string;
  steps: VoiceStep[];
  tips: string[];
}> = {
  photosynthesis: {
    intro: "Welcome to the Photosynthesis Simulation! I'm your AI voice guide, and I'll help you understand how plants make their food using sunlight, water, and carbon dioxide. Let's explore together!",
    steps: [
      {
        id: 1,
        text: "First, let's understand the simulation interface. You can see controls on the left for sunlight, water, and carbon dioxide levels. On the right, you'll see the plant growing in real-time.",
        pauseAfter: true
      },
      {
        id: 2,
        text: "Let's start by adjusting the sunlight level. Try setting it to around 70%. Notice how the sun gets brighter and the plant responds. Sunlight is the energy source for photosynthesis.",
        pauseAfter: true
      },
      {
        id: 3,
        text: "Now, increase the water level to 70%. Watch the plant's health improve. Water is one of the raw materials needed for photosynthesis.",
        pauseAfter: true
      },
      {
        id: 4,
        text: "Next, set the carbon dioxide to 70%. See those bubbles? That's oxygen being produced! The plant takes in CO2 and releases oxygen.",
        pauseAfter: true
      },
      {
        id: 5,
        text: "Excellent! Now all three inputs are balanced. Notice how the plant is healthiest when all factors are optimal. Try the 'Run Experiment' button to see the results.",
        pauseAfter: true
      },
      {
        id: 6,
        text: "Try reducing just one factor, like sunlight, to 20% while keeping others high. What happens to the plant's health? This shows that photosynthesis is limited by the scarcest resource.",
        pauseAfter: true
      },
      {
        id: 7,
        text: "Great work! You've completed the guided exploration. Feel free to experiment on your own, or ask me any questions using the chat panel or voice commands.",
        pauseAfter: false
      }
    ],
    tips: [
      "Remember the photosynthesis equation: 6 CO2 plus 6 water plus light energy produces glucose and 6 oxygen.",
      "Plants appear green because chlorophyll reflects green light while absorbing red and blue light.",
      "The rate of photosynthesis is limited by the factor that is in shortest supply - this is called the limiting factor."
    ]
  },
  circuit: {
    intro: "Welcome to the Electric Circuit Simulation! I'll guide you through understanding how voltage, current, and resistance work together. Let's get started!",
    steps: [
      {
        id: 1,
        text: "First, look at the circuit diagram. You can see a battery on the left and a light bulb on the right, connected by wires. The controls let you adjust voltage and resistance.",
        pauseAfter: true
      },
      {
        id: 2,
        text: "Let's start with a simple setup. Set the voltage to 6 volts and resistance to 10 ohms. According to Ohm's Law, current equals voltage divided by resistance.",
        pauseAfter: true
      },
      {
        id: 3,
        text: "Now run the experiment. The current should be 0.6 amperes, and you'll see the bulb light up. The brightness depends on the current flowing through it.",
        pauseAfter: true
      },
      {
        id: 4,
        text: "Try doubling the voltage to 12 volts while keeping resistance at 10 ohms. Notice how the current doubles to 1.2 amperes, and the bulb gets brighter.",
        pauseAfter: true
      },
      {
        id: 5,
        text: "Now reset voltage to 6 volts, but increase resistance to 20 ohms. The current drops to 0.3 amperes. More resistance means less current flow.",
        pauseAfter: true
      },
      {
        id: 6,
        text: "Excellent! You've learned how voltage, current, and resistance are related. Try different combinations to see the relationships for yourself.",
        pauseAfter: false
      }
    ],
    tips: [
      "Ohm's Law: voltage equals current times resistance, or V equals I R.",
      "Power is calculated as voltage times current. Higher power means more energy used per second.",
      "In a series circuit, the current is the same everywhere, but voltage divides across components."
    ]
  }
};

export function AIVoiceGuide({ 
  topicName, 
  simulationType, 
  currentStep = 0,
  totalSteps = 7,
  onVoiceCommand,
  autoStart = true 
}: AIVoiceGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState([0.8]);
  const [rate, setRate] = useState([1]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [currentlySpoken, setCurrentlySpoken] = useState('');
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  const guidance = simulationGuidance[simulationType] || simulationGuidance.photosynthesis;

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleVoiceInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone permission denied. Please enable it in browser settings.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-play intro
  useEffect(() => {
    if (autoStart && !hasIntroPlayed && synthRef.current) {
      setTimeout(() => {
        speakText(guidance.intro);
        setHasIntroPlayed(true);
      }, 1000);
    }
  }, [autoStart, hasIntroPlayed]);

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!synthRef.current) {
      toast.error('Speech synthesis not supported in your browser');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume[0];
    utterance.rate = rate[0];
    utterance.pitch = 1;
    
    // Try to get a more natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) 
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentlySpoken(text);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentlySpoken('');
      onEndCallback?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setCurrentlySpoken('');
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [volume, rate]);

  const handlePlayPause = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
    } else if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    } else {
      // Start playing current step
      if (currentStepIndex < guidance.steps.length) {
        playStep(currentStepIndex);
      }
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentlySpoken('');
    }
  };

  const playStep = (stepIndex: number) => {
    if (stepIndex >= guidance.steps.length) {
      toast.success('Guided tour completed! Feel free to explore on your own.');
      return;
    }

    const step = guidance.steps[stepIndex];
    speakText(step.text, () => {
      if (step.pauseAfter) {
        // Wait for user action before next step
        setCurrentStepIndex(stepIndex + 1);
      } else {
        // Auto-continue to next step
        setTimeout(() => {
          setCurrentStepIndex(stepIndex + 1);
          playStep(stepIndex + 1);
        }, 1000);
      }
    });
  };

  const handleNextStep = () => {
    handleStop();
    if (currentStepIndex < guidance.steps.length) {
      playStep(currentStepIndex);
    }
  };

  const handleRestart = () => {
    handleStop();
    setCurrentStepIndex(0);
    setTimeout(() => {
      speakText(guidance.intro, () => {
        setTimeout(() => playStep(0), 1000);
      });
    }, 300);
  };

  const handleVoiceInput = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Voice commands
    if (lowerTranscript.includes('next') || lowerTranscript.includes('continue')) {
      handleNextStep();
      return;
    }
    if (lowerTranscript.includes('stop') || lowerTranscript.includes('pause')) {
      handleStop();
      return;
    }
    if (lowerTranscript.includes('restart') || lowerTranscript.includes('start over')) {
      handleRestart();
      return;
    }
    if (lowerTranscript.includes('help')) {
      speakText("You can ask me questions about " + topicName + ", or use commands like 'next step', 'pause', 'restart', or 'give me a tip'.");
      return;
    }
    if (lowerTranscript.includes('tip')) {
      const randomTip = guidance.tips[Math.floor(Math.random() * guidance.tips.length)];
      speakText(randomTip);
      return;
    }

    // Pass to parent component for more complex queries
    if (onVoiceCommand) {
      onVoiceCommand(transcript);
    }

    toast.success(`Voice command received: "${transcript}"`);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak now');
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="bg-card/95 backdrop-blur-lg border border-border rounded-2xl shadow-xl p-4 w-[380px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              isPlaying ? "bg-gradient-ai animate-pulse" : "bg-secondary"
            )}>
              <Sparkles className={cn(
                "w-4 h-4",
                isPlaying ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">AI Voice Guide</h3>
              <p className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {guidance.steps.length}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Current speech text */}
        {currentlySpoken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-3 bg-secondary/50 rounded-lg"
          >
            <p className="text-xs text-muted-foreground italic">
              "{currentlySpoken}"
            </p>
          </motion.div>
        )}

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 space-y-3 p-3 bg-secondary/30 rounded-lg"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Volume: {Math.round(volume[0] * 100)}%
                </label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Speed: {rate[0].toFixed(1)}x
                </label>
                <Slider
                  value={rate}
                  onValueChange={setRate}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-ai"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentStepIndex + 1) / guidance.steps.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            size="sm"
            onClick={handlePlayPause}
            className="flex-1 gap-2"
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {isPaused ? 'Resume' : 'Play'}
              </>
            )}
          </Button>

          {/* Mute */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setIsMuted(!isMuted);
              if (synthRef.current) {
                if (!isMuted) {
                  setVolume([0]);
                } else {
                  setVolume([0.8]);
                }
              }
            }}
            className="h-9 w-9"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {/* Voice Input */}
          <Button
            size="icon"
            variant={isListening ? "default" : "outline"}
            onClick={toggleListening}
            className={cn("h-9 w-9", isListening && "animate-pulse")}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>

          {/* Next Step */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleNextStep}
            disabled={currentStepIndex >= guidance.steps.length}
            className="h-9 w-9"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestart}
            className="flex-1 text-xs"
          >
            Restart Tour
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const randomTip = guidance.tips[Math.floor(Math.random() * guidance.tips.length)];
              speakText(randomTip);
            }}
            className="flex-1 text-xs"
          >
            Get Tip
          </Button>
        </div>

        {/* Voice Commands Help */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Say "next", "pause", "restart", "help", or ask questions
          </p>
        </div>
      </div>
    </motion.div>
  );
}
