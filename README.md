# Enclavr Frontend

The default Next.js frontend for Enclavr voice chat platform.

## IMPORTANT: Use Bun

This project uses **bun** as the package manager. DO NOT use npm, yarn, or pnpm.

## Getting Started

```bash
bun install
bun run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript check |
| `bun run test` | Run Vitest unit tests (watch mode) |
| `bun run test:run` | Run Vitest unit tests (single run) |
| `bun run test:e2e` | Run Playwright E2E tests |

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Features

- User authentication (login/register)
- Room management with categories
- Real-time voice chat with WebRTC
- Video call support
- Screen sharing
- Text chat with markdown support
- Direct messaging (DM)
- Presence indicators
- Message reactions
- Pinned messages
- Push notifications
- Server invites
- Admin settings
- Responsive design
