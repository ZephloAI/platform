# Flunkie Tools — Give Your Chatbot Superpowers

Register tools so your Flunkie chatbot can **do things** on your website — add items to cart, look up user info, search products, navigate pages, and more.

## Quick Start

### Script Tag (simplest)

```html
<script
  src="https://your-domain.com/widget/chatbot-widget.js"
  data-chatbot-id="YOUR_ID"
></script>

<script>
  // Wait for widget to load, then register tools
  function setupTools() {
    const widget = document.querySelector("chatbot-widget");
    if (!widget?.registerTool) return setTimeout(setupTools, 200);

    widget.registerTool({
      name: "add_to_cart",
      description: "Add a product to the shopping cart",
      inputSchema: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product name" },
          quantity: { type: "integer", description: "How many to add" },
        },
        required: ["item"],
      },
      execute: (params) => {
        // Your logic here — add to cart, call an API, update the DOM, etc.
        addToCart(params.item, params.quantity || 1);
        return `Added ${params.quantity || 1}x ${params.item} to cart`;
      },
    });
  }

  setupTools();
</script>
```

### SDK (npm)

```js
import Flunkie from "flunkie";

const flunkie = Flunkie.initialize({
  key: "flk_your_api_key",
  chatbotId: 123,
});

flunkie.registerTool({
  name: "add_to_cart",
  description: "Add a product to the shopping cart",
  inputSchema: {
    type: "object",
    properties: {
      item: { type: "string", description: "Product name" },
      quantity: { type: "integer", description: "How many to add" },
    },
    required: ["item"],
  },
  execute: (params) => {
    addToCart(params.item, params.quantity || 1);
    return `Added ${params.quantity || 1}x ${params.item} to cart`;
  },
});
```

## How It Works

```
User: "Add 2 wireless headphones to my cart"
    ↓
Chatbot sees the add_to_cart tool and calls it
    ↓
Your execute() function runs on the page
    ↓
Chatbot responds: "Done! I've added 2 wireless headphones to your cart."
```

Tools are sent to the agent when the chat connects. The agent decides when to call them based on the conversation. Your `execute` function runs in the browser and the result is sent back to the agent.

## Tool Definition

```js
{
  name: "tool_name",           // Unique identifier (snake_case)
  description: "What it does", // The LLM reads this to decide when to use it
  inputSchema: { ... },        // JSON Schema for parameters
  execute: (params) => "...",  // Your function — runs in the browser
}
```

### inputSchema

Standard [JSON Schema](https://json-schema.org/) format:

```js
inputSchema: {
  type: "object",
  properties: {
    query: { type: "string", description: "Search term" },
    limit: { type: "integer", description: "Max results" },
  },
  required: ["query"],  // Optional params get defaults
}
```

Supported types: `string`, `integer`, `number`, `boolean`, `array`, `object`

### execute

Your function receives the parameters as an object and returns a string (sync or async):

```js
// Sync
execute: (params) => {
  return `Found ${results.length} items`;
}

// Async
execute: async (params) => {
  const data = await fetch(`/api/search?q=${params.query}`);
  return JSON.stringify(await data.json());
}
```

## Examples

### Read page info

```js
widget.registerTool({
  name: "get_page_info",
  description: "Returns the current page title and URL",
  inputSchema: { type: "object", properties: {} },
  execute: () => `Title: ${document.title}, URL: ${location.href}`,
});
```

### Search products

```js
widget.registerTool({
  name: "search_products",
  description: "Search the product catalog",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search term" },
      max_results: { type: "integer", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  execute: async (params) => {
    const res = await fetch(`/api/products?q=${params.query}&limit=${params.max_results || 5}`);
    const products = await res.json();
    return products.map(p => p.name).join(", ");
  },
});
```

### Navigate to a page

```js
widget.registerTool({
  name: "navigate",
  description: "Navigate the user to a page on the website",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "URL path like /pricing or /contact" },
    },
    required: ["path"],
  },
  execute: (params) => {
    window.location.href = params.path;
    return `Navigating to ${params.path}`;
  },
});
```

### Submit a form

```js
widget.registerTool({
  name: "submit_lead",
  description: "Submit the user's contact info as a lead",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Full name" },
      email: { type: "string", description: "Email address" },
    },
    required: ["name", "email"],
  },
  execute: async (params) => {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return `Thanks ${params.name}, we'll reach out to ${params.email}`;
  },
});
```

## Declarative Forms (Zero JS)

Turn any HTML form into an agent-callable tool by adding `flunkie-` attributes. No JavaScript required.

### Basic Example

```html
<form
  flunkie-tool-name="submit_lead"
  flunkie-tool-description="Submit the user's contact info as a lead"
