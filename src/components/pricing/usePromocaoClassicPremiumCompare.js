// ======================================================
// Hook — comparação Clássico × Premium da promoção selecionada (aba Promoções PI).
// Reutiliza simulação oficial por tipo; metadados da promoção vêm do contrato ML.
// ======================================================

import { useCallback, useEffect, useMemo } from "react";

import {
  inferListingTypeFromCatalogRow,
  listingTypePillLabel,
  listingTypeScenarioTitle,
  resolveListingTypeCompareCards,
} from "./pricingListingTypeUi.js";
import {
  extrairCoeficientesCenarioBaseline,
  montarLinhasMargemContingencia,
} from "./pricingScenarioLocalSimulation.js";
import {
  extrairContextoSelecaoPromocao,
  resolverCenarioPromocaoPorListingType,
  resolverNomePromocaoExibicao,
  resolverPrecoPromocaoNumerico,
} from "./pricingPromotionClassicPremiumScenario.js";
import {
  resolverPrecoOriginalPromocaoExibicao,
  resolverPrecoOriginalPromocaoMonetario,
} from "./pricingPromotionCardContract.js";
import { resolverPrecoVendaPromocaoPainelExibicao } from "./pricingPromotionCarouselUi.js";
import {
  logPiPromoClassicPremiumContractAudit,
  logPromotionCalcCardUxOriginalPrice,
  logPromotionCardFinancialLoadingState,
  logPromotionSelectedContractAudit,
} from "./pricingPromotionsAudit.js";
import {
  promocaoTemDescontoSeller,
  resolverDescontoSellerPromocaoExibicao,
} from "./pricingPromotionMoneyUi.js";
import { useSimulacaoOficialListingType } from "./useSimulacaoOficialListingType.js";
import { montarPayloadSelecaoPromocaoSimulacao } from "../../utils/simulateListingTypeScenarioOficial.js";
import {
  montarChaveCenarioFinanceiroPromocao,
  resolverCenarioFinanceiroPromocaoPendente,
} from "./pricingPromotionFinancialScenarioKey.js";
import {
  logPromotionSelectedFeeDiscountSource,
  resolverAjustesFinanceirosPromocaoComOrigem,
} from "../../features/pricing/promotions/aplicarReducaoTarifaPromocaoNoCenario.js";
import { buildPromotionCardViewModel } from "../../features/pricing/promotions/buildPromotionMarketplaceRevenueViewModel.js";
import { promocaoBetaPermiteSimulacaoEfetiva } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";
import {
  decimalBrlParaNumeroSimulacao,
  formatarDecimalBrlExibicao,
} from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import { resolverPrecoSimulacaoPromocaoMonetario } from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

const TIPOS = /** @type {ListingTypeChoice[]} */ (["classic", "premium"]);

/**
 * @param {{
 *   promocaoRow: { scenario: unknown; group: string } | null;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown; group: string } | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   listingHintForAudit?: string;
 *   configuracaoFinanceira?: Record<string, unknown>;
 *   manualPrecoSimulacaoBrl?: string | null;
 *   simulacaoUsaPrecoManual?: boolean;
 * }} params
 */
