import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { useLearningStore } from '@/lib/learningStore';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const StudyWithOthersButton = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [enablePuzzle, setEnablePuzzle] = useState(true);
    const { createRoom, roomId } = useRealtimeStudyRoomStore();
    const { currentScenario, aiScenarioData, pyqData } = useLearningStore();

    const handleCreateRoom = async () => {
        if (!currentScenario) {
            toast.error('No content available to share');
            return;
        }

        setIsCreating(true);
        try {
            // Small delay for effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            createRoom(currentScenario.topic, currentScenario, aiScenarioData, pyqData, 'Host Learner', enablePuzzle);
            toast.success(`Study Room Created! ${enablePuzzle ? '(Puzzle Included)' : '(Puzzle Skipped)'}`);
            setShowOptions(false);
        } catch (error) {
            toast.error('Failed to create room');
        } finally {
            setIsCreating(false);
        }
    };

    if (roomId) return null; // Room already exists

    return (
        <div className="space-y-3">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Button
                    variant="outline"
                    className="gap-2.5 h-12 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary font-bold transition-all px-6 rounded-2xl w-full"
                    onClick={() => setShowOptions(!showOptions)}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Users className="w-5 h-5" />
                    )}
                    STUDY WITH OTHERS
                </Button>
            </motion.div>

            {showOptions && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-secondary/30 rounded-xl p-4 space-y-4 border border-border/50"
                >
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="enable-puzzle"
                            checked={enablePuzzle}
                            onCheckedChange={(checked) => setEnablePuzzle(checked as boolean)}
                            className="border-primary/50"
                        />
                        <Label htmlFor="enable-puzzle" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <Puzzle className="w-4 h-4 text-primary" />
                            Include Optics Puzzle Challenge
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-7">
                        {enablePuzzle 
                            ? '✅ Players will solve a fun optics puzzle after the quiz for bonus points'
                            : '⏭️ Players will skip directly to reflection after the quiz'}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="hero"
                            className="flex-1 h-10"
                            onClick={handleCreateRoom}
                            disabled={isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create Room'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-10"
                            onClick={() => setShowOptions(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
