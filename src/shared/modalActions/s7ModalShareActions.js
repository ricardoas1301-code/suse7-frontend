// ======================================================================
// Catálogo global — ações de compartilhamento/exportação em modais S7.
// Ordem oficial: WhatsApp · E-mail · Copiar · Imprimir · CSV
// ======================================================================

/** @typedef {'whatsapp' | 'email' | 'copy' | 'print' | 'csv'} S7ModalShareActionId */

/** @type {readonly S7ModalShareActionId[]} */
export const S7_MODAL_SHARE_ACTION_ORDER = ["whatsapp", "email", "copy", "print", "csv"];

/** @type {Record<S7ModalShareActionId, string>} */
export const S7_MODAL_SHARE_ACTION_LABELS = {
  whatsapp: "Enviar por WhatsApp",
  email: "Enviar por E-mail",
  copy: "Copiar resumo",
  print: "Imprimir",
  csv: "Exportar CSV",
};
