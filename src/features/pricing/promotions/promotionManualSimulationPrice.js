// ======================================================
// PI — Promoções Beta: preço manual de simulação (sessão local, não SSOT).
// ======================================================

import Decimal from "decimal.js";

import { formatarPrecoRealExibicao } from "../../../components/pricing/precoInicialAnuncioPrecificacao.js";
import { resolverPrecoOriginalPromocaoMonetario } from "../../../components/pricing/pricingPromotionCardContract.js";
import { resolvePromotionSelectionId } from "../../../components/pricing/pricingPromotionCarouselUi.js";

export const MANUAL_SIMULATION_PRICE_SOURCE = "USER_PROVIDED_SIMULATION_PRICE";

export const PROMOTION_MANUAL_PRICE_INVALID_MSG = "Informe um preço válido.";

export const PROMOTION_MANUAL_INPUT_LABEL = "Preço final da promoção";

export const PROMOTION_MANUAL_INPUT_PLACEHOLDER = "R$ 0,00";

export const PROMOTION_MANUAL_CTA_SIMULAR = "Simular";

export const PROMOTION_MANUAL_CTA_EDITAR = "Editar valor";

export const PROMOTION_MANUAL_DESCONTO_TITULO = "Desconto calculado";

export const PROMOTION_MANUAL_PRECO_INFORMADO_PREFIXO = "Preço informado:";

export const PROMOTION_MANUAL_SEM_DESCONTO = "Sem desconto";

export const PROMOTION_MANUAL_ACIMA_REFERENCIA = "Preço acima do valor de referência";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidDecimalMoneyString(value) {
  if (value == null || String(value).trim() === "") return false;
  try {
    const d = new Decimal(String(value).trim().replace(",", "."));
    return d.isFinite() && d.gt(0);
  } catch {
    return false;
  }
}

/**
 * @param {string} decimalString
 * @returns {string | null}
 */
export function formatarDecimalBrlExibicao(decimalString) {
  if (!isValidDecimalMoneyString(decimalString)) return null;
  try {
    const d = new Decimal(String(decimalString).trim().replace(",", "."));
    return formatarPrecoRealExibicao(Number(d.toFixed(2)));
  } catch {
    return null;
  }
}

/**
 * @param {string} decimalString
 * @returns {number | null}
 */
export function decimalBrlParaNumeroSimulacao(decimalString) {
  if (!isValidDecimalMoneyString(decimalString)) return null;
  try {
    const d = new Decimal(String(decimalString).trim().replace(",", "."));
    return Number(d.toFixed(2));
  } catch {
    return null;
  }
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true; priceBrl: string } | { ok: false; error: string }}
 */
