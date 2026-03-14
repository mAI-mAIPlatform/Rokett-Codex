# Rokett Stars MVP (clone inspiré Brawl Stars)

Prototype multijoueur top-down 2D en TypeScript.

## Stack
- **Client**: React + Vite + Phaser 3
- **Serveur**: Node.js + Socket.io
- **Déploiement**: Vercel (client), Railway/Render (server)

## Démarrage local
```bash
npm install
npm run dev:server
npm run dev:client
```

- Client: `http://localhost:5173`
- Serveur: `http://localhost:3001`

> Optionnel: définir `VITE_SERVER_URL=http://localhost:3001` dans `client/.env`.

## Scripts utiles
```bash
npm run build
npm run typecheck
```

## Fonctionnalités MVP livrées
- Lobby (pseudo, choix brawler, room code optionnel).
- Matchmaking auto (room existante non pleine, sinon nouvelle room).
- 3 brawlers (tank / sniper / rusher) avec stats distinctes.
- Déplacement WASD + ZQSD, tir clic gauche, super clic droit ou Espace.
- Sync serveur autoritaire (joueurs, bullets, HP, vies, score).
- Respawn et limites de vies.
- HUD temps réel + UI style **Liquid Glass**.

## Déploiement
### Frontend (Vercel)
1. Importer le repo sur Vercel.
2. Root = repo, `vercel.json` configure `client/dist`.
3. Variable d’environnement: `VITE_SERVER_URL=https://votre-backend.up.railway.app`

### Backend (Railway/Render)
1. Déployer le dossier `server/` comme service Node.
2. Build command: `npm install && npm run build -w server`
3. Start command: `npm run start -w server`
4. Vérifier que WebSocket est activé.

## Étapes suivantes recommandées
- Tilemap Tiled complète (calques collisions + buissons + obstacles destructibles).
- Client-side prediction avancée + reconciliation par `seq`.
- Écran de fin de partie et statistiques détaillées.
- Spritesheet/animations et design sonore.
