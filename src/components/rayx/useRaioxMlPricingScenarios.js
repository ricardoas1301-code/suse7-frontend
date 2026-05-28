import { useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../../config/api";
import {
  buildRaioxScenariosFromSaleXrayModalContract,
  enrichRaioxScenariosWithListingPromotionMetadata,
  mergeListingGridRowIntoMlScenarios,
  shouldSaleXrayDebugTrace,
  wrapPricingScenariosApiAsSaleXrayModalPayload,
} from "../mercadoLivrePricingScenarioCompareShared.js";

/**
 * @param {Record<string, unknown> | null | undefined} mlScenariosPayload
 * @param {Record<string, unknown> | null | undefined} listingRowStub
 * @returns {Record<string, unknown>[]}
 */
export function buildRaioxMlScenariosForDisplay(mlScenariosPayload, listingRowStub) {
  if (!mlScenariosPayload || typeof mlScenariosPayload !== "object") return [];
  const fromContract = buildRaioxScenariosFromSaleXrayModalContract(mlScenariosPayload);
  if (!fromContract || fromContract.length === 0) return [];
  const merged = mergeListingGridRowIntoMlScenarios(fromContract, listingRowStub);
  return enrichRaioxScenariosWithListingPromotionMetadata(merged, mlScenariosPayload, listingRowStub);
}

/**
 * Cenários ML para Raio-x / comparativo (mesmo contrato da Página Anúncios).
 * @param {string | null | undefined} listingExternalId
 * @param {{ enabled?: boolean; listingRowStub?: Record<string, unknown> | null }} [options]
 */
export function useRaioxMlPricingScenarios(listingExternalId, options = {}) {
  const { enabled = true, listingRowStub = null } = options;
  const [payload, setPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const externalId = listingExternalId != null ? String(listingExternalId).trim().replace(/^#/, "") : "";

  useEffect(() => {
    if (!enabled || externalId === "") {
      setPayload(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setPayload(null);
    setError(null);

    (async () => {
      setLoading(true);
      try {
        const url = buildApiUrl("/api/ml/listings/pricing-scenarios");
        if (!url) {
          if (!cancelled) {
            setError("API não configurada (VITE_API_BASE_URL).");
            setPayload(null);
          }
          return;
        }
        const result = await apiFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingExternalId: externalId }),
        });
        const data = /** @type {Record<string, unknown> | undefined} */ (result.data);
        if (!result.ok) {
          if (!cancelled) {
            setError(
              result.error != null ? String(result.error) : "Não foi possível carregar os cenários de precificação.",
            );
            setPayload(null);
          }
          return;
        }
        if (!data || data.ok !== true) {
          if (!cancelled) {
            setError(
              data?.error != null ? String(data.error) : "Não foi possível carregar os cenários de precificação.",
            );
            setPayload(null);
          }
          return;
        }
        const normalized = wrapPricingScenariosApiAsSaleXrayModalPayload(data);
        if (
          normalized == null ||
          normalized.from_sale_xray_modal !== true ||
          normalized.sale_xray_modal == null ||
          typeof normalized.sale_xray_modal !== "object"
        ) {
          if (!cancelled) {
            setError(
              "Não foi possível montar o comparativo a partir dos cenários deste anúncio. Sincronize o anúncio e tente de novo.",
            );
            setPayload(null);
          }
          return;
        }
        if (shouldSaleXrayDebugTrace(normalized)) {
          console.log("[SALE_XRAY] pricing-scenarios response", normalized);
        }
        if (!cancelled) setPayload(normalized);
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar os cenários de precificação.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, externalId]);

  const scenarios = useMemo(
    () => buildRaioxMlScenariosForDisplay(payload, listingRowStub),
    [payload, listingRowStub],
  );

  return {
    payload,
    scenarios,
    hasScenarios: scenarios.length > 0,
    loading,
    error,
  };
}
