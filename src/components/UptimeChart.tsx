import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UptimeChartProps {
  data: { time: string; uptime: number }[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toFixed(2)}% uptime
        </p>
      </div>
    );
  }
  return null;
};

export const UptimeChart = ({ data, isLoading }: UptimeChartProps) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="p-7 rounded-2xl bg-card border border-border">
        <div className="h-5 w-36 mb-2 rounded shimmer" />
        <div className="h-4 w-24 mb-8 rounded shimmer" />
        <div className="h-[220px] rounded-xl shimmer" />
      </div>
    );
  }

  return (
    <div className="p-7 rounded-2xl bg-card border border-border card-glow">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">Uptime Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-2.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
          <span className="w-3.5 h-0.5 bg-primary rounded-full" />
          <span className="text-xs font-medium text-muted-foreground">Network Uptime</span>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickMargin={12}
              interval={4}
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickFormatter={(value) => `${Math.round(value)}%`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="uptime"
              stroke="#22C55E"
              strokeWidth={2.5}
              fill="url(#uptimeGradient)"
              fillOpacity={1}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
