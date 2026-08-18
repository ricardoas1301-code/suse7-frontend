// ======================================================
// PI — Estado compartilhado da aba Promoções (seleção única + compare Clássico/Premium).
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  criarRegistroPrecoManualSimulacao,
  montarIdentidadeManualPromocao,
} from "../../features/pricing/promotions/promotionManualSimulationPrice.js";

import { buildPiPromoFlowAuditFromScenario, logPiPromoFlowAudit } from "./piPromoFlowAudit.js";
import { resolvePromotionSelectionId } from "./pricingPromotionCarouselUi.js";
import {
  resolverPromocaoAtivaInicial,
  sincronizarPromocaoAtiva,
} from "./pricingPromotionCompareUi.js";
import { logPiPromosAuditPanel, logPiPromoFinAudit, logPiPromoFinAuditDeep } from "./pricingPromotionsAudit.js";
import { inferListingTypeFromCatalogRow } from "./pricingListingTypeUi.js";
import {
  capturarESalvarSnapshotsFinanceirosPromocao,
  obterSnapshotFinanceiroPromocao,
} from "../../features/pricing/promotions/capturarSnapshotFinanceiroPromocaoSelecionada.js";
import { resolverPrecoInicialPromocaoTeto, resolverMetadadosDescontoInicialPromocao } from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";
import { obterContratoPrecoMiniCardPromocao, resolverPrecoOriginalPromocaoMonetario } from "./pricingPromotionCardContract.js";
import {
  buildPromotionFinalPriceFreshnessConfirmationLog,
  buildPromotionOfficialFinalPriceCandidateFixLog,
  buildPromotionFinalPriceFreshnessAudit,
  logPromotionFinalPriceFreshnessConfirmation,
  logPromotionOfficialFinalPriceCandidateFix,
  logPromotionFinalPriceFreshnessAudit,
} from "../../features/pricing/promotions/resolvePromotionOfficialFinalPrice.js";
import {
  buildPromotionFailClosedRuntimeAudit,
  logPromotionFailClosedRuntimeEnforcement,
} from "../../features/pricing/promotions/promotionFinalTruthPresentationGate.js";
import { promocaoBetaPrecoConfirmado } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";
import { decimalBrlParaNumeroSimulacao } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import {
  agendarHidratacaoAutomaticaManifesto,
  resetFilaHidratacaoPromocoes,
  writeThroughHidratacaoPromocaoConfirmada,
} from "./promotionScenarioHydrationQueue.js";
import { notificarRevisaoFinanceiraListing } from "./pricingFinancialScenarioStore.js";

/**
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string} listingHintForAudit
 * @param {unknown} mlScenariosPayload
 * @param {{ scenario: unknown; group: string } | null} baselineRow
 * @param {Record<string, unknown> | null | undefined} catalogRow
 * @param {Record<string, unknown>} configuracaoFinanceira
 */
