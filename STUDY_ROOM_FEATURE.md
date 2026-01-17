# Study Room Feature Documentation

## Overview
The Study Room feature enables collaborative learning where multiple students can join a shared simulation environment to learn together in real-time.

## Features

### 1. **Create Study Room**
- After completing 3+ tasks in a simulation, users can create a new study room
- Customize the room name
- Set maximum capacity (default: 6 students)
- Room is automatically associated with the current simulation type, topic, and subject

### 2. **Join Existing Room**
- Browse available rooms for the current simulation type
- See room details:
  - Room name
  - Host name
  - Current member count / max capacity
- Join with your name

### 3. **Real-time Collaboration**
- See all active members in the study room
- Identify the host with a crown icon
- Track member activity status
- Leave the room anytime with one click

## User Flow

```
Simulation Screen
    ↓
Complete 3+ Tasks
    ↓
"Create Study Room" Button Appears (alongside "Continue")
    ↓
Click "Create Study Room"
    ↓
Study Room Modal Opens
    ├─ Option 1: Create New Room
    │   ├─ Enter name (optional)
    │   └─ Enter username
    │   └─ Room created with you as host
    │
    └─ Option 2: Join Existing Room
        ├─ Browse available rooms
        ├─ Enter username
        └─ Join selected room
    
Study Room Active (shown in right panel)
    ├─ See all members
    ├─ Leave anytime
    └─ Continue to next phase when ready
```

## File Structure

### New Files Created

1. **`src/lib/studyRoomStore.ts`**
   - Zustand store for study room state management
   - Handles room creation, joining, leaving
   - Manages member list and room availability

2. **`src/components/simulation/StudyRoomModal.tsx`**
   - Modal component for creating/joining rooms
   - Three modes: choice, create, join
   - Smooth animations and transitions

3. **`src/components/simulation/StudyRoomPanel.tsx`**
   - Displays active study room members
   - Shows member avatars and status
   - Leave button for exiting room

### Modified Files

1. **`src/components/simulation/SimulationScreen.tsx`**
   - Added Study Room button (appears when 3+ tasks completed)
   - Integrated StudyRoomModal component
   - Added StudyRoomPanel display when user is in a room
   - Imported new components and hooks

## API Reference

### useStudyRoomStore

#### State
```typescript
studyRooms: StudyRoom[]                    // All rooms
currentStudyRoom: StudyRoom | null         // Active room
currentUser: StudyRoomMember | null        // Current user info
```

#### Actions

**createStudyRoom()**
```typescript
createStudyRoom(
  name: string,              // Room display name
  simulationType: string,    // Type of simulation
  topic: string,            // Learning topic
  subject: string,          // Subject area
  hostName: string,         // Host's name
  maxMembers?: number       // Max capacity (default: 6)
): StudyRoom
```

**joinStudyRoom()**
```typescript
joinStudyRoom(
  roomId: string,          // Room ID to join
  memberName: string       // Joining member's name
): boolean                 // Success indicator
```

**leaveStudyRoom()**
```typescript
leaveStudyRoom(
  roomId: string,          // Room to leave
  memberId: string         // Member ID leaving
): void
```

**getAvailableRooms()**
```typescript
getAvailableRooms(
  simulationType?: string   // Filter by simulation type
): StudyRoom[]
```

**updateMemberCursor()**
```typescript
updateMemberCursor(
  roomId: string,
  memberId: string,
  position: { x: number; y: number }
): void
```

**closeStudyRoom()**
```typescript
closeStudyRoom(roomId: string): void
```

## Data Models

### StudyRoom
```typescript
interface StudyRoom {
  id: string;                        // Unique room ID
  name: string;                      // Room name
  simulationType: string;            // Type of simulation
  topic: string;                     // Learning topic
  subject: string;                   // Subject area
  host: string;                      // Host member ID
  members: StudyRoomMember[];        // Array of members
  createdAt: Date;                   // Creation timestamp
  maxMembers: number;                // Maximum capacity
  isActive: boolean;                 // Room active status
}
```

