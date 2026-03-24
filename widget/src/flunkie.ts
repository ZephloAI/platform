import { setApiKey } from "./api";
import type { McpToolResult } from "./api";
import { toolRegistry } from "./webmcp";
import type { ToolDefinition } from "./webmcp";
import { FormScanner } from "./form-scanner";

// Set flag BEFORE the custom element auto-injects
(window as any).__FLUNKIE_SDK__ = true;

// Import index to register the custom element (but skip auto-inject)
import "./index";
import { ChatbotWidget } from "./index";

export interface FlunkieOptions {
  key: string;
  chatbotId: number;
  apiUrl?: string;
}

export interface FlunkieInstance {
  onToolResult(cb: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  webMcpTools(): { name: string; description: string; inputSchema: Record<string, unknown> }[];
  scanForms(): void;
  destroy(): void;
}

function initialize(options: FlunkieOptions): FlunkieInstance {
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
  if (apiUrl) scriptEl.dataset.apiUrl = apiUrl;
  document.head.appendChild(scriptEl);

  // Create the widget
  const widget = document.createElement("chatbot-widget") as ChatbotWidget;
  document.body.appendChild(widget);

  // Auto-scan HTML forms with flunkie-tool-name attributes
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

const Flunkie = { initialize };
export default Flunkie;

// For IIFE/script tag usage
if (typeof window !== "undefined") {
  (window as any).Flunkie = Flunkie;
}
