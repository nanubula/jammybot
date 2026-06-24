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
