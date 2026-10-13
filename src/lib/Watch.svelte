<script lang="ts">
  import { onMount } from 'svelte';
  import { activeEntry, duration, elapsed, todayElapsed, type Action, type WatchState } from '#lib/timer.ts';
  import { browserMode, getStorage } from '#lib/storage/index.ts';
  import { validate, StoreError } from '#lib/engine.ts';
  import type { Storage } from '#lib/storage/types.ts';

  let storage: Storage | undefined;
  let pendingImport = $state<{ name: string; state: WatchState } | null>(null);

  let watch = $state<WatchState>({ version: 1, revision: 0, entries: [] });
  let ready = $state(false);
  let busy = $state(false);
  let message = $state('');
  let label = $state('');
  let search = $state('');
  let now = $state(Date.now());
  let offset = 0;
  let editing = $state<string | null>(null);
  let editLabel = $state('');
  let deleting = $state<string | null>(null);
  const active = $derived(activeEntry(watch));
  const running = $derived(active?.segments.at(-1)?.stoppedAt === null);
  const completed = $derived(watch.entries.filter((entry) => entry.stoppedAt !== null));
  const filtered = $derived(completed.filter((entry) => entry.label.toLowerCase().includes(search.toLowerCase())));
  const totalToday = $derived(todayElapsed(watch.entries, now));

  function apply(payload: { state: WatchState; serverNow: number }, reset = false) {
    if (!reset && payload.state.revision < watch.revision) return;
    const previousId = active?.id;
    watch = payload.state;
    offset = payload.serverNow - Date.now();
    now = Date.now() + offset;
    if (active?.id !== previousId) label = active?.label ?? '';
    ready = true;
  }

  async function refresh(reset = false) {
    try {
      storage ??= await getStorage();
      apply(await storage.read(), reset);
    } catch (error) { message = error instanceof Error ? error.message : 'Could not read your history.'; }
  }

  async function act(action: Action, extra: { label?: string; id?: string; data?: WatchState } = {}) {
    if (busy || (!ready && !(browserMode && action === 'import')) || !storage) return;
    busy = true;
    message = '';
    try {
      const payload = await storage.mutate({ action, revision: watch.revision, ...extra });
      apply(payload);
      editing = null;
      deleting = null;
      pendingImport = null;
    } catch (error) {
      if (error instanceof StoreError && error.status === 409) await refresh(true);
      message = error instanceof Error ? error.message : 'Could not save. Please try again.';
    }
    finally { busy = false; }
  }

  async function exportHistory() {
    try {
      storage ??= await getStorage();
      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([await storage.export()], { type: 'application/json' }));
      link.href = url;
      link.download = 'taskwatch.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { message = error instanceof Error ? error.message : 'Could not export your history.'; }
  }

  async function selectImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Import files must be smaller than 1 MB.');
      const imported = validate(JSON.parse(await file.text()));
      pendingImport = { name: file.name, state: imported };
      message = '';
    } catch (error) { message = error instanceof Error ? `Import failed: ${error.message}` : 'Could not read that file.'; }
  }

  const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = (value: string) => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  onMount(() => {
    let disposed = false;
    let unsubscribe = () => {};
    void refresh().then(() => { if (!disposed && storage) unsubscribe = storage.subscribe(() => { void refresh(true); }); });
    const tick = setInterval(() => { now = Date.now() + offset; }, 200);
    const poll = setInterval(() => { if (!busy) void refresh(); }, 5000);
    const focus = () => { if (!busy) void refresh(); };
    window.addEventListener('focus', focus);
    return () => { disposed = true; unsubscribe(); clearInterval(tick); clearInterval(poll); window.removeEventListener('focus', focus); };
  });
</script>

<svelte:head>
  <title>{active ? `${duration(elapsed(active, now))} · Taskwatch` : 'Taskwatch · Make time visible'}</title>
  <meta name="description" content="A simple local task stopwatch. Track your work, keep your time." />
</svelte:head>

