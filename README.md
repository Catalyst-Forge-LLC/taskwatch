<p align="center">
  <img src="static/favicon.svg" alt="Taskwatch" width="80" height="80" />
</p>

# Taskwatch

A private task stopwatch. Name what you are working on, pause when you step away, and keep a dated history of the time you spent.

**Live:** [taskwatch.dev](https://taskwatch.dev)

On the public site, history stays in your browser. Taskwatch does not upload it. Export JSON when you want a backup. Import replaces the history in that browser after you confirm. Closing the tab does not stop an unfinished task, so pause or stop before you leave. Clearing site data removes the history.

## Start another session

If you forgot to stop a running or paused timer, choose **Stop at…**, enter the
actual local finish time, and review the working duration before saving. Breaks
do not count, and any intervals after that finish are discarded.

Choose **Start again** beside a finished task to start timing immediately:
`Writing` becomes `Writing #2`, then `Writing #3`. Choosing an older row uses the
highest matching number still in history, across dates. Only a final ` #number`
suffix is treated as a session number. Long names are shortened just enough to
keep the new label within 160 characters. The original session and timestamps
stay intact. Stop the current timer before starting another session.

With the timer idle, focus the task name field to start one of your five most
recent distinct tasks in one click. Type to narrow the choices, or enter a new
name and press Enter as usual. Use Tab or the arrow keys to reach a suggestion.

## Weekly totals

Under History, choose **This week** to see working time grouped by task name,
including numbered repeats and the current timer. The week starts at local
midnight on Monday. Expand a total to see the sessions and timestamps behind it;
for sessions spanning the boundary, only work inside this week counts.

On phones, History shows a card for each session with its name, working time,
and **Start again**. Open **Details** for exact start/stop times and intervals.

## Run it yourself

Requires Node.js 22.17 or newer.

```bash
npm install
npm run dev
```

`npm run dev` stores history in `data/taskwatch.json` on the machine running the app. `npm run dev:browser` stores it in the browser instead. `npm run build` writes the public site to `build/`, and `npm run ship` deploys that site with Wrangler.

## License

[MIT](LICENSE). Copyright © 2026 Catalyst Forge LLC.
