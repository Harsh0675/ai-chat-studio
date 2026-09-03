# ✦ Sora — AI Chat Studio

> A calm, responsive AI conversation workspace built for thinking, planning, learning, and keeping ideas organized.

**Repository:** `Harsh0675/ai-chat-studio`  
**App:** Vite + React + TypeScript  
**Package manager:** pnpm  
**License:** MIT

---

## Why this project exists

Sora is designed as an AI chat interface that feels more like a focused workspace than a basic chat box.

The current application combines conversation management, search, model-style selection, responsive navigation, local persistence, theme controls, and a provider-ready request boundary.

> **Current mode:** the repository includes a clearly labeled demo experience. Real provider requests are routed through a configurable API endpoint so provider secrets do not need to live in the browser.

---

## ✨ Product surface

| Area | What it provides |
| --- | --- |
| 💬 Conversations | Create, switch, rename, delete, copy, and regenerate conversations |
| 🔎 Conversation search | Quickly filter saved conversations |
| 🧠 Model styles | Clarity, Spark, and Depth modes with provider-model mapping |
| 💾 Local persistence | Conversations and settings are stored in browser `localStorage` |
| 🌗 Appearance | Light/dark theme controls |
| 📱 Responsive UI | Desktop sidebar plus mobile navigation |
| ⚡ Demo responses | Streaming-style conversational demo behavior without exposing a provider key |
| 🛡️ Error handling | React error boundary and toast-based feedback |
| 🧩 Component system | Radix UI primitives with reusable application components |

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│              Sora Chat Workspace             │
│                                              │
│  React + TypeScript                          │
│  Vite                                        │
│  Wouter routing                              │
│  TanStack React Query                        │
│  Radix UI + Tailwind CSS                     │
└──────────────────────┬───────────────────────┘
                       │
                       │ configurable request
                       ▼
              VITE_API_BASE_URL
                       │
                       ▼
              /api/proxy endpoint
                       │
                       ▼
              AI provider / model
```

The client keeps provider credentials out of the frontend. The application reads `VITE_API_BASE_URL` for the request boundary and maps its UI model styles to provider model identifiers.

---

## 🧰 Technology stack

### Application

- **React** — component-based UI
- **TypeScript** — typed application code
- **Vite** — development server and production build
- **Wouter** — lightweight routing
- **TanStack React Query** — client-side data/query infrastructure

### UI & interaction

- **Tailwind CSS** — utility-first styling
- **Radix UI** — accessible interface primitives
- **Lucide React** — interface icons
- **Framer Motion** — motion/interaction support
- **next-themes** — theme handling
- **Sonner** — notifications
- **React Hook Form + Zod** — form and validation tooling
- **Recharts** — charting support

### Workspace tooling

- **pnpm workspaces**
- **TypeScript 5.x**
- **Prettier**
- Replit Vite tooling included by the project workspace

---

## 🧠 Model experience

The interface exposes three model styles:

```text
Clarity ──► gpt-4o-mini
Spark   ──► gpt-4o-mini
Depth   ──► gpt-4o
```

These are UI-level mappings in the current client. A production provider integration should keep authentication and provider credentials on a server-side endpoint.

---

## 💾 Data model in the browser

Conversations are represented with a simple client-side structure:

```text
Conversation
├── id
├── title
├── updatedAt
└── messages[]
    ├── id
    ├── role
    ├── content
    └── createdAt
```

The application persists conversations under `ai-chat-studio-conversations` and interface settings under `ai-chat-studio-settings`.

---

## 🚀 Run it locally

This repository is a **pnpm workspace** and intentionally enforces pnpm during installation.

### 1. Install pnpm

Using Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

Or install pnpm globally:

```bash
npm install -g pnpm
```

### 2. Install dependencies

From the repository root:

```bash
pnpm install
```

### 3. Start the app

```bash
pnpm dev
```

The root command runs the Vite application in `artifacts/ai-chat-studio`.

### 4. Build for production

```bash
pnpm build
```

### 5. Type-check

```bash
pnpm typecheck
```

You can also work directly inside the application package:

```bash
cd artifacts/ai-chat-studio
pnpm dev
```

---

## 🔌 Connecting a real AI provider

The browser client sends chat requests to:

```text
${VITE_API_BASE_URL}/api/proxy
```

The request contains the selected provider model and conversation messages.

For production use, provide a server-side `/api/proxy` implementation and keep the provider API key on that server. **Do not put a private provider key in a `VITE_*` variable or commit it to Git.**

Example client environment configuration:

```env
VITE_API_BASE_URL=https://your-api.example.com
```

The current repository should be treated as a frontend workspace with a provider-ready integration boundary, rather than claiming that a production AI backend is included.

---

## 📁 Project map

```text
ai-chat-studio/
├── artifacts/
│   └── ai-chat-studio/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── pages/
│       │   └── ...
│       ├── public/
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
├── .github/
├── app.js
├── index.html
├── style.css
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
└── README.md
```

The main runnable Sora interface lives in `artifacts/ai-chat-studio/`.

---

## 🔐 Security notes

- Never commit API keys, tokens, or private credentials.
- Keep production AI-provider secrets server-side.
- Use environment variables for deployment configuration.
- Browser `localStorage` is convenient for the demo, but it is not a substitute for authenticated server-side persistence in a multi-user production system.

---

## 🎯 What this demonstrates

This project is a practical example of building a polished AI product interface with:

- typed React application architecture
- reusable UI primitives
- client-side state and persistence
- responsive product design
- routing and error boundaries
- configurable AI-provider integration
- workspace-based JavaScript/TypeScript tooling

It is intentionally structured as a UI-first AI workspace that can be extended with authentication, streaming provider responses, server-side persistence, and additional AI providers.

---

## 👨‍💻 Author

**Harsh Nagar**  
GitHub: [@Harsh0675](https://github.com/Harsh0675)

---

## License

MIT © Harsh Nagar
