import { Link } from "@tanstack/react-router";
import { Check, Clock, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { accessTone } from "@/components/teckey/AccessBadge";
import { useTeckey, type AccessResult } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

const ICON: Record<AccessResult, typeof Check> = {
  CONCEDIDO: Check,
  "FUERA DE HORARIO": Clock,
  DENEGADO: X,
};

/** Últimas lecturas del registro; las que llegan mientras la vista está abierta se resaltan un instante. */
export function EventFeed({ limit = 7 }: { limit?: number }) {
  const { logs } = useTeckey();
  const initial = useRef<Set<string> | null>(null);
  if (!initial.current) initial.current = new Set(logs.map((l) => l.id));
  const rows = logs.slice(0, limit);

  // Tras el primer render, todo lo nuevo se marca como "recién llegado"
  const seen = useRef(initial.current);
  useEffect(() => {
    rows.forEach((l) => seen.current.add(l.id));
  });

  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Eventos en tiempo real</h3>
          <p className="text-sm text-muted-foreground">
            Últimas lecturas de tarjetas en los pabellones.
          </p>
        </div>
        <Link to="/logs" className="text-sm font-medium text-primary hover:underline">
          Ver registro completo
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {rows.map((l) => {
          const Icon = ICON[l.result];
          const fresh = !seen.current.has(l.id);
          return (
            <li
              key={l.id}
              className={cn(
                "flex items-center gap-3 rounded-md px-1 py-3",
                fresh && "teckey-arrive",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  accessTone[l.result].badge,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.professorName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Aula {l.classroom} · <span className="font-mono">{l.tag}</span> ·{" "}
                  <span className={accessTone[l.result].text}>{accessTone[l.result].label}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {l.datetime.slice(-5)}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="py-6 text-sm text-muted-foreground">
            Todavía no hay lecturas registradas.
          </li>
        )}
      </ul>
    </section>
  );
}