export function usePricingIntelligencePromocoesCompare(
  rows,
  listingHintForAudit = "",
  mlScenariosPayload = null,
  baselineRow = null,
  catalogRow = null,
  configuracaoFinanceira = {},
) {
  const opcoes = useMemo(
    () =>
      rows.map((row, index) => ({
        row,
        selectionId: resolvePromotionSelectionId(row, index),
      })),
    [rows],
  );

  const [promocaoAtivaId, setPromocaoAtivaId] = useState(
    /** @type {string | null} */ (null),
  );

  const snapshotStoreRef = useRef(/** @type {Record<string, Record<string, unknown>>} */ ({}));
  const manualPriceMapRef = useRef(
    /** @type {Map<string, import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord>} */ (
      new Map()
    ),
  );
  const promotionCeilingMapRef = useRef(
    /** @type {Map<string, { ceilingBrl: string; source: string; initialDiscountPercentDec?: string; initialDiscountPercentDisplay?: string }>} */ (
      new Map()
    ),
  );
  const initialSnapshotCapturedRef = useRef(/** @type {string | null} */ (null));
  const selectedPromotionRequestIdRef = useRef(0);
  const [snapshotGeneration, setSnapshotGeneration] = useState(0);
  const [manualPriceGeneration, setManualPriceGeneration] = useState(0);
  const [selectedPromotionRequestId, setSelectedPromotionRequestId] = useState(0);

  const accountId = useMemo(() => {
    if (catalogRow != null && typeof catalogRow === "object") {
      const id =
        /** @type {Record<string, unknown>} */ (catalogRow).account_id ??
        /** @type {Record<string, unknown>} */ (catalogRow).accountId ??
        null;
      if (id != null && String(id).trim() !== "") return String(id).trim();
    }
    return null;
  }, [catalogRow]);

  useEffect(() => {
    snapshotStoreRef.current = {};
    manualPriceMapRef.current.clear();
    promotionCeilingMapRef.current.clear();
    initialSnapshotCapturedRef.current = null;
    resetFilaHidratacaoPromocoes(listingHintForAudit || null, null);
    setSnapshotGeneration((g) => g + 1);
    setManualPriceGeneration((g) => g + 1);
  }, [listingHintForAudit]);

  useEffect(() => {
    return () => {
      manualPriceMapRef.current.clear();
      promotionCeilingMapRef.current.clear();
    };
  }, []);

  const resolverIdentidadePromocao = useCallback(
    (selectionId) => {
      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row == null) return null;
      const index = opcoes.findIndex((o) => o.selectionId === selectionId);
      return montarIdentidadeManualPromocao({
        row: opcao.row,
        index: index >= 0 ? index : 0,
        listingExternalId: listingHintForAudit || null,
        accountId,
      });
    },
    [opcoes, listingHintForAudit, accountId],
  );

  // S4.3.6.26 — ao abrir/atualizar Promoções, hidrata automaticamente todas as elegíveis.
  useEffect(() => {
    if (opcoes.length === 0) return;
    const listingType = inferListingTypeFromCatalogRow(catalogRow) ?? "premium";
    const listingId =
      catalogRow != null && typeof catalogRow === "object"
        ? String(/** @type {Record<string, unknown>} */ (catalogRow).id ?? "").trim() || null
        : null;
    agendarHidratacaoAutomaticaManifesto({
      opcoes,
      obterPrecoManual: (selectionId) => {
        const identity = resolverIdentidadePromocao(selectionId);
        if (identity == null) return null;
        return manualPriceMapRef.current.get(identity.identityKey) ?? null;
      },
      promocaoAtivaId,
      listingExternalId: listingHintForAudit || null,
      listingId,
      listingType: listingType === "classic" ? "classic" : "premium",
      configuracaoFinanceira,
    });
  }, [
    opcoes,
    promocaoAtivaId,
    listingHintForAudit,
    catalogRow,
    configuracaoFinanceira,
    resolverIdentidadePromocao,
    manualPriceGeneration,
  ]);

  const capturarTetoPromocionalInicial = useCallback(
    (selectionId) => {
      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row == null) return;
      const identity = resolverIdentidadePromocao(selectionId);
      if (identity == null) return;

      const existing = promotionCeilingMapRef.current.get(identity.identityKey);
      // Nunca sobrescrever teto criado por entrada explícita do seller.
      if (existing?.source === "MANUAL_SELLER_INPUT") return;

      const confirmed = promocaoBetaPrecoConfirmado(opcao.row.scenario);
      const teto = resolverPrecoInicialPromocaoTeto(opcao.row.scenario);

      // S4.3.6.17 — invalidar teto stale derivado de candidato rejeitado (suggested/real).
      if (!confirmed && existing?.source === "INITIAL_PROMOTION_PRICE") {
        const safeTeto = teto;
        if (safeTeto == null || existing.ceilingBrl !== safeTeto) {
          promotionCeilingMapRef.current.delete(identity.identityKey);
        } else {
          return;
        }
      } else if (existing != null) {
        return;
      }

      if (teto != null && String(teto).trim() !== "") {
        const originalHit = resolverPrecoOriginalPromocaoMonetario(opcao.row.scenario, catalogRow);
        const metaDesconto =
          originalHit?.valor != null && originalHit.valor > 0
            ? resolverMetadadosDescontoInicialPromocao(String(originalHit.valor), teto)
            : null;
        promotionCeilingMapRef.current.set(identity.identityKey, {
          ceilingBrl: teto,
          source: "INITIAL_PROMOTION_PRICE",
          ...(metaDesconto ?? {}),
        });
        setManualPriceGeneration((g) => g + 1);
      }
    },
    [opcoes, resolverIdentidadePromocao, catalogRow],
  );

  useEffect(() => {
    for (const { selectionId } of opcoes) {
      capturarTetoPromocionalInicial(selectionId);
    }
  }, [opcoes, capturarTetoPromocionalInicial, listingHintForAudit]);

  const registrarSnapshotFinanceiroDaLinha = useCallback(
    (row, selectionId = null, requestId = null) => {
      if (row == null) return requestId;
      const rid =
        requestId != null
          ? requestId
          : String(selectedPromotionRequestIdRef.current);
      capturarESalvarSnapshotsFinanceirosPromocao(snapshotStoreRef.current, {
        row,
        listingExternalId: listingHintForAudit || null,
        currentListingType: inferListingTypeFromCatalogRow(catalogRow),
        selectionId,
        requestId: rid,
      });
      setSnapshotGeneration((g) => g + 1);
      return rid;
    },
    [listingHintForAudit, catalogRow],
  );

  useEffect(() => {
    logPiPromosAuditPanel(rows, listingHintForAudit || null);
    logPiPromoFinAudit(rows, listingHintForAudit || null);
    logPiPromoFinAuditDeep(rows, listingHintForAudit || null);
    for (const { scenario } of rows) {
      const payload = buildPiPromoFlowAuditFromScenario(scenario);
      const name = payload.promotion_name != null ? String(payload.promotion_name) : "";
      if (!name.toLowerCase().includes("aumente") || !name.toLowerCase().includes("vendas")) continue;
      logPiPromoFlowAudit("frontend_before_PricingScenarioDetail", payload);
    }
    // S1.PROMO-FINAL-PRICE-FRESHNESS-AND-CANDIDATE-AUDIT — read-only, camada frontend_contract.
    const skuAudit =
      catalogRow != null && typeof catalogRow === "object"
        ? (/** @type {Record<string, unknown>} */ (catalogRow).sku ??
            /** @type {Record<string, unknown>} */ (catalogRow).seller_sku ??
            null)
        : null;
    for (const { scenario } of rows) {
      const auditPayload = buildPromotionFinalPriceFreshnessAudit({
        scenario,
        listingId: listingHintForAudit || null,
        sku: skuAudit != null ? String(skuAudit) : null,
        sourceLayer: "frontend_contract",
      });
      logPromotionFinalPriceFreshnessAudit(auditPayload);
      logPromotionOfficialFinalPriceCandidateFix(
        buildPromotionOfficialFinalPriceCandidateFixLog(auditPayload),
      );
      logPromotionFinalPriceFreshnessConfirmation(
        buildPromotionFinalPriceFreshnessConfirmationLog(auditPayload),
      );
      // S4.3.6.17 — auditoria fail-closed runtime (homologação).
      logPromotionFailClosedRuntimeEnforcement(
        buildPromotionFailClosedRuntimeAudit({
          listingId: listingHintForAudit || null,
          scenario,
          accountId,
          manualPriceRecord: null,
        }),
      );
    }
  }, [rows, listingHintForAudit, catalogRow, accountId]);

  useEffect(() => {
    setPromocaoAtivaId((prev) => {
      const next = sincronizarPromocaoAtiva(prev, opcoes);
      if (prev == null && next == null && opcoes.length > 0) {
        return resolverPromocaoAtivaInicial(opcoes, (selectionId) => {
          const identity = resolverIdentidadePromocao(selectionId);
          if (identity == null) return null;
          return manualPriceMapRef.current.get(identity.identityKey) ?? null;
        });
      }
      return next;
    });
  }, [opcoes, resolverIdentidadePromocao]);

  const handleSelecionarPromocao = useCallback(
    (selectionId) => {
      selectedPromotionRequestIdRef.current += 1;
      const requestId = String(selectedPromotionRequestIdRef.current);
      setSelectedPromotionRequestId(selectedPromotionRequestIdRef.current);

      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row != null) {
        registrarSnapshotFinanceiroDaLinha(opcao.row, selectionId, requestId);
        initialSnapshotCapturedRef.current = selectionId;
      }
      setPromocaoAtivaId(selectionId);
    },
    [opcoes, registrarSnapshotFinanceiroDaLinha],
  );

  const linhaAtiva = useMemo(() => {
    if (promocaoAtivaId == null) return null;
    return opcoes.find((o) => o.selectionId === promocaoAtivaId)?.row ?? null;
  }, [opcoes, promocaoAtivaId]);

  useEffect(() => {
    if (promocaoAtivaId == null) return;
    if (initialSnapshotCapturedRef.current === promocaoAtivaId) return;
    const opcao = opcoes.find((o) => o.selectionId === promocaoAtivaId);
    if (opcao?.row == null) return;
    selectedPromotionRequestIdRef.current += 1;
    const requestId = String(selectedPromotionRequestIdRef.current);
    setSelectedPromotionRequestId(selectedPromotionRequestIdRef.current);
    registrarSnapshotFinanceiroDaLinha(opcao.row, promocaoAtivaId, requestId);
    initialSnapshotCapturedRef.current = promocaoAtivaId;
  }, [promocaoAtivaId, opcoes, registrarSnapshotFinanceiroDaLinha]);

  const obterPrecoManualSimulacao = useCallback(
    (selectionId) => {
      if (selectionId == null || String(selectionId).trim() === "") return null;
      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row == null) return null;
      const index = opcoes.findIndex((o) => o.selectionId === selectionId);
      const identity = montarIdentidadeManualPromocao({
        row: opcao.row,
        index: index >= 0 ? index : 0,
        listingExternalId: listingHintForAudit || null,
        accountId,
      });
      return manualPriceMapRef.current.get(identity.identityKey) ?? null;
    },
    [opcoes, listingHintForAudit, accountId, manualPriceGeneration],
  );

  const obterPrecoManualSimulacaoAtivo = useCallback(() => {
    if (promocaoAtivaId == null) return null;
    return obterPrecoManualSimulacao(promocaoAtivaId);
  }, [obterPrecoManualSimulacao, promocaoAtivaId, manualPriceGeneration]);

  const obterTetoPromocionalSimulacao = useCallback(
    (selectionId) => {
      const identity = resolverIdentidadePromocao(selectionId);
      if (identity == null) return null;
      return promotionCeilingMapRef.current.get(identity.identityKey) ?? null;
    },
    [resolverIdentidadePromocao, manualPriceGeneration],
  );

  const definirPrecoManualSimulacao = useCallback(
    (selectionId, priceBrl) => {
      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row == null) return null;
      const index = opcoes.findIndex((o) => o.selectionId === selectionId);
      const identity = montarIdentidadeManualPromocao({
        row: opcao.row,
        index: index >= 0 ? index : 0,
        listingExternalId: listingHintForAudit || null,
        accountId,
      });
      if (!promotionCeilingMapRef.current.has(identity.identityKey)) {
        promotionCeilingMapRef.current.set(identity.identityKey, {
          ceilingBrl: priceBrl,
          source: "MANUAL_SELLER_INPUT",
        });
      }
      const registro = criarRegistroPrecoManualSimulacao({
        identityKey: identity.identityKey,
        priceBrl,
        identity,
      });
      manualPriceMapRef.current.set(identity.identityKey, registro);
      setManualPriceGeneration((g) => g + 1);

      // S4.3.6.26 — write-through imediato: publica cenário completo no cache/SSOT.
      const salePrice = decimalBrlParaNumeroSimulacao(priceBrl);
      const listingType = inferListingTypeFromCatalogRow(catalogRow) ?? "premium";
      const listingId =
        catalogRow != null && typeof catalogRow === "object"
          ? String(/** @type {Record<string, unknown>} */ (catalogRow).id ?? "").trim() || null
          : null;
      if (salePrice != null && salePrice > 0) {
        const revision = Date.now();
        void writeThroughHidratacaoPromocaoConfirmada({
          listingExternalId: listingHintForAudit || null,
          listingId,
          listingType: listingType === "classic" ? "classic" : "premium",
          salePrice,
          scenario: opcao.row.scenario,
          selectionId,
          configuracaoFinanceira,
          selectedFinalPriceOverride: priceBrl,
          revision,
        }).then((result) => {
          if (result?.ok) {
            notificarRevisaoFinanceiraListing(listingHintForAudit || null, listingId);
            setManualPriceGeneration((g) => g + 1);
          }
        });
      }

      return registro;
    },
    [opcoes, listingHintForAudit, accountId, catalogRow, configuracaoFinanceira],
  );

  const limparPrecoManualSimulacao = useCallback(
    (selectionId) => {
      const opcao = opcoes.find((o) => o.selectionId === selectionId);
      if (opcao?.row == null) return;
      const index = opcoes.findIndex((o) => o.selectionId === selectionId);
      const identity = montarIdentidadeManualPromocao({
        row: opcao.row,
        index: index >= 0 ? index : 0,
        listingExternalId: listingHintForAudit || null,
        accountId,
      });
      manualPriceMapRef.current.delete(identity.identityKey);
      setManualPriceGeneration((g) => g + 1);
    },
    [opcoes, listingHintForAudit, accountId],
  );

  const limparTodosPrecosManualSimulacao = useCallback(() => {
    manualPriceMapRef.current.clear();
    setManualPriceGeneration((g) => g + 1);
  }, []);

  const obterSnapshotFinanceiroPromocaoAtiva = useCallback(
    (listingType) => {
      if (promocaoAtivaId == null) return null;
      if (linhaAtiva?.scenario != null && typeof linhaAtiva.scenario === "object") {
        const promo = /** @type {Record<string, unknown>} */ (linhaAtiva.scenario);
        const cardPreco = obterContratoPrecoMiniCardPromocao(promo);
        const promotionId =
          promo.promotion_id != null
            ? String(promo.promotion_id)
            : cardPreco?.promotion_id != null
              ? String(cardPreco.promotion_id)
              : null;
        return (
          obterSnapshotFinanceiroPromocao(snapshotStoreRef.current, {
            listing_id: listingHintForAudit || null,
            selection_id: promocaoAtivaId,
            promotion_id: promotionId,
            listing_type: listingType,
          }) ?? null
        );
      }
      return obterSnapshotFinanceiroPromocao(snapshotStoreRef.current, {
        listing_id: listingHintForAudit || null,
        selection_id: promocaoAtivaId,
        listing_type: listingType,
      });
    },
    [linhaAtiva, listingHintForAudit, promocaoAtivaId, snapshotGeneration],
  );

  return {
    rows,
    opcoes,
    promocaoAtivaId,
    linhaAtiva,
    listingHintForAudit,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    configuracaoFinanceira,
    handleSelecionarPromocao,
    obterSnapshotFinanceiroPromocaoAtiva,
    selectedPromotionRequestId,
    snapshotGeneration,
    manualPriceGeneration,
    obterPrecoManualSimulacao,
    obterPrecoManualSimulacaoAtivo,
    obterTetoPromocionalSimulacao,
    definirPrecoManualSimulacao,
    limparPrecoManualSimulacao,
    limparTodosPrecosManualSimulacao,
    accountId,
  };
}
