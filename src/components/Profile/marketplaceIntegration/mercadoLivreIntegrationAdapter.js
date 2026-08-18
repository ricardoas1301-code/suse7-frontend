import { MARKETPLACE_INTEGRATION_IDS } from "./marketplaceIntegrationTypes.js";
import { buildMercadoLivreSyncExecutiveSummaryLines } from "./marketplaceSyncExecutiveSummary.js";
import { resolveSyncStepStatusBucket } from "./marketplaceSyncExecutionSummary.js";

export const MERCADO_LIVRE_MARKETPLACE_ID = MARKETPLACE_INTEGRATION_IDS.MERCADO_LIVRE;

function syncJobStatusPt(status) {
  const bucket = resolveSyncStepStatusBucket(status);
  if (bucket === "completed") return "concluído";
  if (bucket === "running") return "em andamento";
  if (bucket === "pending") return "na fila";
  if (bucket === "error") return "com erro";
  return String(status || "").toLowerCase() || "—";
}

function formatSyncAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function statusLabelPt(status) {
  const v = String(status || "").toLowerCase();
  if (v === "active") return "Ativa";
  if (v === "removed") return "Removida";
  if (v === "expired" || v === "invalid") return "Reautenticar";
  return status || "—";
}

/** Prefer sync-status `connection`; fallback to campos planos do GET accounts. */
export function mergeMlConnection(acc, summary) {
  const c = summary?.connection;
  if (c && typeof c === "object") {
    return {
      health: c.health ?? "unknown",
      badge_label: c.badge_label ?? "—",
      alert_message: c.alert_message ?? null,
      show_reconnect: c.show_reconnect === true,
      monitoring_headline: c.monitoring_headline ?? null,
      pipeline_active: c.pipeline_active === true,
    };
  }
  return {
    health: acc.connection_health ?? "unknown",
    badge_label: acc.connection_badge_label ?? "—",
    alert_message: acc.connection_alert_message ?? null,
    show_reconnect: acc.show_reconnect_cta === true,
    monitoring_headline: acc.monitoring_headline ?? null,
    pipeline_active: acc.pipeline_active === true,
  };
}

export function mlSyncViewNeedsEmphasis(summary) {
  if (!summary) return false;
  if (summary.sync_attention_required === true) return true;
  const ov = String(summary.overall || "").toLowerCase();
  if (ov === "running" || ov === "error" || ov === "completed_with_errors") return true;
  if (summary.historical_backfill_active === true) return true;
  if (summary.stalled === true) return true;
  if (summary.pending_queued_too_long === true) return true;
  return false;
}

/**
 * Conta ativa com sync-status consultável (running, concluída, erro ou pendência).
 * Conclusão não remove o acesso aos detalhes.
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {boolean} isActive
 */
export function mlAccountCanOpenSyncDetails(summary, isActive) {
  if (!isActive) return false;
  if (!summary) return false;
  if (summary.initial_sync_engaged === true) return true;
  const ov = String(summary.overall || "").toLowerCase();
  if (ov && ov !== "awaiting_start") return true;
  if (Array.isArray(summary.checklist) && summary.checklist.length > 0) {
    return summary.checklist.some((row) => {
      const st = String(row?.status || "").toLowerCase();
      return st === "done" || st === "running" || st === "error" || st === "completed";
    });
  }
  return false;
}

export function mlAccountFullyStable(summary, connection) {
  if (!summary || !connection) return false;
  if (connection.show_reconnect === true) return false;
  const ov = String(summary.overall || "").toLowerCase();
  if (ov !== "done") return false;
  if (summary.historical_backfill_active === true) return false;
  if (summary.sync_attention_required === true) return false;
  return true;
}

function resolveAccountAlias(account) {
  return (
    account.account_alias ||
    account.ml_nickname ||
    `Conta ${String(account.external_seller_id || "").slice(0, 8)}`
  );
}

function resolveCompanyName(account) {
  return account.company_trade_name || account.company_name || "—";
}

function resolveBadge(account, connection, isActive) {
  if (!isActive) {
    return { label: statusLabelPt(account.status), tone: "muted" };
  }
  return {
    label: connection.badge_label || "—",
    tone: connection.show_reconnect ? "warn" : "ok",
  };
}

/**
 * @param {Record<string, unknown>} account
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {{ linkedCompany?: import("./marketplaceIntegrationTypes.js").MarketplaceLinkedCompanyPresentation }} [options]
 */
