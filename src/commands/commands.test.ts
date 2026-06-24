import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTodayText } from "./today.ts";
import { buildScheduleText } from "./schedule.ts";

// Before the 2026-06-24 15:00 UTC reset we are still in FFXIV day 2026-06-23,
// whose map is The Borderland Ruins (index 5). This is the live scenario the
// rotation seed was originally off-by-one on.
const BEFORE_RESET = new Date(Date.UTC(2026, 5, 24, 8, 0));
// After the reset we roll into FFXIV day 2026-06-24 -> Onsal Hakair (index 6).
const AFTER_RESET = new Date(Date.UTC(2026, 5, 24, 16, 0));

test("today text names the current map (before reset)", () => {
  assert.equal(
    buildTodayText(BEFORE_RESET),
    "Today's PvP map: **The Borderland Ruins (Secure)**",
  );
});

test("today text flips at the 15:00 UTC reset", () => {
  assert.equal(
    buildTodayText(AFTER_RESET),
    "Today's PvP map: **Onsal Hakair (Danshig Naadam)**",
  );
});

test("schedule text has 8 lines, today + next 7 days", () => {
  const lines = buildScheduleText(BEFORE_RESET).split("\n");
  assert.equal(lines.length, 8);
});

test("schedule first two lines are tagged Today/Tomorrow with weekday", () => {
  const lines = buildScheduleText(BEFORE_RESET).split("\n");
  // FFXIV day 2026-06-23 is a Tuesday; the next day Wednesday.
  assert.equal(lines[0], "Today (Tue) - The Borderland Ruins (Secure)");
  assert.equal(lines[1], "Tomorrow (Wed) - Onsal Hakair (Danshig Naadam)");
});

test("schedule later lines are weekday-only", () => {
  const lines = buildScheduleText(BEFORE_RESET).split("\n");
  assert.equal(lines[2], "Thu - Worqor Chirteh (Triumph)");
});
