import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { Chatbot, ChatbotMiniAnalytics, DailyDataPoint } from '../types';

interface ChatbotCardProps {
  chatbot: Chatbot;
  analytics?: ChatbotMiniAnalytics;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div className="bg-white rounded-lg px-2 py-1 shadow-card-hover text-[10px] border border-black/[0.06]">
      <p className="text-label-tertiary">{date ? formatDate(date) : ''}</p>
      <p className="font-semibold text-label-primary">{payload[0].value}</p>
    </div>
  );
}

function Sparkline({ data, color }: { data: DailyDataPoint[]; color: string }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-20 h-8 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
            <defs>
              <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<SparkTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={1.2}
              fill={`url(#spark-${color.replace('#', '')})`}
              dot={false}
              activeDot={{ r: 2, strokeWidth: 1, fill: '#fff', stroke: color }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[12px] font-semibold text-label-primary tabular-nums leading-none">
        {total.toLocaleString()}
      </p>
    </div>
  );
}

const emptyData: DailyDataPoint[] = Array.from({ length: 14 }, () => ({
  date: '',
  count: 0,
}));

function ChatbotCard({ chatbot, analytics, onDelete }: ChatbotCardProps) {
  const isActive = chatbot.is_active !== false;

  return (
    <div className="flex items-center gap-4 px-3 py-3 md:px-5 md:py-3.5 hover:bg-surface-secondary/50 transition-colors group">
      {/* Icon + Name */}
      <Link
        to={`/chatbots/${chatbot.id}`}
        className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Link>
      <Link to={`/chatbots/${chatbot.id}`} className="min-w-0 flex-1 md:flex-none md:w-40 shrink-0">
        <p className="text-[14px] font-display font-semibold text-label-primary truncate group-hover:text-accent transition-colors">
          {chatbot.name}
        </p>
      </Link>

      {/* Sparkline metrics - hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-8">
        <Sparkline data={analytics?.messages ?? emptyData} color="#1275CA" />
        <Sparkline data={analytics?.conversations ?? emptyData} color="#1A1A2E" />
        <Sparkline data={analytics?.resolved ?? emptyData} color="#6B8F71" />
      </div>

      {/* Status + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${isActive ? 'bg-sage-500' : 'bg-label-quaternary'}`}
          title={isActive ? 'Active' : 'Inactive'}
        />
        <Link
          to={`/chatbots/${chatbot.id}`}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/[0.05] transition-colors"
          title="Edit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-label-quaternary group-hover:text-label-secondary transition-colors" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-label-quaternary hover:text-red-500 transition-colors" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatbotCard;
