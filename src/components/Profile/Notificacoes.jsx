// ======================================================================
//  PERFIL — PREFERÊNCIAS > NOTIFICAÇÕES
//  Configurações por tipo e canal (app, e-mail, WhatsApp)
//  Persistência escalável em notify.<TYPE> com fallback para legado.
// ======================================================================

import { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getPreferences, setPreference } from "../../services/userPreferencesService";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  getDeliveredNotificationsSnapshot,
  getProcessedNotificationEventsSnapshot,
  simulateNotification,
} from "../../services/notificationEngine";
import { scanNotificationEventsForCurrentUser } from "../../services/notificationEventScanner";
import {
  NOTIFICATION_CATALOG_BY_VIEW,
  NOTIFICATION_CATALOG_LOOKUP,
  NOTIFICATION_CATEGORY_VIEWS,
  NOTIFICATION_CHANNELS,
} from "../../constants/notificationPreferences";
import "./Notificacoes.css";

const CHANNEL_LABELS = {
  [NOTIFICATION_CHANNELS.app]: "Notificações no app",
  [NOTIFICATION_CHANNELS.email]: "E-mail",
  [NOTIFICATION_CHANNELS.whatsapp]: "WhatsApp",
};

const CHANNEL_ORDER = [
  NOTIFICATION_CHANNELS.app,
  NOTIFICATION_CHANNELS.email,
  NOTIFICATION_CHANNELS.whatsapp,
];

function getPrefKey(type) {
  return `notify.${type}`;
}

function toBooleanWithDefault(val, defaultValue = true) {
  if (typeof val === "boolean") return val;
  return defaultValue;
}

function createDefaultChannels() {
  return {
    [NOTIFICATION_CHANNELS.app]: true,
    [NOTIFICATION_CHANNELS.email]: true,
    [NOTIFICATION_CHANNELS.whatsapp]: true,
  };
}

function resolvePref(prefs, type) {
  const primaryKey = getPrefKey(type);
  const lowKey = primaryKey.toLowerCase();
  const raw = prefs?.[primaryKey] ?? prefs?.[lowKey];
  const defaults = createDefaultChannels();

  if (raw && typeof raw === "object") {
    const channels = raw.channels ?? {};
    return {
      channel_app_enabled: toBooleanWithDefault(
        raw.channel_app_enabled ?? channels?.[NOTIFICATION_CHANNELS.app]?.enabled,
        defaults[NOTIFICATION_CHANNELS.app]
      ),
      channel_email_enabled: toBooleanWithDefault(
        raw.channel_email_enabled ?? channels?.[NOTIFICATION_CHANNELS.email]?.enabled,
        defaults[NOTIFICATION_CHANNELS.email]
      ),
      channel_whatsapp_enabled: toBooleanWithDefault(
        raw.channel_whatsapp_enabled ?? channels?.[NOTIFICATION_CHANNELS.whatsapp]?.enabled,
        defaults[NOTIFICATION_CHANNELS.whatsapp]
      ),
      enabled: toBooleanWithDefault(raw.enabled, true),
    };
  }

  // Compatibilidade com legado notify.<TYPE>.<channel>
  const legacyApp = prefs?.[`notify.${type}.in_app`]?.enabled;
  const legacyEmail = prefs?.[`notify.${type}.email`]?.enabled;
  const legacyWhatsApp = prefs?.[`notify.${type}.whatsapp`]?.enabled;

  return {
    channel_app_enabled: toBooleanWithDefault(legacyApp, defaults[NOTIFICATION_CHANNELS.app]),
    channel_email_enabled: toBooleanWithDefault(legacyEmail, defaults[NOTIFICATION_CHANNELS.email]),
    channel_whatsapp_enabled: toBooleanWithDefault(
      legacyWhatsApp,
      defaults[NOTIFICATION_CHANNELS.whatsapp]
    ),
    enabled: true,
  };
}

