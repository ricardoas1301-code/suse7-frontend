import {
  CONFIGURATION_MILESTONE_IDS,
  CONFIGURATION_MILESTONE_STATUS,
} from "./configurationOnboardingTypes.js";
import { CONFIGURATION_MILESTONE_PRESENTATION_ORDER } from "./configurationMilestonePresentationRegistry.js";

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
 * Etapas anteriores concluídas na ordem canônica da trilha.
 * @param {string | null | undefined} milestoneId
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestonePredecessoresCompletos(milestoneId, milestones) {
  const id = String(milestoneId ?? "").trim();
  const orderIndex = CONFIGURATION_MILESTONE_PRESENTATION_ORDER.indexOf(id);
  if (orderIndex <= 0) return true;

  const list = Array.isArray(milestones) ? milestones : [];
  for (let index = 0; index < orderIndex; index += 1) {
    const predecessorId = CONFIGURATION_MILESTONE_PRESENTATION_ORDER[index];
    const row = list.find((m) => String(m?.id ?? "") === predecessorId);
    if (row?.status !== CONFIGURATION_MILESTONE_STATUS.COMPLETED) return false;
  }
  return true;
}

/**
 * Próxima etapa pendente habilitada na trilha sequencial (SSOT milestones).
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function obterProximoMilestoneSequencialHabilitado(milestones) {
  const list = Array.isArray(milestones) ? milestones : [];
  for (const milestoneId of CONFIGURATION_MILESTONE_PRESENTATION_ORDER) {
    const row = list.find((m) => String(m?.id ?? "") === milestoneId);
    if (row?.status === CONFIGURATION_MILESTONE_STATUS.PENDING) {
      return milestonePredecessoresCompletos(milestoneId, milestones) ? milestoneId : null;
    }
  }
  return null;
}

/**
 * Etapa pendente clicável somente quando predecessors estão concluídos.
 * @param {string | null | undefined} milestoneId
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestoneSequencialmenteHabilitado(milestoneId, milestones) {
  const id = String(milestoneId ?? "").trim();
  const list = Array.isArray(milestones) ? milestones : [];
  const row = list.find((m) => String(m?.id ?? "") === id);
  if (!row || row.status !== CONFIGURATION_MILESTONE_STATUS.PENDING) return false;
  return milestonePredecessoresCompletos(id, milestones);
}

/**
 * @param {string | null | undefined} milestoneId
 * @param {readonly Record<string, unknown>[] | null | undefined} milestones
 */
export function milestoneVisualmenteBloqueado(milestoneId, milestones) {
  const id = String(milestoneId ?? "").trim();
  const list = Array.isArray(milestones) ? milestones : [];
  const row = list.find((m) => String(m?.id ?? "") === id);
  if (!row || row.status === CONFIGURATION_MILESTONE_STATUS.COMPLETED) return false;
  return !milestoneSequencialmenteHabilitado(id, milestones);
}
