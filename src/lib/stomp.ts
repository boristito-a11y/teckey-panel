/**
 * Cliente STOMP mínimo sobre WebSocket nativo (suficiente para escuchar un tópico de Spring Boot
 * con `enableSimpleBroker("/topic")`). Se reconecta solo cada 3 s si se cae la conexión.
 */
export function subscribeStomp(opts: {
  url: string;
  destination: string;
  onMessage: (body: string) => void;
  onStatus?: (connected: boolean) => void;
}) {
  let ws: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let buffer = "";

  const send = (command: string, headers: Record<string, string>) => {
    const head = Object.entries(headers)
      .map(([k, v]) => `${k}:${v}`)
      .join("\n");
    ws?.send(`${command}\n${head}\n\n\0`);
  };

  const handleFrame = (frame: string) => {
    const text = frame.replace(/^\s+/, "");
    if (!text) return; // latido (heartbeat)
    const split = text.indexOf("\n\n");
    const command = text.slice(0, text.indexOf("\n"));
    const body = split >= 0 ? text.slice(split + 2) : "";
    if (command === "CONNECTED") {
      opts.onStatus?.(true);
      send("SUBSCRIBE", { id: "sub-0", destination: opts.destination, ack: "auto" });
    } else if (command === "MESSAGE") {
      opts.onMessage(body);
    } else if (command === "ERROR") {
      console.error("STOMP:", body);
    }
  };

  const connect = () => {
    ws = new WebSocket(opts.url);
    ws.onopen = () =>
      send("CONNECT", { "accept-version": "1.2", host: location.hostname, "heart-beat": "0,0" });
    ws.onmessage = (e) => {
      buffer += String(e.data);
      let end: number;
      while ((end = buffer.indexOf("\0")) >= 0) {
        handleFrame(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
      }
    };
    ws.onclose = () => {
      opts.onStatus?.(false);
      buffer = "";
      if (!closed) retry = setTimeout(connect, 3000);
    };
  };

  connect();
  return () => {
    closed = true;
    clearTimeout(retry);
    ws?.close();
  };
}
