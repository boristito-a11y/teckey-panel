import { useEffect, useState } from "react";

import { minutesNow } from "@/lib/teckey-store";

/** Minutos desde medianoche, actualizados cada `everyMs` (para estados "en vivo"). */
export function useMinutes(everyMs = 15_000) {
  const [m, setM] = useState(() => minutesNow());
  useEffect(() => {
    const t = setInterval(() => setM(minutesNow()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return m;
}
