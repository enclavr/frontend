# Enclavr Frontend - Agent Instructions

## Build & Test

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run ESLint
bun run test:run     # Run unit tests (Vitest)
bun run test:e2e     # Run E2E tests (Playwright)
```

## Code Style

### TypeScript
- **Always** use explicit types for function parameters and return types
- **Never** use `any` - use `unknown` if type is truly unknown
- Use `interface` for objects, `type` for unions/aliases
- Enable strict mode in tsconfig.json

### React
- Use functional components with arrow functions or `function` keyword
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Use `React.memo` for components that render often with same props
- Use `useRef` for mutable values that don't trigger re-renders
- Place `useState` hooks at the top of the component
- Place `useEffect` hooks after state hooks
- Destructure props in component parameters

### Components
- Use co-location: keep component files near their usage when possible
- Name components with PascalCase
- Name component files with PascalCase (e.g., `UserAvatar.tsx`)
- Extract reusable logic into custom hooks
- Keep components small and focused (single responsibility)

### State Management (Zustand)
- Create stores in `src/lib/stores/`
- Use `create<T>()` with explicit type
- Prefer selector functions to avoid unnecessary re-renders
- Use `useShallow` when selecting multiple items

### Tailwind CSS
- Use utility classes directly in JSX
- Use `cn()` utility (classnames) for conditional classes
- Avoid arbitrary values - use theme values when possible
- Group related classes (layout → spacing → visual → state)
- Use `dark:` prefix for dark mode variants

### Naming Conventions
- Use camelCase for variables, functions, const
- Use PascalCase for components, types, interfaces
- Use SCREAMING_SNAKE_CASE for constants
- Prefix boolean variables with `is`, `has`, `should`, `can`

## Testing

### Unit/Component Testing (Vitest)
- Use **Vitest** as the test runner
- Use **@testing-library/react** for component testing
- **NEVER mock data** - use actual API responses and real data
- Test with real server responses using MSW (Mock Service Worker) only for network errors
- Test critical user flows with real data
- Place tests next to components (e.g., `Button.tsx` and `Button.test.tsx`)

### E2E Testing (Playwright)
- Use **Playwright** for end-to-end testing
- Place E2E tests in `e2e/` directory
- Use `bun run test:e2e` to run E2E tests
- Test critical user journeys (login, navigation, voice chat connection)
- Use actual data, not mocked data

## Directory Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Core utilities (API, stores, webrtc)
├── types/         # TypeScript interfaces
└── test/          # Test utilities and edge case tests
```

## Environment

- **ALWAYS use bun** - NEVER use npm, yarn, or pnpm
- If you accidentally use npm, delete node_modules and lock file, then run `bun install`

## Important Notes

- Keep files under 300 lines
- Use barrel files (`index.ts`) for clean imports
- Always handle async errors with try/catch
- Display user-friendly error messages
- Lazy load routes with `dynamic()` import
- Use `next/image` for images
- Use `next/font` for fonts
