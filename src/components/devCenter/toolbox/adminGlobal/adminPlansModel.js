// ======================================================
// ADMIN GLOBAL — MODEL DE PLANOS (S1_3)
// ------------------------------------------------------
// Catálogo de status, formatação de exibição e validação leve de
// entrada. NENHUMA regra financeira sensível vive aqui — o backend
// é a fonte da verdade e revalida tudo. O frontend apenas exibe e
// envia valores em formato seguro (string para preço).
// ======================================================

/** Status administrativos do plano. */
export const PLAN_STATUS = Object.freeze({
  ATIVO: "ativo",
  INATIVO: "inativo",
  FUTURO: "futuro",
  INTERNO: "interno",
});

/**
 * Catálogo ordenado (fonte única de selects/badges).
 * @type {ReadonlyArray<{ value: string; label: string; tone: string }>}
 */
export const PLAN_STATUS_CATALOGO = Object.freeze([
  { value: PLAN_STATUS.ATIVO, label: "Ativo", tone: "sucesso" },
  { value: PLAN_STATUS.INATIVO, label: "Inativo", tone: "neutro" },
  { value: PLAN_STATUS.FUTURO, label: "Futuro", tone: "info" },
  { value: PLAN_STATUS.INTERNO, label: "Interno", tone: "alerta" },
]);

/** @param {string} status */
export function metaPlanStatus(status) {
  const item = PLAN_STATUS_CATALOGO.find((s) => s.value === status);
  return item ? { label: item.label, tone: item.tone } : { label: status || "—", tone: "neutro" };
}

/**
 * Formata um preço (string decimal "1234.56") em BRL sem usar float.
 * Trabalha por manipulação de string para evitar imprecisão.
 * @param {string | null | undefined} precoStr
 */
export function formatarPrecoBRL(precoStr) {
  if (precoStr == null || precoStr === "") return "—";
  const s = String(precoStr).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return `R$ ${s}`;
  const [inteiroRaw, decRaw = ""] = s.split(".");
  const decimais = (decRaw + "00").slice(0, 2);
  const inteiro = inteiroRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${inteiro},${decimais}`;
}

/**
 * Validação leve do input de preço (o backend revalida e persiste).
 * Aceita "1234,56" ou "1234.56". Retorna { valido, valor } (valor em string).
 * @param {string} entrada
 */
export function validarPrecoInput(entrada) {
  const s = String(entrada ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return { valido: false, valor: null };
  return { valido: true, valor: s };
}

/**
 * Formata o limite mensal de vendas para exibição.
 * @param {number | null | undefined} limite
 */
export function formatarLimiteVendas(limite) {
  if (limite == null) return "Ilimitado";
  return `${Number(limite).toLocaleString("pt-BR")} vendas/mês`;
}
