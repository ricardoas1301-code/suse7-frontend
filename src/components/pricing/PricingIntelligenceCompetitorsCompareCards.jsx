// ======================================================

// PI — Aba Concorrentes: comparativo Clássico × Premium com simulação pelo lápis.

// Reutiliza hooks, popover e fluxo homologados da aba Precificação.

// ======================================================



import { useCallback, useEffect, useMemo, useRef, useState } from "react";



import { PricingListingTypeCardLoadingState } from "./PricingListingTypeCardLoadingState.jsx";

import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";

import { resolverPrecoRealAnuncioPrecificacao } from "./precoInicialAnuncioPrecificacao.js";

import {

  listingTypePillLabel,

  resolveListingTypeCompareCards,

} from "./pricingListingTypeUi.js";

import { parsePercentualInputParaNumero } from "./pricingPercentInputUi.js";

import {

  extrairCoeficientesCenarioBaseline,

  formatarBrlExibicao,

  montarLinhasMargemContingencia,

  montarLinhasReservaEstrategica,

  parseNumeroBrlApi,

} from "./pricingScenarioLocalSimulation.js";

import { useSimulacaoOficialListingType } from "./useSimulacaoOficialListingType.js";

import { getCompetitivePriceReference } from "./competitivePriceCompare.js";



/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */



/**

 * @param {{

 *   baselineRow: { scenario: unknown; group: string } | null;

 *   mlScenariosPayload?: unknown;

 *   catalogRow?: Record<string, unknown> | null;

 *   listingHintForAudit?: string;

 *   configuracaoFinanceira?: Record<string, unknown>;

 *   mlScenariosLoading?: boolean;

 *   onCenariosProntosChange?: (pronto: boolean) => void;

 *   onPrecoVendendoComparacaoChange?: (preco: number | null) => void;

 *   permitirEdicaoPreco?: boolean;

 * }} props

 */

