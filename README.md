# Sora

Sora is a thoughtful, responsive AI chat workspace for exploring ideas, making plans, and keeping conversations close at hand.

## Current experience

- Local conversations saved in the browser
- Simulated streaming-style responses in clearly labeled Demo mode
- Conversation search, rename, delete, copy, and regenerate actions
- Model style selector and light/dark appearance controls
- Responsive layout with mobile navigation

The first build deliberately runs without a browser-exposed API key. To connect a production AI provider later, add a server-side streaming endpoint and keep the provider secret on the server.

## What's in the repo

The runnable app is a Vite + React app located at `artifacts/ai-chat-studio/`, managed as a pnpm workspace. The repository enforces pnpm (npm/yarn are rejected by a preinstall guard).

## How to run

Install pnpm (`corepack enable` or `npm i -g pnpm`) if you don't already have it, then from the repo root:

```bash
pnpm install
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ai-chat-studio run dev
```

`PORT` and `BASE_PATH` are optional (defaults: `4173` and `./`). The managed Replit workflow sets them explicitly.

Other useful commands:

```bash
pnpm run typecheck                          # typecheck all packages
PORT=3000 BASE_PATH=/ pnpm run build        # typecheck + production build to artifacts/ai-chat-studio/dist/public
```

## Deploy

- **GitHub Pages**: pushing to `main` runs `.github/workflows/static.yml`, which builds the app with `BASE_PATH=/<repo-name>/` and publishes `artifacts/ai-chat-studio/dist/public`. In the repository settings, set Pages → Source to **GitHub Actions**.
- **Vercel**: `vercel.json` configures the install/build commands, output directory, and SPA rewrite; no extra project settings are needed.

## Connecting a real AI provider

The UI is a client-side app and does not include a backend to hold secret provider keys. Before connecting a live provider, add a server-side streaming endpoint (for example an Express proxy exposing `POST /api/chat`), configure the provider key as a server-side environment secret, and switch the composer from demo responses to that route. Never put provider keys in `VITE_*` variables or client-side code.

## License

MIT
