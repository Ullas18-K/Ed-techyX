import { create } from 'zustand';
import { socketService } from './socketService';
import { LearningScenario } from './mockData';
import { AIScenarioResponse, PYQResponse } from './aiService';

interface Participant {
    id: string;
    name: string;
    score: number;
}

interface RealtimeStudyRoomState {
    roomId: string | null;
    userId: string | null;
    topic: string | null;
    content: LearningScenario | null;
    aiData: AIScenarioResponse | null;
    pyqData: PYQResponse | null;
    participants: Participant[];
    isHost: boolean;
    quizStarted: boolean;
    quizEnded: boolean;
    currentPhase: 'simulation' | 'quiz' | 'reflection' | 'mastery' | null;
    isMinimized: boolean;
    showPanel: boolean;
    leaderboard: { name: string; score: number }[];

    // Actions
    createRoom: (topic: string, content: LearningScenario, aiData: AIScenarioResponse | null, pyqData: PYQResponse | null, userName: string) => void;
    joinRoom: (roomId: string, userId: string, userName: string) => void;
    startQuiz: () => void;
    endQuiz: () => void;
    endRoom: () => void;
    submitScore: (score: number, total: number) => void;
    updateMyScore: (score: number) => void;
    setRoomData: (data: any) => void;
    addParticipant: (participant: any) => void;
    updateLeaderboard: (leaderboard: any) => void;
    syncPhase: (phase: 'simulation' | 'quiz' | 'reflection' | 'mastery') => void;
    toggleMinimize: () => void;
    hidePanel: () => void;
    resetRoom: () => void;
}

export const useRealtimeStudyRoomStore = create<RealtimeStudyRoomState>((set, get) => ({
    roomId: null,
    userId: null,
    topic: null,
    content: null,
    aiData: null,
    pyqData: null,
    participants: [],
    isHost: false,
    quizStarted: false,
    quizEnded: false,
    currentPhase: null,
    isMinimized: false,
    showPanel: true,
    leaderboard: [],

    createRoom: (topic, content, aiData, pyqData, userName) => {
        const roomId = Math.random().toString(36).substring(2, 9).toUpperCase();
        const userId = Math.random().toString(36).substring(2, 9);

        socketService.connect();
        socketService.emit('ROOM_CREATED', {
            roomId,
            topic,
            content,
            aiData,
            pyqData,
            hostId: userId,
            hostName: userName
        });

        set({
            roomId,
            userId,
            topic,
            content,
            aiData,
            pyqData,
            participants: [{ id: userId, name: userName, score: 0 }],
            isHost: true,
            quizStarted: false,
            currentPhase: 'simulation'
        });
    },

    joinRoom: (roomId, userId, userName) => {
        socketService.connect();
        socketService.emit('USER_JOINED', { roomId, userId, userName });
        set({ roomId, userId, isHost: false });
    },

    startQuiz: () => {
        const { roomId, isHost, userId } = get();
        if (isHost && roomId) {
            socketService.emit('QUIZ_STARTED', { roomId, hostId: userId });
            set({ quizStarted: true, quizEnded: false, currentPhase: 'quiz' });
        }
    },

    endQuiz: () => {
        const { roomId, isHost, userId } = get();
        if (isHost && roomId) {
            socketService.emit('QUIZ_ENDED', { roomId, hostId: userId });
            set({ quizEnded: true, currentPhase: 'reflection' });
        }
    },

    endRoom: () => {
        const { roomId, isHost, userId } = get();
        if (isHost && roomId) {
            socketService.emit('ROOM_ENDED', { roomId, hostId: userId });
            socketService.disconnect();
            set({
                roomId: null,
                userId: null,
                topic: null,
                content: null,
                aiData: null,
                pyqData: null,
                participants: [],
                isHost: false,
                quizStarted: false,
                quizEnded: false,
                currentPhase: null,
                isMinimized: false,
                showPanel: true,
                leaderboard: []
            });
        }
    },

    submitScore: (score, total) => {
        const { roomId, userId } = get();
        if (roomId && userId) {
            socketService.emit('QUIZ_SUBMITTED', {
                roomId,
                userId,
                score,
                totalQuestions: total
            });
        }
    },

    updateMyScore: (score) => {
        const { userId } = get();
        if (userId) {
            set((state) => ({
                participants: state.participants.map(p =>
                    p.id === userId ? { ...p, score } : p
                )
            }));
        }
    },

    setRoomData: (data) => {
        set({
            topic: data.topic,
            content: data.content,
            aiData: data.aiData,
            pyqData: data.pyqData,
            participants: data.participants,
            quizStarted: data.quizStarted
        });
    },

    addParticipant: (participant) => {
        set((state) => ({
            participants: [...state.participants, participant]
        }));
    },

    updateLeaderboard: (leaderboard) => {
        set({ leaderboard });
    },

    toggleMinimize: () => {
        set((state) => ({ isMinimized: !state.isMinimized }));
    },

    hidePanel: () => {
        set({ showPanel: false });
    },

    syncPhase: (phase) => {
        const { roomId, isHost, userId } = get();
        if (isHost && roomId) {
            socketService.emit('PHASE_CHANGED', { roomId, hostId: userId, phase });
        }
        set({ currentPhase: phase });
    },

    resetRoom: () => {
        set({
            roomId: null,
            userId: null,
            topic: null,
            content: null,
            aiData: null,
            pyqData: null,
            participants: [],
            isHost: false,
            quizStarted: false,
            quizEnded: false,
            currentPhase: null,
            isMinimized: false,
            showPanel: true,
            leaderboard: []
        });
    }
}));
