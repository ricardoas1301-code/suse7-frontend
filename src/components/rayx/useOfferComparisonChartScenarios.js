// ======================================================
// Hook — cenários financeiros do Comparativo de Ofertas S7.
// S4.3.6.21 — verdade fail-closed + lanes estáveis.
// S4.3.6.22 — first paint imediato via cache/SSOT; async só reconcilia.
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";

import { buildOrderedScenarioRows } from "../mercadoLivrePricingScenarioCompareShared.js";
import { extrairContextoSelecaoPromocao } from "../pricing/pricingPromotionClassicPremiumScenario.js";
import { chaveCacheSimulacaoOficial } from "../../utils/simulateListingTypeScenarioKeys.js";
import {
  montarPayloadSelecaoPromocaoSimulacao,
  simularCenarioListingTypeOficial,
} from "../../utils/simulateListingTypeScenarioOficial.js";
import {
  getOrFetchSimulacaoOficialCache,
  setSimulacaoOficialCache,
} from "../../utils/simulacaoOficialListingTypeCache.js";
import { sanitizarCenarioSimuladoBrutoPromocao } from "../../features/pricing/promotions/aplicarReducaoTarifaPromocaoNoCenario.js";
import {
  adaptarCenarioGraficoComparativo,
  extrairLucroMargemCanonico,
  logOfferComparisonFinancialTrace,
  resolverListingTypeComparativoOfertas,
} from "./offerComparisonFinancialAdapter.js";
import { montarFirstPaintComparativoOfertas } from "./offerComparisonFirstPaint.js";
import {
  isBaselineOfferComparisonScenario,
  isOfferComparisonScenarioPending,
  montarCenarioComparativoPendente,
  montarCenarioComparativoZeroCanonico,
  resolverPrecoVerdadeComparativoOfertas,
} from "./offerComparisonPromotionTruth.js";
import {
  assinarSnapshotFinanceiroPrecificacao,
  FINANCIAL_SCENARIO_KIND,
  obterRevisaoFinanceiraPrecificacaoListing,
  selectBaselineScenario,
} from "../pricing/pricingFinancialScenarioStore.js";

/**
 * @param {{
 *   scenarios: unknown[];
 *   catalogRow?: Record<string, unknown> | null;
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown; group?: string } | null;
 *   configuracaoFinanceira?: Record<string, unknown> | null;
 *   enabled?: boolean;
 *   resolveManualPriceRecord?: ((scenario: unknown) => import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null) | null;
 *   manualPriceRevision?: number;
 * }} params
 */
