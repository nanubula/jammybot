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
// An "FFXIV day" labeled D runs from D 15:00 UTC to D+1 15:00 UTC (see
// getFfxivDay). The Borderland Ruins rotation began at 2026-06-23 15:00 UTC
// (11:00 EDT) and is the map active through the morning of 2026-06-24 EDT,
// so the anchor day is 2026-06-23, not 2026-06-24.
export const SEED = {
  day: Date.UTC(2026, 5, 23), // 2026-06-23 (UTC midnight of the FFXIV day)
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
