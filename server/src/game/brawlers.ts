import type { BrawlerType } from '../types/game.js';

export interface BrawlerStats {
  maxHp: number;
  speed: number;
  bulletSpeed: number;
  cooldownMs: number;
  damage: number;
}

export const BRAWLER_STATS: Record<BrawlerType, BrawlerStats> = {
  tank: {
    maxHp: 220,
    speed: 150,
    bulletSpeed: 280,
    cooldownMs: 800,
    damage: 25,
  },
  sniper: {
    maxHp: 110,
    speed: 180,
    bulletSpeed: 460,
    cooldownMs: 700,
    damage: 40,
  },
  rusher: {
    maxHp: 150,
    speed: 240,
    bulletSpeed: 340,
    cooldownMs: 450,
    damage: 28,
  },
};
