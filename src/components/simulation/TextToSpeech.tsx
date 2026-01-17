import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
  variant?: 'default' | 'icon';
}

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

  const synthesizeSpeech = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to read');
      return;
    }

    try {
      setIsLoading(true);

      // Call TTS API
      const response = await fetch('http://localhost:8001/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_name: 'en-US-Neural2-F', // Natural female voice
          speaking_rate: 1.0,
          pitch: 0.0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      // Get audio blob
      const audioBlob = await response.blob();
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
      audio.onerror = () => {
        setIsPlaying(false);
        toast.error('Error playing audio');
      };

      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error('Failed to generate speech');
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
