import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { accessTone } from "@/components/teckey/AccessBadge";
import { PageHeader } from "@/components/teckey/Page";
import { downloadCsv } from "@/lib/csv";
import { BLOCKS, DAYS, scheduleEntry, useTeckey, type AccessResult } from "@/lib/teckey-store";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes — TECKEY" },
      {
        name: "description",
        content:
          "Ocupación de aulas por día y bloque, resultados de acceso por pabellón y estado de las huellas digitales.",
      },
      { property: "og:title", content: "Reportes — TECKEY" },
      {
        property: "og:description",
        content:
          "Ocupación de aulas por día y bloque, resultados de acceso por pabellón y estado de las huellas digitales.",
      },
    ],
  }),
  component: ReportesPage,
});

const RESULT_COLOR: Record<AccessResult, string> = {
  CONCEDIDO: "var(--color-scheduled)",
  "FUERA DE HORARIO": "var(--color-available)",
  DENEGADO: "var(--color-occupied)",
};
const RESULTS = Object.keys(RESULT_COLOR) as AccessResult[];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

function ReportesPage() {
  const { classrooms, emergencies, logs, cards, professors, week } = useTeckey();

  // Aulas con clase en cada día y bloque de la semana elegida (horario base + emergencias)
  const occupancy = useMemo(
    () =>
      DAYS.map((_, d) =>
        BLOCKS.map(
          (b) =>
            classrooms.filter((c) => scheduleEntry(emergencies, c.id, week, d, b.index)).length,
        ),
      ),
    [classrooms, emergencies, week],
  );
  const total = classrooms.length || 1;
  const busiest = occupancy
    .flatMap((row, d) => row.map((n, b) => ({ n, d, b })))
    .reduce((a, x) => (x.n > a.n ? x : a), { n: 0, d: 0, b: 0 });

  const byPavilion = (["F", "B"] as const).map((p) => {
    const row: Record<string, string | number> = { pabellon: `Pabellón ${p}` };
    RESULTS.forEach((r) => {
      row[r] = logs.filter((l) => l.classroom.startsWith(p) && l.result === r).length;
    });
    return row;
  });

  const rejected = useMemo(() => {
    const count = new Map<string, number>();
    logs
      .filter(
        (l) => l.result !== "CONCEDIDO" && !l.tag.startsWith("AUTO") && !l.tag.startsWith("REMOTO"),
      )
      .forEach((l) => count.set(l.professorName, (count.get(l.professorName) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);
  const maxRejected = rejected[0]?.[1] ?? 1;

  const cardStatus = [
    {
      name: "Activas",
      value: cards.filter((c) => c.professorId && c.status === "Activa").length,
      color: "var(--color-scheduled)",
    },
    {
      name: "Deshabilitadas",
      value: cards.filter((c) => c.status === "Inactiva").length,
      color: "var(--color-occupied)",
    },
    {
      name: "Docentes sin huella",
      value: professors.filter((p) => !p.cardId).length,
      color: "var(--color-available)",
    },
  ];

  const exportCsv = () => {
    downloadCsv(
      `teckey-ocupacion-semana-${week}.csv`,
      ["Bloque", ...DAYS],
      BLOCKS.map((b) => [b.label, ...DAYS.map((_, d) => occupancy[d]![b.index]!)]),
    );
    toast.success("Reporte exportado", { description: `Ocupación de la semana ${week}` });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Reportes"
        description={`Uso de las aulas y resultado de las lecturas en la semana ${week} del semestre 2026-II.`}
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Exportar ocupación
          </Button>
        }
      />

      <section className="surface-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ocupación de aulas por día y bloque</h2>
            <p className="text-sm text-muted-foreground">
              Aulas con clase de un total de {total}. El bloque más cargado es el{" "}
              {DAYS[busiest.d]?.toLowerCase()} de {BLOCKS[busiest.b]?.label} ({busiest.n} aulas).
            </p>
          </div>
          <Legenda />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-px text-xs">
            <thead>
              <tr>
                <th className="w-28 text-left font-medium text-muted-foreground">Bloque</th>
                {DAYS.map((d) => (
                  <th key={d} className="font-medium text-muted-foreground">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOCKS.map((b) => (
                <tr key={b.index}>
                  <td className="whitespace-nowrap pr-2 tabular-nums text-muted-foreground">
                    {b.label}
                  </td>
                  {DAYS.map((d, di) => {
                    const n = occupancy[di]![b.index]!;
                    const pct = Math.round((n / total) * 100);
                    return (
                      <td
                        key={d}
                        title={`${d} ${b.label}: ${n} de ${total} aulas (${pct}%)`}
                        className="h-10 text-center font-display text-base font-semibold"
                        style={{
                          background: `color-mix(in oklch, var(--color-primary) ${Math.max(6, pct)}%, var(--color-card))`,
                          color:
                            pct > 45
                              ? "var(--color-primary-foreground)"
                              : "var(--color-foreground)",
                        }}
                      >
                        {n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-lg font-semibold">Lecturas por pabellón</h2>
          <p className="text-sm text-muted-foreground">
            Resultado de cada huella leída en el registro.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPavilion} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="pabellon"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {RESULTS.map((r, i) => (
                  <Bar
                    key={r}
                    dataKey={r}
                    name={accessTone[r].label}
                    stackId="a"
                    isAnimationActive={false}
                    fill={RESULT_COLOR[r]}
                    radius={i === RESULTS.length - 1 ? [6, 6, 0, 0] : 0}
                    maxBarSize={72}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-lg font-semibold">Estado de las huellas digitales</h2>
          <p className="text-sm text-muted-foreground">
            {professors.length} docentes, {cards.length} con huella registrada.
          </p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={cardStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="var(--color-card)"
                >
                  {cardStatus.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-3 text-sm">
              {cardStatus.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto pl-3 font-semibold tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h2 className="text-lg font-semibold">Docentes con más intentos rechazados</h2>
        <p className="text-sm text-muted-foreground">
          Lecturas denegadas o fuera de horario. Útil para detectar huellas mal registradas, lectores sucios o horarios mal
          cargados.
        </p>
        {rejected.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No hay intentos rechazados en el registro.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rejected.map(([name, n]) => (
              <li
                key={name}
                className="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_2rem] items-center gap-3 text-sm"
              >
                <span className="truncate">{name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-occupied"
                    style={{ width: `${(n / maxRejected) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Legenda() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      Libre
      {[6, 25, 45, 65, 85].map((p) => (
        <span
          key={p}
          className="h-3.5 w-3.5 rounded-[2px]"
          style={{
            background: `color-mix(in oklch, var(--color-primary) ${p}%, var(--color-card))`,
          }}
        />
      ))}
      Lleno
    </div>
  );
}
