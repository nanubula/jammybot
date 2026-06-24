# jammybot

A lightweight Discord bot for the FFXIV PvP map rotation.

## Commands

- `/today` — shows today's PvP map.
- `/schedule` — shows the map for today + the next 7 days.

The map changes daily at 11:00 EDT / 10:00 EST (15:00 UTC).

## Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Discord bot credentials:
   - `DISCORD_TOKEN` — bot token
   - `CLIENT_ID` — application ID
   - `GUILD_ID` — your server ID
3. Register the slash commands (run once):
   ```bash
   npm run deploy
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Updating the rotation

If Square Enix changes the rotation order or it drifts, edit `src/rotation.ts`:
- `ROTATION` — the ordered list of maps.
- `SEED` — a known `{ day, index }` anchor. Default: 2026-06-24 = index 5
  (The Borderland Ruins (Secure)).

## Deploying on Pella.app

- Set `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` as environment variables in the
  Pella dashboard.
- Start command: `npm start` (runs `tsx src/index.ts`, no build step).
- Run `npm run deploy` once to register the slash commands.

## Testing

```bash
npm test
```
