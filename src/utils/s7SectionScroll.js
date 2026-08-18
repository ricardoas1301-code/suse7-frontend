// ======================================================================
// Scroll suave entre blocos executivo ↔ busca/lista (páginas operacionais S7).
// Scrollport oficial: .page-content (Layout).
// ======================================================================

/**
 * @param {Element | null | undefined} fromElement
 * @returns {HTMLElement | null}
 */
export function getS7PageScrollRoot(fromElement = null) {
  if (fromElement instanceof Element) {
    const closest = fromElement.closest(".page-content");
    if (closest instanceof HTMLElement) return closest;
  }
  const root = document.querySelector(".page-content");
  return root instanceof HTMLElement ? root : null;
}

/**
 * Offset útil abaixo da navbar + respiro homologado (--s7-page-rhythm).
 *
 * @param {HTMLElement | null | undefined} scrollRoot
 */
export function getS7SectionScrollOffset(scrollRoot = null) {
  const root = scrollRoot ?? getS7PageScrollRoot();
  const rootStyles = root ? getComputedStyle(root) : null;
  const paddingTop = rootStyles ? parseFloat(rootStyles.paddingTop) || 0 : 8;

  let rhythm = 12;
  if (root) {
    const rhythmRaw = getComputedStyle(root).getPropertyValue("--s7-page-rhythm").trim();
    if (rhythmRaw) {
      const parsed = parseFloat(rhythmRaw);
      if (Number.isFinite(parsed)) rhythm = parsed;
    }
  }

  return paddingTop + rhythm;
}

/** Seletores do bloco pai sticky (Busca e filtros + thead). */
const S7_LIST_STICKY_CHROME_SELECTOR =
  ".vendas-page__list-sticky-chrome, .products-catalog__list-sticky-chrome";

/**
 * Destino de scroll para busca/lista: sobe até o chrome sticky (inclui spacer estrutural).
 *
 * @param {Element | null | undefined} targetElement
 */
export function resolveS7ListStickyChromeTarget(targetElement) {
  if (!(targetElement instanceof Element)) return targetElement;
  const chrome = targetElement.closest(S7_LIST_STICKY_CHROME_SELECTOR);
  return chrome instanceof Element ? chrome : targetElement;
}

/**
 * Offset ao ir para busca/lista — zero externo: o card encosta no menu;
 * o respiro de 12px vem só do spacer interno (.vendas-page__sticky-top-spacer / homólogo).
 *
 * @param {HTMLElement | null | undefined} _scrollRoot
 */
export function getS7ListSectionScrollOffset(_scrollRoot = null) {
  return 0;
}

/**
 * @param {Element | null | undefined} targetElement
 * @param {HTMLElement | null | undefined} scrollRoot
 */
export function getS7SectionScrollOffsetForTarget(targetElement, scrollRoot = null) {
  const root = scrollRoot ?? getS7PageScrollRoot(targetElement);
  const resolved = resolveS7ListStickyChromeTarget(targetElement);
  const isListChrome =
    resolved instanceof Element && resolved.matches(S7_LIST_STICKY_CHROME_SELECTOR);

  return isListChrome ? getS7ListSectionScrollOffset(root) : getS7SectionScrollOffset(root);
}

/**
 * @param {Element | null | undefined} targetElement
 * @param {{
 *   scrollRoot?: HTMLElement | null;
 *   offset?: number;
 *   extraOffset?: number;
 *   behavior?: ScrollBehavior;
 * }} [options]
 */
export function scrollToSectionElement(targetElement, options = {}) {
  if (!(targetElement instanceof Element)) return;

  const scrollRoot = options.scrollRoot ?? getS7PageScrollRoot(targetElement);
  const scrollTarget = resolveS7ListStickyChromeTarget(targetElement);
  const offset =
    (options.offset ?? getS7SectionScrollOffsetForTarget(targetElement, scrollRoot)) +
    (options.extraOffset ?? 0);
  const behavior = options.behavior ?? "smooth";

  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = scrollTarget.getBoundingClientRect();
    const top = targetRect.top - rootRect.top + scrollRoot.scrollTop - offset;
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior });
    return;
  }

  const top = scrollTarget.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}
