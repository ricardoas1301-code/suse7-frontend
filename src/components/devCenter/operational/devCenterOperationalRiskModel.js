// =============================================================================
// Dev Center S1_6.8 — estados de risco operacional padronizados
// =============================================================================

/** @typedef {"info" | "sucesso" | "alerta" | "critico" | "destrutivo"} DevCenterNivelRiscoOperacional */

/** @type {DevCenterNivelRiscoOperacional[]} */
export const DEV_CENTER_NIVEIS_RISCO_OPERACIONAL = Object.freeze([
  "info",
  "sucesso",
  "alerta",
  "critico",
  "destrutivo",
]);

/** @type {Record<DevCenterNivelRiscoOperacional, string>} */
export const DEV_CENTER_RISCO_OPERACIONAL_LABELS = Object.freeze({
  info: "Informação",
  sucesso: "Sucesso",
  alerta: "Alerta",
  critico: "Crítico",
  destrutivo: "Destrutivo",
});

/**
 * Compatibilidade com risco da Seller Toolbox (low/medium/high/danger).
 * @type {Record<string, DevCenterNivelRiscoOperacional>}
 */
export const MAPA_RISCO_TOOLBOX_PARA_OPERACIONAL = Object.freeze({
  low: "info",
  medium: "alerta",
  high: "critico",
  danger: "destrutivo",
});

/**
 * @param {DevCenterNivelRiscoOperacional | string | null | undefined} nivel
 */
export function rotuloRiscoOperacional(nivel) {
  const chave = String(nivel ?? "").trim();
  return (
    DEV_CENTER_RISCO_OPERACIONAL_LABELS[/** @type {DevCenterNivelRiscoOperacional} */ (chave)] ??
    "—"
  );
}

/**
 * @param {DevCenterNivelRiscoOperacional | string | null | undefined} nivel
 */
export function classeCssRiscoOperacional(nivel) {
  const chave = DEV_CENTER_NIVEIS_RISCO_OPERACIONAL.includes(
    /** @type {DevCenterNivelRiscoOperacional} */ (nivel),
  )
    ? nivel
    : "info";
  return `dc-operacional-risco dc-operacional-risco--${chave}`;
}

/**
 * @param {DevCenterNivelRiscoOperacional | string | null | undefined} nivel
 */
export function exigeConfirmacaoDuplaRisco(nivel) {
  return nivel === "critico" || nivel === "destrutivo";
}

/**
 * @param {string | null | undefined} riskLevelToolbox
 * @returns {DevCenterNivelRiscoOperacional}
 */
export function converterRiscoToolboxParaOperacional(riskLevelToolbox) {
  return (
    MAPA_RISCO_TOOLBOX_PARA_OPERACIONAL[String(riskLevelToolbox ?? "").trim()] ?? "alerta"
  );
}
