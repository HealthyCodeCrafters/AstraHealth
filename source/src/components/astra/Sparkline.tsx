import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

export function Sparkline({
  data,
  color = "var(--primary)",
  height = 48,
  unit = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (data.length === 0) return <div style={{ height }} className="grid place-items-center hud-label">No data yet</div>;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(v: number) => [`${v} ${unit}`, ""]}
            separator=""
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${id})`} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
