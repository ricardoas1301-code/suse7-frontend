// ======================================================================
// Política centralizada — expandido/recolhido da Central de pendências
// ======================================================================

import {
  readOperationalTasksCollapsedPreference,
  writeOperationalTasksCollapsedPreference,
} from "./operationalTasksCollapseStorage.js";
import { sincronizacaoInicialAguardandoInicio } from "./operationalTasksMarketplaceSyncState.js";

/**
 * Enquanto a sincronização inicial não foi iniciada, não persistir preferência expandida —
 * cada mount/reload/revalidação nasce recolhido.
 * @param {string | null | undefined} initialSyncPhase
 * @returns {boolean}
 */
export function devePersistirPreferenciaRecolhido(initialSyncPhase) {
  return !sincronizacaoInicialAguardandoInicio(initialSyncPhase);
}

/**
 * @param {{
 *   userId: string | null | undefined;
 *   initialSyncPhase: string | null | undefined;
 * }} input
 * @returns {boolean}
 */
export function estadoInicialRecolhidoPainelOperacional(input) {
  if (sincronizacaoInicialAguardandoInicio(input.initialSyncPhase)) return true;
  return readOperationalTasksCollapsedPreference(input.userId);
}

/**
 * @param {{
 *   userId: string | null | undefined;
 *   initialSyncPhase: string | null | undefined;
 *   collapsed: boolean;
 * }} input
 */
export function persistirPreferenciaRecolhidoPainelOperacional(input) {
  if (!devePersistirPreferenciaRecolhido(input.initialSyncPhase)) return;
  writeOperationalTasksCollapsedPreference(input.userId, input.collapsed);
}
