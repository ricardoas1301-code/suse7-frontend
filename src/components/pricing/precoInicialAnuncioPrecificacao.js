// ======================================================
// Preço unitário real do anúncio — Precificação Inteligente (sem métricas agregadas).
// ======================================================

import { formatarBrlApiNumero } from "./pricingScenarioLocalSimulation.js";

const DASH = "—";
const TETO_PRECO_UNITARIO_BRL = 500_000;

/** Chaves/fontes que nunca devem alimentar “Valor de venda” na PI. */
const FONTES_REJEITADAS = /revenue|fatur|gross|acumul|accum|sold_quantity|quantidade.?vend|visitas|visits|payout|repasse|lucro|profit|margin|margem/i;

/**
 * Interpreta string/número de preço unitário BRL sem confundir milhar BR com decimal API.
 * @param {unknown} raw
 * @returns {{ ok: true; valor: number; parsePath: string } | { ok: false; motivo: string }}
 */
export function interpretarPrecoUnitarioBrlBruto(raw) {
  if (raw == null) return { ok: false, motivo: "nulo" };
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return normalizarNumeroPrecoUnitario(raw, "numero_direto");
  }

  const t = String(raw)
    .trim()
    .replace(/[R$r$\s]/g, "")
    .replace(/[^\d,.-]/g, "");
  if (t === "" || t === "-") return { ok: false, motivo: "vazio" };

  if (t.includes(",")) {
    const n = Number(t.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return { ok: false, motivo: "numero_invalido" };
    return { ok: true, valor: n, parsePath: "br_virgula_decimal" };
  }

  if (/^\d+\.\d{1,2}$/.test(t)) {
    const n = Number(t);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, motivo: "numero_invalido" };
    const [intPart, frac] = t.split(".");
    if (n >= 1000 && frac === "00") {
      const comoCentavos = Number(intPart) / 100;
      if (comoCentavos >= 0.01 && comoCentavos <= 50_000) {
        return { ok: true, valor: comoCentavos, parsePath: "api_centavos_ponto_00" };
      }
    }
    return { ok: true, valor: n, parsePath: "ponto_decimal_api" };
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    const n = Number(t.replace(/\./g, ""));
    if (!Number.isFinite(n) || n <= 0) return { ok: false, motivo: "numero_invalido" };
    return { ok: true, valor: n, parsePath: "br_milhar_ponto" };
  }

  if (/^\d+$/.test(t)) {
    const int = Number(t);
    return normalizarNumeroPrecoUnitario(int, "inteiro");
  }

  if (t.includes(".")) {
    const partes = t.split(".");
    if (partes.length === 2 && partes[1].length > 2) {
      const n = Number(t.replace(/\./g, ""));
      if (Number.isFinite(n) && n > 0) return { ok: true, valor: n, parsePath: "ponto_ambiguo_sem_fracao_curta" };
    }
  }

  return { ok: false, motivo: "formato_nao_reconhecido" };
}

/**
 * @param {number} n
 * @param {string} parsePathBase
 */
function normalizarNumeroPrecoUnitario(n, parsePathBase) {
  if (!Number.isFinite(n) || n <= 0) return { ok: false, motivo: "numero_invalido" };

  if (Number.isInteger(n) && n >= 1000 && n <= 9_999_999) {
    const comoCentavos = n / 100;
    if (comoCentavos >= 0.01 && comoCentavos <= 50_000) {
      return { ok: true, valor: comoCentavos, parsePath: `${parsePathBase}|centavos_inteiro` };
    }
  }

  return { ok: true, valor: n, parsePath: parsePathBase };
}

/**
 * @param {unknown} raw
 * @param {string} fonte
 */
function parsePrecoUnitarioCandidato(raw, fonte) {
  if (raw == null) return null;
  if (FONTES_REJEITADAS.test(fonte)) return null;

  const texto = String(raw).trim();
  if (texto === "") return null;

  const parsed = interpretarPrecoUnitarioBrlBruto(raw);
  if (!parsed.ok) return null;

  const { valor, parsePath } = parsed;
  if (valor > TETO_PRECO_UNITARIO_BRL) return null;

  const fonteFinal = parsePath !== fonte ? `${fonte}|${parsePath}` : fonte;

  return {
    valor,
    valorApi: formatarBrlApiNumero(valor),
    fonte: fonteFinal,
    bruto: texto,
  };
}

/**
 * @param {number} valor
 */
