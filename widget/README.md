# Zephlo

AI chatbot widget for your website. Add a fully-featured chat assistant with a single script tag or npm install.

## Quick Start

### Script Tag (zero config)

The fastest way to get started — the floating button is injected for you:

```html
<script
  src="https://unpkg.com/zephlo/dist/zephlo.js"
  data-chatbot-id="YOUR_AGENT_ID"
></script>
```

### SDK (script tag or npm)

With the SDK you call `Zephlo.initialize()` and place a `<zephlo-fab>` (floating button)
or `<zephlo-chat>` (inline) element yourself.

```html
<script src="https://unpkg.com/zephlo/dist/zephlo.js"></script>
<zephlo-fab></zephlo-fab>
<script>
  const widget = Zephlo.initialize({
    key: "flk_your_api_key",
    chatbotId: "YOUR_AGENT_ID"
  });
</script>
```

```bash
npm install zephlo
```

```js
import Zephlo from "zephlo";

const widget = Zephlo.initialize({
  key: "flk_your_api_key",
  chatbotId: "YOUR_AGENT_ID"
});
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `key` | `string` | Yes | Your Zephlo API key (starts with `flk_`) |
| `chatbotId` | `string` | Yes | Your agent's UUID |
| `apiUrl` | `string` | No | Custom API URL (defaults to `https://app.zephlo.ai`) |
| `theme` | `object` | No | Colors and light/dark mode (`mode`, `light`, `dark`) |

## Features

- Customizable colors, fonts, and dimensions
- Logo upload or default chat icon
- Quick prompts and follow-up suggestions
- Greeting bubbles on hover
- Voice input and spoken responses
- Widget positions: bottom-left, bottom-right, left sidebar, right sidebar
- WebMCP browser tool integration
- MCP server connections for external tools
- Responsive and mobile-friendly
- Full TypeScript support

## SDK Methods

The object returned by `Zephlo.initialize()` exposes these methods:

### `onToolResult(callback)`

Listen for MCP tool results from the agent.

```js
const unsubscribe = widget.onToolResult((results) => {
  console.log("Tool results:", results);
});

// Stop listening
unsubscribe();
```

### `registerTool(tool)`

Register a custom tool the agent can call in the browser.

```js
widget.registerTool({
  name: "get_cart_total",
  description: "Returns the current shopping cart total",
  inputSchema: { type: "object", properties: {} },
  execute: async () => {
    return JSON.stringify({ total: "$42.00" });
  }
});
```

### `sendContextUpdate(data, includePageDetails?)`

Send context data to the agent (e.g. user info, page state).

```js
widget.sendContextUpdate({
  userId: "abc123",
  plan: "pro"
}, true); // true = include current page URL and title
```

### `trigger(id, prompt, options?)`

Fire a proactive message from the agent. `prompt` is an instruction the agent turns
into a reply. Supports display `mode` (`"open"` | `"prompt"`), a `cooldown` policy
(`"session"` | `"once"` | `{ minutes }` | `null`), and `pageContext`.

```js
widget.trigger("pricing_help", "Offer to answer questions about our pricing", {
  mode: "prompt",
  cooldown: "session"
});
```

### `scanForms()`

Force an immediate re-scan for `zephlo-tool-name` forms (they're auto-detected otherwise).

### Theme controls

Read/write the live theme: `widget.theme = "dark"`, `widget.headerColor = "#ff3b30"`,
and `widget.setColors("dark", { bgColor: "#000" })`.

### `destroy()`

Remove the widget from the page.

```js
widget.destroy();
```

## TypeScript

Full type definitions are included. Import types directly:

```ts
import Zephlo from "zephlo";
import type { ZephloOptions, ZephloInstance, ToolDefinition } from "zephlo";
```

## License

[Elastic License 2.0 (ELv2)](https://www.elastic.co/licensing/elastic-license)
