import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HealthDistributionChartProps {
  nodeMetrics: Array<{
    tier: "Excellent" | "Good" | "Poor";
    healthScore: number;
  }>;
  isLoading?: boolean;
}

/* -------------------------
   Custom Tooltip (White Text)
-------------------------- */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-card border border-border px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">
        Nodes:{" "}
        <span className="font-semibold text-foreground">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
};

export const HealthDistributionChart = ({
  nodeMetrics,
  isLoading,
}: HealthDistributionChartProps) => {
  if (isLoading) {
    return (
      <div className="h-80 rounded-2xl border border-border bg-card p-6 flex items-center justify-center">
        <div className="text-muted-foreground">
          Loading health distribution...
        </div>
      </div>
    );
  }

  /* -------------------------
     Distribution Calculation
  -------------------------- */
  const distribution = {
    Excellent: nodeMetrics.filter((m) => m.tier === "Excellent").length,
    Good: nodeMetrics.filter((m) => m.tier === "Good").length,
    Poor: nodeMetrics.filter((m) => m.tier === "Poor").length,
  };

  const data = [
    { tier: "Excellent", count: distribution.Excellent },
    { tier: "Good", count: distribution.Good },
    { tier: "Poor", count: distribution.Poor },
  ];

  const colors: Record<string, string> = {
    Excellent: "hsl(142, 71%, 45%)",
    Good: "hsl(38, 92%, 50%)",
    Poor: "hsl(0, 84%, 60%)",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          Health Score Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          Distribution of nodes by health tier
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis
            dataKey="tier"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{
              outline: "none",
              border: "none",
              boxShadow: "none",
              backgroundColor: "transparent",
            }}
            cursor={{ fill: "transparent" }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[entry.tier]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="text-muted-foreground">
            Excellent (≥90)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[hsl(38,92%,50%)]" />
          <span className="text-muted-foreground">
            Good (75–89)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[hsl(0,84%,60%)]" />
          <span className="text-muted-foreground">
            Poor (&lt;75)
          </span>
        </div>
      </div>
    </div>
  );
};
