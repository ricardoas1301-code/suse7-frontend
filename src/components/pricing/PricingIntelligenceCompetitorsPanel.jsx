// ======================================================
// PI.2.11C — Aba Concorrentes da Precificação Inteligente (somente leitura).
// Fetch e cache por sessão ficam em PricingIntelligenceContent (pai do modal).
// ======================================================

import {
  displayCompetitorTitle,
  formatPowerSeller,
  pickCompetitorPrice,
  pickCompetitorSellerName,
  pickCompetitorThumbnail,
  resolveRegisteredCompetitorHref,
} from "../concorrencia/concorrenciaCompetitorDisplay.js";
import { PricingIntelligenceConcorrenteCard } from "./PricingIntelligenceConcorrenteCard.jsx";

/** @typedef {"idle" | "loading" | "success" | "error"} ConcorrentesSessaoStatus */

/**
 * @param {{
 *   listingKey: string;
 *   status?: ConcorrentesSessaoStatus;
 *   competitors?: Record<string, unknown>[];
 *   error?: string | null;
 *   semMonitoredListing?: boolean;
 *   precoNosso?: number | string | null;
 *   onRetry?: () => void;
 * }} props
 */
export function PricingIntelligenceCompetitorsPanel({
  listingKey,
  status = "idle",
  competitors = [],
  error = null,
  semMonitoredListing = false,
  precoNosso = null,
  onRetry,
}) {
  const chaveLista = String(listingKey ?? "").trim();
  const loading = status === "loading" || status === "idle";

  return (
    <div className="pricing-intelligence-page__competitors-panel">
      {!chaveLista ? (
        <p className="pricing-intelligence-page__competitors-empty" role="status">
          Anúncio indisponível para consultar concorrentes cadastrados.
        </p>
      ) : loading ? (
        <p className="pricing-intelligence-page__competitors-state" role="status">
          Carregando concorrentes...
        </p>
      ) : error ? (
        <div
          className="pricing-intelligence-page__competitors-state pricing-intelligence-page__competitors-state--error"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            className="pricing-intelligence-page__competitors-retry"
            onClick={() => onRetry?.()}
          >
            Tentar novamente
          </button>
        </div>
      ) : semMonitoredListing || competitors.length === 0 ? (
        <p className="pricing-intelligence-page__competitors-empty" role="status">
          {semMonitoredListing
            ? "Este anúncio não está no monitoramento de concorrência ou ainda não possui concorrentes cadastrados."
            : "Este anúncio ainda não possui concorrentes cadastrados."}
        </p>
      ) : (
        <ul className="pricing-intelligence-page__competitors-grid" aria-label="Concorrentes cadastrados">
          {competitors.map((c) => {
            const id = String(c.id ?? c.competitor_listing_id ?? Math.random());
            const shipping =
              c.shipping != null && typeof c.shipping === "object"
                ? /** @type {Record<string, unknown>} */ (c.shipping)
                : null;
            const priceInfo = pickCompetitorPrice(c);

            return (
              <PricingIntelligenceConcorrenteCard
                key={id}
                thumbUrl={pickCompetitorThumbnail(c)}
                titulo={displayCompetitorTitle(c.competitor_title)}
                href={resolveRegisteredCompetitorHref(c)}
                preco={priceInfo.value}
                moeda={priceInfo.currency}
                shipping={shipping}
                nomeVendedor={pickCompetitorSellerName(c)}
                medalhaVendedor={formatPowerSeller(
                  c.reputation != null && typeof c.reputation === "object" ? c.reputation : null,
                )}
                precoNosso={precoNosso}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
