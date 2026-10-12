# Taskwatch

A small, local SvelteKit stopwatch. Name a task, start the clock, pause when you
need to, and stop to save it. Includes a large timer, editable labels, searchable
history, individual work intervals, a daily total, and JSON export.

## Run locally

Requires Node.js 22.17+ (Node 24 recommended) and npm.

```powershell
cd Z:\workspace\taskwatch
npm install
npm run dev
```

Open http://127.0.0.1:5187. Stop the server with Ctrl+C.

For a built version:

```powershell
npm run build
npm start
```

Both modes bind to `127.0.0.1:5187` by default. For the production server,
`HOST` and `PORT` can override these defaults. This is a single-user local app;
it has no authentication and is not intended for public hosting.

## Your data

The server creates **`data/taskwatch.json`** on the first timer action. This file
contains all entries and the active timer; browser storage is not used. Back it
up like any other document. The data directory is excluded from Git.

- Start, pause, resume, stop, rename, and delete save immediately. Successful
  saves replace the file atomically through a temporary file in the same folder.
- Refreshing or closing the browser does not stop the timer. Restarting the
  server also restores it. **Pause or stop before leaving if you don't want that
  time counted.** A paused timer stays paused across restarts.
- Each entry stores a label, UTC ISO start/stop timestamps, elapsed milliseconds,
  and an array of work intervals with their own start/stop timestamps. Pauses are
  excluded from elapsed time. While running, `elapsedMs` reflects completed
  intervals; the open interval is added live from its `startedAt` timestamp.
- Dates and times display in your browser's local timezone. The daily total
  counts work intervals overlapping today, including tasks spanning midnight.
- Multiple tabs refresh every five seconds and reject conflicting changes.
  Run **one server process per data file**. Don't edit the file while the server
  is running. An invalid file produces an error and is never silently reset.
- Export JSON downloads a snapshot, including any active task. Delete requires
  confirmation and only works for stopped tasks. Export first if you need a backup.

To choose another data file, set `TASKWATCH_DATA_FILE` before starting. Relative
paths resolve from the server's working directory; use an absolute path for a
fixed location:

```powershell
$env:TASKWATCH_DATA_FILE = 'Z:\workspace\taskwatch\data\my-time.json'
npm start
```

To restore an export, stop the server, back up the current JSON, then replace it
with the exported file and restart.

## Development

```powershell
npm run check
npm test
npm run build
```

Built with Svelte 5, SvelteKit, TypeScript, and the Node adapter. No external
services, account, database, or remote fonts are needed. This private local app
has no npm publication target. Node adapter configuration follows the
[SvelteKit documentation](https://svelte.dev/docs/kit/adapter-node).
