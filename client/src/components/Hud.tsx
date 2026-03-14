interface HudProps {
  hp: number;
  maxHp: number;
  superCharge: number;
  score: number;
}

export function Hud({ hp, maxHp, superCharge, score }: HudProps) {
  const hpRatio = Math.max(0, Math.min(100, (hp / Math.max(maxHp, 1)) * 100));
  const superRatio = Math.max(0, Math.min(100, superCharge));

  return (
    <aside className="glass-panel hud">
      <div>
        <span>HP</span>
        <div className="bar">
          <div className="fill hp" style={{ width: `${hpRatio}%` }} />
        </div>
      </div>

      <div>
        <span>Super</span>
        <div className="bar">
          <div className="fill super" style={{ width: `${superRatio}%` }} />
        </div>
      </div>

      <div className="score">Score: {score}</div>
    </aside>
  );
}
