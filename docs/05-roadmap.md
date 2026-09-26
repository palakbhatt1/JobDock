# Build Roadmap

## Phase 0 — Setup
- [ ] Scaffold folder structure per `01-architecture.md`.
- [ ] Write minimal `manifest.json`, load unpacked in Chrome, confirm it appears with no errors.
- [ ] Stub `chrome.storage.local` read/write in `lib/storage.js`, verify persistence across reloads.

## Phase 1 — Manual Core (no AI yet)
- [ ] Side panel UI: add contact manually (form), list contacts grouped by status.
- [ ] Manual status transitions: Mark Replied / Mark Follow-Up Sent / Close / Drop.
- [ ] Settings screen: LLM provider + API key storage (UI only, unused yet).
- [ ] Ship this as a usable v0.1 even without content scripts or AI — validates the core loop first.

## Phase 2 — Capture from Web Pages
- [ ] `content-scripts/linkedin.js` — inject capture button, message-pass to service worker.
- [ ] `content-scripts/gmail.js` — same for Gmail threads.
- [ ] Confirm captured contacts land correctly in storage and appear in the side panel.

## Phase 3 — Follow-Up Agent
- [ ] Prototype the LangGraph state graph in Python (per `03-langgraph-agent.md`) as a standalone script/notebook — this is your portfolio artifact.
- [ ] Port the state-machine logic to `lib/langgraph-agent.js` in plain JS.
- [ ] Wire `chrome.alarms` daily check → run agent logic → update contact statuses.
- [ ] Implement `lib/llm-client.js` for at least one provider (start with Gemini or OpenAI — whichever key you'll test with).
- [ ] Surface generated drafts in the side panel with a "Copy" action.

## Phase 4 — Polish & Distribute
- [ ] README with install-from-GitHub-release instructions (screenshots of Load Unpacked flow).
- [ ] Tag a GitHub Release with a zipped build.
- [ ] Port to Firefox (`browser.*` polyfill), submit to AMO (free).
- [ ] Optional: short demo GIF/video for the README and LinkedIn post.

## Phase 5 — Stretch (only if time allows)
- [ ] Skillora integration: link `resumeVersion` field to an actual resume ID from Skillora.
- [ ] Export contacts to CSV.
- [ ] Basic weekly summary view ("You have 4 follow-ups due this week").

## Explicit Non-Goals (don't drift into these)
- No cloud sync / user accounts.
- No auto-sending of messages.
- No Chrome Web Store listing (paid, skip for now).
- No analytics dashboards beyond the status groupings.
