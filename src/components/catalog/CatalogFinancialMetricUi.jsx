/**
 * Métricas financeiras do catálogo — paridade visual com Página Produtos / Vendas.
 * UI-only: não altera cálculos SSOT.
 */

import S7Tooltip from "../ui/S7Tooltip.jsx";

/** @typedef {import("../../utils/productCatalogRow.js").CatalogProfitBand} CatalogProfitBand */

/** @param {{ children?: import("react").ReactNode }} props */
export function CatalogMetricMissing({ children = "—" }) {
  return (
    <span className="vendas-page__fin-missing" title="Sem dado informado">
      {children}
    </span>
  );
}

/** @param {{ children: import("react").ReactNode }} props */
export function CatalogMetricNumSingle({ children }) {
  return (
    <div className="vendas-page__num-stack">
      <span className="vendas-page__num-stack-primary">{children}</span>
      <span className="vendas-page__num-stack-secondary-slot" aria-hidden="true" />
    </div>
  );
}

/**
 * @param {CatalogProfitBand} band
 */
export function catalogBandToVendasFinTone(band) {
  switch (band) {
    case "healthy":
      return "vendas-page__fin--health-healthy";
    case "warn":
      return "vendas-page__fin--health-warn";
    case "loss":
      return "vendas-page__fin--health-critical";
    default:
      return "vendas-page__fin--empty";
  }
}

/** @param {string} toneClass */
export function catalogVendasFinValueClass(toneClass) {
  if (toneClass === "vendas-page__fin--health-critical") return "vendas-page__fin-value--health-critical";
  if (toneClass === "vendas-page__fin--health-warn") return "vendas-page__fin-value--health-warn";
  if (toneClass === "vendas-page__fin--health-healthy") return "vendas-page__fin-value--health-healthy";
  if (toneClass === "vendas-page__fin--empty") return "vendas-page__fin-value--empty";
  return "";
}

/** @param {{ content: string; className: string; ariaLabel: string }} props */
function CatalogProfitHealthHintBubble({ content, className, ariaLabel }) {
  return (
    <S7Tooltip content={content} placement="bottom-start" offset={6} className="catalog-profit-hint-tip">
      <span className="catalog-profit-hint-tip__anchor" aria-label={ariaLabel} tabIndex={0}>
        <span className={className} aria-hidden="true" />
      </span>
    </S7Tooltip>
  );
}

/** @param {{ toneClass: string }} props */
export function CatalogProfitHealthHint({ toneClass }) {
  if (toneClass === "vendas-page__fin--health-critical") {
    return (
      <CatalogProfitHealthHintBubble
        content="Prejuízo"
        ariaLabel="Prejuízo"
        className="vendas-page__profit-hint vendas-page__profit-hint--down"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-warn") {
    return (
      <CatalogProfitHealthHintBubble
        content="Margem crítica"
        ariaLabel="Margem crítica"
        className="vendas-page__profit-hint vendas-page__profit-hint--dot"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-healthy") {
    return (
      <CatalogProfitHealthHintBubble
        content="Saudável"
        ariaLabel="Saudável"
        className="vendas-page__profit-hint vendas-page__profit-hint--up"
      />
    );
  }
  return null;
}

/**
 * @param {{
 *   columnClass: string;
 *   dataCol?: string;
 *   variant?: "neutral" | "money" | "profit" | "margin";
 *   toneClass?: string;
 *   children: import("react").ReactNode;
 * }} props
 */
export function CatalogMetricCell({ columnClass, dataCol, variant = "neutral", toneClass = "", children }) {
  const variantClass =
    variant === "money"
      ? "vendas-page__num-cell--sale"
      : variant === "profit"
        ? "vendas-page__num-cell--profit"
        : variant === "margin"
          ? "vendas-page__num-cell--margin"
          : "";
  return (
    <div
      className={[
        "products-catalog__cell",
        columnClass,
        "products-catalog__cell--metric-vendas",
        "vendas-page__num-cell",
        variantClass,
        toneClass,
      ]
        .filter(Boolean)
        .join(" ")}
      data-col={dataCol}
    >
      {children}
    </div>
  );
}

/** @param {number | null | undefined} marginPct */
export function formatCatalogPctVendasStyle(marginPct) {
  if (marginPct == null || !Number.isFinite(marginPct)) return null;
  return `${marginPct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** @param {string} display */
export function renderCatalogMoneyDisplay(display) {
  if (display === "—") return <CatalogMetricMissing />;
  return display;
}