export function PricingIntelligenceCompetitorsCompareCards({

  baselineRow,

  mlScenariosPayload = null,

  catalogRow = null,

  listingHintForAudit = "",

  configuracaoFinanceira = {},

  mlScenariosLoading = false,

  onCenariosProntosChange,

  onPrecoVendendoComparacaoChange,

  permitirEdicaoPreco = true,

}) {

  const listingCompare = useMemo(

    () =>

      resolveListingTypeCompareCards({

        payload: mlScenariosPayload,

        baselineRow,

        catalogRow,

      }),

    [mlScenariosPayload, baselineRow, catalogRow],

  );



  const { cards, currentListingType } = listingCompare;



  const cardsKey = useMemo(

    () =>

      cards

        .map((c) => {

          const s = c.scenario;

          const id =

            s != null && typeof s === "object"

              ? String(/** @type {Record<string, unknown>} */ (s).id ?? c.type)

              : c.type;

          return `${c.type}:${id}`;

        })

        .join("|"),

    [cards],

  );



  const precoRealAnuncio = useMemo(

    () =>

      resolverPrecoRealAnuncioPrecificacao({

        catalogRow: catalogRow ?? null,

        payload: mlScenariosPayload,

        baselineRow,

      }),

    [catalogRow, mlScenariosPayload, baselineRow],

  );



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



  const listingIdentityKey = useMemo(

    () => `${listingId ?? ""}|${listingExternalId ?? ""}`,

    [listingId, listingExternalId],

  );



  const [cardPreco, setCardPreco] = useState(

    /** @type {Partial<Record<ListingTypeChoice, number>>} */ ({}),

  );

  const [cardMargem, setCardMargem] = useState(

    /** @type {Partial<Record<ListingTypeChoice, number>>} */ ({}),

  );

  const [cardOrigem, setCardOrigem] = useState(

    /** @type {Partial<Record<ListingTypeChoice, "preco" | "margem" | null>>} */ ({}),

  );

  const [popoverAberto, setPopoverAberto] = useState(

    /** @type {Partial<Record<ListingTypeChoice, boolean>>} */ ({}),

  );

  const [precoComparacaoAplicado, setPrecoComparacaoAplicado] = useState(

    /** @type {number | null} */ (null),

  );

  const precoComparacaoSnapshotRef = useRef(/** @type {number | null} */ (null));



  const obterCenarioApi = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      const card = cards.find((c) => c.type === tipo);

      return card?.scenario ?? null;

    },

    [cards],

  );



  const precoReferencia = useMemo(() => {

    if (precoRealAnuncio.valor > 0) return precoRealAnuncio.valor;

    const classic = obterCenarioApi("classic");

    if (classic != null) {

      const coef = extrairCoeficientesCenarioBaseline(classic);

      if (coef.precoVenda > 0) return coef.precoVenda;

    }

    return 100;

  }, [precoRealAnuncio.valor, obterCenarioApi]);



  const precoRefPorTipo = useMemo(() => {

    /** @type {Partial<Record<ListingTypeChoice, number>>} */

    const out = {};

    for (const tipo of /** @type {ListingTypeChoice[]} */ (["classic", "premium"])) {

      const base = obterCenarioApi(tipo);

      const coef = base != null ? extrairCoeficientesCenarioBaseline(base) : null;

      out[tipo] = coef != null && coef.precoVenda > 0 ? coef.precoVenda : precoReferencia;

    }

    return out;

  }, [obterCenarioApi, precoReferencia]);



  const limitesSliderPorTipo = useMemo(() => {

    /** @type {Partial<Record<ListingTypeChoice, { min: number; max: number }>>} */

    const out = {};

    for (const tipo of /** @type {ListingTypeChoice[]} */ (["classic", "premium"])) {

      const ref = precoRefPorTipo[tipo] ?? precoReferencia;

      const min = Math.max(1, ref * 0.2);

      const max = Math.max(min + 1, ref * 2.5);

      out[tipo] = { min, max };

    }

    return out;

  }, [precoRefPorTipo, precoReferencia]);



  useEffect(() => {

    /** @type {Partial<Record<ListingTypeChoice, number>>} */

    const preco = {};

    /** @type {Partial<Record<ListingTypeChoice, number>>} */

    const margem = {};

    /** @type {Partial<Record<ListingTypeChoice, "preco" | "margem" | null>>} */

    const origem = {};

    for (const tipo of /** @type {ListingTypeChoice[]} */ (["classic", "premium"])) {

      const base = obterCenarioApi(tipo);

      const coef = base != null ? extrairCoeficientesCenarioBaseline(base) : null;

      preco[tipo] =

        coef != null && coef.precoVenda > 0

          ? coef.precoVenda

          : precoRefPorTipo[tipo] ?? precoReferencia;

      margem[tipo] = coef != null && Number.isFinite(coef.margem) ? coef.margem : 0;

      origem[tipo] = null;

    }

    setCardPreco(preco);

    setCardMargem(margem);

    setCardOrigem(origem);

  }, [cardsKey, precoReferencia, precoRefPorTipo, obterCenarioApi]);



  useEffect(() => {

    setPopoverAberto({});

    setPrecoComparacaoAplicado(null);

    precoComparacaoSnapshotRef.current = null;

  }, [listingIdentityKey]);



  const intents = useMemo(() => {

    /** @type {Partial<Record<ListingTypeChoice, { kind: "preco" | "margem"; value: number } | null>>} */

    const out = {};

    for (const tipo of /** @type {ListingTypeChoice[]} */ (["classic", "premium"])) {

      const origem = cardOrigem[tipo] ?? null;

      if (origem === "margem") {

        const m = cardMargem[tipo];

        out[tipo] = m != null && Number.isFinite(m) ? { kind: "margem", value: m } : null;

      } else if (origem === "preco") {

        const preco = cardPreco[tipo];

        out[tipo] = preco != null && Number.isFinite(preco) && preco > 0 ? { kind: "preco", value: preco } : null;

      } else if (tipo === currentListingType) {

        const precoAtual =

          precoRealAnuncio.valor > 0

            ? precoRealAnuncio.valor

            : precoRefPorTipo[tipo] ?? precoReferencia;

        out[tipo] =

          Number.isFinite(precoAtual) && precoAtual > 0

            ? { kind: "preco", value: Math.round(precoAtual * 100) / 100 }

            : null;

      } else {

        const ref = precoRefPorTipo[tipo] ?? precoReferencia;

        out[tipo] =

          Number.isFinite(ref) && ref > 0 ? { kind: "preco", value: Math.round(ref * 100) / 100 } : null;

      }

    }

    return out;

  }, [

    cardOrigem,

    cardPreco,

    cardMargem,

    currentListingType,

    precoRefPorTipo,

    precoReferencia,

    precoRealAnuncio.valor,

  ]);



  const simOficial = useSimulacaoOficialListingType({

    listingExternalId,

    listingId,

    intents,

    configuracaoFinanceira,

  });



  const ultimaSincronizacaoRef = useRef(

    /** @type {Partial<Record<ListingTypeChoice, string>>} */ ({}),

  );



  useEffect(() => {

    for (const tipo of /** @type {ListingTypeChoice[]} */ (["classic", "premium"])) {

      const origemEdicao = cardOrigem[tipo] ?? intents[tipo]?.kind ?? null;

      const st = simOficial[tipo];

      if (origemEdicao == null || st.loading || st.scenario == null || st.key == null) continue;



      const token = `${st.key}|${origemEdicao}|${st.resolvedPrice ?? ""}|${st.resolvedMargin ?? ""}`;

      if (ultimaSincronizacaoRef.current[tipo] === token) continue;

      ultimaSincronizacaoRef.current[tipo] = token;



      if (origemEdicao === "preco") {

        if (st.resolvedMargin != null && Number.isFinite(st.resolvedMargin)) {

          const margemSync = Math.round(st.resolvedMargin * 100) / 100;

          setCardMargem((prev) => (prev[tipo] === margemSync ? prev : { ...prev, [tipo]: margemSync }));

        }

        if (

          cardOrigem[tipo] == null &&

          st.resolvedPrice != null &&

          Number.isFinite(st.resolvedPrice) &&

          st.resolvedPrice > 0

        ) {

          const precoAuto = Math.round(st.resolvedPrice * 100) / 100;

          setCardPreco((prev) => (prev[tipo] === precoAuto ? prev : { ...prev, [tipo]: precoAuto }));

        }

      }



      if (

        origemEdicao === "margem" &&

        st.resolvedPrice != null &&

        Number.isFinite(st.resolvedPrice) &&

        st.resolvedPrice > 0

      ) {

        const precoSync = Math.round(st.resolvedPrice * 100) / 100;

        setCardPreco((prev) => (prev[tipo] === precoSync ? prev : { ...prev, [tipo]: precoSync }));

      }



      if (origemEdicao === "margem") {

        if (st.resolvedMargin != null && Number.isFinite(st.resolvedMargin)) {

          const margemSync = Number(Number(st.resolvedMargin).toFixed(2));

          setCardMargem((prev) => (prev[tipo] === margemSync ? prev : { ...prev, [tipo]: margemSync }));

        }

      }

    }

  }, [simOficial, cardOrigem, intents]);



  const valorComplementarPopover = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      const origemEdicao = cardOrigem[tipo] ?? intents[tipo]?.kind ?? null;

      const st = simOficial[tipo];

      const precoBase = cardPreco[tipo] ?? precoRefPorTipo[tipo] ?? precoReferencia;

      const margemBase = cardMargem[tipo] ?? 0;



      const margemOficial =

        st.resolvedMargin != null && Number.isFinite(st.resolvedMargin) ? st.resolvedMargin : null;

      const precoOficial =

        st.resolvedPrice != null && Number.isFinite(st.resolvedPrice) && st.resolvedPrice > 0

          ? st.resolvedPrice

          : null;



      const precoIntent =

        intents[tipo]?.kind === "preco" && Number.isFinite(intents[tipo]?.value)

          ? /** @type {number} */ (intents[tipo]?.value)

          : null;



      if (origemEdicao === "margem") {

        return {

          preco: precoOficial ?? precoBase,

          margem: margemOficial ?? margemBase,

        };

      }



      const precoDriver =

        cardOrigem[tipo] === "preco"

          ? precoBase

          : precoOficial ?? precoIntent ?? precoBase;



      return {

        preco: precoDriver,

        margem: margemOficial ?? margemBase,

      };

    },

    [cardOrigem, intents, simOficial, cardPreco, cardMargem, precoRefPorTipo, precoReferencia],

  );



  const definirPreco = useCallback((/** @type {ListingTypeChoice} */ tipo, /** @type {number} */ preco) => {

    if (!Number.isFinite(preco) || preco <= 0) return;

    const ajustado = Math.round(preco * 100) / 100;

    setCardPreco((prev) => ({ ...prev, [tipo]: ajustado }));

    setCardOrigem((prev) => ({ ...prev, [tipo]: "preco" }));

  }, []);



  const definirPrecoTexto = useCallback(

    (/** @type {ListingTypeChoice} */ tipo, /** @type {string} */ raw) => {

      const preco = parseNumeroBrlApi(raw);

      if (preco == null || preco <= 0) return;

      definirPreco(tipo, preco);

    },

    [definirPreco],

  );



  const definirMargem = useCallback((/** @type {ListingTypeChoice} */ tipo, /** @type {number} */ margem) => {

    if (!Number.isFinite(margem)) return;

    const clamped = Math.min(60, Math.max(0, margem));

    setCardMargem((prev) => ({ ...prev, [tipo]: clamped }));

    setCardOrigem((prev) => ({ ...prev, [tipo]: "margem" }));

  }, []);



  const definirMargemTexto = useCallback(

    (/** @type {ListingTypeChoice} */ tipo, /** @type {string} */ raw) => {

      const margem = parsePercentualInputParaNumero(raw);

      if (margem == null || !Number.isFinite(margem)) return;

      definirMargem(tipo, margem);

    },

    [definirMargem],

  );



  const obterCenarioExibicao = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      const temIntencao = intents[tipo] != null;

      if (temIntencao) {

        return simOficial[tipo].scenario ?? obterCenarioApi(tipo);

      }

      return obterCenarioApi(tipo);

    },

    [intents, simOficial, obterCenarioApi],

  );



  const obterMetricasLinha = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      const cenario = obterCenarioExibicao(tipo);

      if (cenario == null) return null;

      return extrairCoeficientesCenarioBaseline(cenario);

    },

    [obterCenarioExibicao],

  );



  const metricasVendendo = obterMetricasLinha(currentListingType);

  const popoverVendendoAberto = popoverAberto[currentListingType] === true;

  const simulandoVendendo = cardOrigem[currentListingType] != null;



  const precoVendendoEdicao = useMemo(() => {

    if (!popoverVendendoAberto && !simulandoVendendo) return null;

    if (popoverVendendoAberto) {

      return valorComplementarPopover(currentListingType).preco;

    }

    return (

      cardPreco[currentListingType] ??

      metricasVendendo?.precoVenda ??

      precoRefPorTipo[currentListingType] ??

      null

    );

  }, [

    popoverVendendoAberto,

    simulandoVendendo,

    currentListingType,

    valorComplementarPopover,

    cardPreco,

    metricasVendendo?.precoVenda,

    precoRefPorTipo,

  ]);



  const precoReferenciaConcorrentes = useMemo(() => {

    const ref = getCompetitivePriceReference({

      tipoVendendo: currentListingType,

      precoVendendoExibido: metricasVendendo?.precoVenda ?? null,

      precoVendendoBase:

        precoComparacaoAplicado ??

        precoRefPorTipo[currentListingType] ??

        precoReferencia,

      editandoVendendo: popoverVendendoAberto || simulandoVendendo,

      precoVendendoEdicao,

    });

    return ref?.toNumber() ?? null;

  }, [

    currentListingType,

    metricasVendendo?.precoVenda,

    precoComparacaoAplicado,

    precoRefPorTipo,

    precoReferencia,

    popoverVendendoAberto,

    simulandoVendendo,

    precoVendendoEdicao,

  ]);



  useEffect(() => {

    if (metricasVendendo?.precoVenda == null || !(metricasVendendo.precoVenda > 0)) return;

    setPrecoComparacaoAplicado((prev) => (prev == null ? metricasVendendo.precoVenda : prev));

  }, [metricasVendendo?.precoVenda, cardsKey]);



  useEffect(() => {

    if (!onPrecoVendendoComparacaoChange || !permitirEdicaoPreco) return;

    onPrecoVendendoComparacaoChange?.(precoReferenciaConcorrentes);

  }, [precoReferenciaConcorrentes, onPrecoVendendoComparacaoChange, permitirEdicaoPreco]);



  const abrirPopoverPreco = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      if (tipo === currentListingType) {

        const base =

          precoComparacaoAplicado ??

          obterMetricasLinha(tipo)?.precoVenda ??

          precoRefPorTipo[tipo] ??

          null;

        precoComparacaoSnapshotRef.current =

          base != null && Number.isFinite(base) && base > 0 ? base : null;

      }

      setPopoverAberto((prev) => ({ ...prev, [tipo]: true }));

    },

    [currentListingType, precoComparacaoAplicado, obterMetricasLinha, precoRefPorTipo],

  );



  const fecharPopoverPreco = useCallback(

    (/** @type {ListingTypeChoice} */ tipo) => {

      setPopoverAberto((prev) => ({ ...prev, [tipo]: false }));

      if (tipo !== currentListingType) return;



      const comp = valorComplementarPopover(tipo);

      const metricas = obterMetricasLinha(tipo);

      const precoAtual =

        comp.preco != null && comp.preco > 0

          ? comp.preco

          : metricas?.precoVenda != null && metricas.precoVenda > 0

            ? metricas.precoVenda

            : precoComparacaoSnapshotRef.current;



      if (precoAtual != null && Number.isFinite(precoAtual) && precoAtual > 0) {

        setPrecoComparacaoAplicado(precoAtual);

      }

    },

    [currentListingType, valorComplementarPopover, obterMetricasLinha],

  );



  useEffect(() => {

    if (!onCenariosProntosChange) return;



    const tipoPronto = (/** @type {ListingTypeChoice} */ tipo) => {

      const exibicao = obterCenarioExibicao(tipo);

      if (exibicao != null) return true;

      const st = simOficial[tipo];

      return st?.erro != null && String(st.erro).trim() !== "" && st.loading !== true;

    };



    onCenariosProntosChange(

      !mlScenariosLoading && tipoPronto("classic") && tipoPronto("premium"),

    );

  }, [onCenariosProntosChange, mlScenariosLoading, simOficial, obterCenarioExibicao, cardsKey]);



  if (baselineRow == null) {

    return (

      <p className="pricing-intelligence-page__competitors-selling-empty" role="status">

        Cenário de preço indisponível para este anúncio.

      </p>

    );

  }



  const cfg = configuracaoFinanceira;



  return cards.map((card) => {

    const simulandoCard = cardOrigem[card.type] != null;

    const scenarioObj = obterCenarioExibicao(card.type);

    const scenarioRecord =

      scenarioObj != null && typeof scenarioObj === "object" ? scenarioObj : null;

    const cenarioApiObj =

      card.scenario != null && typeof card.scenario === "object" ? card.scenario : null;

    const metricasLinha = obterMetricasLinha(card.type);



    const cenarioContingencia = scenarioRecord ?? cenarioApiObj;



    const precoUnitarioParaLinhas =

      metricasLinha != null && Number.isFinite(metricasLinha.precoVenda) && metricasLinha.precoVenda > 0

        ? metricasLinha.precoVenda

        : precoRealAnuncio.valor;



    const { lines: contingencyLines } = montarLinhasMargemContingencia(cenarioContingencia, {

      mlAdsEnabled: cfg.mlAdsEnabled,

      mlAdsPct: cfg.mlAdsPct,

      mlAdsLabel: cfg.mlAdsLabel,

      reserveEnabled: cfg.reserveEnabled,

      reservePct: cfg.reservePct,

      reserveLabel: cfg.reserveLabel,

      precoUnitarioBrl: precoUnitarioParaLinhas,

      exibirLinhasInativas: true,

    });



    const { lines: strategicReserveLines } = montarLinhasReservaEstrategica(cenarioContingencia, {

      plannedPromoEnabled: cfg.plannedPromoEnabled,

      plannedPromoPct: cfg.plannedPromoPct,

      plannedPromoLabel: cfg.plannedPromoLabel,

      affiliatesEnabled: cfg.affiliatesEnabled,

      affiliatesPct: cfg.affiliatesPct,

      affiliatesLabel: cfg.affiliatesLabel,

      precoUnitarioBrl: precoUnitarioParaLinhas,

      exibirLinhasInativas: true,

    });



    const precoExibicaoCard =

      metricasLinha != null && Number.isFinite(metricasLinha.precoVenda) && metricasLinha.precoVenda > 0

        ? formatarBrlExibicao(metricasLinha.precoVenda)

        : precoRealAnuncio.exibicao;



    const limitesCard = limitesSliderPorTipo[card.type];

    const complementar = valorComplementarPopover(card.type);

    const origemEdicaoCard = cardOrigem[card.type] ?? intents[card.type]?.kind ?? null;

    const stCard = simOficial[card.type];

    const cenarioExibivel = scenarioRecord != null;

    const cardRecalculando = cenarioExibivel && stCard?.loading === true;

    const carregandoInicial =

      !cenarioExibivel &&

      stCard?.erro == null &&

      (mlScenariosLoading || stCard?.loading === true);

    const cardErroSimulacao =

      !cenarioExibivel &&

      !carregandoInicial &&

      stCard?.erro != null &&

      String(stCard.erro).trim() !== "";

    const margemEspelhaResultado =

      origemEdicaoCard !== "margem" ||

      (stCard?.loading !== true &&

        stCard?.resolvedMargin != null &&

        Number.isFinite(stCard.resolvedMargin));



    const salePriceEditControl = {

      scenarioType: card.type,

      title: listingTypePillLabel(card.type),

      displayValue: precoExibicaoCard,

      isOpen: popoverAberto[card.type] === true,

        onOpen: () => abrirPopoverPreco(card.type),

        onClose: () => fecharPopoverPreco(card.type),

      precoVendaNum: complementar.preco,

      precoSliderMin: limitesCard?.min ?? 1,

      precoSliderMax: limitesCard?.max ?? 1000,

      onPrecoVendaChange: (/** @type {number} */ n) => definirPreco(card.type, n),

      onPrecoVendaTextoChange: (/** @type {string} */ raw) => definirPrecoTexto(card.type, raw),

      margemPctNum: complementar.margem,

      margemEspelhaResultado,

      margemSliderMax: 60,

      onMargemPctChange: (/** @type {number} */ n) => definirMargem(card.type, n),

      onMargemPctTextoChange: (/** @type {string} */ raw) => definirMargemTexto(card.type, raw),

      onIniciarEdicaoMargem: () => {

        setCardOrigem((prev) => ({ ...prev, [card.type]: "margem" }));

        const atual = cardMargem[card.type];

        if (atual != null && Number.isFinite(atual) && atual < 0) {

          setCardMargem((prev) => ({ ...prev, [card.type]: 0 }));

        }

      },

      loading: simOficial[card.type]?.loading === true,

      erro: simOficial[card.type]?.erro ?? null,

    };



    return (

      <div

        key={card.type}

        className={[

          "pricing-intelligence-page__competitors-compare-card",

          "pricing-listing-type-compare__col",

          card.isAtual ? "pricing-listing-type-compare__col--atual" : "pricing-listing-type-compare__col--alt",

          simulandoCard ? "pricing-listing-type-compare__col--simulando" : "",

          cardRecalculando ? "pricing-listing-type-compare__col--recalculando" : "",

          carregandoInicial ? "pricing-listing-type-compare__col--loading" : "",

        ]

          .filter(Boolean)

          .join(" ")}

        data-listing-type={card.type}

        data-listing-type-atual={card.isAtual ? "true" : "false"}

        data-papel={card.papel}

        data-recalculando={cardRecalculando ? "true" : undefined}

      >

        {carregandoInicial ? (

          <PricingListingTypeCardLoadingState listingType={card.type} />

        ) : scenarioRecord != null ? (

          <PricingScenarioDetail

            scenario={scenarioRecord}

            group={card.group}

            baselineListingTypeBadge={listingTypePillLabel(card.type)}

            listingTypeSelectionBadge={card.isAtual ? "Vendendo" : "Alternativa"}

            hideBreakEvenInResult

            listingHintForAudit={listingHintForAudit}

            contingencyLines={contingencyLines}

            strategicReserveLines={strategicReserveLines}

            listingUnitSaleDisplayOverride={precoExibicaoCard}

            salePriceEditControl={permitirEdicaoPreco ? salePriceEditControl : undefined}

            cardFooterNotice={card.avisoRodape ?? null}

            layoutPiFixo

          />

        ) : (

          <div className="pricing-listing-type-compare__unavailable" role="status">

            <p className="pricing-listing-type-compare__unavailable-title">

              {listingTypePillLabel(card.type)}

            </p>

            <p className="pricing-listing-type-compare__unavailable-text">

              {cardErroSimulacao

                ? String(stCard.erro)

                : "Não foi possível montar o card para este anúncio. Sincronize o anúncio e tente novamente."}

            </p>

          </div>

        )}

      </div>

    );

  });

}


