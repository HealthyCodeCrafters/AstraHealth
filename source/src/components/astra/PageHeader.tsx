import type { ReactNode } from "react";

export function PageHeader({ kicker, title, description, actions }: { kicker: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-rise">
      <div className="max-w-3xl">
        <p className="hud-label text-primary">{kicker}</p>
        <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, kicker, children, actions, className = "" }: { title?: string; kicker?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-2xl p-5 animate-rise ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {kicker && <p className="hud-label">{kicker}</p>}
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="rounded-xl border border-violet/30 bg-violet/8 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      <span className="font-semibold text-violet">Not a medical diagnosis.</span>{" "}
      {children ??
        "ASTRA supports self-monitoring only. Colour codes compare readings with configurable reference ranges and never replace assessment by your flight surgeon or mission medical officer."}
    </p>
  );
}
