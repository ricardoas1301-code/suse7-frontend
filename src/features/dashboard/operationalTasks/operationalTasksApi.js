// ======================================================================
// API — GET /api/dashboard/operational-tasks
// Cache curto + single-flight + patch imediato após save de custos
// ======================================================================

import { buildApiUrl, apiFetch } from "../../../config/api";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService";
import {
  buildOperationalTasksCacheFromPendingListingSkus,
  buildOperationalTasksCacheFromRemainingCount,
  sortOperationalTasks,
} from "./operationalTasksCachePatch.js";
import {
  MISSING_LISTING_SKUS_TASK_ID,
  MISSING_PRODUCT_COSTS_TASK_ID,
} from "./operationalTaskTypes.js";

const OPERATIONAL_TASKS_TTL_MS = 45_000;
export const OPERATIONAL_TASKS_INVALIDATE_EVENT = "suse7:operational-tasks:invalidate";

/** @type {Promise<unknown>} */
let operationalTasksFetchChain = Promise.resolve();

/** @type {{ data: Record<string, unknown> | null; fetchedAt: number }} */
let operationalTasksCache = { data: null, fetchedAt: 0 };

/**
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
export function runOperationalTasksFetchSerialized(task) {
  const next = operationalTasksFetchChain.then(task, task);
  operationalTasksFetchChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/**
 * Atualiza cache compartilhado com contagem canônica conhecida (pós-save).
 * @param {number} remainingCount
 * @returns {{ tasks: Record<string, unknown>[]; total_tasks: number }}
 */
export function patchMissingProductCostsTaskCount(remainingCount) {
  const patched = buildOperationalTasksCacheFromRemainingCount(
    remainingCount,
    operationalTasksCache.data,
  );
  operationalTasksCache = { data: patched.data, fetchedAt: Date.now() };
  return { tasks: patched.tasks, total_tasks: patched.total_tasks };
}

export function patchMissingListingSkusTaskCount(remainingCount) {
  const patched = buildOperationalTasksCacheFromPendingListingSkus(
    remainingCount,
    operationalTasksCache.data,
  );
  operationalTasksCache = { data: patched.data, fetchedAt: Date.now() };
  return { tasks: patched.tasks, total_tasks: patched.total_tasks };
}

/**
 * @param {Record<string, unknown>} [detail]
 */
export function invalidateOperationalTasksCache(detail) {
  operationalTasksCache = { data: null, fetchedAt: 0 };
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OPERATIONAL_TASKS_INVALIDATE_EVENT, {
        detail: { ...(detail || {}), force_revalidate: detail?.force_revalidate !== false },
      })
    );
  }
}

/**
 * Propaga contagem confirmada pelo endpoint pending + agenda revalidação autoritativa.
 * @param {{ remainingCount: number }} params
 */
export function notifyProductCostsSaved({ remainingCount }) {
  const patched = patchMissingProductCostsTaskCount(remainingCount);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OPERATIONAL_TASKS_INVALIDATE_EVENT, {
        detail: {
          reason: "product_costs_saved",
          task_type: MISSING_PRODUCT_COSTS_TASK_ID,
          remaining_count: Math.max(0, Number(remainingCount) || 0),
          force_revalidate: true,
          patched,
        },
      })
    );
  }

  if (import.meta.env.DEV) {
    console.info("[S7_OPERATIONAL_TASKS_PATCH]", {
      remaining_count: remainingCount,
      total_tasks: patched.total_tasks,
    });
  }

  return patched;
}

export function notifyListingSkusSaved({ remainingCount }) {
  const patched = patchMissingListingSkusTaskCount(remainingCount);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OPERATIONAL_TASKS_INVALIDATE_EVENT, {
        detail: {
          reason: "listing_skus_saved",
          task_type: MISSING_LISTING_SKUS_TASK_ID,
          remaining_count: Math.max(0, Number(remainingCount) || 0),
          force_revalidate: true,
          patched,
        },
      }),
    );
  }
  return patched;
}

/**
 * @param {{ force?: boolean }} [options]
 */
export async function fetchOperationalTasks(options = {}) {
  const { force = false } = options;
  const now = Date.now();

  if (
    !force &&
    operationalTasksCache.data &&
    now - operationalTasksCache.fetchedAt < OPERATIONAL_TASKS_TTL_MS
  ) {
    const data = operationalTasksCache.data;
    return {
      ok: true,
      data,
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      total_tasks: Number(data.total_tasks) || 0,
      fromCache: true,
    };
  }

  const base = buildApiUrl("/api/dashboard/operational-tasks");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", tasks: [], total_tasks: 0 };
  }

  return runOperationalTasksFetchSerialized(async () => {
    await ensureAuthSessionBootstrapped();

    let res = await apiFetch(base, { method: "GET" });
    const shouldRetry =
      !res.ok && (res.status === 401 || res.status === 0 || Boolean(res.connectionError));
    if (shouldRetry) {
      await ensureAuthSessionBootstrapped();
      res = await apiFetch(base, { method: "GET" });
    }

    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof res.error === "string"
            ? res.error
            : res.data?.error || "Não foi possível carregar pendências da operação.",
        tasks: [],
        total_tasks: 0,
      };
    }

    const rawData = res.data && typeof res.data === "object" ? res.data : {};
    const tasks = sortOperationalTasks(Array.isArray(rawData.tasks) ? rawData.tasks : []);
    const data = { ...rawData, tasks, total_tasks: tasks.length };
    operationalTasksCache = { data, fetchedAt: Date.now() };

    return {
      ok: true,
      data,
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      total_tasks: Number(data.total_tasks) || 0,
      fromCache: false,
    };
  });
}
