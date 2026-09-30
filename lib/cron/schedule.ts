/** Cron schedule matching in Europe/Prague (UI labels are local CZ time). */

export type PragueTimeParts = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number; // 0=Sun … 6=Sat
};

export function getPragueTimeParts(date: Date = new Date()): PragueTimeParts {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  let hour = parseInt(map.hour || '0', 10);
  if (hour === 24) hour = 0;

  return {
    minute: parseInt(map.minute || '0', 10),
    hour,
    dayOfMonth: parseInt(map.day || '1', 10),
    month: parseInt(map.month || '1', 10),
    dayOfWeek: weekdayMap[map.weekday || ''] ?? date.getUTCDay(),
  };
}

function matchCronPart(part: string, val: number): boolean {
  if (part === '*') return true;

  if (part.includes('/')) {
    const [range, stepStr] = part.split('/');
    const step = parseInt(stepStr, 10);
    if (!Number.isFinite(step) || step <= 0) return false;

    if (range === '*') return val % step === 0;

    if (range.includes('-')) {
      const [startStr, endStr] = range.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (val < start || val > end) return false;
      return (val - start) % step === 0;
    }

    const base = parseInt(range, 10);
    if (!Number.isFinite(base)) return val % step === 0;
    return val >= base && (val - base) % step === 0;
  }

  if (part.includes(',')) {
    return part.split(',').some((p) => matchCronPart(p.trim(), val));
  }

  if (part.includes('-')) {
    const [startStr, endStr] = part.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return val >= start && val <= end;
  }

  return parseInt(part, 10) === val;
}

/** True if 5-field cron expression matches the given instant (Prague local time). */
export function matchesCron(cronExpr: string, date: Date = new Date()): boolean {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) return false;
    const [min, hour, dom, mon, dow] = parts;
    const t = getPragueTimeParts(date);

    return (
      matchCronPart(min, t.minute) &&
      matchCronPart(hour, t.hour) &&
      matchCronPart(dom, t.dayOfMonth) &&
      matchCronPart(mon, t.month) &&
      matchCronPart(dow, t.dayOfWeek)
    );
  } catch {
    return false;
  }
}

/**
 * Avoid double-fires when the worker is polled every minute.
 * 55 min cooldown covers hourly + every-6h + daily presets.
 */
export function wasRunRecently(lastRunAt: string | null | undefined, now: Date = new Date(), cooldownMinutes = 55): boolean {
  if (!lastRunAt) return false;
  const last = new Date(lastRunAt);
  if (Number.isNaN(last.getTime())) return false;
  const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
  return diffMinutes < cooldownMinutes;
}
