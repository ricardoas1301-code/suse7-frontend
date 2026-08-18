import {
  CONFIGURATION_MILESTONE_IDS,
  CONFIGURATION_MILESTONE_STATUS,
} from "./configurationOnboardingTypes.js";

/** Milestones obrigatórios antes de liberar M6 (Conectar marketplace). */
export const CONFIGURATION_M6_PREREQUISITE_IDS = [
  CONFIGURATION_MILESTONE_IDS.COMPANY_DATA,
  CONFIGURATION_MILESTONE_IDS.LEGAL_ACCEPTANCE,
  CONFIGURATION_MILESTONE_IDS.TAX_RATE,
  CONFIGURATION_MILESTONE_IDS.OPERATIONAL_COST,
  CONFIGURATION_MILESTONE_IDS.OPERATIONAL_CYCLE,
];

/**
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function prerequisitesM6Completos(milestones) {
  const list = Array.isArray(milestones) ? milestones : [];
  return CONFIGURATION_M6_PREREQUISITE_IDS.every((id) => {
    const row = list.find((m) => String(m?.id ?? "") === id);
    return row?.status === CONFIGURATION_MILESTONE_STATUS.COMPLETED;
  });
}

/**
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestoneM6Elegivel(milestones) {
  return prerequisitesM6Completos(milestones);
}

/**
 * M6 pendente mas ainda bloqueado por prerequisites incompletos.
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestoneM6BloqueadoPorPrerequisites(milestones) {
  const list = Array.isArray(milestones) ? milestones : [];
  const m6 = list.find(
    (m) => String(m?.id ?? "") === CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION,
  );
  if (!m6 || m6.status === CONFIGURATION_MILESTONE_STATUS.COMPLETED) return false;
  return !prerequisitesM6Completos(milestones);
}

/**
 * @param {string | null | undefined} milestoneId
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestoneVisualmenteBloqueado(milestoneId, milestones) {
  const id = String(milestoneId ?? "").trim();
  if (id !== CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION) return false;
  return milestoneM6BloqueadoPorPrerequisites(milestones);
}
