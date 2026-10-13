# Taskwatch

A small task stopwatch with labels, pause/resume, dated history, daily totals,
work intervals, and JSON import/export. One timer engine supports two storage modes.
Requires Node.js **22.17+** (24 recommended) and npm. Scripts also work through pnpm.

```powershell
cd Z:\workspace\taskwatch
npm install
```

## Local app: JSON file

```powershell
npm run dev
# Or use the built Node server:
npm run build:node
npm start
```

The local app stays on LocalSlip's `taskwatch` port, currently
**http://127.0.0.1:5211**. It uses `/api/watch` and creates `data/taskwatch.json`
on the first action. That directory is ignored by Git. Node output is **`build-node/`**.
Stop a foreground server with Ctrl+C. Run only one server per data file.

Both dev and Node startup read `localslip get taskwatch`; if unavailable they
warn and use 5211. A busy port fails rather than moving to another port. Production
startup accepts `HOST` and `PORT`. `TASKWATCH_DATA_FILE` selects an alternative
JSON file; relative paths resolve from the working directory. This mode has no
authentication and is intended for loopback use on your own computer.

File writes are serialized, revision-checked, and replace the file atomically
through a temporary file in the same folder. Invalid files are never silently
reset. To restore a corrupt local file, stop the server, back it up, replace it
with a valid export, and restart.

## Public app: browser storage

```powershell
npm run dev:browser
```

This uses the same LocalSlip port; stop file mode first. Alternatively set
`TASKWATCH_STORAGE=browser` before `npm run dev`.

```powershell
npm run build
npm run preview
```

The default build is a prerendered static site in **`build/`**, previewed at
**http://127.0.0.1:5212**. Its separate route tree excludes the API. A post-build
check rejects API references, Node storage code, and private data in public assets.
The two modes keep separate build and intermediate directories.

Browser mode uses `localStorage` key **`taskwatch.v1`**. No task content is sent
to a backend. Web Locks serialize changes across tabs; revisions reject stale
updates; storage events refresh other tabs. Writes require a current browser on
HTTPS or localhost. Unsupported locking, full storage, and blocked storage fail
safely rather than reporting an unsaved action as successful.

- Closing the tab does not stop an active timer. Pause or stop before leaving.
- Clearing site data removes history. Export JSON regularly for a backup.
- Private browsing may discard history when the session ends.
- Browsers, devices, and origins do not share or sync history.
- A workers.dev address and a custom domain have separate storage. Export from
  the old address and import at the new one when moving.
- Corrupt browser history is preserved. Export its raw backup first, then
  explicitly confirm importing a valid replacement if recovery is needed.

The public app includes a privacy page and no third-party scripts, remote fonts,
or analytics beacon. Security headers block external scripts and connections.
Cloudflare still processes normal HTTP request metadata to serve the site.

## Import and export

Both modes use `{ version, revision, entries }`. Each entry has UTC ISO timestamps,
elapsed milliseconds, and individual work intervals. Pauses are excluded. While
running, `elapsedMs` reflects completed intervals; the open interval is added live
from its saved start time. Times display in the browser's timezone. The daily
total counts work overlapping today, including tasks spanning midnight.

**Import JSON** validates files up to 1 MB, previews the count and any unfinished
timer, and requires confirmation before replacing the whole history. Export the
current history first if you need it. Import preserves the destination revision
sequence. It does not merge. A running imported timer resumes its elapsed-time
calculation from its saved timestamp.

## Cloudflare deployment

Public app: **https://taskwatch.dev** (also https://taskwatch.sam-d92.workers.dev). The Worker is deployed to
the account recorded in `wrangler.jsonc`; task history remains in each visitor's browser.

```powershell
npx wrangler login
npx wrangler whoami
npm run ship
```

`ship` builds and checks public assets, then deploys the **`taskwatch`** Worker
using `wrangler.jsonc`. Only **`build/`** is deployed. There is no Worker script,
server-side task API, database, or task-data upload. Static asset requests and
asset storage are free under [Cloudflare's billing rules](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
No paid plan is needed for this app; domain registration is a separate cost.

Verify the authenticated account and check for an existing Worker with that name
before first deploy. Do not overwrite another project. Credentials belong outside
this repository.

### Custom domain

Use an active Cloudflare zone in the deployment account. In the dashboard:
**Workers & Pages → taskwatch → Settings → Domains & Routes → Add → Custom Domain**.
Cloudflare creates DNS and the HTTPS certificate. Keep the domain in
`wrangler.jsonc` so subsequent deployments retain it:

```jsonc
"routes": [{ "pattern": "YOUR-DOMAIN.example", "custom_domain": true }]
```

Replace the example with your chosen hostname. Check what an existing hostname
serves before changing it. [Custom-domain instructions](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## LocalSlip and LocalHelm

The workspace enrolls `taskwatch` in `Z:\workspace\localhelm.fleet.json`. Its
LocalSlip claim uses port **5211**, loopback bind, cwd **`Z:\workspace\taskwatch`**,
and command **`npm run dev`**. LocalHelm's Ports board continues to start local
**file-storage** mode.

```powershell
localslip claim taskwatch --port 5211 --bind 127.0.0.1 --cwd Z:\workspace\taskwatch --command "npm run dev"
cd Z:\workspace
localhelm enroll ./taskwatch --apply
localhelm plugin localslip start taskwatch --apply --no-commit
localhelm plugin localslip stop taskwatch --apply --no-commit
```

Direct equivalents: `localslip start taskwatch` and `localslip stop taskwatch`.
Do not run both storage modes on the same port. LocalHelm **Ship** discovers the
root `ship` command for the public site. The app remains private; npm Publish
must stay skipped. There is no npm package release target.

## Verification

```powershell
npm run check
npm test
npm run build:node
npm run build
npm run cf:types
npx wrangler deploy --dry-run
```

Tests cover file timing and restarts, pauses, midnight overlap, revisions,
corrupt data, browser locking and write failures, and import compatibility.
Public builds never overwrite local data or the `build-node/` server.
