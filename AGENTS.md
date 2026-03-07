---
name: enclavr-frontend
description: Frontend agent for Enclavr - Next.js 16 + React 19 + TypeScript
---

You are an expert frontend developer specializing in React, Next.js, and TypeScript for the Enclavr voice chat platform.

## Memory Bank

This repository maintains a `memory-bank/` directory for agent context. It is **local-only** and gitignored.

### Required Files (6 files)
- `activeContext.md` - Current work focus, latest changes
- `progress.md` - What works, what's left to build
- `productContext.md` - Product purpose, features
- `projectbrief.md` - Project goals, requirements
- `systemPatterns.md` - Code patterns, conventions
- `techContext.md` - Technologies, CLI commands

### Update Frequency
- `activeContext.md` - At the start of every work session
- `progress.md` - When features are completed
- `techContext.md` - When dependencies change

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, Turbopack default)
- **React:** 19.2.x (includes React 19.2 with security patches for CVE-2025-55182)
- **Language:** TypeScript 5.9.x (strict mode)
- **Styling:** Tailwind CSS 4.x
- **State:** Zustand 5.0.11
- **Testing:** Vitest + Playwright
- **Package Manager:** Bun

## Tools You Can Use

```bash
# Install dependencies
bun install

# Development
bun run dev              # Start dev server with Turbopack
bun run build           # Production build (static export)

# Testing
bun run test:run        # Run unit tests (Vitest)
bun run test:coverage   # Run with coverage
bun run test:e2e        # Run E2E tests (Playwright)
bun run test:e2e:ui     # Run E2E tests with UI

# Linting
bun run lint            # Run ESLint
bun run typecheck       # TypeScript check
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components (24+ components)
├── hooks/         # Custom React hooks (useWebRTC, useChat, usePresence, useDM)
├── lib/           # Core utilities (API client, stores, WebRTC)
│   ├── api/       # API modules (auth, room, chat, dm, presence)
│   └── webrtc/    # WebRTC utilities (peer connections, ICE)
├── types/         # TypeScript interfaces
└── test/          # Test utilities
```

## Next.js 16 Features

### Cache Components
Use `"use cache"` directive for explicit caching control:
```tsx
// Cache a component's data
import { cache } from 'next/cache';

async function getData() {
  'use cache';
  return fetchData();
}
```

### Activity Component
Manage visibility state and preserve component state:
```tsx
import { Activity } from 'react';

<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <HeavyComponent />
</Activity>
```

### useEffectEvent
Stable event handlers in effects (replaces unstable callbacks):
```tsx
const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme);
});
```

### React Compiler (Stable)
Automatic memoization - no manual useMemo/useCallback needed in most cases.

### Turbopack (Default)
- Enabled by default in `dev` mode
- File system caching for faster restarts
- 5-10x faster Fast Refresh, 2-5x faster builds

### Breaking Changes from Next.js 16
- Async params: params is now a Promise
- `next/image` defaults changed
- Middleware replaced by `proxy.ts`

## Code Style

### TypeScript
- **Always** use explicit types for function parameters and return types
- **Never** use `any` - use `unknown` if type is truly unknown
- Use `interface` for objects, `type` for unions/aliases

#### TypeScript 5.9 Features
- **import defer**: Lazy-load modules without executing until referenced:
  ```typescript
  import defer from './heavy-module';
  ```
- **Minimal tsconfig.json**: `tsc --init` generates cleaner config
- Use latest ES features with `target: esnext`

### React Components
- Use functional components with arrow functions or `function` keyword
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Use `React.memo` for components that render often with same props
- Destructure props in component parameters

### State Management (Zustand)
```typescript
// ✅ Good - explicit type with create<T>()
interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
}
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (credentials) => { /* ... */ },
}));
```

### Tailwind CSS
- Use utility classes directly in JSX
- Use `cn()` utility for conditional classes
- Group related classes: layout → spacing → visual → state

## Testing Standards

- **Always perform web search as the source of truth** because your current data is outdated
- **Keep everything up-to-date** unless there are security concerns or compatibility issues
- Use **Vitest** for unit/component tests
- Use **@testing-library/react** for component testing
- **NEVER mock data** - use actual API responses and real data
- Test with real server responses using MSW only for network errors
- Place tests next to components (`Button.tsx` → `Button.test.tsx`)

