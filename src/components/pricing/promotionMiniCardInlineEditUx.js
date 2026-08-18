// ======================================================
// PI — Normalização visual do draft inline (sem alterar regra financeira).
// ======================================================

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizarDraftNumericoPrecoExibicao(raw) {
  return String(raw ?? "")
    .replace(/[R$r$\s]/g, "")
    .replace(/[^\d,.-]/g, "");
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizarDraftPercentualExibicao(raw) {
  return String(raw ?? "")
    .replace(/%/g, "")
    .replace(/[^\d,.-]/g, "")
    .trim();
}

/**
 * @param {unknown} displayText
 * @returns {string}
 */
export function extrairNumericoDePrecoExibicao(displayText) {
  const bruto = normalizarDraftNumericoPrecoExibicao(displayText);
  return bruto;
}

/**
 * @param {unknown} displayText
 * @returns {string}
 */
export function extrairNumericoDePercentualExibicao(displayText) {
  const match = String(displayText ?? "").match(/([\d,]+)\s*%/);
  if (match?.[1]) return match[1];
  return normalizarDraftPercentualExibicao(displayText);
}

/**
 * @param {string} draft
 * @returns {string}
 */
export function calcularLarguraInputCh(draft) {
  const len = Math.max(String(draft ?? "").length, 4);
  return `${Math.min(len + 1, 14)}ch`;
}

const SELETOR_RAIZ_EDITOR =
  ".pricing-intelligence-page__promotion-mini-card-inline-field";
const SELETOR_PORTAL_TOOLTIP = ".s7-tooltip-portal-root, .s7-tooltip-portal__bubble";

/**
 * Detecta se o pointer ocorreu dentro da área interna do editor inline (inclui portal S7Tooltip).
 * @param {Event} event
 * @param {HTMLElement | null | undefined} editorRoot
 * @returns {boolean}
 */
export function eventoPointerDentroAreaEditorInline(event, editorRoot) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];

  for (const node of path) {
    if (node == null || typeof node !== "object") continue;
    if (editorRoot != null && typeof editorRoot.contains === "function" && editorRoot.contains(node)) {
      return true;
    }
    if (typeof Element !== "undefined" && node instanceof Element) {
      if (node.closest?.(SELETOR_RAIZ_EDITOR)) return true;
      if (node.closest?.(SELETOR_PORTAL_TOOLTIP)) return true;
    }
  }

  return (
    event.target != null &&
    editorRoot != null &&
    typeof editorRoot.contains === "function" &&
    editorRoot.contains(event.target)
  );
}
