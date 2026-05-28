const PREFIX = "[S7][DevCenterOperacional]";

/**
 * @param {
 *   | "reload_lista_iniciado"
 *   | "reload_lista_concluido"
 *   | "reload_lista_falhou"
 *   | "reload_resumo_iniciado"
 *   | "reload_resumo_concluido"
 *   | "reload_resumo_falhou"
 *   | "reload_categoria_iniciado"
 *   | "reload_categoria_concluido"
 *   | "reload_categoria_falhou"
 *   | "confirmacao_aberta"
 *   | "confirmacao_cancelada"
 *   | "confirmacao_confirmada"
 *   | "feedback_exibido"
 *   | "acao_bloqueada"
 *   evento
 * } evento
 * @param {Record<string, unknown>} [payload]
 */
export function logDevCenterOperacional(evento, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`${PREFIX} ${evento}`, payload);
}
