# API Reference

Programmatic access to the Zephlo platform. Use this to create and manage
Agents from your backend, automate crawls, rotate API keys, or integrate
Zephlo into an existing product workflow.

Interactive OpenAPI docs for your instance are published at
`/docs` (for example `https://app.zephlo.ai/docs`) and accept the same JWT
tokens described here.

---

## Conventions

- **Base URL** — `https://app.zephlo.ai` on hosted; your instance URL for
  self-hosted deployments.
- **Agent identifiers** — every Agent has an integer `id` (internal) and a
  UUID `public_id`. The public API **always uses the UUID**. In requests
  the UUID is called `agent_id`.
- **Content type** — `application/json` for every JSON request body. File
  uploads use `multipart/form-data`.
- **Dates** — ISO-8601 UTC strings.
- **Errors** — JSON body of the form `{"detail": "Human message"}` with the
  matching HTTP status.

---

## Authentication

Two auth schemes coexist:

| Scheme | Header | Used for |
|---|---|---|
| **JWT Bearer** | `Authorization: Bearer <token>` | Dashboard / management endpoints (everything that acts on behalf of a user or organization). |
| **API key** | `X-API-Key: flk_…` | Widget / public endpoints — session creation, widget config. Binds calls to one Agent or organization. |

### Register

`POST /api/auth/register`

```json
{
  "email": "you@example.com",
  "password": "at-least-six-chars",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

**200** — returns the same shape as `login`. **400** if email is taken.

### Log in

`POST /api/auth/login`

```json
{ "email": "you@example.com", "password": "..." }
```

**200** →

```json
{
  "id": 42,
  "email": "you@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "onboarding_completed": true,
  "token": "eyJhbGciOi...",
  "organization_id": 7
}
```

Use `token` as `Authorization: Bearer <token>` on every other endpoint.
Tokens expire after 24 hours by default.

### Log in with OAuth

`POST /api/auth/oauth`

```json
{ "provider": "google", "id_token": "..." }
```

Supported providers: `google`, `microsoft`. Returns the same login response.

### Python example

```python
import httpx

API = "https://app.zephlo.ai"

r = httpx.post(f"{API}/api/auth/login",
               json={"email": "you@example.com", "password": "..."})
token = r.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
```

---

## Agents

Agent resources. `agent_id` in every path is the UUID `public_id`.

### List Agents

`GET /api/agents`

Optional query: `organization_id=<int>` to list Agents owned by an org you
belong to. Without it, returns Agents owned by the current user.

### Create an Agent

`POST /api/agents`

```json
{
  "name": "Acme Docs Assistant",
  "description": "Answers questions about our documentation.",
  "instructions": "Be concise. Cite the doc page you used.",
  "organization_id": 7
}
```

**201** → Agent object (below). `status` starts as `pending`.

### Get an Agent

`GET /api/agents/{agent_id}`

Returns the Agent plus its `crawl_jobs`, `documents`, and `agent_texts`.

### Update an Agent

`PUT /api/agents/{agent_id}`

```json
{
  "name": "Acme Docs Assistant",
  "description": "...",
  "instructions": "...",
  "is_active": true,
  "auto_recrawl_enabled": true,
  "recrawl_interval_hours": 48
}
```

Every field is optional; send only what you want to change.

### Delete an Agent

`DELETE /api/agents/{agent_id}` → `{"ok": true}`. Cascades to crawl jobs,
pages, and documents for that Agent.

### Agent response shape

```json
{
  "id": 123,
  "public_id": "1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf",
  "organization_id": 7,
  "name": "Acme Docs Assistant",
  "description": "...",
  "instructions": "...",
  "website_url": "https://docs.acme.com",
  "status": "ready",
  "is_active": true,
  "created_at": "2026-04-01T12:00:00Z",
  "widget_icon": null,
  "widget_welcome": "Hi! Ask me anything about Acme.",
  "widget_position": "right",
  "quick_prompts": [ { "title": "How do I install?", "prompt": "How do I install?" } ],
  "follow_up_prompts": [],
  "greeting_prompts": [],
  "widget_logo_url": "https://.../logo.png",
  "widget_width": 380,
  "widget_height": 520,
  "widget_header_color": "#0071e3",
  "widget_user_bubble_color": "#0071e3",
  "widget_assistant_bubble_color": "#f5f5f7",
  "widget_font_family": "",
  "widget_font_size": 14,
  "widget_text_color": "#1d1d1f",
  "voice_enabled": false,
  "webmcp_enabled": true,
  "person_mode_enabled": true,
  "navigation_enabled": true,
  "auto_recrawl_enabled": true,
  "recrawl_interval_hours": 48,
  "last_crawled_at": "2026-04-20T09:12:00Z"
}
```

### Widget settings

Dashboard-only views, for building your own customization UI.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/{agent_id}/widget-settings` | Current widget customization values. |
| `PUT` | `/api/agents/{agent_id}/widget-settings` | Update colors, welcome message, quick prompts, greeting prompts, voice/WebMCP toggles, etc. |
| `POST` | `/api/agents/{agent_id}/logo` | Upload a logo. `multipart/form-data` with a `file` field. PNG/JPG/SVG/WebP, ≤ 2 MB. |

