# LUXORA ESTATES

A premium real-estate demonstration site (Vite + React + TypeScript SPA with a small Express API), backed by a typed sample dataset of 26 listings.

## Quick start (development)

```
npm install
npm run dev:all      # Vite dev app + API together (scripts/dev-all.js)
```

- Dev frontend: http://localhost:3000 (Vite dev server)
- Dev API: API_PORT env or 4000 (Vite proxies /api to it)

## Production deployment

One Node process serves both the built SPA and the API on a single host-injected port.

```
npm install
npm run build        # typecheck + vite build -> dist/
npm start            # NODE_ENV=production; binds PORT env (default 4000)
```

- The server binds `PORT` first, then `API_PORT`, then 4000. A host that injects PORT (Railway, Render, Fly, VPS with a reverse proxy) works with no configuration.
- Static files are served from `dist/` with an SPA fallback: any GET with `Accept: text/html` returns `dist/index.html` (deep links like /properties/:slug work); API misses still return the JSON 404 envelope.
- Optional env:
  - `CORS_ORIGINS=https://your-domain.example,https://www.your-domain.example` — adds explicit origins to the inquiry-POST allowlist (comma-separated; the allowlist never becomes "*").
  - `API_PORT` — dev-parity override for the listen port.

## Smoke tests after deploy

```
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:$PORT/                       # 200
curl -s http://localhost:$PORT/api/properties | head -c 80                             # JSON array
curl -s -H "Accept: text/html" http://localhost:$PORT/properties/palatial-5bhk-villa-with-private-pool-1 | head -c 120   # SPA shell
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:$PORT/api/nope               # 404 (JSON envelope)
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (frontend only) |
| `npm run dev:api` | API in watch mode |
| `npm run dev:all` | Frontend + API together |
| `npm run build` | Client typecheck + production bundle to dist/ |
| `npm start` | Production server: API + static dist/ on one port |
| `npm run check` | Client + server typecheck |
| `npm run lint` | ESLint over src and server |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |

## Checks before shipping

`npm run build && npm run check && npm run lint && npm test` — all four were green at the time of writing (93 unit tests, 7 Playwright E2E including two drive-exact form-validation paths).
