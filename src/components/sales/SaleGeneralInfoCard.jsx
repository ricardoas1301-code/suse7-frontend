// ======================================================
// Dados gerais da venda (somente leitura, sem card).
// ======================================================

import { useCallback, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import { DASH, formatDatePt, shortUuid, truncateWordsDisplay } from "./saleRayxFormat";
import { collectSaleRayxOperationalLines } from "./saleRayxOperationalFields";
import { resolveMoneyReleaseDate } from "./saleRayxMoneyRelease";
import SaleRayXOperationalActions from "./SaleRayXOperationalActions";
import SaleRayXProductHeader from "./SaleRayXProductHeader";
import SaleRayXProductPhoto from "./SaleRayXProductPhoto";
import SaleRayXAccumulatedPerformance from "./SaleRayXAccumulatedPerformance";

const COPY_FLASH_MS = 2000;
const COPY_KEY_ORDER = "raiox-order";

/**
 * @param {{
 *   value: string;
 *   copyText: string;
 *   empty: boolean;
 *   copyFlashKey: string | null;
 *   onCopy: (text: string, label: string, flashKey: string) => void;
 * }} props
 */
function CopyableValue({ value, copyText, empty, copyFlashKey, onCopy }) {
  const showCopyOk = copyFlashKey === COPY_KEY_ORDER;

  return (
    <div className="vendas-sale-rayx__copy-target anuncios-raiox-compare__toolbar-meta-block">
      <span
        className={[
          "anuncios-sell-popover__muted",
          "vendas-sale-rayx__copy-target-text",
          empty ? "anuncios-sell-popover__value--empty" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
      <button
        type="button"
        className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-raiox-compare__toolbar-copy${
          showCopyOk ? " products-catalog__copy-btn--ok" : ""
        }`}
        data-tip={showCopyOk ? "Copiado!" : "Copiar pedido e-commerce"}
        aria-label="Copiar pedido e-commerce"
        onClick={() => {
          void onCopy(copyText, "Pedido e-commerce", COPY_KEY_ORDER);
        }}
      >
        {showCopyOk ? "✓" : "⧉"}
      </button>
    </div>
  );
}

/**
 * @param {{ label: string; value: string }} props
 */
function InfoLineStack({ label, value }) {
  return (
    <div className="anuncios-sell-popover__block">
      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
        <span>{label}</span>
      </div>
      <div className="anuncios-sell-popover__muted vendas-sale-rayx__info-value-line">{value}</div>
    </div>
  );
}

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   copyText?: string | null;
 *   copyFlashKey?: string | null;
 *   onCopy?: (text: string, label: string, flashKey: string) => void;
 *   valueTitle?: string | null;
 * }} props
 */
function InfoLine({ label, value, copyText = null, copyFlashKey = null, onCopy, valueTitle = null }) {
  const empty = value === DASH;
  const copyable = copyText != null && String(copyText).trim() !== "" && typeof onCopy === "function";

  return (
    <div className="anuncios-sell-popover__block">
      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
        <span>{label}</span>
      </div>
      {copyable ? (
        <CopyableValue
          value={value}
          copyText={String(copyText).trim()}
          empty={empty}
          copyFlashKey={copyFlashKey}
          onCopy={onCopy}
        />
      ) : (
        <div
          className={["anuncios-sell-popover__muted", empty ? "anuncios-sell-popover__value--empty" : ""].filter(Boolean).join(" ")}
          title={valueTitle != null && String(valueTitle).trim() !== "" ? String(valueTitle).trim() : undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   itemId?: string | null;
 *   saleContextMetrics?: Record<string, unknown> | null;
 *   listingInternalId?: string | null;
 *   onClose?: () => void;
 * }} props
 */
export default function SaleGeneralInfoLines({
  general,
  product,
  financial,
  profitMargin,
  listingTitle,
  itemId,
  saleContextMetrics,
  listingInternalId: listingInternalIdProp,
  onClose,
}) {
  const { addNotification } = useNotifications();
  const [copyFlashKey, setCopyFlashKey] = useState(/** @type {string | null} */ (null));
  const g = general && typeof general === "object" ? general : {};
  const combineDelivery = g.combine_delivery === true;
  const orderCopyText = g.external_order_id != null ? String(g.external_order_id).trim() : "";
  const operationalLines = collectSaleRayxOperationalLines(g, product);
  const saleTypeLine = operationalLines.find((row) => row.label === "Tipo de venda") ?? null;
  const otherOperationalLines = operationalLines.filter((row) => row.label !== "Tipo de venda");
  const moneyRelease = resolveMoneyReleaseDate(g, product);

  const copyText = useCallback(
    async (text, label, flashKey) => {
      const t = String(text ?? "").trim();
      if (t === "") return;
      try {
        await navigator.clipboard.writeText(t);
        setCopyFlashKey(flashKey);
        window.setTimeout(() => {
          setCopyFlashKey((k) => (k === flashKey ? null : k));
        }, COPY_FLASH_MS);
        addNotification({
          event_type: "LISTING_ID_COPIED",
          entity_type: "marketplace_listing",
          title: `${label} copiado`,
          message: `${t} foi copiado para a área de transferência.`,
          severity: NOTIFICATION_SEVERITY.INFO,
        });
      } catch {
        addNotification({
          event_type: "LISTING_ID_COPY_FAILED",
          entity_type: "marketplace_listing",
          title: "Não foi possível copiar",
          message: "Verifique permissões do navegador ou use HTTPS.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
      }
    },
    [addNotification],
  );

  const productTitle =
    listingTitle != null && String(listingTitle).trim() !== ""
      ? String(listingTitle).trim()
      : product?.title != null && String(product.title).trim() !== ""
        ? String(product.title).trim()
        : null;

  const listingInternalId =
    listingInternalIdProp != null && String(listingInternalIdProp).trim() !== ""
      ? String(listingInternalIdProp).trim()
      : null;

  const buyerName = truncateWordsDisplay(
    g.buyer_display_name != null ? String(g.buyer_display_name) : null,
    2,
  );

  return (
    <div className="vendas-sale-rayx__sale-data-card">
      {productTitle ? (
        <h3 className="vendas-sale-rayx__product-title">{productTitle}</h3>
      ) : null}
      <SaleRayXProductHeader
        placement="card"
        product={product}
        general={general}
        listingId={product?.listing_id_display ?? general?.listing_id_display ?? null}
        sku={product?.sku_display ?? general?.sku_display ?? null}
        listingInternalId={listingInternalId}
        onClose={onClose}
      />
      <div className="vendas-sale-rayx__sale-data-hero">
        <SaleRayXProductPhoto product={product} variant="hero" />
        <div className="vendas-sale-rayx__general-lines vendas-sale-rayx__general-lines--primary">
          <InfoLine
            label="Pedido e-commerce"
            value={orderCopyText !== "" ? orderCopyText : DASH}
            copyText={orderCopyText !== "" ? orderCopyText : null}
            copyFlashKey={copyFlashKey}
            onCopy={copyText}
          />
          <InfoLine label="Data da venda" value={formatDatePt(g.sale_date != null ? String(g.sale_date) : null)} />
          <InfoLine label="Conta marketplace" value={g.account_alias != null ? String(g.account_alias) : DASH} />
          <InfoLine label="Quantidade" value={g.quantity != null ? String(g.quantity) : DASH} />
        </div>
      </div>

      <div className="vendas-sale-rayx__general-lines vendas-sale-rayx__general-lines--secondary">
        <InfoLine
          label="Cliente"
          value={buyerName.display}
          valueTitle={buyerName.truncated ? buyerName.full : null}
        />
        <InfoLine label="Status no marketplace" value={g.order_status != null ? String(g.order_status) : DASH} />
        <InfoLine
          label="Pedido interno"
          value={shortUuid(g.order_internal_id != null ? String(g.order_internal_id) : null)}
        />
        <InfoLine label="Entrega / logística" value={g.delivery_label != null ? String(g.delivery_label) : DASH} />
        {combineDelivery ? <InfoLine label="Combine a entrega" value="Sim" /> : null}
        <InfoLine
          label="Importação financeira"
          value={g.import_status_label != null ? String(g.import_status_label) : DASH}
        />
        {saleTypeLine ? <InfoLine key="tipo-venda" label={saleTypeLine.label} value={saleTypeLine.value} /> : null}
        <SaleRayXAccumulatedPerformance metrics={saleContextMetrics} />
        <SaleRayXOperationalActions
          general={g}
          product={product}
          financial={financial}
          profitMargin={profitMargin}
          listingTitle={listingTitle}
          itemId={itemId}
        />
        {moneyRelease ? (
          <InfoLineStack key="money-release" label={moneyRelease.label} value={moneyRelease.dateDisplay} />
        ) : null}
        {otherOperationalLines.map((row) => (
          <InfoLine key={`${row.label}:${row.value}`} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}
