import { mergeMlConnection } from "./mercadoLivreIntegrationAdapter.js";
import {
  resolveLinkedCompanyDocumentFormatted,
  resolveLinkedCompanyPresentation,
} from "./marketplaceIntegrationFormat.js";
import { buildMarketplaceSyncExecutionSummary } from "./marketplaceSyncExecutionSummary.js";
import { buildMarketplaceSyncStepsPresentation } from "./marketplaceSyncStepPresentation.js";
import {
  buildMarketplaceSyncConnectStepLine,
  filterMarketplaceSyncStepsForSellerSummary,
  partitionMarketplaceSyncStepsForModal,
} from "./marketplaceSyncStepModalVisibility.js";

function resolveAccountAlias(account) {
  return (
    account?.account_alias ||
    account?.ml_nickname ||
    `Conta ${String(account?.external_seller_id || "").slice(0, 8)}`
  );
}

function resolveAccountIdentifier(account) {
  if (account?.company_document_masked != null && String(account.company_document_masked).trim() !== "") {
    return String(account.company_document_masked).trim();
  }
  if (account?.external_seller_id != null && String(account.external_seller_id).trim() !== "") {
    return String(account.external_seller_id).trim();
  }
  return "—";
}

function resolveStatusBadgeTone(account, connection) {
  const isActive = String(account?.status || "").toLowerCase() === "active";
  if (!isActive) return "muted";
  return connection.show_reconnect ? "warn" : "ok";
}

function resolveSyncHeaderTone(summary) {
  const presentationTone = summary?.sync_presentation?.sync_summary_tone;
  if (presentationTone === "error") return "warn";
  if (presentationTone === "processing") return "processing";
  if (presentationTone === "ok") return "ok";
  if (presentationTone === "warn") return "warn";

  const overall = String(summary?.overall || "").toLowerCase();
  if (summary?.historical_backfill_active === true && overall === "done") return "processing";
  if (overall === "error" || overall === "completed_with_errors") return "warn";
  if (overall === "done") return "ok";
  if (overall === "running") return "processing";
  return "unknown";
}

/**
 * @param {Record<string, unknown>} account
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {{
 *   companiesById?: Map<string, Record<string, unknown>>;
 *   checklist?: Array<Record<string, unknown>>;
 *   supportMessage?: string | null;
 * }} [options]
 */
export function buildMercadoLivreSyncDetailsPresentation(account, summary, options = {}) {
  const connection = mergeMlConnection(account, summary);
  const linkedCompany = resolveLinkedCompanyPresentation(
    options.companiesById ?? new Map(),
    account?.seller_company_id,
    account?.company_trade_name || account?.company_name
  );
  const linkedCompanyDocumentFormatted = resolveLinkedCompanyDocumentFormatted(
    options.companiesById ?? new Map(),
    account?.seller_company_id
  );
  const checklist = options.checklist ?? summary?.checklist ?? [];
  const allSteps = buildMarketplaceSyncStepsPresentation(checklist);
  const { connectStep, gridSteps } = partitionMarketplaceSyncStepsForModal(allSteps);
  const connectStepLine = buildMarketplaceSyncConnectStepLine(connectStep);
  const stepsForSummary = filterMarketplaceSyncStepsForSellerSummary(allSteps);
  const executionSummary = buildMarketplaceSyncExecutionSummary(stepsForSummary, summary, account);

  const supportMessage =
    options.supportMessage ??
    (summary?.description != null && String(summary.description).trim() !== ""
      ? String(summary.description).trim()
      : "Conta Mercado Livre conectada com sucesso. Agora vamos sincronizar seus dados para preparar o Suse7.");

  return {
    header: {
      title: "Detalhes da sincronização",
      statusLabel:
        summary?.sync_presentation?.sync_summary_label != null &&
        String(summary.sync_presentation.sync_summary_label).trim() !== ""
          ? String(summary.sync_presentation.sync_summary_label).trim()
          : summary?.title != null && String(summary.title).trim() !== ""
            ? String(summary.title).trim()
            : executionSummary.overallSituation,
      statusTone: resolveSyncHeaderTone(summary),
      supportMessage,
    },
    connectedAccount: {
      marketplaceName: "Mercado Livre",
      accountName: resolveAccountAlias(account),
      statusBadge: {
        label: connection.badge_label || "—",
        tone: resolveStatusBadgeTone(account, connection),
      },
      linkedCompanyName: linkedCompany.name,
      linkedCompanyDocumentFormatted,
      linkedCompanyAvatarUrl: linkedCompany.avatarUrl,
      linkedCompanyAvatarAlt: linkedCompany.avatarAlt,
      linkedCompanyAvatarInitial: linkedCompany.avatarInitial,
      accountIdentifier: resolveAccountIdentifier(account),
    },
    connectStepLine,
    steps: gridSteps,
    stepsAll: allSteps,
    executionSummary,
  };
}

/**
 * @param {Array<Record<string, unknown>>} accounts
 * @returns {Array<{ id: string; label: string }>}
 */
export function buildMercadoLivreSyncAccountPickerOptions(accounts) {
  if (!Array.isArray(accounts)) return [];
  return accounts.map((account) => ({
    id: String(account.id),
    label: resolveAccountAlias(account),
  }));
}
