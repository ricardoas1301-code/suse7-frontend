// ======================================================

// PI — Lista compacta vertical de promoções (coluna direita da aba Promoções).

// ======================================================



import { useCallback, useEffect, useMemo } from "react";



import raioxTriggerIcon from "../../assets/raiox-trigger-icon.png";

import { usePromocoesCompareContext } from "./PricingIntelligencePromotionsCompareContext.jsx";

import "./PricingIntelligencePromotionsPanel.css";

import { resolvePromotionMiniCardMeta } from "./pricingPromotionCarouselUi.js";
import { logPiPromosAuditRendered, logPiPromoMiniCardContractAudit } from "./pricingPromotionsAudit.js";



export function PricingIntelligencePromotionsCompactPicker() {

  const { rows, promocaoAtivaId, handleSelecionarPromocao, listingHintForAudit } = usePromocoesCompareContext();



  const itens = useMemo(

    () =>

      rows.map((row, index) => ({

        row,

        meta: resolvePromotionMiniCardMeta(row, index),

      })),

    [rows],

  );



  useEffect(() => {

    logPiPromosAuditRendered(itens.length, listingHintForAudit || null);

    logPiPromoMiniCardContractAudit({
      rows,
      listingExternalId: listingHintForAudit || null,
      promocaoAtivaId,
      resolveMeta: resolvePromotionMiniCardMeta,
    });

  }, [itens.length, rows, listingHintForAudit, promocaoAtivaId]);



  const handleCardKeyDown = useCallback(

    (event, selectionId) => {

      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();

      handleSelecionarPromocao(selectionId);

    },

    [handleSelecionarPromocao],

  );



  if (rows.length === 0) return null;



  return (

    <div

      className="pricing-intelligence-page__promotions-compact-picker"

      aria-label="Promoções disponíveis para comparar"

    >

      <p className="pricing-intelligence-page__promotions-compare-hint" role="note">

        Compare a promoção selecionada nos modelos Clássico e Premium.

      </p>



      <div

        className="pricing-intelligence-page__promotions-compact-list pricing-intelligence-page__promotions-compact-list--grid-dual"

        role="listbox"

        aria-label="Selecionar promoção para comparar"

        aria-multiselectable="false"

      >

        {itens.map(({ meta }) => {

          const selecionado = promocaoAtivaId === meta.selectionId;

          const acaoVariante =

            meta.acaoRotulo === "Alterar"

              ? "alterar"

              : meta.acaoRotulo === "Participar"

                ? "participar"

                : null;



          return (

            <div

              key={meta.selectionId}

              role="option"

              tabIndex={0}

              aria-selected={selecionado}

              className={[

                "pricing-intelligence-page__promotion-mini-card",

                "pricing-intelligence-page__promotion-mini-card--compact",

                "pricing-intelligence-page__promotion-mini-card--ml-layout",

                `pricing-intelligence-page__promotion-mini-card--${meta.statusKind}`,

                selecionado ? "pricing-intelligence-page__promotion-mini-card--selected" : "",

              ]

                .filter(Boolean)

                .join(" ")}

              onClick={() => handleSelecionarPromocao(meta.selectionId)}

              onKeyDown={(event) => handleCardKeyDown(event, meta.selectionId)}

            >

              <span className="pricing-intelligence-page__promotion-mini-card-title-row">
                <span
                  className="pricing-intelligence-page__promotion-mini-card-name pricing-intelligence-page__promotion-title-ml"
                >
                  {meta.nome}
                </span>

                {meta.status || meta.isRelampago ? (
                  <span className="pricing-intelligence-page__promotion-mini-card-header-adornments">
                    {meta.status ? (
                      <span
                        className={[
                          "pricing-intelligence-page__promotion-mini-card-status",
                          "pricing-intelligence-page__promotion-mini-card-status--header",
                          `pricing-intelligence-page__promotion-mini-card-status--${meta.statusKind}`,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {meta.status}
                      </span>
                    ) : null}

                    {meta.isRelampago ? (
                      <span
                        className="pricing-intelligence-page__promotion-mini-card-lightning"
                        aria-label="Oferta relâmpago"
                        title="Oferta relâmpago"
                      >
                        <img
                          src={raioxTriggerIcon}
                          alt=""
                          aria-hidden
                          className="pricing-intelligence-page__promotion-mini-card-lightning-icon"
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>

              <span
                className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-period"
              >
                {meta.periodo}
              </span>

              {meta.fundingLinhas?.length
                ? meta.fundingLinhas.map((linha) => (
                    <span
                      key={`funding-${meta.selectionId}-${linha}`}
                      className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-funding"
                    >
                      {linha}
                    </span>
                  ))
                : null}

              {!meta.temFundingMl && meta.precoPromocional ? (
                <span
                  className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-price"
                >
                  {meta.precoPromocional}
                </span>
              ) : null}

              {!meta.temFundingMl && meta.descontoResumo ? (
                <span
                  className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-discount"
                >
                  {meta.descontoResumo}
                </span>
              ) : null}

              {!meta.temFundingMl && meta.descontoReaisResumo ? (
                <span
                  className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-discount pricing-intelligence-page__promotion-mini-card-discount--amount"
                >
                  {meta.descontoReaisResumo}
                </span>
              ) : null}

              {meta.acaoRotulo || meta.elegibilidade ? (

                <span className="pricing-intelligence-page__promotion-mini-card-footer">

                  {meta.elegibilidade ? (

                    <span

                      className="pricing-intelligence-page__promotion-mini-card-eligibility pricing-intelligence-page__promotion-mini-card-eligibility--footer"

                      title={meta.elegibilidade}

                    >

                      {meta.elegibilidade}

                    </span>

                  ) : (

                    <span

                      className="pricing-intelligence-page__promotion-mini-card-eligibility pricing-intelligence-page__promotion-mini-card-eligibility--footer pricing-intelligence-page__promotion-mini-card-eligibility--empty"

                      aria-hidden

                    />

                  )}



                  {meta.acaoRotulo && acaoVariante ? (

                    <button

                      type="button"

                      className={[

                        "pricing-intelligence-page__promotion-mini-card-action",

                        `pricing-intelligence-page__promotion-mini-card-action--${acaoVariante}`,

                      ]

                        .filter(Boolean)

                        .join(" ")}

                      onClick={(event) => {

                        event.stopPropagation();

                      }}

                    >

                      {meta.acaoRotulo}

                    </button>

                  ) : null}

                </span>

              ) : null}

            </div>

          );

        })}

      </div>

    </div>

  );

}


