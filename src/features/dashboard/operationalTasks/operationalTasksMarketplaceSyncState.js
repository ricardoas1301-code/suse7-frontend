// ======================================================================
// SSOT frontend — fase operacional da sincronização inicial (payload API)
// Origem canônica: resolveMlInitialSyncOperationalPhase (backend)
// ======================================================================

/** @typedef {"none" | "awaiting_start" | "in_progress" | null | undefined} MarketplaceInitialSyncPhase */

export const MARKETPLACE_INITIAL_SYNC_PHASE = /** @type {const} */ ({
  NONE: "none",
  AWAITING_START: "awaiting_start",
  IN_PROGRESS: "in_progress",
});

/**
 * @param {MarketplaceInitialSyncPhase | string | null | undefined} phase
 * @returns {boolean}
 */
export function sincronizacaoInicialAguardandoInicio(phase) {
  return String(phase ?? "").trim() === MARKETPLACE_INITIAL_SYNC_PHASE.AWAITING_START;
}

/**
 * @param {Record<string, unknown> | null | undefined} operationalPayload
 * @returns {MarketplaceInitialSyncPhase}
 */
export function extrairFaseSincronizacaoInicialOperacional(operationalPayload) {
  const raw = operationalPayload?.ml_initial_sync_phase;
  const phase = String(raw ?? "").trim();
  if (
    phase === MARKETPLACE_INITIAL_SYNC_PHASE.AWAITING_START ||
    phase === MARKETPLACE_INITIAL_SYNC_PHASE.IN_PROGRESS ||
    phase === MARKETPLACE_INITIAL_SYNC_PHASE.NONE
  ) {
    return phase;
  }
  return MARKETPLACE_INITIAL_SYNC_PHASE.NONE;
}
