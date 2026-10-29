import { useEffect } from "react";
import { toast } from "sonner";

import { API_URL, USE_MOCK, WS_URL, api } from "@/lib/api";
import { subscribeStomp } from "@/lib/stomp";
import { actions, type LogItem } from "@/lib/teckey-store";

/** Con backend real: carga los datos iniciales y agrega cada lectura de huella que llega por WebSocket. */
export function BackendSync() {
  useEffect(() => {
    if (USE_MOCK) return;

    Promise.all([api.profesores(), api.huellas(), api.accesos(), api.solicitudes()])
      .then(([professors, cards, logs, requests]) =>
        actions.hydrate({ professors, cards, logs, requests }),
      )
      .catch((e: Error) =>
        toast.error("No se pudo cargar el backend", {
          description: `${e.message}. Revisa que Spring Boot esté corriendo en ${API_URL}.`,
          duration: 10_000,
        }),
      );

    return subscribeStomp({
      url: WS_URL,
      destination: "/topic/accesos",
      onMessage: (body) => actions.ingestLog(JSON.parse(body) as LogItem),
    });
  }, []);

  return null;
}
