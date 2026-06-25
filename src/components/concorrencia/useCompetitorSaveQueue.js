// ======================================================================
// S7 — Hook: re-render quando a fila de cadastro muda
// ======================================================================

import { useEffect, useState } from "react";
import { subscribeCompetitorSaveQueue } from "./concorrenciaCompetitorSave";

export function useCompetitorSaveQueue() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return subscribeCompetitorSaveQueue(() => setTick((n) => n + 1));
  }, []);

  return tick;
}
