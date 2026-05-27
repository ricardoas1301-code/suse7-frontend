import { memo, useMemo } from "react";
import SellerDrawerSection from "./SellerDrawerSection";
import { formatSellerWhen } from "../sellerOpsUtils";
import { resolveLastMarketplaceSync } from "./sellerDrawerSectionModel";

/**
 * @param {{
 *   metrics?: Record<string, unknown> | null;
 *   marketplaces?: Record<string, unknown>[];
 *   state?: "loading" | "loaded" | "empty" | "error";
 * }} props
 */
function SellerDrawerQuickMetricsCard({ metrics = null, marketplaces = [], state = "loaded" }) {
  const lastSync = useMemo(() => resolveLastMarketplaceSync(marketplaces), [marketplaces]);

  const items = useMemo(
    () => [
      {
        key: "sales",
        label: "Vendas",
        value: formatMetricValue(metrics?.sales_count),
      },
      {
        key: "listings",
        label: "Anúncios",
        value: formatMetricValue(metrics?.listings_count),
      },
      {
        key: "products",
        label: "Produtos",
        value: "—",
        hint: "Sem dado no painel",
      },
      {
        key: "sync",
        label: "Última sincronização",
        value: lastSync ? formatSellerWhen(lastSync) : "—",
      },
    ],
    [metrics, lastSync],
  );

  return (
    <SellerDrawerSection
      title="Métricas rápidas"
      subtitle="Leitura executiva"
      state={state}
      emptyMessage="Métricas indisponíveis."
    >
      <div className="seller-drawer-metrics">
        {items.map((item) => (
          <article key={item.key} className="seller-drawer-metrics__item">
            <span className="seller-drawer-metrics__label">{item.label}</span>
            <strong className="seller-drawer-metrics__value">{item.value}</strong>
            {item.hint ? <span className="seller-drawer-metrics__hint">{item.hint}</span> : null}
          </article>
        ))}
      </div>
    </SellerDrawerSection>
  );
}

/**
 * @param {unknown} value
 */
function formatMetricValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return String(n);
}

export default memo(SellerDrawerQuickMetricsCard);
