// ============================================================
// Sparkline – a tiny single-stroke line chart that "draws" itself
// in on mount. Pure SVG, no chart library, so it stays crisp and
// cheap inside the dashboard metric cards.
// ============================================================

interface SparklineProps {
  /** Raw daily values; spaced evenly across the width. */
  data: number[];
  /** Tailwind text color class — the stroke uses currentColor. */
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 50;
const PAD = 5; // vertical breathing room so peaks/troughs aren't clipped

function buildPath(data: number[]): string {
  if (data.length === 0) return `M0,${HEIGHT / 2} L${WIDTH},${HEIGHT / 2}`;
  if (data.length === 1) return `M0,${HEIGHT / 2} L${WIDTH},${HEIGHT / 2}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = WIDTH / (data.length - 1);

  return data
    .map((value, i) => {
      const x = i * stepX;
      const y = PAD + (1 - (value - min) / range) * (HEIGHT - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function Sparkline({ data, className = 'text-primary' }: SparklineProps) {
  return (
    <svg
      className={`w-full h-full ${className}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="sparkline-path"
        d={buildPath(data)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default Sparkline;
