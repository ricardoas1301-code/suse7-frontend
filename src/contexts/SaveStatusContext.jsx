// ======================================================================
// SUSE7 — SAVE STATUS (indicador global de operações em andamento)
// Provider + Hook para ampulheta/toast em processos assíncronos (reorder, save, etc)
// Estados: idle | saving | success | error
// Suporta múltiplas operações por chave (ex: "images-reorder", "variants-reorder")
//
// PADRÃO DE USO (reaproveitar em outras abas):
//   const saveStatus = useSaveStatus();
//   const opId = saveStatus.saving("minha-operacao");
//   try {
//     await minhaOperacao();
//     saveStatus.success("minha-operacao", opId);
//   } catch (err) {
//     saveStatus.error("minha-operacao", opId, {
//       message: err?.message,
//       retry: () => minhaOperacao(), // opcional
//     });
//   }
// ======================================================================

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const SaveStatusContext = createContext(null);

const SUCCESS_AUTO_HIDE_MS = 1500;
const MIN_SAVING_DISPLAY_MS = 300;

export function SaveStatusProvider({ children }) {
  const [items, setItems] = useState(() => new Map());
  const successTimersRef = useRef({});
  const opIdByKeyRef = useRef({});
  const savingStartedAtRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(successTimersRef.current).forEach(clearTimeout);
      successTimersRef.current = {};
    };
  }, []);

  const saving = useCallback((key) => {
    const opId = (opIdByKeyRef.current[key] = (opIdByKeyRef.current[key] || 0) + 1);
    savingStartedAtRef.current[key] = Date.now();
    setItems((prev) => {
      const next = new Map(prev);
      next.set(key, { status: "saving", opId });
      return next;
    });
    return opId;
  }, []);

  const success = useCallback((key, opId) => {
    const savingStartedAt = savingStartedAtRef.current[key] ?? Date.now();
    const elapsed = Date.now() - savingStartedAt;
    const delay = Math.max(0, MIN_SAVING_DISPLAY_MS - elapsed);

    const doSuccess = () => {
      setItems((prev) => {
        const cur = prev.get(key);
        if (cur?.opId !== opId) return prev; // corrida: só aceita o mais recente
        const next = new Map(prev);
        next.set(key, { status: "success", opId });
        return next;
      });
      clearTimeout(successTimersRef.current[key]);
      successTimersRef.current[key] = setTimeout(() => {
        setItems((p) => {
          const n = new Map(p);
          const cur = n.get(key);
          if (cur?.opId === opId) n.delete(key);
          return n;
        });
        delete successTimersRef.current[key];
      }, SUCCESS_AUTO_HIDE_MS);
    };

    if (delay > 0) setTimeout(doSuccess, delay);
    else doSuccess();
  }, []);

  const error = useCallback((key, opId, opts = {}) => {
    setItems((prev) => {
      const cur = prev.get(key);
      if (cur?.opId !== opId) return prev; // corrida: ignora resultado antigo
      const next = new Map(prev);
      next.set(key, { status: "error", opId, message: opts.message, retry: opts.retry });
      return next;
    });
  }, []);

  const idle = useCallback((key) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const getActive = useCallback(() => {
    const entries = Array.from(items.entries());
    const savingItem = entries.find(([, v]) => v.status === "saving");
    const errorItem = entries.find(([, v]) => v.status === "error");
    const successItem = entries.find(([, v]) => v.status === "success");
    return savingItem || errorItem || successItem || null;
  }, [items]);

  const value = {
    items,
    getActive,
    saving,
    success,
    error,
    idle,
  };

  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const ctx = useContext(SaveStatusContext);
  if (!ctx) {
    throw new Error("useSaveStatus must be used within SaveStatusProvider");
  }
  return ctx;
}
