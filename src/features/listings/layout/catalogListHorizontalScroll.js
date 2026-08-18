/**
 * Sync horizontal entre cabeçalho/corpo split (List Sticky Chrome S7 — grades).
 */

/**
 * @param {Element} pageContent
 * @param {Element} tableBlockEl
 * @returns {() => void}
 */
export function bindCatalogListHorizontalScroll(pageContent, tableBlockEl) {
  if (!pageContent || !tableBlockEl) {
    return () => {};
  }

  if (!window.matchMedia("(min-width: 769px)").matches) {
    return () => {};
  }

  const headHscroll = tableBlockEl.querySelector(".products-catalog__table-hscroll--head");
  const bodyHscroll = tableBlockEl.querySelector(".products-catalog__table-hscroll--body");

  if (!headHscroll || !bodyHscroll) {
    return () => {};
  }

  let hscrollLock = false;

  const syncHorizontalScroll = (source, target) => {
    if (hscrollLock) return;
    hscrollLock = true;
    target.scrollLeft = source.scrollLeft;
    hscrollLock = false;
  };

  const onHeadHscroll = () => syncHorizontalScroll(headHscroll, bodyHscroll);
  const onBodyHscroll = () => syncHorizontalScroll(bodyHscroll, headHscroll);

  headHscroll.addEventListener("scroll", onHeadHscroll, { passive: true });
  bodyHscroll.addEventListener("scroll", onBodyHscroll, { passive: true });

  return () => {
    headHscroll.removeEventListener("scroll", onHeadHscroll);
    bodyHscroll.removeEventListener("scroll", onBodyHscroll);
  };
}