export function validarPrecoManualSimulacao(raw) {
  if (raw == null || String(raw).trim() === "") {
    return { ok: false, error: PROMOTION_MANUAL_PRICE_INVALID_MSG };
  }
  const t = String(raw)
    .trim()
    .replace(/[R$r$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (t === "" || t === "-") {
    return { ok: false, error: PROMOTION_MANUAL_PRICE_INVALID_MSG };
  }
  try {
    const d = new Decimal(t);
    if (!d.isFinite() || d.isNaN() || !d.gt(0)) {
      return { ok: false, error: PROMOTION_MANUAL_PRICE_INVALID_MSG };
    }
    return { ok: true, priceBrl: d.toFixed(2) };
  } catch {
    return { ok: false, error: PROMOTION_MANUAL_PRICE_INVALID_MSG };
  }
}

/**
 * @param {{
 *   row: { scenario: unknown; group: string };
 *   index: number;
 *   listingExternalId?: string | null;
 *   accountId?: string | null;
 * }} params
 */
export function montarIdentidadeManualPromocao({ row, index, listingExternalId = null, accountId = null }) {
  const scenario =
    row?.scenario != null && typeof row.scenario === "object"
      ? /** @type {Record<string, unknown>} */ (row.scenario)
      : null;
  const contract =
    scenario?.promotion_card_contract != null && typeof scenario.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.promotion_card_contract)
      : scenario?.promotion_offer_contract != null && typeof scenario.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (scenario.promotion_offer_contract)
        : null;

  const selectionId = resolvePromotionSelectionId(row, index);
  const listingId = listingExternalId != null ? String(listingExternalId).trim() : "";
  const accId =
    accountId != null && String(accountId).trim() !== ""
      ? String(accountId).trim()
      : scenario?.account_id != null
        ? String(scenario.account_id).trim()
        : "";

  const startDate =
    contract?.start_date != null
      ? String(contract.start_date).trim()
      : scenario?.start_date != null
        ? String(scenario.start_date).trim()
        : "";
  const endDate =
    contract?.end_date != null
      ? String(contract.end_date).trim()
      : scenario?.end_date != null
        ? String(scenario.end_date).trim()
        : "";

  const identityKey = [accId, listingId, selectionId, startDate, endDate].filter(Boolean).join("::");

  return {
    identityKey,
    selectionId,
    accountId: accId || null,
    listingId: listingId || null,
    startDate: startDate || null,
    endDate: endDate || null,
    promotionId:
      contract?.promotion_id != null
        ? String(contract.promotion_id)
        : scenario?.promotion_id != null
          ? String(scenario.promotion_id)
          : null,
    offerId:
      contract?.offer_id != null
        ? String(contract.offer_id)
        : scenario?.offer_id != null
          ? String(scenario.offer_id)
          : null,
    candidateId: scenario?.candidate_id != null ? String(scenario.candidate_id) : null,
    type:
      contract?.promotion_type != null
        ? String(contract.promotion_type)
        : scenario?.promotion_type != null
          ? String(scenario.promotion_type)
          : scenario?.type != null
            ? String(scenario.type)
            : null,
    subType:
      contract?.promotion_sub_type != null
        ? String(contract.promotion_sub_type)
        : scenario?.promotion_sub_type != null
          ? String(scenario.promotion_sub_type)
          : scenario?.sub_type != null
            ? String(scenario.sub_type)
            : null,
  };
}

/**
 * @param {{
 *   precoManualBrl: string;
 *   scenario: unknown;
 *   catalogRow?: Record<string, unknown> | null;
 * }} params
 * @returns {{
 *   kind: "desconto" | "sem_desconto" | "acima_referencia" | "sem_base";
 *   resumoLinha?: string | null;
 *   titulo?: string | null;
 *   mensagem?: string | null;
 *   precoInformadoExibicao?: string | null;
 * } | null}
 */
export function calcularDescontoApresentacaoManual({ precoManualBrl, scenario, catalogRow = null }) {
  if (!isValidDecimalMoneyString(precoManualBrl)) return null;

  const precoInformadoExibicao = formatarDecimalBrlExibicao(precoManualBrl);
  const baseHit = resolverPrecoOriginalPromocaoMonetario(scenario, catalogRow);
  if (baseHit == null || !(baseHit.valor > 0)) {
    return {
      kind: "sem_base",
      precoInformadoExibicao,
      titulo: null,
      resumoLinha: null,
      mensagem: precoInformadoExibicao
        ? `${PROMOTION_MANUAL_PRECO_INFORMADO_PREFIXO} ${precoInformadoExibicao}`
        : null,
    };
  }

  try {
    const manual = new Decimal(String(precoManualBrl).trim().replace(",", "."));
    const base = new Decimal(String(baseHit.valor));

    if (manual.eq(base)) {
      return {
        kind: "sem_desconto",
        precoInformadoExibicao,
        titulo: PROMOTION_MANUAL_SEM_DESCONTO,
        resumoLinha: null,
        mensagem: null,
      };
    }

    if (manual.gt(base)) {
      return {
        kind: "acima_referencia",
        precoInformadoExibicao,
        titulo: PROMOTION_MANUAL_ACIMA_REFERENCIA,
        resumoLinha: null,
        mensagem: null,
      };
    }

    const amount = base.minus(manual);
    const percent = amount.div(base).times(100);
    const percentLabel = `${percent.toFixed(2).replace(".", ",")}%`;
    const amountLabel = formatarPrecoRealExibicao(Number(amount.toFixed(2)));

    return {
      kind: "desconto",
      precoInformadoExibicao,
      titulo: PROMOTION_MANUAL_DESCONTO_TITULO,
      resumoLinha: `${percentLabel} · ${amountLabel}`,
      mensagem: null,
    };
  } catch {
    return {
      kind: "sem_base",
      precoInformadoExibicao,
      titulo: null,
      resumoLinha: null,
      mensagem: precoInformadoExibicao
        ? `${PROMOTION_MANUAL_PRECO_INFORMADO_PREFIXO} ${precoInformadoExibicao}`
        : null,
    };
  }
}

/**
 * @param {{
 *   identityKey: string;
 *   priceBrl: string;
 *   identity: ReturnType<typeof montarIdentidadeManualPromocao>;
 * }} params
 * @returns {import("./promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord}
 */
export function criarRegistroPrecoManualSimulacao({ identityKey, priceBrl, identity }) {
  return {
    identityKey,
    priceBrl,
    source: MANUAL_SIMULATION_PRICE_SOURCE,
    createdAt: new Date().toISOString(),
    identity,
  };
}
