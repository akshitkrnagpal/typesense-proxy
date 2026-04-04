# Contributing to tsproxy

Thanks for your interest in contributing! This project is under heavy development and we welcome contributions.

## Development Setup

```bash
# Clone
git clone https://github.com/akshitkrnagpal/tsproxy.git
cd tsproxy

# Install
pnpm install

# Start infrastructure
docker compose up -d

# Seed sample data
pnpm seed

# Start all dev servers
pnpm dev
```

## Project Structure

```
packages/
  cli/      → @tsproxy/cli    (CLI framework)
  api/      → @tsproxy/api    (HonoJS proxy server)
  js/       → @tsproxy/js     (search client adapter)
  web/      → @tsproxy/react  (headless React components)
apps/
  web/      → Next.js demo app
  docs/     → Nextra documentation site
```

## Commands

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages (excludes docs)
pnpm test         # Run all tests
pnpm typecheck    # Type check all packages
pnpm seed         # Seed Typesense with sample data
```

## Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @tsproxy/api test
pnpm --filter @tsproxy/cli test
```

Tests require Docker for Typesense. Start it with `docker compose up -d`.

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm typecheck && pnpm test` to verify
4. Submit a pull request

## Code Style

- TypeScript with strict mode
- ESM modules
- No default exports (except config files and React pages)
- Minimal dependencies

## Adding a New Component to @tsproxy/react

1. Create `packages/web/src/components/YourComponent.tsx`
2. Use the `getOverride` pattern for all sub-elements
3. Export from `packages/web/src/index.ts`
4. Add documentation in `apps/docs/pages/packages/react.mdx`

## Adding a New API Endpoint

1. Create `packages/api/src/routes/your-route.ts`
2. Register in `packages/api/src/index.ts`
3. Add tests in `packages/api/src/__tests__/`
4. Add documentation in `apps/docs/pages/api-reference/`

## Adding a New CLI Command

1. Create `packages/cli/src/commands/your-command.ts`
2. Register in `packages/cli/src/index.ts`
3. Add tests in `packages/cli/src/__tests__/`
4. Update `packages/cli/README.md` and docs

## Releases

Releases are managed via GitHub Actions. To publish a new version:

1. Update `CHANGELOG.md`
2. Go to Actions → Publish → Run workflow → Enter version
3. The workflow bumps versions, builds, publishes to npm, and creates a GitHub Release

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