export function usePromocaoClassicPremiumCompare({
  promocaoRow,
  mlScenariosPayload = null,
  baselineRow = null,
  catalogRow = null,
  listingHintForAudit = "",
  configuracaoFinanceira = {},
  manualPrecoSimulacaoBrl = null,
  simulacaoUsaPrecoManual = false,
}) {
  const promocaoScenario = promocaoRow?.scenario ?? null;
  const promocaoGroup = promocaoRow?.group ?? "available";

  const listingCompare = useMemo(
    () =>
      resolveListingTypeCompareCards({
        payload: mlScenariosPayload,
        baselineRow,
        catalogRow,
      }),
    [mlScenariosPayload, baselineRow, catalogRow],
  );

  const currentListingType = listingCompare.currentListingType;

  const listingExternalId = useMemo(() => {
    const fromCatalog =
      catalogRow != null && typeof catalogRow === "object"
        ? String(/** @type {Record<string, unknown>} */ (catalogRow).externalId ?? "").trim()
        : "";
    return fromCatalog || (listingHintForAudit ? String(listingHintForAudit).trim() : "") || null;
  }, [catalogRow, listingHintForAudit]);

  const listingId = useMemo(() => {
    if (catalogRow != null && typeof catalogRow === "object") {
      const id = /** @type {Record<string, unknown>} */ (catalogRow).id;
      if (id != null && String(id).trim() !== "") return String(id).trim();
    }
    return null;
  }, [catalogRow]);

  const manualPriceRecord = useMemo(() => {
    if (!simulacaoUsaPrecoManual || !manualPrecoSimulacaoBrl) return null;
    return {
      priceBrl: manualPrecoSimulacaoBrl,
      source: /** @type {const} */ ("USER_PROVIDED_SIMULATION_PRICE"),
    };
  }, [simulacaoUsaPrecoManual, manualPrecoSimulacaoBrl]);

  const precoPromocao = useMemo(() => {
    if (simulacaoUsaPrecoManual && manualPrecoSimulacaoBrl) {
      return decimalBrlParaNumeroSimulacao(manualPrecoSimulacaoBrl);
    }
    if (promocaoScenario != null) {
      // S4.3.6.17 — gate final: sem salePrice confirmado/manual → null (não cai em numerico/raw).
      if (!promocaoBetaPermiteSimulacaoEfetiva(promocaoScenario, manualPriceRecord)) {
        return null;
      }
      const monetario = resolverPrecoSimulacaoPromocaoMonetario(promocaoScenario, manualPriceRecord);
      if (monetario != null) {
        const n = decimalBrlParaNumeroSimulacao(monetario);
        if (n != null && n > 0) return n;
      }
      return resolverPrecoPromocaoNumerico(promocaoScenario);
    }
    return null;
  }, [promocaoScenario, simulacaoUsaPrecoManual, manualPrecoSimulacaoBrl, manualPriceRecord]);

  const precoContratoIndisponivel = useMemo(
    () =>
      promocaoScenario != null
        ? !promocaoBetaPermiteSimulacaoEfetiva(promocaoScenario, manualPriceRecord)
        : false,
    [promocaoScenario, manualPriceRecord],
  );

  const aguardandoPrecoManual = useMemo(
    () => promocaoScenario != null && precoContratoIndisponivel && !simulacaoUsaPrecoManual,
    [promocaoScenario, precoContratoIndisponivel, simulacaoUsaPrecoManual],
  );

  const promocaoNome = useMemo(
    () => (promocaoScenario != null ? resolverNomePromocaoExibicao(promocaoScenario) : null),
    [promocaoScenario],
  );

  const promocaoPrecoExibicao = useMemo(() => {
    if (simulacaoUsaPrecoManual && manualPrecoSimulacaoBrl) {
      return formatarDecimalBrlExibicao(manualPrecoSimulacaoBrl);
    }
    if (promocaoScenario != null) {
      const monetario = resolverPrecoSimulacaoPromocaoMonetario(promocaoScenario, manualPriceRecord);
      if (monetario != null) return formatarDecimalBrlExibicao(monetario);
    }
    return promocaoScenario != null ? resolverPrecoVendaPromocaoPainelExibicao(promocaoScenario) : null;
  }, [promocaoScenario, simulacaoUsaPrecoManual, manualPrecoSimulacaoBrl, manualPriceRecord]);

  const promocaoPrecoOriginalExibicao = useMemo(
    () =>
      promocaoScenario != null
        ? resolverPrecoOriginalPromocaoExibicao(promocaoScenario, catalogRow)
        : null,
    [promocaoScenario, catalogRow],
  );

  const forcarLinhaDescontoSeller = useMemo(
    () => (promocaoScenario != null ? promocaoTemDescontoSeller(promocaoScenario) : false),
    [promocaoScenario],
  );

  const descontoSellerPromocaoExibicao = useMemo(
    () => (promocaoScenario != null ? resolverDescontoSellerPromocaoExibicao(promocaoScenario) : null),
    [promocaoScenario],
  );

  const contextoSelecaoPromocao = useMemo(
    () => (promocaoScenario != null ? extrairContextoSelecaoPromocao(promocaoScenario) : null),
    [promocaoScenario],
  );

  const promotionSelection = useMemo(
    () => montarPayloadSelecaoPromocaoSimulacao(contextoSelecaoPromocao),
    [contextoSelecaoPromocao],
  );

  const intents = useMemo(() => {
    /** @type {Partial<Record<ListingTypeChoice, { kind: "preco"; value: number } | null>>} */
    const out = {};
    if (
      promocaoScenario != null &&
      !promocaoBetaPermiteSimulacaoEfetiva(promocaoScenario, manualPriceRecord)
    ) {
      return out;
    }
    if (precoPromocao == null || !(precoPromocao > 0)) {
      return out;
    }
    const valor = Math.round(precoPromocao * 100) / 100;
    for (const tipo of TIPOS) {
      out[tipo] = { kind: "preco", value: valor };
    }
    return out;
  }, [precoPromocao, promocaoScenario, manualPriceRecord]);

  const simOficial = useSimulacaoOficialListingType({
    listingExternalId,
    listingId,
    intents,
    configuracaoFinanceira,
    promotionSelection,
  });

  const obterCenarioExibicao = useCallback(
    (/** @type {ListingTypeChoice} */ tipo) => {
      if (promocaoScenario == null) return null;
      const simScenario = simOficial[tipo]?.scenario ?? null;
      const precoBrlAtual =
        manualPrecoSimulacaoBrl ??
        (precoPromocao != null && precoPromocao > 0 ? precoPromocao.toFixed(2) : null);
      return resolverCenarioPromocaoPorListingType(
        promocaoScenario,
        tipo,
        simScenario,
        listingExternalId,
        precoBrlAtual,
      );
    },
    [promocaoScenario, simOficial, listingExternalId, precoPromocao, manualPrecoSimulacaoBrl],
  );

  const cfg = configuracaoFinanceira;

  const cards = useMemo(() => {
    return TIPOS.map((tipo) => {
      const isAtual = currentListingType === tipo;
      const scenarioObj = obterCenarioExibicao(tipo);
      const st = simOficial[tipo];
      const selectedFinancialKey = montarChaveCenarioFinanceiroPromocao({
        listingExternalId,
        listingId,
        listingType: tipo,
        precoPromocao,
        configuracaoFinanceira: cfg,
        promotionSelection,
      });
      const cenarioFinanceiroPendente = resolverCenarioFinanceiroPromocaoPendente({
        selectedKey: selectedFinancialKey,
        renderedKey: st?.key ?? null,
        loading: st?.loading === true,
      });
      const metricas =
        scenarioObj != null ? extrairCoeficientesCenarioBaseline(scenarioObj) : null;
      const precoUnitario =
        metricas != null && Number.isFinite(metricas.precoVenda) && metricas.precoVenda > 0
          ? metricas.precoVenda
          : precoPromocao;

      const { lines: contingencyLines } = montarLinhasMargemContingencia(scenarioObj, {
        mlAdsEnabled: cfg.mlAdsEnabled,
        mlAdsPct: cfg.mlAdsPct,
        mlAdsLabel: cfg.mlAdsLabel,
        reserveEnabled: cfg.reserveEnabled,
        reservePct: cfg.reservePct,
        reserveLabel: cfg.reserveLabel,
        precoUnitarioBrl: precoUnitario,
        exibirLinhasInativas: true,
      });

      const cenarioExibivel = scenarioObj != null;
      const carregando =
        !precoContratoIndisponivel &&
        !cenarioExibivel &&
        st?.erro == null &&
        (st?.loading === true || precoPromocao == null);
      const erro =
        !cenarioExibivel && !carregando && st?.erro != null ? String(st.erro).trim() : null;

      const promocaoCardViewModel =
        promocaoScenario != null && scenarioObj != null
          ? buildPromotionCardViewModel({
              selectedPromotion: promocaoScenario,
              scenario: scenarioObj,
              listingType: tipo,
              listingExternalId,
              promocaoPrecoVendaExibicaoOverride: promocaoPrecoExibicao,
              componentName: "usePromocaoClassicPremiumCompare",
              renderPhase: cenarioFinanceiroPendente ? "loading" : "final",
            })
          : null;

      return {
        type: tipo,
        title: listingTypeScenarioTitle(tipo),
        pill: listingTypePillLabel(tipo),
        scenario: scenarioObj,
        group: promocaoGroup,
        isAtual,
        contingencyLines,
        promocaoPrecoVendaExibicao: promocaoPrecoExibicao,
        promocaoPrecoOriginalExibicao,
        carregando,
        erro,
        recalculando: cenarioExibivel && cenarioFinanceiroPendente,
        cenarioFinanceiroPendente,
        selectedFinancialKey,
        renderedFinancialKey: st?.key ?? null,
        promocaoCardViewModel,
        precoContratoIndisponivel,
        simulacaoManualAtiva: simulacaoUsaPrecoManual === true,
      };
    });
  }, [
    obterCenarioExibicao,
    simOficial,
    currentListingType,
    promocaoGroup,
    promocaoPrecoExibicao,
    promocaoPrecoOriginalExibicao,
    precoPromocao,
    cfg,
    promotionSelection,
    promocaoScenario,
    listingExternalId,
    listingId,
    precoContratoIndisponivel,
    simulacaoUsaPrecoManual,
  ]);

  useEffect(() => {
    if (promocaoScenario == null || typeof promocaoScenario !== "object") return;
    const promo = /** @type {Record<string, unknown>} */ (promocaoScenario);
    const { ajustes, sourcePath } = resolverAjustesFinanceirosPromocaoComOrigem(promo);
    logPromotionSelectedFeeDiscountSource({
      listing_id: listingExternalId,
      promotion_id:
        promotionSelection?.promotion_id != null ? String(promotionSelection.promotion_id) : null,
      promotion_name: promocaoNome,
      selected_marketplace_fee_discount_brl:
        ajustes?.marketplace_fee_discount_brl != null
          ? String(ajustes.marketplace_fee_discount_brl)
          : null,
      selected_source_path: sourcePath,
      has_selected_fee_discount: ajustes?.has_marketplace_fee_discount === true,
    });
  }, [promocaoScenario, listingExternalId, promotionSelection, promocaoNome]);

  useEffect(() => {
    if (promocaoScenario == null || cards.length === 0) return;
    const classicCard = cards.find((c) => c.type === "classic");
    const premiumCard = cards.find((c) => c.type === "premium");
    logPromotionCardFinancialLoadingState({
      listingExternalId,
      promocaoScenario,
      classicCard,
      premiumCard,
    });
  }, [cards, promocaoScenario, listingExternalId]);

  useEffect(() => {
    if (promocaoScenario == null || cards.length === 0) return;
    logPiPromoClassicPremiumContractAudit({
      cards,
      promocaoScenario,
      listingExternalId,
      promocaoNome,
      descontoSellerPromocaoExibicao,
    });
    logPromotionSelectedContractAudit({
      listingExternalId,
      promocaoScenario,
      selectedFrom: "promotion_mini_card",
      classicScenario: cards.find((c) => c.type === "classic")?.scenario ?? null,
      premiumScenario: cards.find((c) => c.type === "premium")?.scenario ?? null,
    });
    const originalHit =
      promocaoScenario != null ? resolverPrecoOriginalPromocaoMonetario(promocaoScenario, catalogRow) : null;
    logPromotionCalcCardUxOriginalPrice({
      listingExternalId,
      promocaoScenario,
      catalogRow,
      promocaoNome,
      originalHit,
      selectedFinalPrice: precoPromocao,
    });
  }, [
    cards,
    promocaoScenario,
    listingExternalId,
    promocaoNome,
    descontoSellerPromocaoExibicao,
    catalogRow,
    precoPromocao,
  ]);

  return {
    cards,
    promocaoScenario,
    promocaoNome,
    promocaoPrecoExibicao,
    promocaoPrecoOriginalExibicao,
    forcarLinhaDescontoSeller,
    descontoSellerPromocaoExibicao,
    precoContratoIndisponivel,
    aguardandoPrecoManual,
    simulacaoManualAtiva: simulacaoUsaPrecoManual === true,
    currentListingType: inferListingTypeFromCatalogRow(catalogRow),
  };
}
