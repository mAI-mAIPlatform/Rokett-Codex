import { randomUUID } from 'node:crypto';
import { BRAWLER_STATS } from './brawlers.js';
import type { BrawlerType, BulletState, PlayerInput, PlayerState, RoomState, Vec2 } from '../types/game.js';

interface RoomInternal {
  roomCode: string;
  started: boolean;
  players: Map<string, PlayerState>;
  bullets: BulletState[];
}

const MAP_BOUNDS = { minX: 32, minY: 32, maxX: 992, maxY: 992 };
const SPAWNS: Vec2[] = [
  { x: 140, y: 140 },
  { x: 880, y: 140 },
  { x: 140, y: 880 },
  { x: 880, y: 880 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export class RoomManager {
  private rooms = new Map<string, RoomInternal>();

  join(playerId: string, pseudo: string, brawler: BrawlerType, roomCode?: string): string {
    const room = this.findOrCreateRoom(roomCode);
    const stats = BRAWLER_STATS[brawler];
    const spawn = SPAWNS[room.players.size % SPAWNS.length];

    room.players.set(playerId, {
      id: playerId,
      pseudo,
      brawler,
      position: { ...spawn },
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      super: 0,
      lives: 3,
      score: 0,
      input: { up: false, down: false, left: false, right: false, seq: 0 },
      lastShotAt: 0,
    });

    if (room.players.size >= 2) {
      room.started = true;
    }

    return room.roomCode;
  }

  leave(playerId: string) {
    for (const room of this.rooms.values()) {
      if (room.players.delete(playerId) && room.players.size === 0) {
        this.rooms.delete(room.roomCode);
      }
    }
  }

  setInput(playerId: string, input: PlayerInput) {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.input = input;
  }

  shoot(playerId: string, dir: Vec2, isSuper = false) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const stats = BRAWLER_STATS[player.brawler];
    const now = Date.now();
    const cooldown = isSuper ? stats.cooldownMs * 1.5 : stats.cooldownMs;

    if (now - player.lastShotAt < cooldown) {
      return;
    }

    if (isSuper && player.super < 100) {
      return;
    }

    const room = this.getRoomOfPlayer(playerId);
    if (!room) return;

    const speedMultiplier = isSuper ? 1.5 : 1;
    const damageMultiplier = isSuper ? 2 : 1;

    room.bullets.push({
      id: randomUUID(),
      ownerId: player.id,
      position: { ...player.position },
      velocity: { x: dir.x * stats.bulletSpeed * speedMultiplier, y: dir.y * stats.bulletSpeed * speedMultiplier },
      ttl: 1400,
      damage: stats.damage * damageMultiplier,
    });

    player.lastShotAt = now;
    if (isSuper) {
      player.super = 0;
    }
  }

  tick(deltaMs: number) {
    for (const room of this.rooms.values()) {
      const dt = deltaMs / 1000;

      for (const player of room.players.values()) {
        const stats = BRAWLER_STATS[player.brawler];
        const dx = (Number(player.input.right) - Number(player.input.left)) * stats.speed * dt;
        const dy = (Number(player.input.down) - Number(player.input.up)) * stats.speed * dt;

        player.position.x = clamp(player.position.x + dx, MAP_BOUNDS.minX, MAP_BOUNDS.maxX);
        player.position.y = clamp(player.position.y + dy, MAP_BOUNDS.minY, MAP_BOUNDS.maxY);
      }

      room.bullets = room.bullets
        .map((bullet) => ({
          ...bullet,
          position: {
            x: bullet.position.x + bullet.velocity.x * dt,
            y: bullet.position.y + bullet.velocity.y * dt,
          },
          ttl: bullet.ttl - deltaMs,
        }))
        .filter((bullet) => bullet.ttl > 0);

      this.applyBulletHits(room);
    }
  }

  getState(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const players: RoomState['players'] = {};
    room.players.forEach((p) => {
      players[p.id] = {
        id: p.id,
        pseudo: p.pseudo,
        brawler: p.brawler,
        position: p.position,
        hp: p.hp,
        maxHp: p.maxHp,
        super: p.super,
        lives: p.lives,
        score: p.score,
      };
    });

    return {
      roomCode,
      started: room.started,
      players,
      bullets: room.bullets.map((b) => ({
        id: b.id,
        ownerId: b.ownerId,
        position: b.position,
        velocity: b.velocity,
      })),
    };
  }

  getRoomCodeOfPlayer(playerId: string) {
    return this.getRoomOfPlayer(playerId)?.roomCode ?? null;
  }

  getAllRoomCodes() {
    return [...this.rooms.keys()];
  }

  private applyBulletHits(room: RoomInternal) {
    const hitRadius = 16;

    room.bullets = room.bullets.filter((bullet) => {
      let collided = false;

      for (const target of room.players.values()) {
        if (target.id === bullet.ownerId || target.lives <= 0) continue;

        const dx = target.position.x - bullet.position.x;
        const dy = target.position.y - bullet.position.y;
        const hit = dx * dx + dy * dy <= hitRadius * hitRadius;

        if (hit) {
          target.hp -= bullet.damage;
          const shooter = room.players.get(bullet.ownerId);
          if (shooter) {
            shooter.super = clamp(shooter.super + 12, 0, 100);
          }

          if (target.hp <= 0) {
            target.lives -= 1;
            target.hp = target.maxHp;
            const respawn = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
            target.position = { ...respawn };

            if (shooter) {
              shooter.score += 1;
            }

            if (target.lives <= 0) {
              // Correction proactive: éviter un joueur négatif en vies.
              target.lives = 0;
              target.position = { x: -9999, y: -9999 };
            }
          }

          collided = true;
          break;
        }
      }

      const inside =
        bullet.position.x >= MAP_BOUNDS.minX &&
        bullet.position.x <= MAP_BOUNDS.maxX &&
        bullet.position.y >= MAP_BOUNDS.minY &&
        bullet.position.y <= MAP_BOUNDS.maxY;

      return !collided && inside;
    });
  }

  private findOrCreateRoom(roomCode?: string) {
    if (roomCode && this.rooms.has(roomCode)) {
      return this.rooms.get(roomCode)!;
    }

    if (!roomCode) {
      const available = [...this.rooms.values()].find((room) => room.players.size < 4);
      if (available) return available;
    }

    const code = roomCode ?? this.generateRoomCode();
    const newRoom: RoomInternal = {
      roomCode: code,
      started: false,
      players: new Map(),
      bullets: [],
    };

    this.rooms.set(code, newRoom);
    return newRoom;
  }

  private generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  private getPlayer(playerId: string) {
    return this.getRoomOfPlayer(playerId)?.players.get(playerId);
  }

  private getRoomOfPlayer(playerId: string) {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return null;
  }
}
