'use client';

interface Point {
  date: string;
  value: number;
}

interface SparklineProps {
  data: Point[];
  height?: number;
  color?: string;
  fill?: string;
}

export function Sparkline({ data, height = 48, color = '#3b82f6', fill = '#dbeafe' }: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className="h-[var(--h)] w-full bg-muted/30 rounded-lg" style={{ ['--h' as never]: `${height}px` }} />;
  }
  const width = 200;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = width / Math.max(1, data.length - 1);
  const points = data
    .map((d, i) => `${i * stepX},${height - (d.value / max) * (height - 4) - 2}`)
    .join(' ');
  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DualLineChart({
  data,
  height = 180,
}: {
  data: { date: string; views: number; leads: number }[];
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-xl bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center text-xs text-muted-foreground border border-dashed"
        style={{ height }}
      >
        <div className="text-center">
          <p className="font-medium">No activity yet</p>
          <p className="text-[11px] mt-1 text-muted-foreground/60">Data will appear here once you start getting views</p>
        </div>
      </div>
    );
  }
  const width = 600;
  const padding = 28;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const maxV = Math.max(...data.map((d) => Math.max(d.views, d.leads)), 1);
  const stepX = innerW / Math.max(1, data.length - 1);

  const viewsPts = data.map((d, i) => `${padding + i * stepX},${padding + innerH - (d.views / maxV) * innerH}`).join(' ');
  const leadsPts = data.map((d, i) => `${padding + i * stepX},${padding + innerH - (d.leads / maxV) * innerH}`).join(' ');

  // Fill area under views line
  const viewsAreaPts = `${padding},${padding + innerH} ${viewsPts} ${padding + (data.length - 1) * stepX},${padding + innerH}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
        </linearGradient>
        <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={padding}
          y1={padding + innerH * (1 - ratio)}
          x2={width - padding}
          y2={padding + innerH * (1 - ratio)}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeDasharray="4 4"
        />
      ))}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.1} />
      {/* Fill areas */}
      <polygon points={viewsAreaPts} fill="url(#viewsGrad)" />
      {/* Lines */}
      <polyline fill="none" stroke="#3b82f6" strokeWidth={2.5} points={viewsPts} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="none" stroke="#10b981" strokeWidth={2} points={leadsPts} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />
      {/* Dots on last points */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = padding + (data.length - 1) * stepX;
        const yViews = padding + innerH - (last.views / maxV) * innerH;
        const yLeads = padding + innerH - (last.leads / maxV) * innerH;
        return (
          <>
            <circle cx={x} cy={yViews} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />
            <circle cx={x} cy={yLeads} r={3.5} fill="#10b981" stroke="white" strokeWidth={2} />
          </>
        );
      })()}
    </svg>
  );
}
