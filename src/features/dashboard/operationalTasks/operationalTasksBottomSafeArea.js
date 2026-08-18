// ======================================================================
// Zona inferior segura — Central de Pendências acima de paginação/ações
// ======================================================================

/** Seletores oficiais de controles inferiores de listas. */
export const LIST_BOTTOM_CHROME_SELECTORS = [
  "[data-s7-list-bottom-chrome]",
  ".s7-pagination",
  ".vendas-page__pagination",
  ".products-catalog__pagination",
].join(", ");

/** Margem padrão do painel (espelha --s7-floating-anchor-bottom). */
export const OPERATIONAL_TASKS_BASE_BOTTOM_PX = 16;

/** Respiro entre painel e controle inferior. */
export const OPERATIONAL_TASKS_BOTTOM_SAFE_GAP_PX = 12;

/** Prefixos de rotas com listas paginadas. */
export const OPERATIONAL_TASKS_LIST_ROUTE_PREFIXES = [
  "/vendas",
  "/precificacoes",
  "/anuncios",
  "/produtos",
  "/concorrencia",
];

/**
 * @param {string} pathname
 */
export function shouldApplyListBottomSafeArea(pathname) {
  const path = String(pathname || "/");
  return OPERATIONAL_TASKS_LIST_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * @param {DOMRectReadOnly} rect
 * @param {number} viewportHeight
 */
function isRectVisibleInViewport(rect, viewportHeight) {
  return rect.bottom > 0 && rect.top < viewportHeight;
}

/**
 * Calcula offset adicional (px) para manter o painel acima da paginação visível.
 * @param {{
 *   viewportHeight: number;
 *   baseBottomPx?: number;
 *   safeGapPx?: number;
 *   chromeRects?: DOMRectReadOnly[];
 * }} params
 * @returns {number}
 */
export function resolveOperationalTasksBottomSafeAreaPx({
  viewportHeight,
  baseBottomPx = OPERATIONAL_TASKS_BASE_BOTTOM_PX,
  safeGapPx = OPERATIONAL_TASKS_BOTTOM_SAFE_GAP_PX,
  chromeRects = [],
}) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;

  let maxOffset = 0;

  for (const rect of chromeRects) {
    if (!rect || !isRectVisibleInViewport(rect, viewportHeight)) continue;

    const requiredBottom = viewportHeight - rect.top + safeGapPx;
    const offset = Math.max(0, requiredBottom - baseBottomPx);
    if (offset > maxOffset) maxOffset = offset;
  }

  return Math.round(maxOffset);
}

/**
 * @param {Document} doc
 * @param {number} viewportHeight
 */
export function measureOperationalTasksBottomSafeAreaPx(doc, viewportHeight) {
  if (typeof doc?.querySelectorAll !== "function") return 0;

  const nodes = doc.querySelectorAll(LIST_BOTTOM_CHROME_SELECTORS);
  const chromeRects = Array.from(nodes).map((node) => node.getBoundingClientRect());

  return resolveOperationalTasksBottomSafeAreaPx({
    viewportHeight,
    chromeRects,
  });
}

const CSS_VAR = "--s7-page-bottom-safe-area";

/**
 * @param {number} px
 */
export function publishOperationalTasksBottomSafeArea(px) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(CSS_VAR, `${Math.max(0, px)}px`);
}

export function resetOperationalTasksBottomSafeArea() {
  publishOperationalTasksBottomSafeArea(0);
}

/**
 * @param {{ enabled?: boolean; pathname?: string }} [options]
 * @returns {() => void}
 */
export function startOperationalTasksBottomSafeAreaWatch(options = {}) {
  const { enabled = true, pathname = "" } = options;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  if (!enabled || !shouldApplyListBottomSafeArea(pathname)) {
    resetOperationalTasksBottomSafeArea();
    return () => resetOperationalTasksBottomSafeArea();
  }

  let rafId = 0;
  let observer = null;

  const update = () => {
    rafId = 0;
    publishOperationalTasksBottomSafeArea(
      measureOperationalTasksBottomSafeAreaPx(document, window.innerHeight)
    );
  };

  const scheduleUpdate = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(update);
  };

  scheduleUpdate();

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);

  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(scheduleUpdate);
    document.querySelectorAll(LIST_BOTTOM_CHROME_SELECTORS).forEach((node) => {
      observer.observe(node);
    });

    const mutationObserver = new MutationObserver(() => {
      observer.disconnect();
      document.querySelectorAll(LIST_BOTTOM_CHROME_SELECTORS).forEach((node) => {
        observer.observe(node);
      });
      scheduleUpdate();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      observer?.disconnect();
      mutationObserver.disconnect();
      resetOperationalTasksBottomSafeArea();
    };
  }

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
    observer?.disconnect();
    resetOperationalTasksBottomSafeArea();
  };
}
