/**
 * Zephlo SDK entry point.
 *
 * Minimal API — just `Zephlo.initialize({ key, chatbotId })` configures
 * the shared core. Users then place `<zephlo-fab>` or `<zephlo-chat>`
 * elements in their HTML to render the FAB or the inline chat view.
 */

import { zephloCore } from "./zephlo-core";
import { toolRegistry, type ToolDefinition } from "./webmcp";
import type { McpToolResult } from "./api";
import { FormScanner } from "./form-scanner";

// Set flag BEFORE the custom element auto-injects so we skip the
// backwards-compat `<zephlo-fab>` fallback injection.
(window as any).__ZEPHLO_SDK__ = true;

// Import index to register the custom elements
import "./index";

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

let formScanner: FormScanner | null = null;

function initialize(options: ZephloOptions): ZephloInstance {
  const { key, chatbotId, apiUrl } = options;
  if (!key.startsWith("flk_")) throw new Error("Invalid API key format");

  // Clean up any prior instance (e.g. React StrictMode double-mount)
  toolRegistry.clear();

  // Configure the shared core — this is the ONLY thing initialize does.
  // No DOM work. Users render `<zephlo-fab>` / `<zephlo-chat>` themselves.
  zephloCore.configure({ key, chatbotId: String(chatbotId), apiUrl });

  // Auto-scan HTML forms with zephlo-tool-name attributes
  formScanner?.disconnect();
  formScanner = new FormScanner();
  formScanner.scan();
  formScanner.observe();

  return {
    onToolResult(cb) {
      return zephloCore.registerMcpListener(cb);
    },
    registerTool(tool: ToolDefinition) {
      toolRegistry.register(tool);
    },
    sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean) {
      zephloCore.sendContextUpdate(data, includePageDetails);
    },
    webMcpTools() {
      return toolRegistry.getSchemas();
    },
    scanForms() {
      formScanner?.scan();
    },
    destroy() {
      formScanner?.disconnect();
      formScanner = null;
      zephloCore.destroy();
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
