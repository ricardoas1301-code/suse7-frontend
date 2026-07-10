/**
 * Casca compartilhada da grade de listagens — List Sticky Chrome S7.
 * Busca/filtros + cabeçalho laranja no bloco sticky; corpo e paginação no fluxo.
 */

import { useEffect, useRef } from "react";
import { bindCatalogListHorizontalScroll } from "../layout/catalogListHorizontalScroll.js";

/**
 * @param {{
 *   stickyFilters?: import("react").ReactNode;
 *   bulkSelectionBar?: import("react").ReactNode;
 *   listOperationalPrefix?: import("react").ReactNode;
 *   tableHead: import("react").ReactNode;
 *   tableBody?: import("react").ReactNode | null;
 *   paginationFooter?: import("react").ReactNode | null;
 * }} props
 */
export function ListingsTable({
  stickyFilters = null,
  bulkSelectionBar = null,
  listOperationalPrefix = null,
  tableHead,
  tableBody = null,
  paginationFooter = null,
}) {
  const tableBlockRef = useRef(null);

  useEffect(() => {
    const pageContent = tableBlockRef.current?.closest(".page-content");
    if (!pageContent || !tableBlockRef.current) {
      return undefined;
    }
    return bindCatalogListHorizontalScroll(pageContent, tableBlockRef.current);
  }, [tableBody, tableHead]);

  return (
    <div ref={tableBlockRef} className="products-catalog__table-block">
      <div className="products-catalog__list-sticky-chrome" aria-label="Busca, filtros e cabeçalho da lista">
        <div className="products-catalog__sticky-top-spacer" aria-hidden="true" />
        {stickyFilters}
        <div className="products-catalog__list-header-slot">
          <div className="products-catalog__table-hscroll products-catalog__table-hscroll--head">
            {tableHead}
          </div>
        </div>
      </div>

      <div className="products-catalog__list-operational">
        {listOperationalPrefix}
        {bulkSelectionBar}
        {tableBody != null ? (
          <div className="products-catalog__table-card products-catalog__table-card--scroll-viewport">
            <div className="products-catalog__table-hscroll products-catalog__table-hscroll--body">
              <div className="products-catalog__body">{tableBody}</div>
            </div>
          </div>
        ) : null}
      </div>

      {paginationFooter}
    </div>
  );
}
