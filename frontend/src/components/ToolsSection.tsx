import { useState } from 'react';
import { useUpdateWidgetSettings } from '../hooks/useChatbots';
import type { Chatbot, MCPServer, WidgetSettings } from '../types';

// ============================================================
// ToolsSection
// Manages MCP server connections for the chatbot.
// ============================================================

type ToolsTab = 'mcp-servers';

interface ToolsSectionProps {
  chatbot: Chatbot;
  activeTab: ToolsTab;
}

interface HeaderEntry {
  key: string;
  value: string;
}

function ToolsSection({ chatbot, activeTab }: ToolsSectionProps) {
  const updateMutation = useUpdateWidgetSettings();

  const [servers, setServers] = useState<MCPServer[]>(chatbot.mcp_servers || []);
  const [webMcpEnabled, setWebMcpEnabled] = useState(chatbot.webmcp_enabled || false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTransport, setFormTransport] = useState<'sse' | 'streamable-http'>('sse');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formHeaders, setFormHeaders] = useState<HeaderEntry[]>([]);

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormTransport('sse');
    setFormEnabled(true);
    setFormHeaders([]);
  };

  const openAddForm = () => {
    resetForm();
    setEditingIndex(null);
    setIsAdding(true);
  };

  const openEditForm = (index: number) => {
    const server = servers[index];
    if (!server) return;
    setFormName(server.name);
    setFormUrl(server.url);
    setFormTransport(server.transport);
    setFormEnabled(server.enabled);
    setFormHeaders(
      server.headers
        ? Object.entries(server.headers).map(([key, value]) => ({ key, value }))
        : []
    );
    setIsAdding(false);
    setEditingIndex(index);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingIndex(null);
    resetForm();
  };

  const saveServers = (updated: MCPServer[]) => {
    setServers(updated);
    const settings: WidgetSettings = {
      widget_icon: chatbot.widget_icon,
      widget_welcome: chatbot.widget_welcome,
      widget_position: chatbot.widget_position,
      quick_prompts: chatbot.quick_prompts,
      follow_up_prompts: chatbot.follow_up_prompts,
      greeting_prompts: chatbot.greeting_prompts,
      greeting_prompt_duration: chatbot.greeting_prompt_duration,
      widget_logo_url: chatbot.widget_logo_url,
      widget_width: chatbot.widget_width,
      widget_height: chatbot.widget_height,
      widget_header_color: chatbot.widget_header_color,
      widget_user_bubble_color: chatbot.widget_user_bubble_color,
      widget_assistant_bubble_color: chatbot.widget_assistant_bubble_color,
      widget_font_family: chatbot.widget_font_family,
      widget_font_size: chatbot.widget_font_size,
      widget_text_color: chatbot.widget_text_color,
      voice_enabled: chatbot.voice_enabled,
      mcp_servers: updated,
      webmcp_enabled: webMcpEnabled,
    };
    updateMutation.mutate({ chatbotId: chatbot.id, settings });
  };

  const saveWebMcpToggle = (enabled: boolean) => {
    setWebMcpEnabled(enabled);
    const settings: WidgetSettings = {
      widget_icon: chatbot.widget_icon,
      widget_welcome: chatbot.widget_welcome,
      widget_position: chatbot.widget_position,
      quick_prompts: chatbot.quick_prompts,
      follow_up_prompts: chatbot.follow_up_prompts,
      greeting_prompts: chatbot.greeting_prompts,
      greeting_prompt_duration: chatbot.greeting_prompt_duration,
      widget_logo_url: chatbot.widget_logo_url,
      widget_width: chatbot.widget_width,
      widget_height: chatbot.widget_height,
      widget_header_color: chatbot.widget_header_color,
      widget_user_bubble_color: chatbot.widget_user_bubble_color,
      widget_assistant_bubble_color: chatbot.widget_assistant_bubble_color,
      widget_font_family: chatbot.widget_font_family,
      widget_font_size: chatbot.widget_font_size,
      widget_text_color: chatbot.widget_text_color,
      voice_enabled: chatbot.voice_enabled,
      mcp_servers: servers,
      webmcp_enabled: enabled,
    };
    updateMutation.mutate({ chatbotId: chatbot.id, settings });
  };

  const handleSave = () => {
    if (!formName.trim() || !formUrl.trim()) return;

    const headers: Record<string, string> = {};
    formHeaders.forEach((h) => {
      if (h.key.trim()) headers[h.key.trim()] = h.value;
    });

    const server: MCPServer = {
      name: formName.trim(),
      transport: formTransport,
      url: formUrl.trim(),
      headers: Object.keys(headers).length > 0 ? headers : null,
      enabled: formEnabled,
    };

    let updated: MCPServer[];
    if (editingIndex !== null) {
      updated = [...servers];
      updated[editingIndex] = server;
    } else {
      updated = [...servers, server];
    }

    saveServers(updated);
    closeForm();
  };

  const handleDelete = (index: number) => {
    const updated = servers.filter((_, i) => i !== index);
    saveServers(updated);
    if (editingIndex === index) closeForm();
  };

  const handleToggleEnabled = (index: number) => {
    const updated = [...servers];
    const current = updated[index];
    if (!current) return;
    updated[index] = { ...current, enabled: !current.enabled };
    saveServers(updated);
  };

  const addHeader = () => {
    setFormHeaders([...formHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setFormHeaders(formHeaders.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...formHeaders];
    const current = updated[index];
    if (!current) return;
    updated[index] = { ...current, [field]: value };
    setFormHeaders(updated);
  };

  if (activeTab !== 'mcp-servers') return null;

  const isFormOpen = isAdding || editingIndex !== null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* WebMCP Browser Tools */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-semibold text-label-primary">
                  Browser Tools (WebMCP)
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-[10px] font-medium text-purple-500 uppercase tracking-wide">
                  Early Preview
                </span>
              </div>
              <p className="text-[12px] text-label-tertiary mt-0.5">
                Allow the chatbot to use tools registered on the host website via the Flunkie SDK or WebMCP standard.
              </p>
            </div>
          </div>
          <button
            onClick={() => saveWebMcpToggle(!webMcpEnabled)}
            className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${
              webMcpEnabled ? 'bg-accent' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                webMcpEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-label-primary tracking-tight">
            MCP Servers
          </h2>
          <p className="text-[13px] text-label-tertiary mt-1">
            Connect external tools and services to your chatbot via MCP servers.
          </p>
        </div>
        {!isFormOpen && servers.length > 0 && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Server
          </button>
        )}
      </div>

      {/* Empty state */}
      {servers.length === 0 && !isFormOpen && (
        <div className="glass-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-secondary/80 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-label-tertiary">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-label-primary mb-1">
            Connect your first MCP server
          </h3>
          <p className="text-[13px] text-label-tertiary mb-6 max-w-sm mx-auto">
            MCP servers give your chatbot access to external tools like databases, APIs, and more.
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Server
          </button>
        </div>
      )}

      {/* Server list */}
      {servers.length > 0 && (
        <div className="space-y-3">
          {servers.map((server, index) => (
            <div
              key={index}
              className={`glass-card p-4 transition-all duration-200 ${
                editingIndex === index ? 'ring-1 ring-accent/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    server.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />

                {/* Name + URL */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-label-primary truncate">
                    {server.name}
                  </p>
                  <p className="text-[12px] text-label-tertiary truncate">
                    {server.url}
                  </p>
                </div>

                {/* Transport badge */}
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-secondary text-[11px] font-medium text-label-secondary uppercase tracking-wide">
                  {server.transport === 'streamable-http' ? 'HTTP' : 'SSE'}
                </span>

                {/* Toggle */}
                <button
                  onClick={() => handleToggleEnabled(index)}
                  className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${
                    server.enabled ? 'bg-accent' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      server.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditForm(index)}
                  className="shrink-0 p-1.5 rounded-lg text-label-tertiary hover:text-label-primary hover:bg-surface-secondary/60 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(index)}
                  className="shrink-0 p-1.5 rounded-lg text-label-tertiary hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {isFormOpen && (
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-[15px] font-semibold text-label-primary">
            {editingIndex !== null ? 'Edit Server' : 'Add Server'}
          </h3>

          {/* Name */}
          <div>
            <label className="block text-[12px] font-medium text-label-secondary mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. GitHub Tools"
              className="input-field"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-[12px] font-medium text-label-secondary mb-1.5">
              Server URL
            </label>
            <input
              type="text"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://mcp.example.com/sse"
              className="input-field"
            />
          </div>

          {/* Transport */}
          <div>
            <label className="block text-[12px] font-medium text-label-secondary mb-1.5">
              Transport
            </label>
            <select
              value={formTransport}
              onChange={(e) => setFormTransport(e.target.value as 'sse' | 'streamable-http')}
              className="input-field"
            >
              <option value="sse">SSE (Server-Sent Events)</option>
              <option value="streamable-http">Streamable HTTP</option>
            </select>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-medium text-label-secondary">
                Headers
              </label>
              <button
                onClick={addHeader}
                className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors duration-200"
              >
                + Add Header
              </button>
            </div>
            {formHeaders.length === 0 && (
              <p className="text-[12px] text-label-tertiary">
                No headers configured. Add headers for authentication tokens or API keys.
              </p>
            )}
            {formHeaders.map((header, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="input-field flex-1"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="shrink-0 p-1.5 rounded-lg text-label-tertiary hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-label-secondary">Enabled</label>
            <button
              onClick={() => setFormEnabled(!formEnabled)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                formEnabled ? 'bg-accent' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  formEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!formName.trim() || !formUrl.trim()}
              className="px-5 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {editingIndex !== null ? 'Update Server' : 'Add Server'}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2 rounded-xl bg-surface-secondary text-label-secondary text-[13px] font-medium hover:bg-surface-secondary/80 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {updateMutation.isPending && (
        <div className="flex items-center gap-2 text-[12px] text-label-tertiary">
          <div className="w-3 h-3 border border-accent/20 border-t-accent rounded-full animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

export default ToolsSection;
