import { configuracaoEstaCompleta } from "./configurationOnboardingSelectors.js";
import { milestoneM6Elegivel } from "./configurationMilestoneEligibility.js";

/**
 * @param {string} pathname
 */
export function normalizarPathConfiguracao(pathname) {
  const raw = String(pathname || "/").trim();
  if (!raw || raw === "/") return "/";
  const withoutTrailing = raw.replace(/\/+$/, "") || "/";
  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`;
}

/**
 * @param {{
 *   snapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   initialLoading: boolean;
 *   error: string | null;
 *   hasResolvedOnce: boolean;
 *   introActive?: boolean;
 * }} input
 */
export function configuracaoAppGateAtivo(input) {
  if (input.introActive) return false;
  if (input.initialLoading || input.refreshing || !input.hasResolvedOnce) return false;
  if (input.error || !input.snapshot) return true;
  return !configuracaoEstaCompleta(input.snapshot);
}

/**
 * Durante configuração incompleta, somente Dashboard permanece navegável.
 * @param {string} pathname
 */
export function rotaPermitidaComConfiguracaoIncompleta(pathname) {
  return normalizarPathConfiguracao(pathname) === "/";
}

/**
 * @param {string} pathname
 */
export function rotaIntegracaoMercadoLivre(pathname) {
  return normalizarPathConfiguracao(pathname).startsWith("/perfil/integracoes/mercado-livre");
}

/**
 * @param {string} pathname
 * @param {boolean} gateAtivo
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function resolverRedirectConfiguracaoIncompleta(pathname, gateAtivo, milestones) {
  if (!gateAtivo) return null;
  const path = normalizarPathConfiguracao(pathname);
  if (!rotaPermitidaComConfiguracaoIncompleta(path)) {
    return "/";
  }
  if (rotaIntegracaoMercadoLivre(path) && !milestoneM6Elegivel(milestones)) {
    return "/";
  }
  return null;
}

/**
 * @param {string} pathname
 * @param {boolean} gateAtivo
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function rotaIntegracaoBloqueada(pathname, gateAtivo, milestones) {
  if (!rotaIntegracaoMercadoLivre(pathname)) return false;
  if (!gateAtivo) return false;
  return !milestoneM6Elegivel(milestones);
}

/**
 * Contrato 01E — OAuth/start flow deve validar M1–M5 no backend antes de permitir integração.
 * @type {{ id: string; description: string; requiredMilestones: string[] }}
 */
export const CONFIGURATION_OAUTH_SERVER_PRECONDITION_01E = {
  id: "OAUTH_M6_PREREQUISITES",
  description:
    "Backend/start OAuth MUST reject first marketplace connection until COMPANY_DATA, LEGAL_ACCEPTANCE, TAX_RATE, OPERATIONAL_COST and OPERATIONAL_CYCLE are COMPLETED.",
  requiredMilestones: [
    "COMPANY_DATA",
    "LEGAL_ACCEPTANCE",
    "TAX_RATE",
    "OPERATIONAL_COST",
    "OPERATIONAL_CYCLE",
  ],
};
