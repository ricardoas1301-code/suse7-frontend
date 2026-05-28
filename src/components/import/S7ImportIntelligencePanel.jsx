// ======================================================================
// Painel premium — importação inteligente (camada rápida + histórico)
// Dashboard + Integrações ML — polling moderado, barra principal contextual.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, Layers, History, Clock, Activity } from "lucide-react";
import { fetchImportIntelligenceSummary } from "../../services/importIntelligenceApi";
import "./S7ImportIntelligencePanel.css";

/** @param {number | null | undefined} n */
function fmtInt(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("pt-BR");
}

/** @param {string | null | undefined} iso */
function relativeActivity(iso) {
  if (!iso) return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 90) return "há instantes";
  if (sec < 3600) return `há ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `há ${Math.floor(sec / 3600)} h`;
  return `há ${Math.floor(sec / 86400)} dia(s)`;
}

/** @param {string} s */
function hotStatusLabelPt(s) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return "Concluída";
  if (v === "running") return "Em andamento";
  if (v === "error") return "Com pendências";
  if (v === "pending") return "Na fila";
  return "—";
}

/** @param {string} s */
function histStatusLabelPt(s) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return "Histórico completo sincronizado";
  if (v === "running") return "Em segundo plano";
  if (v === "queued") return "Aguardando camada rápida";
  if (v === "error") return "Com pendências";
  if (v === "idle") return "—";
  return "—";
}

/** @param {unknown} v */
function trimAccountId(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/**
 * @param {{
 *   pollSeconds?: number;
 *   layout?: "dashboard" | "integrations" | "modal";
 *   focusedAccountId?: string | null;
 *   marketplaceAccountId?: string | null;
 *   sellerCompanyId?: string | null;
 *   externalSellerId?: string | number | null;
 *   onOpenTechnicalDetails?: ((accountId: string) => void) | null;
 * }} props
 */
export default function S7ImportIntelligencePanel({
  pollSeconds = 45,
  layout = "dashboard",
  focusedAccountId = null,
  marketplaceAccountId = null,
  sellerCompanyId = null,
  externalSellerId = null,
  onOpenTechnicalDetails = null,
}) {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));

  /** Única chave para filtro + query string: no modal prioriza marketplaceAccountId explícito. */
  const accountId = useMemo(() => {
    const m = trimAccountId(marketplaceAccountId);
    const f = trimAccountId(focusedAccountId);
    if (layout === "modal") return m || f;
    return f;
  }, [layout, marketplaceAccountId, focusedAccountId]);

  const intervalMs = useMemo(
    () => Math.min(120, Math.max(30, pollSeconds)) * 1000,
    [pollSeconds]
  );

  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    const res = await fetchImportIntelligenceSummary("mercado_livre", {
      marketplaceAccountId: accountId,
    });
    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : "Falha ao carregar status.");
      setLoading(false);
      return;
    }
    setErr(null);
    setPayload(res.data);
    setLoading(false);
  }, [accountId]);

  useEffect(() => {
    setLoading(true);
    setPayload(null);
    setErr(null);
    load();
    const id = setInterval(load, intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, intervalMs, accountId]);

  const openSyncModal = useCallback(
    (accountId) => {
      if (!accountId) return;
      navigate(`/perfil/integracoes/mercado-livre?ml_sync_modal=${encodeURIComponent(accountId)}`);
    },
    [navigate]
  );

  const openTechnicalOrNavigate = useCallback(
    (accountId) => {
      if (!accountId) return;
      if (typeof onOpenTechnicalDetails === "function") {
        onOpenTechnicalDetails(accountId);
        return;
      }
      openSyncModal(accountId);
    },
    [onOpenTechnicalDetails, openSyncModal]
  );

  if (loading && !payload) {
    return (
      <section
        className={`s7-import-intel s7-import-intel--loading s7-import-intel--${layout}`}
        aria-busy="true"
        aria-label="Importação em segundo plano"
        data-marketplace-account-id={accountId || undefined}
        data-seller-company-id={trimAccountId(sellerCompanyId) || undefined}
        data-external-seller-id={externalSellerId != null && String(externalSellerId).trim() !== "" ? String(externalSellerId) : undefined}
      >
        <div className="s7-import-intel__shimmer" />
      </section>
    );
  }

  const accountsRaw = Array.isArray(payload?.accounts) ? payload.accounts : [];
  const accounts = accountId
    ? accountsRaw.filter((a) => String(a.marketplace_account_id) === String(accountId))
    : accountsRaw;

  if (accounts.length === 0) {
    if (layout === "modal" && accountId) {
      return (
        <section
          className={`s7-import-intel s7-import-intel--modal-empty s7-import-intel--${layout}`}
          aria-label="Importação inteligente"
          data-marketplace-account-id={accountId || undefined}
          data-seller-company-id={trimAccountId(sellerCompanyId) || undefined}
          data-external-seller-id={externalSellerId != null && String(externalSellerId).trim() !== "" ? String(externalSellerId) : undefined}
        >
          <p className="s7-import-intel__sub">
            Ainda não há dados agregados de importação para esta conta. Use{" "}
            <strong>Ver detalhes da sincronização</strong> abaixo para o checklist técnico ou aguarde alguns segundos e
            atualize.
          </p>
        </section>
      );
    }
    return null;
  }

  const hidePerAccountNav = layout === "modal" && accountId != null && String(accountId).length > 0;
  const showModalFooterLink = layout !== "modal";

  const allFullySynced = accounts.every(
    (a) =>
      a.hot_sync_complete === true &&
      a.historical_backfill_active !== true &&
      String(a.overall || "") === "done"
  );

  const anyAttention = accounts.some((a) => String(a.overall || "") === "error");

  const showIdleAwaiting = accounts.every((a) => String(a.overall || "") === "awaiting_start");
  /** No modal com conta explícita, não usar any_engaged global (outra conta pode já ter pipeline). */
  const idleEngagedGate =
    layout === "modal" && accountId != null && String(accountId).trim() !== "" ? true : !payload?.any_engaged;

  if (showIdleAwaiting && idleEngagedGate) {
    return (
      <section
        className={`s7-import-intel s7-import-intel--cta s7-import-intel--${layout}`}
        aria-label="Integração Mercado Livre"
        data-marketplace-account-id={accountId || undefined}
        data-seller-company-id={trimAccountId(sellerCompanyId) || undefined}
        data-external-seller-id={externalSellerId != null && String(externalSellerId).trim() !== "" ? String(externalSellerId) : undefined}
      >
        <div className="s7-import-intel__head">
          <Sparkles className="s7-import-intel__icon" size={22} strokeWidth={1.75} aria-hidden />
          <div>
            <h2 className="s7-import-intel__title">Importação inteligente</h2>
            <p className="s7-import-intel__sub">
              {layout === "modal" && accountId
                ? "Sua conta está conectada. Na próxima etapa você inicia a importação inicial — dados recentes em minutos e histórico completo em segundo plano."
                : "Conecte o Mercado Livre em Integrações para liberar dados recentes em minutos e histórico completo em segundo plano."}
            </p>
          </div>
        </div>
        {layout === "modal" && accountId && typeof onOpenTechnicalDetails === "function" ? (
          <button
            type="button"
            className="s7-import-intel__btn"
            onClick={() => onOpenTechnicalDetails(String(accountId))}
          >
            Continuar para iniciar importação
          </button>
        ) : (
          <Link to="/perfil/integracoes/mercado-livre" className="s7-import-intel__link">
            Abrir Integrações
          </Link>
        )}
      </section>
    );
  }

  if (allFullySynced && !anyAttention) {
    return (
      <section className={`s7-import-intel s7-import-intel--success s7-import-intel--${layout}`} aria-label="Sincronização completa">
        <CheckCircle2 className="s7-import-intel__success-icon" size={26} strokeWidth={2} aria-hidden />
        <div>
          <h2 className="s7-import-intel__title s7-import-intel__title--success">Histórico completo sincronizado</h2>
          <p className="s7-import-intel__sub">
            {layout === "modal"
              ? "Monitoramento contínuo ativo. Novas vendas e indicadores são armazenados automaticamente pelo Suse7."
              : "Seu ambiente Suse7 está totalmente sincronizado."}
          </p>
        </div>
      </section>
    );
  }

  const recentDays = payload?.ml_initial_recent_days ?? 90;

  const activeTitle = layout === "modal" ? "Importação inteligente" : "Importação inteligente em andamento";
  const activeSub =
    layout === "modal"
      ? "Estamos preparando o histórico inteligente da sua operação. O processamento segue em servidor seguro — camada rápida primeiro, histórico completo em seguida."
      : "O Suse7 continua trabalhando no servidor — camada rápida primeiro, histórico completo em seguida.";
  const activeReassure =
    layout === "modal"
      ? "O Suse7 continuará armazenando automaticamente novas vendas e indicadores históricos. Você pode fechar esta janela e voltar quando quiser."
      : "Você já pode utilizar o Suse7 normalmente enquanto o restante do histórico é sincronizado automaticamente.";

  return (
    <section
      className={`s7-import-intel s7-import-intel--active s7-import-intel--${layout}`}
      aria-label={layout === "modal" ? "Importação inteligente" : "Importação inteligente em andamento"}
      data-marketplace-account-id={accountId || undefined}
      data-seller-company-id={trimAccountId(sellerCompanyId) || undefined}
      data-external-seller-id={externalSellerId != null && String(externalSellerId).trim() !== "" ? String(externalSellerId) : undefined}
    >
      {layout !== "modal" ? (
        <header className="s7-import-intel__head">
          <div className="s7-import-intel__head-icon-wrap" aria-hidden>
            <Sparkles className="s7-import-intel__icon s7-import-intel__icon--pulse" size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="s7-import-intel__title">{activeTitle}</h2>
            <p className="s7-import-intel__sub">{activeSub}</p>
          </div>
        </header>
      ) : null}

      <p className="s7-import-intel__reassure">{activeReassure}</p>

      {err ? <p className="s7-import-intel__warn" role="status">{err}</p> : null}

      <div className="s7-import-intel__accounts">
        {accounts.map((acc) => {
          const hot = acc.hot_sync || {};
          const hist = acc.historical_sync || {};
          const hs = acc.historical_sales_sync;
          const hc = acc.historical_customers_sync;
          const lst = acc.listings;
          const primaryPct = Number(acc.primary_progress_percent);
          const mainBar = Number.isFinite(primaryPct) ? Math.min(100, Math.max(0, primaryPct)) : 0;
          const hotBar = Number.isFinite(Number(hot.progress_percent)) ? Math.min(100, Number(hot.progress_percent)) : 0;
          const histBar = Number.isFinite(Number(hist.progress_percent)) ? Math.min(100, Number(hist.progress_percent)) : 0;
          const hotAct = relativeActivity(hot.last_activity_at);
          const globalAct = relativeActivity(acc.last_job_activity_at);
          const salesLine =
            hot.progress_total != null &&
            Number(hot.progress_total) > 0 &&
            hot.progress_current != null &&
            Number.isFinite(Number(hot.progress_current))
              ? `${fmtInt(hot.progress_current)} / ${fmtInt(hot.progress_total)} vendas recentes`
              : null;

          const mainLabel = acc.hot_sync_complete ? "Progresso do histórico completo" : "Progresso da camada rápida";

          return (
            <article key={acc.marketplace_account_id} className="s7-import-intel__account">
              <div className="s7-import-intel__account-head">
                <span className="s7-import-intel__account-name">{acc.display_name || acc.account_label}</span>
                <span className="s7-import-intel__account-status">{acc.status_headline}</span>
              </div>

              <div className="s7-import-intel__main-progress">
                <div className="s7-import-intel__progress-label">
                  <span>{mainLabel}</span>
                  <span>{mainBar}%</span>
                </div>
                <div className="s7-import-intel__progress-track">
                  <div className="s7-import-intel__progress-fill" style={{ width: `${mainBar}%` }} />
                </div>
              </div>

              <div className="s7-import-intel__layer-block s7-import-intel__layer-block--hot">
                <div className="s7-import-intel__layer-title">
                  <Layers size={17} strokeWidth={2} aria-hidden />
                  <span>Camada rápida</span>
                  <span className={`s7-import-intel__pill ${acc.hot_sync_complete ? "ok" : "run"}`}>
                    {hotStatusLabelPt(hot.status)}
                  </span>
                </div>
                <p className="s7-import-intel__layer-copy">
                  Estamos preparando seus dados principais para uso imediato. Etapa atual:{" "}
                  <strong>{hot.current_step_label || "—"}</strong>.
                </p>
                <div className="s7-import-intel__sub-progress">
                  <div className="s7-import-intel__progress-label s7-import-intel__progress-label--sm">
                    <span>
                      Etapas {fmtInt(hot.completed_steps)} / {fmtInt(hot.total_steps)}
                    </span>
                    <span>{hotBar}%</span>
                  </div>
                  <div className="s7-import-intel__progress-track s7-import-intel__progress-track--sm">
                    <div className="s7-import-intel__progress-fill s7-import-intel__progress-fill--hot" style={{ width: `${hotBar}%` }} />
                  </div>
                </div>
                {salesLine ? <p className="s7-import-intel__sales-line">{salesLine}</p> : null}
                {hotAct ? (
                  <p className="s7-import-intel__activity s7-import-intel__activity--tight">
                    <Clock size={14} strokeWidth={2} aria-hidden /> Camada rápida: última atividade {hotAct}
                  </p>
                ) : null}
              </div>

              <div className="s7-import-intel__layer-block s7-import-intel__layer-block--hist">
                <div className="s7-import-intel__layer-title">
                  <History size={17} strokeWidth={2} aria-hidden />
                  <span>Histórico completo</span>
                  <span className={`s7-import-intel__pill ${acc.historical_backfill_active ? "run" : "ok"}`}>
                    {histStatusLabelPt(hist.status)}
                  </span>
                </div>
                <p className="s7-import-intel__layer-copy">{hist.message_pt}</p>
                <div className="s7-import-intel__sub-progress">
                  <div className="s7-import-intel__progress-label s7-import-intel__progress-label--sm">
                    <span>Progresso histórico (vendas)</span>
                    <span>{histBar}%</span>
                  </div>
                  <div className="s7-import-intel__progress-track s7-import-intel__progress-track--sm">
                    <div
                      className="s7-import-intel__progress-fill s7-import-intel__progress-fill--hist"
                      style={{ width: `${histBar}%` }}
                    />
                  </div>
                </div>
                <div className="s7-import-intel__metrics s7-import-intel__metrics--inline">
                  <div className="s7-import-intel__metric">
                    <span className="s7-import-intel__metric-label">Vendas históricas</span>
                    <strong className="s7-import-intel__metric-value">
                      {fmtInt(hs?.progress_current)} / {fmtInt(hs?.progress_total)}
                    </strong>
                  </div>
                  <div className="s7-import-intel__metric">
                    <span className="s7-import-intel__metric-label">Anúncios</span>
                    <strong className="s7-import-intel__metric-value">
                      {lst?.progress_total != null && Number(lst.progress_total) > 0
                        ? `${fmtInt(lst.progress_current)} / ${fmtInt(lst.progress_total)}`
                        : lst?.status === "done"
                          ? "Sincronizado"
                          : lst?.status === "running"
                            ? "Sincronizando…"
                            : "—"}
                    </strong>
                  </div>
                  <div className="s7-import-intel__metric">
                    <span className="s7-import-intel__metric-label">Clientes históricos</span>
                    <strong className="s7-import-intel__metric-value">
                      {hc && (Number(hc.progress_total) > 0 || hc.status)
                        ? `${fmtInt(hc.progress_current)} / ${fmtInt(hc.progress_total)}`
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="s7-import-intel__footer-row">
                <p className="s7-import-intel__forecast">
                  <Activity size={15} strokeWidth={2} className="s7-import-intel__forecast-ico" aria-hidden />
                  {acc.forecast_message_pt}
                </p>
                {globalAct ? (
                  <p className="s7-import-intel__activity">
                    <Clock size={14} strokeWidth={2} aria-hidden /> Última atividade no servidor {globalAct}
                  </p>
                ) : null}
              </div>

              <p className="s7-import-intel__hint">
                Janela inicial de vendas recentes: últimos <strong>{recentDays}</strong> dias — o restante entra no
                histórico automático.
              </p>

              {!hidePerAccountNav ? (
                <div className="s7-import-intel__account-actions">
                  <button
                    type="button"
                    className="s7-import-intel__btn"
                    onClick={() => openTechnicalOrNavigate(acc.marketplace_account_id)}
                  >
                    Ver sincronização em andamento
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {showModalFooterLink ? (
        <footer className="s7-import-intel__foot">
          <Link to="/perfil/integracoes/mercado-livre" className="s7-import-intel__link">
            Ver detalhes em Integrações
          </Link>
        </footer>
      ) : null}
    </section>
  );
}
