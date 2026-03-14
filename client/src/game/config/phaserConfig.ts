import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

export const createPhaserConfig = (
  parent: string,
  onHudUpdate: (payload: { hp: number; maxHp: number; superCharge: number; score: number }) => void,
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: 1024,
  height: 1024,
  backgroundColor: '#0f172a',
  scene: [GameScene],
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  callbacks: {
    postBoot: (game) => {
      game.scene.start('GameScene', { onHudUpdate });
    },
  },
});
