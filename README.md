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

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Features

- User authentication
- Room management
- Voice chat interface
- Responsive design
