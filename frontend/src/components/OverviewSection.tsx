import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Chatbot, ApiKey, ApiKeyCreated } from '../types';
import apiClient from '../api/client';

// ============================================================
// OverviewSection
// Status card, metrics, embed code with tabs, and API key mgmt.
// ============================================================

const STATUS_BADGES: Record<string, string> = {
  active: 'badge badge-ready',
  inactive: 'badge badge-error',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

type EmbedTab = 'script' | 'npm' | 'legacy';

interface OverviewSectionProps {
  chatbot: Chatbot;
}

function OverviewSection({ chatbot }: OverviewSectionProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [embedTab, setEmbedTab] = useState<EmbedTab>('script');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [keyName, setKeyName] = useState('');
  const [keysLoading, setKeysLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const origin = window.location.origin;

  // Fetch API keys on mount
  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const res = await apiClient.get(`/api/chatbots/${chatbot.id}/api-keys`);
      setApiKeys(res.data);
    } catch {
      // silently ignore - keys endpoint may not exist yet
    } finally {
      setKeysLoading(false);
    }
  }, [chatbot.id]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Toggle active state
  const handleToggleActive = async () => {
    try {
      await apiClient.put(`/api/chatbots/${chatbot.id}`, {
        is_active: !chatbot.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ['chatbots', chatbot.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    } catch {
      // silently ignore
    }
  };

  // Create a new API key
  const createKey = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const res = await apiClient.post(`/api/chatbots/${chatbot.id}/api-keys`, {
        name: keyName.trim(),
      });
      setNewKey(res.data);
      setKeyName('');
      fetchKeys();
    } catch {
      // handle error silently
    } finally {
      setCreating(false);
    }
  };

  // Revoke an API key
  const revokeKey = async (keyId: number) => {
    try {
      await apiClient.delete(`/api/chatbots/${chatbot.id}/api-keys/${keyId}`);
      fetchKeys();
    } catch {
      // handle error silently
    }
  };

  // Embed code snippets
  const scriptTagCode = `<script src="${origin}/widget/flunkie.js"></script>
<script>
  Flunkie.initialize({
    key: "YOUR_API_KEY",
    chatbotId: ${chatbot.id}
  });
</script>`;

  const npmCode = `npm install flunkie

import Flunkie from "flunkie";

Flunkie.initialize({
  key: "YOUR_API_KEY",
  chatbotId: ${chatbot.id}
});`;

  const legacyCode = `<script
  src="${origin}/widget/chatbot-widget.js"
  data-chatbot-id="${chatbot.id}"
></script>`;

  const embedCodeMap: Record<EmbedTab, string> = {
    script: scriptTagCode,
    npm: npmCode,
    legacy: legacyCode,
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeMap[embedTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey.key);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const formatPrefix = (prefix: string) => `${prefix}••••`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-label-primary tracking-tight">
              Status
            </h2>
            <p className="text-[12px] text-label-quaternary mt-0.5">
              Created{' '}
              {new Date(chatbot.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span className={STATUS_BADGES[chatbot.is_active ? 'active' : 'inactive'] || 'badge'}>
            {STATUS_LABELS[chatbot.is_active ? 'active' : 'inactive']}
          </span>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/[0.04]">
          <div>
            <p className="text-[13px] font-medium text-label-primary">
              {chatbot.is_active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-[11px] text-label-quaternary">
              {chatbot.is_active ? 'Widget is accepting conversations' : 'Widget is hidden from visitors'}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              chatbot.is_active ? 'bg-accent' : 'bg-black/[0.12]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                chatbot.is_active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {chatbot.is_active && (
          <div className="pt-2 border-t border-black/[0.04]">
            <Link to={`/chatbots/${chatbot.id}/chat`} className="btn-primary">
              Open Chat
            </Link>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="glass-card p-6">
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-4">
          Metrics
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              {chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0}
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Pages Indexed
            </p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              {chatbot.crawl_jobs?.length || 0}
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Crawl Jobs
            </p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              —
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Conversations
            </p>
          </div>
        </div>
      </div>

      {/* Embed Code with Tabs */}
      <div className="glass-card p-6">
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-3">
          Embed Code
        </h2>
        <p className="text-[13px] text-label-secondary mb-4">
          Add the Flunkie widget to your website using one of the methods below.
        </p>

        {/* Tab Buttons */}
        <div className="flex gap-1 mb-4 p-1 bg-black/[0.03] rounded-lg w-fit">
          {([
            { key: 'script' as EmbedTab, label: 'Script Tag' },
            { key: 'npm' as EmbedTab, label: 'npm' },
            { key: 'legacy' as EmbedTab, label: 'Legacy' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setEmbedTab(tab.key)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 ${
                embedTab === tab.key
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              {tab.label}
              {tab.key === 'legacy' && (
                <span className="ml-1 text-[10px] text-label-quaternary">(no auth)</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-green-400 text-[12px] rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
            {embedCodeMap[embedTab]}
          </pre>
          <button
            onClick={handleCopyEmbed}
            className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h2 className="text-[18px] font-semibold text-label-primary tracking-tight">
            API Keys
          </h2>
          <p className="text-[13px] text-label-secondary mt-0.5">
            Manage keys for the Flunkie SDK
          </p>
        </div>

        {/* Create Key Form */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
            placeholder="Key name (e.g. Production)"
            className="flex-1 px-3 py-2 text-[13px] bg-black/[0.03] border border-black/[0.06] rounded-lg text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          <button
            onClick={createKey}
            disabled={!keyName.trim() || creating}
            className="btn-primary px-4 py-2 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Key'}
          </button>
        </div>

        {/* Keys List */}
        {keysLoading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[13px] text-label-tertiary">Loading keys...</span>
          </div>
        ) : apiKeys.length === 0 ? (
          <p className="text-[13px] text-label-quaternary py-4 text-center">
            No API keys yet. Create one to authenticate SDK requests.
          </p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  key.is_active
                    ? 'bg-black/[0.02] border-black/[0.06]'
                    : 'bg-black/[0.01] border-black/[0.03] opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-[12px] font-mono text-label-secondary bg-black/[0.04] px-2 py-0.5 rounded shrink-0">
                    {formatPrefix(key.key_prefix)}
                  </code>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-label-primary truncate">
                      {key.name}
                    </p>
                    <p className="text-[11px] text-label-quaternary">
                      Created {formatDate(key.created_at)}
                      {key.last_used_at && ` · Last used ${formatDate(key.last_used_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      key.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {key.is_active && (
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold text-label-primary">
                API Key Created
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] font-medium text-amber-800">
                This key will only be shown once. Copy it now and store it securely.
              </p>
            </div>

            <div className="relative mb-4">
              <pre className="bg-gray-900 text-green-400 text-[13px] rounded-lg p-3 font-mono break-all whitespace-pre-wrap">
                {newKey.key}
              </pre>
              <button
                onClick={handleCopyKey}
                className="absolute top-2 right-2 px-3 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200"
              >
                {keyCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[12px] text-label-quaternary">
                Name: {newKey.name}
              </p>
              <button
                onClick={() => setNewKey(null)}
                className="btn-primary px-4 py-2 text-[13px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewSection;
