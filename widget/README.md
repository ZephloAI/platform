# Zephlo

AI chatbot widget for your website. Add a fully-featured chat assistant with a single script tag or npm install.

## Quick Start

### Script Tag

The fastest way to get started. Add this to your HTML:

```html
<script src="https://your-zephlo-instance.com/widget/zephlo.js"></script>
<script>
  Zephlo.initialize({
    key: "YOUR_API_KEY",
    chatbotId: 1
  });
</script>
```

### npm

```bash
npm install zephlo
```

```js
import Zephlo from "zephlo";

const widget = Zephlo.initialize({
  key: "YOUR_API_KEY",
  chatbotId: 1
});
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `key` | `string` | Yes | Your Zephlo API key |
| `chatbotId` | `number` | Yes | The ID of your chatbot agent |
| `apiUrl` | `string` | No | Custom API URL (defaults to your Zephlo instance) |

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
