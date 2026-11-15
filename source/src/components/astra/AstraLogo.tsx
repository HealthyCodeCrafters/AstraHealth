import { cn } from "@/lib/utils";

export function AstraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="astra-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="url(#astra-g)" strokeWidth="1.5" transform="rotate(-25 24 24)" opacity="0.7" />
      <path d="M24 6 L37 40 H31 L24 20 L17 40 H11 Z" fill="url(#astra-g)" />
      <path d="M8 27 H17 L20 22 L23 31 L26 25 H40" fill="none" stroke="var(--foreground)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AstraLogo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <AstraMark />
      <div className="leading-none">
        <p className="font-display text-xl font-bold tracking-[0.32em] text-foreground">ASTRA</p>
        {!compact && <p className="mt-1 hud-label text-[0.55rem]">Health Intelligence</p>}
      </div>
    </div>
  );
}