{#snippet icon(kind: string, size = 20)}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {#if kind === 'watch'}<circle cx="12" cy="14" r="8"/><path d="M12 10v4l3 2M9 2h6M12 2v4M19 6l2-2"/>
    {:else if kind === 'play'}<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>
    {:else if kind === 'pause'}<path d="M9 5v14M15 5v14" stroke-width="3"/>
    {:else if kind === 'stop'}<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>
    {:else if kind === 'download'}<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>
    {:else if kind === 'search'}<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>
    {:else if kind === 'edit'}<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>
    {:else if kind === 'trash'}<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>
    {:else if kind === 'arrow'}<path d="M4 12h16m-6-6 6 6-6 6"/>{/if}
  </svg>
{/snippet}

<div class="shell">
  <header>
    <a class="brand" href="/" aria-label="Taskwatch home"><span class="brand-mark">{@render icon('watch', 25)}</span>taskwatch<span class="brand-dot">.</span></a>
    <span class="local"><span></span> {browserMode ? 'In this browser. Just yours.' : 'Local file. Just yours.'}</span>
  </header>

  <main>
    <div class="intro"><div><p class="eyebrow">ONE THING AT A TIME</p><h1>Make time visible.</h1><p class="subheading">A little focus. A clear record of your day.</p></div><div class="today"><span>TRACKED TODAY</span><strong>{duration(totalToday)}</strong></div></div>

    {#if message}
      <div class="error" role="alert"><span>{message}</span><button onclick={() => { message = ''; void refresh(true); }}>Retry</button></div>
    {/if}

    <section class="timer-card" aria-label="Task stopwatch">
      <div class="timer-top"><span class:running class:paused={active && !running} class="status"><span></span>{!ready ? 'CONNECTING' : running ? 'IN PROGRESS' : active ? 'PAUSED' : 'READY WHEN YOU ARE'}</span><span class="autosave">{busy ? 'Saving…' : 'Changes save automatically'}</span></div>
      <form class="label-form" onsubmit={(event) => { event.preventDefault(); if (active) void act('rename', { id: active.id, label }); else void act('start', { label }); }}>
        <label for="task-label">{active ? 'CURRENT TASK' : 'WHAT ARE YOU WORKING ON?'}</label>
        <div class="label-row"><input id="task-label" bind:value={label} maxlength="160" placeholder="Give your task a name…" autocomplete="off" disabled={busy || !ready} />{#if active && label.trim() !== active.label}<button class="small-button" disabled={busy || !label.trim()} type="submit">Save label</button>{/if}</div>
      </form>
      <div class="digits" class:muted={active && !running} role="timer" aria-label="Elapsed working time">{active ? duration(elapsed(active, now)) : '00:00:00'}</div>
      <div class="digit-labels" aria-hidden="true"><span>HOURS</span><span>MINUTES</span><span>SECONDS</span></div>
      <div class="controls">
        {#if !active}
          <button class="primary" onclick={() => act('start', { label })} disabled={busy || !ready || !label.trim()}>{@render icon('play')} Start stopwatch</button>
        {:else}
          <button class="primary" onclick={() => act(running ? 'pause' : 'resume')} disabled={busy}>{@render icon(running ? 'pause' : 'play')} {running ? 'Pause' : 'Resume'}</button>
          <button class="secondary" onclick={() => act('stop')} disabled={busy}>{@render icon('stop')} Stop & save</button>
        {/if}
      </div>
      <div class="timer-bottom">{#if active}<span>Started <strong>{date(active.startedAt)} at {time(active.startedAt)}</strong></span><span>{running ? 'Pause before leaving to stop counting time.' : 'Take a breath. Paused time is excluded.'}</span>{:else}<span>Start a task. Find your flow.</span><span>{browserMode ? 'Saved in this browser. Export for a backup.' : 'Your history stays in your local JSON file.'}</span>{/if}</div>
    </section>

    <section class="history" aria-label="Task history">
      <div class="history-heading"><div><h2>Your time, accounted for. <span class="count">{completed.length}</span></h2><p>Finished tasks, from most recent to oldest.</p></div><div class="history-tools"><label class="export import-button">Import JSON<input type="file" accept=".json,application/json" onchange={selectImport} disabled={busy || (!ready && !browserMode)}/></label><button class="export" onclick={exportHistory} disabled={busy}>{@render icon('download', 17)} Export JSON</button></div></div>
      {#if pendingImport}
        <div class="import-preview" role="region" aria-label="Confirm history import">
          <h3>Replace your history?</h3>
          <p><strong>{pendingImport.name}</strong> contains {pendingImport.state.entries.length} tasks{activeEntry(pendingImport.state) ? ', including an unfinished timer' : ''}. This replaces all {watch.entries.length} current tasks{active ? ' and your current timer' : ''}.</p>
          <p>Running timers continue from their saved start time. Export your current history first if you want to keep it.</p>
          {#if !ready}<p>The saved history could not be read. Replacing it will discard the unreadable data.</p>{/if}
          <div><button class="small-button" onclick={exportHistory} disabled={busy}>Export current history</button><button class="small-button" onclick={() => act('import', { data: $state.snapshot(pendingImport!.state) })} disabled={busy}>Replace history</button><button class="text-button" onclick={() => { pendingImport = null; }}>Cancel</button></div>
        </div>
      {/if}
      {#if completed.length > 0}
        <div class="search">{@render icon('search', 17)}<input aria-label="Search task history" placeholder="Find a task…" bind:value={search}/></div>
        <div class="table-wrap"><table><thead><tr><th>Task</th><th>Date & start</th><th>Stopped</th><th class="elapsed-col">Elapsed</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
          {#each filtered as entry (entry.id)}
            <tr><td class="task-cell">
              {#if editing === entry.id}<form class="edit-form" onsubmit={(event) => { event.preventDefault(); void act('rename', { id: entry.id, label: editLabel }); }}><input aria-label="New task label" bind:value={editLabel} maxlength="160"/><button class="small-button" disabled={busy || !editLabel.trim()}>Save</button><button class="text-button" type="button" onclick={() => { editing = null; }}>Cancel</button></form>
              {:else}<strong>{entry.label}</strong><details><summary>{entry.segments.length} work {entry.segments.length === 1 ? 'interval' : 'intervals'}</summary>{#each entry.segments as segment}<p>{date(segment.startedAt)} · {time(segment.startedAt)} → {date(segment.stoppedAt!)} · {time(segment.stoppedAt!)}</p>{/each}</details>{/if}
            </td><td><span>{date(entry.startedAt)}</span><small>{time(entry.startedAt)}</small></td><td><span>{date(entry.stoppedAt!)}</span><small>{time(entry.stoppedAt!)}</small></td><td class="elapsed-col"><span class="duration">{duration(entry.elapsedMs)}</span></td><td class="row-actions">
              {#if deleting === entry.id}<div class="delete-confirm"><span>Delete this task?</span><button class="danger" disabled={busy} onclick={() => act('delete', { id: entry.id })}>Delete</button><button class="text-button" onclick={() => { deleting = null; }}>Cancel</button></div>
              {:else}<button class="icon-button" aria-label={`Rename ${entry.label}`} title="Rename task" disabled={busy} onclick={() => { editing = entry.id; editLabel = entry.label; deleting = null; }}>{@render icon('edit', 16)}</button><button class="icon-button" aria-label={`Delete ${entry.label}`} title="Delete task" disabled={busy} onclick={() => { deleting = entry.id; editing = null; }}>{@render icon('trash', 16)}</button>{/if}
            </td></tr>
          {/each}
        </tbody></table>{#if !filtered.length}<p class="no-results">No tasks match “{search}”.</p>{/if}</div>
      {:else}
        <div class="empty"><div class="empty-icon">{@render icon('watch', 28)}</div><h3>A fresh start.</h3><p>Your finished tasks will appear here.<br/>Give your first task a name and start the clock.</p></div>
      {/if}
    </section>
    <footer><span>Small tool. More intentional days. <a href="/privacy">Privacy & storage</a></span><span>Times shown in {ready ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'your local timezone'}.</span></footer>
  </main>
</div>

<style>
  .history-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.history-tools button{background:transparent;font:inherit;font-size:11px}.import-button{position:relative;cursor:pointer;overflow:hidden}.import-button:focus-within{outline:3px solid #669779;outline-offset:3px}.import-button input{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}.import-preview{background:#eef4e7;border:1px solid #cbd9bd;padding:20px;border-radius:12px;margin-top:20px}.import-preview h3{margin:0 0 10px;font-size:16px}.import-preview p{font-size:12px;line-height:1.7;overflow-wrap:anywhere}.import-preview>div{display:flex;gap:8px;flex-wrap:wrap}footer a{text-decoration:underline;margin-left:10px}
  :global(*){box-sizing:border-box} :global(body){margin:0;background:#f6f7f3;color:#24362c;font-family:Inter,'Segoe UI',sans-serif;font-size:14px;-webkit-font-smoothing:antialiased} :global(button),:global(input){font:inherit} :global(button),:global(a){-webkit-tap-highlight-color:transparent} :global(button){cursor:pointer} :global(button:disabled){cursor:not-allowed;opacity:.45} :global(button:focus-visible),:global(a:focus-visible),:global(summary:focus-visible){outline:3px solid #669779;outline-offset:4px} :global(input:focus-visible){outline:none;border-color:#437d5d;box-shadow:0 2px 0 #437d5d} :global(a){color:inherit;text-decoration:none}
  .shell{max-width:1140px;margin:auto;padding:0 46px} header{height:108px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dfe4da}.brand{display:flex;align-items:center;font-weight:750;font-size:26px;letter-spacing:-1px}.brand-mark{display:grid;place-items:center;width:43px;height:43px;background:#245b44;color:#d8edbd;border-radius:13px;margin-right:11px}.brand-dot{color:#67913e}.local{display:flex;align-items:center;gap:8px;color:#61705e;font-size:12px}.local>span{width:7px;height:7px;background:#638747;border-radius:50%}
  main{padding-top:43px}.intro{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.eyebrow{font-size:10px;font-weight:750;letter-spacing:2.2px;color:#768370;margin:0 0 12px}h1{font-size:38px;letter-spacing:-1.6px;margin:0 0 9px;font-weight:600}.subheading{color:#7a8376;margin:0;font-size:14px}.today{text-align:right;padding-left:20px}.today>span{display:block;font-size:9px;letter-spacing:1.5px;color:#7a8376;font-weight:700}.today strong{display:block;font:500 27px 'Cascadia Code',Consolas,monospace;letter-spacing:-1px;margin-top:9px}
  .timer-card{background:#fff;border:1px solid #dce3d6;border-radius:20px;box-shadow:0 5px 22px #283b2010;overflow:hidden}.timer-top{display:flex;align-items:center;justify-content:space-between;padding:23px 28px}.status{display:flex;align-items:center;gap:7px;color:#7d8975;font-size:9px;font-weight:750;letter-spacing:1.5px}.status>span{width:6px;height:6px;background:currentColor;border-radius:50%}.status.running{color:#2f784c}.status.paused{color:#b08029}.autosave{font-size:11px;color:#8b9485}.label-form{max-width:560px;padding:21px 22px 0;margin:0 auto;text-align:center}.label-form label{font-size:9px;font-weight:650;letter-spacing:1.8px;color:#86917d}.label-row{display:flex;align-items:center;gap:9px}.label-row input{width:100%;text-align:center;border:0;border-bottom:1px solid transparent;border-radius:0;color:#314936;background:transparent;font-weight:500;font-size:23px;padding:13px 0 6px;min-width:0}.label-row input::placeholder{color:#a6ada0;font-weight:400}.small-button{border:1px solid #d8e2d3;background:#f1f6ed;color:#36573d;padding:7px 11px;border-radius:6px;font-size:11px;white-space:nowrap}
  .digits{font-family:'Cascadia Code','SFMono-Regular',Consolas,monospace;font-size:clamp(52px,9.4vw,110px);font-weight:400;letter-spacing:-6px;text-align:center;font-variant-numeric:tabular-nums;margin:22px 20px 0;line-height:1.25;color:#244f39}.digits.muted{color:#8c987d}.digit-labels{display:flex;justify-content:center;gap:0;max-width:560px;margin:2px auto 29px;color:#939d8c;font-size:8px;font-weight:650;letter-spacing:2px}.digit-labels span{width:33.333%;text-align:center}.controls{display:flex;justify-content:center;gap:12px;padding:0 20px 37px}.primary,.secondary{border-radius:9px;min-width:175px;height:48px;display:flex;align-items:center;justify-content:center;gap:9px;font-size:13px;font-weight:600}.primary{border:1px solid #245a41;background:#245a41;color:white;box-shadow:0 3px 4px #254c3715}.primary:hover:not(:disabled){background:#19452f}.secondary{border:1px solid #dde3d6;background:#f9faf6;color:#56634e}.secondary:hover:not(:disabled){background:#edf2e7}.timer-bottom{background:#fafbf7;border-top:1px solid #edf0e7;display:flex;justify-content:space-between;gap:12px;padding:17px 28px;color:#8b9483;font-size:11px}.timer-bottom strong{font-weight:500;color:#627257}
  .history{margin-top:42px}.history-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}.history-heading h2{font-size:19px;font-weight:600;letter-spacing:-.5px;margin:0;display:flex;align-items:center;gap:10px}.count{background:#e7ecdf;color:#6c7b5d;border-radius:5px;font-size:10px;font-weight:600;padding:4px 7px;letter-spacing:0}.history-heading p{font-size:12px;color:#89917f;margin:8px 0 0}.export{display:flex;align-items:center;gap:8px;border:1px solid #dbe1d2;border-radius:7px;padding:10px 13px;font-size:11px;white-space:nowrap}.export:hover{background:#edf1e7}.empty{border:1px dashed #d7dfce;border-radius:13px;text-align:center;margin-top:23px;padding:34px 20px;background:#f9faf6}.empty-icon{width:52px;height:52px;background:#ebf0e4;border-radius:15px;color:#859873;display:grid;place-items:center;margin:0 auto 14px}.empty h3{font-size:15px;font-weight:550;margin:0 0 8px}.empty p{font-size:12px;line-height:1.8;color:#89937e;margin:0}
  .search{display:flex;align-items:center;gap:8px;color:#8b9781;margin:23px 0 14px}.search input{border:0;border-bottom:1px solid #dce3d3;background:transparent;padding:8px 0;width:220px;color:#3f5135;font-size:12px}.table-wrap{overflow-x:auto;border:1px solid #dfe5d7;border-radius:11px;background:#fff}table{border-collapse:collapse;width:100%;text-align:left}th{background:#f0f3eb;color:#849276;text-transform:uppercase;font-size:8px;letter-spacing:1.2px;padding:13px 17px;font-weight:650}td{padding:18px 17px;border-top:1px solid #edf0e7;font-size:11px;vertical-align:top;white-space:nowrap}td.task-cell{min-width:200px;max-width:350px;white-space:normal}td strong{font-weight:550;font-size:13px;overflow-wrap:anywhere}td small{display:block;margin-top:6px;color:#89977c;font-size:10px;font-variant-numeric:tabular-nums}.elapsed-col{text-align:right}.duration{font-family:Consolas,monospace;font-size:15px;color:#365b3c}.row-actions{text-align:right;max-width:200px}.icon-button{border:0;background:transparent;color:#8b987f;padding:2px 6px}.icon-button:hover{color:#29583d}details{margin-top:7px;color:#8a967e;font-size:10px}summary{cursor:pointer}details p{font-size:10px;line-height:1.8;margin:6px 0;overflow-wrap:anywhere}.edit-form{display:flex;flex-wrap:wrap;gap:5px}.edit-form input{border:1px solid #cbd9bf;border-radius:4px;min-width:0;width:100%;padding:7px;color:#304d33}.text-button{border:0;background:transparent;color:#76856a;font-size:11px;padding:6px}.delete-confirm{display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:flex-end}.delete-confirm span{width:100%;font-size:10px}.danger{background:#fff0ec;color:#9e463c;border:1px solid #efc4bc;border-radius:5px;font-size:10px;padding:5px 8px}.no-results{padding:15px;text-align:center;color:#78826e;font-size:12px}.error{background:#fff0eb;color:#8a4b3c;border:1px solid #eacabc;border-radius:10px;padding:15px 18px;margin-bottom:18px;display:flex;align-items:center;gap:15px;justify-content:space-between;font-size:12px}.error button{background:transparent;color:inherit;border:1px solid #c89181;border-radius:5px;padding:6px 9px;white-space:nowrap}footer{display:flex;justify-content:space-between;gap:15px;padding:25px 0 30px;font-size:10px;color:#929c87}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @media(min-width:1100px){.digits{font-size:110px}}@media(max-width:650px){.shell{padding:0 20px}header{height:81px}.brand{font-size:23px}.local{font-size:10px}main{padding-top:30px}.intro{align-items:flex-start}h1{font-size:29px}.subheading{max-width:210px;line-height:1.5;font-size:12px}.today strong{font-size:19px}.today>span{font-size:8px;letter-spacing:.7px}.eyebrow{font-size:8px}.timer-top{padding:19px 19px}.autosave{font-size:9px}.status{font-size:8px;letter-spacing:.8px}.label-form{padding-top:18px}.label-row input{font-size:19px}.digits{letter-spacing:-3px;margin-top:26px;font-size:clamp(44px,11vw,72px)}.digit-labels{width:82%;margin-bottom:27px;font-size:7px;letter-spacing:1px}.controls{padding-bottom:29px;gap:9px}.primary,.secondary{min-width:0;padding:0 19px;font-size:12px;height:46px}.timer-bottom{flex-direction:column;align-items:center;padding:15px;font-size:10px}.history-heading{align-items:flex-start}.history-heading h2{font-size:16px;max-width:205px;line-height:1.4}.history-heading p{font-size:10px;max-width:200px;line-height:1.6}.export{font-size:10px;padding:8px;gap:5px}.history{margin-top:32px}footer{flex-direction:column;gap:8px;text-align:center}.error{align-items:flex-start;flex-direction:column}th,td{padding:13px 12px}}
</style>
