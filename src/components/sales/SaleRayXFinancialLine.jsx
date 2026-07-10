// ======================================================
// Linha financeira padronizada — label + detalhe % + valor.
// ======================================================

import { DASH } from "./saleRayxFormat";

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   labelAddon?: import("react").ReactNode;
 *   percentDetail?: string | null;
 *   lineClass?: string;
 *   strongClass?: string;
 *   labelClass?: string;
 *   valueTone?: "default" | "key" | "negative" | "positive";
 *   isZeroLine?: boolean;
 * }} props
 */
export default function SaleRayXFinancialLine({
  label,
  value,
  labelAddon = null,
  percentDetail = null,
  lineClass = "",
  strongClass = "",
  labelClass = "",
  valueTone = "default",
  isZeroLine = false,
}) {
  const empty = value === DASH || isZeroLine;
  const toneClass =
    isZeroLine
      ? ""
      : valueTone === "negative"
      ? "vendas-sale-rayx__fin-value--negative"
      : valueTone === "positive"
        ? "vendas-sale-rayx__fin-value--positive"
        : valueTone === "key"
          ? "vendas-sale-rayx__fin-value--key"
          : "";

  return (
    <div
      className={["vendas-sale-rayx__fin-line", "anuncios-sell-popover__line", lineClass].filter(Boolean).join(" ")}
    >
      <div className="vendas-sale-rayx__fin-line-label">
        <span className={labelClass || undefined}>{label}</span>
        {labelAddon}
        {percentDetail ? <span className="vendas-sale-rayx__fin-line-detail">{percentDetail}</span> : null}
      </div>
      <strong
        className={[toneClass, strongClass || "", empty ? "anuncios-sell-popover__value--empty" : ""]
          .filter(Boolean)
          .join(" ") || undefined}
      >
        {value}
      </strong>
    </div>
  );
}
