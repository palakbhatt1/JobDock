# LangGraph Follow-Up Agent Spec

## Why LangGraph Here (not CrewAI)
This is a **stateful, per-contact process that evolves over time** (outreach → wait → follow-up → wait → close/drop), not a one-shot multi-role task. LangGraph's state graph model fits directly: each contact is a state object moving through nodes based on conditional edges. CrewAI is better suited to role-based one-shot collaboration (e.g. Skillora's resume-tailoring crew) — don't force it here.

## Where This Runs
The graph logic itself is lightweight (state + conditionals) and can be reimplemented in plain JS inside the service worker for the shipped extension (no Python runtime in a browser extension). **Use LangGraph (Python) as the design/prototyping tool and for a standalone demo/portfolio piece** (e.g. a small script or notebook showing the graph), then port the finalized state machine logic to JS for the actual extension. This gives you the LangGraph portfolio artifact without fighting browser runtime constraints.

## State Schema

```python
from typing import TypedDict, Literal, Optional

class ContactState(TypedDict):
    contact_id: str
    name: str
    company: str
    role: str
    status: Literal["sent", "replied", "follow_up_due", "closed", "dropped"]
    days_since_last_action: int
    follow_up_count: int
    max_follow_ups: int
    follow_up_interval_days: int
    draft_message: Optional[str]
```

## Graph Nodes

1. **`check_elapsed_time`** — computes `days_since_last_action`; routes based on threshold.
2. **`mark_follow_up_due`** — sets `status = "follow_up_due"`.
3. **`draft_follow_up_message`** — calls LLM (LangChain `ChatModel`) to generate a short, context-aware follow-up draft using `name`, `company`, `role`, `follow_up_count`.
4. **`suggest_drop`** — triggered when `follow_up_count >= max_follow_ups`; sets `status = "dropped"` (pending user confirmation — never auto-applied).
5. **`close_thread`** — triggered externally when user logs a reply; sets `status = "closed"`.

## Conditional Edges

```python
def route_after_check(state: ContactState) -> str:
    if state["status"] == "replied":
        return "close_thread"
    if state["days_since_last_action"] >= state["follow_up_interval_days"]:
        if state["follow_up_count"] >= state["max_follow_ups"]:
            return "suggest_drop"
        return "mark_follow_up_due"
    return "END"  # no action needed yet

def route_after_follow_up_due(state: ContactState) -> str:
    return "draft_follow_up_message"
```

## Graph Wiring (pseudocode)

```python
from langgraph.graph import StateGraph, END

graph = StateGraph(ContactState)
graph.add_node("check_elapsed_time", check_elapsed_time)
graph.add_node("mark_follow_up_due", mark_follow_up_due)
graph.add_node("draft_follow_up_message", draft_follow_up_message)
graph.add_node("suggest_drop", suggest_drop)
graph.add_node("close_thread", close_thread)

graph.set_entry_point("check_elapsed_time")
graph.add_conditional_edges("check_elapsed_time", route_after_check, {
    "close_thread": "close_thread",
    "mark_follow_up_due": "mark_follow_up_due",
    "suggest_drop": "suggest_drop",
    "END": END,
})
graph.add_edge("mark_follow_up_due", "draft_follow_up_message")
graph.add_edge("draft_follow_up_message", END)
graph.add_edge("suggest_drop", END)
graph.add_edge("close_thread", END)

app = graph.compile()
```

## Draft Prompt Template (for `draft_follow_up_message`)

```
You are drafting a short, professional follow-up message for a job seeker.
Contact: {name}, {role} at {company}.
This is follow-up #{follow_up_count}.
Original outreach was about: {job_title_applied}.
Keep it under 60 words, polite, no desperation, one clear ask (a status update).
Return only the message text, no preamble.
```

## Porting to JS (for the actual extension)
The same node/edge logic becomes a plain function chain in `lib/langgraph-agent.js` — no need for the LangGraph JS package for something this simple; a switch/state-machine function is enough. Keep the LangGraph Python version as a documented design artifact (and optionally a CLI/notebook demo) for the portfolio.
