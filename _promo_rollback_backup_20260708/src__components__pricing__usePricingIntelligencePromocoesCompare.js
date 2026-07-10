// ======================================================
// PI — Estado compartilhado da aba Promoções (seleção única + compare Clássico/Premium).
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { obterContratoPrecoMiniCardPromocao } from "./pricingPromotionCardContract.js";

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
  const initialSnapshotCapturedRef = useRef(/** @type {string | null} */ (null));
  const selectedPromotionRequestIdRef = useRef(0);
  const [snapshotGeneration, setSnapshotGeneration] = useState(0);
  const [selectedPromotionRequestId, setSelectedPromotionRequestId] = useState(0);

  useEffect(() => {
    snapshotStoreRef.current = {};
    initialSnapshotCapturedRef.current = null;
    setSnapshotGeneration((g) => g + 1);
  }, [listingHintForAudit]);

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
  }, [rows, listingHintForAudit]);

  useEffect(() => {
    setPromocaoAtivaId((prev) => {
      const next = sincronizarPromocaoAtiva(prev, opcoes);
      if (prev == null && next == null && opcoes.length > 0) {
        return resolverPromocaoAtivaInicial(opcoes);
      }
      return next;
    });
  }, [opcoes]);

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
  };
}
