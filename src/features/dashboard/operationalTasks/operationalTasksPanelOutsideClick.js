/**
 * Indica se um evento de ponteiro ocorreu fora do container do painel operacional.
 *
 * @param {HTMLElement | null} root
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
export function cliqueForaPainelOperacional(root, target) {
  if (!root) return false;
  if (target == null || typeof target !== "object" || !("nodeType" in target)) return false;
  return !root.contains(/** @type {Node} */ (target));
}
