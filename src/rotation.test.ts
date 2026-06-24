import { test } from "node:test";
import assert from "node:assert/strict";
import { ROTATION, getFfxivDay, getMapIndexForDay, getMapForDay } from "./rotation.ts";

// Seed: 2026-06-23 -> index 5 (The Borderland Ruins (Secure))

test("ROTATION has 8 entries", () => {
  assert.equal(ROTATION.length, 8);
});

test("seed day maps to its declared index/map", () => {
  const seedDay = new Date(Date.UTC(2026, 5, 23)); // 2026-06-23
  assert.equal(getMapIndexForDay(seedDay), 5);
  assert.equal(getMapForDay(seedDay), "The Borderland Ruins (Secure)");
});

test("index advances by one each day", () => {
  const d1 = new Date(Date.UTC(2026, 5, 24));
  const d2 = new Date(Date.UTC(2026, 5, 25));
  assert.equal(getMapIndexForDay(d1), 6);
  assert.equal(getMapIndexForDay(d2), 7);
});

test("cycle wraps from index 7 back to 0", () => {
  const wrapDay = new Date(Date.UTC(2026, 5, 26)); // seed + 3 -> (5+3)%8 = 0
  assert.equal(getMapIndexForDay(wrapDay), 0);
  assert.equal(getMapForDay(wrapDay), "Seal Rock (Seize)");
});

test("days before the seed compute correctly (no negative modulo)", () => {
  const before = new Date(Date.UTC(2026, 5, 22)); // seed - 1 -> 4
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
