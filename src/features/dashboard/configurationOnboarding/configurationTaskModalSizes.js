/** Dimensões content-adaptive — modais da Configuração Inicial (01D.1). */
export const CONFIGURATION_TASK_MODAL_SIZE = /** @type {const} */ ({
  COMPACT: "compact",
  MEDIUM: "medium",
  FORM: "form",
  WIDE: "wide",
});

/** @type {Record<string, { maxWidth: string; description: string }>} */
export const CONFIGURATION_TASK_MODAL_SIZE_CONTRACT = {
  [CONFIGURATION_TASK_MODAL_SIZE.COMPACT]: {
    maxWidth: "min(280px, calc(100vw - 32px))",
    description: "M3/M4 — campo percentual único",
  },
  [CONFIGURATION_TASK_MODAL_SIZE.MEDIUM]: {
    maxWidth: "min(480px, calc(100vw - 32px))",
    description: "M5 — horário + dias",
  },
  [CONFIGURATION_TASK_MODAL_SIZE.FORM]: {
    maxWidth: "min(540px, calc(100vw - 32px))",
    description: "M1 — dados da empresa",
  },
  [CONFIGURATION_TASK_MODAL_SIZE.WIDE]: {
    maxWidth: "min(720px, calc(100vw - 32px))",
    description: "M6 — pré-confirmação Mercado Livre (copy + integração visual)",
  },
};
