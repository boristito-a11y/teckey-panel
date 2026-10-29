import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setSession } from "@/lib/auth";
import { USE_MOCK } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { WEEKS, actions, useTeckey } from "@/lib/teckey-store";

// Agrupado por el tipo de trabajo que hace la Oficina de Servicios
const sections = [
  {
    title: "Operación",
    items: [
      { to: "/", label: "Resumen del día", icon: LayoutDashboard },
      { to: "/aulas", label: "Aulas y pabellones", icon: Building2 },
      { to: "/solicitudes", label: "Solicitudes", icon: ClipboardList },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: "/profesores", label: "Profesores", icon: Users },
      { to: "/tarjetas", label: "Tarjetas RFID", icon: CreditCard },
    ],
  },
  {
    title: "Auditoría",
    items: [
      { to: "/logs", label: "Registro de accesos", icon: ScrollText },
      { to: "/reportes", label: "Reportes", icon: ChartColumn },
    ],
  },
] as const;

/** Fecha de hoy, p. ej. "Jueves 29 de octubre". Vacía hasta montar (evita desajustes SSR). */
function useToday() {
  const [text, setText] = useState("");
  useEffect(() => {
    const t = new Date().toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    setText(t.charAt(0).toUpperCase() + t.slice(1).replace(",", ""));
  }, []);
  return text;
}

function Wordmark() {
  return (
    <div className="px-5 pb-6 pt-5">
      <p className="font-display text-[1.7rem] font-semibold leading-none tracking-tight text-sidebar-accent-foreground">
        TecKey
      </p>
      <p className="mt-1 text-xs text-sidebar-foreground">Control de acceso a aulas</p>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { requests } = useTeckey();
  const pending = requests.filter((r) => r.status === "pendiente").length;

  return (
    <nav className="flex flex-col gap-6 px-3">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-1.5 text-xs font-medium text-sidebar-foreground/70">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-sidebar-primary" : "opacity-70",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.to === "/solicitudes" && pending > 0 && (
                      <span className="ml-auto font-display text-sm font-semibold text-occupied">
                        {pending}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground">
      <p className="flex items-center gap-2">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", USE_MOCK ? "bg-available" : "bg-scheduled")}
        />
        {USE_MOCK ? "Datos de demostración" : "Conectado a Spring Boot"}
      </p>
      <p className="mt-1 text-sidebar-foreground/70">Semestre 2026-II</p>
    </div>
  );
}

function WeekStepper() {
  const { week } = useTeckey();
  const first = WEEKS[0]!;
  const last = WEEKS[WEEKS.length - 1]!;
  return (
    <div className="flex items-center rounded-md border border-border bg-card">
      <button
        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={() => actions.setWeek(week - 1)}
        disabled={week <= first}
        aria-label="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="whitespace-nowrap border-x border-border px-3 text-center text-sm sm:min-w-[7.5rem]">
        Semana <span className="font-display text-base font-semibold">{week}</span>
        <span className="hidden text-muted-foreground sm:inline"> de {last}</span>
      </span>
      <button
        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={() => actions.setWeek(week + 1)}
        disabled={week >= last}
        aria-label="Semana siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { requests } = useTeckey();
  const pending = requests.filter((r) => r.status === "pendiente").length;
  const today = useToday();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const logout = () => {
    setSession(null);
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Wordmark />
        <NavList />
        <SidebarFooter />
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-64 flex-col bg-sidebar p-0">
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <Wordmark />
                <NavList onNavigate={() => setOpen(false)} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>

            <p className="mr-auto hidden text-sm text-muted-foreground md:block">{today}</p>

            <WeekStepper />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
              title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>

            <Link
              to="/solicitudes"
              className="relative grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary"
              aria-label={`${pending} solicitudes pendientes`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {pending > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-occupied ring-2 ring-card" />
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    AC
                  </span>
                  <span className="hidden leading-tight sm:block">
                    <span className="block text-sm font-medium">Admin Central</span>
                    <span className="block text-xs text-muted-foreground">
                      Oficina de Servicios
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  admin@universidad.edu.pe
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
