/** @typedef {"info" | "sucesso" | "alerta" | "erro" | "destrutivo" | "executando"} DevCenterTipoFeedbackOperacional */

/**
 * @typedef {{
 *   tipo: DevCenterTipoFeedbackOperacional;
 *   titulo: string;
 *   descricao: string;
 *   rotuloAcao?: string;
 *   acao?: (() => void) | null;
 *   bloqueiaInteracao?: boolean;
 * }} DevCenterFeedbackOperacional
 */

/** @type {Record<DevCenterTipoFeedbackOperacional, string>} */
export const DEV_CENTER_FEEDBACK_OPERACIONAL_LABELS = Object.freeze({
  info: "Informação",
  sucesso: "Sucesso",
  alerta: "Alerta",
  erro: "Erro",
  destrutivo: "Destrutivo",
  executando: "Executando",
});

/**
 * @param {DevCenterTipoFeedbackOperacional | string | null | undefined} tipo
 */
export function rotuloFeedbackOperacional(tipo) {
  const chave = String(tipo ?? "").trim();
  return (
    DEV_CENTER_FEEDBACK_OPERACIONAL_LABELS[/** @type {DevCenterTipoFeedbackOperacional} */ (chave)] ??
    "Feedback"
  );
}

/**
 * @param {DevCenterTipoFeedbackOperacional | string | null | undefined} tipo
 */
export function classeCssFeedbackOperacional(tipo) {
  const chave = Object.keys(DEV_CENTER_FEEDBACK_OPERACIONAL_LABELS).includes(String(tipo))
    ? tipo
    : "info";
  return `dc-operacional-feedback dc-operacional-feedback--${chave}`;
}

/**
 * @param {Partial<DevCenterFeedbackOperacional> | null | undefined} input
 * @returns {DevCenterFeedbackOperacional | null}
 */
export function normalizarFeedbackOperacional(input) {
  if (!input || typeof input !== "object") return null;

  const tipoBruto = input.tipo ?? input.type ?? "info";
  const tipo = String(tipoBruto).trim();
  const titulo = String(input.titulo ?? input.title ?? "").trim();
  const descricao = String(input.descricao ?? input.description ?? "").trim();

  if (!Object.keys(DEV_CENTER_FEEDBACK_OPERACIONAL_LABELS).includes(tipo)) return null;
  if (!titulo || !descricao) return null;

  const rotuloAcao = input.rotuloAcao != null ? String(input.rotuloAcao ?? input.actionLabel ?? "").trim() : "";
  const acao = typeof input.acao === "function" ? input.acao : typeof input.action === "function" ? input.action : null;

  return {
    tipo: /** @type {DevCenterTipoFeedbackOperacional} */ (tipo),
    titulo,
    descricao,
    rotuloAcao: rotuloAcao || undefined,
    acao: rotuloAcao && acao ? acao : undefined,
    bloqueiaInteracao: Boolean(input.bloqueiaInteracao),
  };
}
