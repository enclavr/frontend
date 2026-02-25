# Frontend Agent

## Role
Manages the Next.js frontend for Enclavr voice chat platform.

## Tasks
- Implement UI components
- Create pages and routing
- Handle state management
- Style components

## Package Manager
- **ALWAYS use bun** - NEVER use npm, yarn, or pnpm
- Commands: `bun install`, `bun run dev`, `bun run build`, `bun run lint`
- If you accidentally use npm, delete node_modules and lock file, then run `bun install`

## Guidelines
- Use TypeScript
- Follow React best practices
- Use Tailwind CSS for styling
- Use Zustand for state management

## Coding Style (Strict)

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

### Naming
- Use camelCase for variables, functions, const
- Use PascalCase for components, types, interfaces
- Use SCREAMING_SNAKE_CASE for constants
- Prefix boolean variables with `is`, `has`, `should`, `can`

### Code Organization
- Imports order: external → internal → types → styles
- Export components as named exports
- Use barrel files (`index.ts`) for clean imports
- Keep files under 300 lines

### Error Handling
- Always handle async errors with try/catch
- Display user-friendly error messages
- Log errors for debugging

### Performance
- Lazy load routes with `dynamic()` import
- Use `next/image` for images
- Use `next/font` for fonts
- Avoid `useEffect` for computations - use `useMemo`

### Testing

#### Unit/Component Testing (Vitest)
- Use **Vitest** as the test runner (Next.js recommended)
- Use **@testing-library/react** for component testing
- Use **@testing-library/jest-dom** for DOM assertions
- **NEVER mock data** - use actual API responses and real data
- Test with real server responses using MSW (Mock Service Worker) only for network errors, not happy paths
- Test critical user flows with real data
- Test edge cases with real edge case data
- Use `bun run test` or `bun run test:run` to run tests
- Place tests next to components (e.g., `Button.tsx` and `Button.test.tsx`)
- Use `@testing-library/user-event` for user interactions

#### E2E Testing (Playwright)
- Use **Playwright** for end-to-end testing (official Next.js recommendation)
- Use `@playwright/test` as the test framework
- Place E2E tests in `e2e/` directory
- Use `bun run test:e2e` to run E2E tests
- Use `bun run test:e2e:ui` for interactive test debugging
- Test critical user journeys (login, navigation, voice chat connection)
- Use actual data, not mocked data
- Configure `playwright.config.ts` to start dev server automatically

## Conventions
- Pages in `src/app/`
- Components in `src/components/`
- Hooks in `src/hooks/`
- Utils in `src/lib/`