export function useOfferComparisonChartScenarios({
  scenarios,
  catalogRow = null,
  listingExternalId = null,
  listingId = null,
  mlScenariosPayload = null,
  baselineRow = null,
  configuracaoFinanceira = null,
  enabled = true,
  resolveManualPriceRecord = null,
  manualPriceRevision = 0,
}) {
  const listingTypeRes = useMemo(
    () => resolverListingTypeComparativoOfertas(catalogRow),
    [catalogRow],
  );

  const orderedRows = useMemo(() => {
    if (!Array.isArray(scenarios) || scenarios.length === 0) return [];
    return buildOrderedScenarioRows(scenarios, { preserveInputOrder: true });
  }, [scenarios]);

  const listingType = listingTypeRes.ok ? listingTypeRes.listingType : null;

  // S4.3.6.25 — reage ao SSOT da Precificação (preço/custos/revisão).
  const [pricingFinRevision, setPricingFinRevision] = useState(() =>
    obterRevisaoFinanceiraPrecificacaoListing(listingExternalId, listingId),
  );
  useEffect(() => {
    return assinarSnapshotFinanceiroPrecificacao((ev) => {
      const ext = listingExternalId != null ? String(listingExternalId).trim() : "";
      const id = listingId != null ? String(listingId).trim() : "";
      if (ev.listingKey === ext || ev.listingKey === id || (ext !== "" && ev.listingKey === ext)) {
        setPricingFinRevision(ev.revision);
      }
    });
  }, [listingExternalId, listingId]);

  // S4.3.6.28 — selector estrito BASELINE (rejeita qualquer snapshot PROMOTION).
  const pricingSnap = useMemo(() => {
    void pricingFinRevision;
    if (listingType == null) return null;
    return selectBaselineScenario(listingExternalId, listingId, listingType);
  }, [pricingFinRevision, listingExternalId, listingId, listingType]);

  const baselineSalePriceOverride =
    pricingSnap != null &&
    pricingSnap.scenarioKind === FINANCIAL_SCENARIO_KIND.BASELINE &&
    pricingSnap.salePrice != null &&
    pricingSnap.salePrice > 0
      ? pricingSnap.salePrice
      : null;

  const firstPaint = useMemo(() => {
    void manualPriceRevision;
    void pricingFinRevision;
    if (!enabled || orderedRows.length === 0 || listingType == null) {
      return { scenarios: /** @type {unknown[]} */ ([]), pendingCount: 0, resolvedCount: 0, zeroCount: 0, needsReconcile: false };
    }
    return montarFirstPaintComparativoOfertas({
      orderedRows,
      listingType,
      listingExternalId,
      listingId,
      mlScenariosPayload,
      baselineRow,
      catalogRow,
      configuracaoFinanceira,
      resolveManualPriceRecord,
      baselineSalePriceOverride,
    });
  }, [
    enabled,
    orderedRows,
    listingType,
    listingExternalId,
    listingId,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    configuracaoFinanceira,
    resolveManualPriceRecord,
    manualPriceRevision,
    pricingFinRevision,
    baselineSalePriceOverride,
  ]);

  const resolveKey = useMemo(
    () =>
      [
        enabled ? "1" : "0",
        listingTypeRes.ok ? listingTypeRes.listingType : listingTypeRes.reason,
        listingExternalId ?? "",
        listingId ?? "",
        String(manualPriceRevision),
        String(pricingFinRevision),
        baselineSalePriceOverride != null ? String(baselineSalePriceOverride) : "",
        String(orderedRows.length),
        orderedRows
          .map(({ scenario }) => {
            const s =
              scenario != null && typeof scenario === "object"
                ? /** @type {Record<string, unknown>} */ (scenario)
                : {};
            const manual =
              typeof resolveManualPriceRecord === "function" ? resolveManualPriceRecord(scenario) : null;
            const priceHint =
              manual?.priceBrl != null
                ? String(manual.priceBrl)
                : String(s.scenario_id ?? s.scenario_key ?? s.promotion_id ?? "");
            return priceHint;
          })
          .join("|"),
      ].join("::"),
    [
      enabled,
      listingTypeRes,
      listingExternalId,
      listingId,
      manualPriceRevision,
      pricingFinRevision,
      baselineSalePriceOverride,
      orderedRows,
      resolveManualPriceRecord,
    ],
  );

  const [asyncBundle, setAsyncBundle] = useState(
    /** @type {{ key: string; scenarios: unknown[]; error: string | null } | null} */ (null),
  );
  const [loading, setLoading] = useState(false);
  const seqRef = useRef(0);

  const canResolve =
    enabled &&
    listingTypeRes.ok &&
    listingType != null &&
    orderedRows.length > 0 &&
    (listingExternalId != null && String(listingExternalId).trim() !== "" ||
      listingId != null && String(listingId).trim() !== "");

  useEffect(() => {
    if (!canResolve || listingType == null) {
      return;
    }

    // Se o first paint já está completo (cache hits + zeros), não força loading global.
    if (!firstPaint.needsReconcile) {
      setAsyncBundle({
        key: resolveKey,
        scenarios: firstPaint.scenarios,
        error: null,
      });
      setLoading(false);
      return;
    }

    const seq = seqRef.current + 1;
    seqRef.current = seq;
    let cancelled = false;
    const keyAtStart = resolveKey;

    async function reconciliar() {
      setLoading(true);
      // S4.3.6.26 — progressive: publica lane a lane; não espera Promise.all completo.
      /** @type {unknown[]} */
      const progressive = firstPaint.scenarios.map((s) => s);
      setAsyncBundle({
        key: keyAtStart,
        scenarios: progressive,
        error: null,
      });

      /**
       * @param {number} index
       * @param {unknown} laneScenario
       */
      const publicarLane = (index, laneScenario) => {
        if (cancelled || seqRef.current !== seq) return;
        progressive[index] = laneScenario;
        setAsyncBundle({
          key: keyAtStart,
          scenarios: progressive.slice(),
          error: null,
        });
      };

      try {
        const tasks = orderedRows.map(async ({ scenario: sourceScenario }, index) => {
          // Já resolvido no first paint (cache/SSOT): não reprocessa.
          if (progressive[index] != null && !isOfferComparisonScenarioPending(progressive[index])) {
            return progressive[index];
          }

          const manual =
            typeof resolveManualPriceRecord === "function" ? resolveManualPriceRecord(sourceScenario) : null;
          const resolution = resolverPrecoVerdadeComparativoOfertas({
            sourceScenario,
            mlScenariosPayload,
            baselineRow,
            catalogRow,
            manualPriceRecord: manual,
            baselineSalePriceOverride,
          });

          if (!resolution.isFinanciallySimulated || resolution.salePrice == null || !(resolution.salePrice > 0)) {
            const zeroOrPending = isBaselineOfferComparisonScenario(sourceScenario)
              ? montarCenarioComparativoPendente(sourceScenario, resolution)
              : montarCenarioComparativoZeroCanonico(sourceScenario, resolution);
            publicarLane(index, zeroOrPending);
            return zeroOrPending;
          }

          const promoCtx = isBaselineOfferComparisonScenario(sourceScenario)
            ? null
            : extrairContextoSelecaoPromocao(sourceScenario);
          const promotionId =
            promoCtx?.promotion_id != null && String(promoCtx.promotion_id).trim() !== ""
              ? String(promoCtx.promotion_id).trim()
              : null;
          const cacheKey = chaveCacheSimulacaoOficial({
            listingExternalId,
            listingId,
            listingType,
            kind: "preco",
            value: resolution.salePrice,
            configuracaoFinanceira,
            promotionId,
          });

          const promotionSelection = isBaselineOfferComparisonScenario(sourceScenario)
            ? null
            : montarPayloadSelecaoPromocaoSimulacao(promoCtx);

          const { estado } = await getOrFetchSimulacaoOficialCache(cacheKey, async () => {
            const res = await simularCenarioListingTypeOficial({
              listingExternalId,
              listingId,
              listingType,
              salePrice: Math.round(resolution.salePrice * 100) / 100,
              configuracaoFinanceira,
              promotionSelection,
            });
            if (!res.ok || res.data?.scenario == null) return null;
            const simBruto = sanitizarCenarioSimuladoBrutoPromocao(res.data.scenario);
            if (simBruto == null) return null;
            /** @type {import("../../utils/simulacaoOficialListingTypeCache.js").EstadoSimulacaoTipoCache} */
            const novo = {
              scenario: simBruto,
              loading: false,
              erro: null,
              resolvedPrice: resolution.salePrice,
              resolvedMargin: null,
              commissionSource: null,
              feePercent: null,
              key: cacheKey,
            };
            setSimulacaoOficialCache(cacheKey, novo);
            return novo;
          });

          if (cancelled || seqRef.current !== seq) return null;

          if (estado?.scenario == null) {
            const failClosed = montarCenarioComparativoZeroCanonico(sourceScenario, resolution);
            publicarLane(index, failClosed);
            return failClosed;
          }

          const adapted = adaptarCenarioGraficoComparativo(sourceScenario, estado.scenario, listingType);
          if (adapted == null) {
            const failClosed = montarCenarioComparativoZeroCanonico(sourceScenario, resolution);
            publicarLane(index, failClosed);
            return failClosed;
          }

          const withMeta = {
            ...adapted,
            _offer_comparison_financial: {
              ...(adapted._offer_comparison_financial && typeof adapted._offer_comparison_financial === "object"
                ? adapted._offer_comparison_financial
                : {}),
              scenario_status: resolution.truthStatus,
              is_financially_simulated: true,
              pending: false,
              provenance: resolution.provenance,
              sale_price_brl: resolution.salePriceBrl,
              canonical_source: "pricing-simulate-scenario",
            },
          };

          if (import.meta.env.DEV) {
            const prev = extrairLucroMargemCanonico(sourceScenario);
            const next = extrairLucroMargemCanonico(withMeta);
            logOfferComparisonFinancialTrace({
              external_listing_id: listingExternalId,
              comparison_profit_brl: next.profit_brl,
              comparison_margin_percent: next.margin_pct,
              previous_profit_brl: prev.profit_brl,
              previous_margin_percent: prev.margin_pct,
              truth_status: resolution.truthStatus,
              sale_price_brl: resolution.salePriceBrl,
              match_status: "reconciled",
            });
          }

          publicarLane(index, withMeta);
          return withMeta;
        });

        const settled = await Promise.all(tasks);
        if (cancelled || seqRef.current !== seq) return;

        const out = settled.filter((item) => item != null);
        setAsyncBundle({
          key: keyAtStart,
          scenarios: out.length > 0 ? progressive.slice() : firstPaint.scenarios,
          error:
            out.length === 0 ? "Não foi possível resolver os cenários financeiros do comparativo." : null,
        });
      } catch {
        if (cancelled || seqRef.current !== seq) return;
        setAsyncBundle({
          key: keyAtStart,
          scenarios: progressive.length > 0 ? progressive.slice() : firstPaint.scenarios,
          error: "Falha ao carregar paridade financeira do comparativo.",
        });
      } finally {
        if (!cancelled && seqRef.current === seq) {
          setLoading(false);
        }
      }
    }

    reconciliar();

    return () => {
      cancelled = true;
    };
  }, [
    canResolve,
    listingType,
    orderedRows,
    listingExternalId,
    listingId,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    configuracaoFinanceira,
    resolveManualPriceRecord,
    resolveKey,
    firstPaint,
    baselineSalePriceOverride,
  ]);

  const chartScenarios =
    asyncBundle != null && asyncBundle.key === resolveKey
      ? asyncBundle.scenarios
      : firstPaint.scenarios;

  const hasPendingLane = chartScenarios.some((s) => isOfferComparisonScenarioPending(s));

  const error = !enabled
    ? null
    : !listingTypeRes.ok && orderedRows.length > 0
      ? `Tipo do anúncio indisponível (${listingTypeRes.reason}).`
      : asyncBundle != null && asyncBundle.key === resolveKey
        ? asyncBundle.error
        : null;

  return {
    chartScenarios,
    // Loading global só enquanto houver lane pendente real.
    loading: Boolean(canResolve && (loading || hasPendingLane) && firstPaint.needsReconcile),
    hasPendingLane,
    error,
    listingType,
    listingTypeUnavailable: !listingTypeRes.ok,
    listingTypeReason: listingTypeRes.ok ? null : listingTypeRes.reason,
  };
}
