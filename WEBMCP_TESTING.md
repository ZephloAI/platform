# WebMCP Integration — Testing Guide

## Prerequisites

- All services running via `docker compose up -d`
- Alembic migration 012 applied (`docker compose exec api alembic upgrade head`)
- Widget built (`cd widget && npm run build`)

---

## 1. Enable WebMCP for a Chatbot

Go to your dashboard → select a chatbot → **Tools** tab → toggle **Browser Tools (WebMCP)** on.

---

## 2. Test SDK `registerTool`

On any page with the widget, open the browser console and run:

```js
const bot = Zephlo.initialize({ key: "flk_your_key", chatbotId: YOUR_ID });

bot.registerTool({
  name: "add_to_cart",
  description: "Add an item to the shopping cart",
  inputSchema: {
    type: "object",
    properties: { item: { type: "string" } },
    required: ["item"]
  },
  execute: async (params) => {
    console.log("Tool called with:", params);
    return `Added ${params.item} to cart`;
  }
});

// Verify it's registered
console.log("Tools:", bot.webMcpTools());
```

Then ask the chatbot something like **"Add a blue t-shirt to my cart"** — the agent should call the `add_to_cart` tool, you'll see the console log, and the result flows back.

---

## 3. Test WebMCP Browser Mirror

If you're on Chrome 146+ Canary with the WebMCP flag enabled (`chrome://flags → WebMCP for testing`):

```js
// Check tool was mirrored to navigator.modelContext
console.log(navigator.modelContext?.tools);
```

---

## 4. Test External Tool Discovery

Register a tool directly via the browser API, then check our chatbot picks it up:

```js
navigator.modelContext.registerTool({
  name: "search_products",
  description: "Search the product catalog",
  inputSchema: { type: "object", properties: { query: { type: "string" } } },
  execute: async (params) => ({
    content: [{ type: "text", text: `Found 3 results for "${params.query}"` }]
  })
});
```

Then send a chat message — the `search_products` tool should appear in the tools the widget sends to the agent.

---

## 5. Test Toggle Off

Turn WebMCP off in the dashboard → the agent should no longer receive or use browser tools, even if they're registered.

---

## 6. Test Graceful Degradation

On any browser without `navigator.modelContext` (most browsers today), the SDK tools still work via the WebSocket bridge — only the WebMCP mirror is silently skipped. Verify no errors in the console.

---

## Expected Behavior Summary

| Scenario | Result |
|----------|--------|
| `registerTool()` via SDK | Tool available to chatbot + mirrored to `navigator.modelContext` |
| External `navigator.modelContext` tool | Discovered and available to chatbot |
| Agent calls browser tool | WS bridge: `webmcp_tool_call` → browser executes → `webmcp_tool_result` |
| `webmcp_enabled` = false | Agent ignores browser tools |
| No `navigator.modelContext` in browser | SDK tools work via WS, WebMCP mirror silently skipped |
| Old widget embed (no SDK) | Fully backward compatible, no changes |
