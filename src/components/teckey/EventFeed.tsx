import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { accessTone } from "@/components/teckey/AccessBadge";
import { useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

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
    <section className="surface-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">Últimas lecturas</h2>
        <Link to="/logs" className="text-sm font-medium text-primary hover:underline">
          Ver registro completo
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Hora</th>
            <th>Profesor y aula</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((l) => {
            const fresh = !seen.current.has(l.id);
            const tone = accessTone[l.result];
            return (
              <tr key={l.id} className={cn(fresh && "teckey-arrive")}>
                <td className="w-16 py-3 pl-5 align-top font-display text-base font-semibold tabular-nums text-muted-foreground">
                  {l.datetime.slice(-5)}
                </td>
                <td className="min-w-0 py-3 pr-3">
                  <p className="font-medium">{l.professorName}</p>
                  <p className="text-xs text-muted-foreground">
                    Aula {l.classroom}, tarjeta <span className="font-mono">{l.tag}</span>
                  </p>
                </td>
                <td className="py-3 pr-5 text-right align-top">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium",
                      tone.text,
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
                    {tone.label}
                  </span>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-6 text-muted-foreground">
                Todavía no hay lecturas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
