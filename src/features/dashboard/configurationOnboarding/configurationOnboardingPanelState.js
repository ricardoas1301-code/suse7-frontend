import { buildCollapsedOperationalTasksLabel } from "../operationalTasks/operationalTaskDescriptions.js";
import { configuracaoEstaCompleta } from "./configurationOnboardingSelectors.js";

/** Apenas dois modos visuais — sem estado intermediário. */
export const CARD_PANEL_MODE = /** @type {const} */ ({
  COLLAPSED: "COLLAPSED",
  EXPANDED_FULL: "EXPANDED_FULL",
});

/** Resolução canônica do onboarding — evita tratar loading como incompleto. */
export const CONFIGURACAO_INICIAL_ESTADO = /** @type {const} */ ({
  UNKNOWN: "UNKNOWN",
  INCOMPLETE: "INCOMPLETE",
  COMPLETE: "COMPLETE",
});

/**
 * @param {{ configurationCompletionCelebrationActive?: boolean }} input
 */
export function celebracaoConfiguracaoAtiva(input) {
  return input.configurationCompletionCelebrationActive === true;
}

/**
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   configurationCompletionCelebrationActive?: boolean;
 * }} input
 * @returns {"UNKNOWN" | "INCOMPLETE" | "COMPLETE"}
 */
export function resolverEstadoConfiguracaoInicial(input) {
  if (celebracaoConfiguracaoAtiva(input)) {
    return CONFIGURACAO_INICIAL_ESTADO.COMPLETE;
  }
  if (input.configurationInitialLoading) {
    return CONFIGURACAO_INICIAL_ESTADO.UNKNOWN;
  }
  if (!input.configurationHasResolvedOnce) {
    return CONFIGURACAO_INICIAL_ESTADO.UNKNOWN;
  }
  if (input.configurationError && !input.configurationSnapshot) {
    return CONFIGURACAO_INICIAL_ESTADO.INCOMPLETE;
  }
  if (!input.configurationSnapshot) {
    return CONFIGURACAO_INICIAL_ESTADO.UNKNOWN;
  }
  if (configuracaoEstaCompleta(input.configurationSnapshot)) {
    return CONFIGURACAO_INICIAL_ESTADO.COMPLETE;
  }
  return CONFIGURACAO_INICIAL_ESTADO.INCOMPLETE;
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
 *   configurationCompletionCelebrationActive?: boolean;
 * }} input
 */
export function configuracaoInicialPendente(input) {
  return resolverEstadoConfiguracaoInicial(input) === CONFIGURACAO_INICIAL_ESTADO.INCOMPLETE;
}

/**
 * Onboarding inicial concluído (6/6 — 100%).
 * @param {{
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 * }} input
 */
export function configuracaoInicialConcluida(input) {
  if (!input.configurationHasResolvedOnce || !input.configurationSnapshot) return false;
  return configuracaoEstaCompleta(input.configurationSnapshot);
}

/**
 * Seção operacional pós-onboarding — somente após 6/6 e fora da celebração ativa.
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   operationalHasResolvedOnce: boolean;
 *   operationalTaskCount: number;
 *   operationalError?: string | null;
 *   configurationCompletionCelebrationActive?: boolean;
 * }} input
 */
export function secaoOperacionalPosOnboardingDeveAparecer(input) {
  if (celebracaoConfiguracaoAtiva(input)) return false;
  if (!configuracaoInicialConcluida(input)) return false;
  return possuiPendenciasOperacionaisAcionaveis(input);
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
  if (celebracaoConfiguracaoAtiva(input)) return true;
  const estado = resolverEstadoConfiguracaoInicial(input);
  if (estado === CONFIGURACAO_INICIAL_ESTADO.UNKNOWN) return false;
  if (estado === CONFIGURACAO_INICIAL_ESTADO.INCOMPLETE) return true;
  return secaoOperacionalPosOnboardingDeveAparecer(input);
}

/**
 * Seção Configuração Inicial — também visível na celebração 6/6 pós-OAuth.
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   configurationCompletionCelebrationActive?: boolean;
 * }} input
 */
export function secaoConfiguracaoDeveAparecer(input) {
  if (celebracaoConfiguracaoAtiva(input)) return true;
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
  if (celebracaoConfiguracaoAtiva(input)) return false;
  if (configuracaoInicialPendente(input)) return false;
  return secaoOperacionalPosOnboardingDeveAparecer(input);
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
  if (celebracaoConfiguracaoAtiva(input) || configuracaoInicialPendente(input)) {
    return CARD_PANEL_MODE.EXPANDED_FULL;
  }
  if (painelCentralRecolhivel(input) && input.userPrefersCollapsed) {
    return CARD_PANEL_MODE.COLLAPSED;
  }
  return CARD_PANEL_MODE.EXPANDED_FULL;
}

/**
 * Painel centralizado (overlay) durante onboarding incompleto ou celebração 6/6.
 * @param {{
 *   configurationInitialLoading: boolean;
 *   configurationError: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   configurationCompletionCelebrationActive?: boolean;
 * }} input
 */
export function painelCentralOnboardingOverlay(input) {
  if (celebracaoConfiguracaoAtiva(input)) return true;
  return configuracaoInicialPendente(input);
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
    showOperationalSection: secaoOperacionalPosOnboardingDeveAparecer(input),
    collapsedLabel: rotuloPainelCentralRecolhido({
      operationalTaskCount: input.operationalTaskCount,
    }),
  };
}
