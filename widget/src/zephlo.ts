import { setApiKey } from "./api";
import type { McpToolResult } from "./api";
import { toolRegistry } from "./webmcp";
import type { ToolDefinition } from "./webmcp";
import { FormScanner } from "./form-scanner";

// Set flag BEFORE the custom element auto-injects
(window as any).__ZEPHLO_SDK__ = true;

// Import index to register the custom element (but skip auto-inject)
import "./index";
import { ChatbotWidget } from "./index";

export interface ZephloOptions {
  key: string;
  chatbotId: string;
  apiUrl?: string;
}

export interface ZephloInstance {
  onToolResult(cb: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  webMcpTools(): { name: string; description: string; inputSchema: Record<string, unknown> }[];
  scanForms(): void;
  destroy(): void;
}

function initialize(options: ZephloOptions): ZephloInstance {
  const { key, chatbotId, apiUrl } = options;
  if (!key.startsWith("flk_")) throw new Error("Invalid API key format");

  // Clean up any existing widget (e.g. from React StrictMode remount)
  document.querySelectorAll("chatbot-widget").forEach((el) => el.remove());
  document.querySelectorAll("script[data-chatbot-id]").forEach((el) => el.remove());
  toolRegistry.clear();

  setApiKey(key);

  // Create a script element for getScriptConfig() to find
  const scriptEl = document.createElement("script");
  scriptEl.dataset.chatbotId = String(chatbotId);
  // Store as string for widget to pick up
  if (apiUrl) (window as any).FLAPI = apiUrl;
  document.head.appendChild(scriptEl);

  // Create the widget
  const widget = document.createElement("chatbot-widget") as ChatbotWidget;
  document.body.appendChild(widget);

  // Auto-scan HTML forms with zephlo-tool-name attributes
  const formScanner = new FormScanner();
  formScanner.scan();
  formScanner.observe();

  return {
    onToolResult(cb) {
      return widget.onMcpResult(cb);
    },
    registerTool(tool: ToolDefinition) {
      toolRegistry.register(tool);
    },
    sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean) {
      widget.sendContextUpdate(data, includePageDetails);
    },
    webMcpTools() {
      return toolRegistry.getSchemas();
    },
    scanForms() {
      formScanner.scan();
    },
    destroy() {
      formScanner.disconnect();
      toolRegistry.clear();
      widget.remove();
      scriptEl.remove();
    },
  };
}

export const navigateProp = {
  navigate: {
    type: 'boolean',
    description: 'If true, minimize the chat so the user can see the result on the page',
  },
} as const;

const Zephlo = { initialize };
export default Zephlo;

// For IIFE/script tag usage
if (typeof window !== "undefined") {
  (window as any).Zephlo = Zephlo;
}
