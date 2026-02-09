import { useState, useMemo } from 'react';
import type { DiscoveredUrl } from '../types';

// ============================================================
// UrlSelector Component
// Scrollable list of discovered URLs with checkboxes, search
// filtering, and bulk selection controls.
// ============================================================

interface UrlSelectorProps {
  urls: DiscoveredUrl[];
  selectedUrls: string[];
  onSelectionChange: (urls: string[]) => void;
  onAddUrl: (url: DiscoveredUrl) => void;
}

function UrlSelector({ urls, selectedUrls, onSelectionChange, onAddUrl }: UrlSelectorProps) {
  const [search, setSearch] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const filteredUrls = useMemo(() => {
    if (!search.trim()) return urls;
    const query = search.toLowerCase();
    return urls.filter(
      (u) =>
        u.url.toLowerCase().includes(query) ||
        u.title.toLowerCase().includes(query)
    );
  }, [urls, search]);

  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);

  const allFilteredSelected = filteredUrls.length > 0 && filteredUrls.every((u) => selectedSet.has(u.url));

  const handleToggle = (url: string) => {
    if (selectedSet.has(url)) {
      onSelectionChange(selectedUrls.filter((u) => u !== url));
    } else {
      onSelectionChange([...selectedUrls, url]);
    }
  };

  const handleSelectAll = () => {
    const filteredUrlStrings = filteredUrls.map((u) => u.url);
    const existing = new Set(selectedUrls);
    for (const url of filteredUrlStrings) {
      existing.add(url);
    }
    onSelectionChange(Array.from(existing));
  };

  const handleDeselectAll = () => {
    const filteredUrlStrings = new Set(filteredUrls.map((u) => u.url));
    onSelectionChange(selectedUrls.filter((u) => !filteredUrlStrings.has(u)));
  };

  const existingUrls = useMemo(() => new Set(urls.map((u) => u.url)), [urls]);

  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;

    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      return;
    }

    // Don't add duplicates
    if (existingUrls.has(trimmed)) {
      setManualUrl('');
      return;
    }

    onAddUrl({ url: trimmed, title: trimmed });
    onSelectionChange([...selectedUrls, trimmed]);
    setManualUrl('');
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header with count and controls */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-label-primary">
            {selectedUrls.length} of {urls.length} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={allFilteredSelected}
              className="text-[12px] font-medium text-accent hover:text-accent-hover disabled:text-label-quaternary disabled:cursor-not-allowed transition-colors"
            >
              Select All
            </button>
            <span className="text-label-quaternary text-[12px]">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={selectedUrls.length === 0}
              className="text-[12px] font-medium text-accent hover:text-accent-hover disabled:text-label-quaternary disabled:cursor-not-allowed transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Add URL input */}
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManualUrl()}
            placeholder="Add a page URL..."
            className="flex-1 bg-surface-secondary/80 border border-black/[0.04] rounded-lg px-3.5 py-2 text-[13px] text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white transition-all duration-250 ease-apple"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            disabled={!manualUrl.trim()}
            className="px-3 py-2 text-[12px] font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
          >
            Add
          </button>
        </div>

        {/* Search/filter input */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter pages..."
          className="w-full bg-surface-secondary/80 border border-black/[0.04] rounded-lg px-3.5 py-2 text-[13px] text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white transition-all duration-250 ease-apple"
        />
      </div>

      {/* URL list */}
      <div className="max-h-[320px] overflow-y-auto px-2 pb-3">
        {filteredUrls.length === 0 && (
          <p className="text-[13px] text-label-tertiary text-center py-6">
            No pages match your filter.
          </p>
        )}

        {filteredUrls.map((item) => {
          const isSelected = selectedSet.has(item.url);
          return (
            <label
              key={item.url}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                isSelected
                  ? 'bg-accent/[0.04]'
                  : 'hover:bg-surface-secondary/60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(item.url)}
                className="mt-0.5 h-4 w-4 rounded border-black/[0.15] text-accent focus:ring-accent/30 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-label-primary truncate">
                  {item.title || item.url}
                </p>
                <p className="text-[12px] text-label-tertiary truncate">
                  {item.url}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default UrlSelector;
