# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `tsc -b`
- Clean: `npm run clean`
- Preview: `npm run preview`

## Code Style
- Use ESLint and Prettier for consistent formatting
- Use TypeScript with strict type checking
- Follow functional programming patterns where possible
- Use async/await for asynchronous code (avoid raw promises)
- Prefer named exports over default exports
- Use descriptive variable names in camelCase
- Group imports: built-in modules, external modules, internal modules
- Error handling: use try/catch for async functions, validate inputs
- Components should be small, focused, and reusable
- Follow DRY principles but prioritize readability

## React Best Practices
- Use React hooks for state and side effects
- Apply memoization (useMemo, useCallback, React.memo) for performance optimization
- Use context API with memoized values to prevent unnecessary re-renders
- Implement proper cleanup in useEffect hooks
- Keep components pure and focused on a single responsibility

## Korean Language Support
- Maintain Korean comments and console messages where appropriate
- Handle Korean search queries with proper encoding
- When responding to Korean messages, reply in Korean
- Include Korean variable names and comments in code when appropriate
