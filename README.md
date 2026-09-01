# Sora

Sora is a thoughtful, responsive AI chat workspace for exploring ideas, making plans, and keeping conversations close at hand.

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
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ai-chat-studio run dev
```

Vite requires `PORT` and `BASE_PATH`. The managed Replit workflow provides them; set them yourself when running locally.

## Deploy

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which builds the app with `BASE_PATH=/<repo-name>/` and publishes `artifacts/ai-chat-studio/dist/public` to GitHub Pages. In the repository settings, set Pages → Source to **GitHub Actions**.

## Deploy later

The app is already structured as a deployable React + Vite artifact. Before connecting a live provider, configure the provider key as a server-side environment secret and switch the composer from demo responses to the server streaming route. Never put provider keys in `VITE_*` variables or client-side code.