import { buildCollapsedOperationalTasksLabel } from "../operationalTasks/operationalTaskDescriptions.js";
import { configuracaoEstaCompleta } from "./configurationOnboardingSelectors.js";

/** Apenas dois modos visuais — sem estado intermediário. */
export const CARD_PANEL_MODE = /** @type {const} */ ({
  COLLAPSED: "COLLAPSED",
  EXPANDED_FULL: "EXPANDED_FULL",
});

/**
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 * }} input
 */
export function configuracaoInicialPendente(input) {
  if (input.configurationInitialLoading) return true;
  if (input.configurationError) return true;
  if (!input.configurationHasResolvedOnce || !input.configurationSnapshot) return false;
  return !configuracaoEstaCompleta(input.configurationSnapshot);
}

/**
 * @param {{
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 * }} input
 */
export function possuiPendenciasOperacionaisAcionaveis(input) {
  return (
    input.operationalHasResolvedOnce &&
    (input.operationalTaskCount > 0 || Boolean(input.operationalError))
  );
}

/**
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalInitialLoading?: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 * }} input
 */
export function painelCentralDeveSerVisivel(input) {
  if (configuracaoInicialPendente(input)) return true;
  return possuiPendenciasOperacionaisAcionaveis(input);
}

/**
 * Seção Configuração Inicial — ausente quando 100% (sem mensagem de conclusão).
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 * }} input
 */
export function secaoConfiguracaoDeveAparecer(input) {
  return configuracaoInicialPendente(input);
}

/**
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 * }} input
 */
export function painelCentralRecolhivel(input) {
  if (configuracaoInicialPendente(input)) return false;
  return possuiPendenciasOperacionaisAcionaveis(input);
}

/**
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 *   userPrefersCollapsed: boolean;
 * }} input
 */
export function resolverModoPainelCentral(input) {
  if (configuracaoInicialPendente(input)) {
    return CARD_PANEL_MODE.EXPANDED_FULL;
  }
  if (painelCentralRecolhivel(input) && input.userPrefersCollapsed) {
    return CARD_PANEL_MODE.COLLAPSED;
  }
  return CARD_PANEL_MODE.EXPANDED_FULL;
}

/**
 * Rótulo recolhido — somente pendências operacionais (config 100% ou ausente).
 * @param {{ operationalTaskCount: number }} input
 */
export function rotuloPainelCentralRecolhido(input) {
  return buildCollapsedOperationalTasksLabel(input.operationalTaskCount);
}

/**
 * Contrato completo para testes e painel.
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 *   userPrefersCollapsed: boolean;
 * }} input
 */
export function resolverContratoPainelCentral(input) {
  const visible = painelCentralDeveSerVisivel(input);
  const mode = visible ? resolverModoPainelCentral(input) : null;
  return {
    visible,
    mode,
    collapsible: painelCentralRecolhivel(input),
    showConfigurationSection: secaoConfiguracaoDeveAparecer(input),
    showOperationalSection: possuiPendenciasOperacionaisAcionaveis(input),
    collapsedLabel: rotuloPainelCentralRecolhido({
      operationalTaskCount: input.operationalTaskCount,
    }),
  };
}
