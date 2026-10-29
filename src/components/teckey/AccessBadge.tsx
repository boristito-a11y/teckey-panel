import { cn } from "@/lib/utils";
import type { AccessResult } from "@/lib/teckey-store";

/** Verde = concedido, ámbar = fuera de horario, rojo = denegado (huella deshabilitada o no registrada). */
export const accessTone: Record<
  AccessResult,
  { badge: string; ring: string; text: string; dot: string; led: string; label: string }
> = {
  CONCEDIDO: {
    badge: "bg-scheduled/12 text-scheduled",
    ring: "border-scheduled text-scheduled",
    text: "text-scheduled",
    dot: "bg-scheduled",
    led: "bg-scheduled",
    label: "Concedido",
  },
  "FUERA DE HORARIO": {
    badge: "bg-available/20 text-available-foreground dark:text-available",
    ring: "border-available text-available-foreground dark:text-available",
    text: "text-available-foreground dark:text-available",
    dot: "bg-available",
    led: "bg-available",
    label: "Fuera de horario",
  },
  DENEGADO: {
    badge: "bg-destructive/12 text-destructive",
    ring: "border-destructive text-destructive",
    text: "text-destructive",
    dot: "bg-destructive",
    led: "bg-destructive",
    label: "Denegado",
  },
};

/** Resultado de una lectura: punto de color + texto, sin píldora rellena. */
export function AccessBadge({ result, className }: { result: AccessResult; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium",
        accessTone[result].text,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", accessTone[result].dot)} />
      {accessTone[result].label}
    </span>
  );
}
