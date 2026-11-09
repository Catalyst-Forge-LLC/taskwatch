import { nextSessionLabel, StoreError } from './engine';
import type { Entry } from './timer';

export function recentStarts(entries: Entry[], families: Map<string, string>, query: string, limit = 5) {
  const seen = new Set<string>();
  const options: { id: string; label: string }[] = [];
  const filter = query.trim().toLowerCase();
  const finished = entries.filter(e => e.stoppedAt !== null)
    .sort((a, b) => Date.parse(b.stoppedAt!) - Date.parse(a.stoppedAt!));
  for (const entry of finished) {
    const family = families.get(entry.label) ?? entry.label;
    if (seen.has(family)) continue;
    seen.add(family);
    if (!family.toLowerCase().includes(filter) && !entry.label.toLowerCase().includes(filter)) continue;
    try { options.push({ id: entry.id, label: nextSessionLabel(entry.label, entries) }); }
    catch (e) { if (!(e instanceof StoreError)) throw e; } // This name cannot fit another suffix.
    if (options.length === limit) break;
  }
  return options;
}
