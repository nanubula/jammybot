# FFXIV PvP Map Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A lightweight TypeScript Discord bot with `/today` and `/schedule` slash commands that report the FFXIV PvP map rotation.

**Architecture:** Pure, Discord-free rotation/date logic in `src/rotation.ts` (unit-tested with `node:test`), thin command-text builders, and a discord.js v14 client that routes interactions. The daily reset is a fixed 15:00 UTC instant. Runs via `tsx` (no build step) on Pella.app.

**Tech Stack:** TypeScript, discord.js v14, tsx, Node.js built-in `node:test`.

---

## File Structure

- `package.json` — scripts, deps (`discord.js`, `tsx`, `typescript`, `@types/node`, `dotenv`).
- `tsconfig.json` — TS config for `tsx` / `node:test`.
- `.env.example` — `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`.
- `.gitignore` — `node_modules`, `.env`.
- `src/rotation.ts` — `ROTATION`, `SEED`, pure date/index functions. **No Discord deps.**
- `src/rotation.test.ts` — unit tests for rotation logic.
- `src/config.ts` — env-sourced Discord credentials, fail-fast validation.
- `src/commands/today.ts` — builds `/today` reply text (pure).
- `src/commands/schedule.ts` — builds `/schedule` reply text (pure).
- `src/deploy-commands.ts` — one-off guild command registration.
- `src/index.ts` — discord.js client + interaction router.
- `README.md` — setup, run, deploy instructions.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jammybot",
  "version": "1.0.0",
  "description": "FFXIV PvP map rotation Discord bot",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "deploy": "tsx src/deploy-commands.ts",
    "test": "tsx --test src/**/*.test.ts"
  },
  "dependencies": {
    "discord.js": "^14.16.3",
    "dotenv": "^16.4.5",
    "tsx": "^4.19.2"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.9.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 4: Create `.env.example`**

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: completes, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json .gitignore .env.example package-lock.json
git commit -m "chore: scaffold TypeScript discord bot project"
```

---

## Task 2: Rotation logic (TDD)

**Files:**
- Create: `src/rotation.ts`
- Test: `src/rotation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/rotation.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROTATION, getFfxivDay, getMapIndexForDay, getMapForDay } from "./rotation.ts";

// Seed: 2026-06-24 -> index 5 (The Borderland Ruins (Secure))

test("ROTATION has 8 entries", () => {
  assert.equal(ROTATION.length, 8);
});

test("seed day maps to its declared index/map", () => {
  const seedDay = new Date(Date.UTC(2026, 5, 24)); // 2026-06-24
  assert.equal(getMapIndexForDay(seedDay), 5);
  assert.equal(getMapForDay(seedDay), "The Borderland Ruins (Secure)");
});

test("index advances by one each day", () => {
  const d1 = new Date(Date.UTC(2026, 5, 25));
  const d2 = new Date(Date.UTC(2026, 5, 26));
  assert.equal(getMapIndexForDay(d1), 6);
  assert.equal(getMapIndexForDay(d2), 7);
});

test("cycle wraps from index 7 back to 0", () => {
  const wrapDay = new Date(Date.UTC(2026, 5, 27)); // seed + 3 -> (5+3)%8 = 0
  assert.equal(getMapIndexForDay(wrapDay), 0);
  assert.equal(getMapForDay(wrapDay), "Seal Rock (Seize)");
});

test("days before the seed compute correctly (no negative modulo)", () => {
  const before = new Date(Date.UTC(2026, 5, 23)); // seed - 1 -> 4
  assert.equal(getMapIndexForDay(before), 4);
});

test("getFfxivDay: 14:59 UTC is the previous day", () => {
  const t = new Date(Date.UTC(2026, 5, 24, 14, 59));
  assert.equal(getFfxivDay(t).getTime(), Date.UTC(2026, 5, 23));
});

