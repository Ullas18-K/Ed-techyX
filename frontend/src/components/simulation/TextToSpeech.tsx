import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslationStore } from '@/lib/translationStore';
import API_CONFIG from '@/config/api';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
  variant?: 'default' | 'icon';
}

// Helper function to sanitize text for TTS
const sanitizeTextForTTS = (text: string): string => {
  if (!text) return '';
  
  // Remove markdown formatting
  let cleaned = text
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/\*\*|__/g, '') // Remove bold markers
    .replace(/\*|_/g, '') // Remove italic markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks
    .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
    .trim();
  
  // Remove special mathematical symbols and operators
  cleaned = cleaned
    .replace(/[\\\^{}[\]|~]/g, '') // Remove special chars
    .replace(/\$/g, '') // Remove dollar signs (LaTeX)
    .replace(/&lt;|&gt;|&amp;/g, '') // Remove HTML entities
    .replace(/\d+\./g, (match) => match.slice(0, -1) + ' ') // Add space after numbered lists
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  return cleaned;
};

// Map language codes to language names for TTS API
const getLanguageCodeForTTS = (language: string): string => {
  const languageMap: { [key: string]: string } = {
    en: 'en-IN',      // English
    hi: 'hi-IN',      // Hindi
    kn: 'kn-IN',      // Kannada
    ml: 'ml-IN',      // Malayalam
    ta: 'ta-IN',      // Tamil
    te: 'te-IN',      // Telugu
    mr: 'mr-IN',      // Marathi
    gu: 'gu-IN',      // Gujarati
    bn: 'bn-IN',      // Bengali
    pa: 'pa-IN',      // Punjabi
  };
  
  return languageMap[language] || 'en-IN'; // Default to English Indian accent
};

export function TextToSpeech({ 
  text, 
  autoPlay = false, 
  className,
  variant = 'icon'
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayed = useRef(false);
  
  // Get current language from translation store
  const { currentLanguage } = useTranslationStore();

  const synthesizeSpeech = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to read');
      return;
    }

    try {
      setIsLoading(true);

      // Sanitize the text
      const sanitizedText = sanitizeTextForTTS(text);

      if (sanitizedText.length === 0) {
        toast.error('Text could not be processed for speech');
        return;
      }

      // Check text length (Google Cloud TTS max is 5000 chars per request)
      if (sanitizedText.length > 5000) {
        toast.warning(`Text is long (${sanitizedText.length} chars). Processing...`);
      }

      console.log(`📢 TTS Request: ${sanitizedText.length} chars, Language: ${currentLanguage}`);

      // Get appropriate language code for TTS API
      const languageCode = getLanguageCodeForTTS(currentLanguage);
      console.log(`🗣️ Using voice for language: ${languageCode}`);

      // Call TTS API
      const response = await fetch(`${API_CONFIG.AI_SERVICE_API_URL}/api/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sanitizedText,
          language_code: languageCode, // Pass language code for voice selection
          speaking_rate: 1.0,
          pitch: 0.0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.detail || 'Failed to synthesize speech';
        console.error('TTS Error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio blob from server');
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        toast.error('Error playing audio');
      };

      await audio.play();
      toast.success('Audio playing');
    } catch (error) {
      console.error('TTS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      toast.error(errorMessage);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      synthesizeSpeech();
    }
  };

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && !hasAutoPlayed.current && text) {
      hasAutoPlayed.current = true;
      // Small delay to ensure component is mounted
      setTimeout(() => {
        synthesizeSpeech();
      }, 500);
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // Only run on mount

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        disabled={isLoading}
        className={cn(
          'h-8 w-8 rounded-full hover:bg-primary/10',
          isPlaying && 'text-primary',
          className
        )}
        title={isPlaying ? 'Stop reading' : 'Read aloud'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={togglePlayback}
      disabled={isLoading}
      className={cn(
        'gap-2',
        isPlaying && 'border-primary text-primary',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : isPlaying ? (
        <>
          <VolumeX className="w-4 h-4" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          Read Aloud
        </>
      )}
    </Button>
  );
}
