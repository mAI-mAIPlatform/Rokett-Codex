import { useMemo, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Hud } from './components/Hud';
import { Lobby } from './components/Lobby';
import { socketService } from './game/net/socket';

interface HudState {
  hp: number;
  maxHp: number;
  superCharge: number;
  score: number;
}

const defaultHud: HudState = {
  hp: 100,
  maxHp: 100,
  superCharge: 0,
  score: 0,
};

export default function App() {
  const [isInGame, setIsInGame] = useState(false);
  const [hud, setHud] = useState<HudState>(defaultHud);

  const onHudUpdate = useMemo(
    () => (payload: HudState) => {
      setHud(payload);
    },
    [],
  );

  return (
    <main className="app-shell">
      {!isInGame && (
        <Lobby
          onJoin={(payload) => {
            socketService.connect();
            socketService.joinRoom(payload);
            setIsInGame(true);
          }}
        />
      )}

      {isInGame && (
        <>
          <Hud {...hud} />
          <GameCanvas onHudUpdate={onHudUpdate} />
        </>
      )}
    </main>
  );
}
