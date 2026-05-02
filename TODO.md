# TODO — Launch Readiness

## About This Project

This project is a multi-tenant AI Agent platform that lets anyone turn a website into a conversational Agent. Point the platform at a URL, the crawler scrapes and indexes the content into a vector database, and end users can then chat with an Agent that answers questions grounded in that website's content using retrieval-augmented generation (RAG). The platform is aimed at teams that want a polished, embeddable Agent on their own site without building the RAG stack themselves.

The system is built as a set of cooperating microservices: an **Agent** service (the LLM/RAG logic), an **API** service (auth, Agent management, job orchestration), a **Crawler** service (website scraping, chunking, embedding), a **Frontend** dashboard (for creating and managing Agents), and a **Widget** that customers drop into their own site via a script tag. Supporting infrastructure includes PostgreSQL, Qdrant (vector DB), and Redis. The product is positioned as a premium, Apple-inspired experience — simple to operate for non-technical users while remaining flexible for developers embedding the Agent.

Beyond answering questions, the Agent is **agentic out of the box**: it can take actions on behalf of the user. Site navigation works without any setup — the Agent can move a visitor to a relevant page on the host site through a built-in `navigate` action delivered over the widget's WebSocket channel and handled by the widget's `onNavigate` listener. On top of this, developers can extend the Agent with **custom tools** via the Zephlo SDK: calling `Zephlo.initialize().registerTool({ name, description, inputSchema, execute })` exposes any browser-side function to the Agent, with JSON Schema validation on the inputs. The SDK also auto-discovers HTML forms tagged with a `zephlo-tool-name` attribute and turns them into **form tools** the Agent can fill in and submit, and it mirrors registered tools onto the emerging WebMCP `navigator.modelContext` API so the same tools work with WebMCP-aware browsers.

Communication between the page and the Agent is **fully bidirectional** over a WebSocket. Agent → page: the server emits `web_tool_call` messages (tool name, arguments, and a `call_id`) which the widget routes to the right registered tool. Page → Agent: the widget executes the tool in the browser and posts back a `tool_result` carrying the same `call_id`, content, and any error; a dispatcher on the agent side matches results to the originating call (with a 30-second timeout) and folds them into the conversation. This is the same channel the platform uses to push live updates and triggers — navigation events, tool results, and streaming chat tokens — so the Agent stays in sync with what is actually happening on the page.

---

## Missing Pieces Before Full Launch

The following items are blocking a full public launch. Each is tracked below with current state and what's needed.

### 1. Incomplete Landing Website
We need a landing site in the spirit of https://copilotkit.ai/ but simpler and more focused on our positioning.

- [x] Audit what exists under `landing/` today
- [x] Rewrite the hero, value proposition, and feature sections to match our Agent-platform positioning
- [x] Add primary CTAs (sign up / talk to sales) wired to the dashboard
- [x] Polish visual design to the Apple-inspired standard (typography, spacing, motion)
- [x] Make it fully responsive and accessible
- [x] Add basic SEO/meta tags and social preview cards

### 2. Out-of-Date Docs
Current docs under `docs/` no longer reflect the platform as built. They need to be rewritten before launch.

- [x] Inventory current docs and mark what is stale vs. still valid
- [x] Rewrite the "Getting Started" flow for end users (create Agent → crawl site → embed widget)
- [x] Rewrite the developer docs for the widget script tag and `<zephlo-chat>` inline element
- [x] Document the API surface for programmatic Agent management
- [x] Add a troubleshooting / FAQ page
- [x] Publish docs at a stable URL linked from the landing site and dashboard

### 3. Connect Resend for Invites
The invite email template already exists in Resend; we just need the backend wired up.

- [x] Add Resend API key handling (config + secret management)
- [x] Add a Resend client module in the `api` service
- [x] Implement "send invite" when an organization owner invites a member
- [x] Accept invite flow: signed invite token → create/attach user → add to org
- [x] Invite expiry + resend logic
- [x] Log / audit invite sends for the admin dashboard (see item 6)

### 4. Forgot Password
There is currently no self-serve password recovery.

- [x] Add "Forgot password?" link on the login page
- [x] Backend endpoint: generate a time-limited, single-use reset token
- [x] Send reset email via Resend (reuse the Resend integration from item 3)
- [x] Reset-password page in the frontend that consumes the token
- [x] Invalidate existing sessions on successful password reset
- [x] Rate limit reset requests per email / IP

### 5. Examples Page on the Landing Site
We want an examples page similar to https://www.copilotkit.ai/examples, showcasing concrete use cases for the Agent platform.

- [x] Decide on 4–8 example scenarios (docs Agent, support Agent, e-commerce assistant, etc.)
- [x] For each example: short description, embedded live demo or screenshot, and "use this template" CTA
- [x] Reuse the widget / `<zephlo-chat>` element to make examples actually interactive where possible
- [x] Link the examples page from the landing nav and hero

### 6. Admin Dashboard + Usage Enforcement
We have no admin surface for operating the platform, and no enforcement of per-organization limits.

**Admin dashboard (new surface, likely in `frontend/` under an admin-only route):**
- [x] List organizations with key stats (users, Agents, token usage, plan)
- [x] Per-organization detail page: manage limits, view audit log, suspend/reactivate
- [x] Platform-wide metrics (active orgs, total Agents, token usage over time)
- [x] Role gating: only platform admins can access

**Limit enforcement (in the `api` and `agent` services):**
- [x] Data model for per-organization limits: `max_users`, `max_agents`, `max_tokens_per_period`
- [x] Enforce `max_users` on invite acceptance (item 3 dependency)
- [x] Enforce `max_agents` on Agent creation
- [x] Track token usage per Agent call in the `agent` service; aggregate per organization
- [x] Enforce `max_tokens_per_period` — block or degrade once exceeded, with a clear error
- [x] Surface current usage vs. limits in the customer dashboard, not just the admin view
- [x] Reset/rollover logic for the token usage period (monthly by default)
