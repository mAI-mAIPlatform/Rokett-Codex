import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../game/config/phaserConfig';

interface Props {
  onHudUpdate: (payload: { hp: number; maxHp: number; superCharge: number; score: number }) => void;
}

export function GameCanvas({ onHudUpdate }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    gameRef.current = new Phaser.Game(createPhaserConfig('phaser-root', onHudUpdate));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [onHudUpdate]);

  return <div id="phaser-root" className="game-canvas" />;
}
