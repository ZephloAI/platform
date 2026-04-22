# Widget Developer Guide

The Zephlo widget is an embeddable web component that puts your Agent on
any page. This guide covers what developers need to build against it:
the script tag and inline element, the `registerTool` SDK, HTML-form
auto-discovery, and the WebSocket protocol used to call browser-side tools.

If you just want the "paste this into your site" version, start with
[Getting Started](./getting-started.md#3-embed-the-widget).

---

## The script

```
https://app.zephlo.ai/widget/zephlo.js
```

This single file registers two custom elements (`<zephlo-fab>` and
`<zephlo-chat>`), exposes a global `Zephlo` SDK, and auto-scans the page
for tool forms.

### Two embed modes

**Floating button (default).** Click a bubble in the corner to open the
chat. Good for product sites where chat should be optional.

```html
<script src="https://app.zephlo.ai/widget/zephlo.js"></script>
<script>
  Zephlo.initialize({
    key: "flk_your_api_key",
    chatbotId: "1f3b9a62-82d1-4a17-9e2f-3c0a6d9a11bf"
  });
</script>
```

`Zephlo.initialize` returns an SDK handle (see below). If you don't call it,
the widget will fall back to reading `data-chatbot-id` off the script tag
for backwards compatibility — but you'll have no API key, and the SDK
methods won't be wired.

**Inline element.** Drop the chat panel directly into your layout with no
floating button. The chat is always open and fills its container.

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

`width` / `height` accept a number (treated as pixels) or any CSS length.
Omit them to let the element fill its parent.

You can mix modes on the same page — add both `<zephlo-chat>` and let the
floating button render itself; they share the same conversation state.

### `Zephlo.initialize` options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `key` | `string` | yes | — | API key for the Agent. Must start with `flk_`. |
| `chatbotId` | `string` | yes | — | The Agent's UUID (`public_id`). Numeric IDs are not accepted. |
| `apiUrl` | `string` | no | `https://app.zephlo.ai` | Override for self-hosted deployments. |

### SDK handle

`Zephlo.initialize(...)` returns an object with these methods:

```ts
interface ZephloInstance {
  registerTool(tool: ToolDefinition): void;
  onToolResult(cb: (results: McpToolResult[]) => void): () => void;
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  webMcpTools(): { name: string; description: string; inputSchema: object }[];
  scanForms(): void;
  destroy(): void;
}
```

---

## Registering browser-side tools

Tools let the Agent do things in the visitor's browser — add to cart, scroll
to a section, open a modal, fill a form, whatever your page can do.

### `registerTool(tool)`

```js
const zephlo = Zephlo.initialize({ key, chatbotId });

zephlo.registerTool({
  name: "add_to_cart",
  description: "Add a product to the shopping cart by SKU.",
  inputSchema: {
    type: "object",
    properties: {
      sku: { type: "string", description: "The product SKU." },
      quantity: { type: "number", description: "How many to add." }
    },
    required: ["sku"]
  },
  execute: async ({ sku, quantity = 1 }) => {
    await window.cart.add(sku, quantity);
    return `Added ${quantity} × ${sku} to cart.`;
  }
});
```

- `name` is what the LLM sees and calls.
- `description` should read like a short man-page entry — the model uses it
  to decide *when* to call the tool. Skipping it logs a console warning.
- `inputSchema` is a standard JSON Schema object. Types and constraints
  (`enum`, `minimum`, `maximum`, `minLength`, `pattern`) are passed through
  to the agent-side signature.
- `execute` receives the parsed arguments and must return a `string` (or
  promise of one). That string is what the agent sees as the tool's output.

Tools registered this way are also mirrored onto `navigator.modelContext`
when the browser implements the WebMCP draft, so any WebMCP-aware agent on
the page sees them too.

### Removing or re-registering tools

Re-registering with the same `name` replaces the previous definition.
`zephlo.destroy()` tears down the registry and the form scanner — useful in
framework hot-reload / `StrictMode` double-mount scenarios.

### Inspecting the current registry

```js
console.log(zephlo.webMcpTools());
// [{ name, description, inputSchema }, ...]
```

### Listening for tool-result events

When the agent calls a tool that returns content, that content is surfaced
back to your page too:

```js
const unsubscribe = zephlo.onToolResult((results) => {
  for (const r of results) {
    console.log(`${r.tool_name} →`, r.content, r.meta);
  }
});
```

---

## HTML form auto-discovery

Any `<form>` with a `zephlo-tool-name` attribute is automatically registered
as a tool. The widget scans once on init and then watches the DOM via
`MutationObserver`, so forms injected later are picked up too.

### Minimal example

```html
<form zephlo-tool-name="subscribe_newsletter"
      zephlo-tool-description="Subscribe the current visitor to our newsletter."
      zephlo-auto-submit
      action="/api/subscribe" method="post">
  <input type="email" name="email" required
         zephlo-param-description="The visitor's email address.">
  <select name="cadence"
          zephlo-param-description="How often they want emails.">
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
  </select>
  <button type="submit">Subscribe</button>
</form>
```

What happens:

- `zephlo-tool-name` turns this form into a tool called `subscribe_newsletter`.
- The JSON Schema is built from the inputs automatically:
  - `<input type="email" required>` → `{ type: "string" }`, marked required.
  - `<select>` → `{ type: "string", enum: ["weekly","monthly"] }`.
  - `zephlo-param-description` becomes the field's JSON Schema `description`.
- Numeric constraints (`min`, `max`), string constraints (`minlength`,
  `maxlength`, `pattern`), and radio groups (collected as `enum`) are all
  mapped through. `type="file"` is skipped — the agent can't set those.

### Attributes

| Attribute | On | What it does |
|---|---|---|
| `zephlo-tool-name` | `<form>` | Registers the form as a tool of this name. Required. |
| `zephlo-tool-description` | `<form>` | Tool description for the LLM. |
| `zephlo-auto-submit` | `<form>` | After filling, dispatch the submit event and return its result. Without it the tool just populates the form and waits for the human to click submit. |
| `zephlo-result` | `<form>` (read at runtime) | If set after submit, its value is returned to the agent as the tool's output. Cleared after read. |
| `zephlo-param-description` | `<input> / <select> / <textarea>` | JSON Schema `description` for that parameter. |

### Controlling the submit result

For `zephlo-auto-submit` forms, there are three ways to report back:

1. **Nothing fancy** — default string `"Form submitted successfully"` is sent.
2. **Set `zephlo-result`** from your own submit handler before or during submission:
   ```js
   form.addEventListener("submit", (e) => {
     e.preventDefault();
     // ...do the submit...
     form.setAttribute("zephlo-result", "Subscribed as weekly.");
   });
   ```
3. **Use `event.respondWith(Promise)`** — the widget dispatches a submit event
   marked with `event.agentInvoked = true` and an `event.respondWith` method.
   Resolve a promise with the string you want the agent to see:
   ```js
   form.addEventListener("submit", (e) => {
     if (!e.agentInvoked) return;              // regular human submit
     e.preventDefault();
     e.respondWith((async () => {
       const r = await fetch(form.action, { method: "post", body: new FormData(form) });
       return r.ok ? "Subscribed." : "Subscription failed.";
     })());
   });
   ```

### Forcing a re-scan

If you render forms in a framework that doesn't mutate the main DOM (for
example, rendering inside a shadow root your app owns), call
`zephlo.scanForms()` after the forms exist.

