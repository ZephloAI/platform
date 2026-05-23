import Sparkline from './Sparkline';
import type { Trend } from '../lib/format';

// ============================================================
// MetricCard – one tile in the dashboard metrics strip.
// Shows a label, a delta badge, the headline value, and a sparkline.
// ============================================================

interface MetricCardProps {
  label: string;
  /** Pre-formatted headline, e.g. "24k" or "92%". */
  value: string;
  /** Daily series powering the sparkline. */
  series: number[];
  trend?: Trend;
}

function TrendBadge({ trend }: { trend: Trend }) {
  const cls =
    trend.direction === 'up'
      ? 'trend-up'
      : trend.direction === 'down'
        ? 'trend-down'
        : 'trend-flat';
  const sign = trend.pct > 0 ? '+' : '';
  return <span className={`trend-badge ${cls}`}>{`${sign}${trend.pct}%`}</span>;
}

function MetricCard({ label, value, series, trend }: MetricCardProps) {
  return (
    <div className="bg-white hairline-border p-5 rounded-xl flex flex-col gap-1 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wider">
          {label}
        </span>
        {trend && <TrendBadge trend={trend} />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h2 className="metric-value">
          {value}
        </h2>
        <div className="w-20 h-10 shrink-0">
          <Sparkline data={series} />
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