test("getFfxivDay: 15:00 UTC is the new day", () => {
  const t = new Date(Date.UTC(2026, 5, 24, 15, 0));
  assert.equal(getFfxivDay(t).getTime(), Date.UTC(2026, 5, 24));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./rotation.ts` / exports undefined.

- [ ] **Step 3: Write minimal implementation**

Create `src/rotation.ts`:

```ts
// The 8-day FFXIV PvP map rotation (the "After" order), in cycle order.
export const ROTATION = [
  "Seal Rock (Seize)",
  "The Fields of Glory (Shatter)",
  "Onsal Hakair (Danshig Naadam)",
  "Worqor Chirteh (Triumph)",
  "Seal Rock (Seize)",
  "The Borderland Ruins (Secure)",
  "Onsal Hakair (Danshig Naadam)",
  "Worqor Chirteh (Triumph)",
] as const;

// Known anchor: on this FFXIV day, the map was ROTATION[index].
export const SEED = {
  day: Date.UTC(2026, 5, 24), // 2026-06-24 (UTC midnight of the FFXIV day)
  index: 5, // The Borderland Ruins (Secure)
};

// The daily reset is 11:00 EDT / 10:00 EST = 15:00 UTC year-round.
const RESET_HOUR_UTC = 15;

// Returns UTC-midnight Date of the FFXIV day containing `now`.
export function getFfxivDay(now: Date): Date {
  const shifted = new Date(now.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getMapIndexForDay(ffxivDay: Date): number {
  const daysSince = Math.round((ffxivDay.getTime() - SEED.day) / MS_PER_DAY);
  return (((SEED.index + daysSince) % 8) + 8) % 8;
}

export function getMapForDay(ffxivDay: Date): string {
  return ROTATION[getMapIndexForDay(ffxivDay)];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/rotation.ts src/rotation.test.ts
git commit -m "feat: add FFXIV map rotation logic with 15:00 UTC reset"
```

---

## Task 3: Command text builders (TDD)

**Files:**
- Create: `src/commands/today.ts`, `src/commands/schedule.ts`
- Test: `src/commands/commands.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/commands/commands.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTodayText } from "./today.ts";
import { buildScheduleText } from "./schedule.ts";

// Use a fixed instant after 15:00 UTC on 2026-06-24 -> FFXIV day 2026-06-24 (index 5).
const NOW = new Date(Date.UTC(2026, 5, 24, 16, 0));

test("today text names the current map", () => {
  assert.equal(
    buildTodayText(NOW),
    "Today's PvP map: **The Borderland Ruins (Secure)**",
  );
});

test("schedule text has 8 lines, today + next 7 days", () => {
  const lines = buildScheduleText(NOW).split("\n");
  assert.equal(lines.length, 8);
});

test("schedule first two lines are tagged Today/Tomorrow with weekday", () => {
  const lines = buildScheduleText(NOW).split("\n");
  // 2026-06-24 is a Wednesday; tomorrow Thursday.
  assert.equal(lines[0], "Today (Wed) - The Borderland Ruins (Secure)");
  assert.equal(lines[1], "Tomorrow (Thu) - Onsal Hakair (Danshig Naadam)");
});

test("schedule later lines are weekday-only", () => {
  const lines = buildScheduleText(NOW).split("\n");
  assert.equal(lines[2], "Fri - Worqor Chirteh (Triumph)");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./today.ts` / `./schedule.ts`.

- [ ] **Step 3: Implement `today.ts`**

Create `src/commands/today.ts`:

```ts
import { getFfxivDay, getMapForDay } from "../rotation.ts";

export function buildTodayText(now: Date): string {
  const map = getMapForDay(getFfxivDay(now));
  return `Today's PvP map: **${map}**`;
}
```

- [ ] **Step 4: Implement `schedule.ts`**

Create `src/commands/schedule.ts`:

```ts
import { getFfxivDay, getMapForDay } from "../rotation.ts";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function buildScheduleText(now: Date): string {
  const start = getFfxivDay(now);
  const lines: string[] = [];
  for (let i = 0; i < 8; i++) {
    const day = new Date(start.getTime() + i * MS_PER_DAY);
    const weekday = WEEKDAYS[day.getUTCDay()];
    const map = getMapForDay(day);
    let label: string;
    if (i === 0) label = `Today (${weekday})`;
    else if (i === 1) label = `Tomorrow (${weekday})`;
    else label = weekday;
    lines.push(`${label} - ${map}`);
  }
  return lines.join("\n");
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all command tests green (plus rotation tests still green).

- [ ] **Step 6: Commit**

```bash
git add src/commands/today.ts src/commands/schedule.ts src/commands/commands.test.ts
git commit -m "feat: add /today and /schedule text builders"
```

---

## Task 4: Config (env validation)

**Files:**
- Create: `src/config.ts`

- [ ] **Step 1: Implement `config.ts`**

Create `src/config.ts`:

```ts
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  token: required("DISCORD_TOKEN"),
  clientId: required("CLIENT_ID"),
  guildId: required("GUILD_ID"),
};
```

- [ ] **Step 2: Verify it fails fast without env**

Run: `node --import tsx -e "import('./src/config.ts')"`
Expected: throws "Missing required environment variable: DISCORD_TOKEN" (when no `.env` present).

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat: add env config with fail-fast validation"
```

---

## Task 5: Command deployment script

**Files:**
- Create: `src/deploy-commands.ts`

- [ ] **Step 1: Implement `deploy-commands.ts`**

Create `src/deploy-commands.ts`:

```ts
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "./config.ts";

const commands = [
  new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's FFXIV PvP map"),
  new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Show the FFXIV PvP map rotation for the next 8 days"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.token);

try {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands },
  );
  console.log("Successfully registered guild slash commands.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
```

- [ ] **Step 2: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/deploy-commands.ts
git commit -m "feat: add guild slash command deployment script"
```

---

## Task 6: Bot client + interaction router

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Implement `index.ts`**

Create `src/index.ts`:

```ts
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { config } from "./config.ts";
import { buildTodayText } from "./commands/today.ts";
import { buildScheduleText } from "./commands/schedule.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const now = new Date();
    if (interaction.commandName === "today") {
      await interaction.reply(buildTodayText(now));
    } else if (interaction.commandName === "schedule") {
      await interaction.reply(buildScheduleText(now));
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Something went wrong fetching the map.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(config.token);
```

- [ ] **Step 2: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add discord client and interaction router"
```

---

## Task 7: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

Create `README.md`:

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deploy instructions"
```

---

## Self-Review Notes

- **Spec coverage:** rotation model (Task 2), 15:00 UTC reset (Task 2), seed default (Task 2), `/today` + `/schedule` output with Today/Tomorrow + weekday labels (Task 3), env fail-fast (Task 4), guild command registration (Task 5), client + error handling (Task 6), Pella/tsx deploy + README (Tasks 1, 7), unit tests (Tasks 2-3). All spec sections covered.
- **Type consistency:** `getFfxivDay`, `getMapForDay`, `getMapIndexForDay`, `ROTATION`, `SEED`, `buildTodayText`, `buildScheduleText`, `config` used identically across all tasks.
- **No placeholders:** every code step shows complete code.
- **Note on imports:** `.ts` extensions in imports work under `tsx`; `tsconfig` uses `moduleResolution: "bundler"` to allow them without complaint during `tsc --noEmit`.
