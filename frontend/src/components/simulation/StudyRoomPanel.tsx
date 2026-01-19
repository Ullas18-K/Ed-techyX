import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, LogOut, Crown, CheckCircle2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudyRoomStore, type StudyRoom } from '@/lib/studyRoomStore';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StudyRoomPanelProps {
  room: StudyRoom;
  onLeave: () => void;
}

export function StudyRoomPanel({ room, onLeave }: StudyRoomPanelProps) {
  const { leaveStudyRoom, currentUser } = useStudyRoomStore();
  const { setPhase } = useLearningStore();
  const [copied, setCopied] = useState(false);

  const handleLeaveRoom = () => {
    if (currentUser) {
      leaveStudyRoom(room.id, currentUser.id);
      toast('Left study room');
      setPhase('mastery');
      onLeave();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const memberVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card rounded-2xl p-4 border border-border/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Study Room</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
          {room.members.length}/{room.maxMembers}
        </span>
      </div>

      {/* Room Code Section */}
      <div className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border/30">
        <p className="text-xs text-muted-foreground mb-2">Share this code:</p>
        <button
          onClick={handleCopyCode}
          className="w-full flex items-center justify-between p-2 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
        >
          <span className="font-mono font-bold text-primary text-lg tracking-widest">
            {room.roomCode}
          </span>
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {room.members.map((member, index) => (
          <motion.div
            key={member.id}
            variants={memberVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {member.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.isHost && (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                )}
                {!member.isHost && member.isActive && (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button
        onClick={handleLeaveRoom}
        variant="outline"
        className="w-full gap-2"
        size="sm"
      >
        <LogOut className="w-4 h-4" />
        Leave Room
      </Button>
    </motion.div>
  );
}
