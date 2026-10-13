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
    }
  ],
  "basis": {
    "kind": "declaration",
    "summary": "Assistant-authored capability selection based on Taskwatch source, README, 15 passing tests, and exercised browser journeys."
  },
  "declaration": {
    "actor": "Codex (assistant)",
    "source": "Owner request in Taskwatch chat to publish xFacts labels; source review and checks in this workspace.",
    "recorded_at": "2026-10-13T15:45:16.611Z"
  },
  "verification_limits": "This is an attributed standalone declaration, not an independent audit or a complete feature inventory. Tests and documentation are partially assessed; no register-wide coverage or ongoing source-freshness claim is made.",
  "generated": {
    "date": "2026-10-13",
    "generator": "Taskwatch label script",
    "generator_version": "1.0.0",
    "projection_fingerprint": "d5dc4248ea265fef97b731d26b5d847a3b71a3b7da217f11cbf643b4ed60e738"
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

This is an attributed standalone declaration, not an independent audit or a complete feature inventory. Tests and documentation are partially assessed; no register-wide coverage or ongoing source-freshness claim is made.

[Open FeatureFacts viewer](https://taskwatch.dev/facts/features)
