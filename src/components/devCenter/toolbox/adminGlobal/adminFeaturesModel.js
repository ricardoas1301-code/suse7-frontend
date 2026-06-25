// ======================================================
// ADMIN GLOBAL — MODEL DE FEATURES (S1_4)
// ------------------------------------------------------
// Catálogos de status (feature flag global) e rollout. Sem regra de
// negócio sensível — o backend é a fonte da verdade.
// ======================================================

/** Status (feature flag global). */
export const FEATURE_STATUS = Object.freeze({ ATIVA: "ativa", INATIVA: "inativa" });

export const FEATURE_STATUS_CATALOGO = Object.freeze([
  { value: FEATURE_STATUS.ATIVA, label: "Ativa", tone: "sucesso" },
  { value: FEATURE_STATUS.INATIVA, label: "Inativa", tone: "neutro" },
]);

/** Estágios de rollout (preparação — S1_4.5). */
export const ROLLOUT_STAGE = Object.freeze({
  GA: "ga",
  BETA: "beta",
  INTERNO: "interno",
  EXPERIMENTAL: "experimental",
});

export const ROLLOUT_CATALOGO = Object.freeze([
  { value: ROLLOUT_STAGE.GA, label: "Disponível (GA)", tone: "sucesso" },
  { value: ROLLOUT_STAGE.BETA, label: "Beta", tone: "info" },
  { value: ROLLOUT_STAGE.INTERNO, label: "Interno", tone: "alerta" },
  { value: ROLLOUT_STAGE.EXPERIMENTAL, label: "Experimental", tone: "neutro" },
]);

/** @param {string} status */
export function metaFeatureStatus(status) {
  const item = FEATURE_STATUS_CATALOGO.find((s) => s.value === status);
  return item ? { label: item.label, tone: item.tone } : { label: status || "—", tone: "neutro" };
}

/** @param {string} stage */
export function metaRollout(stage) {
  const item = ROLLOUT_CATALOGO.find((s) => s.value === stage);
  return item ? { label: item.label, tone: item.tone } : { label: stage || "—", tone: "neutro" };
}

/**
 * Constrói um índice rápido de vínculos: featureId → { planScopeId → enabled }.
 * @param {object[]} assignments
 */
export function indexarVinculos(assignments) {
  /** @type {Map<string, Map<string, boolean>>} */
  const idx = new Map();
  for (const a of assignments ?? []) {
    if (a.scope !== "plan" || !a.scope_id) continue;
    if (!idx.has(a.feature_id)) idx.set(a.feature_id, new Map());
    idx.get(a.feature_id).set(String(a.scope_id), a.enabled !== false);
  }
  return idx;
}
