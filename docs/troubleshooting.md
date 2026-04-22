# Troubleshooting & FAQ

Things that tend to go wrong, and how to fix them.

---

## Widget doesn't appear on the page

**Check the Agent ID is the UUID.** The platform only accepts the Agent's
UUID (`public_id`) — e.g. `1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf`. The
integer shown in some URLs is internal. If you pass an integer you'll get
a **404** from `/api/session` and the widget will silently bail.

**Check the API key starts with `flk_`.** `Zephlo.initialize` throws
`Invalid API key format` otherwise — look in the browser console.

**Is the Agent active?** If an admin toggled the Agent off (`is_active:
false`), `/api/session` returns **403** and the widget hides itself.
Flip it back on from the dashboard.

**Is the Agent's API key still active?** Revoked keys return **401**. Mint
a new one in the dashboard → API Keys.

**Content Security Policy (CSP) blocking the script.** If your site sets a
strict CSP, allow the widget origin in `script-src` and the WebSocket
endpoint in `connect-src` — for the hosted product:
```
script-src 'self' https://app.zephlo.ai;
connect-src 'self' https://app.zephlo.ai wss://app.zephlo.ai;
img-src 'self' data: https:;
```

---

## Widget appears but chat hangs / shows "connecting…"

The WebSocket didn't open. Check the browser Network tab, filter by WS.

- **`4001 Invalid session` / `Missing session_id`** — `/api/session` didn't
  return a valid `session_id`, or a proxy stripped the query string. Retry
  and inspect the POST response.
- **`4002 Chatbot not found`** — you're passing the wrong UUID, or the
  Agent has been deleted.
- **`101 Switching Protocols` then immediate close** — usually a reverse
  proxy (nginx, Cloudflare) that isn't configured to pass WebSocket
  upgrades. Make sure `Upgrade` and `Connection` headers are forwarded.

---

## Crawl stuck on `pending` or `crawling`

- **`pending` for a long time** — the crawler service can't be reached. The
  API returns **502** on `/discover` in that case, but once a crawl is
  started the job just sits there. Check `docker compose logs crawler`.
- **`failed` with low `pages_crawled`** — the site blocks automated traffic
  (robots.txt, Cloudflare challenge). Try fewer/public-facing URLs first.
- **`completed` but answers are wrong/empty** — confirm the Qdrant
  collection has vectors: `curl http://<qdrant>:6333/collections`. If the
  collection is empty, re-run the crawl.

---

## Auth returns `401 Invalid or expired token`

JWTs expire after 24 hours by default. Re-run `/api/auth/login` and keep
the new `token`. If you're seeing 401 immediately after login, the
client-side clock is almost certainly skewed — sync the system clock.

---

## `registerTool` works, but the Agent never calls my tool

1. **Description is missing or too vague.** The LLM chooses tools by
   description. Rewrite it to read like a one-line man-page entry: what
   it does, when to use it.
2. **Input schema doesn't match the user's ask.** If you require a `sku`
   but the user says "a t-shirt", the agent has nothing to pass. Add
   optional parameters and make your `execute` do the lookup.
3. **You registered the tool *after* the conversation started.** The tool
   list is sent in the `init` frame on connect. Register tools before
   `Zephlo.initialize` (or before the user sends the first message) so
   they make it into the session.
4. **Browser tools are disabled on the Agent.** The "WebMCP / Browser
   Tools" toggle must be on in the dashboard for the Agent.

---

## Tool times out with "Tool … timed out after 30s"

The agent waits at most **30 seconds** for a `tool_result` with a matching
`call_id`. After that it gives up on that call and tells the LLM the tool
timed out.

If your tool legitimately takes longer:
- Kick off the work and return immediately with a "queued" message.
  Store a ticket ID somewhere the next turn can read.
- Or poll a backend status endpoint from a follow-up tool the agent can
  call to check progress.

Keep `execute` idempotent — a retry is likely.

---

## "Orphaned tool_result" warnings in the agent logs

You sent a `tool_result` with a `call_id` the agent didn't recognize.
Common causes:

- Your client sent a result for a call that already timed out (30s).
- You changed the `call_id` before sending it back. **Always echo it
  exactly as received.**
- Two widgets are open for the same session and both responded. Only one
  client should answer each `web_tool_call`.

---

## HTML-form auto-discovery didn't pick up my form

- Make sure the form has a `zephlo-tool-name` attribute. Missing it = no
  registration.
- Only direct descendants with a `name` attribute are scanned. `<input>`
  without `name=` is skipped.
- `type="file"` is skipped on purpose — the browser won't let JS set files.
  A console warning is logged.
- If you inject the form inside your own shadow root, call
  `zephlo.scanForms()` manually once it's in the DOM (the built-in
  MutationObserver watches the main document, not third-party shadow DOMs).

---

## CORS errors from `/api/session` or `/api/public/...`

The API is configured to allow any origin (`*`) so the widget works on
customer sites. If you're still seeing CORS errors, a middlebox (e.g. an
API gateway or WAF in front of the API) is stripping headers. Curl the
endpoint directly from your server to confirm the API itself is responding.

---

## Chat returns answers that ignore the site content

- Confirm the latest crawl finished — Agent `status` should be `ready` and
  `last_crawled_at` should be recent.
- Trigger a re-crawl: `POST /api/agents/{agent_id}/recrawl`.
- Check `/api/agents/{agent_id}` for crawl job history — the most recent
  `crawl_jobs[0]` should be `completed` with a non-zero `pages_crawled`.
- If you uploaded PDFs, make sure their `status` is `indexed` and
  `chunks_indexed > 0`.

---

## Voice input doesn't work

Voice uses the browser's built-in `SpeechRecognition` API:

- **Chrome / Edge** — works. Requires HTTPS (or `localhost`) and microphone
  permission.
- **Safari / Firefox** — support is limited or off by default.

If voice is enabled on the Agent but the mic icon is missing, the browser
doesn't support the API. If the icon is there but nothing happens, open
the browser's site-permissions panel and allow microphone access.

---

## Where are the logs?

| Service | Command |
|---|---|
| API | `docker compose logs -f api` |
| Crawler | `docker compose logs -f crawler` |
| Agent | `docker compose logs -f agent` |
| Qdrant | `docker compose logs -f qdrant` |

For a production cluster, replace `docker compose` with your orchestrator's
equivalent (`kubectl logs`, etc.).

---

## Still stuck?

- Re-read the [Getting Started](./getting-started.md) flow end-to-end — most
  issues trace back to skipping a step.
- Check the OpenAPI docs at `https://<your-api>/docs` to confirm request
  shapes against a live server.
- File a bug with:
  - the endpoint or widget call you made,
  - the exact error (message + HTTP status / WS close code),
  - the Agent UUID and API key prefix (never the full key).
