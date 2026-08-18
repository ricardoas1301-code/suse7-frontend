// =============================================================================
// Posicionamento do menu do perfil ancorado ao header (S1.PERFIL-NOTIF.4)
// =============================================================================

/**
 * @param {HTMLElement | null} triggerEl
 * @returns {{ top: number; right: number; maxHeight: number } | null}
 */
export function computeAvatarMenuAnchorPosition(triggerEl) {
  if (!(triggerEl instanceof HTMLElement)) return null;

  const navbar = document.querySelector(".navbar-premium");
  if (!(navbar instanceof HTMLElement)) return null;

  const navRect = navbar.getBoundingClientRect();
  const triggerRect = triggerEl.getBoundingClientRect();

  return {
    top: navRect.bottom,
    right: Math.max(12, window.innerWidth - triggerRect.right),
    maxHeight: Math.max(240, window.innerHeight - navRect.bottom - 8),
  };
}
