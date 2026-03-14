export type BrawlerType = 'tank' | 'sniper' | 'rusher';

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerInputPayload {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  seq: number;
}

export interface ShootPayload {
  dir: Vector2;
}

export interface PlayerState {
  id: string;
  pseudo: string;
  brawler: BrawlerType;
  position: Vector2;
  hp: number;
  maxHp: number;
  super: number;
  lives: number;
  score: number;
}

export interface BulletState {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
}

export interface RoomState {
  roomCode: string;
  started: boolean;
  players: Record<string, PlayerState>;
  bullets: BulletState[];
}
