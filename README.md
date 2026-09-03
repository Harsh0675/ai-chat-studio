# Sora

Sora is a thoughtful, responsive AI chat workspace for exploring ideas, making plans, and keeping conversations close at hand.

## Current experience

- Local conversations saved in the browser
- Simulated streaming-style responses in clearly labeled Demo mode
- Conversation search, rename, delete, copy, and regenerate actions
- Model style selector and light/dark appearance controls
- Responsive layout with mobile navigation

The first build deliberately runs without a browser-exposed API key. To connect a production AI provider later, add a server-side streaming endpoint and keep the provider secret on the server.


## What changed

Note: the repository README previously referenced Next.js. The runnable demo included in this repository is a Vite + React app located at `artifacts/ai-chat-studio/`. This README has been updated to reflect that and to provide explicit local run instructions and a minimal server proxy example you can use for secure provider keys.


## How to run (shortest path)

This repo uses pnpm workspaces. Install pnpm (corepack or `npm i -g pnpm`) if you don't already have it.

1) Install at repo root (workspace):

```bash
pnpm install
```

2) Run the Vite + React demo (from the workspace root):

```bash
# from repo root, after the install above
pnpm dev
```

Or run it inside the artifact directly:

```bash
cd artifacts/ai-chat-studio
pnpm install
pnpm dev
```

3) Optional: run the minimal server proxy (see `server/`)

The UI is a client-side app and does not include a backend to hold secret provider keys. If you want to connect to a real AI provider (for example OpenAI), add your provider key and run the example proxy to avoid exposing secrets in the browser.

```bash
# from repo root
cd server
pnpm install
# set PROVIDER_API_KEY and optionally PORT in your environment
PROVIDER_API_KEY=sk-... PORT=3001 pnpm start
```

The proxy exposes POST /api/proxy which the frontend can call to forward requests to the provider. Adjust the proxy endpoint and request shape to match your provider.


## .env

A `.env.example` file has been added showing the minimum env variables the proxy needs (PROVIDER_API_KEY and PORT). Copy it to `.env` in the `server/` folder and fill in your key.


## Notes & recommendations

- The repository description previously said Next.js. If you prefer a Next.js app (server-side API routes included), I can convert the demo into a Next.js app and add API routes for provider calls. Otherwise the Vite + Express proxy keeps things simple.
- Keep the pnpm workspace preinstall guard if you want to enforce pnpm. Add a short note at the top-level README to help contributors who use npm or yarn.


## License

MIT
