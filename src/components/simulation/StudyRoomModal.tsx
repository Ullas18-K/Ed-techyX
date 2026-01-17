import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudyRoomStore } from '@/lib/studyRoomStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StudyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationType: string;
  topic: string;
  subject: string;
  onRoomCreated: () => void;
}

export function StudyRoomModal({
  isOpen,
  onClose,
  simulationType,
  topic,
  subject,
  onRoomCreated,
}: StudyRoomModalProps) {
  const { createStudyRoom, joinStudyRoom, joinByRoomCode, getAvailableRooms } = useStudyRoomStore();
  const [mode, setMode] = useState<'choice' | 'create' | 'join' | 'code'>('choice');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableRooms = getAvailableRooms(simulationType);

  const handleCreateRoom = () => {
    if (!userName.trim() || !roomName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      createStudyRoom(roomName, simulationType, topic, subject, userName);
      toast.success(`Study room "${roomName}" created!`);
      setIsLoading(false);
      onClose();
      onRoomCreated();
    }, 800);
  };

  const handleJoinRoom = () => {
    if (!userName.trim() || !selectedRoomId) {
      toast.error('Please enter your name and select a room');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const joined = joinStudyRoom(selectedRoomId, userName);
      if (joined) {
        toast.success(`Joined study room!`);
        setIsLoading(false);
        onClose();
        onRoomCreated();
      } else {
        toast.error('Failed to join room (room full or inactive)');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleJoinByCode = () => {
    if (!userName.trim() || !roomCode.trim()) {
      toast.error('Please enter your name and room code');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const joined = joinByRoomCode(roomCode.toUpperCase(), userName);
      if (joined) {
        toast.success(`Joined study room!`);
        setIsLoading(false);
        onClose();
        onRoomCreated();
      } else {
        toast.error('Invalid room code or room is full/inactive');
        setIsLoading(false);
      }
    }, 800);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.3
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.3
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl max-w-md w-full glass-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold text-foreground">Study Room</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {mode === 'choice' ? (
                  <motion.div
                    key="choice"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    <p className="text-muted-foreground text-sm mb-6">
                      Collaborate with other students on this {simulationType} simulation
                    </p>

                    <Button
                      onClick={() => setMode('create')}
                      variant="hero"
                      className="w-full h-12 gap-2 text-base"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Room
                    </Button>

                    <Button
                      onClick={() => setMode('join')}
                      variant="outline"
                      className="w-full h-12 gap-2 text-base"
                      disabled={availableRooms.length === 0}
                    >
                      <LogIn className="w-5 h-5" />
                      Join Existing Room
                    </Button>

                    <Button
                      onClick={() => setMode('code')}
                      variant="outline"
                      className="w-full h-12 gap-2 text-base"
                    >
                      <LogIn className="w-5 h-5" />
                      Join by Room Code
                    </Button>

                    {availableRooms.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        No available rooms. Create one or join using a room code!
                      </p>
                    )}

                    <Button
                      onClick={onClose}
                      variant="ghost"
                      className="w-full"
                    >
                      Skip for Now
                    </Button>
                  </motion.div>
                ) : mode === 'create' ? (
                  <motion.div
                    key="create"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Your Name
                      </label>
                      <Input
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Room Name
                      </label>
                      <Input
                        placeholder="e.g., 'Biology Study Group'"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Max Members:</span> 6 students
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold text-foreground">Simulation:</span> {simulationType}
                      </p>
                    </div>

                    <Button
                      onClick={handleCreateRoom}
                      variant="hero"
                      className="w-full h-12"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Room'
                      )}
                    </Button>

                    <Button
                      onClick={() => {
                        setMode('choice');
                        setUserName('');
                        setRoomName('');
                      }}
                      variant="ghost"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </motion.div>
                ) : mode === 'join' ? (
                  <motion.div
                    key="join"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Your Name
                      </label>
                      <Input
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">
                        Available Rooms
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableRooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={cn(
                              'w-full p-3 rounded-lg border-2 transition-all text-left',
                              selectedRoomId === room.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 glass-subtle hover:border-primary/50'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-foreground text-sm">
                                  {room.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Host: {room.members[0]?.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                <Users className="w-3 h-3" />
                                {room.members.length}/{room.maxMembers}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleJoinRoom}
                      variant="hero"
                      className="w-full h-12"
                      disabled={isLoading || !selectedRoomId}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Room'
                      )}
                    </Button>

                    <Button
                      onClick={() => {
                        setMode('choice');
                        setUserName('');
                        setSelectedRoomId(null);
                      }}
                      variant="ghost"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </motion.div>
                ) : mode === 'code' ? (
                  <motion.div
                    key="code"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Your Name
                      </label>
                      <Input
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Room Code
                      </label>
                      <Input
                        placeholder="e.g., ABC123"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="bg-secondary/50 uppercase text-center text-lg font-semibold tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Ask the room host for their room code
                      </p>
                    </div>

                    <Button
                      onClick={handleJoinByCode}
                      variant="hero"
                      className="w-full h-12"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join by Code'
                      )}
                    </Button>

                    <Button
                      onClick={() => {
                        setMode('choice');
                        setUserName('');
                        setRoomCode('');
                      }}
                      variant="ghost"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
