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

## Store Submission

EAS Submit is configured in `eas.json` with two profiles:

- `internal`: uploads Android builds to the Google Play internal track as a draft.
- `production`: uploads Android builds to the production track as a draft and supports iOS submissions through the `com.lovetestai` bundle identifier.

Common commands from this app directory:

```bash
bun run build:android:submit
bun run submit:android:latest
bun run submit:android:production
bun run submit:ios:latest
```

Before Android submissions work, connect a Google Play service account to EAS credentials:

```bash
bunx eas-cli credentials --platform android
```

Before iOS submissions are fully non-interactive, add the App Store Connect app ID (`ascAppId`) to `submit.production.ios` in `eas.json`, or let EAS prompt for it during `bun run submit:ios`.

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
