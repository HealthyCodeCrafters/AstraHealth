import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import type { Trend } from "@/lib/astra/derived";
import { STATUS_META } from "@/lib/astra/ranges";
import type { Status } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

export const STATUS_CLASSES: Record<Status, { text: string; bg: string; soft: string; border: string; color: string }> = {
  green: { text: "text-status-green", bg: "bg-status-green", soft: "bg-status-green/12", border: "border-status-green/45", color: "var(--status-green)" },
  yellow: { text: "text-status-yellow", bg: "bg-status-yellow", soft: "bg-status-yellow/12", border: "border-status-yellow/45", color: "var(--status-yellow)" },
  orange: { text: "text-status-orange", bg: "bg-status-orange", soft: "bg-status-orange/12", border: "border-status-orange/45", color: "var(--status-orange)" },
  red: { text: "text-status-red", bg: "bg-status-red", soft: "bg-status-red/12", border: "border-status-red/50", color: "var(--status-red)" },
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5", className)} aria-hidden>
      <span className={cn("absolute inset-0 rounded-full animate-pulse-glow", STATUS_CLASSES[status].bg)} />
      <span className={cn("relative size-2.5 rounded-full", STATUS_CLASSES[status].bg)} />
    </span>
  );
}

export function StatusBadge({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const c = STATUS_CLASSES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em]",
        c.text,
        c.soft,
        c.border,
        className,
      )}
      title={STATUS_META[status].label}
    >
      <StatusDot status={status} className="size-2" />
      {label ?? STATUS_META[status].short}
    </span>
  );
}

export function TrendTag({ trend, className }: { trend: Trend; className?: string }) {
  const Icon = trend === "improving" ? ArrowUpRight : trend === "declining" ? ArrowDownRight : ArrowRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.12em]",
        trend === "improving" ? "text-teal" : trend === "declining" ? "text-status-orange" : "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {trend}
    </span>
  );
}

export function SimulatedTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-violet/40 bg-violet/10 px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-[0.14em] text-violet",
        className,
      )}
    >
      Simulated
    </span>
  );
}
