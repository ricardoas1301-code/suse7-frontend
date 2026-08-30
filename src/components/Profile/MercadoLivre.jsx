// ======================================================================
// PÁGINA: Mercado Livre — multi-conta + vínculo empresa (OAuth backend)
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl, apiFetch } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import MarketplaceCompanyPickerModal from "./MarketplaceCompanyPickerModal";
import "./Profile.css";
import "./MercadoLivre.css";
import S7ImportIntelligencePanel from "../import/S7ImportIntelligencePanel";
import MarketplaceIntegrationCard from "./marketplaceIntegration/MarketplaceIntegrationCard.jsx";
import MarketplaceIntegrationModal from "./marketplaceIntegration/MarketplaceIntegrationModal.jsx";
import MarketplaceSyncDetailsModal from "./marketplaceIntegration/MarketplaceSyncDetailsModal.jsx";
import MarketplaceIntegrationPageLayout, {
  MarketplaceConnectionVisual,
} from "./marketplaceIntegration/MarketplaceIntegrationPageLayout.jsx";
import {
  buildMercadoLivreIntegrationCardPresentation,
  buildMercadoLivreIntegrationModalPresentation,
} from "./marketplaceIntegration/mercadoLivreIntegrationAdapter.js";
import {
  buildMercadoLivreSyncDetailsPresentation,
} from "./marketplaceIntegration/mercadoLivreSyncDetailsAdapter.js";
import { mercadoLivrePresentation } from "./marketplaceIntegration/mercadoLivrePresentation.js";
import {
  buildSellerCompaniesById,
  resolveLinkedCompanyDocumentFormatted,
  resolveLinkedCompanyPresentation,
} from "./marketplaceIntegration/marketplaceIntegrationFormat.js";
import { sortMarketplaceIntegrationsChronologically } from "./marketplaceIntegration/sortMarketplaceIntegrationsChronologically.js";
import {
  ML_INTEGRATION_HISTORICAL_SALES_MESSAGE,
  ML_INTEGRATION_OAUTH_INTRO,
  ML_SYNC_DETAILS_CTA_LABEL,
} from "./marketplaceIntegration/mercadoLivreIntegrationCopy.js";
import "./marketplaceIntegration/s7ModalStack.css";
import MarketplaceSyncDetailsOpeningIndicator from "./marketplaceIntegration/MarketplaceSyncDetailsOpeningIndicator.jsx";
import { podeFecharModalDetalhesSincronizacao } from "./marketplaceIntegration/mercadoLivreSyncDetailsDismissPolicy.js";

const ML_OAUTH_SUCCESS_TOAST_GAP_MS = 3500;
let _mlOAuthSuccessToastLastAt = 0;
const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";
const ML_SYNC_MODAL_QS = "ml_sync_modal";
const ML_POST_CONNECT_QS = "ml_post_connect";
const ML_ACCOUNT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Detecta mensagem de token ausente no checklist (sync-status / jobs). */
function checklistHasTokensMissing(payload) {
  const rows = Array.isArray(payload?.checklist) ? payload.checklist : [];
  return rows.some((row) => {
    const em = String(row?.error_message ?? "").toLowerCase();
    return em.includes("tokens não encontrados") || em.includes("tokens nao encontrados");
  });
}

function logSyncPayloadTokensMissing(payload, ctx) {
  if (!checklistHasTokensMissing(payload)) return;
  console.warn("[ml/ui] sync_payload_tokens_missing", {
    marketplace_account_id: ctx?.marketplace_account_id ?? payload?.marketplace_account_id ?? null,
    external_seller_id: ctx?.external_seller_id ?? null,
    seller_company_id: ctx?.seller_company_id ?? null,
  });
}

/** Placeholder até GET sync-status responder (mesma ordem do backend). */
const ML_DEFAULT_CHECKLIST = [
  { key: "ml_connect", label: "Conectando conta Mercado Livre", status: "pending" },
  { key: "sales_recent", label: "Vendas recentes", status: "pending" },
  { key: "listings", label: "Anúncios", status: "pending" },
  { key: "fees", label: "Taxas", status: "pending" },
  { key: "products", label: "Produtos/SKU", status: "pending" },
  { key: "customers", label: "Clientes 360", status: "pending" },
  { key: "monitoring", label: "Webhook/monitoramento", status: "pending" },
  { key: "historical_sales", label: "Histórico de vendas", status: "pending" },
];

