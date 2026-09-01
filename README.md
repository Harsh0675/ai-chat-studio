# AI Chat Studio

AI Chat Studio is a thoughtful, responsive chat workspace for exploring ideas, making plans, and keeping conversations close at hand.

## Current experience

- Local conversations saved in the browser
- Simulated streaming-style responses in clearly labeled Demo mode
- Conversation search, rename, delete, copy, and regenerate actions
- Model style selector and light/dark appearance controls
- Responsive layout with mobile navigation

The first build deliberately runs without a browser-exposed API key. To connect a production AI provider later, add a server-side streaming endpoint and keep the provider secret on the server.

## Run

This repository uses pnpm workspaces:

```bash
pnpm install
pnpm --filter @workspace/ai-chat-studio run dev
```

The managed preview/publish workflow provides the `PORT` and `BASE_PATH` values expected by Vite.

## Deploy later

The app is already structured as a deployable React + Vite artifact. Before connecting a live provider, configure the provider key as a server-side environment secret and switch the composer from demo responses to the server streaming route. Never put provider keys in `VITE_*` variables or client-side code.