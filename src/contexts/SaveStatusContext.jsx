// ======================================================================
// SUSE7 — SAVE STATUS (indicador global de operações em andamento)
// Provider + Hook para ampulheta/toast em processos assíncronos (reorder, save, etc)
// Estados: idle | saving | success | error
// Suporta múltiplas operações por chave (ex: "images-reorder", "variants-reorder")
//
// PADRÃO DE USO (reaproveitar em outras abas):
//   const saveStatus = useSaveStatus();
//   saveStatus.saving("minha-operacao");
//   try {
//     await minhaOperacao();
//     saveStatus.success("minha-operacao");
//   } catch (err) {
//     saveStatus.error("minha-operacao", {
//       message: err?.message,
//       retry: () => minhaOperacao(), // opcional
//     });
//   }
// ======================================================================

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const SaveStatusContext = createContext(null);

const SUCCESS_AUTO_HIDE_MS = 1500;

export function SaveStatusProvider({ children }) {
  const [items, setItems] = useState(() => new Map());
  const successTimersRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(successTimersRef.current).forEach(clearTimeout);
      successTimersRef.current = {};
    };
  }, []);

  const setStatus = useCallback((key, status, opts = {}) => {
    const { message, retry } = opts;
    setItems((prev) => {
      const next = new Map(prev);
      if (status === "idle") {
        next.delete(key);
      } else {
        next.set(key, { status, message, retry });
      }
      return next;
    });

    if (status === "success") {
      clearTimeout(successTimersRef.current[key]);
      successTimersRef.current[key] = setTimeout(() => {
        setItems((p) => {
          const n = new Map(p);
          n.delete(key);
          return n;
        });
        delete successTimersRef.current[key];
      }, SUCCESS_AUTO_HIDE_MS);
    }
  }, []);

  const saving = useCallback((key) => setStatus(key, "saving"), [setStatus]);
  const success = useCallback((key) => setStatus(key, "success"), [setStatus]);
  const error = useCallback((key, opts = {}) => setStatus(key, "error", opts), [setStatus]);
  const idle = useCallback((key) => setStatus(key, "idle"), [setStatus]);

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
