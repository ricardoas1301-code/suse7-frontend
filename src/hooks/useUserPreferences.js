// ======================================================================
// SUSE7 — Hook useUserPreferences
// Consumo de preferências do usuário (modais, avisos, etc.)
// Backend como fonte de verdade. Cache segmentado via service.
//
// Uso em modais (evitar loop de reabertura):
// - Chamar isHidden(key) ANTES de setar estado de abertura.
// - Se isHidden retorna true, NÃO ativar a flag que abre o modal.
// - Não basta retornar null no modal; a lógica que controla abertura
//   deve ser neutralizada no componente pai.
// ======================================================================

import { useState, useCallback } from "react";
import {
  getPreferences,
  setPreference as setPreferenceService,
  deletePreference as deletePreferenceService,
  resetPreferences as resetPreferencesService,
} from "../services/userPreferencesService";

// ----------------------------------------------------------------------
// Normalização de key (alinhada ao backend)
// ----------------------------------------------------------------------
function normalizeKey(key) {
  if (!key || typeof key !== "string") return "";
  return String(key).trim().toLowerCase().replace(/\s+/g, "_");
}

// ----------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------

/**
 * Hook para preferências do usuário.
 * Funções estáveis (useCallback) para uso seguro em useEffect([load]).
 *
 * @returns {{
 *   preferences: Record<string, unknown>;
 *   loading: boolean;
 *   error: string | null;
 *   load: (prefix?: string) => Promise<Record<string, unknown>>;
 *   get: (key: string, defaultValue?: unknown) => unknown;
 *   isHidden: (key: string) => boolean;
 *   set: (key: string, value: object) => Promise<boolean>;
 *   remove: (key: string) => Promise<boolean>;
 *   reset: (prefix: string) => Promise<boolean>;
 * }}
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carrega preferências do backend (opcional: filtrar por prefixo).
   * Estável (useCallback vazio) — seguro para useEffect(() => { load("modal."); }, [load]).
   */
  const load = useCallback(async (prefix = null) => {
    setLoading(true);
    setError(null);

    const result = await getPreferences(prefix);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Erro ao carregar preferências");
      return {};
    }

    const map = result.data ?? {};
    setPreferences((prev) => {
      const prefixKey = prefix != null ? String(prefix).trim() : "";
      const next = { ...prev };
      if (prefixKey) {
        for (const k of Object.keys(next)) {
          if (k.startsWith(prefixKey)) delete next[k];
        }
      }
      return { ...next, ...map };
    });
    return map;
  }, []);

  /**
   * Obtém valor de uma preferência (leitura do state atual).
   */
  const get = useCallback(
    (key, defaultValue = null) => {
      if (!key || typeof key !== "string") return defaultValue;
      const k = normalizeKey(key);
      const val = preferences[k];
      return val !== undefined ? val : defaultValue;
    },
    [preferences]
  );

  /**
   * Verifica se modal/aviso foi marcado como "não mostrar mais".
   * Usar ANTES de ativar a flag que abre o modal — evita loop de reabertura.
   *
   * @param {string} key - ex: "modal.exit_without_saving"
   * @returns {boolean} true quando hidden === true
   */
  const isHidden = useCallback(
    (key) => {
      const val = get(key, {});
      return val && typeof val === "object" && val.hidden === true;
    },
    [get]
  );

  /**
   * Salva preferência e atualiza state local.
   */
  const set = useCallback(async (key, value) => {
    if (!key || typeof key !== "string") return false;
    setError(null);
    const result = await setPreferenceService(key, value);
    if (!result.ok) {
      setError(result.error ?? "Erro ao salvar");
      return false;
    }
    const k = normalizeKey(key);
    setPreferences((prev) => ({ ...prev, [k]: value ?? {} }));
    return true;
  }, []);

  /**
   * Remove preferência e atualiza state local.
   */
  const remove = useCallback(async (key) => {
    if (!key || typeof key !== "string") return false;
    setError(null);
    const result = await deletePreferenceService(key);
    if (!result.ok) {
      setError(result.error ?? "Erro ao remover");
      return false;
    }
    const k = normalizeKey(key);
    setPreferences((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    return true;
  }, []);

  /**
   * Reseta preferências por prefixo (ex: "modal.").
   */
  const reset = useCallback(async (prefix) => {
    if (!prefix || typeof prefix !== "string") return false;
    setError(null);
    const result = await resetPreferencesService(prefix);
    if (!result.ok) {
      setError(result.error ?? "Erro ao resetar");
      return false;
    }
    const prefixNorm = String(prefix).trim().toLowerCase();
    setPreferences((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(prefixNorm)) delete next[k];
      }
      return next;
    });
    return true;
  }, []);

  return {
    preferences,
    loading,
    error,
    load,
    get,
    isHidden,
    set,
    remove,
    reset,
  };
}
