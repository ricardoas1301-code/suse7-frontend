import { OPERATIONAL_TASK_ACTION_TYPES } from "./operationalTaskTypes.js";

const listeners = new Set();
const ALLOWED_ACTIONS = new Set(Object.values(OPERATIONAL_TASK_ACTION_TYPES));

export function requestOperationalTaskAction(actionType) {
  if (!ALLOWED_ACTIONS.has(actionType)) return false;
  for (const listener of listeners) listener(actionType);
  return true;
}

export function subscribeOperationalTaskActions(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestOpenBulkListingSkus() {
  return requestOperationalTaskAction(OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_LISTING_SKUS);
}