---

## Knowledge: crawling a website

Crawling is two steps — discover URLs, then crawl selected ones. This lets
you filter out pages (e.g. marketing, login) before indexing.

### Discover URLs

`POST /api/agents/{agent_id}/discover`

```json
{ "website_url": "https://docs.acme.com" }
```

**200** →

```json
{ "urls": [ { "url": "https://docs.acme.com/", "title": "Home" }, ... ] }
```

Raises **502** if the crawler service is unreachable.

### Start a crawl

`POST /api/agents/{agent_id}/crawl`

```json
{ "selected_urls": ["https://docs.acme.com/", "https://docs.acme.com/api"] }
```

**201** → `CrawlJob` (below). The Agent's `status` moves to `crawling`.

### Re-crawl

`POST /api/agents/{agent_id}/recrawl`

No body. Re-uses the URLs from the most recent crawl. Returns a new `CrawlJob`.

### Check crawl status

`GET /api/crawl-jobs/{crawl_job_id}`

```json
{
  "id": 88,
  "chatbot_id": 123,
  "status": "completed",
  "pages_crawled": 42,
  "started_at": "2026-04-22T14:00:00Z",
  "completed_at": "2026-04-22T14:03:11Z"
}
```

`status` values: `pending`, `crawling`, `completed`, `failed`.

---

## Knowledge: documents

Upload PDFs that should be part of the Agent's knowledge alongside the
crawled website content.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/agents/{agent_id}/documents` | Upload a PDF (`multipart/form-data`, `file`). |
| `GET` | `/api/agents/{agent_id}/documents` | List documents for the Agent. |
| `PUT` | `/api/agents/{agent_id}/documents/{document_id}` | Replace the file; triggers re-indexing. |
| `DELETE` | `/api/agents/{agent_id}/documents/{document_id}` | Remove a document from the knowledge base. |

Document response:

```json
{
  "id": 12, "chatbot_id": 123, "filename": "pricing.pdf",
  "s3_url": "https://...", "file_size": 182340,
  "status": "indexed", "chunks_indexed": 68,
  "uploaded_at": "2026-04-20T10:00:00Z",
  "processed_at": "2026-04-20T10:00:42Z"
}
```

---

## API keys

API keys authenticate the widget (and any other public-facing client) to
one Agent or one organization. They are shown in full **exactly once**, at
creation time; afterwards only the `key_prefix` is returned.

Keys are strings of the form `flk_<32-hex>`.

### Per-Agent keys

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/{agent_id}/api-keys` | List keys (without the secret). |
| `POST` | `/api/agents/{agent_id}/api-keys` | Create a key. Body: `{"name": "Production"}`. |
| `DELETE` | `/api/agents/{agent_id}/api-keys/{key_id}` | Revoke (soft-delete) a key. |
| `GET` | `/api/agents/{agent_id}/preview-key` | Get or create a working "Preview" key for the dashboard's live preview. |

