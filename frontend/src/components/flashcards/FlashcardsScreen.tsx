import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningStore } from '@/lib/learningStore';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Flashcard {
  name: string;
  image_base64: string;
}

interface FlashcardsScreenProps {
  onComplete: () => void;
}

export function FlashcardsScreen({ onComplete }: FlashcardsScreenProps) {
  const { currentScenario } = useLearningStore();
  const { token } = useAuthStore();
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dragDirection, setDragDirection] = useState(0);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flashcards.length]);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session ID from localStorage (set by Quiz screen)
      const sid = localStorage.getItem('flashcard_session_id');
      
      if (!sid) {
        throw new Error('No flashcard session found');
      }

      setSessionId(sid);

      // Poll for flashcards
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts) {
        console.log(`📡 [Attempt ${attempts + 1}/${maxAttempts}] Fetching flashcards for session: ${sid}`);
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:9000/api'}/visual-flashcards/${sid}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to fetch flashcards:', errorText);
          throw new Error(`Failed to fetch flashcards: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Received data:', JSON.stringify(data, null, 2));

        if (data.status === 'completed' && data.flashcards?.length > 0) {
          console.log(`✅ Flashcards ready: ${data.flashcards.length} cards`);
          setFlashcards(data.flashcards);
          setLoading(false);
          toast.success(`${data.count} flashcards ready!`);
          return;
        }

        if (data.status === 'failed') {
          console.error('❌ Flashcard generation failed:', data.error);
          throw new Error(data.error || 'Flashcard generation failed');
        }

        console.log(`⏳ Status: ${data.status}, waiting...`);


        // Still generating, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // Timeout
      throw new Error('Flashcard generation timed out');

    } catch (err: any) {
      console.error('Error fetching flashcards:', err);
      setError(err.message);
      setLoading(false);
      toast.error('Failed to load flashcards');
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDragDirection(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDragDirection(0);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold && currentIndex > 0) {
      handlePrevious();
    } else if (info.offset.x < -swipeThreshold && currentIndex < flashcards.length - 1) {
      handleNext();
    }
  };

  const downloadAsZip = async () => {
    try {
      toast.loading('Preparing download...');
      
      const zip = new JSZip();
      const folder = zip.folder('flashcards');

      flashcards.forEach((card, index) => {
        // Convert base64 to blob
        const base64Data = card.image_base64.split(',')[1];
        folder?.file(`${index + 1}_${card.name.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `flashcards_${currentScenario?.topic || 'download'}.zip`);
      
      toast.dismiss();
      toast.success('Flashcards downloaded!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download flashcards');
    }
  };

  const downloadAsPDF = async () => {
    try {
      toast.loading('Generating PDF...');
      
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      flashcards.forEach((card, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        // Add image (centered)
        const imgWidth = pageWidth - 40;
        const imgHeight = (pageHeight - 60) * 0.8;
        const x = 20;
        const y = 30;

        pdf.addImage(card.image_base64, 'PNG', x, y, imgWidth, imgHeight);

        // Add title at bottom
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const textY = y + imgHeight + 15;
        pdf.text(card.name, pageWidth / 2, textY, { align: 'center' });
      });

      pdf.save(`flashcards_${currentScenario?.topic || 'download'}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Generating Visual Flashcards</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Creating educational diagrams using AI...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <ImageIcon className="w-12 h-12 text-destructive mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Failed to Load Flashcards</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchFlashcards} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={onComplete} variant="hero">
              Continue to Mastery
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground">No Flashcards Available</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Unable to generate flashcards for this topic
            </p>
          </div>
          <Button onClick={onComplete} variant="hero">
            Continue to Mastery
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Visual Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {flashcards.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadAsZip}>
            <Download className="w-4 h-4 mr-2" />
            ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="hero" size="sm" onClick={onComplete}>
            Continue
          </Button>
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-full max-w-2xl">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                <img
                  src={currentCard.image_base64}
                  alt={currentCard.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Name */}
              <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                <h2 className="text-2xl font-bold text-center text-foreground">
                  {currentCard.name}
                </h2>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center pb-4 text-xs text-muted-foreground">
        <p>Swipe or use arrow keys to navigate • Click dots to jump to card</p>
      </div>
    </div>
  );
}