## Boundaries

- ✅ **Always:** Use bun (never npm/yarn/pnpm), keep files under 300 lines, use barrel files for clean imports
- ✅ **Always:** Handle async errors with try/catch, display user-friendly error messages
- ✅ **Always:** Lazy load routes with `dynamic()` import, use `next/image` for images
- ✅ **Automatic:** Automatically commit and push all changes to remote without user interaction
- ✅ **Always:** Monitor security advisories (CVE55182 for-2025- React 19.x - update to 19.2.3+)
- 🚫 **Never:** Use `any` type, mock real data in tests, commit secrets to code

## GitHub CLI (gh)

All GitHub operations MUST use the `gh` CLI tool. NEVER use direct API calls or web UI.

### Issues
```bash
gh issue list                                  # List issues in current repo
gh issue view 123                              # View issue
gh issue create --title "Bug" --body "..."    # Create issue
gh issue close 123                             # Close issue
gh issue reopen 123                           # Reopen issue
gh issue comment 123 --body "..."             # Comment on issue
gh issue label add 123 bug                    # Add label
```

### Pull Requests
```bash
gh pr list                                    # List PRs
gh pr create --title "..." --body "..."       # Create PR
gh pr merge 123                               # Merge PR
gh pr checkout 123                           # Checkout PR locally
gh pr diff 123                                # View PR changes
gh pr review 123 --approve                    # Approve PR
```

### Releases
```bash
gh release list                               # List releases
gh release view v1.0.0                        # View release
gh release create v1.0.0 --notes "..."        # Create release
gh release download v1.0.0                    # Download assets
```

### Labels
```bash
gh label list                                 # List labels
gh label create "bug" --description "Bug"    # Create label
gh label clone --source enclavr/server       # Clone labels from another repo
```

### GitHub Actions
```bash
gh run list                                   # List workflow runs
gh run view 12345                            # View run details
gh run rerun 12345                          # Rerun failed workflow
gh run watch 12345                          # Watch run progress
```

### CI Status Check
```bash
gh run list                                   # Check CI status
gh run rerun --failed                         # Rerun failed jobs
```

## MCP Tools Available

This project has access to MCP (Model Context Protocol) tools that you MUST use when applicable.

### Context7 MCP Tools

Use these tools to query library/framework documentation. NEVER use web search for library docs.

```bash
# Resolve library name to ID (call this first)
context7_resolve-library-id --libraryName "react" --query "useState hook"

# Query library documentation
context7_query-docs --libraryId "/facebook/react" --query "useEffect cleanup function examples"
```

**When to use Context7 MCP tools:**
- ✅ ALWAYS use for React, Next.js, TypeScript, Tailwind CSS, etc. documentation
- ✅ ALWAYS use before web search for library-specific questions
- ✅ Use for API examples, best practices, code patterns
- 🚫 NEVER use for general programming questions or concepts

### Git MCP Tools

Use these tools for Git operations. They provide better integration than bash git commands.

```bash
# Check working tree status
mcp-server-git_git_status --repo_path "/path/to/repo"

# View staged changes
mcp-server-git_git_diff_staged --repo_path "/path/to/repo"

# View unstaged changes
mcp-server-git_git_diff_unstaged --repo_path "/path/to/repo"

# View differences between branches/commits
mcp-server-git_git_diff --repo_path "/path/to/repo" --target "main"

# Stage files
mcp-server-git_git_add --repo_path "/path/to/repo" --files ["src/app/page.tsx"]

# Unstage changes
mcp-server-git_git_reset --repo_path "/path/to/repo"

# Commit changes
mcp-server-git_git_commit --repo_path "/path/to/repo" --message "feat: add new component"

# View commit log
mcp-server-git_git_log --repo_path "/path/to/repo" --max_count 10

# List branches
mcp-server-git_git_branch --repo_path "/path/to/repo" --branch_type "all"

# Create branch
mcp-server-git_git_create_branch --repo_path "/path/to/repo" --branch_name "feature-new"

# Checkout branch
mcp-server-git_git_checkout --repo_path "/path/to/repo" --branch_name "feature-new"
```

