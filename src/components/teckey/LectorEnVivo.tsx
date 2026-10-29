import { Check, Clock, Fingerprint, X } from "lucide-react";
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
 * Muestra la última lectura de los lectores de huella: espera → verde / ámbar / rojo → espera.
 * En modo demostración incluye controles para simular que un docente pone su huella.
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
  const Icon = shown ? RESULT_ICON[shown.result] : Fingerprint;

  return (
    <section className="surface-card flex min-w-0 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">Lector de huella</h2>
        <p className="text-sm text-muted-foreground">
          Muestra la última huella leída en cualquier aula.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-6">
        {/* Frente del lector: franja LED arriba y zona de lectura */}
        <div className="w-44 overflow-hidden rounded-lg border border-foreground/20 bg-secondary">
          <div
            className={cn(
              "h-1.5 transition-colors duration-300",
              tone ? tone.led : "teckey-led-idle bg-primary",
            )}
          />
          <div className="p-4">
            <div
              className={cn(
                "relative grid aspect-square place-items-center overflow-hidden rounded-md border-2 border-dashed transition-colors duration-300",
                tone ? tone.ring : "border-foreground/20 text-muted-foreground",
              )}
            >
              <Icon className="h-12 w-12" strokeWidth={1.5} />
              {!shown && (
                <span className="teckey-scan-line absolute inset-x-4 top-1/2 h-px bg-primary" />
              )}
            </div>
          </div>
        </div>
        <p className={cn("mt-4 text-base font-semibold", tone?.text)} aria-live="polite">
          {shown ? RESULT_TITLE[shown.result] : "Esperando huella"}
        </p>
        <p className="min-h-10 text-center text-sm text-muted-foreground">
          {shown ? (
            <>
              {shown.professorName}
              <br />
              Aula {shown.classroom}, huella <span className="font-mono">{shown.tag}</span>
            </>
          ) : (
            "Apoya el dedo en cualquier lector de aula"
          )}
        </p>
      </div>

      {USE_MOCK && <Simulador />}
    </section>
  );
}

/** Controles de demostración: elegir docente y aula, o dejar que lleguen lecturas solas. */
function Simulador() {
  const state = useTeckey();
  const { cards, classrooms, professors } = state;

  // Al elegir docente, propone el aula donde tiene clase ahora (para que la demo muestre un acceso concedido).
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
    <div className="space-y-3 border-t border-border bg-secondary/50 px-5 py-4">
      <p className="text-sm font-medium">Simular una lectura</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <Select value={cardId} onValueChange={pickCard}>
          <SelectTrigger aria-label="Docente" className="min-w-0 [&>span]:truncate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cards.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {owner(c.professorId)} ({c.code}){c.status === "Inactiva" ? ", deshabilitada" : ""}
              </SelectItem>
            ))}
            {/* Un dedo que no está en el lector: siempre se deniega */}
            <SelectItem value="sin-registro">Huella no registrada</SelectItem>
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
          <Fingerprint className="mr-2 h-4 w-4" /> Poner huella
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
