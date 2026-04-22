# Getting Started

Welcome to the Zephlo Agent platform. In about five minutes you will have
an Agent that knows your website and a chat widget live on any page.

The flow is three steps:

1. **Create an Agent** in the dashboard (or via the API).
2. **Crawl your site** so the Agent can answer questions grounded in your content.
3. **Embed the widget** on your page with one `<script>` tag.

---

## 1. Create an Agent

### Using the dashboard (recommended)

1. Sign in at your Zephlo instance (for example `https://app.zephlo.ai`).
2. Click **New Agent**.
3. Give it a name (e.g. "Acme Docs Assistant") and an optional description.
4. Hit **Create**. You now have an Agent. Copy its **Agent ID** — it's a UUID
   like `1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf`. This is the value you'll use
   everywhere in the API and in the widget.

> Always identify an Agent by its UUID. The numeric database ID is internal
> and is not accepted by the public API.

### Using the API

You'll need a JWT token from login first. Full auth details are in the
[API Reference](./api-reference.md#authentication).

```bash
# 1. Log in
curl -X POST https://app.zephlo.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
# => { "id": 42, "email": "...", "token": "eyJ..." , "organization_id": 7 }

# 2. Create an Agent
curl -X POST https://app.zephlo.ai/api/agents \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Docs Assistant","organization_id":7}'
# => { "id": 123, "public_id": "1f3b9a62-...-11bf", "name": "...", "status": "pending", ... }
```

Take note of `public_id` — **that's the Agent ID you use from here on.**

Python version with f-strings:

```python
import httpx

API = "https://app.zephlo.ai"
TOKEN = "eyJ..."

agent = httpx.post(
    f"{API}/api/agents",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"name": "Acme Docs Assistant"},
).json()

agent_id = agent["public_id"]
print(f"Created Agent {agent_id}")
```

---

## 2. Crawl your website

Crawling happens in two stages so you can decide what actually gets indexed:
**discover** a set of URLs, then **start** the crawl on a chosen subset.

### Discover URLs on your site

```bash
curl -X POST https://app.zephlo.ai/api/agents/$AGENT_ID/discover \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://docs.acme.com"}'
```

Response:

```json
{
  "urls": [
    { "url": "https://docs.acme.com/",            "title": "Acme Docs" },
    { "url": "https://docs.acme.com/quickstart",  "title": "Quickstart" },
    { "url": "https://docs.acme.com/reference",   "title": "API Reference" }
  ]
}
```

### Start the crawl

Pass the URLs you want indexed:

```bash
curl -X POST https://app.zephlo.ai/api/agents/$AGENT_ID/crawl \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selected_urls": [
      "https://docs.acme.com/",
      "https://docs.acme.com/quickstart",
      "https://docs.acme.com/reference"
    ]
  }'
# => { "id": 88, "chatbot_id": 123, "status": "pending", "pages_crawled": 0, ... }
```

The Agent's `status` moves through `pending` → `crawling` → `ready`. Poll the
crawl job to watch progress:

```bash
curl https://app.zephlo.ai/api/crawl-jobs/88 \
  -H "Authorization: Bearer $TOKEN"
# => { "status": "completed", "pages_crawled": 42, ... }
```

Once status is `completed`, the Agent is live.

### Re-crawl later

Re-crawl reuses the previously selected URLs:

```bash
curl -X POST https://app.zephlo.ai/api/agents/$AGENT_ID/recrawl \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Embed the widget

The widget is a single JavaScript file that renders a floating chat button
on your page. It talks to the API over WebSocket.

### Get an API key

From the dashboard, open your Agent → **Settings → API Keys → Create**.
Keys look like `flk_4c…ab`. **Copy it immediately** — the full value is
shown once and can't be retrieved later. Via API:

```bash
curl -X POST https://app.zephlo.ai/api/agents/$AGENT_ID/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production website"}'
# => { "id": 3, "key": "flk_4c...", "key_prefix": "flk_4c", ... }
```

### Drop the script tag into your site

The simplest possible integration:

```html
<script src="https://app.zephlo.ai/widget/zephlo.js"></script>
<script>
  Zephlo.initialize({
    key: "flk_your_api_key",
    chatbotId: "1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf"
  });
</script>
```

That's it. Open your page; the floating Agent button appears in the
bottom-right corner.

### Using the inline element

If you'd rather drop the chat panel directly into your layout (no floating
button), place a `<zephlo-chat>` element anywhere and size it how you like:

```html
<script src="https://app.zephlo.ai/widget/zephlo.js"></script>
<zephlo-chat width="420" height="620"></zephlo-chat>
<script>
  Zephlo.initialize({
    key: "flk_your_api_key",
    chatbotId: "1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf"
  });
</script>
```

Customization (colors, welcome message, greeting prompts, logo, position)
is done from the dashboard — the widget fetches it automatically.

---

## Where to go next

- **[Widget Developer Guide](./widget.md)** — register browser-side tools,
  auto-discover HTML forms, and use the WebSocket protocol directly.
- **[API Reference](./api-reference.md)** — manage Agents, documents, crawls,
  API keys, and organizations from your own backend.
- **[Troubleshooting / FAQ](./troubleshooting.md)** — when the widget doesn't
  show up, crawls stall, or auth returns 401.
