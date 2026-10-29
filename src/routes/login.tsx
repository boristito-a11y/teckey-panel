import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap, LogIn, UserCog } from "lucide-react";

import { FloorPlan, type RoomView } from "@/components/teckey/FloorPlan";
import type { SlotStatus } from "@/lib/teckey-store";

// Plano decorativo con estados fijos (no muestra datos reales antes de iniciar sesión)
const DEMO_STATES: SlotStatus[] = [
  "ocupado", "programado", "disponible", "ocupado", "programado",
  "programado", "ocupado", "ocupado", "disponible", "programado",
  "disponible", "ocupado", "programado", "ocupado", "ocupado",
];
const DEMO_PLAN: RoomView[] = DEMO_STATES.map((status, i) => {
  const floor = 3 - Math.floor(i / 5);
  const number = `${floor}0${(i % 5) + 1}`;
  return { status, room: { id: `F${number}`, pavilion: "F", floor, number, status } };
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_PASS, ADMIN_USER, setSession } from "@/lib/auth";
import { useTeckey } from "@/lib/teckey-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar Sesión — TECKEY System" },
      { name: "description", content: "Acceso para administradores y docentes al sistema de control de acceso biométrico TECKEY." },
      { property: "og:title", content: "Iniciar Sesión — TECKEY System" },
      { property: "og:description", content: "Acceso para administradores y docentes al sistema de control de acceso biométrico TECKEY." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { professors } = useTeckey();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const enterAdmin = () => {
    setSession({ role: "admin" });
    toast.success("Bienvenido, Administrador");
    navigate({ to: "/", replace: true });
  };
  const enterProf = (id: string) => {
    setSession({ role: "profesor", professorId: id });
    toast.success("Bienvenido, docente");
    navigate({ to: "/profesor", replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    if (u === ADMIN_USER && pass === ADMIN_PASS) return enterAdmin();
    const prof = professors.find((p) => p.correo.toLowerCase() === u || p.dni === u);
    if (prof && pass === prof.dni) return enterProf(prof.id);
    toast.error("Usuario o contraseña incorrectos");
  };

  const demoProf = professors[2] ?? professors[0];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="hidden flex-col justify-between border-r border-border bg-secondary/60 p-12 lg:flex">
        <p className="font-display text-3xl font-semibold leading-none">TecKey</p>

        <div className="max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight">
            Cada aula de los pabellones F y B, abierta solo para quien tiene clase.
          </h1>
          <p className="mt-4 text-muted-foreground">
            La huella digital de cada docente abre la puerta del aula solo en su bloque horario. La Oficina de Servicios ve
            en vivo qué aulas están ocupadas y atiende las solicitudes especiales.
          </p>
          <div className="mt-10" aria-hidden="true">
            <FloorPlan pavilion="F" size="sm" rooms={DEMO_PLAN} />
            <p className="mt-2 text-xs text-muted-foreground">Pabellón F, vista de ejemplo</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Oficina de Servicios, semestre 2026-II</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <p className="font-display text-3xl font-semibold leading-none lg:hidden">TecKey</p>
            <h2 className="mt-6 text-2xl font-semibold lg:mt-0">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Usa tu cuenta institucional.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Correo institucional o DNI</Label>
              <Input id="user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="nombre@universidad.edu.pe" autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Contraseña</Label>
              <Input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
            </Button>
            <p className="text-xs text-muted-foreground">
              Los docentes usan su DNI como contraseña.
            </p>
          </form>

          <div className="border-t border-border pt-6">
            <p className="text-sm font-medium">Entrar a la demostración</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={enterAdmin}>
                <UserCog className="mr-2 h-4 w-4" /> Administrador
              </Button>
              <Button variant="outline" onClick={() => demoProf && enterProf(demoProf.id)}>
                <GraduationCap className="mr-2 h-4 w-4" /> Profesor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
