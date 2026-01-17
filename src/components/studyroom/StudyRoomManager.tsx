import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
import { useLearningStore } from '@/lib/learningStore';
import { socketService } from '@/lib/socketService';
import { exportLeaderboardToPDF } from '@/lib/pdfExport';
import { Users, Trophy, Play, Lock, ShieldCheck, Share2, Minimize2, X, ChevronUp, StopCircle, Download, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const StudyRoomManager = () => {
    const {
        roomId,
        topic,
        participants,
        isHost,
        quizStarted,
        quizEnded,
        isMinimized,
        showPanel,
        leaderboard,
        setRoomData,
        addParticipant,
        updateLeaderboard,
        toggleMinimize,
        endQuiz,
        endRoom,
        resetRoom,
        syncPhase
    } = useRealtimeStudyRoomStore();

    const { currentPhase } = useLearningStore();

    useEffect(() => {
        if (!roomId) return;

        socketService.on('ROOM_SYNC', (data) => {
            setRoomData(data);
            // Sync content to main learning store
            if (data.content) {
                useLearningStore.getState().syncStudyRoomContent(data.content, data.aiData, data.pyqData);
            }
            toast.success(`Joined room: ${data.topic || 'Shared Room'}`);
        });

        socketService.on('USER_JOINED_NOTICE', (participant) => {
            addParticipant(participant);
            toast.info(`${participant.userName} joined the room`);
        });

        socketService.on('QUIZ_STARTED_NOTICE', () => {
            useRealtimeStudyRoomStore.setState({ quizStarted: true, quizEnded: false, currentPhase: 'quiz' });
            // Navigate to quiz phase
            useLearningStore.getState().setPhase('quiz');
            toast.success('Quiz has been started by the host!');
        });

        socketService.on('QUIZ_ENDED_NOTICE', () => {
            useRealtimeStudyRoomStore.setState({ quizEnded: true, currentPhase: 'reflection' });
            // Navigate to reflection phase
            useLearningStore.getState().setPhase('reflection');
            toast.success('Quiz has ended! Moving to reflection...');
        });

        socketService.on('PHASE_SYNC', ({ phase }) => {
            useRealtimeStudyRoomStore.setState({ currentPhase: phase });
            // Sync phase to learning store
            useLearningStore.getState().setPhase(phase);
            const phaseNames = {
                simulation: 'Simulation',
                quiz: 'Quiz',
                reflection: 'Reflection',
                mastery: 'Mastery Summary'
            };
            toast.info(`Moving to ${phaseNames[phase]}...`);
        });

        socketService.on('ROOM_CLOSED', () => {
            toast.info('Room has been closed by the host');
            // Navigate to mastery summary
            useLearningStore.getState().setPhase('mastery');
            // Reset room state
            resetRoom();
            socketService.disconnect();
        });

        socketService.on('LEADERBOARD_UPDATED', ({ leaderboard }) => {
            updateLeaderboard(leaderboard);
        });

        return () => {
            socketService.off('ROOM_SYNC');
            socketService.off('USER_JOINED_NOTICE');
            socketService.off('QUIZ_STARTED_NOTICE');
            socketService.off('QUIZ_ENDED_NOTICE');
            socketService.off('PHASE_SYNC');
            socketService.off('ROOM_CLOSED');
            socketService.off('LEADERBOARD_UPDATED');
        };
    }, [roomId]);

    // Auto-cleanup when host navigates away
    useEffect(() => {
        if (!isHost || !roomId) return;

        const handleBeforeUnload = () => {
            endRoom();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isHost, roomId]);

    if (!roomId || !showPanel) return null;

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied to clipboard!');
    };

    const handleStartQuiz = () => {
        useRealtimeStudyRoomStore.getState().startQuiz();
        useLearningStore.getState().setPhase('quiz');
        toast.success('Starting quiz for all participants...');
    };

    const handleEndQuiz = () => {
        endQuiz();
        toast.success('Quiz ended! Leaderboard is now visible.');
    };

    const handleDownloadPDF = () => {
        if (leaderboard.length === 0) {
            toast.error('No leaderboard data to export');
            return;
        }
        exportLeaderboardToPDF(leaderboard, topic || 'Study Room', roomId);
        toast.success('Leaderboard downloaded as PDF!');
    };

    const handleEndRoom = () => {
        if (confirm('Are you sure you want to end the room? All participants will be redirected to mastery summary.')) {
            endRoom();
            useLearningStore.getState().setPhase('mastery');
            toast.success('Room ended successfully');
        }
    };

    const handleClose = () => {
        if (isHost) {
            if (confirm('As host, closing will end the room for everyone. Continue?')) {
                endRoom();
                useLearningStore.getState().setPhase('mastery');
            }
        } else {
            if (confirm('Are you sure you want to leave the study room?')) {
                resetRoom();
                socketService.disconnect();
                toast.info('Left study room');
            }
        }
    };

    return (
        <div className="fixed top-4 right-52 z-[100] w-80">
            <AnimatePresence>
                {!isMinimized ? (
                    <motion.div
                        layout
                        className="glass-panel p-6 shadow-2xl border-primary/20 rounded-3xl"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    >
                        {/* Header with controls */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="font-bold text-sm tracking-tight">Study Room</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isHost && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                        <ShieldCheck className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Host</span>
                                    </div>
                                )}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 hover:bg-muted"
                                    onClick={toggleMinimize}
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={handleClose}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Room Topic */}
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Room Topic</p>
                                <p className="text-sm font-semibold truncate">{topic}</p>
                            </div>

                            {/* Room ID */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5 font-bold">Room ID</p>
                                    <p className="text-lg font-mono font-bold tracking-wider text-primary">{roomId}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary/10" onClick={copyRoomId}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Participants */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Participants ({participants.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {participants.map((p, i) => (
                                        <div key={i} className="px-3 py-1 rounded-full bg-background border border-border text-[11px] font-medium">
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leaderboard - Show when quiz ended or has scores */}
                            {(quizEnded || leaderboard.length > 0) && (
                                <div className="space-y-2 pt-2 border-t border-border/50">
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-3 h-3" />
                                        {quizEnded ? 'Final Leaderboard' : 'Live Leaderboard'}
                                    </span>
                                    <div className="space-y-1.5">
                                        {leaderboard.slice(0, 5).map((entry, i) => {
                                            const totalScore = (entry.score || 0) + (entry.puzzleScore || 0);
                                            return (
                                                <div key={i} className={`flex items-center justify-between text-xs p-2 rounded-lg ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                                    i === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
                                                        i === 2 ? 'bg-orange-600/10 border border-orange-600/20' :
                                                            'bg-primary/5'
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-muted-foreground">#{i + 1}</span>
                                                        <span className="font-medium text-foreground">{entry.name}</span>
                                                    </div>
                                                    <span className="font-bold text-primary">{totalScore} pts</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Leaderboard Actions - Only for host after quiz ends */}
                                    {isHost && quizEnded && (
                                        <div className="space-y-2 pt-2">
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2 font-bold py-3 rounded-xl"
                                                onClick={handleDownloadPDF}
                                            >
                                                <Download className="w-4 h-4" />
                                                DOWNLOAD PDF
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="w-full gap-2 font-bold py-3 rounded-xl"
                                                onClick={handleEndRoom}
                                            >
                                                <DoorOpen className="w-4 h-4" />
                                                END ROOM
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quiz Controls */}
                            <div className="pt-2">
                                {!quizStarted ? (
                                    isHost ? (
                                        <Button
                                            className="w-full gap-2 font-bold py-6 rounded-2xl shadow-lg"
                                            onClick={handleStartQuiz}
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            START SHARED QUIZ
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/30 text-muted-foreground italic text-xs">
                                            <Lock className="w-4 h-4" />
                                            Waiting for host to start quiz...
                                        </div>
                                    )
                                ) : quizEnded ? (
                                    <div className="space-y-2">
                                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-center font-bold text-sm">
                                            Quiz Completed! 🎉
                                        </div>
                                        {isHost && currentPhase === 'reflection' && (
                                            <Button
                                                className="w-full gap-2 font-bold py-4 rounded-2xl"
                                                onClick={() => syncPhase('mastery')}
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                                MOVE TO MASTERY SUMMARY
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 text-center font-bold text-sm">
                                            Quiz is active!
                                        </div>
                                        {isHost && currentPhase === 'quiz' && (
                                            <Button
                                                variant="destructive"
                                                className="w-full gap-2 font-bold py-4 rounded-2xl"
                                                onClick={handleEndQuiz}
                                            >
                                                <StopCircle className="w-4 h-4" />
                                                END QUIZ
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        className="glass-panel px-1 py-2 shadow-xl border-primary/20 rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
                        onClick={toggleMinimize}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Users className="w-4 h-4 text-primary" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Study Room</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground">{participants.length} online</span>
                        </div>
                        <ChevronUp className="w-3 h-3 text-muted-foreground ml-1 rotate-180" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
