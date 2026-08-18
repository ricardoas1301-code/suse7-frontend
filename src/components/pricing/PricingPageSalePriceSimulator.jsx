// ======================================================
// Comparativo Clássico × Premium — baseline real + simulação centralizada no card de precificação.
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PricingListingTypeCardLoadingState } from "./PricingListingTypeCardLoadingState.jsx";
import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";
import { PricingSalePriceListingTypeChartPlaceholder } from "./PricingSalePriceListingTypeChartPlaceholder.jsx";
import { logDiagnosticoCenarioClassicoPrecificacao } from "./diagnosticoCenarioClassicoPrecificacao.js";
import {
  logDiagnosticoPrecoInicialPrecificacao,
  resolverPrecoRealAnuncioPrecificacao,
} from "./precoInicialAnuncioPrecificacao.js";
import { listingTypePillLabel, resolveListingTypeCompareCards } from "./pricingListingTypeUi.js";
import {
  extrairCoeficientesCenarioBaseline,
  formatarBrlExibicao,
  montarLinhasMargemContingencia,
  montarLinhasReservaEstrategica,
  parseNumeroBrlApi,
} from "./pricingScenarioLocalSimulation.js";
import { parsePercentualInputParaNumero } from "./pricingPercentInputUi.js";
import { useSimulacaoOficialListingType } from "./useSimulacaoOficialListingType.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

/**
 * @param {{
 *   baselineRow: { scenario: unknown; group: string } | null;
 *   mlScenariosPayload?: unknown;
 *   catalogRow?: Record<string, unknown> | null;
 *   listingHintForAudit?: string;
 *   configuracaoFinanceira?: {
 *     mlAdsEnabled?: boolean;
 *     mlAdsPct?: string;
 *     mlAdsLabel?: string;
 *     reserveEnabled?: boolean;
 *     reservePct?: string;
 *     reserveLabel?: string;
 *     plannedPromoEnabled?: boolean;
 *     plannedPromoPct?: string;
 *     plannedPromoLabel?: string;
 *     affiliatesEnabled?: boolean;
 *     affiliatesPct?: string;
 *     affiliatesLabel?: string;
 *   };
 *   embedded?: boolean;
 *   children?: import("react").ReactNode;
 *   footerSlot?: import("react").ReactNode;
 *   tabRailSlot?: import("react").ReactNode;
 *   mlScenariosLoading?: boolean;
 *   onCardsIniciaisProntosChange?: (pronto: boolean) => void;
 *   workspaceActiveTab?: "simulator" | "promotions" | "competitors";
 * }} props
 */
