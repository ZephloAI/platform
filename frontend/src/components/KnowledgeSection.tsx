import { useState } from 'react';
import { useStartCrawl, useDiscoverUrls, useUploadDocument, useDeleteDocument, useUpdateChatbot, useRecrawl } from '../hooks/useChatbots';
import CrawlStatus from './CrawlStatus';
import UrlSelector from './UrlSelector';
import type { Chatbot, DiscoveredUrl } from '../types';

// ============================================================
// KnowledgeSection
// Tabbed interface: "Website" to discover pages from a URL,
// "Pages" to add individual URLs manually. Both feed into a
// shared URL selection that gets crawled. Includes crawl history.
// ============================================================

type Tab = 'website' | 'pages' | 'documents';

interface KnowledgeSectionProps {
  chatbot: Chatbot;
}

function KnowledgeSection({ chatbot }: KnowledgeSectionProps) {
  const startCrawlMutation = useStartCrawl();
  const discoverMutation = useDiscoverUrls();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const updateChatbotMutation = useUpdateChatbot();
  const recrawlMutation = useRecrawl();

  const [activeTab, setActiveTab] = useState<Tab>('website');
  const [dragOver, setDragOver] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // -- Website tab: discover URLs from a website --
  const handleDiscover = () => {
    if (!websiteUrl.trim()) return;

    discoverMutation.mutate(
      { chatbotId: chatbot.public_id, websiteUrl: websiteUrl.trim() },
      {
        onSuccess: (data) => {
          setDiscoveredUrls(data.urls);
          setSelectedUrls(data.urls.map((u) => u.url));
        },
      }
    );
  };

  // -- Crawl all selected URLs --
  const handleCrawlSelected = () => {
    startCrawlMutation.mutate(
      { chatbotId: chatbot.public_id, selectedUrls },
      {
        onSuccess: () => {
          setDiscoveredUrls([]);
          setSelectedUrls([]);
          setWebsiteUrl('');
        },
      }
    );
  };

  const canDiscover =
    websiteUrl.trim().length > 0 &&
    !discoverMutation.isPending &&
    discoveredUrls.length === 0;

  const canCrawl =
    selectedUrls.length > 0 &&
    !startCrawlMutation.isPending &&
    chatbot.status !== 'crawling';

  // -- Pages tab: add individual URLs --
  const handleAddManualUrl = (url: DiscoveredUrl) => {
    setDiscoveredUrls((prev) => [...prev, url]);
    setSelectedUrls((prev) => [...prev, url.url]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Pages section - tabs */}
      {chatbot.status !== 'crawling' && (
        <div>
          {/* Tab bar */}
          <div className="flex gap-0 mb-4 bg-surface-secondary rounded-xl p-1 md:w-fit">
            <button
              onClick={() => setActiveTab('website')}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'website'
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Website
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'pages'
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                Pages
              </span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'documents'
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Documents
              </span>
            </button>
          </div>

          {/* Website tab content */}
          {activeTab === 'website' && (
            <div className="card p-5 animate-fade-in">
              <p className="text-[13px] text-label-secondary mb-3">
                Enter a website URL to discover all its pages. You can then select which ones to crawl.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canDiscover && handleDiscover()}
                  placeholder="https://example.com"
                  disabled={discoverMutation.isPending || discoveredUrls.length > 0}
                  className="input-field flex-1 disabled:opacity-50"
                />
                {canDiscover && (
                  <button
                    onClick={handleDiscover}
                    className="btn-accent shrink-0"
                  >
                    Discover Pages
                  </button>
                )}
              </div>

              {/* Discovering spinner */}
              {discoverMutation.isPending && (
                <div className="flex items-center gap-2.5 mt-4">
                  <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <span className="text-[13px] font-medium text-label-secondary">
                    Discovering pages...
                  </span>
                </div>
              )}

              {/* Discovery error */}
              {discoverMutation.isError && (
                <p className="mt-3 text-[13px] text-red-500">
                  Failed to discover pages. Please check the URL and try again.
                </p>
              )}
            </div>
          )}

          {/* Pages tab content */}
          {activeTab === 'pages' && (
            <div className="card p-5 animate-fade-in">
              <p className="text-[13px] text-label-secondary mb-3">
                Add specific page URLs directly. These will be crawled to build the agent's knowledge base.
              </p>
              <ManualUrlAdder
                existingUrls={discoveredUrls}
                onAddUrl={handleAddManualUrl}
              />
            </div>
          )}

          {/* Documents tab content */}
          {activeTab === 'documents' && (
            <div className="card p-5 animate-fade-in">
              <p className="text-[13px] text-label-secondary mb-3">
                Upload PDF documents to add to the agent's knowledge base. Max file size: 20MB.
              </p>

              {/* Drag and drop zone */}
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
                  dragOver
                    ? 'border-accent bg-accent/5'
                    : 'border-separator hover:border-label-quaternary'
                }`}
              >
                <svg className="mx-auto mb-3 text-label-quaternary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p className="text-[13px] text-label-secondary mb-2">
                  Drag & drop a PDF here, or
                </p>
                <label className="btn-accent inline-block cursor-pointer">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadDocMutation.mutate({ chatbotId: chatbot.public_id, file });
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-label-quaternary mt-2">PDF only, up to 20MB</p>
              </div>

              {/* Upload progress */}
              {uploadDocMutation.isPending && (
                <div className="flex items-center gap-2.5 mt-4">
                  <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <span className="text-[13px] font-medium text-label-secondary">Uploading...</span>
                </div>
              )}

              {uploadDocMutation.isError && (
                <p className="mt-3 text-[13px] text-red-500">
                  Failed to upload document. Please try again.
                </p>
              )}

              {/* Document list */}
              {chatbot.documents && chatbot.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {chatbot.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="shrink-0 text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-label-primary truncate">{doc.filename}</p>
                          <p className="text-[11px] text-label-quaternary">
                            {(doc.file_size / 1024).toFixed(0)} KB
                            {doc.status === 'ready' && ` · ${doc.chunks_indexed} chunks`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status indicator */}
                        {doc.status === 'pending' && (
                          <span className="text-[11px] text-label-quaternary px-2 py-0.5 bg-surface-primary rounded-full">Pending</span>
                        )}
                        {doc.status === 'processing' && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                            <span className="text-[11px] text-accent">Processing</span>
                          </div>
                        )}
                        {doc.status === 'ready' && (
                          <span className="text-[11px] text-green-500 px-2 py-0.5 bg-green-500/10 rounded-full">Ready</span>
                        )}
                        {doc.status === 'error' && (
                          <span className="text-[11px] text-red-500 px-2 py-0.5 bg-red-500/10 rounded-full">Error</span>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={() => deleteDocMutation.mutate({ chatbotId: chatbot.public_id, documentId: doc.id })}
                          disabled={deleteDocMutation.isPending}
                          className="p-1 text-label-quaternary hover:text-red-500 transition-colors"
                          title="Delete document"
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
            </div>
          )}
        </div>
      )}

      {chatbot.status === 'crawling' && discoveredUrls.length === 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[13px] font-medium text-label-secondary">
              Crawling in progress...
            </span>
          </div>
        </div>
      )}

      {/* URL Selector - shown when URLs are available (from either tab) */}
      {discoveredUrls.length > 0 && !discoverMutation.isPending && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-display font-semibold text-label-primary">
              Selected Pages
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCrawlSelected}
                disabled={!canCrawl}
                className="btn-accent"
              >
                {startCrawlMutation.isPending
                  ? 'Starting...'
                  : `Crawl ${selectedUrls.length} Pages`}
              </button>
              <button
                onClick={() => {
                  setDiscoveredUrls([]);
                  setSelectedUrls([]);
                  setWebsiteUrl('');
                }}
                className="btn-secondary"
              >
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

      {/* Crawl History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-display font-semibold text-label-primary">
            Crawl History
          </h2>
          {chatbot.crawl_jobs && chatbot.crawl_jobs.length > 0 && chatbot.status !== 'crawling' && (
            <button
              onClick={() => recrawlMutation.mutate(chatbot.public_id)}
              disabled={recrawlMutation.isPending}
              className="btn-secondary text-[12px] flex items-center gap-1.5"
            >
              {recrawlMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-label-quaternary/20 border-t-label-quaternary rounded-full animate-spin" />
                  Re-crawling...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Re-crawl
                </>
              )}
            </button>
          )}
        </div>

        {(!chatbot.crawl_jobs || chatbot.crawl_jobs.length === 0) && (
          <div className="card p-8 text-center">
            <p className="text-[14px] text-label-tertiary">
              No crawl jobs yet. Add pages above to start indexing.
            </p>
          </div>
        )}

        {chatbot.crawl_jobs && chatbot.crawl_jobs.length > 0 && (
          <div className="space-y-3">
            {chatbot.crawl_jobs.map((job) => (
              <CrawlStatus key={job.id} crawlJob={job} />
            ))}
          </div>
        )}
      </div>

      {/* Auto Re-crawl Settings */}
      <div>
        <h2 className="text-[14px] font-display font-semibold text-label-primary mb-4">Auto Re-crawl</h2>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-label-primary">
                Automatically re-crawl website
              </p>
              <p className="text-[12px] text-label-tertiary mt-0.5">
                Keep your agent's knowledge up to date by periodically re-crawling your website.
              </p>
            </div>
            <button
              onClick={() => {
                updateChatbotMutation.mutate({
                  chatbotId: chatbot.public_id,
                  data: {
                    name: chatbot.name,
                    description: chatbot.description,
                    instructions: chatbot.instructions,
                    auto_recrawl_enabled: !chatbot.auto_recrawl_enabled,
                  },
                });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
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
            <div className="mt-4 pt-4 border-t border-separator">
              <label className="text-[12px] text-label-secondary block mb-1.5">
                Re-crawl interval
              </label>
              <select
                value={chatbot.recrawl_interval_hours ?? 48}
                onChange={(e) => {
                  updateChatbotMutation.mutate({
                    chatbotId: chatbot.public_id,
                    data: {
                      name: chatbot.name,
                      description: chatbot.description,
                      instructions: chatbot.instructions,
                      recrawl_interval_hours: parseInt(e.target.value),
                    },
                  });
                }}
                className="input-field w-auto"
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
      </div>
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
          onChange={(e) => {
            setManualUrl(e.target.value);
            setError('');
          }}
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
      {error && (
        <p className="mt-2 text-[12px] text-red-500">{error}</p>
      )}
      {existingUrls.length > 0 && (
        <p className="mt-2 text-[12px] text-label-quaternary">
          {existingUrls.length} page{existingUrls.length !== 1 ? 's' : ''} added. View and manage them in the selection below.
        </p>
      )}
    </div>
  );
}

export default KnowledgeSection;
