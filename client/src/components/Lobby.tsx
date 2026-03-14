import { useState } from 'react';
import type { BrawlerType } from '../game/types/network';

interface LobbyProps {
  onJoin: (payload: { pseudo: string; brawler: BrawlerType; roomCode?: string }) => void;
}

const brawlers: Array<{ value: BrawlerType; label: string; desc: string }> = [
  { value: 'tank', label: 'Tank', desc: 'Très résistant, cadence lente.' },
  { value: 'sniper', label: 'Sniper', desc: 'Longue portée, peu de HP.' },
  { value: 'rusher', label: 'Rusher', desc: 'Très mobile, dégâts moyens.' },
];

export function Lobby({ onJoin }: LobbyProps) {
  const [pseudo, setPseudo] = useState('Player');
  const [roomCode, setRoomCode] = useState('');
  const [brawler, setBrawler] = useState<BrawlerType>('tank');

  return (
    <section className="glass-panel lobby">
      <h1>Rokett Stars — MVP</h1>
      <p>Choisis ton brawler, puis rejoins une room ou lance le matchmaking auto.</p>

      <label>
        Pseudo
        <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={16} />
      </label>

      <label>
        Code de room (optionnel)
        <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={8} />
      </label>

      <div className="brawler-grid">
        {brawlers.map((item) => (
          <button
            key={item.value}
            className={`brawler-card ${brawler === item.value ? 'active' : ''}`}
            onClick={() => setBrawler(item.value)}
            type="button"
          >
            <strong>{item.label}</strong>
            <span>{item.desc}</span>
          </button>
        ))}
      </div>

      <button
        className="primary"
        type="button"
        onClick={() => onJoin({ pseudo: pseudo.trim() || 'Player', brawler, roomCode: roomCode || undefined })}
      >
        Jouer
      </button>
    </section>
  );
}
