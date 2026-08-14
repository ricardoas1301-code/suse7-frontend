// ======================================================================
// Rotas habilitadas — Central de Tarefas Operacionais (allowlist)
// ======================================================================

/** Prefixos de rotas operacionais com Central habilitada nesta versão. */
export const OPERATIONAL_TASKS_ENABLED_ROUTE_PREFIXES = [
  "/vendas",
  "/precificacoes",
  "/anuncios",
  "/produtos",
  "/concorrencia",
];

/** Rotas explicitamente excluídas mesmo sob prefixo habilitado. */
export const OPERATIONAL_TASKS_EXCLUDED_PATH_PREFIXES = [
  "/anuncios/debug-importacao",
  "/anuncios-2",
];

/**
 * @param {string} pathname
 */
export function normalizeOperationalTasksPathname(pathname) {
  const raw = String(pathname || "/").trim();
  if (!raw || raw === "/") return "/";
  const withoutTrailing = raw.replace(/\/+$/, "") || "/";
  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`;
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function shouldShowOperationalTasks(pathname) {
  const path = normalizeOperationalTasksPathname(pathname);

  if (OPERATIONAL_TASKS_EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  if (path === "/") return true;

  return OPERATIONAL_TASKS_ENABLED_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
