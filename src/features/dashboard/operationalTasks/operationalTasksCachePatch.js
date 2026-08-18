// ======================================================================
// Patch imediato do cache — Central de Tarefas (sem dependência de fetch)
// ======================================================================

import { buildMissingProductCostsDescription } from "./operationalTaskDescriptions.js";
import {
  MISSING_LISTING_SKUS_TASK_ID,
  MISSING_PRODUCT_COSTS_TASK_ID,
  OPERATIONAL_TASK_ACTION_TYPES,
  OPERATIONAL_TASK_ORDER,
  OPERATIONAL_TASK_PRIORITY,
  OPERATIONAL_TASK_STATUS,
} from "./operationalTaskTypes.js";

function taskDedupeKey(task) {
  return String(task?.dedupe_key ?? task?.id ?? task?.type ?? "");
}

export function sortOperationalTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aKey = taskDedupeKey(a);
    const bKey = taskDedupeKey(b);
    const aOrder = Number(OPERATIONAL_TASK_ORDER[aKey] ?? a?.sort_order ?? 999);
    const bOrder = Number(OPERATIONAL_TASK_ORDER[bKey] ?? b?.sort_order ?? 999);
    return aOrder - bOrder || aKey.localeCompare(bKey);
  });
}

/**
 * Patch genérico que altera apenas uma tarefa e preserva todas as demais.
 * @param {Record<string, unknown> | null} currentData
 * @param {string} dedupeKey
 * @param {Record<string, unknown> | null} replacement
 */
export function patchOperationalTaskByDedupeKey(currentData, dedupeKey, replacement) {
  const currentTasks = Array.isArray(currentData?.tasks) ? currentData.tasks : [];
  const remaining = currentTasks.filter((task) => taskDedupeKey(task) !== dedupeKey);
  const tasks = sortOperationalTasks(replacement ? [...remaining, replacement] : remaining);
  const data = { ...(currentData || {}), ok: true, tasks, total_tasks: tasks.length };
  return { data, tasks, total_tasks: tasks.length };
}

/**
 * @param {number} count
 */
export function buildMissingProductCostsTaskPayload(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return {
    id: MISSING_PRODUCT_COSTS_TASK_ID,
    type: MISSING_PRODUCT_COSTS_TASK_ID,
    title: "Custos dos produtos",
    description: buildMissingProductCostsDescription(safeCount),
    status: OPERATIONAL_TASK_STATUS.REQUIRES_ACTION,
    priority: OPERATIONAL_TASK_PRIORITY.HIGH,
    count: safeCount,
    icon: "product_costs",
    action: {
      type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_PRODUCT_COSTS,
      label: "Cadastrar custos",
    },
    scope: "products",
    dedupe_key: MISSING_PRODUCT_COSTS_TASK_ID,
    sort_order: OPERATIONAL_TASK_ORDER[MISSING_PRODUCT_COSTS_TASK_ID],
  };
}

export function buildMissingListingSkusTaskPayload(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return {
    id: MISSING_LISTING_SKUS_TASK_ID,
    type: MISSING_LISTING_SKUS_TASK_ID,
    title: "SKUs dos anúncios",
    description:
      safeCount === 1
        ? "1 anúncio aguarda cadastro ou vínculo de SKU"
        : `${safeCount.toLocaleString("pt-BR")} anúncios aguardam cadastro ou vínculo de SKU`,
    status: OPERATIONAL_TASK_STATUS.REQUIRES_ACTION,
    priority: OPERATIONAL_TASK_PRIORITY.HIGH,
    count: safeCount,
    icon: "sku",
    action: {
      type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_LISTING_SKUS,
      label: "Cadastrar SKUs",
    },
    scope: "listings",
    dedupe_key: MISSING_LISTING_SKUS_TASK_ID,
    sort_order: OPERATIONAL_TASK_ORDER[MISSING_LISTING_SKUS_TASK_ID],
  };
}

/**
 * @param {number} remainingCount
 * @returns {{ data: Record<string, unknown>; tasks: Record<string, unknown>[]; total_tasks: number }}
 */
export function buildOperationalTasksCacheFromRemainingCount(remainingCount, currentData = null) {
  const count = Math.max(0, Number(remainingCount) || 0);
  return patchOperationalTaskByDedupeKey(
    currentData,
    MISSING_PRODUCT_COSTS_TASK_ID,
    count > 0 ? buildMissingProductCostsTaskPayload(count) : null,
  );
}

export function buildOperationalTasksCacheFromPendingListingSkus(remainingCount, currentData = null) {
  const count = Math.max(0, Number(remainingCount) || 0);
  return patchOperationalTaskByDedupeKey(
    currentData,
    MISSING_LISTING_SKUS_TASK_ID,
    count > 0 ? buildMissingListingSkusTaskPayload(count) : null,
  );
}
