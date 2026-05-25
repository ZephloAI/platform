import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscoveredUrl } from '../types';

/**
 * Streams the pages of a website as they're discovered, over a single request.
 *
 * Opens a Server-Sent Events connection to the discovery endpoint and appends
 * each page to `pages` the moment it arrives. `isDiscovering` is true while the
 * crawl is running and flips to false (with `isComplete` true) when the server
 * sends its `complete` event — the dashboard uses that to gate the Crawl button.
 *
 * Auth: the JWT is passed as a query param because EventSource can't set an
 * Authorization header (same approach the admin chat WebSocket uses).
 *
 * Usage:
 *   const discover = useDiscoverStream(agentId);
 *   discover.start('https://example.com');
 */
export function useDiscoverStream(agentId: string) {
  const [pages, setPages] = useState<DiscoveredUrl[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  // Tracks normal completion so we can ignore the connection-close that EventSource
  // reports as an "error" right after the stream ends (and stop it reconnecting).
  const completedRef = useRef(false);

  const close = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    close();
    completedRef.current = false;
    setPages([]);
    setIsDiscovering(false);
    setIsComplete(false);
    setError(null);
  }, [close]);

  const start = useCallback(
    (websiteUrl: string) => {
      reset();

      const base = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token') ?? '';
      const url =
        `${base}/api/agents/${agentId}/discover/stream` +
        `?website_url=${encodeURIComponent(websiteUrl)}&token=${encodeURIComponent(token)}`;

      setIsDiscovering(true);
      const es = new EventSource(url);
      esRef.current = es;

      // Each `data:` line is one discovered page. De-dupe defensively by URL.
      es.onmessage = (event) => {
        try {
          const page = JSON.parse(event.data) as DiscoveredUrl;
          setPages((prev) => (prev.some((p) => p.url === page.url) ? prev : [...prev, page]));
        } catch {
          /* ignore a malformed line */
        }
      };

      // Discovery finished cleanly.
      es.addEventListener('complete', () => {
        completedRef.current = true;
        setIsComplete(true);
        setIsDiscovering(false);
        close();
      });

      // Two kinds of "error" land here: an app error from the server (carries
      // data) and a transport close (no data). After a clean complete, ignore it.
      es.addEventListener('error', (event) => {
        if (completedRef.current) return;
        const data = (event as MessageEvent).data;
        if (data) {
          try {
            setError(JSON.parse(data).message || 'Discovery failed.');
          } catch {
            setError('Discovery failed.');
          }
        } else {
          setError('Lost connection while discovering pages.');
        }
        setIsDiscovering(false);
        close();
      });
    },
    [agentId, reset, close],
  );

  // Close the stream if the component unmounts mid-discovery.
  useEffect(() => close, [close]);

  return { pages, isDiscovering, isComplete, error, start, reset };
}