export default function Notificacoes() {
  const { category } = useParams();
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerReport, setScannerReport] = useState(null);
  const { addNotification } = useNotifications();
  const categoryKey = category ?? NOTIFICATION_CATEGORY_VIEWS.sales;
  const validCategories = new Set(Object.keys(NOTIFICATION_CATALOG_BY_VIEW));
  const activeGroup = NOTIFICATION_CATALOG_BY_VIEW[categoryKey];

  if (!validCategories.has(categoryKey)) {
    return <Navigate to={`/perfil/preferencias/notificacoes/${NOTIFICATION_CATEGORY_VIEWS.sales}`} replace />;
  }

  useEffect(() => {
    let cancelled = false;
    getPreferences("notify.").then(({ ok, data }) => {
      if (cancelled) return;
      setPrefs(ok && data ? data : {});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const getEnabled = (type, channel) => {
    const resolved = resolvePref(prefs, type);
    if (channel === NOTIFICATION_CHANNELS.app) return resolved.channel_app_enabled;
    if (channel === NOTIFICATION_CHANNELS.email) return resolved.channel_email_enabled;
    return resolved.channel_whatsapp_enabled;
  };

  const setEnabled = async (type, channel, enabled) => {
    const key = getPrefKey(type);
    const def = NOTIFICATION_CATALOG_LOOKUP[type] ?? {};
    const current = resolvePref(prefs, type);
    const channelState = {
      app: current.channel_app_enabled,
      email: current.channel_email_enabled,
      whatsapp: current.channel_whatsapp_enabled,
    };
    channelState[channel] = enabled;

    const nextValue = {
      notification_type: type,
      marketplace_id: null,
      category: def.category ?? "general",
      priority: def.priority ?? "info",
      channel_app_enabled: channelState.app,
      channel_email_enabled: channelState.email,
      channel_whatsapp_enabled: channelState.whatsapp,
      enabled: Object.values(channelState).some(Boolean),
      channels: {
        app: { enabled: channelState.app },
        email: { enabled: channelState.email },
        whatsapp: { enabled: channelState.whatsapp },
      },
      updated_at: new Date().toISOString(),
    };

    const prev = { ...prefs };
    setPrefs((p) => ({ ...p, [key]: nextValue }));
    const { ok, error } = await setPreference(key, nextValue);
    if (!ok) {
      setPrefs(prev);
      addNotification({ type: "error", title: "Erro", message: error ?? "Não foi possível salvar." });
    } else {
      window.dispatchEvent(new Event("suse7:notifyPrefsChanged"));
    }
  };

  const handleSimulateNotification = async (notificationType) => {
    await simulateNotification(notificationType);
    setScannerReport({
      mode: "simulation",
      detected: [],
      delivered: getDeliveredNotificationsSnapshot(),
      processed: getProcessedNotificationEventsSnapshot(),
    });
  };

  const handleRunRealScanner = async () => {
    setScannerRunning(true);
    const result = await scanNotificationEventsForCurrentUser();
    setScannerRunning(false);
    if (!result.ok) {
      addNotification({
        type: "error",
        title: "Scanner de notificações",
        message: result.error ?? "Não foi possível executar o scanner real.",
      });
      return;
    }
    setScannerReport({
      mode: "real",
      detected: result.data?.events_detected ?? [],
      delivered: getDeliveredNotificationsSnapshot(),
      processed: getProcessedNotificationEventsSnapshot(),
      totals: result.data?.totals ?? null,
    });
  };

  const handleLoadLastProcessedEvents = () => {
    setScannerReport({
      mode: "snapshot",
      detected: [],
      delivered: getDeliveredNotificationsSnapshot(),
      processed: getProcessedNotificationEventsSnapshot(),
    });
  };

  return (
    <div className="profile-section notif-page">
      <h2>Notificações</h2>
      <p>Configure canais por tipo de alerta para manter sinais úteis e acionáveis.</p>

      <section className="notif-types">
        <h3>Tipos de alerta</h3>
        {loading ? (
          <p className="notif-loading">Carregando…</p>
        ) : (
          activeGroup ? (
            <div key={activeGroup.id} className="notif-group">
              <h4 className="notif-group__title">{activeGroup.title}</h4>
              <div className="notif-type-list">
                {activeGroup.items.map(({ type, label, description, priority, tone, future }) => (
                  <article key={type} className={`notif-type-card notif-type-card--${tone ?? "neutral"}`}>
                    <header className="notif-type-card__head">
                      <div>
                        <h5>{label}</h5>
                        <p>{description}</p>
                      </div>
                      <div className="notif-type-card__badges">
                        <span className={`notif-badge notif-badge--${priority}`}>{priority}</span>
                        {future ? <span className="notif-badge notif-badge--future">futuro</span> : null}
                      </div>
                    </header>

                    <div className="notif-channels" role="group" aria-label={`Canais para ${label}`}>
                      {CHANNEL_ORDER.map((channelId) => {
                        const checked = getEnabled(type, channelId);
                        return (
                          <button
                            key={`${type}-${channelId}`}
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            className="notif-switch-row"
                            onClick={() => setEnabled(type, channelId, !checked)}
                          >
                            <span className="notif-switch-row__label">{CHANNEL_LABELS[channelId]}</span>
                            <span className={`notif-switch ${checked ? "is-on" : ""}`} aria-hidden>
                              <span className="notif-switch__thumb" />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="notif-whatsapp-hint">
                      WhatsApp será ativado após configurar número/integração.
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null
        )}
      </section>

      {import.meta.env.DEV ? (
        <section className="notif-dev-simulator">
          <h3>Simulador DEV — Notification Engine</h3>
          <p>Dispara eventos simulados para validar motor in-app, badge do sino e toast.</p>
          <div className="notif-dev-simulator__actions">
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={handleRunRealScanner}
              disabled={scannerRunning}
            >
              {scannerRunning ? "Rodando scanner..." : "Rodar scanner real agora"}
            </button>
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={() => handleSimulateNotification("NEGATIVE_SALE")}
            >
              Simular venda com prejuízo
            </button>
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={() => handleSimulateNotification("LOW_MARGIN_SALE")}
            >
              Simular margem baixa
            </button>
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={() => handleSimulateNotification("OUT_OF_STOCK")}
            >
              Simular estoque zerado
            </button>
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={() => handleSimulateNotification("PAUSED_PRODUCT_WITH_RECENT_SALES")}
            >
              Simular produto pausado com vendas recentes
            </button>
            <button
              type="button"
              className="s7-btn s7-btn--secondary"
              onClick={handleLoadLastProcessedEvents}
            >
              Ver últimos eventos processados
            </button>
          </div>

          <div className="notif-dev-simulator__report">
            <h4>Últimos eventos processados</h4>
            {scannerReport?.totals ? (
              <p className="notif-dev-simulator__meta">
                Detectados: {scannerReport.totals.detected} · Entregues: {scannerReport.totals.delivered}
              </p>
            ) : null}
            {Array.isArray(scannerReport?.processed) && scannerReport.processed.length > 0 ? (
              <ul className="notif-dev-simulator__list">
                {scannerReport.processed.slice(0, 10).map((item, idx) => (
                  <li key={`${item.notification?.id ?? "evt"}-${idx}`}>
                    <strong>{item.notification?.notification_type ?? "GENERIC"}</strong>
                    <span> · notification_id: {item.notification?.id ?? "n/a"}</span>
                    <span>
                      {" "}
                      · persist:{" "}
                      {item.backend?.ok
                        ? item.backend?.deduped
                          ? "dedupe_backend"
                          : "created"
                        : `erro (${item.backend?.error ?? "unknown"})`}
                    </span>
                    <span> · entregues: {(item.deliveredChannels ?? []).join(", ") || "nenhum"}</span>
                    <span>
                      {" "}
                      · ignorados:{" "}
                      {(item.ignoredChannels ?? [])
                        .map((i) => `${i.channel}(${i.reason})`)
                        .join(", ") || "nenhum"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="notif-dev-simulator__meta">Nenhum evento processado ainda.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
