/** @typedef {import("./devCenterOperationalConfirmModel").DevCenterAcaoConfirmacaoPendente} DevCenterAcaoConfirmacaoPendente */

/** @type {((acao: DevCenterAcaoConfirmacaoPendente) => void) | null} */
let toolboxDoubleConfirmHandler = null;

/**
 * @param {(acao: DevCenterAcaoConfirmacaoPendente) => void | null} handler
 */
export function registerToolboxDoubleConfirmHandler(handler) {
  toolboxDoubleConfirmHandler = handler;
}

export function unregisterToolboxDoubleConfirmHandler() {
  toolboxDoubleConfirmHandler = null;
}

/**
 * @param {DevCenterAcaoConfirmacaoPendente} acao
 */
export function resolveToolboxDoubleConfirm(acao) {
  const pending = acao.metadados?.__toolboxPendingConfirm;
  if (!pending || typeof pending !== "object") return false;
  toolboxDoubleConfirmHandler?.(acao);
  return true;
}
