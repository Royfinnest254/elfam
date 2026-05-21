/** Local-calendar helpers for herd dashboards and withholding checks. */
export function getFarmClock() {
  const now = Date.now();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = yesterday.toISOString().split("T")[0];
  return { now, yesterdayDateStr, yesterday };
}

/** Aggregate milking sessions by date (YYYY-MM-DD). */
export function milkYieldByDate(
  sessions: { date: string; litres: number }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    map[s.date] = (map[s.date] ?? 0) + s.litres;
  }
  return map;
}

/** Build chart rows from yield map, newest `days` included. */
export function yieldChartSeries(
  yieldByDate: Record<string, number>,
  days: number
): { date: string; litres: number }[] {
  return Object.entries(yieldByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, litres]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      litres: Math.round(litres * 10) / 10,
    }))
    .slice(-days);
}
