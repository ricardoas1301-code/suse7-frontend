/**
 * Vendas — sync horizontal entre thead/corpo (tabelas split).
 * Rolagem vertical: somente .page-content (contrato S7).
 * Sticky: bloco único .vendas-page__list-sticky-chrome (List Sticky Chrome S7).
 * Respiro superior: .vendas-page__sticky-top-spacer (12px estrutural).
 * Sticky top negativo compensa padding-top da .page-content (chrome flush no menu).
 */

/**
 * @param {Element} pageContent
 * @param {Element} bodyScrollEl
 * @returns {() => void}
 */
export function bindVendasListHorizontalScroll(pageContent, bodyScrollEl) {
  if (!pageContent || !bodyScrollEl) {
    return () => {};
  }

  if (!window.matchMedia("(min-width: 769px)").matches) {
    return () => {};
  }

  const theadSlot = pageContent.querySelector(".vendas-page__table-thead-slot");
  const theadHscroll = theadSlot?.querySelector(".vendas-page__table-hscroll") ?? null;
  const bodyHscroll = bodyScrollEl.querySelector(".vendas-page__table-hscroll") ?? null;

  if (!theadHscroll || !bodyHscroll) {
    return () => {};
  }

  let hscrollLock = false;

  const syncHorizontalScroll = (source, target) => {
    if (hscrollLock) return;
    hscrollLock = true;
    target.scrollLeft = source.scrollLeft;
    hscrollLock = false;
  };

  const onTheadHscroll = () => syncHorizontalScroll(theadHscroll, bodyHscroll);
  const onBodyHscroll = () => syncHorizontalScroll(bodyHscroll, theadHscroll);

  theadHscroll.addEventListener("scroll", onTheadHscroll, { passive: true });
  bodyHscroll.addEventListener("scroll", onBodyHscroll, { passive: true });

  return () => {
    theadHscroll.removeEventListener("scroll", onTheadHscroll);
    bodyHscroll.removeEventListener("scroll", onBodyHscroll);
  };
}

/** @deprecated use bindVendasListHorizontalScroll */
export function bindVendasListLayout(pageContent, _filtersCard, _vendasPageEl, bodyScrollEl) {
  return bindVendasListHorizontalScroll(pageContent, bodyScrollEl);
}

/** @deprecated use bindVendasListHorizontalScroll */
export function bindVendasOperacaoShellLayout(pageContent, _shellEl, bodyScrollEl) {
  return bindVendasListHorizontalScroll(pageContent, bodyScrollEl);
}

/** @deprecated use bindVendasListHorizontalScroll */
export function bindVendasStickyStackLayout() {
  return () => {};
}
