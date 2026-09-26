# Architecture

## High-Level Components

```
┌─────────────────────────────────────────────┐
│              Browser Extension               │
│                                               │
│  ┌───────────────┐   ┌───────────────────┐  │
│  │ Content Script │   │  Side Panel / UI   │  │
│  │ (LinkedIn/Gmail│   │  (contact list,    │  │
│  │  page injection│   │   status, actions) │  │
│  │  "Capture" btn)│   │                    │  │
│  └───────┬───────┘   └─────────┬──────────┘  │
│          │                     │              │
│          ▼                     ▼              │
│  ┌─────────────────────────────────────────┐ │
│  │      Background Service Worker           │ │
│  │  - message routing                       │ │
│  │  - scheduling (daily follow-up check)    │ │
│  │  - calls LangGraph agent logic           │ │
│  └───────────────┬───────────────────────────┘ │
│                  ▼                              │
│  ┌─────────────────────────────────────────┐  │
│  │        chrome.storage.local              │  │
│  │  contacts[], settings (API key, prefs)   │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────┬────────────────────────┘
                        │ (only for LLM calls)
                        ▼
              ┌───────────────────┐
              │  LLM Provider API  │
              │ (user's own key)   │
              └───────────────────┘
```

## Manifest V3 Structure

```
outreach-tracker/
├── manifest.json
├── background/
│   └── service-worker.js
├── content-scripts/
│   ├── linkedin.js
│   └── gmail.js
├── sidepanel/
│   ├── index.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── popup/
│   ├── popup.html
│   └── popup.js
├── lib/
│   ├── storage.js        # wraps chrome.storage.local
│   ├── langgraph-agent.js # follow-up state graph logic
│   └── llm-client.js      # calls user's chosen LLM provider
├── icons/
└── README.md
```

## Data Flow
1. User visits a LinkedIn profile or Gmail thread → content script injects a "Capture Contact" button.
2. Click → content script scrapes visible name/role/company (best-effort, no auth bypass) → sends message to service worker.
3. Service worker writes a new contact record to `chrome.storage.local`.
4. User opens side panel → sees contact list grouped by status.
5. User manually logs "sent resume" + selects resume version + channel.
6. Daily alarm (`chrome.alarms`) triggers service worker → runs LangGraph follow-up check against all open contacts → updates status / surfaces suggested follow-ups in the UI (never auto-sends).
7. User clicks "Draft follow-up" → service worker calls LLM via `llm-client.js` using the user's stored API key → draft shown in panel for user to copy/send manually.

## Key Constraints
- **No auto-messaging.** The extension only drafts; the user always sends manually. This avoids ToS violations on LinkedIn/Gmail and keeps it safe/ethical.
- **No developer-owned backend required for MVP.** All state lives in `chrome.storage.local`. LLM calls go directly from the service worker to the provider API using the user's own key — Palak's infrastructure cost stays at zero.
- **Content script scraping is best-effort and manual-triggered only** — never automatic/background scraping of pages, to avoid ToS and privacy issues.

## Permissions (manifest.json — keep minimal)
```json
{
  "permissions": ["storage", "alarms", "sidePanel"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "https://mail.google.com/*"
  ]
}
```
