# Love Test AI Mobile

Expo Router mobile app for Love Test AI.

## Commands

Run commands from the repository root:

```bash
bun install
bun run dev:mobile
bun run dev:mobile:web
bun run typecheck
bun run lint
```

## API Configuration

The mobile app calls the main Love Test AI platform API through `services/aiService.ts`.

Set this when running against a non-production platform:

```bash
EXPO_PUBLIC_LOVETESTAI_API_BASE_URL=http://localhost:3000
```

If unset, the app defaults to `https://lovetestai.com` and falls back to local mock output when platform routes are unavailable.

Or from this app directory:

```bash
bun install
bun run start
bun run start-web
bun run typecheck
bun run lint
```

## Stack

- Expo
- Expo Router
- React Native
- TypeScript
- Bun

## Local Structure

- `app/`: Expo Router screens and layouts.
- `components/`: app-owned UI components.
- `constants/`: app-owned constants pending extraction to `@love-test/config`.
- `context/`: app providers and state.
- `mocks/`: local test and prompt data pending extraction to `@love-test/core`.
- `services/`: mobile runtime service adapters.
