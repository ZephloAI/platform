# Docs Audit (working scratch — deleted at end of task)

Scope: branch `todo/02-docs`, section 2 of TODO.md.

## Current state of `docs/`

- The `docs/` directory does **not** exist on this branch at the start of work.
  All historical "docs" live in scattered READMEs and one ad-hoc test guide.
- No doc framework (mkdocs / docusaurus / nextra / vitepress) is configured
  anywhere in the repo. `package.json`, `pyproject.toml`, and CI workflows
  contain no doc-build steps.

**Decision:** use plain Markdown in `docs/`. The repo is GitHub-hosted and
the files render natively; no framework scaffolding is introduced. This
honours "do not rewrite the doc framework" (there is none) while making the
docs usable immediately. Future teams can point MkDocs / Docusaurus at this
directory without moving files.

## Inventory of existing doc-shaped content

| Source | Status | Notes |
|---|---|---|
| `README.md` (root) | **stale** | Uses "chatbot" throughout; lists the deprecated `/api/chatbots` endpoints; numeric IDs; doesn't mention agentic tools, widget SDK, `<zephlo-chat>`, WebSocket protocol, API keys, organizations. Good as an operator/dev overview of services + ports, kept for developer setup but not rewritten here. |
| `widget/README.md` | **stale** | Wrong `chatbotId: number`; the current widget takes the public UUID string. Missing `<zephlo-chat>`, form auto-discovery, and the WebSocket protocol. Superseded by `docs/widget.md`. |
| `WEBMCP_TESTING.md` (root) | **partially valid** | Useful snippets for `registerTool`, browser-mirror, and external discovery. Material folded into `docs/widget.md`; original retained as a hands-on test guide. |
| `landing/README.md` | **valid** | Next.js landing boilerplate, nothing to do with platform docs. |
| `CLAUDE.md`, `landing/CLAUDE.md`, `landing/AGENTS.md` | **valid (internal)** | Agent instructions for this repo. Not public docs. |
| `LAUNCH_PROMPT.md`, `TODO.md` | **valid (internal)** | Launch tracker, not docs. |

## Ground truth used when writing new docs

Routes pulled from `api/app/routers/`:
- `auth.py` — POST `/api/auth/register`, `/api/auth/login`, `/api/auth/oauth`
- `chatbots.py` — `/api/agents` CRUD, `{agent_id}` is UUID `public_id`
- `crawl_jobs.py` — `/api/agents/{agent_id}/discover`, `/crawl`, `/recrawl`, GET `/api/crawl-jobs/{id}`
- `api_keys.py` — `/api/agents/{agent_id}/api-keys` CRUD; keys look like `flk_<32-hex>`
- `organizations.py` — `/api/organizations` CRUD + `/members`, `/invitations`, `/api-keys`
- `public_chat.py` — GET `/api/public/agents/{agent_id}/config` (widget bootstrap, optional `X-API-Key`)
- `session.py` — POST `/api/session` `{chatbot_id: <uuid>}` → `{session_id}`
- `documents.py` — PDF uploads per agent
- WebSocket lives at `{api}/ws/chat?session_id=&chatbot_id=` (see `widget/src/api.ts` → `buildWsUrl`)

Widget code of record:
- `widget/src/zephlo.ts` — `Zephlo.initialize({ key, chatbotId, apiUrl? })`, returned methods
- `widget/src/index.ts` — `<zephlo-fab>` (default) and `<zephlo-chat>` (inline) custom elements,
  plus `<chatbot-widget>` alias; auto-inject fallback from `script[data-chatbot-id]`.
- `widget/src/form-scanner.ts` — `form[zephlo-tool-name]` auto-registration, type map,
  `zephlo-param-description`, `zephlo-auto-submit`, `zephlo-result`.
- `widget/src/webmcp.ts` — `ToolRegistry`, mirroring onto `navigator.modelContext`.
- `widget/src/api.ts` — `ChatSocket`: `web_tool_call` (server→client), `tool_result`
  (client→server with `call_id`), `init` frame with `zephlo_tools`, `context_update`,
  `navigate`, `admin_message`, `mode_changed`, `waiting`.

Agent code of record:
- `agent/app/webmcp_tools.py` — `TOOL_TIMEOUT = 30` (seconds), dispatcher correlates
  `tool_result` back to `call_id`, emits `web_tool_call` with matching `call_id`.

## Delete this file at end of task.
