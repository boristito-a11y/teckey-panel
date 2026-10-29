import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Fingerprint, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatusText, TablePanel, Tabs } from "@/components/teckey/Page";
import {
  BLOCKS,
  DAYS,
  FINGERS,
  actions,
  cardSlot,
  professorName,
  useTeckey,
  type Finger,
  type Professor,
} from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/huellas")({
  head: () => ({
    meta: [
      { title: "Huellas digitales — TECKEY" },
      {
        name: "description",
        content:
          "Huellas digitales registradas por docente, registro de nuevas huellas y aulas autorizadas.",
      },
      { property: "og:title", content: "Huellas digitales — TECKEY" },
      {
        property: "og:description",
        content:
          "Huellas digitales registradas por docente, registro de nuevas huellas y aulas autorizadas.",
      },
    ],
  }),
  component: HuellasPage,
});

function HuellasPage() {
  const { cards, professors } = useTeckey();
  const [tab, setTab] = useState<"registradas" | "pendientes">("registradas");
  const [scheduleCard, setScheduleCard] = useState<string | null>(null);
  const [enrollFor, setEnrollFor] = useState<Professor | null>(null);
  const closeEnroll = useCallback(() => setEnrollFor(null), []);

  const registered = cards.filter((c) => c.professorId);
  const pending = professors.filter((p) => !p.cardId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Huellas digitales"
        description={`${registered.length} docentes con huella registrada en el lector y ${pending.length} pendientes de registro.`}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { key: "registradas", label: "Registradas", count: registered.length },
          { key: "pendientes", label: "Sin registrar", count: pending.length },
        ]}
      />

      <TablePanel>
        {tab === "registradas" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID en el lector</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Dedo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registered.map((c) => {
                const prof = professors.find((p) => p.id === c.professorId);
                const active = c.status === "Activa";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="font-medium">
                      {prof ? professorName(prof) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.tech}</TableCell>
                    <TableCell>
                      <StatusText tone={active ? "ok" : "bad"}>
                        {active ? "Activa" : "Deshabilitada"}
                      </StatusText>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setScheduleCard(c.id)}>
                          <CalendarRange className="mr-1.5 h-4 w-4" /> Aulas autorizadas
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-w-[6.5rem]"
                          onClick={() => {
                            if (active) {
                              actions.disableCard(c.id);
                              toast.success("Huella deshabilitada", {
                                description: `${c.code} ya no abre ningún aula.`,
                              });
                            } else {
                              actions.enableCard(c.id);
                              toast.success("Huella reactivada", { description: c.code });
                            }
                          }}
                        >
                          {active ? "Deshabilitar" : "Reactivar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Eliminar huella ${c.code}`}
                          title="Eliminar huella"
                          onClick={() => {
                            actions.removeCard(c.id);
                            toast.error("Huella eliminada", {
                              description: `${c.code}${prof ? `, ${professorName(prof)}` : ""}`,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {registered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Todavía no hay huellas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{professorName(p)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{p.dni}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setEnrollFor(p)}>
                      <Fingerprint className="mr-1.5 h-4 w-4" /> Registrar huella
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Todos los docentes tienen su huella registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TablePanel>

      <EnrollDialog professor={enrollFor} onClose={closeEnroll} />
      <ScheduleDialog cardId={scheduleCard} onClose={() => setScheduleCard(null)} />
    </div>
  );
}

const CAPTURES = 3;

/** Registro de huella: el docente pone el mismo dedo 3 veces en el lector (simulado en la demo). */
function EnrollDialog({
  professor,
  onClose,
}: {
  professor: Professor | null;
  onClose: () => void;
}) {
  const [finger, setFinger] = useState<Finger>(FINGERS[0]);
  const [captured, setCaptured] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!professor) {
      setCaptured(0);
      setRunning(false);
      setFinger(FINGERS[0]);
    }
  }, [professor]);

  useEffect(() => {
    if (!running || !professor) return;
    if (captured >= CAPTURES) {
      const uid = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16))
        .join("")
        .toUpperCase();
      const code = actions.addCard({ uid, tech: finger, professorId: professor.id });
      toast.success("Huella registrada", {
        description: `${code}, ${finger.toLowerCase()} de ${professorName(professor)}`,
      });
      setRunning(false);
      onClose();
      return;
    }
    const t = setTimeout(() => setCaptured((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [running, captured, professor, finger, onClose]);

  return (
    <Dialog open={!!professor} onOpenChange={(o) => !o && !running && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar huella</DialogTitle>
          <DialogDescription>{professor ? professorName(professor) : ""}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="finger">Dedo</Label>
          <Select value={finger} onValueChange={(v) => setFinger(v as Finger)} disabled={running}>
            <SelectTrigger id="finger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINGERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 rounded-md border border-border bg-secondary/60 p-4">
          <Fingerprint
            className={cn("h-12 w-12 shrink-0", running ? "text-primary" : "text-muted-foreground")}
            strokeWidth={1.4}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" aria-live="polite">
              {running
                ? `Captura ${Math.min(captured + 1, CAPTURES)} de ${CAPTURES}`
                : "Listo para capturar"}
            </p>
            <p className="text-xs text-muted-foreground">
              El docente apoya el mismo dedo {CAPTURES} veces en el lector de la Oficina de
              Servicios.
            </p>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: CAPTURES }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < captured ? "bg-scheduled" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={running}>
            Cancelar
          </Button>
          <Button onClick={() => setRunning(true)} disabled={running}>
            <Fingerprint className="mr-2 h-4 w-4" /> {running ? "Capturando…" : "Iniciar captura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Horario semanal en el que la huella abre cada aula (horario base, ajustes y emergencias). */
function ScheduleDialog({ cardId, onClose }: { cardId: string | null; onClose: () => void }) {
  const state = useTeckey();
  const card = state.cards.find((c) => c.id === cardId);
  const prof = state.professors.find((p) => p.id === card?.professorId);

  return (
    <Dialog open={!!card} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle>Aulas autorizadas para {card.code}</DialogTitle>
              <DialogDescription>
                {prof ? professorName(prof) : "Sin profesor"}, semana {state.week}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-border bg-secondary p-2 text-left font-medium text-muted-foreground">
                      Bloque
                    </th>
                    {DAYS.map((d) => (
                      <th
                        key={d}
                        className="border border-border bg-secondary p-2 font-medium text-muted-foreground"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLOCKS.map((b) => (
                    <tr key={b.index}>
                      <td className="whitespace-nowrap border border-border p-2 tabular-nums text-muted-foreground">
                        {b.label}
                      </td>
                      {DAYS.map((d, di) => {
                        const slot = cardSlot(state, card.id, state.week, di, b.index);
                        return (
                          <td
                            key={d}
                            className="border border-border p-2 text-center"
                            title={slot?.course}
                          >
                            {slot ? (
                              <span
                                className={cn(
                                  "font-display text-sm font-semibold",
                                  slot.enabled
                                    ? "text-scheduled"
                                    : "text-muted-foreground line-through",
                                )}
                              >
                                {slot.classroomId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
