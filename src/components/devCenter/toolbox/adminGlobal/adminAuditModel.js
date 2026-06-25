// ======================================================
// ADMIN GLOBAL — MODEL DE AUDITORIA (S1_5)
// ------------------------------------------------------
// Rótulos legíveis de operações/entidades e formatação para a
// timeline de auditoria administrativa.
// ======================================================

/** Rótulos amigáveis por tipo de operação. */
const OPERACAO_LABEL = Object.freeze({
  plan_updated: "Plano atualizado",
  plan_price_changed: "Valor do plano alterado",
  plan_limit_changed: "Limite do plano alterado",
  plan_status_changed: "Status do plano alterado",
  feature_created: "Feature criada",
  feature_updated: "Feature atualizada",
  feature_status_changed: "Feature habilitada/desabilitada",
  feature_rollout_changed: "Rollout da feature alterado",
  feature_plan_link: "Vínculo plano × feature",
});

const ENTIDADE_LABEL = Object.freeze({
  plan: "Plano",
  feature: "Feature",
  feature_assignment: "Vínculo plano × feature",
});

/** @param {string|null} type */
export function rotuloOperacao(type) {
  return OPERACAO_LABEL[String(type ?? "")] ?? (type ? String(type) : "Operação administrativa");
}

/** @param {string|null} entity */
export function rotuloEntidade(entity) {
  return ENTIDADE_LABEL[String(entity ?? "")] ?? (entity ? String(entity) : "—");
}

/** Resumo curto de um valor before/after para exibição. */
export function resumirValor(valor) {
  if (valor == null) return "—";
  if (typeof valor === "object") {
    if ("enabled" in valor) return valor.enabled ? "habilitado" : "desabilitado";
    if ("status" in valor) return String(valor.status);
    try {
      return JSON.stringify(valor);
    } catch {
      return "—";
    }
  }
  return String(valor);
}

/** @param {string|null} iso */
export function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