### Per-organization keys

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/organizations/{org_id}/api-keys` | List org-wide keys. |
| `POST` | `/api/organizations/{org_id}/api-keys` | Create an org-wide key. Admin/owner only. |
| `DELETE` | `/api/organizations/{org_id}/api-keys/{key_id}` | Revoke. Admin/owner only. |

Creation response (only time the full key is returned):

```json
{
  "id": 9,
  "chatbot_id": 123,
  "organization_id": 7,
  "key": "flk_4c8bffd41a2e9c61a4a3c5ee59d0b121",
  "key_prefix": "flk_4c8b",
  "name": "Production",
  "is_active": true,
  "created_at": "2026-04-22T14:10:00Z",
  "last_used_at": null
}
```

---

## Widget / public endpoints

These accept either no auth or an `X-API-Key` header. They are what the
embeddable widget calls and what you'd call from any browser-side code.

### Widget config

`GET /api/public/agents/{agent_id}/config`

Used by the widget on boot to fetch the Agent's name, welcome message,
colors, quick prompts, etc. Safe for the public internet. If the
`X-API-Key` header is present it must belong to the same Agent or
organization or you get **401**.

### Create a chat session

`POST /api/session`

```json
{ "chatbot_id": "1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf" }
```

**200** → `{ "session_id": "<uuid>" }`

The returned `session_id` is what the widget passes as a query parameter
when it opens the chat WebSocket:

```
wss://app.zephlo.ai/ws/chat?session_id=<session-uuid>&chatbot_id=<agent-uuid>
```

The full WebSocket protocol — including the `init` frame, `web_tool_call`
and `tool_result` messages with `call_id` correlation, and the 30-second
tool timeout — is documented in the
[Widget Developer Guide](./widget.md#websocket-protocol).

---

## Organizations

Organizations group users, Agents, and API keys. A user can belong to
multiple orgs with different roles (`creator`, `owner`, `admin`, `member`).

### Organizations

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/organizations` | List orgs the current user belongs to. |
| `POST` | `/api/organizations` | Create an org. Body: `{"name":"Acme"}`. Creator is the current user. |
| `GET` | `/api/organizations/{org_id}` | Org detail + the caller's role. |
| `GET` | `/api/organizations/{org_id}/metrics` | Aggregate conversations / messages / resolved across every Agent in the org. |
| `GET` | `/api/organizations/{org_id}/analytics?days=30` | Daily time-series analytics. |

### Members

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/organizations/{org_id}/members` | List members. |
| `PUT` | `/api/organizations/{org_id}/members/{user_id}` | Update role. Body: `{"role":"admin"}`. Admin/owner only. |
| `DELETE` | `/api/organizations/{org_id}/members/{user_id}` | Remove member. Admin/owner only. |

### Invitations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/organizations/{org_id}/invitations` | Invite a user. Body: `{"email":"...","role":"member"}`. |
| `GET` | `/api/organizations/{org_id}/invitations` | List pending invitations. |
| `DELETE` | `/api/organizations/{org_id}/invitations/{invitation_id}` | Cancel a pending invitation. |
| `POST` | `/api/invitations/accept` | Accept an invitation. Body: `{"token":"..."}`. |

---

## Conversations

Read and manage chat sessions in your dashboard.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/{agent_id}/conversations` | List sessions for an Agent. |
| `GET` | `/api/agents/{agent_id}/conversations/{session_id}` | Single session with all messages. |

Additional admin endpoints (`POST .../admin-message`, `POST .../switch-mode`)
exist for the live-chat takeover feature — see the dashboard UI for how
they're used.

---

## Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/{agent_id}/metrics` | Totals for one Agent (conversations, messages, resolved). |
| `GET` | `/api/organizations/{org_id}/metrics` | Totals across the org. |
| `GET` | `/api/organizations/{org_id}/analytics?days=30` | Daily time-series across the org. |
| `GET` | `/api/organizations/{org_id}/chatbot-metrics` | Per-Agent totals in one batch. |
| `GET` | `/api/organizations/{org_id}/chatbot-analytics?days=14` | Per-Agent daily sparklines in one batch. |

---

## Error codes

| Status | Meaning |
|---|---|
| `400` | Validation failed (bad email, short password, missing required field). |
| `401` | Bearer token invalid/expired, or `X-API-Key` revoked / mismatched. |
| `403` | Authenticated but not allowed (e.g. not a member of the org, Agent inactive). |
| `404` | Agent / crawl job / document / invitation not found. |
| `502` | A downstream service (crawler, agent) is unreachable. |

---

## See also

- [Getting Started](./getting-started.md) — the end-to-end flow in plain English.
- [Widget Developer Guide](./widget.md) — the WebSocket protocol and browser SDK.
- [Troubleshooting](./troubleshooting.md) — common failure modes.
