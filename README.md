# Enclavr Frontend

The default Next.js frontend for Enclavr voice chat platform.

## IMPORTANT: Use Bun

This project uses **bun** as the package manager. DO NOT use npm, yarn, or pnpm.

## Error Monitoring (Sentry)

The Next.js frontend is integrated with Sentry for production error tracking, performance monitoring, and session replay.

### Configuration

Create a `.env.local` file with:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SENTRY_DSN=https://[email]@sentry.io/[project-id]
```

### Sentry Features

- **Error Tracking**: Captures unhandled exceptions and React errors
- **Performance Monitoring**: Auto-instrumented transactions and spans
- **Session Replay**: Records user sessions for debugging
- **Browser Tracing**: Visualizes page load performance
- **API Error Tracking**: Server-side API errors captured via base client

### Sentry Configuration Files

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Client-side Sentry (replay, browser tracing) |
| `sentry.server.config.ts` | Server-side Sentry (API errors) |
| `sentry.edge.config.ts` | Edge runtime Sentry |
| `src/app/error.tsx` | Error boundary with Sentry capture |
| `src/app/global-error.tsx` | Global error boundary |
| `src/lib/sentry-client.ts` | Sentry client utilities |

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
| `bun run test:coverage` | Run Vitest with coverage report |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run test:e2e:ui` | Run Playwright E2E tests with UI |

## Testing

This project uses **Vitest** for unit tests and **Playwright** for E2E tests.

### Unit Tests
- Tests are co-located with components (e.g., `Button.tsx` and `Button.test.tsx`)
- Edge case tests are in `src/test/*.edge.test.ts`
- Run `bun run test:run` to execute all unit tests
- Run `bun run test:coverage` to see coverage report

### Test Coverage
The codebase includes comprehensive tests for:
- **Hooks**: useChat, usePresence, useDM, useWebRTC
- **Store**: Zustand stores (useAuthStore, useRoomStore)
- **API**: API client methods
- **Components**: Auth forms, UI components

### Edge Case Testing
Edge case tests cover:
- Empty inputs and whitespace handling
- Error handling and recovery
- Network failure scenarios
- Unicode and special characters
- Rapid successive operations
- Connection state transitions

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SENTRY_DSN=https://[email]@sentry.io/[project-id]
```

## Getting Started

```bash
bun install
bun run dev
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

## Refactoring

When the codebase grows too large (>50 files in a module), refactor into smaller sub-modules:
- Create new npm packages using `bun init` and maintain via `bun install`
- Maintain clean boundaries between sub-modules
- Push new sub-module repositories to GitHub and link them in parent repo
- Update this README with new sub-modules

## Architecture

### Modular API Structure
The API client is organized into modular sub-modules for better maintainability:
- `src/lib/api/base.ts` - Base API client with authentication
- `src/lib/api/auth.ts` - Authentication endpoints
- `src/lib/api/room.ts` - Room management endpoints
- `src/lib/api/chat.ts` - Chat and messaging endpoints
- `src/lib/api/dm.ts` - Direct messaging endpoints
- `src/lib/api/presence.ts` - Presence endpoints
- `src/lib/api/admin.ts` - Admin endpoints (webhooks, analytics, bans, reports)

### WebRTC Utilities
WebRTC functionality is split into dedicated modules:
- `src/lib/webrtc/types.ts` - TypeScript interfaces
- `src/lib/webrtc/ice.ts` - ICE server configuration
- `src/lib/webrtc/peer.ts` - Peer connection utilities
- `src/hooks/useWebRTC.ts` - Main WebRTC hook
