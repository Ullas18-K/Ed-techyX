import { Server } from 'socket.io';

const rooms = new Map();

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('ROOM_CREATED', (data) => {
            const { roomId, topic, content, aiData, pyqData, hostId, hostName } = data;
            const roomData = {
                roomId,
                topic,
                content,
                aiData,
                pyqData,
                hostId,
                participants: [{ id: hostId, name: hostName, socketId: socket.id, score: 0 }],
                quizStarted: false,
                submissions: []
            };
            rooms.set(roomId, roomData);
            socket.join(roomId);
            console.log(`Room created: ${roomId} for topic: ${topic}`);
            console.log(`AI Data included: ${!!aiData}, PYQ Data included: ${!!pyqData}`);
        });

        socket.on('USER_JOINED', (data) => {
            const { roomId, userId, userName } = data;
            const room = rooms.get(roomId);

            if (room) {
                socket.join(roomId);
                const newParticipant = { id: userId, name: userName, socketId: socket.id, score: 0 };
                room.participants.push(newParticipant);

                // Send existing content to the joining user
                socket.emit('ROOM_SYNC', {
                    topic: room.topic,
                    content: room.content,
                    aiData: room.aiData,
                    pyqData: room.pyqData,
                    participants: room.participants,
                    quizStarted: room.quizStarted
                });
                console.log(`Syncing room ${roomId} to ${userName} - AI Data: ${!!room.aiData}, PYQ Data: ${!!room.pyqData}`);

                // Notify others
                socket.to(roomId).emit('USER_JOINED_NOTICE', { userId, userName });
                console.log(`User ${userName} joined room: ${roomId}`);
            } else {
                socket.emit('ERROR', { message: 'Room not found' });
            }
        });

        socket.on('QUIZ_STARTED', (data) => {
            const { roomId, hostId } = data;
            const room = rooms.get(roomId);

            if (room && room.hostId === hostId) {
                room.quizStarted = true;
                room.quizEnded = false;
                io.to(roomId).emit('QUIZ_STARTED_NOTICE');
                console.log(`Quiz started in room: ${roomId}`);
            }
        });

        socket.on('QUIZ_ENDED', (data) => {
            const { roomId, hostId } = data;
            const room = rooms.get(roomId);

            if (room && room.hostId === hostId) {
                room.quizEnded = true;
                room.currentPhase = 'reflection';
                io.to(roomId).emit('QUIZ_ENDED_NOTICE');
                console.log(`Quiz ended in room: ${roomId}`);
            }
        });

        socket.on('PHASE_CHANGED', (data) => {
            const { roomId, hostId, phase } = data;
            const room = rooms.get(roomId);

            if (room && room.hostId === hostId) {
                room.currentPhase = phase;
                io.to(roomId).emit('PHASE_SYNC', { phase });
                console.log(`Phase changed to ${phase} in room: ${roomId}`);
            }
        });

        socket.on('ROOM_ENDED', (data) => {
            const { roomId, hostId } = data;
            const room = rooms.get(roomId);

            if (room && room.hostId === hostId) {
                // Notify all participants that room is ending
                io.to(roomId).emit('ROOM_CLOSED');
                // Delete the room
                rooms.delete(roomId);
                console.log(`Room ${roomId} ended by host and deleted`);
            }
        });

        socket.on('QUIZ_SUBMITTED', (data) => {
            const { roomId, userId, score, totalQuestions } = data;
            const room = rooms.get(roomId);

            if (room) {
                const participant = room.participants.find(p => p.id === userId);
                if (participant) {
                    participant.score = score;
                    room.submissions.push({ userId, score, timestamp: new Date() });

                    // Broadcast updated leaderboard
                    const leaderboard = room.participants
                        .map(p => ({ name: p.name, score: p.score }))
                        .sort((a, b) => b.score - a.score);

                    io.to(roomId).emit('LEADERBOARD_UPDATED', { leaderboard });
                    console.log(`Quiz submitted by ${participant.name} in room: ${roomId}. Score: ${score}/${totalQuestions}`);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Clean up participants (optional for now, but good practice)
            rooms.forEach((room, roomId) => {
                const index = room.participants.findIndex(p => p.socketId === socket.id);
                if (index !== -1) {
                    const participant = room.participants[index];
                    room.participants.splice(index, 1);
                    socket.to(roomId).emit('USER_LEFT_NOTICE', { userId: participant.id });

                    if (room.participants.length === 0) {
                        rooms.delete(roomId);
                        console.log(`Room ${roomId} deleted as it became empty`);
                    }
                }
            });
        });
    });

    return io;
};
