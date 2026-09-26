# Project Brief — Outreach Tracker (Browser Extension)

## Problem
Job platforms (LinkedIn, Naukri, Wellfound, Indeed) already solve tracking of formal applications. What's unsolved is the proactive, off-platform side of a job search:

- **Cold outreach** — contacting recruiters, HRs, hiring managers, founders, or employees directly.
- **Direct email applications** — sending a resume to an email address posted by a recruiter (e.g. in a LinkedIn post).

These interactions are scattered across LinkedIn DMs, emails, and personal contacts with no record of: who was contacted, for which role, when, which resume version was sent, whether they replied, and when to follow up.

## Core Insight
The atomic unit is **the contact/thread**, not "the job" (unlike existing ATS trackers). There is no canonical job posting object in cold outreach — there's a person, a channel, a message, and a response state.

## What This Is
A free, GitHub-distributed browser extension that:
1. Lets a user capture a contact in one click from LinkedIn/Gmail (name, role, company, channel).
2. Logs the resume version sent per contact.
3. Tracks response status per contact.
4. Runs follow-up logic via a LangGraph agent: no reply after N days → draft a follow-up; replied → close thread; no reply after 2 follow-ups → suggest drop.
5. Never depends on a paid backend — local storage by default, optional user-supplied LLM API key for agent features.

## What This Is Not
- Not a job-posting tracker (that space is saturated).
- Not a scraper/spam tool — the extension assists manual capture, it does not auto-message anyone.
- Not tied to a specific ATS scoring engine (may later integrate with Skillora, but ships standalone).

## Success Criteria (MVP)
- User can capture a contact from a LinkedIn profile/Gmail thread in ≤2 clicks.
- User can see all contacts in a side panel with status (Sent / Replied / Follow-up due / Closed).
- Follow-up suggestions generate automatically based on elapsed time and response state.
- Zero cost to run for the developer and the user (BYO API key model).
- Ships as a GitHub release, loadable via `chrome://extensions` → Load Unpacked.

## Tech Stack
- **Extension:** Manifest V3, vanilla JS or React for popup/side panel, `chrome.storage.local`.
- **Agent logic:** LangGraph (state graph per contact/thread) + LangChain (LLM call wrapper for drafting follow-ups).
- **LLM:** BYO API key (Gemini/OpenAI/Anthropic) stored locally, never sent to a Palak-owned server.
- **Backend (optional, MVP-later):** Lightweight FastAPI on Render/Railway free tier only if graph execution can't run client-side; MVP should try to keep the agent logic invokable from the service worker via direct API calls.
- **Distribution:** GitHub Releases (primary), Firefox AMO (free, real installs) as a secondary channel.

## Out of Scope for v1
- Chrome Web Store listing (has $5 fee — skip initially).
- Auto-sending messages or auto-scraping without user action.
- Multi-user sync / cloud accounts.
