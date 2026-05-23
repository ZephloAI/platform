// ============================================================
// Small formatting helpers shared across the dashboard.
// Kept dependency-free and simple on purpose.
// ============================================================

/**
 * Format a number compactly: 940 → "940", 1_242 → "1.2k", 24_000 → "24k",
 * 1_500_000 → "1.5M". Drops trailing ".0".
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(Math.round(value));

  const units = [
    { limit: 1_000_000_000, suffix: 'B' },
    { limit: 1_000_000, suffix: 'M' },
    { limit: 1_000, suffix: 'k' },
  ];

  for (const { limit, suffix } of units) {
    if (value >= limit) {
      const scaled = value / limit;
      // One decimal for values under 10 (e.g. 1.2k), none above (e.g. 24k)
      const text = scaled < 10 ? scaled.toFixed(1) : String(Math.round(scaled));
      return `${text.replace(/\.0$/, '')}${suffix}`;
    }
  }

  return String(value);
}

/**
 * Format a date as a short relative label: "Just now", "2h ago",
 * "Yesterday", "3d ago", or a date once older than a week.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface Trend {
  /** Whole-number percent change, e.g. 12 or -5. */
  pct: number;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Estimate a trend from a daily series by comparing the most recent half
 * of the window against the earlier half. Returns a percent change.
 */
export function trendFromSeries(counts: number[]): Trend {
  if (counts.length < 2) return { pct: 0, direction: 'flat' };

  const mid = Math.floor(counts.length / 2);
  const earlier = counts.slice(0, mid).reduce((a, b) => a + b, 0);
  const recent = counts.slice(mid).reduce((a, b) => a + b, 0);

  if (earlier === 0) {
    return recent === 0
      ? { pct: 0, direction: 'flat' }
      : { pct: 100, direction: 'up' };
  }

  const pct = Math.round(((recent - earlier) / earlier) * 100);
  return { pct, direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}
