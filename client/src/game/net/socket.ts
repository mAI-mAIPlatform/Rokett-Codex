import { io, Socket } from 'socket.io-client';
import type { BrawlerType, PlayerInputPayload, RoomState, ShootPayload } from '../types/network';

export interface JoinPayload {
  pseudo: string;
  brawler: BrawlerType;
  roomCode?: string;
}

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    const serverUrl = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
    this.socket = io(serverUrl, {
      transports: ['websocket'],
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinRoom(payload: JoinPayload) {
    this.getSocket().emit('room:join', payload);
  }

  sendInput(payload: PlayerInputPayload) {
    this.getSocket().emit('player:input', payload);
  }

  shoot(payload: ShootPayload) {
    this.getSocket().emit('player:shoot', payload);
  }

  super(payload: ShootPayload) {
    this.getSocket().emit('player:super', payload);
  }

  onStateUpdate(cb: (state: RoomState) => void) {
    this.getSocket().on('state:update', cb);
  }

  onJoined(cb: (state: RoomState) => void) {
    this.getSocket().on('room:joined', cb);
  }

  offAll() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
