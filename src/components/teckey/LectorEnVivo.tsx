import { Check, Clock, Nfc, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accessTone } from "@/components/teckey/AccessBadge";
import { USE_MOCK } from "@/lib/api";
import {
  actions,
  cardSlot,
  currentBlock,
  professorName,
  todayIndex,
  useTeckey,
  type AccessResult,
  type LogItem,
} from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

const RESULT_ICON: Record<AccessResult, typeof Check> = {
  CONCEDIDO: Check,
  "FUERA DE HORARIO": Clock,
  DENEGADO: X,
};
const RESULT_TITLE: Record<AccessResult, string> = {
  CONCEDIDO: "Acceso concedido",
  "FUERA DE HORARIO": "Fuera de horario",
  DENEGADO: "Acceso denegado",
};

/**
 * Muestra la última lectura del lector RFID: espera → verde / ámbar / rojo → espera.
 * En modo demostración incluye controles para simular el paso de una tarjeta.
 */
export function LectorEnVivo() {
  const { logs } = useTeckey();
  const [shown, setShown] = useState<LogItem | null>(null);
  const lastSeen = useRef<string | undefined>(logs[0]?.id);

  useEffect(() => {
    const latest = logs[0];
    if (!latest || latest.id === lastSeen.current) return;
    lastSeen.current = latest.id;
    setShown(latest);
    const t = setTimeout(() => setShown(null), 3500);
    return () => clearTimeout(t);
  }, [logs]);

  const tone = shown ? accessTone[shown.result] : null;
  const Icon = shown ? RESULT_ICON[shown.result] : Nfc;

  return (
    <section className="surface-card flex min-w-0 flex-col p-5">
      <h3 className="text-lg font-semibold tracking-tight">Lector RFID en vivo</h3>
      <p className="text-sm text-muted-foreground">
        Cada tarjeta que pasa por un aula aparece aquí.
      </p>

      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <div
          className={cn(
            "relative grid h-36 w-36 place-items-center overflow-hidden rounded-full border-4 transition-colors duration-300",
            tone ? tone.ring : "border-primary/70 bg-primary/5 text-primary",
          )}
        >
          <Icon className="h-14 w-14" strokeWidth={1.6} />
          {!shown && (
            <span className="teckey-scan-line absolute inset-x-5 top-1/2 h-0.5 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
          )}
        </div>
        <p className={cn("mt-4 text-lg font-semibold", tone?.text)} aria-live="polite">
          {shown ? RESULT_TITLE[shown.result] : "Acerque la tarjeta al lector"}
        </p>
        <p className="min-h-5 text-sm text-muted-foreground">
          {shown
            ? `${shown.professorName} · Aula ${shown.classroom} · ${shown.tag}`
            : "Esperando lectura"}
        </p>
      </div>

      {USE_MOCK && <Simulador />}
    </section>
  );
}

/** Controles de demostración: elegir tarjeta y aula, o dejar que pasen tarjetas solas. */
function Simulador() {
  const state = useTeckey();
  const { cards, classrooms, professors } = state;

  // Al elegir tarjeta, propone el aula donde tiene clase ahora (para que la demo muestre un acceso concedido).
  const suggestRoom = (id: string) => {
    const block = currentBlock();
    const slot = block ? cardSlot(state, id, state.week, todayIndex(), block.index) : null;
    return slot?.classroomId;
  };

  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [roomId, setRoomId] = useState(
    () => suggestRoom(cards[0]?.id ?? "") ?? classrooms[0]?.id ?? "",
  );
  const [auto, setAuto] = useState(false);

  const pickCard = (id: string) => {
    setCardId(id);
    const room = suggestRoom(id);
    if (room) setRoomId(room);
  };

  const swipe = (cid = cardId, rid = roomId) => {
    if (cid && rid) actions.swipeCard(cid, rid);
  };

  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      const s = stateRef.current;
      const card = s.cards[Math.floor(Math.random() * s.cards.length)];
      if (!card) return;
      const scheduled = Math.random() < 0.6 ? suggestRoom(card.id) : undefined;
      const room = scheduled ?? s.classrooms[Math.floor(Math.random() * s.classrooms.length)]?.id;
      if (room) actions.swipeCard(card.id, room);
    }, 4500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const owner = (pid: string | null) => {
    const p = professors.find((x) => x.id === pid);
    return p ? professorName(p) : "Sin asignar";
  };

  return (
    <div className="space-y-3 border-t border-dashed border-border pt-4">
      <p className="text-xs font-medium text-muted-foreground">Simulador (modo demostración)</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <Select value={cardId} onValueChange={pickCard}>
          <SelectTrigger aria-label="Tarjeta" className="min-w-0 [&>span]:truncate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cards.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} · {owner(c.professorId)}
                {c.status === "Inactiva" ? " (inactiva)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roomId} onValueChange={setRoomId}>
          <SelectTrigger aria-label="Aula">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                Aula {r.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={() => swipe()}>
          <Nfc className="mr-2 h-4 w-4" /> Pasar tarjeta
        </Button>
        <div className="flex items-center gap-2">
          <Switch id="auto-sim" checked={auto} onCheckedChange={setAuto} />
          <Label htmlFor="auto-sim" className="text-sm font-normal">
            Lecturas automáticas
          </Label>
        </div>
      </div>
    </div>
  );
}
