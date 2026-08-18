/**
 * Consolida erros de carregamento da Central — evita cascata de caixas repetidas.
 */

const SESSION_ERROR_HINTS = [
  "token inválido",
  "token não informado",
  "sessão expirada",
  "sessão inválida",
  "unauthorized",
];

const CONNECTION_ERROR_HINTS = [
  "não foi possível conectar",
  "não foi possível validar a sessão",
  "verifique a conexão",
  "api não configurada",
  "configuração do banco indisponível",
];

/**
 * @param {string | null | undefined} message
 */
export function isCentralNotificationSessionError(message) {
  const normalized = String(message ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return SESSION_ERROR_HINTS.some((hint) => normalized.includes(hint));
}

/**
 * @param {string | null | undefined} message
 */
export function isCentralNotificationConnectionError(message) {
  const normalized = String(message ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return CONNECTION_ERROR_HINTS.some((hint) => normalized.includes(hint));
}

/**
 * @param {Array<string | null | undefined>} messages
 */
export function resolveCentralNotificationLoadError(messages) {
  const active = messages.map((m) => String(m ?? "").trim()).filter(Boolean);
  if (!active.length) return null;

  const unique = [...new Set(active)];
  if (unique.length === 1) return unique[0];

  const allSession = unique.every(isCentralNotificationSessionError);
  if (allSession) {
    return "Sessão inválida ou expirada. Entre novamente para continuar.";
  }

  const allConnection = unique.every(isCentralNotificationConnectionError);
  if (allConnection) {
    return "Não foi possível conectar ao serviço. Verifique backend e autenticação e tente novamente.";
  }

  return unique[0];
}
