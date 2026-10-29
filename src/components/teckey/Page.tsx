import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Título de página, una línea de contexto y las acciones principales a la derecha. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Pestañas subrayadas; el número de cada pestaña va con la tipografía de cifras. */
export function Tabs<K extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: K;
  onChange: (k: K) => void;
  options: ReadonlyArray<{ key: K; label: string; count?: number }>;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-6 border-b border-border", className)}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={cn(
              "-mb-px flex items-baseline gap-1.5 border-b-2 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className={cn(
                  "font-display text-base font-semibold",
                  !active && "text-muted-foreground",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Contenedor de tabla con borde fino y encabezado gris, sin relleno interior. */
export function TablePanel({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <section className="surface-card overflow-hidden">
      {toolbar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto [&_thead_tr]:bg-secondary/70 [&_th]:h-10 [&_th]:px-4 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:px-4 [&_td]:py-3">
        {children}
      </div>
    </section>
  );
}

/** Marca de estado en tablas: punto de color + texto. */
export function StatusText({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad" | "muted";
  children: ReactNode;
}) {
  const map = {
    ok: ["text-scheduled", "bg-scheduled"],
    warn: ["text-available-foreground dark:text-available", "bg-available"],
    bad: ["text-destructive", "bg-destructive"],
    muted: ["text-muted-foreground", "bg-muted-foreground/50"],
  } as const;
  const [text, dot] = map[tone];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium", text)}
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {children}
    </span>
  );
}