export function PricingPageSalePriceSimulator({
  baselineRow,
  mlScenariosPayload = null,
  catalogRow = null,
  listingHintForAudit = "",
  configuracaoFinanceira = {},
  embedded = false,
  children = null,
  footerSlot = null,
  tabRailSlot = null,
  mlScenariosLoading = false,
  onCardsIniciaisProntosChange,
  workspaceActiveTab = "simulator",
}) {
  const precoRealAnuncio = useMemo(
    () =>
      resolverPrecoRealAnuncioPrecificacao({
        catalogRow: catalogRow ?? null,
        payload: mlScenariosPayload,
        baselineRow,
      }),
    [catalogRow, mlScenariosPayload, baselineRow],
  );

  // Cards-base reais por tipo (sem espelho visual nem projeção local): o card do tipo
  // atual usa o baseline oficial da API; o tipo alternativo é resolvido oficialmente
  // pelo backend (hook abaixo), não mais espelhado.
  const listingCompare = useMemo(
    () =>
      resolveListingTypeCompareCards({
        payload: mlScenariosPayload,
        baselineRow,
        catalogRow,
      }),
    [mlScenariosPayload, baselineRow, catalogRow],
  );

  const { cards, currentListingType, alternateType } = listingCompare;

  // Identificação do anúncio para o resolver oficial (multi-conta preservado no backend).
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

  useEffect(() => {
    const externalListingId =
      catalogRow != null && typeof catalogRow === "object"
        ? String(/** @type {Record<string, unknown>} */ (catalogRow).externalId ?? "").trim() ||
          listingHintForAudit ||
          null
        : listingHintForAudit || null;

    logDiagnosticoCenarioClassicoPrecificacao({
      externalListingId,
      catalogRow: catalogRow ?? null,
      payload: mlScenariosPayload,
      baselineRow,
      resolveResult: {
        cards: listingCompare.cards.map((c) => ({
          type: c.type,
          cenarioDisponivel: c.cenarioDisponivel,
          papel: c.papel,
        })),
        currentListingType,
        alternateType,
      },
    });
  }, [mlScenariosPayload, catalogRow, listingHintForAudit, listingCompare, baselineRow, currentListingType, alternateType]);

  useEffect(() => {
    const externalListingId =
      catalogRow != null && typeof catalogRow === "object"
        ? String(/** @type {Record<string, unknown>} */ (catalogRow).externalId ?? "").trim() ||
          listingHintForAudit ||
          null
        : listingHintForAudit || null;
    logDiagnosticoPrecoInicialPrecificacao(precoRealAnuncio, externalListingId);
  }, [precoRealAnuncio, catalogRow, listingHintForAudit]);

  const cardsKey = useMemo(
    () =>
      cards
        .map((c) => {
          const s =
            c.scenario != null && typeof c.scenario === "object"
              ? /** @type {Record<string, unknown>} */ (c.scenario).scenario_id ?? ""
              : "";
          return `${c.type}:${String(s)}`;
        })
        .join("|"),
    [cards],
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

  useEffect(() => {
    if (workspaceActiveTab !== "simulator") {
      setPopoverAberto((atual) => (Object.keys(atual).length > 0 ? {} : atual));
    }
  }, [workspaceActiveTab]);

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

  // Preço de referência por tipo — cada card parte do seu próprio baseline.
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

  const listingIdentityKey = useMemo(
    () => `${listingId ?? ""}|${listingExternalId ?? ""}`,
    [listingId, listingExternalId],
  );

  // Inicializa preço/margem por card quando o baseline muda — preserva popover aberto.
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

  // Reseta popover somente ao trocar de anúncio — não em refresh de simulação/re-render.
  useEffect(() => {
    setPopoverAberto({});
  }, [listingIdentityKey]);

  // Intenção de simulação por tipo (entrada do resolver oficial / fonte única):
  // - editou preço  → { kind: "preco" }
  // - editou margem → { kind: "margem" }
  // - Card "Vendendo" (tipo atual): SEMPRE simula no preço oficial atual (promo ou catálogo)
  //   para frete/tarifa/repasse dinâmicos por preço — tarifa oficial do tipo (gold_pro / gold_special).
  // - Card alternativo: simula no preço de referência do card com tarifa oficial do outro tipo.
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

  // Sincroniza o campo complementar após simulação oficial (preço↔margem).
  // Debounce já está no hook; aqui só espelhamos o resultado no estado local,
  // sem trocar cardOrigem — evita loop infinito.
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
        if (
          st.resolvedMargin != null &&
          Number.isFinite(st.resolvedMargin)
        ) {
          const margemSync = Math.round(st.resolvedMargin * 100) / 100;
          setCardMargem((prev) => (prev[tipo] === margemSync ? prev : { ...prev, [tipo]: margemSync }));
          if (import.meta.env.DEV) {
            console.info("[pricing-bidirectional-sync] preco→margem", { tipo, margem: margemSync });
          }
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
        if (import.meta.env.DEV) {
          console.info("[pricing-bidirectional-sync] margem→preco", { tipo, preco: precoSync });
        }
      }

      if (origemEdicao === "margem") {
        if (st.resolvedMargin != null && Number.isFinite(st.resolvedMargin)) {
          const margemSync = Number(Number(st.resolvedMargin).toFixed(2));
          setCardMargem((prev) => (prev[tipo] === margemSync ? prev : { ...prev, [tipo]: margemSync }));
          if (import.meta.env.DEV) {
            console.info("[pricing-bidirectional-sync] margem→margem-real", { tipo, margem: margemSync });
          }
        }
      }
    }
  }, [simOficial, cardOrigem, intents]);

  // Campo complementar: espelha o cenário oficial. Quem dirige a simulação é cardOrigem
  // (ou a intenção ativa quando o card ainda não foi editado manualmente).
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

  const definirPreco = useCallback(
    (/** @type {ListingTypeChoice} */ tipo, /** @type {number} */ preco) => {
      // Sem teto artificial: o seller pode simular qualquer preço válido (> 0).
      // Validação mínima apenas: preço positivo.
      if (!Number.isFinite(preco) || preco <= 0) return;
      const ajustado = Math.round(preco * 100) / 100;
      setCardPreco((prev) => ({ ...prev, [tipo]: ajustado }));
      setCardOrigem((prev) => ({ ...prev, [tipo]: "preco" }));
    },
    [],
  );

  const definirPrecoTexto = useCallback(
    (/** @type {ListingTypeChoice} */ tipo, /** @type {string} */ raw) => {
      const preco = parseNumeroBrlApi(raw);
      if (preco == null || preco <= 0) return;
      definirPreco(tipo, preco);
    },
    [definirPreco],
  );

  const definirMargem = useCallback(
    (/** @type {ListingTypeChoice} */ tipo, /** @type {number} */ margem) => {
      if (!Number.isFinite(margem)) return;
      const clamped = Math.min(60, Math.max(0, margem));
      setCardMargem((prev) => ({ ...prev, [tipo]: clamped }));
      setCardOrigem((prev) => ({ ...prev, [tipo]: "margem" }));
    },
    [],
  );

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
      // Tudo financeiro vem do resolver oficial quando há intenção (edição ou baseline
      // do tipo alternativo). Sem intenção, usa o baseline oficial da API do tipo atual.
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

  // Hidratação inicial: avisa o pai quando ambos os cards têm cenário (ou erro final).
  useEffect(() => {
    if (!onCardsIniciaisProntosChange) return;

    const tipoPronto = (/** @type {ListingTypeChoice} */ tipo) => {
      const exibicao = obterCenarioExibicao(tipo);
      if (exibicao != null) return true;
      const st = simOficial[tipo];
      return st?.erro != null && String(st.erro).trim() !== "" && st.loading !== true;
    };

    onCardsIniciaisProntosChange(
      !mlScenariosLoading && tipoPronto("classic") && tipoPronto("premium"),
    );
  }, [onCardsIniciaisProntosChange, mlScenariosLoading, simOficial, obterCenarioExibicao, cardsKey]);

  // Controle global de preço/margem deixou de existir: a simulação é por card.
  // O command center mantém apenas a configuração financeira (promoção, afiliados,
  // ML Ads, custos operacionais, margem de segurança).
  const childrenComComando = children;

  if (baselineRow == null) return null;

  const rootClass = [
    "pricing-intelligence-page__sale-price-simulator",
    embedded ? "pricing-intelligence-page__sale-price-simulator--embedded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const Tag = embedded ? "div" : "section";

  return (
    <Tag
      className={rootClass}
      aria-label={embedded ? undefined : "Comparativo Preço de venda — Clássico e Premium"}
    >
      {!embedded ? (
        <header className="pricing-intelligence-page__sale-price-simulator__head">
          <span className="pricing-intelligence-page__sale-price-simulator__kicker">Comparativo</span>
          <p className="pricing-intelligence-page__sale-price-simulator__lede">
            Primeiro o estado real e o cenário equivalente do Mercado Livre. Clique no lápis ao lado do
            "Valor de venda" de cada card para simular Clássico e Premium de forma independente, em tempo real.
          </p>
        </header>
      ) : null}

      <div className="pricing-intelligence-page__scenario-workspace pricing-intelligence-page__scenario-workspace--listing-type-dual">
        <div className="pricing-intelligence-page__scenario-main pricing-intelligence-page__scenario-main--listing-type-dual">
          <div
            className="pricing-listing-type-compare"
            role="group"
            aria-label="Comparativo Anúncio Clássico e Anúncio Premium"
          >
            {cards.map((card) => {
              const simulandoCard = cardOrigem[card.type] != null;
              const scenarioExibicao = obterCenarioExibicao(card.type);
              const scenarioObj =
                scenarioExibicao != null && typeof scenarioExibicao === "object" ? scenarioExibicao : null;
              const cenarioApiObj =
                card.scenario != null && typeof card.scenario === "object" ? card.scenario : null;
              const metricasLinha = obterMetricasLinha(card.type);

              // Base das linhas auxiliares: o cenário OFICIAL exibido (inclui baseline
              // alternativo resolvido pelo backend); cai para o da API só por segurança.
              const cenarioContingencia = scenarioObj ?? cenarioApiObj;

              const precoUnitarioParaLinhas =
                metricasLinha != null &&
                Number.isFinite(metricasLinha.precoVenda) &&
                metricasLinha.precoVenda > 0
                  ? metricasLinha.precoVenda
                  : precoRealAnuncio.valor;

              const { lines: contingencyLines } = montarLinhasMargemContingencia(cenarioContingencia, {
                mlAdsEnabled: configuracaoFinanceira.mlAdsEnabled,
                mlAdsPct: configuracaoFinanceira.mlAdsPct,
                mlAdsLabel: configuracaoFinanceira.mlAdsLabel,
                reserveEnabled: configuracaoFinanceira.reserveEnabled,
                reservePct: configuracaoFinanceira.reservePct,
                reserveLabel: configuracaoFinanceira.reserveLabel,
                precoUnitarioBrl: precoUnitarioParaLinhas,
                exibirLinhasInativas: embedded,
              });

              const { lines: strategicReserveLines } = montarLinhasReservaEstrategica(cenarioContingencia, {
                plannedPromoEnabled: configuracaoFinanceira.plannedPromoEnabled,
                plannedPromoPct: configuracaoFinanceira.plannedPromoPct,
                plannedPromoLabel: configuracaoFinanceira.plannedPromoLabel,
                affiliatesEnabled: configuracaoFinanceira.affiliatesEnabled,
                affiliatesPct: configuracaoFinanceira.affiliatesPct,
                affiliatesLabel: configuracaoFinanceira.affiliatesLabel,
                precoUnitarioBrl: precoUnitarioParaLinhas,
                exibirLinhasInativas: embedded,
              });

              const precoExibicaoCard =
                metricasLinha != null &&
                Number.isFinite(metricasLinha.precoVenda) &&
                metricasLinha.precoVenda > 0
                  ? formatarBrlExibicao(metricasLinha.precoVenda)
                  : precoRealAnuncio.exibicao;

              const limitesCard = limitesSliderPorTipo[card.type];
              const complementar = valorComplementarPopover(card.type);
              const origemEdicaoCard =
                cardOrigem[card.type] ?? intents[card.type]?.kind ?? null;
              const stCard = simOficial[card.type];
              const cenarioExibivel = scenarioObj != null;
              const cardRecalculando = cenarioExibivel && stCard?.loading === true;
              const cardCarregandoInicial =
                !cenarioExibivel &&
                stCard?.erro == null &&
                (mlScenariosLoading || stCard?.loading === true);
              const cardErroSimulacao =
                !cenarioExibivel &&
                !cardCarregandoInicial &&
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
                isOpen: workspaceActiveTab === "simulator" && popoverAberto[card.type] === true,
                onOpen: () => setPopoverAberto((prev) => ({ ...prev, [card.type]: true })),
                onClose: () => setPopoverAberto((prev) => ({ ...prev, [card.type]: false })),
                precoVendaNum: complementar.preco,
                precoSliderMin: limitesCard?.min ?? 1,
                precoSliderMax: limitesCard?.max ?? 1000,
                onPrecoVendaChange: (/** @type {number} */ n) => definirPreco(card.type, n),
                onPrecoVendaTextoChange: (/** @type {string} */ raw) =>
                  definirPrecoTexto(card.type, raw),
                margemPctNum: complementar.margem,
                margemEspelhaResultado,
                margemSliderMax: 60,
                onMargemPctChange: (/** @type {number} */ n) => definirMargem(card.type, n),
                onMargemPctTextoChange: (/** @type {string} */ raw) =>
                  definirMargemTexto(card.type, raw),
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
                    "pricing-listing-type-compare__col",
                    card.isAtual
                      ? "pricing-listing-type-compare__col--atual"
                      : "pricing-listing-type-compare__col--alt",
                    simulandoCard ? "pricing-listing-type-compare__col--simulando" : "",
                    cardRecalculando ? "pricing-listing-type-compare__col--recalculando" : "",
                    cardCarregandoInicial ? "pricing-listing-type-compare__col--loading" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-listing-type={card.type}
                  data-listing-type-atual={card.isAtual ? "true" : "false"}
                  data-papel={card.papel}
                  data-recalculando={cardRecalculando ? "true" : undefined}
                >
                  {cardCarregandoInicial ? (
                    <PricingListingTypeCardLoadingState listingType={card.type} />
                  ) : scenarioObj != null ? (
            <PricingScenarioDetail
                      scenario={scenarioObj}
                      group={card.group}
                      baselineListingTypeBadge={listingTypePillLabel(card.type)}
                      listingTypeSelectionBadge={card.isAtual ? "Vendendo" : null}
              hideBreakEvenInResult
              listingHintForAudit={listingHintForAudit}
                      contingencyLines={contingencyLines}
                      strategicReserveLines={strategicReserveLines}
                      baselineListingSaleDisplayOverride={null}
                      listingUnitSaleDisplayOverride={precoExibicaoCard}
                      salePriceEditControl={salePriceEditControl}
                      cardFooterNotice={card.avisoRodape ?? null}
                      layoutPiFixo={embedded}
                    />
                  ) : (
                    <div className="pricing-listing-type-compare__unavailable" role="status">
                      <p className="pricing-listing-type-compare__unavailable-title">
                        {listingTypePillLabel(card.type)}
                      </p>
                      <p className="pricing-listing-type-compare__unavailable-text">
                        {cardErroSimulacao
                          ? String(stCard.erro)
                          : "Não foi possível montar o card para este anúncio. Verifique o baseline e sincronize o anúncio."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pricing-listing-type-right-stack">
            {tabRailSlot ? (
              <div className="pricing-listing-type-right-stack__tab-rail">{tabRailSlot}</div>
            ) : null}
            {childrenComComando ? (
              <div className="pricing-listing-type-right-stack__config">{childrenComComando}</div>
            ) : null}
            <div className="pricing-listing-type-right-stack__chart pricing-intelligence-page__chart-slot anuncios-pricing-modal__ml-chart-slot pricing-intelligence-page__chart-slot--page-vertical-compact">
              <PricingSalePriceListingTypeChartPlaceholder
                classicScenario={obterCenarioExibicao("classic")}
                premiumScenario={obterCenarioExibicao("premium")}
              />
            </div>
            {footerSlot ? (
              <div className="pricing-listing-type-right-stack__footer">{footerSlot}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Tag>
  );
}
