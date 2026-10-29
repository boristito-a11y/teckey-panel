import type { Card, LogItem, Professor, RequestItem } from "@/lib/teckey-store";

/**
 * Conexión con el backend de Spring Boot.
 * - VITE_USE_MOCK=false → lee datos de VITE_API_URL y escucha /topic/accesos por WebSocket.
 * - Sin configurar (o true) → datos de demostración en memoria, como hasta ahora.
 */
export const USE_MOCK = import.meta.env["VITE_USE_MOCK"] !== "false";
export const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8080";
export const WS_URL = `${API_URL.replace(/^http/, "ws")}/ws`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET /api${path} respondió ${res.status}`);
  return res.json() as Promise<T>;
}

// Cada endpoint devuelve los objetos con la misma forma que los tipos del store (ver README).
export const api = {
  profesores: () => get<Professor[]>("/profesores"),
  tarjetas: () => get<Card[]>("/tarjetas"),
  accesos: () => get<LogItem[]>("/accesos?limite=200"),
  solicitudes: () => get<RequestItem[]>("/solicitudes"),
};
