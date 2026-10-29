import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Classroom, SlotStatus } from "@/lib/teckey-store";

const tile: Record<SlotStatus, string> = {
  ocupado: "bg-occupied text-occupied-foreground hover:brightness-105",
  // Mezclas opacas: el fondo del plano es gris (muros) y no debe verse a través del aula
  programado:
    "bg-[color-mix(in_oklch,var(--color-scheduled)_16%,var(--color-card))] text-foreground hover:bg-[color-mix(in_oklch,var(--color-scheduled)_26%,var(--color-card))]",
  disponible:
    "bg-card text-foreground hover:bg-[color-mix(in_oklch,var(--color-available)_14%,var(--color-card))]",
};
const edge: Record<SlotStatus, string> = {
  ocupado: "bg-occupied-foreground/60",
  programado: "bg-scheduled",
  disponible: "bg-available",
};

export type RoomView = {
  room: Classroom;
  status: SlotStatus;
  /** Línea secundaria: curso, "Libre", etc. */
  caption?: string | undefined;
  /** Marca de cerradura abierta / tolerancia */
  tag?: string | undefined;
  title?: string | undefined;
};

/**
 * Plano esquemático de un pabellón: pisos apilados (el más alto arriba) y aulas
 * contiguas separadas por muros de 1 px, como en un plano de evacuación.
 */
export function FloorPlan({
  pavilion,
  rooms,
  onSelect,
  size = "md",
  header,
}: {
  pavilion: string;
  rooms: RoomView[];
  onSelect?: (room: Classroom) => void;
  size?: "sm" | "md";
  header?: ReactNode;
}) {
  const floors = [...new Set(rooms.map((r) => r.room.floor))].sort((a, b) => b - a);

  return (
    <div>
      {header}
      <div className="overflow-hidden rounded-md border border-foreground/25">
        {floors.map((floor, i) => {
          const row = rooms.filter((r) => r.room.floor === floor);
          return (
            <div
              key={floor}
              className={cn(
                "grid grid-cols-[2.25rem_minmax(0,1fr)]",
                i > 0 && "border-t border-foreground/25",
              )}
            >
              <div className="grid place-items-center border-r border-foreground/25 bg-secondary font-display text-sm font-semibold text-muted-foreground">
                P{floor}
              </div>
              <div
                className="grid gap-px bg-foreground/15"
                style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
              >
                {row.map(({ room, status, caption, tag, title }) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={onSelect ? () => onSelect(room) : undefined}
                    title={title}
                    aria-label={`Aula ${pavilion}${room.number}, ${status}${caption ? `, ${caption}` : ""}`}
                    className={cn(
                      "relative flex min-w-0 flex-col justify-between text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      size === "md" ? "h-[4.5rem] px-2.5 py-2" : "h-12 px-2 py-1.5",
                      tile[status],
                      !onSelect && "cursor-default",
                    )}
                  >
                    <span className={cn("absolute inset-x-0 bottom-0 h-[3px]", edge[status])} />
                    <span className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          "font-display font-semibold leading-none",
                          size === "md" ? "text-xl" : "text-base",
                        )}
                      >
                        {room.number}
                      </span>
                      {tag && (
                        <span className="rounded-sm bg-foreground px-1 py-px text-[10px] font-semibold leading-tight text-background">
                          {tag}
                        </span>
                      )}
                    </span>
                    {size === "md" && caption && (
                      <span
                        className={cn(
                          "truncate text-[11px] leading-tight",
                          status === "ocupado" ? "opacity-90" : "text-muted-foreground",
                        )}
                      >
                        {caption}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
