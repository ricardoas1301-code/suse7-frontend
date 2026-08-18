import { CONFIGURATION_MILESTONE_IDS, CONFIGURATION_MILESTONE_STATUS } from "./configurationOnboardingTypes.js";
import { milestoneM6Elegivel } from "./configurationMilestoneEligibility.js";

/** Tipos de ação — separados da apresentação visual. */
export const CONFIGURATION_MILESTONE_ACTION_TYPES = /** @type {const} */ ({
  MODAL_COMPANY_DATA: "MODAL_COMPANY_DATA",
  LEGAL_FLOW: "LEGAL_FLOW",
  MODAL_TAX_RATE: "MODAL_TAX_RATE",
  MODAL_OPERATIONAL_COST: "MODAL_OPERATIONAL_COST",
  MODAL_OPERATIONAL_CYCLE: "MODAL_OPERATIONAL_CYCLE",
  MODAL_ML_PRECONFIRM: "MODAL_ML_PRECONFIRM",
  FUTURE_NAVIGATION: "FUTURE_NAVIGATION",
  NONE: "NONE",
});

/** @type {Record<string, { actionType: string; clickableWhenPending: boolean }>} */
export const CONFIGURATION_MILESTONE_ACTION_REGISTRY = {
  [CONFIGURATION_MILESTONE_IDS.COMPANY_DATA]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA,
    clickableWhenPending: true,
  },
  [CONFIGURATION_MILESTONE_IDS.LEGAL_ACCEPTANCE]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.LEGAL_FLOW,
    clickableWhenPending: true,
  },
  [CONFIGURATION_MILESTONE_IDS.TAX_RATE]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_TAX_RATE,
    clickableWhenPending: true,
  },
  [CONFIGURATION_MILESTONE_IDS.OPERATIONAL_COST]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_OPERATIONAL_COST,
    clickableWhenPending: true,
  },
  [CONFIGURATION_MILESTONE_IDS.OPERATIONAL_CYCLE]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_OPERATIONAL_CYCLE,
    clickableWhenPending: true,
  },
  [CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION]: {
    actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM,
    clickableWhenPending: true,
  },
};

/**
 * @param {string | null | undefined} milestoneId
 */
export function resolverAcaoMilestone(milestoneId) {
  const id = String(milestoneId ?? "").trim();
  const entry = CONFIGURATION_MILESTONE_ACTION_REGISTRY[id];
  if (!entry) {
    return {
      id,
      actionType: CONFIGURATION_MILESTONE_ACTION_TYPES.NONE,
      clickableWhenPending: false,
      implemented: false,
    };
  }
  return {
    id,
    actionType: entry.actionType,
    clickableWhenPending: entry.clickableWhenPending,
    implemented: entry.actionType !== CONFIGURATION_MILESTONE_ACTION_TYPES.FUTURE_NAVIGATION,
  };
}

/**
 * @param {string | null | undefined} milestoneId
 * @param {string | null | undefined} status
 * @param {readonly Record<string, unknown>[] | null | undefined} [milestones]
 */
export function milestoneAcaoClicavel(milestoneId, status, milestones = null) {
  const action = resolverAcaoMilestone(milestoneId);
  if (!action.implemented || !action.clickableWhenPending) return false;
  if (status !== CONFIGURATION_MILESTONE_STATUS.PENDING) return false;
  const id = String(milestoneId ?? "");
  if (id === CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION) {
    if (!milestones || !milestoneM6Elegivel(milestones)) return false;
  }
  return true;
}

/**
 * @param {readonly Record<string, unknown>[]} milestones
 * @param {string | null | undefined} milestoneId
 */
export function obterMilestonePorId(milestones, milestoneId) {
  const id = String(milestoneId ?? "").trim();
  return (Array.isArray(milestones) ? milestones : []).find((row) => String(row?.id ?? "") === id) ?? null;
}
