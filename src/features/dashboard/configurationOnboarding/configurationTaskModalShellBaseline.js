/** Baseline visual — content-adaptive (01D.1). Bulk modals permanecem referência de linguagem, não de tamanho fixo. */
export const CONFIGURATION_TASK_MODAL_SHELL_BASELINE = {
  layout: "CONTENT_ADAPTIVE",
  compactMaxWidth: "min(280px, calc(100vw - 32px))",
  mediumMaxWidth: "min(480px, calc(100vw - 32px))",
  formMaxWidth: "min(540px, calc(100vw - 32px))",
  maxHeight: "min(92dvh, 640px)",
  overlayZIndex: "var(--s7-z-modal-top, 210500)",
  anchorGap: "var(--s7-configuration-task-modal-gap, 12px)",
  borderRadius: "18px",
  closeButtonVisible: false,
  cancelButtonVisible: false,
  escapeCloses: true,
};
