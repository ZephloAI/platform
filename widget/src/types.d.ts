export interface ThemeColors {
  headerColor?: string;
  userBubbleColor?: string;
  assistantBubbleColor?: string;
  textColor?: string;
  bgColor?: string;
}

export type ThemeMode = "auto" | "light" | "dark";

export interface ThemeOptions {
  mode?: ThemeMode;
  light?: ThemeColors;
  dark?: ThemeColors;
}

export interface ZephloOptions {
  key: string;
  chatbotId: string;
  apiUrl?: string;
  theme?: ThemeOptions;
}

export interface McpToolResult {
  tool_name: string;
  meta: Record<string, unknown>;
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<string> | string;
}

export declare const navigateProp: {
  readonly navigate: {
    readonly type: 'boolean';
    readonly description: string;
  };
};

export type CooldownPolicy =
  | "session"
  | "once"
  | { minutes: number }
  | null;

export interface TriggerOptions {
  mode?: "open" | "prompt";
  cooldown?: CooldownPolicy;
  pageContext?: Record<string, unknown>;
}

export interface ZephloInstance {
  onToolResult(cb: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  webMcpTools(): { name: string; description: string; inputSchema: Record<string, unknown> }[];
  scanForms(): void;
  trigger(id: string, prompt: string, options?: TriggerOptions): Promise<{ fired: boolean }>;
  destroy(): void;

  theme: ThemeMode;
  headerColor: string;
  userBubbleColor: string;
  assistantBubbleColor: string;
  textColor: string;
  bgColor: string;
  setColors(mode: "light" | "dark", colors: ThemeColors): void;
}

interface Zephlo {
  initialize(options: ZephloOptions): ZephloInstance;
  trigger(id: string, prompt: string, options?: TriggerOptions): Promise<{ fired: boolean }>;
}

declare const Zephlo: Zephlo;
export default Zephlo;

// WebMCP browser API type declarations (W3C Draft Community Group Report)
interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>, agent?: ModelContextAgent): Promise<ModelContextToolResult>;
}

interface ModelContextToolResult {
  content: { type: string; text: string }[];
}

interface ModelContextAgent {
  requestUserInteraction(callback: () => void): void;
}

interface ModelContext {
  tools: ModelContextTool[];
  registerTool(tool: ModelContextTool): void;
  removeTool(name: string): void;
  provideContext(context: { tools: ModelContextTool[] }): void;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}
