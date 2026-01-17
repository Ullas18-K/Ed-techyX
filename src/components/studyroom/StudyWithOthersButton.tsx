import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { useLearningStore } from '@/lib/learningStore';
import { toast } from 'sonner';

export const StudyWithOthersButton = () => {
    const [isCreating, setIsCreating] = useState(false);
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
            createRoom(currentScenario.topic, currentScenario, aiScenarioData, pyqData, 'Host Learner');
            toast.success('Study Room Created!');
        } catch (error) {
            toast.error('Failed to create room');
        } finally {
            setIsCreating(false);
        }
    };

    if (roomId) return null; // Room already exists

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Button
                variant="outline"
                className="gap-2.5 h-12 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary font-bold transition-all px-6 rounded-2xl"
                onClick={handleCreateRoom}
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
    );
};
