// ======================================================

// PI — Lista compacta vertical de promoções (coluna direita da aba Promoções).

// S4.3.6.10 — popover de preço (paridade aba Precificação); card somente leitura.

// ======================================================



import { useCallback, useEffect, useMemo, useState } from "react";



import raioxTriggerIcon from "../../assets/raiox-trigger-icon.png";

import { usePromocoesCompareContext } from "./PricingIntelligencePromotionsCompareContext.jsx";

import { PromotionMiniCardPricePopoverControl } from "./PromotionMiniCardPricePopoverControl.jsx";

import "./PricingIntelligencePromotionsPanel.css";

import "../Anuncios.css";

import { resolvePromotionMiniCardMeta } from "./pricingPromotionCarouselUi.js";

import { logPiPromosAuditRendered, logPiPromoMiniCardContractAudit } from "./pricingPromotionsAudit.js";

import { isValidDecimalMoneyString } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";

import {

  calcularDescontoSimulacaoAPartirPreco,

  PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL,

  resolverDescontoPctNumPopover,

  validarPrecoPromocionalContraTeto,

} from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";



/** @param {{ activeWorkspaceTab?: "simulator" | "promotions" | "competitors" }} props */
export function PricingIntelligencePromotionsCompactPicker({ activeWorkspaceTab = "promotions" }) {

  const {

    rows,

    promocaoAtivaId,

    handleSelecionarPromocao,

    listingHintForAudit,

    catalogRow,

    obterPrecoManualSimulacao,

    definirPrecoManualSimulacao,

    obterTetoPromocionalSimulacao,

    manualPriceGeneration,

  } = usePromocoesCompareContext();



  const [popoverAberto, setPopoverAberto] = useState(
    /** @type {{ selectionId: string; listingKey: string | null } | null} */ (null),
  );

  const listingKeyAtual = listingHintForAudit ?? null;
  const popoverAbertoId =
    activeWorkspaceTab === "promotions" &&
    popoverAberto != null &&
    popoverAberto.listingKey === listingKeyAtual &&
    popoverAberto.selectionId === promocaoAtivaId
      ? popoverAberto.selectionId
      : null;

  useEffect(() => {
    if (activeWorkspaceTab !== "promotions") {
      setPopoverAberto((atual) => (atual != null ? null : atual));
    }
  }, [activeWorkspaceTab]);

  useEffect(() => {
    setPopoverAberto((atual) => {
      if (atual != null && atual.selectionId !== promocaoAtivaId) return null;
      return atual;
    });
  }, [promocaoAtivaId]);



  const itens = useMemo(

    () =>

      rows.map((row, index) => {

        const selectionId = resolvePromotionMiniCardMeta(row, index).selectionId;

        const selecionado = promocaoAtivaId === selectionId;

        return {

          row,

          meta: resolvePromotionMiniCardMeta(row, index, {

            manualPriceRecord: obterPrecoManualSimulacao(selectionId),

            isSelected: selecionado,

            catalogRow,

          }),

        };

      }),

    [rows, promocaoAtivaId, catalogRow, obterPrecoManualSimulacao, manualPriceGeneration],

  );



  useEffect(() => {
    logPiPromosAuditRendered(itens.length, listingHintForAudit || null);

    logPiPromoMiniCardContractAudit({

      rows,

      listingExternalId: listingHintForAudit || null,

      promocaoAtivaId,

      resolveMeta: (row, index) =>

        resolvePromotionMiniCardMeta(row, index, {

          manualPriceRecord: obterPrecoManualSimulacao(resolvePromotionMiniCardMeta(row, index).selectionId),

          isSelected: promocaoAtivaId === resolvePromotionMiniCardMeta(row, index).selectionId,

          catalogRow,

        }),

    });

  }, [itens.length, rows, listingHintForAudit, promocaoAtivaId, catalogRow, obterPrecoManualSimulacao, manualPriceGeneration]);



  const handleCardKeyDown = useCallback(

    (event, selectionId) => {

      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();

      handleSelecionarPromocao(selectionId);

    },

    [handleSelecionarPromocao],

  );



  const validarPrecoPromocao = useCallback((precoTetoBrl, precoBaseBrl, priceBrl) => {
    if (precoTetoBrl == null || String(precoTetoBrl).trim() === "") {
      if (!isValidDecimalMoneyString(priceBrl)) return { ok: false };
      const calc = calcularDescontoSimulacaoAPartirPreco(precoBaseBrl, priceBrl);
      if (calc?.ok === false) {
        return { ok: false, error: calc.error ?? PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL };
      }
      return { ok: true, priceBrl };
    }
    return validarPrecoPromocionalContraTeto(precoTetoBrl, priceBrl, precoBaseBrl);
  }, []);



  const handlePrecoPromocaoChange = useCallback(
    (meta, priceBrl, precoTetoBrl) => {
      const gate = validarPrecoPromocao(precoTetoBrl, meta.financeiro?.originalBrl, priceBrl);
      if (!gate.ok) return;
      definirPrecoManualSimulacao(meta.selectionId, gate.priceBrl ?? priceBrl);
    },
    [definirPrecoManualSimulacao, validarPrecoPromocao],
  );



  if (rows.length === 0) return null;



  return (

    <div

      className="pricing-intelligence-page__promotions-compact-picker"

      aria-label="Promoções disponíveis para comparar"

    >

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

          const fin = meta.financeiro;

          const cardPopoverAberto = popoverAbertoId === meta.selectionId;

          const tetoPromocional = obterTetoPromocionalSimulacao(meta.selectionId);
          const precoTetoBrl = tetoPromocional?.ceilingBrl ?? null;

          const descontoPctNum = resolverDescontoPctNumPopover(fin?.originalBrl, fin?.precoBrl);

          const pencilHabilitado = fin.permiteEdicaoPreco === true && selecionado;



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

                "pricing-intelligence-page__promotion-mini-card--fixed-height",

                `pricing-intelligence-page__promotion-mini-card--${meta.statusKind}`,

                selecionado ? "pricing-intelligence-page__promotion-mini-card--selected" : "",

                cardPopoverAberto ? "pricing-intelligence-page__promotion-mini-card--popover-open" : "",

              ]

                .filter(Boolean)

                .join(" ")}

              onClick={() => handleSelecionarPromocao(meta.selectionId)}

              onKeyDown={(event) => handleCardKeyDown(event, meta.selectionId)}

            >

              <div className="pricing-intelligence-page__promotion-mini-card-header-block">

                <span className="pricing-intelligence-page__promotion-mini-card-title-row">

                  <span className="pricing-intelligence-page__promotion-mini-card-name pricing-intelligence-page__promotion-title-ml">

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



                <span className="pricing-intelligence-page__promotion-mini-card-meta-line pricing-intelligence-page__promotion-mini-card-period pricing-intelligence-page__promotion-mini-card-period--full">

                  {meta.periodo}

                </span>

              </div>



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



              {!meta.temFundingMl && fin?.precoExibicao ? (

                <div className="pricing-intelligence-page__promotion-mini-card-finance-block">

                  <span

                    className={[

                      "pricing-intelligence-page__promotion-mini-card-meta-line",

                      "pricing-intelligence-page__promotion-mini-card-price",

                      "pricing-intelligence-page__promotion-mini-card-finance-line",

                      "pricing-intelligence-page__promotion-mini-card-meta-line--full",

                    ].join(" ")}

                  >

                    <span className="pricing-intelligence-page__promotion-mini-card-finance-row pricing-intelligence-page__promotion-mini-card-finance-row--price">

                      <span className="pricing-intelligence-page__promotion-mini-card-finance-text">

                        {fin.precoExibicao}

                      </span>

                      <PromotionMiniCardPricePopoverControl

                        selectionId={meta.selectionId}

                        showPencil={fin.permiteEdicaoPreco === true}

                        pencilEnabled={pencilHabilitado}

                        tooltip={fin.tooltipPreco ?? "Editar preço de venda"}

                        isOpen={popoverAbertoId === meta.selectionId}

                        onOpen={() => {
                          if (!pencilHabilitado) return;
                          setPopoverAberto({ selectionId: meta.selectionId, listingKey: listingKeyAtual });
                        }}

                        onClose={() => setPopoverAberto(null)}

                        precoBrl={fin.precoBrl}

                        precoTetoBrl={precoTetoBrl}

                        precoBaseBrl={fin.originalBrl}

                        descontoPctNum={descontoPctNum}

                        initialDiscountPercentDec={tetoPromocional?.initialDiscountPercentDec ?? null}

                        initialDiscountPercentDisplay={tetoPromocional?.initialDiscountPercentDisplay ?? null}

                        onPrecoChange={(priceBrl) => handlePrecoPromocaoChange(meta, priceBrl, precoTetoBrl)}

                      />

                    </span>

                  </span>



                  {fin.descontoPctLinha ? (

                    <span

                      className={[

                        "pricing-intelligence-page__promotion-mini-card-meta-line",

                        "pricing-intelligence-page__promotion-mini-card-discount",

                        "pricing-intelligence-page__promotion-mini-card-finance-line",

                        "pricing-intelligence-page__promotion-mini-card-meta-line--full",

                      ].join(" ")}

                    >

                      <span className="pricing-intelligence-page__promotion-mini-card-finance-row pricing-intelligence-page__promotion-mini-card-finance-row--discount">

                        <span className="pricing-intelligence-page__promotion-mini-card-finance-text">

                          {fin.descontoPctLinha}

                        </span>

                      </span>

                    </span>

                  ) : null}



                  {fin.descontoReaisLinha ? (

                    <span

                      className={[

                        "pricing-intelligence-page__promotion-mini-card-meta-line",

                        "pricing-intelligence-page__promotion-mini-card-discount",

                        "pricing-intelligence-page__promotion-mini-card-discount--amount",

                        "pricing-intelligence-page__promotion-mini-card-finance-line",

                        "pricing-intelligence-page__promotion-mini-card-meta-line--full",

                      ].join(" ")}

                    >

                      <span className="pricing-intelligence-page__promotion-mini-card-finance-row pricing-intelligence-page__promotion-mini-card-finance-row--discount pricing-intelligence-page__promotion-mini-card-finance-row--amount">

                        <span className="pricing-intelligence-page__promotion-mini-card-finance-text">

                          {fin.descontoReaisLinha}

                        </span>

                      </span>

                    </span>

                  ) : null}

                </div>

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


