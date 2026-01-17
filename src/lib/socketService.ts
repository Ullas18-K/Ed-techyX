import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:9000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);
            console.log('Connecting to socket server...');
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    getSocketId() {
        return this.socket?.id;
    }
}

export const socketService = new SocketService();
