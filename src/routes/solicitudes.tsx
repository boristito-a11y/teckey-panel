import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { actions, professorName, useTeckey } from "@/lib/teckey-store";
import { PageHeader, StatusText, Tabs } from "@/components/teckey/Page";

const KIND = {
  especial: "Acceso especial",
  recuperacion: "Recuperación",
  contingencia: "Fallo de huella",
} as const;

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Solicitudes — TECKEY" },
      {
        name: "description",
        content: "Bandeja del administrador para aprobar o rechazar solicitudes de acceso especial.",
      },
      { property: "og:title", content: "Solicitudes — TECKEY" },
      {
        property: "og:description",
        content: "Bandeja del administrador para aprobar o rechazar solicitudes de acceso especial.",
      },
    ],
  }),
  component: SolicitudesPage,
});

function SolicitudesPage() {
  const { requests, professors } = useTeckey();
  const [tab, setTab] = useState<"pendiente" | "aprobada" | "rechazada">("pendiente");
  const rows = requests.filter((r) => r.status === tab);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Solicitudes"
        description="Pedidos de acceso especial de los docentes: recuperaciones, asesorías y aperturas cuando el lector no reconoce la huella."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { key: "pendiente", label: "Pendientes", count: requests.filter((r) => r.status === "pendiente").length },
          { key: "aprobada", label: "Aprobadas", count: requests.filter((r) => r.status === "aprobada").length },
          { key: "rechazada", label: "Rechazadas", count: requests.filter((r) => r.status === "rechazada").length },
        ]}
      />

      <section className="surface-card divide-y divide-border">
        {rows.map((r) => {
          const prof = professors.find((p) => p.id === r.professorId);
          return (
            <article
              key={r.id}
              className="grid gap-4 px-5 py-5 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-start"
            >
              <div>
                <p className="font-display text-3xl font-semibold leading-none">{r.classroom}</p>
                <p className="mt-1 text-xs text-muted-foreground">{KIND[r.kind ?? "especial"]}</p>
              </div>
              <div className="min-w-0">
                <p className="font-medium">{prof ? professorName(prof) : "Docente no encontrado"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {r.duration}. Recibida {r.requestedAt.toLowerCase()}.
                </p>
                <p className="mt-3 max-w-prose text-sm leading-relaxed">{r.reason}</p>
              </div>
              {r.status === "pendiente" ? (
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    size="sm"
                    onClick={() => {
                      actions.resolveRequest(r.id, "aprobada");
                      toast.success("Solicitud aprobada", { description: `Aula ${r.classroom}` });
                    }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      actions.resolveRequest(r.id, "rechazada");
                      toast.error("Solicitud rechazada", { description: `Aula ${r.classroom}` });
                    }}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Rechazar
                  </Button>
                </div>
              ) : (
                <StatusText tone={r.status === "aprobada" ? "ok" : "bad"}>
                  {r.status === "aprobada" ? "Aprobada" : "Rechazada"}
                </StatusText>
              )}
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {tab === "pendiente" ? "No hay solicitudes por revisar." : "Todavía no hay solicitudes en esta lista."}
          </p>
        )}
      </section>
    </div>
  );
}
