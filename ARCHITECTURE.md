# Architecture du projet — Clone Brawl Stars (MVP)

## Vue d’ensemble
Le projet est structuré en **monorepo TypeScript** avec deux applications :

- `client/` : frontend React + Vite + Phaser 3 (rendu WebGL, UI, HUD, lobby).
- `server/` : backend Node.js + Socket.io (rooms, simulation autoritaire, synchronisation d’état).

```text
/workspace/Rokett-Codex
├─ client/
│  ├─ src/
│  │  ├─ components/      # UI React (Lobby, HUD, fin de partie)
│  │  ├─ game/            # Phaser: scènes, entités, réseau
│  │  ├─ styles/          # thème global + effet Liquid Glass
│  │  └─ main.tsx
│  ├─ public/maps/        # tilemap JSON
│  └─ vite.config.ts
├─ server/
│  ├─ src/
│  │  ├─ game/            # logique de rooms, joueurs, tirs, collisions
│  │  ├─ types/           # contrats réseau partagés côté serveur
│  │  └─ index.ts
│  └─ tsconfig.json
├─ vercel.json
└─ README.md
```

## Flux réseau (MVP)
1. Le client ouvre la socket (`socket.io-client`) et envoie `room:join` (pseudo + brawler + room code optionnel).
2. Le serveur place le joueur dans une room (code fourni ou matchmaking automatique 2-4 joueurs).
3. Le client envoie les intentions (`player:input`, `player:shoot`, `player:super`).
4. Le serveur simule l’état autoritaire et diffuse `state:update` (positions, HP, bullets, score).
5. Le client applique une interpolation + prédiction locale légère pour améliorer la fluidité.

## Gameplay MVP implémenté (socle)
- Carte top-down 2D (arena 32x32) avec collisions basiques.
- 3 brawlers paramétrés : Tank / Sniper / Rusher.
- Déplacement WASD/ZQSD.
- Tir clic gauche vers pointeur (direction souris).
- Super attaque clic droit ou Espace.
- HP, respawn et vies max (3).
- HUD en overlay React (HP, super, score).

## Choix techniques clés
- **Serveur autoritaire** : évite la triche simple sur positions/HP.
- **Types partagés conceptuellement** : mêmes structures de payload côté client et serveur pour réduire les bugs d’intégration.
- **Liquid Glass UI** : couche visuelle moderne (blur, transparence, bord lumineux) appliquée aux cartes et panneaux UI.

## Déploiement
- Frontend `client/` déployé sur Vercel (build Vite statique).
- Backend `server/` déployé sur Railway/Render (Node + WebSocket).

