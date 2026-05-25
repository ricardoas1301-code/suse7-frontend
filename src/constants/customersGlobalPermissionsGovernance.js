// =============================================================================
// Dev Center S_4.8.3 — Governança de permissões (documentação viva)
// Motor: resolveDevCenterAccess — is_admin OR allowlist_email
// =============================================================================

/**
 * @typedef {Readonly<{
 *   profile: string;
 *   list: string;
 *   drawer: string;
 *   api: string;
 *   cache: string;
 *   expected: string;
 * }>} DevCenterPermissionRow
 */

/** @type {readonly DevCenterPermissionRow[]} */
export const DEV_CENTER_PERMISSIONS_MATRIX = Object.freeze([
  {
    profile: "Admin (is_admin=true)",
    list: "Sim",
    drawer: "Sim",
    api: "200 customers-global*",
    cache: "Sim (admin_global:{userId}:{id})",
    expected: "Acesso completo Dev Center",
  },
  {
    profile: "Allowlist (SUSE7_DEV_CENTER_ALLOWED_EMAILS)",
    list: "Sim",
    drawer: "Sim",
    api: "200 customers-global*",
    cache: "Sim",
    expected: "Mesmo gate que admin via e-mail",
  },
  {
    profile: "Seller (sem admin/allowlist)",
    list: "Não",
    drawer: "Não",
    api: "403 FORBIDDEN",
    cache: "Não",
    expected: "Redirect / — sem render parcial",
  },
  {
    profile: "Sem JWT",
    list: "Não",
    drawer: "Não",
    api: "401 UNAUTHORIZED (exceto bootstrap → allowed:false)",
    cache: "Não",
    expected: "Gate bloqueia antes de fetch",
  },
  {
    profile: "JWT inválido / expirado",
    list: "Não",
    drawer: "Não",
    api: "401 UNAUTHORIZED",
    cache: "Não",
    expected: "Token rejeitado em auth.getUser",
  },
  {
    profile: "Usuário sem perfil / inexistente",
    list: "Não",
    drawer: "Não",
    api: "401 ou 403 conforme token",
    cache: "Não",
    expected: "Sem caminho implícito",
  },
  {
    profile: "Admin removido (is_admin=false, fora allowlist)",
    list: "Não",
    drawer: "Não",
    api: "403 FORBIDDEN",
    cache: "Limpo na negação",
    expected: "Próximo bootstrap nega",
  },
]);

/** Respostas HTTP por cenário — backend fonte de verdade */
export const DEV_CENTER_AUTH_HTTP_MATRIX = Object.freeze({
  no_token_bootstrap: { status: 200, allowed: false },
  no_token_api: { status: 401, code: "UNAUTHORIZED" },
  invalid_token_api: { status: 401, code: "UNAUTHORIZED" },
  seller_global_list: { status: 403, code: "FORBIDDEN" },
  seller_global_detail: { status: 403, code: "FORBIDDEN" },
  admin_global_list: { status: 200 },
  admin_not_found_customer: { status: 404, code: "NOT_FOUND" },
});

/** Cache não substitui autorização — só acelera UI já autorizada */
export const DEV_CENTER_CACHE_PERMISSION_POLICY = Object.freeze({
  bindsToUserId: true,
  clearedOnDeny: true,
  clearedOnUserSwitch: true,
  neverGrantsAccess: true,
  scope: "admin_global",
});
