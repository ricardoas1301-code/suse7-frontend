import { CONFIGURATION_MILESTONE_STATUS, CONFIGURATION_STATUS } from "./configurationOnboardingTypes.js";
import {
  CONFIGURATION_MILESTONE_PRESENTATION_ORDER,
  obterApresentacaoMilestone,
  ordenarMilestonesParaApresentacao,
} from "./configurationMilestonePresentationRegistry.js";

/**
 * @param {{ configuration?: Record<string, unknown>; milestones?: readonly Record<string, unknown>[] } | null | undefined} snapshot
 */
export function configuracaoEstaCompleta(snapshot) {
  const configuration = snapshot?.configuration;
  if (!configuration || typeof configuration !== "object") return false;
  if (configuration.status === CONFIGURATION_STATUS.COMPLETED) return true;
  return Number(configuration.percent) >= 100;
}

/**
 * Primeiro milestone PENDING na ordem de apresentação (escolha UX — não regra de negócio).
 * @param {readonly Record<string, unknown>[]} milestones
 */
export function selecionarProximoMilestonePendente(milestones) {
  const ordered = ordenarMilestonesParaApresentacao(milestones);
  for (const id of CONFIGURATION_MILESTONE_PRESENTATION_ORDER) {
    const row = ordered.find((m) => String(m?.id ?? "") === id);
    if (row && row.status === CONFIGURATION_MILESTONE_STATUS.PENDING) {
      return { milestone: row, presentation: obterApresentacaoMilestone(id) };
    }
  }
  const fallback = ordered.find((m) => m?.status === CONFIGURATION_MILESTONE_STATUS.PENDING);
  if (!fallback) return null;
  return {
    milestone: fallback,
    presentation: obterApresentacaoMilestone(String(fallback.id ?? "")),
  };
}

/**
 * @param {{ configuration?: Record<string, unknown> } | null | undefined} snapshot
 */
export function extrairResumoProgresso(snapshot) {
  const configuration = snapshot?.configuration;
  if (!configuration || typeof configuration !== "object") {
    return { percent: null, completed: null, total: null };
  }
  return {
    percent: Number.isFinite(Number(configuration.percent)) ? Number(configuration.percent) : null,
    completed: Number.isFinite(Number(configuration.completed)) ? Number(configuration.completed) : null,
    total: Number.isFinite(Number(configuration.total)) ? Number(configuration.total) : null,
  };
}
