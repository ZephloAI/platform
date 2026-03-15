import { useMemo, useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyDataPoint } from '../types';

function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const from = display;
    if (from === target) return;
    startRef.current = { value: from, time: performance.now() };

    function tick(now: number) {
      const elapsed = now - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current.value + (target - startRef.current.value) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

interface AnalyticsChartProps {
  data: DailyDataPoint[];
  title: string;
  color: string;
  delay?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div className="card rounded-lg px-2.5 py-1.5 shadow-card-hover text-[11px]">
      <p className="text-label-tertiary">{date ? formatDate(date) : ''}</p>
      <p className="font-semibold text-label-primary">{payload[0].value}</p>
    </div>
  );
}

function AnalyticsChart({ data, title, color, delay }: AnalyticsChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);
  const animatedTotal = useAnimatedNumber(total);

  return (
    <div
      className={`metric-card !p-4 animate-slide-up${delay ? ` [animation-delay:${delay}]` : ''}`}
    >
      <p className="text-[11px] font-medium text-label-tertiary">{title}</p>
      <p className="font-display text-[22px] font-bold text-label-primary tracking-tight leading-none mt-1">
        {animatedTotal.toLocaleString()}
      </p>
      <div className="h-16 mt-2 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${color.replace('#', '')})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1.5, fill: '#fff', stroke: color }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;
