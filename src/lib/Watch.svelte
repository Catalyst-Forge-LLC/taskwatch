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
    <div class="today"><span>Today</span><strong>{duration(totalToday)}</strong></div>
  </header>

  <main>
    <h1 class="sr-only">Task stopwatch</h1>

    {#if message}
      <div class="error" role="alert"><span>{message}</span><button onclick={() => { message = ''; void refresh(true); }}>Retry</button></div>
    {/if}

    <section class="timer-card" aria-label="Task stopwatch">
      <div class="timer-top"><span class:running class:paused={active && !running} class="status" aria-live="polite"><span></span>{busy ? 'Saving' : !ready ? 'Loading' : running ? 'Running' : active ? 'Paused' : 'Ready'}</span></div>
      <form class="label-form" onsubmit={(event) => { event.preventDefault(); if (active) void act('rename', { id: active.id, label }); else void act('start', { label }); }}>
        <label class="sr-only" for="task-label">Task name</label>
        <div class="label-row"><input id="task-label" bind:value={label} maxlength="160" placeholder="What are you working on?" autocomplete="off" disabled={busy || !ready} />{#if active && label.trim() !== active.label}<button class="small-button" disabled={busy || !label.trim()} type="submit">Save</button>{/if}</div>
      </form>
      <div class="digits" class:muted={active && !running} role="timer" aria-label="Elapsed working time">{active ? duration(elapsed(active, now)) : '00:00:00'}</div>
      <div class="controls">
        {#if !active}
          <button class="primary" onclick={() => act('start', { label })} disabled={busy || !ready || !label.trim()}>{@render icon('play', 24)} Start</button>
        {:else}
          <button class="primary" onclick={() => act(running ? 'pause' : 'resume')} disabled={busy}>{@render icon(running ? 'pause' : 'play', 24)} {running ? 'Pause' : 'Resume'}</button>
          <button class="secondary" onclick={() => act('stop')} disabled={busy}>{@render icon('stop', 22)} Stop</button>
        {/if}
      </div>
      <div class="timer-meta">{#if active}<span>Started {time(active.startedAt)} <span class="meta-date">· {date(active.startedAt)}</span></span>{/if}</div>
    </section>

    <section class="history" aria-label="Task history">
      <div class="history-heading"><h2>History <span class="count">{completed.length}</span></h2><div class="history-tools"><label class="export import-button" title="Import JSON">Import<input aria-label="Import JSON" type="file" accept=".json,application/json" onchange={selectImport} disabled={busy || (!ready && !browserMode)}/></label><button class="export" title="Export JSON" onclick={exportHistory} disabled={busy}>{@render icon('download', 17)} Export</button></div></div>
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
        <div class="empty">{@render icon('watch', 22)}<p>No sessions yet.</p></div>
      {/if}
    </section>
    <footer><span>{browserMode ? 'Stored in this browser' : 'Stored in your local JSON file'} <span aria-hidden="true">·</span> <a href="/privacy">Privacy</a></span></footer>
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f5f6f2; color: #243c30; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; }
  :global(button), :global(input) { font: inherit; }
  :global(button), :global(a) { -webkit-tap-highlight-color: transparent; }
  :global(button) { cursor: pointer; }
  :global(button:disabled) { cursor: not-allowed; opacity: .5; }
  :global(button:focus-visible), :global(a:focus-visible), :global(summary:focus-visible) { outline: 3px solid #74a084; outline-offset: 4px; }
  :global(a) { color: inherit; text-decoration: none; }
  :global(button), :global(a), :global(input) { transition: background .18s, color .18s, border-color .18s, box-shadow .18s; }
  .shell { max-width: 1080px; margin: auto; padding: 0 40px; }
  header { height: 104px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .brand { display: flex; align-items: center; font-weight: 720; font-size: 26px; letter-spacing: -1.1px; }
  .brand-mark { display: grid; place-items: center; width: 44px; height: 44px; background: #245b44; color: #d8edbd; border-radius: 14px; margin-right: 12px; box-shadow: 0 3px 8px #21452c10; }
  .brand-dot { color: #699344; }
  .today { display: flex; align-items: center; gap: 12px; color: #778477; }
  .today>span { font-size: 12px; }
  .today strong { color: #36533e; font-size: 18px; font-weight: 550; font-variant-numeric: tabular-nums; letter-spacing: -.4px; }
  main { padding-top: 18px; }
  .timer-card { background: #fff; border: 1px solid #e0e6dc; border-radius: 28px; box-shadow: 0 12px 45px #243c3007, 0 2px 4px #243c3003; padding: 30px 36px 24px; }
  .timer-top { display: flex; justify-content: center; min-height: 26px; }
  .status { display: inline-flex; align-items: center; gap: 7px; color: #6c7d6b; font-size: 12px; font-weight: 500; }
  .status>span { width: 6px; height: 6px; background: #9eab98; border-radius: 50%; }
  .status.running { color: #346849; }
  .status.running>span { background: #558654; box-shadow: 0 0 0 4px #ecf3e6; }
  .status.paused { color: #9a762e; }
  .status.paused>span { background: #c09b52; }
  .label-form { max-width: 500px; margin: 20px auto 0; }
  .label-row { display: flex; align-items: center; gap: 10px; }
  .label-row input { width: 100%; min-width: 0; text-align: center; border: 1px solid transparent; border-bottom-color: #e4e9e0; border-radius: 10px 10px 0 0; color: #314c39; background: transparent; font-size: 23px; font-weight: 450; padding: 13px 16px 15px; }
  .label-row input::placeholder { color: #899789; font-weight: 400; }
  .label-row input:hover:not(:disabled) { background: #f8faf5; }
  .label-row input:focus-visible { outline: 0; border-bottom-color: #4f7d5e; background: #f7f9f3; box-shadow: 0 1px 0 #4f7d5e; }
  .digits { color: #24543c; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(72px, 12vw, 144px); font-weight: 520; font-variant-numeric: tabular-nums; letter-spacing: -.055em; line-height: 1.2; text-align: center; white-space: nowrap; margin: 30px 0 34px; }
  .digits.muted { color: #8c9b83; }
  .controls { display: flex; justify-content: center; gap: 14px; }
  .primary, .secondary { border-radius: 14px; min-width: 196px; height: 62px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; font-size: 17px; font-weight: 600; }
  .primary { border: 1px solid #245b42; background: #245b42; color: #fff; box-shadow: 0 5px 12px #245b4218; }
  .primary:hover:not(:disabled) { background: #17492f; border-color: #17492f; box-shadow: 0 6px 16px #245b4226; }
  .primary:active:not(:disabled), .secondary:active:not(:disabled) { transform: translateY(1px); }
  .primary:disabled { background: #e0e8db; border-color: #e0e8db; color: #73866c; box-shadow: none; opacity: 1; }
  .secondary { border: 1px solid #dce5d6; background: #f4f7ef; color: #3e5c42; }
  .secondary:hover:not(:disabled) { background: #eaf0e3; border-color: #cad9c0; }
  .timer-meta { display: flex; justify-content: center; align-items: end; min-height: 42px; font-size: 11px; color: #83907d; font-variant-numeric: tabular-nums; }
  .meta-date { color: #9aa394; }
  .history { margin-top: 32px; }
  .history-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
  .history-heading h2 { display: flex; align-items: center; gap: 9px; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -.4px; }
  .count { color: #7b8972; background: #e9eee3; border-radius: 7px; min-width: 24px; padding: 3px 7px; font-size: 11px; font-weight: 500; text-align: center; letter-spacing: 0; }
  .history-tools { display: flex; gap: 6px; }
  .export { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 36px; padding: 0 12px; border: 1px solid transparent; border-radius: 8px; color: #64755e; background: transparent; font-size: 12px; white-space: nowrap; }
  .export:hover { background: #eaf0e3; border-color: #e0e7d8; color: #35563e; }
  .import-button { position: relative; cursor: pointer; overflow: hidden; }
  .import-button:focus-within { outline: 3px solid #74a084; outline-offset: 3px; }
  .import-button input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
  .import-preview { background: #eef4e7; border: 1px solid #cbd9bd; padding: 20px; border-radius: 14px; margin: 16px 0; }
  .import-preview h3 { margin: 0 0 10px; font-size: 16px; }
  .import-preview p { font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
  .import-preview>div { display: flex; gap: 8px; flex-wrap: wrap; }
  .small-button { border: 1px solid #d1dec8; background: #eff5e9; color: #36573d; padding: 9px 13px; border-radius: 8px; font-size: 12px; white-space: nowrap; }
  .text-button { border: 0; background: transparent; color: #63745a; font-size: 12px; padding: 8px; }
  .empty { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 30px 20px; border: 1px solid #e1e7da; border-radius: 16px; color: #8a987d; background: #fafbf7; }
  .empty p { margin: 0; color: #7e8c73; font-size: 13px; }
  .search { display: flex; align-items: center; gap: 9px; color: #7e8d73; margin: 0 0 14px; }
  .search input { border: 0; border-bottom: 1px solid #dce4d4; border-radius: 0; background: transparent; padding: 9px 0; width: 220px; color: #3f5135; font-size: 12px; }
  .search input:focus-visible { outline: 0; border-color: #497754; }
  .table-wrap { overflow-x: auto; border: 1px solid #e0e6d9; border-radius: 16px; background: #fff; }
  table { border-collapse: collapse; width: 100%; text-align: left; }
  th { color: #78876c; background: #f5f7f0; font-size: 11px; padding: 15px 18px; font-weight: 500; }
  td { padding: 18px; border-top: 1px solid #edf0e7; font-size: 12px; vertical-align: top; white-space: nowrap; color: #52624a; }
  td.task-cell { min-width: 180px; max-width: 320px; white-space: normal; }
  td strong { color: #2d4733; font-weight: 550; font-size: 14px; overflow-wrap: anywhere; }
  td small { display: block; margin-top: 6px; color: #829174; font-size: 11px; font-variant-numeric: tabular-nums; }
  .elapsed-col { text-align: right; }
  .duration { font-size: 17px; font-weight: 550; font-variant-numeric: tabular-nums; color: #365b3c; }
  .row-actions { text-align: right; max-width: 200px; }
  .icon-button { border: 0; background: transparent; color: #819175; border-radius: 7px; padding: 6px; min-width: 32px; min-height: 32px; }
  .icon-button:hover { color: #29583d; background: #f0f5e9; }
  details { margin-top: 7px; color: #7b8b6e; font-size: 10px; }
  summary { cursor: pointer; }
  details p { font-size: 10px; line-height: 1.8; margin: 6px 0; overflow-wrap: anywhere; }
  .edit-form { display: flex; flex-wrap: wrap; gap: 5px; }
  .edit-form input { border: 1px solid #cbd9bf; border-radius: 6px; min-width: 0; width: 100%; padding: 9px; color: #304d33; }
  .edit-form input:focus-visible { outline: 2px solid #74a084; }
  .delete-confirm { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; justify-content: flex-end; }
  .delete-confirm span { width: 100%; font-size: 11px; }
  .danger { background: #fff0ec; color: #9e463c; border: 1px solid #efc4bc; border-radius: 6px; font-size: 11px; padding: 7px 10px; }
  .no-results { padding: 15px; text-align: center; color: #78826e; font-size: 12px; }
  .error { background: #fff0eb; color: #8a4b3c; border: 1px solid #eacabc; border-radius: 12px; padding: 15px 18px; margin-bottom: 18px; display: flex; align-items: center; gap: 15px; justify-content: space-between; font-size: 12px; }
  .error button { background: transparent; color: inherit; border: 1px solid #c89181; border-radius: 6px; padding: 7px 11px; white-space: nowrap; }
  footer { display: flex; justify-content: center; padding: 23px 0 30px; font-size: 11px; color: #89967f; }
  footer span>span { margin: 0 7px; }
  footer a:hover { color: #3f6345; text-decoration: underline; }
  .sr-only { position: absolute; top: 0; left: 0; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); clip-path: inset(50%); white-space: nowrap; border: 0; }
  @media(max-width: 650px) {
    .shell { padding: 0 18px; }
    header { height: 88px; gap: 12px; }
    .brand { font-size: 23px; }
    .brand-mark { width: 38px; height: 38px; border-radius: 12px; margin-right: 9px; }
    .today { flex-direction: column; align-items: flex-end; gap: 3px; }
    .today>span { font-size: 10px; }
    .today strong { font-size: 16px; }
    main { padding-top: 7px; }
    .timer-card { border-radius: 22px; padding: 25px 18px 19px; }
    .label-form { margin-top: 15px; }
    .label-row input { font-size: 18px; padding: 12px 4px; }
    .digits { font-size: clamp(48px, 16vw, 86px); letter-spacing: -.035em; margin: 32px 0; }
    .controls { gap: 10px; }
    .primary, .secondary { min-width: 0; flex: 1; max-width: 210px; height: 58px; font-size: 16px; border-radius: 12px; gap: 9px; }
    .timer-meta { font-size: 10px; min-height: 36px; }
    .history { margin-top: 27px; }
    .history-heading { gap: 10px; }
    .history-heading h2 { font-size: 17px; }
    .export { padding: 0 9px; }
    .empty { padding: 26px 15px; }
    th, td { padding: 14px; }
    .error { align-items: flex-start; flex-direction: column; }
  }
  @media(prefers-reduced-motion: reduce) { :global(button), :global(a), :global(input) { transition: none; } }
</style>
