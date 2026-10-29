import { cn } from "@/lib/utils";
import type { SlotStatus } from "@/lib/teckey-store";

export const statusLabel: Record<SlotStatus, string> = {
  ocupado: "Ocupado",
  programado: "Programado",
  disponible: "Disponible",
};

export const statusDot: Record<SlotStatus, string> = {
  ocupado: "bg-occupied",
  programado: "bg-scheduled",
  disponible: "bg-available",
};

export const statusCircle: Record<SlotStatus, string> = {
  ocupado: "bg-occupied text-occupied-foreground ring-occupied/25",
  programado: "bg-scheduled text-scheduled-foreground ring-scheduled/25",
  disponible: "bg-available text-available-foreground ring-available/30",
};

/** Entrada de leyenda: cuadro de color + nombre del estado. */
export function StatusPill({ status, className }: { status: SlotStatus; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <span className={cn("h-2.5 w-2.5 rounded-[2px]", statusDot[status])} />
      {statusLabel[status]}
    </span>
  );
}
