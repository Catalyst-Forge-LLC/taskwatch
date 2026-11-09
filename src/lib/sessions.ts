import type { Entry } from './timer';

export const numberedSession = /^([\s\S]*\S) #(\d+)$/;

// Old exports have labels but no family IDs. Match the repeat action's exact,
// case-sensitive suffix rule and recover shortened stems when unambiguous.
export function sessionFamilies(entries: Entry[]): Map<string, string> {
  const labels = [...new Set(entries.map(e => e.label))];
  const parsed = labels.map(label => ({ label, match: label.match(numberedSession) }));
  const bases = new Set(parsed.map(({ label, match }) => match?.[1] ?? label));
  const limits = new Set(parsed.flatMap(({ match }) => match ? [158 - match[2].length] : []));
  const prefixes = new Map<string, string | null>();
  // Visit longer stems first so #10 can resolve through #9 to the original.
  for (const base of [...bases].sort((a, b) => b.length - a.length)) {
    const root = prefixes.get(base) ?? base;
    for (const limit of limits) {
      if (base.length <= limit) continue;
      const prefix = base.slice(0, limit).trimEnd();
      if (!prefixes.has(prefix)) prefixes.set(prefix, root);
      else if (prefixes.get(prefix) !== root) prefixes.set(prefix, null);
    }
  }
  return new Map(parsed.map(({ label, match }) => [label, match ? prefixes.get(match[1]) ?? match[1] : label]));
}

export function weekStart(ms: number): number {
  const start = new Date(ms);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  return start.getTime();
}

type WeekGroup = { name: string; total: number; sessions: { entry: Entry; contribution: number }[] };

export function weeklyGroups(entries: Entry[], families: Map<string, string>, now: number): WeekGroup[] {
  const start = weekStart(now);
  const groups = new Map<string, WeekGroup>();
  for (const entry of entries) {
    const contribution = entry.segments.reduce((sum, s) => sum + Math.max(0,
      Math.min(now, s.stoppedAt ? Date.parse(s.stoppedAt) : now) - Math.max(start, Date.parse(s.startedAt))), 0);
    const started = Date.parse(entry.startedAt);
    if (!contribution && !(started >= start && started <= now)) continue;
    const name = families.get(entry.label) ?? entry.label;
    const group = groups.get(name) ?? { name, total: 0, sessions: [] };
    group.sessions.push({ entry, contribution });
    group.total += contribution;
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
