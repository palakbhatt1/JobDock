# Extension Build Spec

## manifest.json (starting point)

```json
{
  "manifest_version": 3,
  "name": "Outreach Tracker",
  "version": "0.1.0",
  "description": "Track cold outreach and direct-email job applications outside the usual platforms.",
  "action": {
    "default_title": "Outreach Tracker"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "permissions": ["storage", "alarms", "sidePanel"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "https://mail.google.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/in/*"],
      "js": ["content-scripts/linkedin.js"]
    },
    {
      "matches": ["https://mail.google.com/*"],
      "js": ["content-scripts/gmail.js"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Content Script Behavior (linkedin.js)
- Inject a small floating "Capture Contact" button on profile pages (`linkedin.com/in/*`).
- On click: best-effort extract name and headline text from visible DOM (no scraping of hidden/authenticated data beyond what's rendered), send via `chrome.runtime.sendMessage` to the service worker with `{ name, role, sourceUrl }`.
- Never run automatically on page load beyond injecting the button — no background scraping.

## Content Script Behavior (gmail.js)
- Inject a "Capture Contact" button near the subject line of an open email thread.
- Extract sender email + subject as best-effort context.
- Same message-passing pattern to the service worker.

## Service Worker Responsibilities
- Listen for `CAPTURE_CONTACT` messages → write new contact to storage via `lib/storage.js`.
- Register a daily `chrome.alarms` job (`chrome.alarms.create('dailyFollowUpCheck', { periodInMinutes: 1440 })`).
- On alarm: load all contacts with status `sent`, run each through `lib/langgraph-agent.js`, update statuses, store any generated drafts.
- Expose a message handler for the side panel to request "draft follow-up now" on demand (calls `lib/llm-client.js`).

## Side Panel UI (MVP scope — keep it minimal)
- List view grouped by status: **Follow-up due**, **Sent (waiting)**, **Replied**, **Closed**, **Dropped**.
- Each row: name, company, role, days since last action, quick actions (Mark Replied / Log Follow-Up Sent / View Draft / Dismiss).
- A settings screen: LLM provider selector, API key input (masked, stored locally), follow-up interval, max follow-ups.
- No charts/analytics for v1 — resist scope creep here.

## lib/llm-client.js Contract
```js
async function generateFollowUpDraft({ name, role, company, followUpCount, jobTitleApplied, apiKey, provider }) {
  // constructs prompt (see 03-langgraph-agent.md template)
  // calls provider's REST API directly (fetch), no LangChain JS dependency required for MVP
  // returns { draftText }
}
```
Keep this provider-agnostic with a small switch on `provider` so adding a new LLM is a single function, not a rewrite.

## Testing Locally
1. `chrome://extensions` → enable Developer Mode → "Load unpacked" → select project folder.
2. Reload the extension after each change to `manifest.json` or the service worker.
3. Use `chrome.alarms` debug trigger (temporarily set `periodInMinutes: 1` during dev) to test the follow-up check without waiting a day.

## Firefox Port Notes (for AMO submission later)
- Manifest V3 mostly compatible; replace `chrome.*` calls with the `browser.*` namespace or use the `webextension-polyfill` package to support both with one codebase.
- Firefox's `sidebar_action` API differs slightly from Chrome's `side_panel` — may need a small UI shim.
