export interface FlunkieOptions {
  key: string;
  chatbotId: number;
  apiUrl?: string;
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

export interface FlunkieInstance {
  onToolResult(cb: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  webMcpTools(): { name: string; description: string; inputSchema: Record<string, unknown> }[];
  scanForms(): void;
  destroy(): void;
}

interface Flunkie {
  initialize(options: FlunkieOptions): FlunkieInstance;
}

declare const Flunkie: Flunkie;
export default Flunkie;

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