export function buildMercadoLivreIntegrationCardPresentation(account, summary, options = {}) {
  const alias = resolveAccountAlias(account);
  const companyName = resolveCompanyName(account);
  const isActive = String(account.status || "").toLowerCase() === "active";
  const connection = mergeMlConnection(account, summary);
  const presentation =
    summary?.sync_presentation && typeof summary.sync_presentation === "object"
      ? summary.sync_presentation
      : null;
  const statusHeadline =
    presentation?.historical_active === true
      ? "Importação histórica em andamento"
      : connection.monitoring_headline ||
        (isActive && !connection.show_reconnect ? "Monitoramento ativo" : null);
  const linkedCompany = options.linkedCompany ?? {
    id: account.seller_company_id != null ? String(account.seller_company_id) : null,
    name: companyName,
    avatarUrl: null,
    avatarAlt: `Logo da empresa ${companyName}`,
    avatarInitial: companyName.charAt(0).toUpperCase() || "E",
  };

  return {
    marketplaceId: MERCADO_LIVRE_MARKETPLACE_ID,
    marketplaceLabel: "Mercado Livre",
    accountName: alias,
    companyName,
    statusHeadline,
    statusBadge: resolveBadge(account, connection, isActive),
    linkedCompany,
    muted: !isActive,
    ariaLabel: `Ver detalhes da integração Mercado Livre da conta ${alias}`,
  };
}

/**
 * @param {Record<string, unknown>} account
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {{ integrationStage?: { label?: string; detail?: string } | null; linkedCompanyDocumentFormatted?: string }} [options]
 */
export function buildMercadoLivreIntegrationModalPresentation(account, summary, options = {}) {
  const alias = resolveAccountAlias(account);
  const companyName = resolveCompanyName(account);
  const isActive = String(account.status || "").toLowerCase() === "active";
  const connection = mergeMlConnection(account, summary);
  const executiveLines = buildMercadoLivreSyncExecutiveSummaryLines(summary, { connection });
  const linkedCompanyDocumentFormatted =
    options.linkedCompanyDocumentFormatted != null && String(options.linkedCompanyDocumentFormatted).trim() !== ""
      ? String(options.linkedCompanyDocumentFormatted).trim()
      : "—";
  const accountIdentifier =
    account.company_document_masked != null && String(account.company_document_masked).trim() !== ""
      ? String(account.company_document_masked).trim()
      : account.external_seller_id != null && String(account.external_seller_id).trim() !== ""
        ? String(account.external_seller_id).trim()
        : "—";

  const recentRow = summary?.checklist?.find((x) => x.key === "sales_recent");
  const histRow = summary?.checklist?.find((x) => x.key === "historical_sales");
  const histBucket = resolveSyncStepStatusBucket(histRow?.status);
  const histExecutive =
    histBucket === "completed"
      ? "concluído"
      : histBucket === "running"
        ? "em andamento"
        : histBucket === "error"
          ? "com erro"
          : histBucket === "pending"
            ? "na fila"
            : "—";

  /** @type {import("./marketplaceIntegrationTypes.js").MarketplaceIntegrationDetailRow[]} */
  const integrationStateRows = [
    {
      label: "Conta",
      value: isActive ? connection.badge_label || "Ativa" : statusLabelPt(account.status),
      tone: connection.show_reconnect ? "warn" : isActive ? "ok" : "muted",
    },
    {
      label: "Monitoramento",
      value:
        connection.monitoring_headline ||
        (isActive && !connection.show_reconnect ? "Ativo" : "—"),
      tone: connection.show_reconnect ? "warn" : "ok",
    },
    {
      label: "Dados recentes",
      value: recentRow ? syncJobStatusPt(recentRow.status) : "—",
      tone: String(recentRow?.status || "").toLowerCase() === "error" ? "error" : "unknown",
    },
    {
      label: "Histórico de vendas",
      value: histRow ? histExecutive : "—",
      tone: String(histRow?.status || "").toLowerCase() === "error" ? "error" : "unknown",
    },
    {
      label: "Último sincronismo",
      value: formatSyncAt(account.last_sync_at),
    },
  ];

  /** @type {string[]} */
  const diagnosticLines = [];
  for (const line of executiveLines) {
    if (line?.trim()) diagnosticLines.push(line.trim());
  }

  return {
    marketplaceId: MERCADO_LIVRE_MARKETPLACE_ID,
    modalTitle: "Integração Mercado Livre",
    modalSubtitle:
      "Gerencie a conexão, acompanhe a sincronização e consulte o estado da conta.",
    accountName: alias,
    companyName,
    linkedCompanyName: companyName,
    linkedCompanyDocumentFormatted,
    accountIdentifier,
    statusBadge: resolveBadge(account, connection, isActive),
    integrationStateRows,
    diagnosticLines,
    operationalAlert: connection.alert_message ?? null,
    showSyncViewLink: mlAccountCanOpenSyncDetails(summary, isActive),
    syncViewEmphasis: mlSyncViewNeedsEmphasis(summary),
    showReconnectAction: isActive && connection.show_reconnect === true,
    showSyncDetailsAction: mlAccountCanOpenSyncDetails(summary, isActive),
    isActive,
  };
}