### StudyRoomMember
```typescript
interface StudyRoomMember {
  id: string;                        // Unique member ID
  name: string;                      // Member's display name
  joinedAt: Date;                    // Join timestamp
  isHost: boolean;                   // Is room host
  cursorPosition?: { x: number; y: number };  // For future cursor tracking
  isActive: boolean;                 // Active status
}
```

## Usage Example

```tsx
// In any component that has access to the store:
import { useStudyRoomStore } from '@/lib/studyRoomStore';

const MyComponent = () => {
  const { 
    createStudyRoom, 
    joinStudyRoom, 
    currentStudyRoom,
    leaveStudyRoom 
  } = useStudyRoomStore();

  // Create a room
  const handleCreateRoom = () => {
    createStudyRoom(
      'Biology Class - Photosynthesis',
      'photosynthesis',
      'Photosynthesis',
      'Biology',
      'John Doe'
    );
  };

  // Join a room
  const handleJoinRoom = (roomId: string) => {
    const success = joinStudyRoom(roomId, 'Jane Doe');
    if (success) {
      console.log('Joined room!');
    }
  };

  // Get available rooms
  const rooms = useStudyRoomStore((state) => 
    state.getAvailableRooms('photosynthesis')
  );

  return (
    // Component JSX
  );
};
```

## UI Components

### StudyRoomModal
- **Props:**
  - `isOpen: boolean` - Modal visibility
  - `onClose: () => void` - Close handler
  - `simulationType: string` - Current simulation type
  - `topic: string` - Current topic
  - `subject: string` - Current subject
  - `onRoomCreated: () => void` - Creation callback

- **Features:**
  - Three screens: choice, create, join
  - Smooth animations between screens
  - Form validation
  - Loading states

### StudyRoomPanel
- **Props:**
  - `room: StudyRoom` - Room data
  - `onLeave: () => void` - Leave handler

- **Features:**
  - Member list with avatars
  - Host indicator
  - Activity status
  - Leave button

## Future Enhancements

1. **Real-time Synchronization**
   - WebSocket integration for live updates
   - Shared simulation state across all members
   - Real-time cursor positions

2. **Chat & Voice**
   - In-room text chat
   - Voice/video calling
   - Screen sharing

3. **Progress Tracking**
   - Track who completed which tasks
   - Shared notes and annotations
   - Collaborative problem-solving

4. **Rewards System**
   - Group achievements
   - Bonus points for studying together
   - Leaderboards

5. **Advanced Features**
   - Room invites via link
   - Scheduled study sessions
   - Persistent room history
   - Room password protection

## Styling

All components use the liquid glass UI design system:
- `.glass-card` - Primary card styling
- `.glass-subtle` - Subtle glass effect
- `smooth-transition` - Fluid animations
- Motion components from Framer Motion for advanced animations

## Accessibility

- Keyboard navigation support
- ARIA labels for icons
- Clear visual hierarchy
- Color-independent indicators (icons for status)

## Performance Considerations

- Zustand for lightweight state management
- Optimized re-renders with hooks
- Efficient member list rendering
- No unnecessary network requests (currently client-side)

## Testing

When testing the feature:

1. **Create Room Flow**
   - Complete 3+ tasks in simulation
   - Click "Create Study Room" button
   - Fill in room name and username
   - Verify room appears in your room list

2. **Join Room Flow**
   - Create a room first
   - Open "Join" mode in another instance
   - Select the created room
   - Verify member appears in room

3. **Leave Room Flow**
   - Click "Leave Room" button
   - Verify user removed from member list
   - Verify host transfer if applicable

## Troubleshooting

### Room not appearing in join list
- Verify room is marked as `isActive: true`
- Check simulation type matches
- Ensure room has available slots

### Cannot join room
- Room might be full (check max capacity)
- Room might have been closed
- Try refreshing the available rooms list

### Host status not updating
- Check if previous host actually left
- Verify member list is updated
- Restart the connection
