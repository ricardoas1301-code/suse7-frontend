/**
 * Casca compartilhada da grade de listagens: barra bulk, card, scroll horizontal, corpo e rodapé.
 * Mantém marcação e classes do catálogo existente (`Anuncios.css`) para não duplicar CSS estrutural.
 */

/**
 * @param {{
 *   bulkSelectionBar?: import("react").ReactNode;
 *   tableHead: import("react").ReactNode;
 *   tableBody: import("react").ReactNode;
 *   paginationFooter: import("react").ReactNode;
 * }} props
 */
export function ListingsTable({ bulkSelectionBar = null, tableHead, tableBody, paginationFooter }) {
  return (
    <div className="products-catalog__table-block">
      {bulkSelectionBar}
      <div className="products-catalog__table-card">
        <div className="products-catalog__table-hscroll">
          {tableHead}
          <div className="products-catalog__body">{tableBody}</div>
        </div>
      </div>
      {paginationFooter}
    </div>
  );
}
