export const swissZone = "Europe/Zurich";

const clock = new Intl.DateTimeFormat("fr-CH", {
  timeZone: swissZone, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function wallTime(instant: Date) {
  const parts = Object.fromEntries(clock.formatToParts(instant).map(p => [p.type, p.value]));
  return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute;
}

export function todayInSwitzerland() {
  return wallTime(new Date()).slice(0, 10);
}

// Use the zone's actual offsets on both sides of the date, including DST changes.
export function swissDepartures(date: string, time: string): Date[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return [];
  const local = date + "T" + time;
  const nominal = Date.parse(local + ":00Z");
  if (!Number.isFinite(nominal)) return [];
  const candidates = new Set<number>();
  for (const hours of [-24, 24]) {
    const sample = nominal + hours * 3_600_000;
    const offset = Date.parse(wallTime(new Date(sample)) + ":00Z") - sample;
    const instant = nominal - offset;
    if (wallTime(new Date(instant)) === local) candidates.add(instant);
  }
  return [...candidates].sort((a,b) => a-b).map(value => new Date(value));
}

export function formatSwissDeparture(instant: Date) {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: swissZone, day: "numeric", month: "long", hour: "2-digit",
    minute: "2-digit", timeZoneName: "shortOffset",
  }).format(instant);
}
