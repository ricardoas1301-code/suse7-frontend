// ======================================================
// ADMIN GLOBAL — PROVIDER / STORE (S1_2.4 / S1_2.5)
// ------------------------------------------------------
// Centraliza o estado administrativo global:
//   • aba ativa
//   • dados de planos
//   • loading / erro / fonte
//   • reload administrativo (sem refresh de página — S1_2.5)
//
// Persistência é 100% via backend (Supabase só pelo backend).
// Nenhuma lógica financeira sensível vive aqui.
// ======================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminPlans, saveAdminPlan } from "../../../../services/adminPlansApi";
import { AdminGlobalContext } from "./adminGlobalContext";
import { ADMIN_FONTE, ADMIN_GLOBAL_SECAO_PADRAO } from "./adminGlobalModel";

export function AdminGlobalProvider({ children }) {
  const [abaAtiva, setAbaAtiva] = useState(ADMIN_GLOBAL_SECAO_PADRAO);
  const [plans, setPlans] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [fonte, setFonte] = useState(ADMIN_FONTE.BACKEND);
  const [salvandoId, setSalvandoId] = useState(null);

  /** Reload administrativo global (S1_2.5) — recarrega dados sem refresh. */
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchAdminPlans();
      if (res.ok) {
        setPlans(Array.isArray(res.plans) ? res.plans : []);
        setFonte(ADMIN_FONTE.BACKEND);
      } else {
        setErro(res.error || "Não foi possível carregar os planos.");
        setFonte(ADMIN_FONTE.INDISPONIVEL);
      }
    } catch {
      setErro("Falha de comunicação ao carregar os planos.");
      setFonte(ADMIN_FONTE.INDISPONIVEL);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carga inicial (uma vez).
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  /** Salva alterações de um plano via backend e atualiza o estado. */
  const salvarPlano = useCallback(async (planId, patch) => {
    setSalvandoId(planId);
    try {
      const res = await saveAdminPlan(planId, patch);
      if (res.ok && res.plan) {
        setPlans((atuais) => atuais.map((p) => (p.id === planId ? res.plan : p)));
        return { ok: true, plan: res.plan };
      }
      return { ok: false, error: res.error || "Falha ao salvar o plano." };
    } catch {
      return { ok: false, error: "Falha de comunicação ao salvar o plano." };
    } finally {
      setSalvandoId(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      abaAtiva,
      definirAba: setAbaAtiva,
      plans,
      carregando,
      erro,
      fonte,
      salvandoId,
      recarregar,
      salvarPlano,
    }),
    [abaAtiva, plans, carregando, erro, fonte, salvandoId, recarregar, salvarPlano],
  );

  return <AdminGlobalContext.Provider value={value}>{children}</AdminGlobalContext.Provider>;
}
