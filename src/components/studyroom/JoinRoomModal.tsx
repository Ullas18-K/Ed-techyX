import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLearningStore } from '@/lib/learningStore';

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinRoomModal = ({ isOpen, onClose }: JoinRoomModalProps) => {
    const [roomId, setRoomId] = useState('');
    const [userName, setUserName] = useState('');
    const { joinRoom } = useRealtimeStudyRoomStore();
    const { setPhase } = useLearningStore();
    const navigate = useNavigate();

    const handleJoin = () => {
        if (!roomId || !userName) return;

        joinRoom(roomId, Math.random().toString(36).substring(2, 9), userName);
        onClose();
        // In a real app, 'ROOM_SYNC' would trigger navigation/content update
        // For this prototype, we'll wait for the sync to happen in SectionManager or similar
        setPhase('simulation');
        navigate('/simulation');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-8 border-primary/20 bg-background shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Join Study Room</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Enter a Room ID shared by your friend to learn together in real-time.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80 ml-1">Room Identity</label>
                        <Input
                            placeholder="e.g. XJ92KL1"
                            className="h-14 rounded-2xl border-primary/20 bg-muted/50 font-mono text-lg font-bold tracking-widest px-6 uppercase focus:ring-primary"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80 ml-1">Your Name</label>
                        <Input
                            placeholder="How should others see you?"
                            className="h-14 rounded-2xl border-primary/20 bg-muted/50 font-semibold px-6 focus:ring-primary"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    className="w-full h-14 rounded-2xl font-bold text-lg gap-3 shadow-lg hover:shadow-primary/20"
                    onClick={handleJoin}
                    disabled={!roomId || !userName}
                >
                    Enter Room
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </DialogContent>
        </Dialog>
    );
};
