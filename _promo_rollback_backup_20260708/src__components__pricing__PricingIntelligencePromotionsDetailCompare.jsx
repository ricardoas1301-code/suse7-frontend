// ======================================================
// PI — Dois cards Clássico × Premium da promoção selecionada (aba Promoções).
// v8 — contratos isolados: cada card usa o cenário simulado do próprio listing_type.
// ======================================================

import { useEffect, useMemo } from "react";

import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";
import { usePromocoesCompareContext } from "./PricingIntelligencePromotionsCompareContext.jsx";
import { usePromocaoClassicPremiumCompare } from "./usePromocaoClassicPremiumCompare.js";
import { inferListingTypeFromCatalogRow, listingTypePillLabel } from "./pricingListingTypeUi.js";
import {
  logPromoV8ChangedFilesAudit,
  resolveOfficialRowContract,
} from "../../features/pricing/promotions/promotionParityContractV8.js";

const V8_CHANGED_FILES = [
  "promotionParityContractV8.js (novo)",
  "promotionRevenueFinancialSanityV7.js (mantido como base de fontes confiáveis)",
  "buildPromotionRevenueRowsFinal.js (extrator de marketplace mantido)",
  "capturarSnapshotFinanceiroPromocaoSelecionada.js (snapshot = official row)",
  "PromotionPiRevenueMarketplaceSection.jsx (render v8 isolado)",
  "PricingIntelligencePromotionsDetailCompare.jsx (orquestra 3 contratos)",
  "usePricingIntelligencePromocoesCompare.js (sem congelamento)",
  "PricingScenarioDetail.jsx (props v8)",
  "MercadoLivrePricingScenarioCompareGrid.jsx (props v8)",
  "MercadoLivrePricingScenarioRaiox.jsx (props v8)",
];

export function PricingIntelligencePromotionsDetailCompare() {
  const {
    rows,
    linhaAtiva,
    listingHintForAudit,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    configuracaoFinanceira,
    obterSnapshotFinanceiroPromocaoAtiva,
    selectedPromotionRequestId,
  } = usePromocoesCompareContext();

  const { cards, promocaoNome, promocaoPrecoOriginalExibicao } = usePromocaoClassicPremiumCompare({
    promocaoRow: linhaAtiva,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    listingHintForAudit,
    configuracaoFinanceira,
  });

  const currentListingType = useMemo(
    () => inferListingTypeFromCatalogRow(catalogRow),
    [catalogRow],
  );

  const officialRowContract = useMemo(() => {
    const snapshot = obterSnapshotFinanceiroPromocaoAtiva(currentListingType);
    return resolveOfficialRowContract({
      officialPromotionRow: linhaAtiva?.scenario ?? null,
      promotionSnapshot: snapshot,
      currentListingType,
    });
  }, [obterSnapshotFinanceiroPromocaoAtiva, currentListingType, linhaAtiva]);

  useEffect(() => {
    logPromoV8ChangedFilesAudit({
      phase: "mount",
      listing_id: listingHintForAudit || null,
      current_listing_type: currentListingType,
      changed_files: V8_CHANGED_FILES,
    });
  }, [listingHintForAudit, currentListingType]);

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

  if (linhaAtiva == null) {
    return (
      <div className="pricing-intelligence-page__promotions-empty-state" role="status">
        <p className="pricing-intelligence-page__promotions-empty-state-title">Selecione uma promoção</p>
        <p className="pricing-intelligence-page__promotions-empty-state-subtitle">
          Escolha uma promoção à direita para comparar Clássico e Premium.
        </p>
      </div>
    );
  }

  return (
    <div
      className="pricing-listing-type-compare pricing-listing-type-compare--pi-dual pricing-listing-type-compare--promotions-dual"
      role="group"
      aria-label="Comparativo Clássico e Premium da promoção selecionada"
    >
      {cards.map((card) => {
        return (
          <div
            key={`promo-listing-type-${card.type}`}
            className={[
              "pricing-listing-type-compare__col",
              card.isAtual ? "pricing-listing-type-compare__col--atual" : "pricing-listing-type-compare__col--alt",
              card.recalculando ? "pricing-listing-type-compare__col--recalculando" : "",
              card.carregando ? "pricing-listing-type-compare__col--loading" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-listing-type={card.type}
            data-listing-type-atual={card.isAtual ? "true" : "false"}
            data-recalculando={card.recalculando ? "true" : undefined}
          >
            {card.carregando ? (
              <div
                className="pricing-listing-type-compare__loading pricing-intelligence-page__promotion-detail-slot-empty"
                role="status"
                aria-busy="true"
              >
                <p className="pricing-listing-type-compare__unavailable-title">
                  {listingTypePillLabel(card.type)}
                </p>
                <p className="pricing-listing-type-compare__unavailable-text">
                  Calculando cenário oficial desta promoção…
                </p>
              </div>
            ) : card.scenario != null ? (
              <PricingScenarioDetail
                key={`promo-pi-card-${card.type}-${card.selectedFinancialKey ?? "none"}-${card.renderedFinancialKey ?? "none"}-${selectedPromotionRequestId}`}
                scenario={card.scenario}
                group={card.group}
                baselineListingTypeBadge={listingTypePillLabel(card.type)}
                listingTypeSelectionBadge={card.isAtual ? "Vendendo" : "Alternativa"}
                hideBreakEvenInResult
                listingHintForAudit={listingHintForAudit}
                contingencyLines={card.contingencyLines}
                strategicReserveLines={[]}
                exibirReservaEstrategica={false}
                promocaoPrecoVendaExibicaoOverride={card.promocaoPrecoVendaExibicao}
                promocaoNomeExibicao={promocaoNome}
                promocaoPrecoOriginalExibicao={card.promocaoPrecoOriginalExibicao ?? promocaoPrecoOriginalExibicao}
                layoutCabecalhoPromocaoPi
                scheduledPromoBadgeAsAvailable
                layoutPiFixo
                financialScenarioPending={card.cenarioFinanceiroPendente === true}
                promotionSelectedKey={officialRowContract.promotion_id ?? null}
                officialRowContract={officialRowContract}
                comparisonModel={card.type}
                isCurrentListingType={card.isAtual === true}
                selectedPromotionRequestId={selectedPromotionRequestId}
                listingTypeCard={card.type}
                promocaoCardViewModel={card.promocaoCardViewModel}
              />
            ) : (
              <div
                className="pricing-listing-type-compare__unavailable pricing-intelligence-page__promotion-detail-slot-empty"
                role="status"
              >
                <p className="pricing-listing-type-compare__unavailable-title">
                  {listingTypePillLabel(card.type)}
                </p>
                <p className="pricing-listing-type-compare__unavailable-text">
                  {card.erro != null && card.erro !== ""
                    ? card.erro
                    : "Não foi possível montar o cenário desta promoção para este tipo de anúncio."}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
