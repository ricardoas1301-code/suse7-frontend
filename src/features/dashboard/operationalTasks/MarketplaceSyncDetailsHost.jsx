// ======================================================================
// Host reutilizável — modal Detalhes da sincronização (S1.01 / S1.04)
// Abre no Dashboard/OT sem depender da rota Integrações.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl, apiFetch } from "../../../config/api.js";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";
import MarketplaceSyncDetailsModal from "../../../components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx";
import { buildMercadoLivreSyncDetailsPresentation } from "../../../components/Profile/marketplaceIntegration/mercadoLivreSyncDetailsAdapter.js";
import { mercadoLivrePresentation } from "../../../components/Profile/marketplaceIntegration/mercadoLivrePresentation.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const POLL_MS = 4000;

/**
 * @param {{
 *   open: boolean;
 *   marketplaceAccountId: string | null;
 *   onClose: () => void;
 *   mode?: "view" | "start";
 * }} props
 */
export default function MarketplaceSyncDetailsHost({
  open,
  marketplaceAccountId,
  onClose,
  mode = "view",
}) {
  const accountId =
    marketplaceAccountId != null && UUID_RE.test(String(marketplaceAccountId).trim())
      ? String(marketplaceAccountId).trim()
      : null;

  const [account, setAccount] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [syncPayload, setSyncPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));
  const [starting, setStarting] = useState(false);
  const fetchGenRef = useRef(0);

  const loadSyncStatus = useCallback(async () => {
    if (!accountId) return;
    const gen = ++fetchGenRef.current;
    setFetching(true);
    setLoadError(null);
    try {
      await ensureAuthSessionBootstrapped();
      const url = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(accountId)}/sync-status`);
      if (!url) {
        setLoadError("API indisponível.");
        return;
      }
      const res = await apiFetch(url, { method: "GET", cache: "no-store" });
      if (gen !== fetchGenRef.current) return;
      if (!res.ok || !res.data?.ok) {
        setLoadError(res.error || "Não foi possível carregar a sincronização.");
        return;
      }
      setSyncPayload(res.data);
      const checklist = Array.isArray(res.data?.checklist) ? res.data.checklist : [];
      const salesStep = checklist.find((s) => String(s?.key || "") === "sales_recent");
      const salesBucket = String(salesStep?.status || "").toLowerCase();
      if (salesBucket === "running" || salesBucket === "done" || Number(salesStep?.progress_current) > 0) {
        const { notifySsotSalesDataRefresh } = await import("../../sales/ssotSalesDataRefresh.js");
        notifySsotSalesDataRefresh({
          source: "marketplace_sync_details_host",
          marketplace_account_id: accountId,
        });
      }
    } catch (e) {
      if (gen !== fetchGenRef.current) return;
      setLoadError(e?.message ? String(e.message) : "Falha ao carregar sincronização.");
    } finally {
      if (gen === fetchGenRef.current) setFetching(false);
    }
  }, [accountId]);

  const loadAccount = useCallback(async () => {
    if (!accountId) return;
    try {
      await ensureAuthSessionBootstrapped();
      const url = buildApiUrl("/api/marketplace/accounts");
      if (!url) return;
      const res = await apiFetch(url, { method: "GET", cache: "no-store" });
      const list = Array.isArray(res.data?.accounts)
        ? res.data.accounts
        : Array.isArray(res.data)
          ? res.data
          : [];
      const row = list.find((a) => String(a?.id) === accountId) ?? null;
      setAccount(row || { id: accountId, status: "active" });
    } catch {
      setAccount({ id: accountId, status: "active" });
    }
  }, [accountId]);

  useEffect(() => {
    if (!open || !accountId) return undefined;
    void loadAccount();
    void loadSyncStatus();
    const timer = setInterval(() => {
      void loadSyncStatus();
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      fetchGenRef.current += 1;
    };
  }, [open, accountId, loadAccount, loadSyncStatus]);

  useEffect(() => {
    if (!open) {
      setSyncPayload(null);
      setLoadError(null);
      setStarting(false);
    }
  }, [open]);

  const presentation = useMemo(() => {
    if (!accountId) return null;
    const acc = account || { id: accountId, status: "active" };
    return buildMercadoLivreSyncDetailsPresentation(acc, syncPayload, {
      companiesById: new Map(),
    });
  }, [account, accountId, syncPayload]);

  const overall = String(syncPayload?.overall || "").toLowerCase();
  const awaitingStart = overall === "awaiting_start" || mode === "start";

  const handleStart = useCallback(async () => {
    if (!accountId || starting) return;
    setStarting(true);
    try {
      await ensureAuthSessionBootstrapped();
      const url = buildApiUrl(
        `/api/marketplace/accounts/${encodeURIComponent(accountId)}/start-initial-sync`,
      );
      if (!url) return;
      await apiFetch(url, { method: "POST", body: {} });
      await loadSyncStatus();
    } finally {
      setStarting(false);
    }
  }, [accountId, starting, loadSyncStatus]);

  if (!open || !accountId || !presentation) return null;

  return (
    <MarketplaceSyncDetailsModal
      key={`ot-sync-details-${accountId}`}
      open
      onClose={onClose}
      stackLayer="top"
      contextMarketplaceAccountId={accountId}
      marketplaceLogoSrc={mercadoLivrePresentation.logoHeaderSrc}
      marketplaceLogoAlt={mercadoLivrePresentation.logoAlt}
      presentation={presentation}
      stepsLoading={fetching && !syncPayload}
      loadErrorMessage={loadError}
      footer={
        awaitingStart ? (
          <button
            type="button"
            className="ml-button primary ml-onboarding-cta"
            disabled={starting}
            onClick={() => void handleStart()}
          >
            {starting ? "Iniciando…" : "Sincronizar"}
          </button>
        ) : (
          <p className="ml-onboarding-footnote">
            Status atualizado enquanto você navega. Não é necessário manter este modal aberto.
          </p>
        )
      }
    />
  );
}