---

## WebSocket protocol

The widget opens a single WebSocket to the API and uses it for chat
messages, page → agent context, agent → page tool calls, and live
notifications. You rarely need to read this level of detail unless you're
building something custom (a native SDK, an alternative widget, etc.).

### Connecting

```
GET wss://app.zephlo.ai/ws/chat?session_id=<session-uuid>&chatbot_id=<agent-uuid>
```

Get `session_id` first by POSTing to `/api/session` (see
[API Reference → Sessions](./api-reference.md#sessions)). `chatbot_id` is
the Agent UUID.

### `init` — first frame (client → server)

The widget always sends an init frame as the first message. It announces
every tool currently in the registry:

```json
{
  "message_type": "init",
  "zephlo_tools": [
    {
      "name": "add_to_cart",
      "description": "Add a product to the shopping cart by SKU.",
      "inputSchema": { "type": "object", "properties": { "sku": { "type": "string" } }, "required": ["sku"] }
    }
  ]
}
```

The agent uses these schemas to build the LLM tool surface for this session.

### `chat` — user message (client → server)

```json
{ "message_type": "chat", "message": "How do I cancel my subscription?" }
```

The server replies with a single frame per message (typed `response`):

```json
{
  "message_type": "response",
  "response": "You can cancel anytime from Settings → Billing.",
  "sources": [{ "url": "https://docs.acme.com/billing", "title": "Billing" }],
  "session_id": "…",
  "follow_up_prompts": [{ "title": "Open billing settings", "link": "/settings/billing" }],
  "audio": null,
  "mcp_results": null
}
```

### `web_tool_call` — agent invokes a tool (server → client)

```json
{
  "message_type": "web_tool_call",
  "call_id": "9e1d2c3a-…",
  "details": {
    "tool": "add_to_cart",
    "arguments": { "sku": "ACME-42", "quantity": 2 }
  }
}
```

`call_id` is a UUID that correlates this request with the reply.

### `tool_result` — client returns the result (client → server)

```json
{
  "message_type": "tool_result",
  "call_id": "9e1d2c3a-…",
  "content": "Added 2 × ACME-42 to cart.",
  "error": null
}
```

Echo the exact `call_id` back. On error, set `error` to a short message and
leave `content` empty — the agent will relay the error to the LLM as tool output.

### The 30-second timeout

If the server doesn't receive a matching `tool_result` within **30 seconds**
it gives up on that call, tells the LLM the tool timed out, and continues the
conversation. Any late `tool_result` with an already-expired `call_id` is
logged as "orphaned" and discarded. Keep your `execute` functions bounded —
if you need a long-running action, kick it off and return a "queued" message
so the agent can respond.

### Other frames worth knowing

| Frame | Direction | Purpose |
|---|---|---|
| `context_update` | client → server | Send arbitrary page context (`data`), optionally merged with `{url, title, meta_description}` when `includePageDetails` is true. |
| `trigger` | client → server | Fire a manual prompt (`prompt`, `trigger_id`, `mode`) — used for on-page triggers. |
| `switch_to_person` | client → server | Hand the session over to a human team member. |
| `waiting` | server → client | Sent when the human-handoff is pending — UI should show a waiting state. |
| `navigate` | server → client | Agent wants the page to go somewhere: `{ url }` means full redirect; no `url` means "minimize so the user can see what just happened". |
| `admin_message` | server → client | Message written by a human operator in live chat. |
| `mode_changed` | server → client | `{ mode: "ai" | "person" }` — current handler for the session. |
| `error` | server → client | Terminal error for the last request. |

### Connection lifecycle

- The client opens one socket per session and reuses it for every turn.
- On reconnect, it sends a new `init` frame so tool schemas stay in sync.
- If you add a tool mid-session via `registerTool`, the schema change is
  picked up on the next connect; the widget does not currently push
  registry updates mid-session.

---

## Self-hosted deployments

Point the widget at your own API by setting `apiUrl` in `Zephlo.initialize`:

```js
Zephlo.initialize({
  key: "flk_...",
  chatbotId: "1f3b9a62-...",
  apiUrl: "https://agents.mycompany.com"
});
```

Your instance must serve the widget script from the same origin
(`/widget/zephlo.js`) and the `/ws/chat` WebSocket endpoint, otherwise
the widget will fail to connect.

---

## See also

- [API Reference → Sessions](./api-reference.md#sessions) — how to mint the
  `session_id` used in the WebSocket URL.
- [Troubleshooting](./troubleshooting.md) — widget-specific failure modes.
