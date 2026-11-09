<script lang="ts">
  import type { Entry } from './timer';
  import { timeRange, workingTime } from './display';
  import { weekStart, weeklyGroups } from './sessions';
  let { entries, families, now }: { entries: Entry[]; families: Map<string, string>; now: number } = $props();
  const second = $derived(Math.floor(now / 1000));
  const groups = $derived(weeklyGroups(entries, families, second * 1000));
  const total = $derived(groups.reduce((sum, group) => sum + group.total, 0));
  const start = $derived(weekStart(now));
  const range = $derived.by(() => {
    const first = new Date(start), last = new Date(start);
    last.setDate(first.getDate() + 6);
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).formatRange(first, last);
  });
</script>
<section aria-label="Weekly task totals">
  <header><div><span>This week</span><h3>{range}</h3></div><div class="total"><span>Total work</span><strong>{workingTime(total)}</strong></div></header>
  {#each groups as group (group.name)}
    <details><summary>
      <div class="family"><b>{group.name}</b><span>{group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}</span></div>
      <strong>{workingTime(group.total)}</strong>
    </summary>
      <ul>{#each group.sessions as item (item.entry.id)}
        <li><b>{item.entry.label}</b><span>{timeRange(item.entry.startedAt, item.entry.stoppedAt)}{#if !item.entry.stoppedAt} · {item.entry.segments.at(-1)?.stoppedAt ? 'Paused' : 'Running'}{/if}</span><strong>{workingTime(item.contribution)} this week</strong></li>
      {/each}</ul>
    </details>
  {:else}<p>No work recorded this week.</p>{/each}
</section>
<style>
  section{border:1px solid #d6e1cf;border-radius:16px;background:white;color:#304d36}
  header{padding:17px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 20px;background:#edf3e8;border-radius:15px 15px 0 0}
  header span,.family span,li span{color:#54684e;font-size:12px}header span{display:block;margin-bottom:3px}
  h3{margin:0;font-size:16px;font-weight:600}.total{text-align:right}.total strong{font-size:21px}
  details{border-top:1px solid #e2e9dc}summary{display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 20px;list-style:none;cursor:pointer}
  summary::-webkit-details-marker{display:none}summary:before{content:'';width:7px;height:7px;border:solid #5c7355;border-width:0 1.5px 1.5px 0;transform:rotate(-45deg)}details[open]>summary:before{transform:rotate(45deg)}
  summary:hover{background:#f7f9f4}details:last-child:not([open]) summary{border-radius:0 0 15px 15px}
  .family{display:grid;gap:3px}b{overflow-wrap:anywhere}strong{font-variant-numeric:tabular-nums}summary strong{font-size:15px;text-align:right}
  ul{list-style:none;margin:0;padding:0 20px 10px 44px}li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;border-top:1px solid #e7ede2;padding:10px 0;font-size:13px}
  li span{grid-column:1;line-height:1.65}li strong{grid-column:2;grid-row:1 / 3;align-self:center;font-size:12px}p{padding:0 20px}
  @media(max-width:520px){header,summary{padding:14px}.total strong{font-size:18px}ul{padding:0 14px 8px 36px}li{grid-template-columns:1fr}li strong{grid-column:1;grid-row:auto}}
</style>
