# FFXIV PvP Map Discord Bot — Design

**Date:** 2026-06-24
**Status:** Approved

## Purpose

A lightweight TypeScript Discord bot that reports the current FFXIV Crystalline
Conflict / Frontline PvP map rotation. Two slash commands:

- `/today` — the map active for the current rotation day.
- `/schedule` — today + the next 7 days, one full unique cycle.

## Rotation Model

Service Engineers changed the rotation to a fixed 8-day cycle (the "After"
column from the source image), in order:

| Index | Map |
|-------|-----|
| 0 | Seal Rock (Seize) |
| 1 | The Fields of Glory (Shatter) |
| 2 | Onsal Hakair (Danshig Naadam) |
| 3 | Worqor Chirteh (Triumph) |
| 4 | Seal Rock (Seize) |
| 5 | The Borderland Ruins (Secure) |
| 6 | Onsal Hakair (Danshig Naadam) |
| 7 | Worqor Chirteh (Triumph) |

The map advances by one index each day, wrapping with modulo 8.

## Date / Reset Logic (core)

The map resets daily at **11:00 EDT / 10:00 EST**, which is a fixed
**15:00 UTC** instant year-round (no DST library needed — the EDT/EST shift and
the 11am/10am shift cancel out).

- A "FFXIV day" begins at 15:00 UTC.
- The current FFXIV day is computed by subtracting 15 hours from `now` and
  taking the resulting UTC calendar date.
- The seed config provides one known `(date, rotation index)` pair. The map for
  any day = `rotation[(seedIndex + daysSince(seedDate)) mod 8]`.

`daysSince` counts whole FFXIV days between the seed's FFXIV day and the target
FFXIV day.

## Components

All rotation/date logic is pure and Discord-free so it can be unit-tested.

- **`src/rotation.ts`** — the `ROTATION` array, and pure functions:
  - `getFfxivDay(now: Date): Date` — the UTC date of the FFXIV day containing `now`.
  - `getMapIndexForDay(ffxivDay: Date): number` — index into `ROTATION`.
  - `getMapForDay(ffxivDay: Date): string` — the map name.
- **`src/config.ts`** — `SEED` (`{ date, index }`) and env-sourced Discord
  credentials (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`).
- **`src/commands/today.ts`** — builds the `/today` reply text.
- **`src/commands/schedule.ts`** — builds the `/schedule` reply text (8 lines).
- **`src/deploy-commands.ts`** — one-off script registering the two guild
  commands. Run manually, not part of the always-on process.
- **`src/index.ts`** — discord.js client; routes interactions to command handlers.
- Supporting: `.env.example`, `package.json`, `tsconfig.json`, `README.md`.

## Command Output

`/today`:
```
Today's PvP map: **The Borderland Ruins (Secure)**
```

`/schedule` (today + next 7 days; weekday names in US Eastern so they align with
when the map "is" that day for the user; first two lines also tagged
Today/Tomorrow):
```
Today (Wed) - The Borderland Ruins (Secure)
Tomorrow (Thu) - Onsal Hakair (Danshig Naadam)
Fri - Worqor Chirteh (Triumph)
Sat - Seal Rock (Seize)
Sun - The Fields of Glory (Shatter)
Mon - Onsal Hakair (Danshig Naadam)
Tue - Worqor Chirteh (Triumph)
Wed - Seal Rock (Seize)
```

## Error Handling

- Missing required env vars → fail fast at startup with a clear message.
- Unknown interaction / command name → ignore safely.
- Command handler errors → reply with a brief error message (ephemeral) rather
  than crashing the process.

## Testing

`node:test` unit tests on the pure functions in `src/rotation.ts`:

- Seed date maps to its declared index.
- Cycle wraps correctly at index 8 → 0.
- The 15:00 UTC boundary: a timestamp at 14:59 UTC is the previous FFXIV day;
  15:00 UTC is the new one.
- `daysSince` across a DST transition still yields the right index (sanity that
  the fixed-UTC approach is DST-immune).

## Deployment (Pella.app)

- **Run mode:** `tsx`, no build step. `package.json` `"start": "tsx src/index.ts"`,
  with `tsx` in `dependencies` so the host installs it.
- The bot stays alive via the discord.js gateway connection — no web server.
- Discord credentials and the seed are set as environment variables in Pella's
  dashboard (and locally via `.env`).
- `deploy-commands.ts` is run once (locally or on first deploy) to register
  the guild slash commands.

## Out of Scope (YAGNI)

- No database / persistence — rotation is computed, not stored.
- No global commands — single guild only.
- No scheduled announcements / cron — purely on-demand command responses.
