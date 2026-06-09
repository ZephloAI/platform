import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStartCrawl, useUploadDocument, useDeleteDocument, useReplaceDocument, useUpdateChatbot, useCreateText, useUpdateText, useDeleteText, useCrawlJob } from '../hooks/useChatbots';
import { useDiscoverStream } from '../hooks/useDiscoverStream';
import CrawlStatus from './CrawlStatus';
import UrlSelector from './UrlSelector';
import { formatRelativeTime } from '../lib/format';
import type { Chatbot, DiscoveredUrl } from '../types';

// ============================================================
// KnowledgeSection
// Overview dashboard + tabbed sources management:
// Website (discover & crawl), Pages (manual URLs), Documents
// (PDF upload), Texts (manual snippets). Auto re-crawl settings
// live in the Overview's Index Settings card.
// ============================================================

type Tab = 'overview' | 'website' | 'pages' | 'documents' | 'texts';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'website', label: 'Website', icon: 'language' },
  { key: 'pages', label: 'Pages', icon: 'link' },
  { key: 'documents', label: 'Documents', icon: 'description' },
  { key: 'texts', label: 'Texts', icon: 'text_snippet' },
];

type IndexStatus = 'pending' | 'processing' | 'ready' | 'error';

/** Small "Indexed / Processing / Pending / Error" pill, shared across the section. */
function StatusBadge({ status }: { status: IndexStatus }) {
  const map: Record<IndexStatus, { label: string; cls: string }> = {
    ready: { label: 'Indexed', cls: 'bg-green-50 text-green-700' },
    processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-700' },
    pending: { label: 'Pending', cls: 'bg-surface-secondary text-label-tertiary' },
    error: { label: 'Error', cls: 'bg-red-50 text-red-600' },
  };
  const { label, cls } = map[status];
  return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function statusInfo(status: Chatbot['status']) {
  switch (status) {
    case 'ready':
    case 'active':
      return { label: 'Healthy', dot: 'bg-green-500' };
    case 'crawling':
      return { label: 'Crawling', dot: 'bg-accent' };
    case 'error':
      return { label: 'Needs attention', dot: 'bg-red-500' };
    default:
      return { label: 'Not set up', dot: 'bg-label-quaternary' };
  }
}

interface KnowledgeSectionProps {
  chatbot: Chatbot;
}

function KnowledgeSection({ chatbot }: KnowledgeSectionProps) {
  const startCrawlMutation = useStartCrawl();
  const discover = useDiscoverStream(chatbot.public_id);
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const replaceDocMutation = useReplaceDocument();
  const createTextMutation = useCreateText();
  const updateTextMutation = useUpdateText();
  const deleteTextMutation = useDeleteText();
  const updateChatbotMutation = useUpdateChatbot();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dragOver, setDragOver] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textError, setTextError] = useState('');
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');

  const documents = chatbot.documents ?? [];
  const texts = chatbot.agent_texts ?? [];
  const pagesIndexed = chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0;
  const docsReady = documents.filter((d) => d.status === 'ready').length;
  const textsReady = texts.filter((t) => t.status === 'ready').length;
  const isCrawling = chatbot.status === 'crawling';
  const status = statusInfo(chatbot.status);

  // While a crawl is running, poll the active job (~3s) for the live list of
  // pages crawled so far. When the crawl finishes this collapses automatically
  // (isCrawling becomes false) and the job shows as a summary in Crawl History.
  const activeJob =
    chatbot.crawl_jobs?.find((j) => j.status === 'in_progress' || j.status === 'pending') ?? null;
  const { data: liveJob } = useCrawlJob(activeJob?.id ?? null);
  const crawledPages = liveJob?.crawled_pages ?? [];
  const crawledCount = liveJob?.pages_crawled ?? activeJob?.pages_crawled ?? 0;
  const crawlTotal = liveJob?.total_pages ?? 0;
  const crawlPct = crawlTotal > 0 ? Math.min(100, Math.round((crawledCount / crawlTotal) * 100)) : 0;

  // -- Texts tab: open inline edit form for an existing snippet --
  const handleStartEditText = (textId: number, title: string, content: string) => {
    setEditingTextId(textId);
    setEditTitle(title);
    setEditContent(content);
    setEditError('');
  };

  const handleCancelEditText = () => {
    setEditingTextId(null);
    setEditTitle('');
    setEditContent('');
    setEditError('');
  };

  const handleSaveEditText = () => {
    if (editingTextId === null) return;
    setEditError('');
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title || !content) {
      setEditError('Both a title and content are required.');
      return;
    }
    updateTextMutation.mutate(
      { chatbotId: chatbot.public_id, textId: editingTextId, title, content },
      {
        onSuccess: handleCancelEditText,
        onError: () => setEditError('Failed to save changes. Please try again.'),
      },
    );
  };

  const handleReplaceDocument = (documentId: number, file: File) => {
    replaceDocMutation.mutate({ chatbotId: chatbot.public_id, documentId, file });
  };

  const handleSaveText = () => {
    setTextError('');
    const title = textTitle.trim();
    const content = textContent.trim();
    if (!title || !content) {
      setTextError('Both a title and content are required.');
      return;
    }
    createTextMutation.mutate(
      { chatbotId: chatbot.public_id, title, content },
      {
        onSuccess: () => {
          setTextTitle('');
          setTextContent('');
        },
        onError: () => setTextError('Failed to save text. Please try again.'),
      },
    );
  };

  // As pages stream in from discovery, merge them into the selectable list
  // (all selected by default). Coexists with manually added URLs.
  useEffect(() => {
    if (discover.pages.length === 0) return;
    setDiscoveredUrls((prev) => {
      const seen = new Set(prev.map((u) => u.url));
      const additions = discover.pages.filter((p) => !seen.has(p.url));
      return additions.length ? [...prev, ...additions] : prev;
    });
    setSelectedUrls((prev) => {
      const seen = new Set(prev);
      const additions = discover.pages.filter((p) => !seen.has(p.url)).map((p) => p.url);
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [discover.pages]);

  const handleDiscover = () => {
    if (!websiteUrl.trim()) return;
    discover.start(websiteUrl.trim());
  };

  // The dashboard assistant routes "add this website" requests here: it navigates
  // with `knowledgeTab=website` and a `discoverUrl`. Land on the Website tab and
  // auto-start discovery, then strip the params so a refresh doesn't re-trigger.
  useEffect(() => {
    if (searchParams.get('knowledgeTab') === 'website') setActiveTab('website');
    const discoverUrl = searchParams.get('discoverUrl');
    if (discoverUrl) {
      setActiveTab('website');
      setWebsiteUrl(discoverUrl);
      discover.start(discoverUrl);
    }
    if (searchParams.get('knowledgeTab') || discoverUrl) {
      setSearchParams(
        (prev) => {
          prev.delete('knowledgeTab');
          prev.delete('discoverUrl');
          return prev;
        },
        { replace: true },
      );
    }
    // Run once per incoming request; clearing the params above prevents re-fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clearDiscovery = () => {
    setDiscoveredUrls([]);
    setSelectedUrls([]);
    setWebsiteUrl('');
    discover.reset();
  };

  // Seed for "Re-crawl": re-discover the agent's existing site so the user can
  // re-pick pages (and drop any they no longer want). Prefer a saved
  // website_url, else fall back to the root of a previously crawled URL.
  const recrawlSeed = (() => {
    if (chatbot.website_url) return chatbot.website_url;
    const first = chatbot.crawled_urls?.[0];
    if (!first) return '';
    try {
      return new URL(first).origin + '/';
    } catch {
      return '';
    }
  })();

  // Re-crawl = re-run discovery on the existing site, then let the user select
  // pages and crawl normally (instead of silently re-crawling the old list).
  const handleRecrawl = () => {
    if (!recrawlSeed) return;
    setActiveTab('website');
    setDiscoveredUrls([]);
    setSelectedUrls([]);
    setWebsiteUrl(recrawlSeed);
    discover.start(recrawlSeed);
  };

  const handleCrawlSelected = () => {
    startCrawlMutation.mutate(
      { chatbotId: chatbot.public_id, selectedUrls },
      { onSuccess: clearDiscovery },
    );
  };

  const canDiscover =
    websiteUrl.trim().length > 0 && !discover.isDiscovering && discoveredUrls.length === 0;
  // Crawling is blocked while discovery is still streaming pages in -- the user
  // can only crawl once discovery has finished.
  const canCrawl =
    selectedUrls.length > 0 &&
    !startCrawlMutation.isPending &&
    chatbot.status !== 'crawling' &&
    !discover.isDiscovering;

  const handleAddManualUrl = (url: DiscoveredUrl) => {
    setDiscoveredUrls((prev) => [...prev, url]);
    setSelectedUrls((prev) => [...prev, url.url]);
  };

  // Recent sources: newest documents + texts together
  const recentSources = [
    ...documents.map((d) => ({
      id: `doc-${d.id}`,
      type: 'document' as const,
      name: d.filename,
      date: d.uploaded_at,
      status: d.status as IndexStatus,
      meta: `${(d.file_size / 1024).toFixed(0)} KB`,
    })),
    ...texts.map((t) => ({
      id: `text-${t.id}`,
      type: 'text' as const,
      name: t.title,
      date: t.created_at,
      status: t.status as IndexStatus,
      meta: `${t.content.length.toLocaleString()} chars`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const cardClass = 'bg-white blue-glow-card rounded-xl';

  function renderAutoRecrawl() {
    return (
      <div className={`${cardClass} p-6`}>
        <h4 className="heading-md mb-4">Index Settings</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium text-label-primary">Auto re-crawl</p>
            <p className="text-[12px] text-label-tertiary mt-0.5">Keep knowledge fresh automatically</p>
          </div>
          <button
            onClick={() =>
              updateChatbotMutation.mutate({
                chatbotId: chatbot.public_id,
                data: {
                  name: chatbot.name,
                  description: chatbot.description,
                  instructions: chatbot.instructions,
                  auto_recrawl_enabled: !chatbot.auto_recrawl_enabled,
                },
              })
            }
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
              chatbot.auto_recrawl_enabled ? 'bg-accent' : 'bg-surface-tertiary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                chatbot.auto_recrawl_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {chatbot.auto_recrawl_enabled && (
          <div className="mt-4 pt-4 border-t border-black/[0.06]">
            <label className="text-[12px] text-label-secondary block mb-1.5">Re-crawl interval</label>
            <select
              value={chatbot.recrawl_interval_hours ?? 48}
              onChange={(e) =>
                updateChatbotMutation.mutate({
                  chatbotId: chatbot.public_id,
                  data: {
                    name: chatbot.name,
                    description: chatbot.description,
                    instructions: chatbot.instructions,
                    recrawl_interval_hours: parseInt(e.target.value),
                  },
                })
              }
              className="input-field w-full"
            >
              <option value={24}>Every 24 hours</option>
              <option value={48}>Every 2 days</option>
              <option value={72}>Every 3 days</option>
              <option value={168}>Every week</option>
            </select>
            {chatbot.last_crawled_at && (
              <p className="text-[11px] text-label-quaternary mt-2">
                Last crawled: {new Date(chatbot.last_crawled_at).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Crawl status banner with the live list of pages as they're crawled */}
      {isCrawling && (
        <div className="bg-accent-light border border-accent/20 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 22 }}>sync</span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-label-primary">Crawling website…</p>
                <p className="text-[13px] text-label-tertiary truncate">
                  {crawledCount > 0
                    ? `${crawledCount.toLocaleString()}${crawlTotal ? ` / ${crawlTotal.toLocaleString()}` : ''} pages crawled`
                    : 'Starting…'}
                </p>
              </div>
            </div>
            {crawlTotal > 0 && (
              <div className="w-32 h-1.5 bg-white/60 rounded-full overflow-hidden shrink-0 hidden sm:block">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${crawlPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Pages appear here one by one as they're indexed */}
          {crawledPages.length > 0 && (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-black/[0.05] bg-white/70 divide-y divide-black/[0.04]">
              {crawledPages.map((p) => (
                <div key={p.url} className="flex items-center gap-2.5 px-3 py-2 animate-fade-in">
                  <span className="material-symbols-outlined text-sage-600 shrink-0" style={{ fontSize: 16 }}>
                    check_circle
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-label-primary truncate">{p.title || p.url}</p>
                    <p className="text-[11px] text-label-quaternary truncate">{p.url}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-black/[0.06] overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 pt-1 text-[14px] font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-label-tertiary hover:text-label-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Overview tab ===== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Health */}
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h3 className="heading-md">Knowledge Base Health</h3>
                <div className="flex items-center gap-1.5 text-[12px] text-label-tertiary">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  {status.label}
                  {chatbot.last_crawled_at && ` · synced ${formatRelativeTime(chatbot.last_crawled_at)}`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pages Indexed', value: pagesIndexed.toLocaleString(), sub: `${chatbot.crawl_jobs?.length || 0} crawl jobs` },
                  { label: 'Documents', value: documents.length, sub: `${docsReady} ready` },
                  { label: 'Text Snippets', value: texts.length, sub: `${textsReady} ready` },
                ].map((s) => (
                  <div key={s.label} className="p-4 bg-surface-secondary/50 rounded-lg border border-black/[0.04]">
                    <p className="text-[12px] text-label-tertiary mb-1">{s.label}</p>
                    <p className="metric-value text-[22px]">{s.value}</p>
                    <p className="text-[12px] text-label-tertiary mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent sources */}
            <div className={`${cardClass} overflow-hidden`}>
              <div className="p-5 border-b border-black/[0.04] flex items-center justify-between">
                <h3 className="heading-md">Recent Sources</h3>
                {recentSources.length > 0 && (
                  <button onClick={() => setActiveTab('documents')} className="text-accent text-[13px] font-semibold hover:underline">
                    View all
                  </button>
                )}
              </div>
              {recentSources.length === 0 ? (
                <div className="p-10 text-center">
                  <span className="material-symbols-outlined text-label-quaternary mb-2" style={{ fontSize: 32 }}>folder_open</span>
                  <p className="text-[13px] text-label-tertiary">No knowledge added yet.</p>
                  <p className="text-[12px] text-label-quaternary mt-1">Crawl a website or upload a document to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {recentSources.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.type === 'document' ? 'bg-red-50 text-red-600' : 'bg-surface-tertiary text-label-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {item.type === 'document' ? 'description' : 'text_snippet'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-label-primary truncate">{item.name}</p>
                          <p className="text-[12px] text-label-tertiary">
                            {item.meta} · {formatRelativeTime(item.date)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className={`${cardClass} p-6`}>
              <h4 className="heading-md mb-4">Quick Add</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('documents')}
                  className="p-4 rounded-lg bg-surface-secondary/60 hover:bg-accent-light transition-colors flex flex-col items-center gap-2 border border-black/[0.04]"
                >
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 24 }}>upload_file</span>
                  <span className="text-[13px] font-medium">Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('website')}
                  className="p-4 rounded-lg bg-surface-secondary/60 hover:bg-accent-light transition-colors flex flex-col items-center gap-2 border border-black/[0.04]"
                >
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 24 }}>add_link</span>
                  <span className="text-[13px] font-medium">Add URL</span>
                </button>
              </div>
            </div>

            {renderAutoRecrawl()}
          </div>
        </div>
      )}

      {/* ===== Website tab ===== */}
      {activeTab === 'website' && (
        <div className={`${cardClass} p-5 animate-fade-in`}>
          <p className="text-[13px] text-label-secondary mb-3">
            Enter a website URL to discover its pages. They stream in live below as they're
            found; once discovery finishes you can pick which ones to crawl.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canDiscover && handleDiscover()}
              placeholder="https://example.com"
              disabled={discover.isDiscovering || discoveredUrls.length > 0}
              className="input-field flex-1 disabled:opacity-50"
            />
            {canDiscover && (
              <button onClick={handleDiscover} className="btn-accent shrink-0">
                Discover Pages
              </button>
            )}
          </div>
          {discover.isDiscovering && (
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <span className="text-[13px] font-medium text-label-secondary">
                Discovering pages… {discover.pages.length} found
              </span>
            </div>
          )}
          {discover.isComplete && (
            <div className="flex items-center gap-2 mt-4 text-sage-600">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              <span className="text-[13px] font-medium">
                Discovery complete — {discover.pages.length} page{discover.pages.length !== 1 ? 's' : ''} found. Select the ones to crawl below.
              </span>
            </div>
          )}
          {discover.error && (
            <p className="mt-3 text-[13px] text-red-500">{discover.error}</p>
          )}
        </div>
      )}

      {/* ===== Pages tab ===== */}
      {activeTab === 'pages' && (
        <div className={`${cardClass} p-5 animate-fade-in`}>
          <p className="text-[13px] text-label-secondary mb-3">
            Add specific page URLs directly. These will be crawled to build the agent's knowledge base.
          </p>
          <ManualUrlAdder existingUrls={discoveredUrls} onAddUrl={handleAddManualUrl} />
        </div>
      )}

      {/* ===== Documents tab ===== */}
      {activeTab === 'documents' && (
        <div className={`${cardClass} p-5 animate-fade-in`}>
          <p className="text-[13px] text-label-secondary mb-3">
            Upload PDF documents to add to the agent's knowledge base. Max file size: 20MB.
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && file.type === 'application/pdf') {
                uploadDocMutation.mutate({ chatbotId: chatbot.public_id, file });
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragOver ? 'border-accent bg-accent/5' : 'border-separator hover:border-label-quaternary'
            }`}
          >
            <span className="material-symbols-outlined text-label-quaternary mb-2" style={{ fontSize: 36 }}>upload_file</span>
            <p className="text-[13px] text-label-secondary mb-2">Drag &amp; drop a PDF here, or</p>
            <label className="btn-accent inline-block cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocMutation.mutate({ chatbotId: chatbot.public_id, file });
                }}
              />
            </label>
            <p className="text-[11px] text-label-quaternary mt-2">PDF only, up to 20MB</p>
          </div>

          {uploadDocMutation.isPending && (
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <span className="text-[13px] font-medium text-label-secondary">Uploading...</span>
            </div>
          )}
          {uploadDocMutation.isError && (
            <p className="mt-3 text-[13px] text-red-500">Failed to upload document. Please try again.</p>
          )}

          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontSize: 20 }}>description</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-label-primary truncate">{doc.filename}</p>
                      <p className="text-[11px] text-label-quaternary">
                        {(doc.file_size / 1024).toFixed(0)} KB
                        {doc.status === 'ready' && ` · ${doc.chunks_indexed} chunks`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status as IndexStatus} />
                    <label className="p-1 text-label-quaternary hover:text-accent transition-colors cursor-pointer" title="Replace document">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cached</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={replaceDocMutation.isPending}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReplaceDocument(doc.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      onClick={() => deleteDocMutation.mutate({ chatbotId: chatbot.public_id, documentId: doc.id })}
                      disabled={deleteDocMutation.isPending}
                      className="p-1 text-label-quaternary hover:text-red-500 transition-colors"
                      title="Delete document"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Texts tab ===== */}
      {activeTab === 'texts' && (
        <div className={`${cardClass} p-5 animate-fade-in`}>
          <p className="text-[13px] text-label-secondary mb-3">
            Paste in instructions or reference material as plain text. The agent will index it alongside crawled pages and uploaded documents.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={textTitle}
              onChange={(e) => { setTextTitle(e.target.value); setTextError(''); }}
              placeholder="Title (e.g. Refund policy)"
              maxLength={200}
              className="input-field w-full"
            />
            <textarea
              value={textContent}
              onChange={(e) => { setTextContent(e.target.value); setTextError(''); }}
              placeholder="Paste your text here..."
              rows={8}
              className="input-field w-full resize-y font-mono text-[13px]"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-label-quaternary">
                {textContent.length.toLocaleString()} characters · up to ~1MB
              </p>
              <button
                onClick={handleSaveText}
                disabled={createTextMutation.isPending || !textTitle.trim() || !textContent.trim()}
                className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createTextMutation.isPending ? 'Saving...' : 'Save Text'}
              </button>
            </div>
            {textError && <p className="text-[13px] text-red-500">{textError}</p>}
          </div>

          {texts.length > 0 && (
            <div className="mt-4 space-y-2">
              {texts.map((text) =>
                editingTextId === text.id ? (
                  <div key={text.id} className="p-3 bg-surface-secondary rounded-lg space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setEditError(''); }}
                      maxLength={200}
                      className="input-field w-full"
                      placeholder="Title"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => { setEditContent(e.target.value); setEditError(''); }}
                      rows={6}
                      className="input-field w-full resize-y font-mono text-[13px]"
                      placeholder="Content"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-label-quaternary">{editContent.length.toLocaleString()} characters</p>
                      <div className="flex items-center gap-2">
                        <button onClick={handleCancelEditText} disabled={updateTextMutation.isPending} className="btn-secondary">
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditText}
                          disabled={updateTextMutation.isPending || !editTitle.trim() || !editContent.trim()}
                          className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {updateTextMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                    {editError && <p className="text-[13px] text-red-500">{editError}</p>}
                  </div>
                ) : (
                  <div key={text.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-label-tertiary shrink-0" style={{ fontSize: 20 }}>text_snippet</span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-label-primary truncate">{text.title}</p>
                        <p className="text-[11px] text-label-quaternary">
                          {text.content.length.toLocaleString()} chars
                          {text.status === 'ready' && ` · ${text.chunks_indexed} chunks`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={text.status as IndexStatus} />
                      <button
                        onClick={() => handleStartEditText(text.id, text.title, text.content)}
                        className="p-1 text-label-quaternary hover:text-accent transition-colors"
                        title="Edit text"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                      </button>
                      <button
                        onClick={() => deleteTextMutation.mutate({ chatbotId: chatbot.public_id, textId: text.id })}
                        disabled={deleteTextMutation.isPending}
                        className="p-1 text-label-quaternary hover:text-red-500 transition-colors"
                        title="Delete text"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* Shared: pages stream in here during discovery, then get selected → crawled */}
      {discoveredUrls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-[14px] font-display font-semibold text-label-primary">
              {discover.isDiscovering
                ? `Discovering… ${discoveredUrls.length} found`
                : `Selected Pages (${selectedUrls.length}/${discoveredUrls.length})`}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCrawlSelected}
                disabled={!canCrawl}
                className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {startCrawlMutation.isPending
                  ? 'Starting...'
                  : discover.isDiscovering
                    ? 'Waiting for discovery…'
                    : `Crawl ${selectedUrls.length} Pages`}
              </button>
              <button onClick={clearDiscovery} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>
          <UrlSelector
            urls={discoveredUrls}
            selectedUrls={selectedUrls}
            onSelectionChange={setSelectedUrls}
            onAddUrl={handleAddManualUrl}
          />
        </div>
      )}

      {/* Crawl history (website/pages tabs) */}
      {(activeTab === 'website' || activeTab === 'pages') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-display font-semibold text-label-primary">Crawl History</h2>
            {chatbot.crawl_jobs && chatbot.crawl_jobs.length > 0 && !isCrawling && recrawlSeed && (
              <button
                onClick={handleRecrawl}
                disabled={discover.isDiscovering}
                title="Re-discover the site so you can re-pick which pages to crawl"
                className="btn-secondary text-[12px] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                Re-crawl
              </button>
            )}
          </div>
          {(!chatbot.crawl_jobs || chatbot.crawl_jobs.length === 0) ? (
            <div className={`${cardClass} p-8 text-center`}>
              <p className="text-[14px] text-label-tertiary">No crawl jobs yet. Add pages above to start indexing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...chatbot.crawl_jobs]
                .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                .map((job) => (
                  <CrawlStatus key={job.id} crawlJob={job} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ManualUrlAdder - inline component for the "Pages" tab
// ============================================================

function ManualUrlAdder({
  existingUrls,
  onAddUrl,
}: {
  existingUrls: DiscoveredUrl[];
  onAddUrl: (url: DiscoveredUrl) => void;
}) {
  const [manualUrl, setManualUrl] = useState('');
  const [error, setError] = useState('');

  const existingSet = new Set(existingUrls.map((u) => u.url));

  const handleAdd = () => {
    setError('');
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }
    if (existingSet.has(trimmed)) {
      setError('This URL has already been added.');
      setManualUrl('');
      return;
    }
    onAddUrl({ url: trimmed, title: trimmed });
    setManualUrl('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={manualUrl}
          onChange={(e) => { setManualUrl(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="https://example.com/specific-page"
          className="input-field flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!manualUrl.trim()}
          className="btn-accent shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Page
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
      {existingUrls.length > 0 && (
        <p className="mt-2 text-[12px] text-label-quaternary">
          {existingUrls.length} page{existingUrls.length !== 1 ? 's' : ''} added. View and manage them in the selection below.
        </p>
      )}
    </div>
  );
}

export default KnowledgeSection;
