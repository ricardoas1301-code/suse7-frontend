// ======================================================================
// PÁGINA: Mercado Livre — multi-conta + vínculo empresa (OAuth backend)
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl, apiFetch } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import SellerCompanyModal from "./SellerCompanyModal";
import "./MercadoLivre.css";

import suse7Logo from "../../assets/suse7-logo-redonda.png";
import mercadoLivreLogo from "../../assets/mercado-livre.png";

const ML_OAUTH_SUCCESS_TOAST_GAP_MS = 3500;
let _mlOAuthSuccessToastLastAt = 0;
const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";

function statusLabel(s) {
  const v = String(s || "").toLowerCase();
  if (v === "active") return "Ativa";
  if (v === "removed") return "Removida";
  if (v === "expired" || v === "invalid") return "Reautenticar";
  return s || "—";
}

function formatSyncAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default function MercadoLivre() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bannerError, setBannerError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [syncingId, setSyncingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyModalForMl, setCompanyModalForMl] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  const loadAccounts = useCallback(async () => {
    const url = buildApiUrl("/api/marketplace/accounts");
    if (!url) return [];
    const { ok, data } = await apiFetch(url, { method: "GET" });
    if (ok && Array.isArray(data?.accounts)) return data.accounts;
    return [];
  }, []);

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
        if (errParam === "token") {
          setBannerError(
            "Não foi possível trocar o código pelo token no Mercado Livre. Verifique ML_REDIRECT_URI e as credenciais da app DEV."
          );
        } else if (errParam === "save") {
          setBannerError(
            "A autorização funcionou, mas não foi possível salvar os tokens. Tente conectar novamente ou verifique o Supabase."
          );
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

        const mlConnectedFromOAuth = sp.get("ml") === "connected";
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        setUser(u);

        if (u) {
          const list = await loadAccounts();
          setAccounts(list);
        } else {
          setAccounts([]);
        }

        if (mlConnectedFromOAuth) {
          const now = Date.now();
          if (now - _mlOAuthSuccessToastLastAt >= ML_OAUTH_SUCCESS_TOAST_GAP_MS) {
            _mlOAuthSuccessToastLastAt = now;
            addNotification({
              event_type: "ML_INTEGRATION_OAUTH_SUCCESS",
              entity_type: "marketplace_integration",
              entity_id: null,
              title: "Integração concluída",
              message: "Conta Mercado Livre conectada com sucesso.",
              severity: NOTIFICATION_SEVERITY.INFO,
              dedupeKey: "ml-oauth-return-success",
            });
          }
        }

        const nextSp = new URLSearchParams(location.search);
        let urlNeedsClean = false;
        if (nextSp.has("ml")) {
          nextSp.delete("ml");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_error")) {
          nextSp.delete("ml_error");
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
  }, [location.pathname, location.search, navigate, loadAccounts, probeOAuthConfig]);

  const startOAuth = async (sellerCompanyId) => {
    if (!user) return;
    let connectUrl = buildApiUrl(`/api/ml/connect?user_id=${encodeURIComponent(user.id)}`);
    if (!connectUrl) {
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
    if (sellerCompanyId) {
      connectUrl += `&seller_company_id=${encodeURIComponent(sellerCompanyId)}`;
    }
    const probeUrl = buildApiUrl("/api/ml/oauth-config");
    if (probeUrl) {
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
    }
    window.location.href = connectUrl;
  };

  const visibleAccounts = accounts.filter((a) => String(a.status || "").toLowerCase() !== "removed");
  const activeForRule = accounts.filter((a) => String(a.status || "").toLowerCase() === "active");

  const handleConnectNewMl = () => {
    if (!user) return;
    if (activeForRule.length === 0) {
      startOAuth(null);
      return;
    }
    setCompanyModalForMl(true);
    setCompanyModalOpen(true);
  };

  const handleCompanySavedForMl = ({ id }) => {
    setCompanyModalOpen(false);
    setCompanyModalForMl(false);
    if (id) {
      navigate(`/ml/connect?seller_company_id=${encodeURIComponent(id)}`);
    }
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
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="ml-container">
        <div className="ml-card">
          <p>Carregando integração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-container">
      <div className="ml-card ml-card-wide">
        {bannerError && (
          <div className="ml-banner-error" role="alert">
            {bannerError}
          </div>
        )}

        <div className="ml-header">
          <div className="ml-header-logos">
            <img src={suse7Logo} alt="Suse7" className="ml-logo suse7" />
            <span className="ml-header-arrow">↔</span>
            <img src={mercadoLivreLogo} alt="Mercado Livre" className="ml-logo ml" />
          </div>
        </div>

        <h3 className="ml-connect-title">Mercado Livre</h3>
        <p className="ml-connect-description">
          Conecte uma ou mais contas de vendedor. Cada conta fica vinculada a um CNPJ cadastrado em{" "}
          <strong>Perfil da Empresa</strong>. Utilizamos apenas o <strong>OAuth oficial</strong> — nunca pedimos sua
          senha do Mercado Livre.
        </p>

        <div className="ml-accounts-toolbar">
          <button type="button" className="ml-button primary" onClick={handleConnectNewMl} disabled={!user}>
            + Conectar nova conta Mercado Livre
          </button>
        </div>

        {visibleAccounts.length === 0 ? (
          <div className="ml-accounts-empty">
            <p>Nenhuma conta Mercado Livre conectada ainda.</p>
            <p className="ml-security-hint">
              A primeira conexão usa automaticamente a empresa principal do seu cadastro — sem escolher CNPJ no
              fluxo.
            </p>
            <button type="button" className="ml-button" onClick={() => startOAuth(null)} disabled={!user}>
              Conectar primeira conta
            </button>
          </div>
        ) : (
          <div className="ml-accounts-grid">
            {visibleAccounts.map((acc) => {
              const alias = acc.account_alias || acc.ml_nickname || `Conta ${String(acc.external_seller_id || "").slice(0, 8)}`;
              const companyLine = acc.company_trade_name || acc.company_name || "—";
              const busy = syncingId === acc.id || removingId === acc.id;
              const isActive = String(acc.status || "").toLowerCase() === "active";
              return (
                <div key={acc.id} className={`ml-account-card ${!isActive ? "is-muted" : ""}`}>
                  <div className="ml-account-card-head">
                    <span className="ml-account-market">Mercado Livre</span>
                    <span className={`ml-account-status s-${String(acc.status || "").toLowerCase()}`}>
                      {statusLabel(acc.status)}
                    </span>
                  </div>
                  <div className="ml-account-alias">{alias}</div>
                  <div className="ml-account-company">{companyLine}</div>
                  <div className="ml-account-cnpj">{acc.company_document_masked || "—"}</div>
                  <div className="ml-account-sync">Último sync: {formatSyncAt(acc.last_sync_at)}</div>
                  <div className="ml-account-actions">
                    <button
                      type="button"
                      className="ml-button ghost sm"
                      disabled={!isActive || busy}
                      onClick={() => handleSync(acc.id)}
                    >
                      {syncingId === acc.id ? "Sincronizando..." : "Sincronizar"}
                    </button>
                    <button
                      type="button"
                      className="ml-button ghost sm"
                      disabled={busy || !acc.seller_company_id}
                      onClick={() => startOAuth(acc.seller_company_id)}
                    >
                      Reautenticar
                    </button>
                    <button
                      type="button"
                      className="ml-button danger sm"
                      disabled={busy}
                      onClick={() => handleRemove(acc.id)}
                    >
                      {removingId === acc.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="ml-security-hint" style={{ marginTop: 24 }}>
          Conexão segura: tokens tratados apenas no backend; o Suse7 não armazena senha do marketplace.
        </p>
      </div>

      <SellerCompanyModal
        open={companyModalOpen && companyModalForMl}
        onClose={() => {
          setCompanyModalOpen(false);
          setCompanyModalForMl(false);
        }}
        mode="create"
        companyId={null}
        profileEmail={user?.email || ""}
        onSaved={handleCompanySavedForMl}
      />
    </div>
  );
}
