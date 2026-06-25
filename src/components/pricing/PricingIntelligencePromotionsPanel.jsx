// ======================================================
// PI — Aba Promoções: carrossel + card completo da promoção selecionada.
// Reaproveita PricingScenarioDetail (mesmo padrão financeiro homologado).
// ======================================================

import { useEffect, useMemo, useState } from "react";

import { PricingIntelligencePromotionsCarousel } from "./PricingIntelligencePromotionsCarousel.jsx";
import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";
import { resolvePromotionSelectionId } from "./pricingPromotionCarouselUi.js";
import { logPiPromosAuditPanel, logPiPromoFinAudit, logPiPromoFinAuditDeep } from "./pricingPromotionsAudit.js";
import { buildPiPromoFlowAuditFromScenario, logPiPromoFlowAudit } from "./piPromoFlowAudit.js";

/**
 * @param {{
 *   rows: { scenario: unknown; group: string }[];
 *   listingHintForAudit?: string;
 * }} props
 */
export function PricingIntelligencePromotionsPanel({ rows, listingHintForAudit = "" }) {
  const opcoes = useMemo(
    () =>
      rows.map((row, index) => ({
        row,
        selectionId: resolvePromotionSelectionId(row, index),
      })),
    [rows],
  );

  const [selectedSelectionId, setSelectedSelectionId] = useState(/** @type {string | null} */ (null));

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
    if (opcoes.length === 0) {
      setSelectedSelectionId(null);
      return;
    }
    setSelectedSelectionId((prev) => {
      if (prev != null && opcoes.some((o) => o.selectionId === prev)) return prev;
      return opcoes[0].selectionId;
    });
  }, [opcoes]);

  const linhaSelecionada = useMemo(() => {
    if (opcoes.length === 0) return null;
    const hit = opcoes.find((o) => o.selectionId === selectedSelectionId);
    return hit?.row ?? opcoes[0].row;
  }, [opcoes, selectedSelectionId]);

  const detalheKey =
    linhaSelecionada != null
      ? opcoes.find((o) => o.row === linhaSelecionada)?.selectionId ?? "promo-detail"
      : "promo-detail";

  if (rows.length === 0) {
    return (
      <div className="pricing-intelligence-page__promotions-empty-state" role="status">
        <p className="pricing-intelligence-page__promotions-empty-state-title">
          Nenhuma promoção disponível
        </p>
        <p className="pricing-intelligence-page__promotions-empty-state-subtitle">
          Quando o marketplace liberar promoções para este anúncio, elas aparecerão aqui para comparação.
        </p>
      </div>
    );
  }

  return (
    <div className="pricing-intelligence-page__promotions-panel">
      <PricingIntelligencePromotionsCarousel
        rows={rows}
        selectedSelectionId={selectedSelectionId}
        onSelectSelectionId={setSelectedSelectionId}
      />

      {linhaSelecionada != null ? (
        <div
          key={detalheKey}
          className="pricing-intelligence-page__promotion-detail-wrap pricing-intelligence-page__promotion-detail-wrap--animate"
        >
          <PricingScenarioDetail
            scenario={linhaSelecionada.scenario}
            group={linhaSelecionada.group}
            hideBreakEvenInResult
            listingHintForAudit={listingHintForAudit}
            layoutPiFixo
          />
        </div>
      ) : null}
    </div>
  );
}
