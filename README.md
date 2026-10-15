<p align="center">
  <img src="static/favicon.svg" alt="Taskwatch" width="80" height="80" />
</p>

# Taskwatch

A private task stopwatch. Name what you are working on, pause when you step away, and keep a dated history of the time you spent.

**Live:** [taskwatch.dev](https://taskwatch.dev)

On the public site, history stays in your browser. Taskwatch does not upload it. Export JSON when you want a backup. Import replaces the history in that browser after you confirm. Closing the tab does not stop an unfinished task, so pause or stop before you leave. Clearing site data removes the history.

## Run it yourself

Requires Node.js 22.17 or newer.

```bash
npm install
npm run dev
```

`npm run dev` stores history in `data/taskwatch.json` on the machine running the app. `npm run dev:browser` stores it in the browser instead. `npm run build` writes the public site to `build/`, and `npm run ship` deploys that site with Wrangler.

## License

[MIT](LICENSE). Copyright © 2026 Catalyst Forge LLC.
