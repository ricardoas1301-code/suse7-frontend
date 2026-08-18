// ======================================================
// PI — Dois cards Clássico × Premium da promoção selecionada (aba Promoções).
// Rollback last-good: cada card usa o cenário simulado do próprio listing_type (isolado).
// A referência oficial (SSOT do anúncio atual) é passada só como apoio, sem colapsar cards.
// ======================================================

import { useMemo } from "react";

import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";
import { usePromocoesCompareContext } from "./PricingIntelligencePromotionsCompareContext.jsx";
import { usePromocaoClassicPremiumCompare } from "./usePromocaoClassicPremiumCompare.js";
import {
  PROMOTION_BETA_CENTRAL_MESSAGE,
  PROMOTION_BETA_CENTRAL_TITLE,
  promocaoBetaPrecoConfirmado,
  promocaoExibeRodapePrecoManualInformado,
} from "../../features/pricing/promotions/promotionBetaPricePresentation.js";
import { isValidDecimalMoneyString } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import { inferListingTypeFromCatalogRow, listingTypePillLabel } from "./pricingListingTypeUi.js";

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
    obterPrecoManualSimulacaoAtivo,
  } = usePromocoesCompareContext();

  const manualPrecoAtivo = obterPrecoManualSimulacaoAtivo();
  const promocaoScenario = linhaAtiva?.scenario ?? null;
  const simulacaoUsaPrecoManual =
    promocaoScenario != null &&
    promocaoBetaPrecoConfirmado(promocaoScenario) !== true &&
    manualPrecoAtivo?.source === "USER_PROVIDED_SIMULATION_PRICE" &&
    isValidDecimalMoneyString(manualPrecoAtivo.priceBrl);

  const exibirRodapePrecoManual = promocaoExibeRodapePrecoManualInformado(manualPrecoAtivo);

  const { cards, promocaoNome, promocaoPrecoOriginalExibicao, aguardandoPrecoManual } =
    usePromocaoClassicPremiumCompare({
    promocaoRow: linhaAtiva,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    listingHintForAudit,
    configuracaoFinanceira,
    manualPrecoSimulacaoBrl: manualPrecoAtivo?.priceBrl ?? null,
    simulacaoUsaPrecoManual,
  });

  const currentListingType = useMemo(
    () => inferListingTypeFromCatalogRow(catalogRow),
    [catalogRow],
  );

  const currentListingTypeId = currentListingType === "premium" ? "gold_pro" : "gold_special";

  // Referência oficial do anúncio ATUAL (SSOT). Só apoia o card do listing_type publicado;
  // nunca é copiada para o card do tipo oposto.
  const officialRowContract = useMemo(() => {
    const snapshot = obterSnapshotFinanceiroPromocaoAtiva(currentListingType);
    const snap = snapshot != null && typeof snapshot === "object" ? snapshot : {};
    return {
      official_promotion_row: linhaAtiva?.scenario ?? null,
      official_amount_to_receive_brl: snap.official_amount_to_receive_brl ?? null,
      current_listing_type_id: currentListingTypeId,
    };
  }, [obterSnapshotFinanceiroPromocaoAtiva, currentListingType, currentListingTypeId, linhaAtiva]);

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
            {card.precoContratoIndisponivel && aguardandoPrecoManual ? (
              <div
                className="pricing-listing-type-compare__unavailable pricing-intelligence-page__promotion-detail-slot-empty pricing-intelligence-page__promotion-detail-contract-gap pricing-intelligence-page__promotion-detail-beta-unconfirmed"
                role="status"
              >
                <p className="pricing-listing-type-compare__unavailable-title">
                  {PROMOTION_BETA_CENTRAL_TITLE}
                </p>
                <p className="pricing-listing-type-compare__unavailable-text">
                  {PROMOTION_BETA_CENTRAL_MESSAGE}
                </p>
              </div>
            ) : card.carregando ? (
              <div
                className="pricing-listing-type-compare__loading pricing-intelligence-page__promotion-detail-slot-empty"
                role="status"
                aria-busy="true"
                aria-label={`Calculando cenário oficial ${listingTypePillLabel(card.type)}`}
              >
                <div className="pricing-listing-type-compare__loading-spinner-wrap" aria-hidden="true">
                  <span className="pricing-listing-type-compare__loading-spinner" />
                </div>
                <p className="pricing-listing-type-compare__loading-title">
                  {`Carregando cenário ${listingTypePillLabel(card.type)}`}
                </p>
                <p className="pricing-listing-type-compare__loading-text">
                  Buscando preço, tarifa e envio oficiais no Mercado Livre.
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
                exibirRodapePrecoManualPromocao={exibirRodapePrecoManual}
                financialScenarioPending={card.cenarioFinanceiroPendente === true}
                promotionSelectedKey={linhaAtiva?.scenario?.promotion_id ?? null}
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
