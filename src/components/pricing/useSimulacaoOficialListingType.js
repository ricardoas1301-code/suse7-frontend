// ======================================================
// Hook — simulação oficial por tipo de anúncio (Clássico/Premium) na Precificação Inteligente.
//
// Responsável por: debounce (~600ms), cache por (anúncio, tipo, preço|margem),
// descarte de resposta obsoleta (latest-wins), loading discreto por card e
// manutenção do último cenário válido em caso de erro.
//
// Não calcula nada financeiro: apenas orquestra as chamadas ao resolver oficial
// e devolve o cenário pronto para renderização.
// ======================================================

import { useEffect, useRef, useState } from "react";

import {
  chaveCacheSimulacaoOficial,
  chaveExtrasPrecificacaoInteligente,
  simularCenarioListingTypeOficial,
} from "../../utils/simulateListingTypeScenarioOficial.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */
/** @typedef {{ kind: "preco" | "margem"; value: number } | null} IntencaoSimulacao */
/**
 * @typedef {{
 *   scenario: unknown;
 *   loading: boolean;
 *   erro: string | null;
 *   resolvedPrice: number | null;
 *   resolvedMargin: number | null;
 *   commissionSource: string | null;
 *   feePercent: string | null;
 *   key: string | null;
 * }} EstadoSimulacaoTipo
 */

const TIPOS = /** @type {ListingTypeChoice[]} */ (["classic", "premium"]);
const DEBOUNCE_MS = 600;

/** @returns {EstadoSimulacaoTipo} */
function estadoVazio() {
  return {
    scenario: null,
    loading: false,
    erro: null,
    resolvedPrice: null,
    resolvedMargin: null,
    commissionSource: null,
    feePercent: null,
    key: null,
  };
}

/** @param {unknown} v */
function num(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @typedef {import("../../utils/simulateListingTypeScenarioOficial.js").ConfiguracaoFinanceiraExtras} ConfiguracaoFinanceiraExtras
 */

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   intents: Partial<Record<ListingTypeChoice, IntencaoSimulacao>>;
 *   configuracaoFinanceira?: ConfiguracaoFinanceiraExtras | null;
 * }} p
 * @returns {Record<ListingTypeChoice, EstadoSimulacaoTipo>}
 */