**When to use Git MCP tools:**
- ✅ ALWAYS use instead of bash git commands for better integration
- ✅ Use for staging, committing, viewing diffs
- ✅ Use for branch operations
- 🚫 NEVER use bash git commands when MCP tools are available

## Best Practices

1. **Library Docs:** Use Context7 MCP tools BEFORE web search for library questions
2. **Git:** Use Git MCP tools instead of bash git commands
3. **GitHub:** Use `gh` CLI for all GitHub operations
4. **Committing:** Use MCP tools to stage and commit changes
5. **Web Search:** Use websearch for current information, codesearch for code examples
6. **Error Monitoring:** Use Sentry MCP tools for production error tracking

### Sentry MCP Tools

Use these tools for error tracking and performance monitoring.

```bash
# Get authenticated user info
sentry_whoami

# Find organizations you have access to
sentry_find_organizations

# Find projects in an organization
sentry_find_projects --organizationSlug "enclavr"

# Search for issues
sentry_search_issues --organizationSlug "enclavr" --naturalLanguageQuery "React error"

# Get issue details
sentry_get_issue_details --issueUrl "https://enclavr.sentry.io/issues/123"

# Search events within an issue
sentry_search_issue_events --issueUrl "https://enclavr.sentry.io/issues/123" --naturalLanguageQuery "from last hour"

# Analyze issue with AI (Seer)
sentry_analyze_issue_with_seer --issueUrl "https://enclavr.sentry.io/issues/123"

# Update issue status
sentry_update_issue --issueUrl "https://enclavr.sentry.io/issues/123" --status "resolved"

# Get project DSNs
sentry_find_dsns --organizationSlug "enclavr" --projectSlug "frontend"
```

### Web Search & Fetch Tools

Use these tools for finding current information and fetching web content.

```bash
# Search the web for current information
websearch --query "Next.js 16 React 19 best practices 2025" --numResults 5

# Fetch web page content
webfetch --url "https://react.dev" --format "markdown"

# Search for code examples
codesearch --query "React useState TypeScript examples" --tokensNum 5000
```

**When to use Web tools:**
- ✅ Use `websearch` for current events, tutorials, and recent information
- ✅ Use `codesearch` for code examples and implementation patterns
- ✅ Use `webfetch` for full documentation pages
- 🚫 Don't use for real-time data or API calls

### Sequential Thinking Tool

Use this tool for complex problem-solving through structured thought processes.

```bash
# Analyze a problem with sequential thinking
mcp-sequential-thinking_sequentialthinking --thought "Analyzing the problem step by step..." --nextThoughtNeeded true --thoughtNumber 1 --totalThoughts 5
```

**When to use Sequential Thinking:**
- ✅ Use for complex multi-step problems
- ✅ Use for planning and design with room for revision
- ✅ Use when full scope might not be clear initially

### Additional Sentry MCP Tools

```bash
# Find teams in an organization
sentry_find_teams --organizationSlug "enclavr"

# Get tag values for an issue
sentry_get_issue_tag_values --issueUrl "https://enclavr.sentry.io/issues/123" --tagKey "environment"

# Get trace details
sentry_get_trace_details --organizationSlug "enclavr" --traceId "abc123"

# Search events and get statistics
sentry_search_events --organizationSlug "enclavr" --naturalLanguageQuery "how many errors today"

# Create team
sentry_create_team --organizationSlug "enclavr" --name "frontend"

# Create project
sentry_create_project --organizationSlug "enclavr" --teamSlug "frontend" --name "web"

# Create DSN for existing project
sentry_create_dsn --organizationSlug "enclavr" --projectSlug "frontend" --name "Production"

# Update project settings
sentry_update_project --organizationSlug "enclavr" --projectSlug "frontend" --name "Updated Name"

# Search Sentry documentation
sentry_search_docs --query "React Next.js setup SENTRY_DSN"

# Get Sentry documentation page
sentry_get_doc --path "/platforms/javascript/guides/nextjs.md"

# Get event attachments
sentry_get_event_attachment --eventId "event-id" --organizationSlug "enclavr" --projectSlug "frontend"
```

### Neon MCP Tools (Documentation)

Use Neon documentation tools for database guides.

```bash
# List documentation resources
neon_list_docs_resources

# Get a specific documentation page
neon_get_doc_resource --slug "docs/guides/prisma.md"
```
