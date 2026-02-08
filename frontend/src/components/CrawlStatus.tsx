import type { CrawlJob } from '../types';

// ============================================================
// CrawlStatus Component
// Apple-style progress card with animated status indicator.
// Clean typography hierarchy and subtle background tint.
// ============================================================

interface CrawlStatusProps {
  crawlJob: CrawlJob;
}

// Map crawl status to visual config
const STATUS_CONFIG: Record<
  CrawlJob['status'],
  { dot: string; label: string; bg: string; animate: boolean }
> = {
  pending: {
    dot: 'bg-amber-400',
    label: 'Waiting to start',
    bg: 'bg-amber-500/[0.03]',
    animate: false,
  },
  in_progress: {
    dot: 'bg-blue-500',
    label: 'Crawling website',
    bg: 'bg-blue-500/[0.03]',
    animate: true,
  },
  completed: {
    dot: 'bg-emerald-500',
    label: 'Completed',
    bg: 'bg-emerald-500/[0.03]',
    animate: false,
  },
  failed: {
    dot: 'bg-red-500',
    label: 'Failed',
    bg: 'bg-red-500/[0.03]',
    animate: false,
  },
};

function CrawlStatus({ crawlJob }: CrawlStatusProps) {
  const config = STATUS_CONFIG[crawlJob.status];

  return (
    <div className={`${config.bg} rounded-2xl border border-black/[0.04] p-5 animate-fade-in`}>
      {/* Status row */}
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className={`h-2 w-2 rounded-full ${config.dot} ${config.animate ? 'animate-pulse-soft' : ''}`}
        />
        <span className="text-[13px] font-medium text-label-primary">{config.label}</span>
      </div>

      {/* Stats in a clean grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-label-tertiary uppercase tracking-wider mb-0.5">
            Pages Crawled
          </p>
          <p className="text-[22px] font-semibold text-label-primary tracking-tight">
            {crawlJob.pages_crawled}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-label-tertiary uppercase tracking-wider mb-0.5">
            Started
          </p>
          <p className="text-[13px] text-label-secondary">
            {new Date(crawlJob.started_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {crawlJob.completed_at && (
          <div>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mb-0.5">
              Completed
            </p>
            <p className="text-[13px] text-label-secondary">
              {new Date(crawlJob.completed_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrawlStatus;
