import Phaser from 'phaser';
import { socketService } from '../net/socket';
import type { PlayerInputPayload, RoomState } from '../types/network';

interface SceneInitData {
  onHudUpdate: (payload: { hp: number; maxHp: number; superCharge: number; score: number }) => void;
}

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'w' | 'a' | 's' | 'd' | 'z' | 'q' | 'space', Phaser.Input.Keyboard.Key>;
  private players = new Map<string, Phaser.GameObjects.Rectangle>();
  private bullets = new Map<string, Phaser.GameObjects.Arc>();
  private localPlayerId = '';
  private seq = 0;
  private onHudUpdate: SceneInitData['onHudUpdate'] = () => undefined;

  constructor() {
    super('GameScene');
  }

  init(data: SceneInitData) {
    this.onHudUpdate = data.onHudUpdate;
  }

  preload() {
    // Tilemap MVP embarquée: on charge un JSON de carte simple.
    this.load.tilemapTiledJSON('arena', '/maps/arena-mvp.json');
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      z: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      q: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    // Sol uni + obstacles MVP (collision simple par rectangles).
    this.add.rectangle(512, 512, 1024, 1024, 0x1f2937).setDepth(-10);
    this.createArenaObstacles();

    const socket = socketService.getSocket();
    this.localPlayerId = socket.id ?? '';

    socketService.onJoined((state) => this.syncState(state));
    socketService.onStateUpdate((state) => this.syncState(state));

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const dir = this.getAimDirection(pointer);
        socketService.shoot({ dir });
      }
    });

    // Correction proactive: on utilise pointerup pour capter le clic droit relâché,
    // ce qui évite les tirs super répétés de manière involontaire.
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonReleased()) {
        const dir = this.getAimDirection(pointer);
        socketService.super({ dir });
      }
    });
  }

  update() {
    const payload = this.buildInputPayload();
    socketService.sendInput(payload);

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      const pointer = this.input.activePointer;
      const dir = this.getAimDirection(pointer);
      socketService.super({ dir });
    }
  }

  private createArenaObstacles() {
    const obstacles = [
      { x: 260, y: 220, w: 120, h: 24, color: 0x4b5563 },
      { x: 760, y: 300, w: 24, h: 120, color: 0x4b5563 },
      { x: 512, y: 512, w: 160, h: 32, color: 0x6b7280 },
      { x: 400, y: 780, w: 120, h: 28, color: 0x14532d },
    ];

    obstacles.forEach((o) => {
      this.add.rectangle(o.x, o.y, o.w, o.h, o.color, 0.9).setStrokeStyle(1, 0xffffff, 0.2);
    });
  }

  private buildInputPayload(): PlayerInputPayload {
    const up = this.cursors.up.isDown || this.keys.w.isDown || this.keys.z.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;
    const left = this.cursors.left.isDown || this.keys.a.isDown || this.keys.q.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;

    this.seq += 1;

    return {
      up,
      down,
      left,
      right,
      seq: this.seq,
    };
  }

  private getAimDirection(pointer: Phaser.Input.Pointer) {
    const local = this.players.get(this.localPlayerId);
    const originX = local?.x ?? 512;
    const originY = local?.y ?? 512;

    const dx = pointer.worldX - originX;
    const dy = pointer.worldY - originY;
    const len = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

    return {
      x: dx / len,
      y: dy / len,
    };
  }

  private syncState(state: RoomState) {
    this.localPlayerId = socketService.getSocket().id ?? this.localPlayerId;

    Object.values(state.players).forEach((player) => {
      const existing = this.players.get(player.id);
      if (!existing) {
        const color = player.id === this.localPlayerId ? 0x38bdf8 : 0xf43f5e;
        const rect = this.add.rectangle(player.position.x, player.position.y, 28, 28, color, 1);
        rect.setStrokeStyle(2, 0xffffff, 0.25);
        this.players.set(player.id, rect);
      } else {
        existing.x = Phaser.Math.Linear(existing.x, player.position.x, 0.45);
        existing.y = Phaser.Math.Linear(existing.y, player.position.y, 0.45);
      }

      if (player.id === this.localPlayerId) {
        this.onHudUpdate({
          hp: player.hp,
          maxHp: player.maxHp,
          superCharge: player.super,
          score: player.score,
        });
      }
    });

    for (const [id, sprite] of this.players.entries()) {
      if (!state.players[id]) {
        sprite.destroy();
        this.players.delete(id);
      }
    }

    state.bullets.forEach((bullet) => {
      const existing = this.bullets.get(bullet.id);
      if (!existing) {
        const arc = this.add.circle(bullet.position.x, bullet.position.y, 4, 0xfbbf24, 0.95);
        this.bullets.set(bullet.id, arc);
      } else {
        existing.x = bullet.position.x;
        existing.y = bullet.position.y;
      }
    });

    for (const [id, bullet] of this.bullets.entries()) {
      const alive = state.bullets.some((b) => b.id === id);
      if (!alive) {
        bullet.destroy();
        this.bullets.delete(id);
      }
    }
  }
}
