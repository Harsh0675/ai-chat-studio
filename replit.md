# AI Chat Studio

AI Chat Studio is a calm, focused chat workspace for thinking through questions, shaping ideas, and returning to saved conversations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- The first build runs in explicit local demo mode. A production AI provider can be connected later without changing the chat surface.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-chat-studio/src/App.tsx` — chat workspace behavior, local persistence, conversation history, composer, settings, and demo responses
- `artifacts/ai-chat-studio/src/index.css` — shared theme tokens, typography, responsive styling, motion, and dark mode
- `artifacts/ai-chat-studio/.replit-artifact/artifact.toml` — artifact routing and managed web workflow
- `artifacts/api-server` — shared API service, currently reserved for future server-side AI integration

## Architecture decisions

- The initial chat experience is local-first so it is immediately usable without exposing an API key in the browser.
- Conversations and preferences are persisted in localStorage, with an explicit Local/Demo status in the UI.
- The app is a root-routed React + Vite artifact so the later publish flow does not need a path rewrite.
- The visual language uses editorial typography and a dark workspace rail to make a utility product feel personal rather than clinical.

## Product

- Start conversations from suggested prompts or the composer
- Simulated streaming-style assistant replies in demo mode
- Search, rename, delete, and revisit saved conversations
- Copy responses and regenerate the latest response
- Choose a model style, toggle demo mode, and switch light/dark appearance
- Responsive sidebar behavior for mobile

## User preferences

- User wants a strong AI chatbot web application in a new GitHub repository and intends to deploy it later.

## Gotchas

- Do not describe demo responses as live AI; the interface intentionally labels the current local-only behavior.
- The app workflow supplies `PORT` and `BASE_PATH`; use the managed artifact workflow rather than starting Vite manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
