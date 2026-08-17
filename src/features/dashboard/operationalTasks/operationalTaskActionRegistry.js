// ======================================================================
// Registry seguro de ações — Central de Tarefas Operacionais
// O backend retorna somente identificadores; o frontend executa ações controladas.
// ======================================================================

import { OPERATIONAL_TASK_ACTION_TYPES } from "./operationalTaskTypes.js";

/**
 * @typedef {Object} OperationalTaskActionHandlers
 * @property {() => void} [open_bulk_listing_skus]
 * @property {() => void} [open_bulk_product_costs]
 * @property {() => void} [open_ml_initial_sync_modal]
 * @property {() => void} [open_ml_sync_modal]
 * @property {() => void} [open_company_edit]
 * @property {() => void} [open_profile_avatar]
 * @property {() => void} [open_profile_contact]
 */

/**
 * @param {string} actionType
 * @param {OperationalTaskActionHandlers} handlers
 */
export function executeOperationalTaskAction(actionType, handlers) {
  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_LISTING_SKUS) {
    if (import.meta.env.DEV) {
      console.info("[S7_OPERATIONAL_TASK_ACTION]", { action_type: actionType });
    }
    handlers.open_bulk_listing_skus?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_PRODUCT_COSTS) {
    if (import.meta.env.DEV) {
      console.info("[S7_OPERATIONAL_TASK_ACTION]", { action_type: actionType });
    }
    handlers.open_bulk_product_costs?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL) {
    handlers.open_ml_initial_sync_modal?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_SYNC_MODAL) {
    handlers.open_ml_sync_modal?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_COMPANY_EDIT) {
    handlers.open_company_edit?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_PROFILE_AVATAR) {
    handlers.open_company_edit?.();
    handlers.open_profile_avatar?.();
    return true;
  }

  if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_PROFILE_CONTACT) {
    handlers.open_company_edit?.();
    handlers.open_profile_contact?.();
    return true;
  }

  if (import.meta.env.DEV) {
    console.warn("[S7_OPERATIONAL_TASK_ACTION] unknown_action", { action_type: actionType });
  }
  return false;
}
