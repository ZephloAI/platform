import { useState } from 'react';
import { useStartCrawl, useDiscoverUrls } from '../hooks/useChatbots';
import CrawlStatus from './CrawlStatus';
import UrlSelector from './UrlSelector';
import type { Chatbot, DiscoveredUrl } from '../types';

// ============================================================
// KnowledgeSection
// Tabbed interface: "Website" to discover pages from a URL,
// "Pages" to add individual URLs manually. Both feed into a
// shared URL selection that gets crawled. Includes crawl history.
// ============================================================

type Tab = 'website' | 'pages';

interface KnowledgeSectionProps {
  chatbot: Chatbot;
}

function KnowledgeSection({ chatbot }: KnowledgeSectionProps) {
  const startCrawlMutation = useStartCrawl();
  const discoverMutation = useDiscoverUrls();

  const [activeTab, setActiveTab] = useState<Tab>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // -- Website tab: discover URLs from a website --
  const handleDiscover = () => {
    if (!websiteUrl.trim()) return;

    discoverMutation.mutate(
      { chatbotId: chatbot.id, websiteUrl: websiteUrl.trim() },
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
      { chatbotId: chatbot.id, selectedUrls },
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
          <div className="flex gap-0 mb-4 bg-surface-secondary/60 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('website')}
              className={`flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
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
              className={`flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
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
          </div>

          {/* Website tab content */}
          {activeTab === 'website' && (
            <div className="glass-card p-5 animate-fade-in">
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
                  className="flex-1 bg-surface-secondary/80 border border-black/[0.04] rounded-lg px-3.5 py-2.5 text-[13px] text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white transition-all duration-250 ease-apple disabled:opacity-50"
                />
                {canDiscover && (
                  <button
                    onClick={handleDiscover}
                    className="btn-primary shrink-0"
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
            <div className="glass-card p-5 animate-fade-in">
              <p className="text-[13px] text-label-secondary mb-3">
                Add specific page URLs directly. These will be crawled to build the agent's knowledge base.
              </p>
              <ManualUrlAdder
                existingUrls={discoveredUrls}
                onAddUrl={handleAddManualUrl}
              />
            </div>
          )}
        </div>
      )}

      {chatbot.status === 'crawling' && discoveredUrls.length === 0 && (
        <div className="glass-card p-6">
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
            <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider">
              Selected Pages
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCrawlSelected}
                disabled={!canCrawl}
                className="btn-primary"
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
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-4">
          Crawl History
        </h2>

        {(!chatbot.crawl_jobs || chatbot.crawl_jobs.length === 0) && (
          <div className="glass-card p-8 text-center">
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
          className="flex-1 bg-surface-secondary/80 border border-black/[0.04] rounded-lg px-3.5 py-2.5 text-[13px] text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white transition-all duration-250 ease-apple"
        />
        <button
          onClick={handleAdd}
          disabled={!manualUrl.trim()}
          className="px-4 py-2.5 text-[13px] font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
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