export function useSimulacaoOficialListingType({
  listingExternalId,
  listingId,
  intents,
  configuracaoFinanceira = null,
}) {
  const [estado, setEstado] = useState(
    /** @type {Record<ListingTypeChoice, EstadoSimulacaoTipo>} */ ({
      classic: estadoVazio(),
      premium: estadoVazio(),
    }),
  );

  const cacheRef = useRef(/** @type {Map<string, EstadoSimulacaoTipo>} */ (new Map()));
  const timersRef = useRef(/** @type {Record<string, ReturnType<typeof setTimeout> | null>} */ ({}));
  const seqRef = useRef(/** @type {Record<string, number>} */ ({ classic: 0, premium: 0 }));

  const extrasKey = chaveExtrasPrecificacaoInteligente(configuracaoFinanceira);
  const intentClassicKey = chaveDaIntencao(
    listingExternalId,
    listingId,
    "classic",
    intents.classic,
    configuracaoFinanceira,
  );
  const intentPremiumKey = chaveDaIntencao(
    listingExternalId,
    listingId,
    "premium",
    intents.premium,
    configuracaoFinanceira,
  );

  useEffect(() => {
    /** @type {Record<ListingTypeChoice, IntencaoSimulacao>} */
    const intencoes = { classic: intents.classic ?? null, premium: intents.premium ?? null };

    for (const tipo of TIPOS) {
      const intent = intencoes[tipo];

      // Sem intenção (card usa baseline oficial da API) → limpa estado simulado do tipo.
      if (intent == null) {
        if (timersRef.current[tipo]) {
          clearTimeout(/** @type {ReturnType<typeof setTimeout>} */ (timersRef.current[tipo]));
          timersRef.current[tipo] = null;
        }
        setEstado((prev) => (prev[tipo].scenario == null && !prev[tipo].loading && prev[tipo].erro == null
          ? prev
          : { ...prev, [tipo]: estadoVazio() }));
        continue;
      }

      const key = chaveCacheSimulacaoOficial({
        listingExternalId,
        listingId,
        listingType: tipo,
        kind: intent.kind,
        value: intent.value,
        configuracaoFinanceira,
      });

      // Cache hit → aplica imediatamente, sem loading nem nova chamada.
      const cached = cacheRef.current.get(key);
      if (cached) {
        if (timersRef.current[tipo]) {
          clearTimeout(/** @type {ReturnType<typeof setTimeout>} */ (timersRef.current[tipo]));
          timersRef.current[tipo] = null;
        }
        setEstado((prev) => (prev[tipo].key === key && !prev[tipo].loading
          ? prev
          : { ...prev, [tipo]: { ...cached, loading: false, erro: null, key } }));
        continue;
      }

      // Loading discreto (mantém último cenário válido como fundo).
      setEstado((prev) => ({ ...prev, [tipo]: { ...prev[tipo], loading: true, erro: null } }));

      if (timersRef.current[tipo]) {
        clearTimeout(/** @type {ReturnType<typeof setTimeout>} */ (timersRef.current[tipo]));
      }
      const reqSeq = seqRef.current[tipo] + 1;
      seqRef.current[tipo] = reqSeq;

      timersRef.current[tipo] = setTimeout(async () => {
        const params = {
          listingExternalId,
          listingId,
          listingType: tipo,
          configuracaoFinanceira,
          ...(intent.kind === "margem"
            ? { targetMarginPct: intent.value }
            : { salePrice: intent.value }),
        };
        const res = await simularCenarioListingTypeOficial(params);

        // Descarta resposta obsoleta (chegou depois de uma edição mais nova).
        if (seqRef.current[tipo] !== reqSeq) return;

        if (!res.ok || res.data == null || res.data.scenario == null) {
          setEstado((prev) => ({
            ...prev,
            [tipo]: {
              ...prev[tipo],
              loading: false,
              erro: res.error ?? "Não foi possível atualizar este cenário agora.",
            },
          }));
          return;
        }

        const data = /** @type {Record<string, unknown>} */ (res.data);
        const scenario =
          data.scenario != null && typeof data.scenario === "object"
            ? /** @type {Record<string, unknown>} */ (data.scenario)
            : null;
        const financial =
          data.financial != null && typeof data.financial === "object"
            ? /** @type {Record<string, unknown>} */ (data.financial)
            : null;
        const resCenario =
          scenario?.result != null && typeof scenario.result === "object"
            ? /** @type {Record<string, unknown>} */ (scenario.result)
            : null;
        const resolvedPrice = num(
          data.resolved_sale_price_brl ??
            financial?.sale_price_brl ??
            (scenario?.marketplace != null && typeof scenario.marketplace === "object"
              ? /** @type {Record<string, unknown>} */ (scenario.marketplace).sale_price_brl
              : null),
        );
        const resolvedMargin = num(
          resCenario?.margin_pct ?? financial?.margin_percent ?? data.resolved_margin_pct,
        );
        if (import.meta.env.DEV && financial != null) {
          console.info("[pricing-simulate] card", {
            tipo,
            sale_price_brl: financial.sale_price_brl,
            official_fee_brl: financial.official_fee_brl,
            shipping_cost_brl: financial.shipping_cost_brl,
            shipping_source: financial.shipping_source,
            payout_brl: financial.payout_brl,
            shipping_is_fallback: financial.shipping_is_fallback,
            promotion_reserve_brl: financial.promotion_reserve_brl,
            affiliate_brl: financial.affiliate_brl,
            ads_brl: financial.ads_brl,
            operational_cost_brl: financial.operational_cost_brl,
            profit_brl: financial.profit_brl,
            margin_percent: financial.margin_percent,
          });
          console.info("[pricing-chart-sync] card", {
            tipo,
            profit_brl: financial.profit_brl,
            margin_percent: financial.margin_percent,
            payout_brl: financial.payout_brl,
            extras_total_brl: financial.extras_total_brl,
          });
        }
        if (import.meta.env.DEV) {
          console.info("[pricing-bidirectional-sync] resolved", {
            tipo,
            intent: intent.kind,
            resolved_sale_price_brl: resolvedPrice,
            resolved_margin_pct: resolvedMargin,
          });
        }

        /** @type {EstadoSimulacaoTipo} */
        const novo = {
          scenario: data.scenario,
          loading: false,
          erro: null,
          resolvedPrice,
          resolvedMargin,
          commissionSource: data.commission_source != null ? String(data.commission_source) : null,
          feePercent: data.official_fee_percent != null ? String(data.official_fee_percent) : null,
          key,
        };
        cacheRef.current.set(key, novo);
        setEstado((prev) => ({ ...prev, [tipo]: novo }));
      }, DEBOUNCE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentClassicKey, intentPremiumKey, listingExternalId, listingId, extrasKey]);

  // Limpeza dos timers ao desmontar.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of Object.values(timers)) {
        if (t) clearTimeout(/** @type {ReturnType<typeof setTimeout>} */ (t));
      }
    };
  }, []);

  return estado;
}

/**
 * @param {string | null | undefined} ext
 * @param {string | null | undefined} id
 * @param {ListingTypeChoice} tipo
 * @param {IntencaoSimulacao} intent
 * @param {ConfiguracaoFinanceiraExtras | null | undefined} configuracaoFinanceira
 */
function chaveDaIntencao(ext, id, tipo, intent, configuracaoFinanceira) {
  if (intent == null) return `${tipo}|none|extras:${chaveExtrasPrecificacaoInteligente(configuracaoFinanceira)}`;
  return chaveCacheSimulacaoOficial({
    listingExternalId: ext,
    listingId: id,
    listingType: tipo,
    kind: intent.kind,
    value: intent.value,
    configuracaoFinanceira,
  });
}
