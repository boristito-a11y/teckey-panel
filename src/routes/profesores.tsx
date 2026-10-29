import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Search, History } from "lucide-react";

import { accessTone } from "@/components/teckey/AccessBadge";
import { PageHeader, StatusText, TablePanel, Tabs } from "@/components/teckey/Page";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actions, professorName, useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profesores")({
  head: () => ({
    meta: [
      { title: "Profesores — TECKEY" },
      {
        name: "description",
        content: "Registro de profesores, datos de contacto y vinculación de tarjetas RFID.",
      },
      { property: "og:title", content: "Profesores — TECKEY" },
      {
        property: "og:description",
        content: "Registro de profesores, datos de contacto y vinculación de tarjetas RFID.",
      },
    ],
  }),
  component: ProfesoresPage,
});

const empty = { nombres: "", apellidos: "", dni: "", correo: "", celular: "" };

function ProfesoresPage() {
  const { professors, cards } = useTeckey();
  const [filter, setFilter] = useState<"todos" | "con" | "sin">("todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const historyProf = professors.find((p) => p.id === historyId);

  const rows = professors
    .filter((p) =>
      filter === "todos" ? true : filter === "con" ? !!p.cardId : !p.cardId,
    )
    .filter((p) =>
      professorName(p).toLowerCase().includes(query.toLowerCase()) || p.dni.includes(query),
    );

  const submit = () => {
    if (!form.nombres || !form.apellidos || !form.dni) {
      toast.error("Complete nombres, apellidos y DNI");
      return;
    }
    actions.addProfessor(form);
    toast.success("Profesor registrado", { description: `${form.nombres} ${form.apellidos}` });
    setForm(empty);
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Profesores"
        description={`${professors.length} docentes registrados, ${professors.filter((p) => !p.cardId).length} sin tarjeta RFID.`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar profesor
          </Button>
        }
      />

      <Tabs
        value={filter}
        onChange={setFilter}
        options={[
          { key: "todos", label: "Todos", count: professors.length },
          { key: "con", label: "Con tarjeta", count: professors.filter((p) => p.cardId).length },
          { key: "sin", label: "Sin tarjeta", count: professors.filter((p) => !p.cardId).length },
        ]}
      />

      <TablePanel
        toolbar={
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o DNI"
              aria-label="Buscar profesor"
              className="pl-9"
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesor</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tarjeta RFID</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const card = cards.find((c) => c.id === p.cardId);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{professorName(p)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{p.dni}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{p.correo}</div>
                    <div className="tabular-nums">{p.celular}</div>
                  </TableCell>
                  <TableCell>
                    {card ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="whitespace-nowrap font-mono text-sm">{card.code}</span>
                        {card.status === "Inactiva" && <StatusText tone="bad">Inactiva</StatusText>}
                      </span>
                    ) : (
                      <StatusText tone="warn">Sin tarjeta</StatusText>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setHistoryId(p.id)}>
                        <History className="mr-1.5 h-4 w-4" /> Historial
                      </Button>
                      {card && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            actions.unlinkCard(p.id);
                            toast.success("Tarjeta desvinculada", {
                              description: `${professorName(p)} quedó sin tarjeta.`,
                            });
                          }}
                        >
                          Desvincular tarjeta
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar a ${professorName(p)}`}
                        title="Eliminar profesor"
                        onClick={() => {
                          actions.removeProfessor(p.id);
                          toast.error("Profesor eliminado", { description: professorName(p) });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Ningún profesor coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TablePanel>

      <Dialog open={!!historyProf} onOpenChange={(o) => !o && setHistoryId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historial de accesos</DialogTitle>
            <DialogDescription>{historyProf ? professorName(historyProf) : ""}</DialogDescription>
          </DialogHeader>
          {historyProf && <ProfessorHistory name={professorName(historyProf)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar profesor</DialogTitle>
            <DialogDescription>Los datos quedarán disponibles para asignar una tarjeta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["nombres", "Nombres"],
                ["apellidos", "Apellidos"],
                ["dni", "DNI"],
                ["celular", "Celular"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="correo">Correo institucional</Label>
              <Input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Guardar profesor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Línea de tiempo con las lecturas de tarjeta de un docente, de la más reciente a la más antigua. */
function ProfessorHistory({ name }: { name: string }) {
  const { logs } = useTeckey();
  const mine = logs.filter((l) => l.professorName === name);
  const granted = mine.filter((l) => l.result === "CONCEDIDO").length;

  if (mine.length === 0)
    return <p className="py-4 text-sm text-muted-foreground">Este docente todavía no tiene lecturas registradas.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {mine.length} lecturas: {granted} concedidas y {mine.length - granted} rechazadas.
      </p>
      <ol className="max-h-80 space-y-4 overflow-y-auto border-l-2 border-border pl-5">
        {mine.map((l) => (
          <li key={l.id} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card",
                l.result === "CONCEDIDO" ? "bg-scheduled" : l.result === "DENEGADO" ? "bg-destructive" : "bg-available",
              )}
            />
            <p className={cn("text-sm font-semibold", accessTone[l.result].text)}>{accessTone[l.result].label}</p>
            <p className="text-xs text-muted-foreground">
              <span className="tabular-nums">{l.datetime}</span>, aula {l.classroom}, tarjeta{" "}
              <span className="font-mono">{l.tag}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
