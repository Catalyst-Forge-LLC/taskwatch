<script lang="ts">
  import { tick } from 'svelte';
  import { finishAt } from './engine';
  import { duration, type Entry } from './timer';

  let { entry, now, busy, onfinish }: {
    entry: Entry; now: number; busy: boolean; onfinish: (stamp: string) => void
  } = $props();
  let open = $state(false);
  let value = $state('');
  let input = $state<HTMLInputElement>();
  let trigger = $state<HTMLButtonElement>();
  function localTime(ms: number) {
    const d = new Date(ms);
    return new Date(ms - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
  }
  const preview = $derived.by(() => {
    if (!open) return null;
    const ms = new Date(value).getTime();
    try {
      if (Number.isFinite(ms) && localTime(ms).slice(0, value.length) !== value)
        throw new Error('That time does not exist in your local time zone.');
      const finished = finishAt(entry, ms, now);
      return { total: duration(finished.elapsedMs), stamp: finished.stoppedAt!, error: '' };
    } catch (e) { return { error: e instanceof Error ? e.message : 'Invalid finish time.' }; }
  });
  async function show() {
    const ms = Math.floor(now / 1000) * 1000;
    value = localTime(Math.max(ms, Math.ceil(Date.parse(entry.startedAt) / 1000) * 1000));
    open = true;
    await tick(); input?.focus();
  }
  async function cancel() { open = false; await tick(); trigger?.focus(); }
</script>

{#if open}
  <form aria-label="Correct finish time" onsubmit={e => { e.preventDefault(); if (preview?.stamp && !busy) onfinish(preview.stamp); }}>
    <label>Finish time (local) <input bind:this={input} type="datetime-local" step="1" bind:value disabled={busy} required onkeydown={e => { if (e.key === 'Escape') void cancel(); }} /></label>
    <p aria-live="polite">{preview?.error || 'Working time: ' + preview?.total}</p>
    <small>Breaks are excluded. Work after this time will be removed.</small>
    <div><button class="save" disabled={busy || !preview?.stamp}>Stop at this time</button>
      <button type="button" onclick={cancel} disabled={busy}>Cancel</button></div>
  </form>
{:else}
  <button type="button" class="trigger" bind:this={trigger} onclick={show} disabled={busy}>Stop at…</button>
{/if}
<style>
  .trigger{display:block;margin:12px auto 0;color:#446148;background:transparent;border:0;padding:6px 10px;font-size:13px;text-decoration:underline;text-underline-offset:3px}
  form{max-width:400px;margin:16px auto 0;background:#f5f8f1;border:1px solid #d5e1ce;border-radius:12px;padding:16px;color:#35513b}
  label{display:grid;gap:5px;font-weight:600}input{max-width:100%;min-width:0;border:1px solid #a8b9a1;padding:9px;border-radius:7px;background:white;color:inherit}
  p{margin:10px 0 4px;font-variant-numeric:tabular-nums}small{display:block;line-height:1.5;color:#526650}form div{display:flex;gap:8px;margin-top:12px}
  form button{border:1px solid #ccd8c5;border-radius:8px;background:white;color:inherit;padding:9px 12px}.save{background:#245b42;color:white}
</style>
