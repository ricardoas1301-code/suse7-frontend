/**
 * S1.4D — offset sticky do cabeçalho de listas abaixo do card de filtros.
 * Escopo visual: mantém o thead/grid--head colado abaixo de .s7-sticky-filters ao rolar.
 */

function readFilterStickyTopPx(scrollRoot, cardEl) {
  const fromRoot = readCssLengthPx(scrollRoot, "--s7-sticky-filters-top", Number.NaN);
  if (Number.isFinite(fromRoot)) return fromRoot;
  const top = Number.parseFloat(window.getComputedStyle(cardEl).top);
  return Number.isFinite(top) ? top : 0;
}

function readCssLengthPx(el, varName, fallbackPx) {
  const raw = window.getComputedStyle(el).getPropertyValue(varName).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallbackPx;
}

function resetStickyTop(scrollRoot) {
  scrollRoot.style.setProperty("--s7-list-table-head-sticky-top", "0px");
  scrollRoot.querySelector(".vendas-page")?.style.removeProperty("--s7-list-table-head-sticky-top");
  scrollRoot.querySelector(".concorrencia-catalog")?.style.removeProperty("--s7-list-table-head-sticky-top");
}

function resolveFilterCard(scrollRoot) {
  return (
    scrollRoot.querySelector(".vendas-filters-card.s7-sticky-filters") ||
    scrollRoot.querySelector(".concorrencia-filters-card.s7-sticky-filters") ||
    scrollRoot.querySelector(".anuncios-catalog__filters.s7-sticky-filters") ||
    scrollRoot.querySelector(".products-catalog__controls.s7-sticky-filters") ||
    scrollRoot.querySelector(".s7-sticky-filters")
  );
}

/**
 * @param {Element} scrollRoot
 * @param {Element} cardEl
 * @returns {() => void} cleanup
 */
export function bindListTableHeadStickyToFilter(scrollRoot, cardEl) {
  if (!scrollRoot || !cardEl) {
    return () => {};
  }

  let rafId = 0;

  const applyOffset = (offsetPx) => {
    const value = `${Math.max(0, Math.ceil(offsetPx))}px`;
    scrollRoot.style.setProperty("--s7-list-table-head-sticky-top", value);
    scrollRoot.querySelector(".vendas-page")?.style.setProperty("--s7-list-table-head-sticky-top", value);
    scrollRoot.querySelector(".concorrencia-catalog")?.style.setProperty("--s7-list-table-head-sticky-top", value);
  };

  const sync = () => {
    const rootRect = scrollRoot.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const rootTop = rootRect.top;
    const stickyTop = readFilterStickyTopPx(scrollRoot, cardEl);
    const isFilterStuck = cardRect.top <= rootTop + stickyTop + 1;
    const marginBottom = Number.parseFloat(window.getComputedStyle(cardEl).marginBottom) || 0;
    const listGap = cardEl.classList.contains("vendas-filters-card")
      ? readCssLengthPx(scrollRoot, "--s7-vendas-filters-list-gap", marginBottom || 12)
      : cardEl.closest(".anuncios-catalog__operacao-stack")
        ? readCssLengthPx(scrollRoot, "--s7-listings-filters-list-gap", marginBottom || 12)
        : readCssLengthPx(scrollRoot, "--s7-catalog-block-gap", marginBottom || 12);

    let offset;
    if (isFilterStuck) {
      offset = stickyTop + cardRect.height + listGap;
    } else {
      offset = cardRect.bottom - rootTop + listGap;
    }

    applyOffset(offset);
  };

  const scheduleSync = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(sync);
  };

  scheduleSync();

  const resizeObserver =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleSync) : null;
  resizeObserver?.observe(cardEl);

  cardEl
    .querySelectorAll(
      ".vendas-filters-card__collapse, .concorrencia-filters-card__collapse, .anuncios-catalog__filters-panel",
    )
    .forEach((el) => resizeObserver?.observe(el));

  const mutationObserver =
    typeof MutationObserver !== "undefined" ? new MutationObserver(scheduleSync) : null;
  mutationObserver?.observe(cardEl, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });

  scrollRoot.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    scrollRoot.removeEventListener("scroll", scheduleSync);
    window.removeEventListener("resize", scheduleSync);
  };
}

function bindScrollRoot(scrollRoot) {
  if (
    scrollRoot.querySelector(".vendas-page__operacao-shell") ||
    scrollRoot.querySelector(".products-catalog__list-sticky-chrome")
  ) {
    resetStickyTop(scrollRoot);
    return () => resetStickyTop(scrollRoot);
  }

  const cardEl = resolveFilterCard(scrollRoot);
  if (!cardEl) {
    resetStickyTop(scrollRoot);
    return () => resetStickyTop(scrollRoot);
  }

  return bindListTableHeadStickyToFilter(scrollRoot, cardEl);
}

/**
 * @returns {() => void} cleanup
 */
export function mountS7ListTableHeadStickySync() {
  /** @type {Map<Element, () => void>} */
  const cleanups = new Map();
  let attachRafId = 0;

  const attachAll = () => {
    document.querySelectorAll(".page-content").forEach((scrollRoot) => {
      cleanups.get(scrollRoot)?.();
      cleanups.set(scrollRoot, bindScrollRoot(scrollRoot));
    });
  };

  const scheduleAttachAll = () => {
    if (attachRafId) cancelAnimationFrame(attachRafId);
    attachRafId = requestAnimationFrame(() => {
      attachRafId = 0;
      attachAll();
    });
  };

  attachAll();

  const domObserver =
    typeof MutationObserver !== "undefined" ? new MutationObserver(scheduleAttachAll) : null;
  document.querySelectorAll(".page-content").forEach((scrollRoot) => {
    domObserver?.observe(scrollRoot, { childList: true, subtree: true });
  });

  return () => {
    if (attachRafId) cancelAnimationFrame(attachRafId);
    domObserver?.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    cleanups.clear();
    document.querySelectorAll(".page-content").forEach((scrollRoot) => resetStickyTop(scrollRoot));
  };
}