>
  <input name="name" type="text" required
    flunkie-param-description="Full name" />

  <input name="email" type="email" required
    flunkie-param-description="Email address" />

  <textarea name="message"
    flunkie-param-description="Optional message"></textarea>

  <button type="submit">Submit</button>
</form>
```

The widget auto-scans for forms with `flunkie-tool-name` and registers them as tools. The agent can then fill in the form fields on behalf of the user.

### Two Modes

**Fill-only (default):** The agent populates the form fields and the user reviews before submitting.

```
Agent calls submit_lead(name="Jane", email="jane@example.com")
  → Form fields get populated visually
  → Agent responds: "I've filled in the form. Please review and submit."
```

**Auto-submit:** Add `flunkie-auto-submit` to let the agent submit the form too.

```html
<form
  flunkie-tool-name="search_flights"
  flunkie-tool-description="Search for available flights"
  flunkie-auto-submit
>
  <input name="origin" type="text" required
    flunkie-param-description="Departure airport code (e.g. JFK)" />
  <input name="destination" type="text" required
    flunkie-param-description="Arrival airport code (e.g. LHR)" />
  <button type="submit">Search</button>
</form>

<script>
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.agentInvoked) {
      // Agent triggered this — return a result
      e.respondWith(fetch("/api/flights?" + new URLSearchParams(new FormData(e.target)))
        .then(r => r.json())
        .then(data => `Found ${data.length} flights`));
    } else {
      // User clicked submit — handle normally
    }
  });
</script>
```

### Attribute Reference

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `flunkie-tool-name` | `<form>` | Tool name (required to enable scanning) |
| `flunkie-tool-description` | `<form>` | Tool description for the LLM |
| `flunkie-auto-submit` | `<form>` | If present, agent submits the form after filling |
| `flunkie-param-description` | `<input>`, `<select>`, `<textarea>` | Parameter description for the LLM |

HTML validation attributes (`required`, `min`, `max`, `pattern`, `minlength`, `maxlength`) are automatically mapped to JSON Schema constraints. `<select>` options become `enum` values. Input `type` determines the JSON Schema type (`number` for number/range, `boolean` for checkbox, `string` for everything else).

### Returning Results (Auto-Submit)

When using `flunkie-auto-submit`, the submit event has two extra properties:

- **`event.agentInvoked`** — `true` when the agent triggered the submit
- **`event.respondWith(promise)`** — call this with a `Promise<string>` to send a result back to the agent

If you don't call `respondWith()`, the agent gets a default "Form submitted successfully" response.

### Dynamic Forms

Forms added to the page after load are automatically picked up via MutationObserver. For forms inside Shadow DOM, use the SDK:

```js
const flunkie = Flunkie.initialize({ key: "flk_...", chatbotId: 123 });
// After adding forms to the page:
flunkie.scanForms();
```

### Supported Input Types

| Input Type | JSON Schema Type |
|------------|-----------------|
| text, email, url, tel, search, date, time | `string` |
| number, range | `number` |
| checkbox | `boolean` |
| radio (group) | `string` with `enum` |
| select | `string` with `enum` |
| textarea | `string` |
| file, submit, button | Skipped |

## Tips

- **Descriptions matter.** The LLM reads them to decide when to call your tool. Be specific: "Add a product to the shopping cart" is better than "cart tool".
- **Return useful strings.** The agent uses your return value to craft its response to the user.
- **Keep it simple.** One tool per action. Don't make a single tool that does 10 things.
- **Register tools early.** Register before the user sends their first message. Tools are sent to the agent when the chat WebSocket connects.
- **Async is fine.** `execute` can return a string or a `Promise<string>`.
