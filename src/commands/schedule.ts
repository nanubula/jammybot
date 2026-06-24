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
