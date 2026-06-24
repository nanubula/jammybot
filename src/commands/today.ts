import { getFfxivDay, getMapForDay } from "../rotation.ts";

export function buildTodayText(now: Date): string {
  const map = getMapForDay(getFfxivDay(now));
  return `Today's PvP map: **${map}**`;
}
