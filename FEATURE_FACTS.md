---
{
  "feature_facts_version": "0.2.0",
  "mode": "standalone",
  "audience": "public",
  "name": "Taskwatch",
  "type": "task stopwatch web app",
  "status": "active",
  "selection_state": "curated",
  "features": [
    {
      "id": "task-stopwatch",
      "name": "Labeled stopwatch with start, pause, resume, and stop",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "dated-history",
      "name": "Dated task history with start and stop timestamps",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "browser-storage",
      "name": "Private browser history with cross-tab coordination",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "local-json",
      "name": "Optional local JSON-file storage",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Local Node.js server"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "json-backups",
      "name": "Validated JSON import and export",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "daily-total",
      "name": "Daily work total with midnight overlap",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "repeat-session",
      "name": "One-click numbered sessions from finished tasks",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "correct-finish",
      "name": "Preview and save an earlier finish time",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "weekly-totals",
      "name": "Weekly working time by task with session details",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "recent-starts",
      "name": "One-click recent tasks from the name field",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    },
    {
      "id": "mobile-history",
      "name": "Phone history cards with timestamps and work intervals",
      "lifecycle": "released",
      "availability": "conditional",
      "conditions": [
        {
          "kind": "other",
          "value": "Current browser; HTTPS or localhost for browser writes"
        }
      ],
      "maturity": "experimental",
      "documentation": "partial",
      "tests": "partial",
      "evidence_state": "declared"
    }
  ],
  "basis": {
    "kind": "declaration",
    "summary": "Assistant-authored capability selection based on Taskwatch source, documentation, and verification of timer behavior."
  },
  "declaration": {
    "actor": "Codex (assistant)",
    "source": "Owner request in Taskwatch chat to publish xFacts labels; source review and checks in this workspace. Numbered sessions added at the owner request on 2026-11-09; shared engine and both storage modes checked.",
    "recorded_at": "2026-11-09T15:03:22+00:00"
  },
  "verification_limits": "This is an attributed standalone declaration, not an independent audit or a complete feature inventory. Tests and documentation are partially assessed; no register-wide coverage or ongoing source-freshness claim is made.",
  "generated": {
    "date": "2026-11-09",
    "generator": "Taskwatch label script",
    "generator_version": "1.0.0",
    "projection_fingerprint": "3ac040d6efbd7d65238347837b5c4723e102581cab2f6cc2f6ac69001c74526c"
  }
}
---

# Feature Facts — Taskwatch

| Capability | Lifecycle | Maturity | Evidence |
|---|---|---|---|
| Labeled stopwatch with start, pause, resume, and stop | released | experimental | declared |
| Dated task history with start and stop timestamps | released | experimental | declared |
| Private browser history with cross-tab coordination | released | experimental | declared |
| Optional local JSON-file storage | released | experimental | declared |
| Validated JSON import and export | released | experimental | declared |
| Daily work total with midnight overlap | released | experimental | declared |
| One-click numbered sessions from finished tasks | released | experimental | declared |
| Preview and save an earlier finish time | released | experimental | declared |
| Weekly working time by task with session details | released | experimental | declared |
| One-click recent tasks from the name field | released | experimental | declared |
| Phone history cards with timestamps and work intervals | released | experimental | declared |

This is an attributed standalone declaration, not an independent audit or a complete feature inventory. Tests and documentation are partially assessed; no register-wide coverage or ongoing source-freshness claim is made.

[Open FeatureFacts viewer](https://taskwatch.dev/facts/features)
