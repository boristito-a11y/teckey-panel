import { createFileRoute } from "@tanstack/react-router";
import {
  DoorOpen,
  Users,
  CreditCard,
  ShieldAlert,
  Clock,
  MapPin,
  Inbox,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EventFeed } from "@/components/teckey/EventFeed";
import { LectorEnVivo } from "@/components/teckey/LectorEnVivo";
import { useMinutes } from "@/lib/use-minutes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/teckey/StatusBadge";
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
      { title: "Dashboard — TECKEY System" },
      {
        name: "description",
        content: "Panel general de aulas ocupadas, profesores activos, tarjetas RFID y alertas de acceso.",
      },
      { property: "og:title", content: "Dashboard — TECKEY System" },
      {
        property: "og:description",
        content: "Panel general de aulas ocupadas, profesores activos, tarjetas RFID y alertas de acceso.",
      },
    ],
  }),
  component: Dashboard,
});

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { classrooms, professors, cards, requests, emergencies, logs, week } = useTeckey();
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const mins = useMinutes();
  const day = todayIndex();

  const live = useMemo(
    () =>
      classrooms.map((c) => ({ room: c, ...liveStatus(emergencies, c.id, week, day, mins) })),
    [classrooms, emergencies, week, day, mins],
  );
  const occupied = live.filter((l) => l.status === "ocupado");
  const later = live.filter((l) => l.status === "programado");
  // Primero las clases en curso, luego las próximas por hora de inicio
  const active = [...occupied, ...later.sort((a, b) => (a.block?.start ?? 0) - (b.block?.start ?? 0))];

  const assigned = cards.filter((c) => c.professorId).length;
  const withAccess = professors.filter((p) => cards.some((c) => c.id === p.cardId && c.status === "Activa")).length;
  const denied = logs.filter((l) => l.result === "DENEGADO").length;
  const offHours = logs.filter((l) => l.result === "FUERA DE HORARIO").length;
  const pending = requests.filter((r) => r.status === "pendiente");

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Estado general del sistema en tiempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Aulas ocupadas ahora"
          value={`${occupied.length}/${classrooms.length}`}
          hint={`${later.length} con clase más tarde · semana ${week}`}
          icon={DoorOpen}
          tone="bg-occupied/12 text-occupied"
        />
        <MetricCard
          label="Profesores con acceso"
          value={String(withAccess)}
          hint={`de ${professors.length} registrados (tarjeta activa)`}
          icon={Users}
          tone="bg-primary/12 text-primary"
        />
        <MetricCard
          label="Tarjetas RFID asignadas"
          value={`${assigned}/${cards.length}`}
          hint={`${cards.length - assigned} en stock sin asignar`}
          icon={CreditCard}
          tone="bg-scheduled/15 text-scheduled"
        />
        <MetricCard
          label="Intentos rechazados"
          value={String(denied + offHours)}
          hint={`${denied} denegados · ${offHours} fuera de horario`}
          icon={ShieldAlert}
          tone="bg-available/25 text-available-foreground dark:text-available"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <EventFeed />
        <LectorEnVivo />
      </div>

      <section className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Estado en vivo por pabellón</h3>
            <p className="text-sm text-muted-foreground">Clases en curso y las siguientes de hoy.</p>
          </div>
          <div className="flex gap-3 text-xs">
            <StatusPill status="ocupado" />
            <StatusPill status="programado" />
            <StatusPill status="disponible" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              No quedan clases hoy en los pabellones F y B.
            </p>
          )}
          {active.slice(0, 8).map(({ room, status, entry, block }) => {
            const prof = professors.find((p) => p.id === entry?.professorId);
            return (
              <div
                key={room.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4"
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    status === "ocupado"
                      ? "bg-occupied text-occupied-foreground"
                      : "bg-scheduled text-scheduled-foreground"
                  }`}
                >
                  {room.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry?.course}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {prof ? professorName(prof) : "—"} · {entry?.career}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <Clock className="h-3.5 w-3.5" />
                  {block?.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight">Solicitudes de acceso especial</h3>
          <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
            {pending.length} pendientes
          </span>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {pending.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">No hay solicitudes pendientes.</li>
          )}
          {pending.map((r) => {
            const prof = professors.find((p) => p.id === r.professorId);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{prof ? professorName(prof) : "—"}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Aula {r.classroom}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {r.duration} · {r.requestedAt}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{r.reason}</p>
                </div>
                <Button onClick={() => setSelected(r)}>Ver y Responder</Button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitud de acceso especial</DialogTitle>
            <DialogDescription>Revise el detalle antes de otorgar el permiso.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row
                k="Profesor"
                v={professorName(professors.find((p) => p.id === selected.professorId)!)}
              />
              <Row k="Aula solicitada" v={selected.classroom} />
              <Row k="Duración" v={selected.duration} />
              <Row k="Recibida" v={selected.requestedAt} />
              <div className="rounded-lg border border-border bg-secondary/60 p-3 text-sm">
                {selected.reason}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => resolve("rechazada")}>
              Rechazar
            </Button>
            <Button onClick={() => resolve("aprobada")}>Aprobar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
