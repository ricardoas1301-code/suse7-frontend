// ======================================================================
// Visibilidade account-aware — Importação inteligente (Dashboard)
// Conta A done NÃO pode esconder Conta B awaiting_start.
// ======================================================================

/**
 * @param {unknown} overall
 * @returns {string}
 */
export function normalizarOverallImportacao(overall) {
  return String(overall || "").toLowerCase().trim();
}

/**
 * @param {any[]} accounts
 */
export function particionarContasImportIntelligence(accounts) {
  const list = Array.isArray(accounts) ? accounts : [];
  /** @type {any[]} */
  const awaitingStart = [];
  /** @type {any[]} */
  const activeOrAttention = [];
  /** @type {any[]} */
  const done = [];

  for (const acc of list) {
    const overall = normalizarOverallImportacao(acc?.overall);
    if (overall === "awaiting_start") {
      awaitingStart.push(acc);
      continue;
    }
    if (overall === "done") {
      done.push(acc);
      continue;
    }
    activeOrAttention.push(acc);
  }

  return { awaitingStart, activeOrAttention, done, all: list };
}

/**
 * Seller só está “importação concluída” se NÃO houver awaiting_start
 * e todas as contas restantes estiverem done sem backfill ativo.
 * @param {any[]} accounts
 */
export function sellerTemImportacaoTotalmenteConcluida(accounts) {
  const list = Array.isArray(accounts) ? accounts : [];
  if (list.length === 0) return false;
  const { awaitingStart } = particionarContasImportIntelligence(list);
  if (awaitingStart.length > 0) return false;
  return list.every(
    (a) =>
      a?.hot_sync_complete === true &&
      a?.historical_backfill_active !== true &&
      normalizarOverallImportacao(a?.overall) === "done",
  );
}

/**
 * Conta awaiting_start deve aparecer no card mesmo se outra conta já engajou.
 * @param {any} account
 */
export function contaExigeInicioDeSincronizacao(account) {
  return normalizarOverallImportacao(account?.overall) === "awaiting_start";
}

/**
 * Label do CTA por conta (account-aware).
 * @param {any} account
 */
export function rotuloCtaImportacaoPorConta(account) {
  if (contaExigeInicioDeSincronizacao(account)) {
    return "Iniciar sincronização";
  }
  return "Ver sincronização em andamento";
}

/**
 * Compact summary do card Dashboard — não esconde awaiting atrás de “sincronizando”.
 * @param {any[]} accounts
 * @param {boolean} isCompleted
 */
export function buildDashboardImportCompactSummaryAccountAware(accounts, isCompleted) {
  if (isCompleted) {
    return {
      primary: "Todas as contas sincronizadas",
      secondary: null,
    };
  }

  const { awaitingStart, activeOrAttention, done, all } = particionarContasImportIntelligence(accounts);

  if (awaitingStart.length > 0) {
    if (awaitingStart.length === 1) {
      const name =
        String(awaitingStart[0]?.display_name || awaitingStart[0]?.account_label || "").trim() ||
        "Conta Mercado Livre";
      return {
        primary: `${name}: sincronização necessária`,
        secondary:
          done.length + activeOrAttention.length > 0
            ? "Outras contas seguem operando normalmente"
            : "Toque para iniciar a importação",
      };
    }
    return {
      primary: `${awaitingStart.length} contas aguardando sincronização`,
      secondary: "Cada conta inicia de forma independente",
    };
  }

  const activeAccounts = all.filter((a) => normalizarOverallImportacao(a?.overall) !== "done");
  const count = activeAccounts.length > 0 ? activeAccounts.length : all.length;
  const primary = count === 1 ? "1 conta sincronizando" : `${count} contas sincronizando`;

  const anyHotIncomplete = all.some((a) => a?.hot_sync_complete !== true);
  const anyHotRunning = all.some(
    (a) => !a?.hot_sync_complete && String(a?.hot_sync?.status || "").toLowerCase() === "running",
  );

  const pcts = all
    .map((a) => Number(a?.primary_progress_percent))
    .filter((n) => Number.isFinite(n));
  const avgPct =
    pcts.length > 0 ? Math.round(pcts.reduce((sum, n) => sum + n, 0) / pcts.length) : null;

  let secondary;
  if (anyHotIncomplete && anyHotRunning) {
    secondary = "Camada rápida em execução";
  } else if (avgPct != null) {
    secondary = `${avgPct}% concluído`;
  } else if (anyHotIncomplete) {
    secondary = "Camada rápida em execução";
  } else {
    secondary = "Sincronizando…";
  }

  return { primary, secondary };
}

/**
 * Gate do CTA idle global: só quando TODAS as contas estão awaiting
 * E nenhuma engajou (single-account / pré-primeira sync).
 * Multiconta com Conta A engajada + Conta B awaiting NÃO usa este gate.
 * @param {{
 *   accounts?: any[];
 *   layout?: string;
 *   accountId?: string | null;
 *   anyEngaged?: boolean;
 * }} params
 */
export function deveMostrarCtaIdleGlobalImportacao({
  accounts = [],
  layout = "dashboard",
  accountId = null,
  anyEngaged = false,
} = {}) {
  const list = Array.isArray(accounts) ? accounts : [];
  if (list.length === 0) return false;
  const allAwaiting = list.every((a) => normalizarOverallImportacao(a?.overall) === "awaiting_start");
  if (!allAwaiting) return false;

  if (layout === "modal" && accountId != null && String(accountId).trim() !== "") {
    return true;
  }
  return !anyEngaged;
}
