# Data Model

## Storage
All data lives in `chrome.storage.local` under two top-level keys: `contacts` and `settings`.

## Contact Object

```typescript
interface Contact {
  id: string;                 // uuid
  name: string;
  role: string;               // e.g. "HR Manager", "Founder", "SDE-2"
  company: string;
  channel: "linkedin" | "email" | "other";
  contactHandle: string;      // LinkedIn profile URL or email address
  sourceUrl?: string;         // page it was captured from
  status: "sent" | "replied" | "follow_up_due" | "closed" | "dropped";
  resumeVersion?: string;     // free text or tag, e.g. "v3-ml-focus"
  jobTitleApplied?: string;   // role being pursued, optional
  createdAt: string;          // ISO timestamp — first contact date
  lastActionAt: string;       // ISO timestamp — last time user logged an action
  followUpCount: number;      // how many follow-ups sent so far
  followUpHistory: FollowUpEntry[];
  notes?: string;
}

interface FollowUpEntry {
  date: string;         // ISO timestamp
  type: "initial" | "follow_up" | "reply_received" | "closed" | "dropped";
  draftUsed?: string;   // the LLM-drafted message, if any, for reference
}
```

## Settings Object

```typescript
interface Settings {
  llmProvider: "gemini" | "openai" | "anthropic";
  apiKey: string;              // stored locally only, never transmitted elsewhere
  followUpIntervalDays: number; // default: 5
  maxFollowUps: number;         // default: 2, after which status → suggest "dropped"
}
```

## Status Transitions (drives the LangGraph in 03-langgraph-agent.md)

```
sent ──(N days, no reply)──▶ follow_up_due
sent ──(user logs reply)──▶ replied ──(user closes)──▶ closed
follow_up_due ──(user sends follow-up)──▶ sent (followUpCount++)
follow_up_due ──(followUpCount >= maxFollowUps)──▶ dropped (suggested, user confirms)
replied ──(no further action needed)──▶ closed
```

## Notes for Implementation
- Use `crypto.randomUUID()` for `id`.
- Keep the API key in `chrome.storage.local`, not `sync`, to avoid any cross-device transmission through Google's sync infrastructure — this matters given the "not on Google anywhere" constraint.
- Design the schema so a future Skillora integration can add an optional `skilloraResumeId` field without a breaking migration.
