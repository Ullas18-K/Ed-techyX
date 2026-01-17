# Study Room Feature - Quick Start Guide

## 🚀 Getting Started

Your app now has a **Study Room** feature for collaborative learning!

## 📍 Where to Find It

1. **Start a Simulation**
   - Go to home page
   - Ask a question (e.g., "photosynthesis")
   - Go through the learning phases

2. **Complete 3+ Tasks**
   - In the simulation screen, complete 3 tasks
   - New "Create Study Room" button will appear

3. **Click "Create Study Room"**
   - The button appears next to the "Continue" button
   - Opens the Study Room Modal

## 🎯 Two Modes

### Mode 1: Create New Room (Be the Host)
```
1. Click "Create Study Room" button
2. Choose "Create New Room"
3. Enter your name: "John"
4. Enter room name: "Biology Study Group"
5. Click "Create Room"
6. You're now the host!
7. Friends can join your room
```

### Mode 2: Join Existing Room (Be a Member)
```
1. Click "Create Study Room" button
2. Choose "Join Existing Room"
3. Enter your name: "Jane"
4. Browse available rooms
5. Select a room
6. Click "Join Room"
7. You're now in the room!
```

## 👥 Study Room Panel

Once you're in a room, you'll see a panel on the right showing:
- Room member count (e.g., 3/6)
- List of all members with:
  - Member avatar (initial)
  - Member name
  - Host status (crown icon for host)
  - Active status (checkmark)
- "Leave Room" button

## 🎮 Room Limits

- **Max Members:** 6 per room
- **Room Type:** Specific to current simulation
- **Duration:** While you're in simulation phase

## ⚡ Quick Actions

### Create a Room
```
Button: "Create Study Room"
└─ Create New Room
    └─ Enter name
        └─ Click "Create Room"
```

### Join a Room
```
Button: "Create Study Room"
└─ Join Existing Room
    └─ Enter name
        └─ Select room
            └─ Click "Join Room"
```

### Leave a Room
```
Study Room Panel
└─ "Leave Room" button
    └─ Click
        └─ Removed from room
```

## 💡 Tips

1. **Room Names Should Be Descriptive**
   - "Biology Study Group" ✅
   - "Class A - Physics" ✅
   - "xyz123" ❌

2. **Join Rooms with Same Simulation Type**
   - Photosynthesis room → Join photosynthesis rooms
   - Circuit room → Join circuit rooms

3. **Host Benefits**
   - You created the room
   - You become host
   - If you leave, another member becomes host
   - Room closes when last member leaves

4. **Maximum Members**
   - 6 students per room
   - Full rooms won't accept new members
   - Create a new room if all are full

## 🔄 User Roles

### Host
- Created the room
- Crown icon next to name
- Can leave anytime
- Another member auto-becomes host if you leave

### Member
- Joined existing room
- Can learn together with others
- Can leave anytime
- No special privileges needed

## 📊 What's Shared

Currently sharing:
- ✅ Room membership list
- ✅ Member names and status
- ✅ Host identification

Future (next phase):
- 📋 Shared simulation state
- 💬 Chat messages
- 🎙️ Voice/video calls
- 📝 Collaborative notes
- 🎯 Shared scores

## ❌ Common Issues

### "Join Room" button is disabled
**Problem:** No available rooms
**Solution:** Create a new room or wait for someone to create one

### Can't join room
**Problem:** Room is full (6/6) or has closed
**Solution:** Create your own room instead

### Room disappeared
**Problem:** Last member left
**Solution:** Create a new room

## 🎓 Best Practices

1. **Choose Descriptive Names**
   - Helps others understand the room purpose

2. **Invite Friends by Sharing Room ID**
   - They can search and join

3. **Stay in Room While Studying**
   - Leave only when you're done

4. **Check Member Count**
   - Know how many people are in your study group

## 🔧 Technical Details (For Developers)

**Location:** Right side of simulation screen
**State:** Managed by `useStudyRoomStore()`
**Storage:** Currently in-memory (can add persistence)
**Styling:** Glass-morphism design system

## 📱 Responsive Design

- Works on desktop
- Works on tablets
- Fully responsive layout
- Touch-friendly buttons

## 🎨 Design Features

- **Smooth Animations:** Framer Motion transitions
- **Glass UI:** Premium glassmorphism effects
- **Dark Theme:** Matches app's overall design
- **Visual Hierarchy:** Clear member list display

## ❓ FAQ

**Q: Can I create multiple rooms?**
A: Yes! Create as many as you want.

**Q: Can I switch rooms?**
A: Leave one room, join another. One room at a time.

**Q: Do members see each other's work?**
A: Currently just names/status. Future versions will share simulation state.

**Q: What happens when I close the browser?**
A: You leave the room. Current setup is for one session.

**Q: Can I password-protect a room?**
A: Not in this version. Future enhancement planned.

**Q: How do I know who the host is?**
A: Look for the crown icon (👑) next to their name.

---

**Enjoy collaborative learning! 🎓👥**

Need more features? Check the full documentation in `STUDY_ROOM_FEATURE.md`
