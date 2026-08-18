// ======================================================
// ADMIN GLOBAL — FEATURES: PROVIDER / STORE (S1_4)
// ------------------------------------------------------
// Estado do catálogo global de features + vínculos plano×feature.
// Reload administrativo sem refresh. Persistência 100% via backend.
// ======================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminFeatures,
  createAdminFeature,
  saveAdminFeature,
  setAdminFeatureAssignment,
} from "../../../../services/adminFeaturesApi";
import { AdminFeaturesContext } from "./adminFeaturesContext";

export function AdminFeaturesProvider({ children }) {
  const [features, setFeatures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [degradado, setDegradado] = useState(false);
  const [salvandoId, setSalvandoId] = useState(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchAdminFeatures();
      if (res.ok) {
        setFeatures(Array.isArray(res.features) ? res.features : []);
        setAssignments(Array.isArray(res.assignments) ? res.assignments : []);
        setDegradado(Boolean(res.degraded));
      } else {
        setErro(res.error || "Não foi possível carregar as features.");
      }
    } catch {
      setErro("Falha de comunicação ao carregar as features.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarFeature = useCallback(async (payload) => {
    setSalvandoId("__nova__");
    try {
      const res = await createAdminFeature(payload);
      if (res.ok && res.feature) {
        setFeatures((atuais) => [...atuais, res.feature].sort((a, b) => a.sort_order - b.sort_order));
        return { ok: true, feature: res.feature };
      }
      return { ok: false, error: res.error || "Falha ao criar feature." };
    } catch {
      return { ok: false, error: "Falha de comunicação ao criar feature." };
    } finally {
      setSalvandoId(null);
    }
  }, []);

  const salvarFeature = useCallback(async (featureId, patch) => {
    setSalvandoId(featureId);
    try {
      const res = await saveAdminFeature(featureId, patch);
      if (res.ok && res.feature) {
        setFeatures((atuais) => atuais.map((f) => (f.id === featureId ? res.feature : f)));
        return { ok: true, feature: res.feature };
      }
      return { ok: false, error: res.error || "Falha ao salvar feature." };
    } catch {
      return { ok: false, error: "Falha de comunicação ao salvar feature." };
    } finally {
      setSalvandoId(null);
    }
  }, []);

  const definirVinculo = useCallback(async (featureId, planId, enabled) => {
    try {
      const res = await setAdminFeatureAssignment(featureId, {
        scope: "plan",
        scope_id: planId,
        enabled,
      });
      if (res.ok && res.assignment) {
        setAssignments((atuais) => {
          const idx = atuais.findIndex(
            (a) => a.feature_id === featureId && a.scope === "plan" && String(a.scope_id) === String(planId),
          );
          if (idx >= 0) {
            const copia = atuais.slice();
            copia[idx] = res.assignment;
            return copia;
          }
          return [...atuais, res.assignment];
        });
        return { ok: true };
      }
      return { ok: false, error: res.error || "Falha ao vincular feature." };
    } catch {
      return { ok: false, error: "Falha de comunicação ao vincular feature." };
    }
  }, []);

  const value = useMemo(
    () => ({
      features,
      assignments,
      carregando,
      erro,
      degradado,
      salvandoId,
      recarregar,
      criarFeature,
      salvarFeature,
      definirVinculo,
    }),
    [features, assignments, carregando, erro, degradado, salvandoId, recarregar, criarFeature, salvarFeature, definirVinculo],
  );

  return <AdminFeaturesContext.Provider value={value}>{children}</AdminFeaturesContext.Provider>;
}
