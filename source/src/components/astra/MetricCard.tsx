import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Trend } from "@/lib/astra/derived";
import type { Status } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

import type { CardKey } from "./healthCards";
import { LiveSparkline } from "./LiveSparkline";
import { Sparkline } from "./Sparkline";
import { STATUS_CLASSES, StatusBadge, TrendTag } from "./status";

export interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: ReactNode;
  unit?: string;
  status: Status;
  trend: Trend;
  series: { label: string; value: number }[];
  explanation: string;
  footer?: ReactNode;
  highlight?: boolean;
  delay?: number;
  /** When set, the graph streams live like a hospital monitor instead of showing history. */
  liveKey?: CardKey;
}

export function MetricCard({ icon: Icon, title, value, unit, status, trend, series, explanation, footer, highlight, delay = 0, liveKey }: MetricCardProps) {
  const c = STATUS_CLASSES[status];
  return (
    <article
      className={cn(
        "glass group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300 animate-rise hover:-translate-y-0.5 hover:border-primary/40",
        status !== "green" && c.border,
        highlight && "ring-1 ring-primary/40",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px opacity-70", c.bg)} />
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-lg border", c.border, c.soft)}>
            <Icon className={cn("size-4", c.text)} aria-hidden />
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </header>
      <div className="flex items-end justify-between gap-3">
        <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        <TrendTag trend={trend} />
      </div>
      {liveKey ? <LiveSparkline cardKey={liveKey} color={c.color} /> : <Sparkline data={series} color={c.color} unit={unit} />}
      <p className="text-xs leading-relaxed text-muted-foreground">{explanation}</p>
      {footer && <div className="border-t border-border pt-2 text-xs text-muted-foreground">{footer}</div>}
    </article>
  );
}
