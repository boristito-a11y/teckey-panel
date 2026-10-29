import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventFeed } from "@/components/teckey/EventFeed";
import { FloorPlan, type RoomView } from "@/components/teckey/FloorPlan";
import { LectorEnVivo } from "@/components/teckey/LectorEnVivo";
import { StatusPill } from "@/components/teckey/StatusBadge";
import { useMinutes } from "@/lib/use-minutes";
import {
  actions,
  liveStatus,
  professorName,
  todayIndex,
  useTeckey,
  type RequestItem,
} from "@/lib/teckey-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumen del día — TECKEY" },
      {
        name: "description",
        content: "Plano en vivo de los pabellones, lecturas de huella y solicitudes pendientes.",
      },
      { property: "og:title", content: "Resumen del día — TECKEY" },
      {
        property: "og:description",
        content: "Plano en vivo de los pabellones, lecturas de huella y solicitudes pendientes.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold leading-none tabular-nums">{value}</p>
      {children}
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const { classrooms, professors, cards, requests, emergencies, logs, week, locks } = useTeckey();
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const navigate = useNavigate();
  const mins = useMinutes();
  const day = todayIndex();

  const live = useMemo(
    () => classrooms.map((c) => ({ room: c, ...liveStatus(emergencies, c.id, week, day, mins) })),
    [classrooms, emergencies, week, day, mins],
  );
  const count = (s: string, pav?: string) =>
    live.filter((l) => l.status === s && (!pav || l.room.pavilion === pav)).length;
  const occupied = count("ocupado");
  const later = count("programado");
  const free = count("disponible");

  const assigned = cards.filter((c) => c.professorId).length;
  const withAccess = professors.filter((p) =>
    cards.some((c) => c.id === p.cardId && c.status === "Activa"),
  ).length;
  const denied = logs.filter((l) => l.result === "DENEGADO").length;
  const offHours = logs.filter((l) => l.result === "FUERA DE HORARIO").length;
  const pending = requests.filter((r) => r.status === "pendiente");

  const views = (pav: "F" | "B"): RoomView[] =>
    live
      .filter((l) => l.room.pavilion === pav)
      .map(({ room, status, entry, block }) => {
        const prof = professors.find((p) => p.id === entry?.professorId);
        const lock = locks[room.id];
        return {
          room,
          status,
          caption:
            status === "ocupado"
              ? entry?.course
              : status === "programado"
                ? `Desde ${block?.label.slice(0, 5)}`
                : "Libre",
          tag: lock ? (lock.state === "abierto" ? "Abierta" : "10 min") : undefined,
          title: entry
            ? `${room.id}: ${entry.course}\n${prof ? professorName(prof) : ""}\n${block?.label ?? ""}`
            : `${room.id}: libre el resto del día`,
        };
      });

  const resolve = (status: "aprobada" | "rechazada") => {
    if (!selected) return;
    actions.resolveRequest(selected.id, status);
    toast[status === "aprobada" ? "success" : "error"](
      status === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada",
      { description: `Aula ${selected.classroom}` },
    );
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Resumen del día</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado de los pabellones F y B en la semana {week}, calculado con el horario del ciclo.
          </p>
        </div>
      </header>

      <section
        aria-label="Indicadores"
        className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Aulas ocupadas ahora"
          value={`${occupied}/${classrooms.length}`}
          hint={`${later} con clase más tarde, ${free} libres`}
        >
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className="bg-occupied"
              style={{ width: `${(occupied / classrooms.length) * 100}%` }}
            />
            <span
              className="bg-scheduled"
              style={{ width: `${(later / classrooms.length) * 100}%` }}
            />
          </div>
        </Stat>
        <Stat
          label="Profesores con acceso"
          value={String(withAccess)}
          hint={`De ${professors.length} registrados, con huella activa`}
        />
        <Stat
          label="Huellas registradas"
          value={`${assigned}/${professors.length}`}
          hint={`${professors.length - assigned} docentes sin registrar su huella`}
        />
        <Stat
          label="Intentos rechazados"
          value={String(denied + offHours)}
          hint={`${denied} denegados y ${offHours} fuera de horario`}
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Plano en vivo</h2>
            <p className="text-sm text-muted-foreground">
              Selecciona un aula para abrirla o ver su detalle.
            </p>
          </div>
          <div className="flex gap-4">
            <StatusPill status="ocupado" />
            <StatusPill status="programado" />
            <StatusPill status="disponible" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {(["F", "B"] as const).map((pav) => (
            <FloorPlan
              key={pav}
              pavilion={pav}
              rooms={views(pav)}
              onSelect={() => navigate({ to: "/aulas" })}
              header={
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-semibold">Pabellón {pav}</h3>
                  <p className="text-xs text-muted-foreground">
                    {count("ocupado", pav)} ocupadas, {count("programado", pav)} programadas
                  </p>
                </div>
              }
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <EventFeed />
        <LectorEnVivo />
      </div>

      <section className="surface-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Solicitudes de acceso especial</h2>
          <span className="text-sm text-muted-foreground">
            <span className="font-display text-lg font-semibold text-foreground">
              {pending.length}
            </span>{" "}
            pendientes
          </span>
        </div>
        <ul className="divide-y divide-border">
          {pending.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">
              No hay solicitudes por revisar.
            </li>
          )}
          {pending.map((r) => {
            const prof = professors.find((p) => p.id === r.professorId);
            return (
              <li
                key={r.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="font-display text-2xl font-semibold leading-none">
                  {r.classroom}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{prof ? professorName(prof) : "—"}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.duration}, recibida {r.requestedAt.toLowerCase()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
                  Revisar
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitud para el aula {selected?.classroom}</DialogTitle>
            <DialogDescription>Revisa el detalle antes de otorgar el permiso.</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="space-y-3 text-sm">
              <Row
                k="Profesor"
                v={professorName(professors.find((p) => p.id === selected.professorId)!)}
              />
              <Row k="Duración" v={selected.duration} />
              <Row k="Recibida" v={selected.requestedAt} />
              <div className="rounded-md bg-secondary p-3">{selected.reason}</div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => resolve("rechazada")}>
              Rechazar
            </Button>
            <Button onClick={() => resolve("aprobada")}>Aprobar acceso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
