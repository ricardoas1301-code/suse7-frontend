// ======================================================================
// Rotas — Central de Tarefas Operacionais (shell autenticado global)
// ======================================================================

/** Rotas públicas / externas — card ausente (Layout não monta o host). */
export const OPERATIONAL_TASKS_PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/cadastro",
  "/planos",
  "/termos",
  "/privacidade",
  "/forgot-password",
  "/reset-password",
  "/ml/connect",
  "/ml/callback",
];

/** Rotas autenticadas explicitamente excluídas. */
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
 * Dentro do Layout autenticado o card é global.
 * Mantém denylist para testes/contrato e superfícies públicas fora do shell.
 * @param {string} pathname
 * @returns {boolean}
 */
export function shouldShowOperationalTasks(pathname) {
  const path = normalizeOperationalTasksPathname(pathname);

  if (
    OPERATIONAL_TASKS_PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  if (OPERATIONAL_TASKS_EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  return true;
}

/** @deprecated allowlist legado — preferir denylist global. */
export const OPERATIONAL_TASKS_ENABLED_ROUTE_PREFIXES = [
  "/",
  "/vendas",
  "/precificacoes",
  "/anuncios",
  "/produtos",
  "/concorrencia",
  "/clientes",
  "/relatorios",
  "/registros",
  "/perfil",
  "/notificacoes",
  "/faturas",
];
