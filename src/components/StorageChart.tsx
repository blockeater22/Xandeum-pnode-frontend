import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StorageChartProps {
  data: { range: string; count: number }[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label} utilization</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value} nodes
        </p>
      </div>
    );
  }
  return null;
};

const getBarColor = (range: string) => {
  if (range.includes('80-100')) return '#EF4444';
  if (range.includes('60-80')) return '#FACC15';
  return '#22C55E';
};

export const StorageChart = ({ data, isLoading }: StorageChartProps) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="p-7 rounded-2xl bg-card border border-border">
        <div className="h-5 w-44 mb-2 rounded shimmer" />
        <div className="h-4 w-32 mb-8 rounded shimmer" />
        <div className="h-[220px] rounded-xl shimmer" />
      </div>
    );
  }

  return (
    <div className="p-7 rounded-2xl bg-card border border-border card-glow">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">Storage Utilization</h3>
          <p className="text-sm text-muted-foreground mt-1">Distribution by usage</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs font-medium text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#FACC15' }} />
            <span className="text-xs font-medium text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-xs font-medium text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              width={35}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.range)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
