import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useSession } from "@/lib/auth";

/**
 * Decide qué puede ver cada rol:
 * - sin sesión → solo /login
 * - profesor → solo /profesor
 * - administrador → todo menos /profesor
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, session } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) return null;

  const onLogin = pathname === "/login";
  const onPortal = pathname === "/profesor";

  if (!session) return onLogin ? <>{children}</> : <Navigate to="/login" replace />;
  if (onLogin) return <Navigate to={session.role === "admin" ? "/" : "/profesor"} replace />;
  if (session.role === "profesor" && !onPortal) return <Navigate to="/profesor" replace />;
  if (session.role === "admin" && onPortal) return <Navigate to="/" replace />;

  return <>{children}</>;
}
