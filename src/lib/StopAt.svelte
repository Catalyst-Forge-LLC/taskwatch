<script lang="ts">
  import { finishAt } from './engine';
  import { duration, type Entry } from './timer';

  let { entry, now, busy, onfinish }: {
    entry: Entry; now: number; busy: boolean; onfinish: (stamp: string) => Promise<string | undefined>
  } = $props();
  let dialog: HTMLDialogElement;
  let value = $state('');
  let initial = $state({ ms: 0, local: '' });
  let failure = $state('');
  function localTime(ms: number) {
    const d = new Date(ms);
    return new Date(ms - d.getTimezoneOffset() * 60_000).toISOString().slice(0, -1).replace(/\.000$/, '');
  }
  const preview = $derived.by(() => {
    if (!value) return { error: 'Choose a finish date and time.' };
    // Keep the actual instant for the default, including a repeated DST hour.
    const ms = value === initial.local ? initial.ms : new Date(value).getTime();
    try {
      if (Number.isFinite(ms) && localTime(ms).slice(0, value.length) !== value)
        throw new Error('That time does not exist in your local time zone.');
      const finished = finishAt(entry, ms, now);
      return { total: duration(finished.elapsedMs), stamp: finished.stoppedAt!, error: '' };
    } catch (e) { return { error: e instanceof Error ? e.message : 'Invalid finish time.' }; }
  });
  function show() {
    const paused = entry.segments.at(-1)?.stoppedAt;
    const ms = paused ? Date.parse(paused) : Math.max(Math.floor(now / 1000) * 1000, Date.parse(entry.startedAt));
    initial = { ms, local: localTime(ms) };
    value = initial.local; failure = '';
    dialog.showModal();
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (busy || !preview.stamp) return;
    failure = await onfinish(preview.stamp) ?? '';
  }
</script>
<button type="button" class="trigger" onclick={show} aria-haspopup="dialog" disabled={busy}>Stop at…</button>
<dialog bind:this={dialog} aria-labelledby="finish-title" aria-describedby="finish-help" oncancel={e => { if (busy) e.preventDefault(); }}>
  <form onsubmit={save}>
    <header><h2 id="finish-title">Choose a finish time</h2><p>{entry.label}</p></header>
    <label for="finish-time">Finish time (local)</label>
    <input id="finish-time" type="datetime-local" step="any" bind:value disabled={busy} required
      aria-invalid={!!preview.error} aria-describedby="finish-preview finish-help" oninput={() => failure = ''}/>
    <div id="finish-preview" class:invalid={!!preview.error} aria-live="polite">
      {#if preview.error}{preview.error}{:else}<span>Working time to save</span><strong>{preview.total}</strong>{/if}
    </div>
    <small id="finish-help">Breaks are excluded. Work after the finish time will be removed.</small>
    {#if failure}<p class="invalid" role="alert">{failure}</p>{/if}
    <div class="actions"><button type="button" onclick={() => dialog.close()} disabled={busy}>Cancel</button>
      <button class="save" disabled={busy || !preview.stamp}>Stop at this time</button></div>
  </form>
</dialog>
<style>
  .trigger{appearance:none;border:0;color:#426348;background:transparent;padding:9px 4px;text-decoration:underline;text-underline-offset:3px;font-size:12px;white-space:nowrap}
  dialog{width:min(420px,calc(100% - 32px));max-height:90dvh;overflow:auto;padding:0;border:1px solid #cfdcca;border-radius:18px;color:#2b4634;background:white;box-shadow:0 20px 80px #19392938}
  dialog::backdrop{background:#18352558}form{padding:24px}h2{margin:0;font-size:22px;letter-spacing:-.6px}
  header p{margin:5px 0 20px;color:#576953;overflow-wrap:anywhere}label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
  input{width:100%;min-width:0;border:1px solid #97ab90;border-radius:8px;padding:10px;background:white;color:inherit}
  #finish-preview{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;padding:12px;margin:14px 0 7px;background:#eff5e9;border-radius:8px;font-size:13px}
  #finish-preview strong{font-variant-numeric:tabular-nums;font-size:18px}.invalid,#finish-preview.invalid{color:#873f2a;background:#fff2ed}
  small{display:block;line-height:1.5;color:#536550}.actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:20px}
  .actions button{min-height:44px;border:1px solid #ccd8c5;border-radius:9px;padding:8px 14px;background:white;color:inherit}.actions .save{background:#245b42;color:white;border-color:#245b42}
</style>
