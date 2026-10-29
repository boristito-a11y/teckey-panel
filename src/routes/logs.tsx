import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessBadge } from "@/components/teckey/AccessBadge";
import { PageHeader, TablePanel, Tabs } from "@/components/teckey/Page";
import { downloadCsv } from "@/lib/csv";
import { useTeckey } from "@/lib/teckey-store";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Registro de accesos — TECKEY" },
      {
        name: "description",
        content: "Auditoría de lecturas de huella con fecha, aula, docente y resultado del intento.",
      },
      { property: "og:title", content: "Registro de accesos — TECKEY" },
      {
        property: "og:description",
        content: "Auditoría de lecturas de huella con fecha, aula, docente y resultado del intento.",
      },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { logs } = useTeckey();
  const [result, setResult] = useState("todos");
  const [query, setQuery] = useState("");

  const rows = logs
    .filter((l) => (result === "todos" ? true : l.result === result))
    .filter(
      (l) =>
        l.professorName.toLowerCase().includes(query.toLowerCase()) ||
        l.classroom.toLowerCase().includes(query.toLowerCase()) ||
        l.tag.toLowerCase().includes(query.toLowerCase()),
    );

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `teckey-accesos-${stamp}.csv`,
      ["Fecha / Hora", "Aula", "Profesor", "Huella", "Resultado"],
      rows.map((l) => [l.datetime, l.classroom, l.professorName, l.tag, l.result]),
    );
    toast.success("Reporte exportado", { description: `${rows.length} registros en teckey-accesos-${stamp}.csv` });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Registro de accesos"
        description="Cada lectura de huella en los lectores de aula, de la más reciente a la más antigua."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      <Tabs
        value={result}
        onChange={setResult}
        options={[
          { key: "todos", label: "Todos", count: logs.length },
          { key: "CONCEDIDO", label: "Concedidos", count: logs.filter((l) => l.result === "CONCEDIDO").length },
          { key: "FUERA DE HORARIO", label: "Fuera de horario", count: logs.filter((l) => l.result === "FUERA DE HORARIO").length },
          { key: "DENEGADO", label: "Denegados", count: logs.filter((l) => l.result === "DENEGADO").length },
        ]}
      />

      <TablePanel
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar aula, profesor o ID de huella"
                aria-label="Buscar en el registro"
                className="pl-9"
              />
            </div>
            <p className="ml-auto text-sm text-muted-foreground">
              <span className="font-display text-base font-semibold text-foreground">{rows.length}</span> lecturas
            </p>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Aula</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Huella</TableHead>
              <TableHead className="text-right">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{l.datetime}</TableCell>
                <TableCell className="font-display text-base font-semibold">{l.classroom}</TableCell>
                <TableCell>{l.professorName}</TableCell>
                <TableCell className="font-mono text-xs">{l.tag}</TableCell>
                <TableCell className="text-right">
                  <AccessBadge result={l.result} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Ninguna lectura coincide con el filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TablePanel>
    </div>
  );
}
