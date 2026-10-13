---
{
  "app_facts_version": "0.1.0",
  "name": "Taskwatch",
  "version": "0.1.0",
  "type": "web app (SPA) with optional local Node server",
  "status": "active",
  "license": "UNKNOWN",
  "homepage": "https://taskwatch.dev",
  "stack": {
    "language": "TypeScript",
    "runtime": "Browser; Node.js in local file mode",
    "framework": "Svelte 5 + SvelteKit 3",
    "styling": "CSS",
    "storage": "localStorage publicly; JSON file locally",
    "hosting": "Cloudflare Workers Static Assets",
    "build": "Vite",
    "tooltips": "TippyJS"
  },
  "key_dependencies": [
    {
      "name": "svelte",
      "purpose": "Reactive stopwatch interface",
      "registry": "npm"
    },
    {
      "name": "@sveltejs/kit",
      "purpose": "App routing and two build modes",
      "registry": "npm"
    },
    {
      "name": "@sveltejs/adapter-static",
      "purpose": "Public static build",
      "registry": "npm"
    },
    {
      "name": "@sveltejs/adapter-node",
      "purpose": "Optional local file server",
      "registry": "npm"
    },
    {
      "name": "tippy.js",
      "purpose": "Accessible contextual tooltips",
      "registry": "npm"
    }
  ],
  "services": [
    {
      "name": "Cloudflare Workers Static Assets",
      "role": "Static hosting; no task-content storage"
    }
  ],
  "build": {
    "package_manager": "npm",
    "test": "Vitest; browser checks in Codex",
    "deploy": "Wrangler"
  },
  "generated": {
    "date": "2026-10-13",
    "generator": "Codex assistant-authored label"
  },
  "reviewed": {
    "date": "2026-10-13",
    "by": "Codex (assistant), at owner request",
    "status": "publisher-authored"
  },
  "credits": {
    "generated_with": "https://appfacts.dev",
    "built_by": "Catalyst Forge — https://catalystforge.com/"
  }
}
---

# App Facts — Taskwatch

Public browser-only stopwatch with an optional local file-backed Node build.

| Layer | Choice |
|---|---|
| language | TypeScript |
| runtime | Browser; Node.js in local file mode |
| framework | Svelte 5 + SvelteKit 3 |
| styling | CSS |
| storage | localStorage publicly; JSON file locally |
| hosting | Cloudflare Workers Static Assets |
| build | Vite |
| tooltips | TippyJS |

The source license has not been declared. This label is assistant-authored at the owner's request, not an independent review.

[Open AppFacts viewer](https://taskwatch.dev/facts/app) · [Taskwatch](https://taskwatch.dev)
