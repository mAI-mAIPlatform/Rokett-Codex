export type BrawlerType = 'tank' | 'sniper' | 'rusher';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  seq: number;
}

export interface PlayerState {
  id: string;
  pseudo: string;
  brawler: BrawlerType;
  position: Vec2;
  hp: number;
  maxHp: number;
  super: number;
  lives: number;
  score: number;
  input: PlayerInput;
  lastShotAt: number;
}

export interface BulletState {
  id: string;
  ownerId: string;
  position: Vec2;
  velocity: Vec2;
  ttl: number;
  damage: number;
}

export interface RoomState {
  roomCode: string;
  started: boolean;
  players: Record<string, Omit<PlayerState, 'input' | 'lastShotAt'>>;
  bullets: Array<Omit<BulletState, 'ttl' | 'damage'>>;
}