function readStoredMlIntegrationStage(accountId) {
  if (!accountId) return null;
  try {
    const raw = sessionStorage.getItem(`s7_ml_integration_stage:${accountId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function MercadoLivre() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bannerError, setBannerError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [syncingId, setSyncingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  /** Modal de gestão — visão executiva no card, detalhes operacionais aqui. */
  const [manageModalAccountId, setManageModalAccountId] = useState(null);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingAccountId, setOnboardingAccountId] = useState(null);
  const [syncStatusPayload, setSyncStatusPayload] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingSyncStarting, setOnboardingSyncStarting] = useState(false);
  /** Após POST start-initial-sync com sucesso (permite fechar modal quando sync-status ainda não refletiu). */
  const [initialPipelineEngaged, setInitialPipelineEngaged] = useState(false);

  /** GET /sync-status por conta (cards Integrações). */
  const [syncSummariesByAccountId, setSyncSummariesByAccountId] = useState({});
  const [syncStatusFetching, setSyncStatusFetching] = useState(false);

  /** Modal 1 — visão operacional “Importação inteligente” (painel grande só aqui). */
  const [operationalImportModalOpen, setOperationalImportModalOpen] = useState(false);
  /** OAuth retornou UUID na URL mas GET accounts ainda não listou essa linha — não usar outra conta como fallback. */
  const [oauthAwaitingAccountInList, setOauthAwaitingAccountInList] = useState(false);

  /** Empresas para o modal de integração (multi-marketplace). */
  const [integrationCompanies, setIntegrationCompanies] = useState([]);
  const [integrationPickerOpen, setIntegrationPickerOpen] = useState(false);
  const syncViewButtonRef = useRef(null);
  const syncDetailsFetchGenRef = useRef(0);
  const syncDetailsOpeningAccountIdRef = useRef(null);
  const [syncDetailsOpeningAccountId, setSyncDetailsOpeningAccountId] = useState(null);
  /** Após OAuth com ml_awaiting_sync: redireciona ao Dashboard (sem modal intermediário). */
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  const loadAccounts = useCallback(async (opts = {}) => {
    const bust = opts && opts.noCache === true ? `&_s7_nocache=${Date.now()}` : "";
    const url = buildApiUrl(`/api/marketplace/accounts?marketplace=mercado_livre${bust}`);
    if (!url) return [];
    const fetchOpts = { method: "GET" };
    if (opts && opts.noCache === true) fetchOpts.cache = "no-store";
    const { ok, data } = await apiFetch(url, fetchOpts);
    if (ok && Array.isArray(data?.accounts)) return data.accounts;
    return [];
  }, []);

  const loadIntegrationCompanies = useCallback(async () => {
    const url = buildApiUrl("/api/seller/companies");
    if (!url) {
      setIntegrationCompanies([]);
      return [];
    }
    const { ok, data } = await apiFetch(url, { method: "GET" });
    const list = ok && Array.isArray(data?.companies) ? data.companies : [];
    setIntegrationCompanies(list);
    return list;
  }, []);

  const mlConnectedSellerCompanyIds = useMemo(() => {
    const s = new Set();
    for (const a of accounts) {
      if (String(a.status || "").toLowerCase() === "removed") continue;
      const sc = a.seller_company_id != null ? String(a.seller_company_id).trim() : "";
      if (sc) s.add(sc);
    }
    return s;
  }, [accounts]);

  const probeOAuthConfig = useCallback(async () => {
    const probeUrl = buildApiUrl("/api/ml/oauth-config");
    if (!probeUrl) return;
    try {
      const pr = await fetch(probeUrl);
      const probe = await pr.json().catch(() => ({}));
      if (probe && probe.ok === false && Array.isArray(probe.errors) && probe.errors.length) {
        setBannerError(
          (prev) =>
            prev ||
            [
              "Configuração OAuth no backend (DEV):",
              ...probe.errors,
              `redirectUri lido: ${probe.redirectUri || "—"}`,
            ].join(" ")
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const sp = new URLSearchParams(location.search);
        const errParam = sp.get("ml_error");
        const errDetail = sp.get("ml_error_detail");
        if (errParam === "token") {
          setBannerError(
            "Não foi possível trocar o código pelo token no Mercado Livre. Verifique ML_REDIRECT_URI e as credenciais da app DEV."
          );
        } else if (errParam === "save") {
          setBannerError(
            "A autorização funcionou, mas não foi possível salvar os tokens. Tente conectar novamente ou verifique o Supabase."
          );
        } else if (errParam === "persist_tokens_failed") {
          setBannerError(
            errDetail
              ? `A conta foi reconhecida, mas falhou ao salvar o token no banco (código: ${errDetail}). Verifique colunas/constraints de ml_tokens nos logs do callback ou rode scripts/introspect_ml_tokens_schema.sql.`
              : "A conta foi reconhecida, mas falhou ao salvar o token no banco. Verifique o Supabase (ml_tokens) e os logs do callback."
          );
        } else if (errParam === "incomplete_connect") {
          setBannerError(
            "Autorização recebida, mas não foi possível obter o perfil do vendedor no Mercado Livre (users/me). Tente conectar novamente ou contate o suporte."
          );
        } else if (errParam === "no_seller_company") {
          setBannerError(
            "Autorização recebida, mas não há empresa (CNPJ) vinculada ao seu perfil para associar a conta. Conclua o cadastro em Perfil da Empresa e tente novamente."
          );
        } else if (errParam === "oauth_company") {
          setBannerError(
            "Não foi possível identificar o CNPJ desta conexão. Refaça a conexão pela tela de Integrações."
          );
        } else if (errParam === "token_account_mismatch") {
          setBannerError(
            "Autorização recebida, mas o token da conta Mercado Livre não ficou alinhado com a conta criada. Refaça a conexão."
          );
        } else if (errParam === "account_save") {
          setBannerError(
            "Autorização e token salvos, mas não foi possível registrar a conta Mercado Livre no Suse7. Tente novamente ou contate o suporte."
          );
        } else if (errParam === "ml_cnpj_mismatch") {
          setBannerError(
            [
              "O documento da conta Mercado Livre não confere com o CNPJ da empresa selecionada no Suse7. Conecte usando a empresa correta ou entre na conta certa do Mercado Livre.",
              "Remova a autorização do Suse7 em Mercado Livre → Minhas aplicações e tente novamente com o CNPJ correto.",
            ].join(" ")
          );
        } else if (errParam === "ml_seller_wrong_company") {
          setBannerError(
            "Essa conta Mercado Livre já está vinculada a outra empresa no Suse7. Verifique se você entrou na conta correta do Mercado Livre."
          );
        } else if (errParam === "ml_company_already_connected") {
          setBannerError(
            "Esta empresa já possui outra conta Mercado Livre ativa. Cada CNPJ pode ter no máximo uma conta Mercado Livre."
          );
        } else if (errParam === "seller_company_id_required_for_ml_connect") {
          setBannerError(
            "Selecione a empresa (CNPJ) antes de autorizar o Mercado Livre. Use Integrações → Conectar e escolha a empresa."
          );
        } else if (errParam === "jobs_enqueue") {
          setBannerError(
            "Conta registrada, mas falhou ao enfileirar a sincronização inicial. Atualize a página ou abra esta tela de novo; se persistir, contate o suporte."
          );
        } else if (errParam === "missing_marketplace_account_id" || errParam === "invalid_account_uuid_for_redirect") {
          setBannerError(
            "Não foi possível finalizar a conexão da conta Mercado Livre. Tente novamente ou contate o suporte."
          );
        } else if (errParam && errDetail) {
          setBannerError(`Não foi possível concluir a integração (${errParam}). Tente novamente ou contate o suporte.`);
        }

        try {
          const rawStored = sessionStorage.getItem(ML_OAUTH_CONFIG_ERR_KEY);
          if (rawStored) {
            const arr = JSON.parse(rawStored);
            if (Array.isArray(arr) && arr.length) {
              setBannerError(arr.filter(Boolean).join(" "));
            }
            sessionStorage.removeItem(ML_OAUTH_CONFIG_ERR_KEY);
          }
        } catch {
          /* ignore */
        }

        await probeOAuthConfig();

        const mlConnectedFromOAuth = sp.get("ml") === "connected" || sp.get("connected") === "1";
        const mlAwaitingSync = sp.get("ml_awaiting_sync") !== "0";
        const mlAccountFromUrlRaw =
          sp.get("marketplace_account_id")?.trim() || sp.get("ml_account")?.trim() || null;
        const mlAccountFromUrl =
          typeof mlAccountFromUrlRaw === "string" && ML_ACCOUNT_UUID_RE.test(mlAccountFromUrlRaw.trim())
            ? mlAccountFromUrlRaw.trim()
            : null;
        if (mlConnectedFromOAuth && mlAccountFromUrlRaw && !mlAccountFromUrl) {
          console.warn("[ml/oauth/redirect] invalid_marketplace_account_id_param", {
            raw: mlAccountFromUrlRaw,
          });
        }
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        setUser(u);

        let loadedAccounts = [];
        if (u) {
          loadedAccounts = await loadAccounts();
          setAccounts(loadedAccounts);
          await loadIntegrationCompanies();
        } else {
          setAccounts([]);
          setIntegrationCompanies([]);
        }

        if (mlConnectedFromOAuth) {
          if (!mlAccountFromUrl) {
            console.warn("[ml/oauth/redirect] missing_valid_marketplace_account_id", {
              hadRawParam: Boolean(mlAccountFromUrlRaw),
            });
            setOauthAwaitingAccountInList(false);
            setOperationalImportModalOpen(false);
            setOnboardingOpen(false);
            setBannerError((prev) =>
              prev ||
              "Autorização recebida sem marketplace_account_id válido na URL. Atualize o backend ou tente conectar novamente."
            );
          } else {
            const targetId = String(mlAccountFromUrl);
            console.info("[ml/ui] oauth_target_account_id", { marketplace_account_id: targetId });
            console.info("[ml/oauth/redirect] marketplace_account_id_from_url", {
              marketplace_account_id: targetId,
            });

            setOnboardingAccountId((prev) => {
              if (prev && String(prev) !== targetId) {
                console.info("[ml/ui] discarded_stale_account_id", {
                  previous_onboarding_account_id: String(prev),
                  oauth_target_account_id: targetId,
                });
              }
              return targetId;
            });

            setSyncStatusPayload(null);
            setSyncSummariesByAccountId({});
            setOnboardingOpen(false);
            setOnboardingDismissed(false);
            setOnboardingSyncStarting(false);
            setInitialPipelineEngaged(false);
            if (mlAwaitingSync) {
              setOperationalImportModalOpen(false);
            } else {
              setOperationalImportModalOpen(true);
            }

            let latestAccounts = u ? await loadAccounts({ noCache: true }) : [];
            if (u) setAccounts(latestAccounts);

            let accountOnServer = latestAccounts.some((a) => String(a.id) === targetId);
            if (!accountOnServer && u) {
              setOauthAwaitingAccountInList(true);
              const maxAttempts = 30;
              for (let attempt = 0; attempt < maxAttempts && !accountOnServer; attempt++) {
                console.info("[ml/ui] accounts_refetched_after_oauth", { attempt, targetId });
                latestAccounts = await loadAccounts({ noCache: true });
                setAccounts(latestAccounts);
                accountOnServer = latestAccounts.some((a) => String(a.id) === targetId);
                if (accountOnServer) break;
                await new Promise((r) => setTimeout(r, 400));
              }
              setOauthAwaitingAccountInList(false);
            }

            if (accountOnServer) {
              console.info("[ml/ui] accounts_refetched_after_oauth", { targetId, ok: true });
          const now = Date.now();
          if (now - _mlOAuthSuccessToastLastAt >= ML_OAUTH_SUCCESS_TOAST_GAP_MS) {
            _mlOAuthSuccessToastLastAt = now;
            addNotification({
              event_type: "ML_INTEGRATION_OAUTH_SUCCESS",
              entity_type: "marketplace_integration",
                  entity_id: targetId,
              title: "Integração concluída",
              message: "Conta Mercado Livre conectada com sucesso.",
              severity: NOTIFICATION_SEVERITY.INFO,
                  dedupeKey: `ml-oauth-return-success:${targetId}`,
                });
              }
              const accRow = latestAccounts.find((a) => String(a.id) === targetId);
              const inList = Boolean(accRow);
              if (mlAwaitingSync) {
                navigate(
                  `/?ml_onboarding=connected&marketplace_account_id=${encodeURIComponent(targetId)}`,
                  { replace: true },
                );
                return;
              }
              if (inList) {
                const stUrl = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(targetId)}/sync-status`);
                if (stUrl) {
                  console.info("[ml/ui] sync_poll_start_for_account", {
                    marketplace_account_id: targetId,
                    in_accounts_list: true,
                    source: "oauth_return",
                  });
                  const pr = await apiFetch(stUrl, { method: "GET", cache: "no-store" });
                  if (pr.ok && pr.data?.ok) {
                    const mid = pr.data.marketplace_account_id;
                    if (mid != null && String(mid) !== String(targetId)) {
                      console.info("[ml/ui] sync_payload_discarded_wrong_account", {
                        expected_marketplace_account_id: targetId,
                        payload_marketplace_account_id: mid,
                      });
                    } else {
                      logSyncPayloadTokensMissing(pr.data, {
                        marketplace_account_id: targetId,
                        external_seller_id: accRow?.external_seller_id ?? null,
                        seller_company_id: accRow?.seller_company_id ?? null,
                      });
                      setSyncStatusPayload(pr.data);
                      setSyncSummariesByAccountId((prev) => ({ ...prev, [targetId]: pr.data }));
                      const ov = String(pr.data.overall || "").toLowerCase();
                      setInitialPipelineEngaged(ov !== "awaiting_start");
                    }
                  }
                }
              }
            } else {
              setOperationalImportModalOpen(false);
              setOnboardingAccountId(null);
              setBannerError((prev) =>
                prev ||
                "Autorização recebida, mas a nova conta ainda não apareceu na lista do Suse7. Atualize a página em alguns segundos ou contate o suporte."
              );
            }
          }
        }

        const nextSp = new URLSearchParams(location.search);
        let urlNeedsClean = false;
        if (nextSp.has("ml")) {
          nextSp.delete("ml");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_account")) {
          nextSp.delete("ml_account");
          urlNeedsClean = true;
        }
        if (nextSp.has("marketplace_account_id")) {
          nextSp.delete("marketplace_account_id");
          urlNeedsClean = true;
        }
        if (nextSp.has("connected")) {
          nextSp.delete("connected");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_error")) {
          nextSp.delete("ml_error");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_error_detail")) {
          nextSp.delete("ml_error_detail");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_awaiting_sync")) {
          nextSp.delete("ml_awaiting_sync");
          urlNeedsClean = true;
        }
        if (nextSp.has("jobs_created")) {
          nextSp.delete("jobs_created");
          urlNeedsClean = true;
        }
        if (urlNeedsClean) {
          const q = nextSp.toString();
          navigate(`${location.pathname}${q ? `?${q}` : ""}`, { replace: true });
        }
      } catch (e) {
        console.error("[MercadoLivre] load", e);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita refetch em loop com addNotification
  }, [location.pathname, location.search, navigate, loadAccounts, loadIntegrationCompanies, probeOAuthConfig]);

  /** Abre modal de acompanhamento via ?ml_sync_modal=<uuid> (Dashboard / link direto). Não cria jobs. */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const mid = sp.get(ML_SYNC_MODAL_QS)?.trim();
    if (!mid || !ML_ACCOUNT_UUID_RE.test(mid)) return undefined;
    let cancelled = false;
    (async () => {
      console.info("[ml/ui] oauth_target_account_id", { marketplace_account_id: mid, source: "ml_sync_modal_qs" });
      setSyncStatusPayload(null);
      setOnboardingAccountId(mid);
      setOnboardingOpen(false);
      setOnboardingDismissed(false);

      let list = await loadAccounts({ noCache: true });
      if (cancelled) return;
      setAccounts(list);
      let found = list.some((a) => String(a.id) === String(mid));
      if (!found) {
        setOauthAwaitingAccountInList(true);
        for (let attempt = 0; attempt < 20 && !found && !cancelled; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          list = await loadAccounts({ noCache: true });
          if (cancelled) return;
          setAccounts(list);
          found = list.some((a) => String(a.id) === String(mid));
        }
        setOauthAwaitingAccountInList(false);
      }

      if (!cancelled && found) {
        void openTechnicalSyncDetails(mid);
      }

      const next = new URLSearchParams(location.search);
      next.delete(ML_SYNC_MODAL_QS);
      const q = next.toString();
      navigate(`${location.pathname}${q ? `?${q}` : ""}`, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, loadAccounts]);

  /** Central de Pendências → abre modal técnico de sync (sem camada intermediária pós-OAuth). */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const mid = sp.get(ML_POST_CONNECT_QS)?.trim();
    if (!mid || !ML_ACCOUNT_UUID_RE.test(mid)) return undefined;
    let cancelled = false;
    (async () => {
      console.info("[ml/ui] oauth_target_account_id", { marketplace_account_id: mid, source: "ml_post_connect_qs" });
      setSyncStatusPayload(null);
      setOnboardingAccountId(mid);
      setOnboardingOpen(false);
      setOnboardingDismissed(false);

      let list = await loadAccounts({ noCache: true });
      if (cancelled) return;
      setAccounts(list);
      let found = list.some((a) => String(a.id) === String(mid));
      if (!found) {
        setOauthAwaitingAccountInList(true);
        for (let attempt = 0; attempt < 20 && !found && !cancelled; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          list = await loadAccounts({ noCache: true });
          if (cancelled) return;
          setAccounts(list);
          found = list.some((a) => String(a.id) === String(mid));
        }
        setOauthAwaitingAccountInList(false);
      }

      if (!cancelled && found) {
        void openTechnicalSyncDetails(mid);
      }

      const next = new URLSearchParams(location.search);
      next.delete(ML_POST_CONNECT_QS);
      const q = next.toString();
      navigate(`${location.pathname}${q ? `?${q}` : ""}`, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, loadAccounts]);

  useEffect(() => {
    if (!onboardingAccountId || !syncStatusPayload) return;
    const ov = String(syncStatusPayload.overall || "").toLowerCase();
    const histActive = syncStatusPayload.historical_backfill_active === true;
    if (ov === "error") {
      try {
        sessionStorage.removeItem(`s7_ml_integration_stage:${onboardingAccountId}`);
      } catch {
        /* ignore */
      }
      return;
    }
    if (ov === "done" && !histActive) {
      try {
        sessionStorage.removeItem(`s7_ml_integration_stage:${onboardingAccountId}`);
      } catch {
        /* ignore */
      }
      return;
    }
    if (!syncStatusPayload.integration_stage) return;
    try {
      sessionStorage.setItem(
        `s7_ml_integration_stage:${onboardingAccountId}`,
        JSON.stringify(syncStatusPayload.integration_stage)
      );
    } catch {
      /* ignore */
    }
  }, [onboardingAccountId, syncStatusPayload]);

  useEffect(() => {
    if (!syncStatusPayload || !onboardingAccountId) return;
    const pid = syncStatusPayload.marketplace_account_id;
    if (pid == null) return;
    if (String(pid) !== String(onboardingAccountId)) {
      console.info("[ml/ui] sync_payload_discarded_wrong_account", {
        payload_marketplace_account_id: pid,
        onboarding_account_id: onboardingAccountId,
      });
      setSyncStatusPayload(null);
    }
  }, [syncStatusPayload, onboardingAccountId]);

  const onboardingAccountInVisibleList = useMemo(() => {
    if (!onboardingAccountId) return false;
    return accounts.some(
      (a) =>
        String(a.id) === String(onboardingAccountId) &&
        String(a.status || "").toLowerCase() !== "removed"
    );
  }, [accounts, onboardingAccountId]);

  useEffect(() => {
    if (!onboardingAccountId || !onboardingOpen) return undefined;
    if (!onboardingAccountInVisibleList) {
      console.warn("[ml/ui] sync_poll_skipped_account_not_in_list", {
        marketplace_account_id: onboardingAccountId,
        source: "technical_modal",
      });
      return undefined;
    }
    console.info("[ml/ui] sync_poll_start_for_account", {
      marketplace_account_id: onboardingAccountId,
      in_accounts_list: true,
      modal_account_id: onboardingAccountId,
      source: "technical_modal",
    });
    let cancelled = false;
    let timer = null;
    const pollMs = () => (typeof document !== "undefined" && document.visibilityState === "hidden" ? 20000 : 8000);
    const poll = async () => {
      if (String(onboardingAccountId || "") === "") return;
      const url = buildApiUrl(
        `/api/marketplace/accounts/${encodeURIComponent(onboardingAccountId)}/sync-status`
      );
      if (!url) return;
      const { ok, data } = await apiFetch(url, { method: "GET", cache: "no-store" });
      if (cancelled || !ok || !data?.ok) return;
      const mid = data.marketplace_account_id;
      if (mid != null && String(mid) !== String(onboardingAccountId)) {
        console.info("[ml/ui] sync_payload_discarded_wrong_account", {
          expected_marketplace_account_id: onboardingAccountId,
          payload_marketplace_account_id: mid,
        });
        return;
      }
      const accRow = accounts.find(
        (a) =>
          String(a.id) === String(onboardingAccountId) &&
          String(a.status || "").toLowerCase() !== "removed"
      );
      logSyncPayloadTokensMissing(data, {
        marketplace_account_id: onboardingAccountId,
        external_seller_id: accRow?.external_seller_id ?? null,
        seller_company_id: accRow?.seller_company_id ?? null,
      });
      setSyncStatusPayload(data);
      setSyncSummariesByAccountId((prev) => ({ ...prev, [onboardingAccountId]: data }));
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (cancelled) return;
        await poll();
        schedule();
      }, pollMs());
    };
    poll();
    schedule();
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [onboardingAccountId, onboardingOpen, onboardingAccountInVisibleList, accounts]);

  const startOAuth = async (sellerCompanyId) => {
    if (!user) return;
    const co = sellerCompanyId != null && String(sellerCompanyId).trim() !== "" ? String(sellerCompanyId).trim() : "";
    if (!co) {
      addNotification({
        event_type: "ML_NO_COMPANY_SELECTED",
        entity_type: "marketplace_integration",
        entity_id: null,
        title: "Empresa obrigatória",
        message: "Selecione a empresa (CNPJ) que receberá esta conexão Mercado Livre.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }
    const probeUrl = buildApiUrl("/api/ml/oauth-config");
    if (!probeUrl) {
      addNotification({
        event_type: "ML_CFG",
        entity_type: "marketplace_integration",
        entity_id: null,
        title: "Configuração",
        message: "Defina VITE_API_BASE_URL.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }
      try {
        const pr = await fetch(probeUrl);
        const probe = await pr.json().catch(() => ({}));
        if (probe && probe.ok === false && Array.isArray(probe.errors) && probe.errors.length) {
          try {
            sessionStorage.setItem(ML_OAUTH_CONFIG_ERR_KEY, JSON.stringify(probe.errors));
          } catch {
            /* ignore */
          }
          setBannerError(probe.errors.filter(Boolean).join(" "));
          return;
        }
      } catch {
        /* segue */
      }
    navigate(`/ml/connect?seller_company_id=${encodeURIComponent(co)}`);
  };

  const visibleAccounts = useMemo(
    () =>
      sortMarketplaceIntegrationsChronologically({
        integrations: accounts.filter((a) => String(a.status || "").toLowerCase() !== "removed"),
        companies: integrationCompanies,
      }),
    [accounts, integrationCompanies]
  );

  const integrationAccountGridRows = useMemo(
    () => Math.max(1, Math.ceil(visibleAccounts.length / 2)),
    [visibleAccounts.length]
  );

  const integrationCompaniesById = useMemo(
    () => buildSellerCompaniesById(integrationCompanies),
    [integrationCompanies]
  );

  const manageModalAccount = useMemo(
    () => visibleAccounts.find((a) => String(a.id) === String(manageModalAccountId)) ?? null,
    [visibleAccounts, manageModalAccountId]
  );

  const manageModalPresentation = useMemo(() => {
    if (!manageModalAccount) return null;
    const summary = syncSummariesByAccountId[manageModalAccount.id] ?? null;
    const integrationStage =
      summary?.integration_stage ?? readStoredMlIntegrationStage(manageModalAccount.id);
    const linkedCompanyDocumentFormatted = resolveLinkedCompanyDocumentFormatted(
      integrationCompaniesById,
      manageModalAccount.seller_company_id
    );
    return buildMercadoLivreIntegrationModalPresentation(manageModalAccount, summary, {
      integrationStage,
      linkedCompanyDocumentFormatted,
    });
  }, [manageModalAccount, syncSummariesByAccountId, integrationCompaniesById]);

  const refreshAccountSyncSummary = useCallback(async (accountId) => {
    const url = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(accountId)}/sync-status`);
    if (!url) return;
    const pr = await apiFetch(url, { method: "GET", cache: "no-store" });
    if (pr.ok && pr.data?.ok) {
      const mid = pr.data.marketplace_account_id;
      if (mid != null && String(mid) !== String(accountId)) return;
      setSyncSummariesByAccountId((prev) => ({ ...prev, [accountId]: pr.data }));
    }
  }, []);

  const openManageModal = useCallback(
    (accountId) => {
      if (!accountId) return;
      setManageModalAccountId(accountId);
      if (!integrationCompanies.length) {
        void loadIntegrationCompanies();
      }
      void refreshAccountSyncSummary(accountId);
    },
    [refreshAccountSyncSummary, integrationCompanies.length, loadIntegrationCompanies]
  );

  const closeManageModal = useCallback(() => {
    setManageModalAccountId(null);
  }, []);

  const operationalModalAccount = useMemo(() => {
    if (!onboardingAccountId) return null;
    return (
      visibleAccounts.find((a) => String(a.id) === String(onboardingAccountId)) ||
      accounts.find((a) => String(a.id) === String(onboardingAccountId)) ||
      null
    );
  }, [visibleAccounts, accounts, onboardingAccountId]);

  useEffect(() => {
    if (!operationalImportModalOpen || !onboardingAccountId) return;
    if (operationalModalAccount) {
      console.info("[ml/ui] operational_modal_account_resolved", {
        onboarding_account_id: onboardingAccountId,
        external_seller_id: operationalModalAccount.external_seller_id ?? null,
        seller_company_id: operationalModalAccount.seller_company_id ?? null,
      });
    } else if (!oauthAwaitingAccountInList) {
      console.info("[ml/ui] operational_modal_account_resolved", {
        onboarding_account_id: onboardingAccountId,
        resolved: false,
      });
    }
  }, [
    operationalImportModalOpen,
    onboardingAccountId,
    operationalModalAccount,
    oauthAwaitingAccountInList,
  ]);

  const openIntegrationCompanyPicker = useCallback(async () => {
    if (!user) return;
    await loadIntegrationCompanies();
    setIntegrationPickerOpen(true);
  }, [user, loadIntegrationCompanies]);

  /** Primeira conta ML: mesmo fluxo — escolher empresa já cadastrada. */
  const handleConnectMyAccount = () => {
    if (!user) return;
    void openIntegrationCompanyPicker();
  };

  /** Nova conta: selecionar empresa disponível (cadastro de CNPJ só em Perfil da Empresa). */
  const handleConnectNewAccount = () => {
    if (!user) return;
    void openIntegrationCompanyPicker();
  };

  const handleSync = async (accountId) => {
    const url = buildApiUrl("/api/ml/sync-listings");
    if (!url) return;
    setSyncingId(accountId);
    try {
      const { ok, data, error } = await apiFetch(url, {
        method: "POST",
        body: { marketplace_account_id: accountId },
      });
      if (!ok) {
        addNotification({
          event_type: "ML_SYNC_ERR",
          entity_type: "marketplace_account",
          entity_id: accountId,
          title: "Sincronização",
          message: typeof error === "string" ? error : data?.error || "Falha ao sincronizar.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      addNotification({
        event_type: "ML_SYNC_OK",
        entity_type: "marketplace_account",
        entity_id: accountId,
        title: "Sincronização",
        message: "Importação de anúncios concluída ou em andamento no servidor.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
      setAccounts(await loadAccounts());
    } finally {
      setSyncingId(null);
    }
  };

  const handleStartInitialPipeline = async () => {
    if (!onboardingAccountId) return;
    const oid = String(onboardingAccountId);
    const inList = accounts.some(
      (a) => String(a.id) === oid && String(a.status || "").toLowerCase() !== "removed"
    );
    if (!inList) {
      console.warn("[ml/ui] start_initial_sync_skipped_account_not_in_list", { marketplace_account_id: oid });
      return;
    }
    const url = buildApiUrl(
      `/api/marketplace/accounts/${encodeURIComponent(onboardingAccountId)}/start-initial-sync`
    );
    if (!url) return;
    setOnboardingSyncStarting(true);
    try {
      const { ok, data, error } = await apiFetch(url, { method: "POST", body: {} });
      if (!ok) {
        addNotification({
          event_type: "ML_INITIAL_SYNC_ERR",
          entity_type: "marketplace_account",
          entity_id: onboardingAccountId,
          title: "Sincronização inicial",
          message: typeof error === "string" ? error : data?.error || "Não foi possível iniciar a sincronização.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      setInitialPipelineEngaged(true);
      const stUrl = buildApiUrl(
        `/api/marketplace/accounts/${encodeURIComponent(onboardingAccountId)}/sync-status`
      );
      if (stUrl) {
        console.info("[ml/ui] sync_poll_start_for_account", {
          marketplace_account_id: oid,
          in_accounts_list: true,
          source: "after_start_initial_sync",
        });
        const pr = await apiFetch(stUrl, { method: "GET", cache: "no-store" });
        if (pr.ok && pr.data?.ok) {
          const mid = pr.data.marketplace_account_id;
          if (mid != null && String(mid) !== String(onboardingAccountId)) {
            console.info("[ml/ui] sync_payload_discarded_wrong_account", {
              expected_marketplace_account_id: onboardingAccountId,
              payload_marketplace_account_id: mid,
            });
          } else {
            const accRow = accounts.find((a) => String(a.id) === oid);
            logSyncPayloadTokensMissing(pr.data, {
              marketplace_account_id: oid,
              external_seller_id: accRow?.external_seller_id ?? null,
              seller_company_id: accRow?.seller_company_id ?? null,
            });
            setSyncStatusPayload(pr.data);
            setSyncSummariesByAccountId((prev) => ({ ...prev, [onboardingAccountId]: pr.data }));
          }
        }
      }
      addNotification({
        event_type: "ML_INITIAL_SYNC_OK",
        entity_type: "marketplace_account",
        entity_id: onboardingAccountId,
        title: "Sincronização inicial",
        message:
          data?.skipped === true
            ? "A sincronização já estava em fila; acompanhe o progresso abaixo."
            : "Importação inicial enfileirada. Acompanhe o progresso abaixo.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } finally {
      setOnboardingSyncStarting(false);
    }
  };

  const handleRemove = async (accountId) => {
    if (!window.confirm("Remover esta conta do Suse7? Você poderá reconectar depois com OAuth.")) return;
    const url = buildApiUrl(`/api/marketplace/accounts/${accountId}`);
    if (!url) return;
    setRemovingId(accountId);
    try {
      const { ok, data, error } = await apiFetch(url, { method: "DELETE" });
      if (!ok) {
        addNotification({
          event_type: "ML_RM_ERR",
          entity_type: "marketplace_account",
          entity_id: accountId,
          title: "Remover conta",
          message: typeof error === "string" ? error : data?.error || "Não foi possível remover.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      addNotification({
        event_type: "ML_RM_OK",
        entity_type: "marketplace_account",
        entity_id: accountId,
        title: "Conta removida",
        message: "A integração foi desativada.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
      setAccounts(await loadAccounts());
      await loadIntegrationCompanies();
      setManageModalAccountId(null);
    } finally {
      setRemovingId(null);
    }
  };

  const visibleAccountIdsKey = useMemo(() => {
    return accounts
      .filter((a) => String(a.status || "").toLowerCase() !== "removed")
      .map((a) => a.id)
      .filter(Boolean)
      .sort()
      .join("|");
  }, [accounts]);

  const closeOperationalImportModal = () => {
    setOperationalImportModalOpen(false);
    setOnboardingOpen(false);
    setOauthAwaitingAccountInList(false);
  };

  /** Modal operacional — import intelligence + resumo amigável. */
  const openOperationalImportModal = async (accountId) => {
    if (!accountId) return;
    const inList = accounts.some(
      (a) => String(a.id) === String(accountId) && String(a.status || "").toLowerCase() !== "removed"
    );
    if (!inList) {
      console.warn("[ml/ui] operational_modal_skipped_account_not_in_list", { marketplace_account_id: accountId });
      return;
    }
    setSyncStatusPayload(null);
    setOnboardingAccountId(accountId);
    setOperationalImportModalOpen(true);
    setOnboardingOpen(false);
    setOnboardingDismissed(false);
    const cached = syncSummariesByAccountId[accountId];
    if (cached) setSyncStatusPayload(cached);
    const url = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(accountId)}/sync-status`);
    if (!url) return;
    console.info("[ml/ui] sync_poll_start_for_account", {
      marketplace_account_id: accountId,
      in_accounts_list: true,
      source: "operational_modal_open",
    });
    const pr = await apiFetch(url, { method: "GET", cache: "no-store" });
    if (pr.ok && pr.data?.ok) {
      const mid = pr.data.marketplace_account_id;
      if (mid != null && String(mid) !== String(accountId)) {
        console.info("[ml/ui] sync_payload_discarded_wrong_account", {
          expected_marketplace_account_id: accountId,
          payload_marketplace_account_id: mid,
        });
        return;
      }
      const accRow = accounts.find((a) => String(a.id) === String(accountId));
      logSyncPayloadTokensMissing(pr.data, {
        marketplace_account_id: accountId,
        external_seller_id: accRow?.external_seller_id ?? null,
        seller_company_id: accRow?.seller_company_id ?? null,
      });
      setSyncStatusPayload(pr.data);
      setSyncSummariesByAccountId((prev) => ({ ...prev, [accountId]: pr.data }));
      const ov = String(pr.data.overall || "").toLowerCase();
      setInitialPipelineEngaged(ov !== "awaiting_start");
    }
  };

  /** Modal 2 — checklist técnico (payload sync-status). Sempre passe o UUID do card (`acc.id`). */
  const openTechnicalSyncDetails = async (explicitAccountId) => {
    if (explicitAccountId == null || String(explicitAccountId).trim() === "") return;
    const accountId = String(explicitAccountId).trim();
    const inList = accounts.some(
      (a) => String(a.id) === accountId && String(a.status || "").toLowerCase() !== "removed"
    );
    if (!inList) {
      console.warn("[ml/ui] technical_modal_skipped_account_not_in_list", { marketplace_account_id: accountId });
      return;
    }
    setOperationalImportModalOpen(false);
    setSyncStatusPayload(null);
    setOnboardingAccountId(accountId);
    const requestGen = ++syncDetailsFetchGenRef.current;
    const cached = syncSummariesByAccountId[accountId];
    if (cached) setSyncStatusPayload(cached);
    const url = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(accountId)}/sync-status`);
    if (url) {
      setSyncStatusFetching(true);
      console.info("[ml/ui] sync_poll_start_for_account", {
        marketplace_account_id: accountId,
        in_accounts_list: true,
        source: "technical_modal_open",
      });
      try {
        const pr = await apiFetch(url, { method: "GET", cache: "no-store" });
        if (requestGen !== syncDetailsFetchGenRef.current) {
          console.info("[ml/ui] sync_payload_discarded_stale_request", {
            expected_marketplace_account_id: accountId,
            source: "technical_modal_open",
          });
          return;
        }
        if (pr.ok && pr.data?.ok) {
          const mid = pr.data.marketplace_account_id;
          if (mid != null && String(mid) !== String(accountId)) {
            console.info("[ml/ui] sync_payload_discarded_wrong_account", {
              expected_marketplace_account_id: accountId,
              payload_marketplace_account_id: mid,
            });
          } else {
            const accRow = accounts.find((a) => String(a.id) === String(accountId));
            logSyncPayloadTokensMissing(pr.data, {
              marketplace_account_id: accountId,
              external_seller_id: accRow?.external_seller_id ?? null,
              seller_company_id: accRow?.seller_company_id ?? null,
            });
            setSyncStatusPayload(pr.data);
            setSyncSummariesByAccountId((prev) => ({ ...prev, [accountId]: pr.data }));
            const ov = String(pr.data.overall || "").toLowerCase();
            setInitialPipelineEngaged(ov !== "awaiting_start");
          }
        }
      } finally {
        if (requestGen === syncDetailsFetchGenRef.current) {
          setSyncStatusFetching(false);
        }
      }
    }
    setOnboardingOpen(true);
  };

  const handleOpenSyncDetails = async (accountId) => {
    const id = accountId != null ? String(accountId).trim() : "";
    if (!id) return;
    if (syncDetailsOpeningAccountIdRef.current === id) return;

    syncDetailsOpeningAccountIdRef.current = id;
    setSyncDetailsOpeningAccountId(id);
    try {
      await openTechnicalSyncDetails(id);
    } finally {
      if (syncDetailsOpeningAccountIdRef.current === id) {
        syncDetailsOpeningAccountIdRef.current = null;
      }
      setSyncDetailsOpeningAccountId((current) => (current === id ? null : current));
    }
  };

  useEffect(() => {
    const ids = visibleAccountIdsKey ? visibleAccountIdsKey.split("|").filter(Boolean) : [];
    if (!ids.length) return undefined;
    let cancelled = false;
    const loadAll = async () => {
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const url = buildApiUrl(`/api/marketplace/accounts/${encodeURIComponent(id)}/sync-status`);
          if (!url) return null;
          const { ok, data } = await apiFetch(url, { method: "GET", cache: "no-store" });
          if (!ok || !data?.ok) return null;
          const mid = data.marketplace_account_id;
          if (mid != null && String(mid) !== String(id)) {
            console.info("[ml/ui] sync_payload_discarded_wrong_account", {
              expected_marketplace_account_id: id,
              payload_marketplace_account_id: mid,
            });
            return null;
          }
          return /** @type {[string, typeof data]} */ ([id, data]);
        })
      );
      if (cancelled) return;
      setSyncSummariesByAccountId((prev) => {
        const next = { ...prev };
        for (const p of pairs) {
          if (p) next[p[0]] = p[1];
        }
        return next;
      });
    };
    loadAll();
    const timer = setInterval(loadAll, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [visibleAccountIdsKey]);

  const overall = String(syncStatusPayload?.overall || "").toLowerCase();

  const awaitingPipelineStart =
    onboardingOpen &&
    onboardingAccountId &&
    !initialPipelineEngaged &&
    (overall === "awaiting_start" || syncStatusPayload == null);

  const dismissOnboardingModal = useCallback(() => {
    // awaiting_start NÃO bloqueia: seller pode fechar sem iniciar sincronização.
    if (!podeFecharModalDetalhesSincronizacao({ awaitingPipelineStart })) return;
    setOnboardingDismissed(true);
    setOnboardingOpen(false);
    if (manageModalAccountId) {
      window.requestAnimationFrame(() => {
        syncViewButtonRef.current?.focus();
      });
    }
  }, [awaitingPipelineStart, manageModalAccountId]);

  const integrationModalStacked =
    Boolean(manageModalAccountId) &&
    onboardingOpen &&
    onboardingAccountId != null &&
    String(onboardingAccountId) === String(manageModalAccountId);

  const checklistRowsForSync = useMemo(() => {
    const payloadAccountId = syncStatusPayload?.marketplace_account_id;
    const payloadMatchesAccount =
      payloadAccountId == null ||
      String(payloadAccountId) === String(onboardingAccountId);
    if (!payloadMatchesAccount) return ML_DEFAULT_CHECKLIST;
    return syncStatusPayload?.checklist?.length ? syncStatusPayload.checklist : ML_DEFAULT_CHECKLIST;
  }, [syncStatusPayload, onboardingAccountId]);

  const syncStatusForPresentation = useMemo(() => {
    if (!syncStatusPayload) return null;
    const payloadAccountId = syncStatusPayload.marketplace_account_id;
    if (payloadAccountId != null && String(payloadAccountId) !== String(onboardingAccountId)) {
      return null;
    }
    return syncStatusPayload;
  }, [syncStatusPayload, onboardingAccountId]);

  const syncContextAccount = useMemo(() => {
    if (!onboardingAccountId) return null;
    if (
      integrationModalStacked &&
      manageModalAccount &&
      String(manageModalAccount.id) === String(onboardingAccountId)
    ) {
      return manageModalAccount;
    }
    return (
      visibleAccounts.find((a) => String(a.id) === String(onboardingAccountId)) ||
      accounts.find((a) => String(a.id) === String(onboardingAccountId)) ||
      null
    );
  }, [integrationModalStacked, manageModalAccount, onboardingAccountId, visibleAccounts, accounts]);

  const syncDetailsPresentation = useMemo(() => {
    if (!syncContextAccount || !onboardingAccountId) return null;
    if (String(syncContextAccount.id) !== String(onboardingAccountId)) return null;
    return buildMercadoLivreSyncDetailsPresentation(syncContextAccount, syncStatusForPresentation, {
      companiesById: integrationCompaniesById,
      checklist: checklistRowsForSync,
    });
  }, [
    syncContextAccount,
    onboardingAccountId,
    syncStatusForPresentation,
    integrationCompaniesById,
    checklistRowsForSync,
  ]);

  useEffect(() => {
    const anyModalOpen =
      Boolean(manageModalAccountId) || onboardingOpen || operationalImportModalOpen || integrationPickerOpen;
    if (!anyModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [manageModalAccountId, onboardingOpen, operationalImportModalOpen, integrationPickerOpen]);

  if (loading) {
    return (
      <div className="dados-empresa-page ml-integrations-page">
        <div className="profile-card ml-card ml-card-wide s7-ml-integrations-hero">
          <p>Carregando integração...</p>
        </div>
      </div>
    );
  }


  /** Após iniciar pipeline: usuário não precisa ficar no modal (sync no servidor). */
  const showBackgroundSyncNotice =
    initialPipelineEngaged &&
    syncStatusPayload &&
    overall !== "done" &&
    overall !== "error" &&
    overall !== "completed_with_errors";

  return (
    <div className="dados-empresa-page ml-integrations-page">
      {operationalImportModalOpen && onboardingAccountId ? (
        <div className="ml-operational-import-backdrop" onMouseDown={closeOperationalImportModal}>
          <div
            className="ml-operational-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ml-operational-import-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ml-operational-import-top">
              <div className="ml-operational-import-head-text">
                <h2 id="ml-operational-import-title" className="ml-operational-import-title">
                  Importação inteligente
                </h2>
                <p className="ml-operational-import-lead">
                  Visão amigável do processamento em servidor seguro: camada rápida, histórico completo e monitoramento
                  contínuo — sem precisar manter esta página aberta.
                </p>
          </div>
              <button
                type="button"
                className="ml-operational-import-close"
                aria-label="Fechar"
                onClick={closeOperationalImportModal}
              >
                ×
              </button>
            </div>
            <div className="ml-operational-import-scroll">
              {oauthAwaitingAccountInList ? (
                <p className="ml-operational-import-lead" role="status">
                  Carregando conta conectada…
                </p>
              ) : null}
              <S7ImportIntelligencePanel
                key={`ml-import-intel-${onboardingAccountId || "none"}`}
                layout="modal"
                marketplaceAccountId={onboardingAccountId}
                sellerCompanyId={operationalModalAccount?.seller_company_id ?? null}
                externalSellerId={operationalModalAccount?.external_seller_id ?? null}
                focusedAccountId={onboardingAccountId}
                pollSeconds={45}
                onOpenTechnicalDetails={openTechnicalSyncDetails}
            />
          </div>
            <div className="ml-operational-import-footer">
              <button
                type="button"
                className="ml-button ghost"
                onClick={() => openTechnicalSyncDetails(onboardingAccountId)}
              >
                Ver detalhes da sincronização
              </button>
        </div>
          </div>
        </div>
      ) : null}

      {onboardingOpen && onboardingAccountId && syncDetailsPresentation ? (
        <MarketplaceSyncDetailsModal
          key={`sync-details-${onboardingAccountId}`}
          open
          onClose={dismissOnboardingModal}
          stackLayer="top"
          contextMarketplaceAccountId={onboardingAccountId}
          marketplaceLogoSrc={mercadoLivrePresentation.logoHeaderSrc}
          marketplaceLogoAlt={mercadoLivrePresentation.logoAlt}
          presentation={syncDetailsPresentation}
          stepsLoading={syncStatusFetching}
          footer={
            awaitingPipelineStart ? (
              <button
                type="button"
                className="ml-button primary ml-onboarding-cta"
                disabled={onboardingSyncStarting}
                onClick={() => handleStartInitialPipeline()}
              >
                {onboardingSyncStarting ? "Iniciando…" : "Sincronizar"}
              </button>
            ) : showBackgroundSyncNotice ? (
              <div className="ml-onboarding-background-sync">
                <p className="ml-onboarding-text">
                  {syncStatusPayload?.description ||
                    syncStatusPayload?.background_note ||
                    "Sua sincronização foi iniciada em segundo plano. Você já pode continuar usando o Suse7."}
                </p>
                {syncStatusPayload?.integration_stage?.label != null && (
                  <p className="ml-onboarding-stage-line" role="status">
                    <span className="ml-onboarding-stage-label">{syncStatusPayload.integration_stage.label}</span>
                    {syncStatusPayload.integration_stage.detail ? (
                      <span className="ml-onboarding-stage-detail"> — {syncStatusPayload.integration_stage.detail}</span>
                    ) : null}
                  </p>
                )}
                <p className="ml-onboarding-footnote">
                  Status atualizado nesta página enquanto você navega. Não é necessário manter este modal aberto.
                </p>
              </div>
            ) : overall === "done" && syncStatusPayload?.historical_backfill_active ? (
              <p className="ml-onboarding-final-hint ml-onboarding-final-hint--muted" role="status">
                {syncStatusPayload?.ml_historical_sales_ux?.processing_title ||
                  "Importando histórico disponível de vendas…"}
                {syncStatusPayload?.ml_historical_sales_ux?.processing_period_line
                  ? ` ${syncStatusPayload.ml_historical_sales_ux.processing_period_line}`
                  : ""}
              </p>
            ) : null
          }
        />
      ) : null}

      <MarketplaceIntegrationPageLayout
        title={mercadoLivrePresentation.displayName}
        accountGridRows={integrationAccountGridRows}
        bannerError={
          bannerError ? (
            <div className="ml-banner-error" role="alert">
              {bannerError}
            </div>
          ) : null
        }
        connectAction={
          visibleAccounts.length > 0 ? (
            <button
              type="button"
              className="s7-btn-nova-empresa"
              onClick={handleConnectNewAccount}
              disabled={!user}
            >
              Conectar nova conta
            </button>
          ) : null
        }
        securityContent={
          <div className="ml-connect-description">
            <p>{ML_INTEGRATION_OAUTH_INTRO}</p>
            {ML_INTEGRATION_HISTORICAL_SALES_MESSAGE.split(/\n\n+/).map((para, idx) => (
              <p key={idx}>{para.trim()}</p>
            ))}
          </div>
        }
        integrationsContent={
          visibleAccounts.length === 0 ? (
            <div className="ml-accounts-empty">
              <p className="ml-accounts-empty__title">Nenhuma conta Mercado Livre conectada</p>
              <p className="ml-accounts-empty__subtitle">
                Conecte sua conta para começar a importar seus anúncios e vendas.
              </p>
              <button type="button" className="ml-button primary" onClick={handleConnectMyAccount} disabled={!user}>
                Conectar minha conta
              </button>
            </div>
          ) : (
            <div className="s7-marketplace-integration-cards">
              {visibleAccounts.map((acc) => {
                const summary = syncSummariesByAccountId[acc.id] ?? null;
                const linkedCompany = resolveLinkedCompanyPresentation(
                  integrationCompaniesById,
                  acc.seller_company_id,
                  acc.company_trade_name || acc.company_name
                );
                const cardView = buildMercadoLivreIntegrationCardPresentation(acc, summary, {
                  linkedCompany,
                });
                return (
                  <MarketplaceIntegrationCard
                    key={acc.id}
                    marketplaceLabel={cardView.marketplaceLabel}
                    logoSrc={mercadoLivrePresentation.logoCardSrc}
                    logoAlt={mercadoLivrePresentation.logoAlt}
                    logoFrameVariant={mercadoLivrePresentation.logoFrameVariant}
                    accountName={cardView.accountName}
                    companyName={cardView.companyName}
                    statusHeadline={cardView.statusHeadline}
                    statusBadge={cardView.statusBadge}
                    linkedCompanyAvatarUrl={cardView.linkedCompany.avatarUrl}
                    linkedCompanyAvatarAlt={cardView.linkedCompany.avatarAlt}
                    linkedCompanyAvatarInitial={cardView.linkedCompany.avatarInitial}
                    muted={cardView.muted}
                    ariaLabel={cardView.ariaLabel}
                    onActivate={() => openManageModal(acc.id)}
                  />
                );
              })}
            </div>
          )
        }
        brandConnectionVisual={
          <MarketplaceConnectionVisual
            platformLogoSrc={mercadoLivrePresentation.connectionVisual.platformLogoSrc}
            platformLogoAlt={mercadoLivrePresentation.connectionVisual.platformLogoAlt}
            marketplaceLogoSrc={mercadoLivrePresentation.connectionVisual.marketplaceLogoSrc}
            marketplaceLogoAlt={mercadoLivrePresentation.connectionVisual.marketplaceLogoAlt}
            connectorSymbol={mercadoLivrePresentation.connectionVisual.connectorSymbol}
          />
        }
      />

      {manageModalAccount && manageModalPresentation ? (
        <MarketplaceIntegrationModal
          open={Boolean(manageModalAccountId)}
          onClose={closeManageModal}
          title={manageModalPresentation.modalTitle}
          subtitle={manageModalPresentation.modalSubtitle}
          logoSrc={mercadoLivrePresentation.logoHeaderSrc}
          logoAlt="Mercado Livre"
          accountName={manageModalPresentation.accountName}
          linkedCompanyName={manageModalPresentation.linkedCompanyName}
          linkedCompanyDocument={manageModalPresentation.linkedCompanyDocumentFormatted}
          statusBadge={manageModalPresentation.statusBadge}
          integrationStateRows={manageModalPresentation.integrationStateRows}
          diagnosticLines={manageModalPresentation.diagnosticLines}
          advancedOptionsResetKey={String(manageModalAccount.id)}
          stackLayer="base"
          isCovered={integrationModalStacked}
          syncViewAction={
            manageModalPresentation.showSyncViewLink
              ? {
                  label: ML_SYNC_DETAILS_CTA_LABEL,
                  emphasis: manageModalPresentation.syncViewEmphasis,
                  loading: syncDetailsOpeningAccountId === String(manageModalAccount.id),
                  disabled:
                    syncingId === manageModalAccount.id ||
                    removingId === manageModalAccount.id ||
                    syncDetailsOpeningAccountId === String(manageModalAccount.id),
                  buttonRef: syncViewButtonRef,
                  onClick: () => {
                    void handleOpenSyncDetails(manageModalAccount.id);
                  },
                }
              : null
          }
          advancedActions={
            manageModalPresentation.isActive ? (
              <>
                {manageModalPresentation.showReconnectAction ? (
                  <button
                    type="button"
                    className="s7-marketplace-integration-modal__action-btn"
                    disabled={
                      syncingId === manageModalAccount.id ||
                      removingId === manageModalAccount.id ||
                      !manageModalAccount.seller_company_id ||
                      syncDetailsOpeningAccountId === String(manageModalAccount.id)
                    }
                    onClick={() => startOAuth(manageModalAccount.seller_company_id)}
                  >
                    Reconectar conta
                  </button>
                ) : null}
                {manageModalPresentation.showSyncDetailsAction ? (
                  <button
                    type="button"
                    className={`s7-marketplace-integration-modal__action-btn${
                      syncDetailsOpeningAccountId === String(manageModalAccount.id) ? " is-loading" : ""
                    }`}
                    disabled={
                      syncingId === manageModalAccount.id ||
                      removingId === manageModalAccount.id ||
                      syncDetailsOpeningAccountId === String(manageModalAccount.id)
                    }
                    aria-busy={
                      syncDetailsOpeningAccountId === String(manageModalAccount.id) ? "true" : undefined
                    }
                    onClick={() => {
                      void handleOpenSyncDetails(manageModalAccount.id);
                    }}
                  >
                    {syncDetailsOpeningAccountId === String(manageModalAccount.id) ? (
                      <>
                        <MarketplaceSyncDetailsOpeningIndicator compact />
                        <span>{ML_SYNC_DETAILS_CTA_LABEL}</span>
                      </>
                    ) : (
                      ML_SYNC_DETAILS_CTA_LABEL
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="s7-marketplace-integration-modal__action-btn"
                  disabled={syncingId === manageModalAccount.id || removingId === manageModalAccount.id}
                  onClick={() => handleSync(manageModalAccount.id)}
                >
                  {syncingId === manageModalAccount.id ? "Sincronizando…" : "Sincronizar anúncios"}
                </button>
                <button
                  type="button"
                  className="s7-marketplace-integration-modal__action-btn"
                  disabled={
                    syncingId === manageModalAccount.id ||
                    removingId === manageModalAccount.id ||
                    !manageModalAccount.seller_company_id
                  }
                  onClick={() => startOAuth(manageModalAccount.seller_company_id)}
                >
                  Renovar sessão (OAuth)
                </button>
                <button
                  type="button"
                  className="s7-marketplace-integration-modal__action-btn s7-marketplace-integration-modal__action-btn--danger"
                  disabled={syncingId === manageModalAccount.id || removingId === manageModalAccount.id}
                  onClick={() => handleRemove(manageModalAccount.id)}
                >
                  {removingId === manageModalAccount.id ? "Removendo…" : "Remover conta"}
                </button>
              </>
            ) : null
          }
        />
      ) : null}

      <MarketplaceCompanyPickerModal
        open={integrationPickerOpen}
        onClose={() => setIntegrationPickerOpen(false)}
        marketplaceSlug="mercado_livre"
        marketplaceLabel="Mercado Livre"
        companies={integrationCompanies}
        connectedSellerCompanyIds={mlConnectedSellerCompanyIds}
        onCompaniesChanged={loadIntegrationCompanies}
        onSelectCompany={(sellerCompanyId) => {
          void startOAuth(sellerCompanyId);
        }}
      />

    </div>
  );
}
