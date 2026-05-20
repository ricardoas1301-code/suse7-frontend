// ======================================================
// Linha financeira padronizada — label + detalhe % + valor.
// ======================================================

import { DASH } from "./saleRayxFormat";

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   percentDetail?: string | null;
 *   lineClass?: string;
 *   strongClass?: string;
 *   labelClass?: string;
 * }} props
 */
export default function SaleRayXFinancialLine({
  label,
  value,
  percentDetail = null,
  lineClass = "",
  strongClass = "",
  labelClass = "",
}) {
  const empty = value === DASH;

  return (
    <div
      className={["vendas-sale-rayx__fin-line", "anuncios-sell-popover__line", lineClass].filter(Boolean).join(" ")}
    >
      <div className="vendas-sale-rayx__fin-line-label">
        <span className={labelClass || undefined}>{label}</span>
        {percentDetail ? <span className="vendas-sale-rayx__fin-line-detail">{percentDetail}</span> : null}
      </div>
      <strong
        className={[strongClass || "", empty ? "anuncios-sell-popover__value--empty" : ""].filter(Boolean).join(" ") || undefined}
      >
        {value}
      </strong>
    </div>
  );
}
