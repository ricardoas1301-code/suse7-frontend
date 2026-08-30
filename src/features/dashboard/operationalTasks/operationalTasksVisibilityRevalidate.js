// ======================================================================
// Revalidação OT ao recuperar foco/visibilidade (pós-OAuth Hosted → Local)
// ======================================================================
// Um único caminho compartilhado: limpa cache + dispara invalidate event.
// Sem polling, sem timer por conta, sem N+1, sem reload de página.
// ======================================================================

/** Coalesce visibilitychange + focus + pageshow no mesmo retorno à aba. */
export const OPERATIONAL_TASKS_VISIBILITY_REVALIDATE_COOLDOWN_MS = 1500;

/**
 * @param {{
 *   effectivelyEnabled?: boolean;
 *   eventType?: string;
 *   visibilityState?: string | null;
 * }} params
 * @returns {boolean}
 */
export function deveRevalidarOperationalTasksPorVisibilidade({
  effectivelyEnabled = true,
  eventType = "",
  visibilityState = null,
} = {}) {
  if (!effectivelyEnabled) return false;

  const type = String(eventType || "");

  if (type === "visibilitychange") {
    return String(visibilityState || "") === "visible";
  }

  if (type === "pageshow" || type === "focus") {
    return true;
  }

  return false;
}

/**
 * Gate com cooldown para evitar double-fetch (focus + visibilitychange).
 * @param {{
 *   cooldownMs?: number;
 *   now?: () => number;
 * }} [options]
 */
export function criarGateRevalidacaoVisibilidadeOperationalTasks(options = {}) {
  const cooldownMs =
    typeof options.cooldownMs === "number"
      ? options.cooldownMs
      : OPERATIONAL_TASKS_VISIBILITY_REVALIDATE_COOLDOWN_MS;
  const nowFn = typeof options.now === "function" ? options.now : () => Date.now();
  let lastAt = 0;

  /**
   * @param {{
   *   effectivelyEnabled?: boolean;
   *   eventType?: string;
   *   visibilityState?: string | null;
   * }} meta
   * @returns {boolean} true se deve disparar revalidação agora
   */
  function tentar(meta) {
    if (!deveRevalidarOperationalTasksPorVisibilidade(meta)) return false;
    const now = nowFn();
    if (lastAt > 0 && now - lastAt < cooldownMs) return false;
    lastAt = now;
    return true;
  }

  function resetar() {
    lastAt = 0;
  }

  return { tentar, resetar };
}

/**
 * Aplica cache stale + payload fresco (simulação unitária / contrato de painel).
 * @param {{
 *   cachedTasks?: Record<string, unknown>[];
 *   freshTasks?: Record<string, unknown>[];
 *   revalidated?: boolean;
 * }} params
 */
export function aplicarPayloadOperationalTasksAposRevalidacao({
  cachedTasks = [],
  freshTasks = [],
  revalidated = false,
} = {}) {
  if (!revalidated) {
    return {
      tasks: Array.isArray(cachedTasks) ? cachedTasks : [],
      total_tasks: Array.isArray(cachedTasks) ? cachedTasks.length : 0,
      from_cache: true,
    };
  }
  const tasks = Array.isArray(freshTasks) ? freshTasks : [];
  return {
    tasks,
    total_tasks: tasks.length,
    from_cache: false,
  };
}

/**
 * Conta e filtra tasks ml_initial_sync_* preservando marketplace_account_id.
 * @param {Record<string, unknown>[]} tasks
 */
export function resumirTasksSincronizacaoInicialMl(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const syncTasks = list.filter((t) => String(t?.type || "").startsWith("ml_initial_sync"));
  return {
    total_tasks: list.length,
    sync_task_count: syncTasks.length,
    by_account_id: Object.fromEntries(
      syncTasks.map((t) => [
        String(t.marketplace_account_id ?? ""),
        {
          id: t.id,
          type: t.type,
          action_type:
            t?.action != null && typeof t.action === "object"
              ? /** @type {Record<string, unknown>} */ (t.action).type
              : null,
          marketplace_account_id: t.marketplace_account_id ?? null,
          account_label: t.account_label ?? null,
        },
      ]),
    ),
  };
}

/**
 * Resolve account id da ação OT (uma conta por clique).
 * @param {Record<string, unknown> | null | undefined} task
 * @returns {string | null}
 */
export function resolverMarketplaceAccountIdDaTaskOperacional(task) {
  if (!task || typeof task !== "object") return null;
  const id = task.marketplace_account_id != null ? String(task.marketplace_account_id).trim() : "";
  return id || null;
}