export function formatarPrecoRealExibicao(valor) {
  if (!Number.isFinite(valor) || valor <= 0) return DASH;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {{
 *   catalogRow?: Record<string, unknown> | null;
 *   payload?: unknown;
 *   baselineRow?: { scenario: unknown } | null;
 * }} ctx
 */
export function resolverPrecoRealAnuncioPrecificacao(ctx) {
  /** @type {{ valor: number; valorApi: string; fonte: string; bruto: string }[]} */
  const candidatos = [];
  /** @type {{ fonte: string; bruto: unknown; motivo: string; valor_tentado?: number }[]} */
  const descartados = [];

  const row = ctx.catalogRow;

  /**
   * @param {unknown} raw
   * @param {string} fonte
   */
  const tentar = (raw, fonte) => {
    if (raw == null || (typeof raw === "string" && String(raw).trim() === "")) {
      descartados.push({ fonte, bruto: raw, motivo: "vazio" });
      return;
    }
    if (FONTES_REJEITADAS.test(fonte)) {
      descartados.push({ fonte, bruto: raw, motivo: "fonte_rejeitada_por_nome" });
      return;
    }
    const c = parsePrecoUnitarioCandidato(raw, fonte);
    if (c != null) {
      candidatos.push(c);
      return;
    }
    const parsed = interpretarPrecoUnitarioBrlBruto(raw);
    descartados.push({
      fonte,
      bruto: raw,
      motivo: parsed.ok ? "acima_teto_ou_rejeitado_pos_parse" : parsed.motivo,
      valor_tentado: parsed.ok ? parsed.valor : undefined,
    });
  };

  if (row != null && typeof row === "object") {
    tentar(row.listingSalePriceBrl, "catalogo.listing_sale_price_brl");
    tentar(row.listingPriceBrl, "catalogo.listing_price_brl");
    tentar(row.listing_price_brl, "catalogo.listing_price_brl_snake");
    tentar(row.effectiveSalePriceBrl, "catalogo.effective_sale_price_brl");
    if (row.price != null && Number.isFinite(Number(row.price))) {
      tentar(row.price, "catalogo.price");
    }
    const pcm =
      row.product_card_metrics != null && typeof row.product_card_metrics === "object"
        ? /** @type {Record<string, unknown>} */ (row.product_card_metrics)
        : null;
    if (pcm) {
      tentar(pcm.salePriceBrl, "catalogo.product_card_metrics.sale_price_brl");
      tentar(pcm.listingPriceBrl, "catalogo.product_card_metrics.listing_price_brl");
      tentar(pcm.currentPriceBrl, "catalogo.product_card_metrics.current_price_brl");
    }
  }

  const payload = ctx.payload;
  const rec =
    payload != null && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload) : null;
  const sx =
    rec?.sale_xray_modal != null && typeof rec.sale_xray_modal === "object"
      ? /** @type {Record<string, unknown>} */ (rec.sale_xray_modal)
      : null;
  if (sx?.normal_scenario != null && typeof sx.normal_scenario === "object") {
    const N = /** @type {Record<string, unknown>} */ (sx.normal_scenario);
    const pr =
      N.pricing != null && typeof N.pricing === "object"
        ? /** @type {Record<string, unknown>} */ (N.pricing)
        : null;
    if (pr?.sale_price_brl != null) {
      tentar(pr.sale_price_brl, "sale_xray_modal.normal_scenario.pricing.sale_price_brl");
    }
  }

  const baseline = ctx.baselineRow?.scenario;
  if (baseline != null && typeof baseline === "object") {
    const b = /** @type {Record<string, unknown>} */ (baseline);
    const m =
      b.marketplace != null && typeof b.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (b.marketplace)
        : null;
    const sxP =
      b.sale_xray_pricing != null && typeof b.sale_xray_pricing === "object"
        ? /** @type {Record<string, unknown>} */ (b.sale_xray_pricing)
        : null;
    if (m?.sale_price_brl != null) {
      tentar(m.sale_price_brl, "baseline.marketplace.sale_price_brl");
    }
    if (sxP?.sale_price_brl != null) {
      tentar(sxP.sale_price_brl, "baseline.sale_xray_pricing.sale_price_brl");
    }
  }

  const prioridade = [
    "catalogo.listing_sale_price_brl",
    "catalogo.listing_price_brl",
    "catalogo.listing_price_brl_snake",
    "catalogo.product_card_metrics.current_price_brl",
    "catalogo.product_card_metrics.sale_price_brl",
    "catalogo.effective_sale_price_brl",
    "catalogo.price",
    "sale_xray_modal.normal_scenario.pricing.sale_price_brl",
    "baseline.marketplace.sale_price_brl",
    "baseline.sale_xray_pricing.sale_price_brl",
  ];

  const casaComPrioridade = (/** @type {string} */ key) =>
    candidatos.filter((c) => c.fonte === key || c.fonte.startsWith(`${key}|`));

  let escolhido = null;
  for (const key of prioridade) {
    const hits = casaComPrioridade(key);
    if (hits.length === 0) continue;
    escolhido = hits.find((h) => h.valor <= 50_000) ?? hits[0];
    break;
  }

  if (escolhido == null && candidatos.length > 0) {
    const ordenados = [...candidatos].sort((a, b) => a.valor - b.valor);
    escolhido = ordenados.find((c) => c.valor <= 50_000) ?? ordenados[0];
  }

  if (escolhido != null) {
    for (const c of candidatos) {
      if (c.fonte === escolhido.fonte && c.bruto === escolhido.bruto && c.valor === escolhido.valor) {
        continue;
      }
      descartados.push({
        fonte: c.fonte,
        bruto: c.bruto,
        motivo: "candidato_nao_escolhido",
        valor_tentado: c.valor,
      });
    }
  }

  return {
    valor: escolhido?.valor ?? null,
    valorApi: escolhido?.valorApi ?? null,
    exibicao: escolhido != null ? formatarPrecoRealExibicao(escolhido.valor) : DASH,
    fonte: escolhido?.fonte ?? null,
    candidatos: candidatos.map((c) => ({
      fonte: c.fonte,
      bruto: c.bruto,
      valor: c.valor,
    })),
    descartados,
  };
}

/**
 * @param {ReturnType<typeof resolverPrecoRealAnuncioPrecificacao>} preco
 * @param {string | null | undefined} externalListingId
 */
export function logDiagnosticoPrecoInicialPrecificacao(preco, externalListingId) {
  if (!import.meta.env.DEV) return;
  console.log("[S7 PI][Preço inicial]", {
    external_listing_id: externalListingId ?? null,
    preco_escolhido: preco.valor,
    preco_exibicao: preco.exibicao,
    fonte: preco.fonte,
    candidatos: preco.candidatos,
    candidatos_descartados: preco.descartados,
  });
}
