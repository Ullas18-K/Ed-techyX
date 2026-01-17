import { create } from 'zustand';

export interface StudyRoomMember {
  id: string;
  name: string;
  joinedAt: Date;
  isHost: boolean;
  cursorPosition?: { x: number; y: number };
  isActive: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  simulationType: string;
  topic: string;
  subject: string;
  host: string;
  members: StudyRoomMember[];
  createdAt: Date;
  maxMembers: number;
  isActive: boolean;
  roomCode: string;  // NEW: Shareable room code
}

interface StudyRoomState {
  // Study room data
  studyRooms: StudyRoom[];
  currentStudyRoom: StudyRoom | null;
  currentUser: StudyRoomMember | null;
  
  // Actions
  createStudyRoom: (
    name: string,
    simulationType: string,
    topic: string,
    subject: string,
    hostName: string,
    maxMembers?: number
  ) => StudyRoom;
  
  joinStudyRoom: (roomId: string, memberName: string) => boolean;
  joinByRoomCode: (roomCode: string, memberName: string) => boolean;
  leaveStudyRoom: (roomId: string, memberId: string) => void;
  setCurrentStudyRoom: (room: StudyRoom | null) => void;
  getAvailableRooms: (simulationType?: string) => StudyRoom[];
  updateMemberCursor: (roomId: string, memberId: string, position: { x: number; y: number }) => void;
  closeStudyRoom: (roomId: string) => void;
}

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Generate shareable room code (6 uppercase alphanumeric)
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const useStudyRoomStore = create<StudyRoomState>((set, get) => ({
  studyRooms: [],
  currentStudyRoom: null,
  currentUser: null,

  createStudyRoom: (name, simulationType, topic, subject, hostName, maxMembers = 6) => {
    const roomId = generateId();
    const hostId = generateId();
    const roomCode = generateRoomCode();
    
    const newRoom: StudyRoom = {
      id: roomId,
      name,
      simulationType,
      topic,
      subject,
      host: hostId,
      members: [
        {
          id: hostId,
          name: hostName,
          joinedAt: new Date(),
          isHost: true,
          isActive: true,
        },
      ],
      createdAt: new Date(),
      maxMembers,
      isActive: true,
      roomCode,
    };

    set((state) => ({
      studyRooms: [...state.studyRooms, newRoom],
      currentStudyRoom: newRoom,
      currentUser: newRoom.members[0],
    }));

    return newRoom;
  },

  joinStudyRoom: (roomId: string, memberName: string) => {
    const { studyRooms } = get();
    const room = studyRooms.find((r) => r.id === roomId);

    if (!room || !room.isActive || room.members.length >= room.maxMembers) {
      return false;
    }

    const memberId = generateId();
    const newMember: StudyRoomMember = {
      id: memberId,
      name: memberName,
      joinedAt: new Date(),
      isHost: false,
      isActive: true,
    };

    set((state) => ({
      studyRooms: state.studyRooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              members: [...r.members, newMember],
            }
          : r
      ),
      currentStudyRoom: {
        ...room,
        members: [...room.members, newMember],
      },
      currentUser: newMember,
    }));

    return true;
  },

  joinByRoomCode: (roomCode: string, memberName: string) => {
    const { studyRooms } = get();
    const room = studyRooms.find((r) => r.roomCode === roomCode);

    if (!room || !room.isActive || room.members.length >= room.maxMembers) {
      return false;
    }

    const memberId = generateId();
    const newMember: StudyRoomMember = {
      id: memberId,
      name: memberName,
      joinedAt: new Date(),
      isHost: false,
      isActive: true,
    };

    set((state) => ({
      studyRooms: state.studyRooms.map((r) =>
        r.roomCode === roomCode
          ? {
              ...r,
              members: [...r.members, newMember],
            }
          : r
      ),
      currentStudyRoom: {
        ...room,
        members: [...room.members, newMember],
      },
      currentUser: newMember,
    }));

    return true;
  },

  leaveStudyRoom: (roomId: string, memberId: string) => {
    const { studyRooms, currentStudyRoom } = get();
    const room = studyRooms.find((r) => r.id === roomId);

    if (!room) return;

    const updatedMembers = room.members.filter((m) => m.id !== memberId);
    const isHost = room.members.find((m) => m.id === memberId)?.isHost;

    // If host leaves, promote another member or close room
    let newHost = updatedMembers.length > 0 ? updatedMembers[0] : null;
    if (isHost && newHost) {
      newHost.isHost = true;
    }

    const updatedRoom =
      updatedMembers.length > 0
        ? {
            ...room,
            members: newHost ? [newHost, ...updatedMembers.slice(1)] : updatedMembers,
            isActive: true,
          }
        : { ...room, isActive: false };

    set((state) => ({
      studyRooms: state.studyRooms.map((r) => (r.id === roomId ? updatedRoom : r)),
      currentStudyRoom:
        currentStudyRoom?.id === roomId
          ? updatedMembers.length > 0
            ? updatedRoom
            : null
          : currentStudyRoom,
      currentUser: currentStudyRoom?.id === roomId && memberId === get().currentUser?.id ? null : get().currentUser,
    }));
  },

  setCurrentStudyRoom: (room) => {
    set({ currentStudyRoom: room });
  },

  getAvailableRooms: (simulationType?: string) => {
    const { studyRooms } = get();
    return studyRooms.filter(
      (room) =>
        room.isActive &&
        room.members.length < room.maxMembers &&
        (!simulationType || room.simulationType === simulationType)
    );
  },

  updateMemberCursor: (roomId: string, memberId: string, position) => {
    set((state) => ({
      studyRooms: state.studyRooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              members: r.members.map((m) =>
                m.id === memberId ? { ...m, cursorPosition: position } : m
              ),
            }
          : r
      ),
      currentStudyRoom:
        state.currentStudyRoom?.id === roomId
          ? {
              ...state.currentStudyRoom,
              members: state.currentStudyRoom.members.map((m) =>
                m.id === memberId ? { ...m, cursorPosition: position } : m
              ),
            }
          : state.currentStudyRoom,
    }));
  },

  closeStudyRoom: (roomId: string) => {
    set((state) => ({
      studyRooms: state.studyRooms.map((r) =>
        r.id === roomId ? { ...r, isActive: false } : r
      ),
      currentStudyRoom: state.currentStudyRoom?.id === roomId ? null : state.currentStudyRoom,
    }));
  },
}));
