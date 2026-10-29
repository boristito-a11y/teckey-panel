import { cn } from "@/lib/utils";
import type { AccessResult } from "@/lib/teckey-store";

/** Verde = concedido, ámbar = fuera de horario, rojo = denegado (tarjeta deshabilitada o desconocida). */
export const accessTone: Record<
  AccessResult,
  { badge: string; ring: string; text: string; label: string }
> = {
  CONCEDIDO: {
    badge: "bg-scheduled/15 text-scheduled",
    ring: "border-scheduled bg-scheduled/10 text-scheduled",
    text: "text-scheduled",
    label: "Concedido",
  },
  "FUERA DE HORARIO": {
    badge: "bg-available/25 text-available-foreground dark:text-available",
    ring: "border-available bg-available/15 text-available-foreground dark:text-available",
    text: "text-available-foreground dark:text-available",
    label: "Fuera de horario",
  },
  DENEGADO: {
    badge: "bg-destructive/15 text-destructive",
    ring: "border-destructive bg-destructive/10 text-destructive",
    text: "text-destructive",
    label: "Denegado",
  },
};

export function AccessBadge({ result, className }: { result: AccessResult; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        accessTone[result].badge,
        className,
      )}
    >
      {result}
    </span>
  );
}
