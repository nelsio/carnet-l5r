# carnet-l5r

Compagnon de campagne pour joueurs de L5R 4e édition. Spécification : [HANDOFF.md](HANDOFF.md).

## Développement

Node 24 (voir `.nvmrc`).

```sh
npm install
npm run dev         # serveur de développement
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest
npm run build       # dist/carnet-l5r.html, fichier unique autonome
npm run test:e2e    # Playwright, sur le build
```
