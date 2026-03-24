export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolDefinition extends ToolSchema {
  execute: (params: Record<string, unknown>) => Promise<string> | string;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (!tool.description) {
      console.warn(`[Flunkie] Tool "${tool.name}" registered without a description. Add a description for better LLM tool usage.`);
    }
    this.tools.set(tool.name, tool);
    if ((navigator as any).modelContext) {
      (navigator as any).modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (params: any) => {
          const result = await tool.execute(params);
          return { content: [{ type: "text", text: result }] };
        },
      });
    }
  }

  discoverExternal(): void {
    const mc = (navigator as any).modelContext;
    if (!mc?.tools) return;
    for (const t of mc.tools) {
      if (this.tools.has(t.name)) continue;
      this.tools.set(t.name, {
        name: t.name,
        description: t.description || "",
        inputSchema: t.inputSchema || {},
        execute: async (params) => {
          const result = await t.execute(params);
          return (result?.content || [])
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("\n");
        },
      });
    }
  }

  async execute(name: string, params: Record<string, unknown>): Promise<{ content: string; error?: string }> {
    const tool = this.tools.get(name);
    if (!tool) return { content: "", error: `Tool "${name}" not found` };
    try {
      const result = await tool.execute(params);
      return { content: result };
    } catch (err: any) {
      return { content: "", error: err?.message || "Tool execution failed" };
    }
  }

  clear(): void {
    this.tools.clear();
  }

  getSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }

  get webMcpSupported(): boolean {
    return !!(navigator as any).modelContext;
  }
}

export const toolRegistry = new ToolRegistry();
