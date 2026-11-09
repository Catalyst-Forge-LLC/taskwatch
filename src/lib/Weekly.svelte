<script lang="ts">
  import { duration, type Entry } from './timer';
  import { weekStart, weeklyGroups } from './sessions';
  let { entries, families, now }: { entries: Entry[]; families: Map<string, string>; now: number } = $props();
  const second = $derived(Math.floor(now / 1000));
  const groups = $derived(weeklyGroups(entries, families, second * 1000));
  const stamp = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
  const shortDate = (value: number) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
</script>
<section aria-label="Weekly task totals">
  <header><span>Week of {shortDate(weekStart(now))} · Monday start</span><strong>{duration(groups.reduce((sum, g) => sum + g.total, 0))} total</strong></header>
  {#each groups as group (group.name)}
    <details><summary><b>{group.name}</b><span>{group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}</span><strong>{duration(group.total)}</strong></summary>
      <ul>{#each group.sessions as item (item.entry.id)}
        <li><b>{item.entry.label}</b><span>{stamp(item.entry.startedAt)} → {item.entry.stoppedAt ? stamp(item.entry.stoppedAt) : item.entry.segments.at(-1)?.stoppedAt ? 'Paused' : 'Running'}</span><strong>{duration(item.contribution)} this week</strong></li>
      {/each}</ul>
    </details>
  {:else}<p>No work recorded this week.</p>{/each}
</section>
<style>
  section{border:1px solid #dce5d6;border-radius:16px;background:white;overflow:hidden;color:#35513b}header,summary{padding:14px 16px;display:flex;align-items:baseline;gap:12px}
  header{background:#f3f6ef;justify-content:space-between;flex-wrap:wrap;color:#526650;font-size:12px}details{border-top:1px solid #e6ece1}
  summary{cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:'▸';color:#64775e}details[open]>summary::before{content:'▾'}
  summary b,li b{overflow-wrap:anywhere}summary span{color:#596c54;font-size:12px}summary strong{margin-left:auto}strong{white-space:nowrap;font-variant-numeric:tabular-nums}
  ul{padding:0 16px 10px 38px;margin:0;list-style:none}li{display:flex;flex-wrap:wrap;align-items:baseline;gap:5px 12px;border-top:1px solid #e6ece1;padding:10px 0;font-size:12px}li span{color:#596c54}p{padding:0 16px}
  @media(max-width:650px){summary{flex-wrap:wrap;gap:5px 8px}summary b{max-width:100%}ul{padding-left:20px}li{display:grid}}
</style>
