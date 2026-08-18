import { useEffect, useState } from "react";
import { getPreferences, setPreference } from "../../../services/userPreferencesService";
import { S7_SALES_POPUP_VISUAL_PLACEHOLDERS } from "../../../constants/salesPopupVisualPlaceholders";
import { S7_SALES_POPUP_PLACEHOLDER_SWITCH_HINT } from "../../../constants/notificationCenterVisualPopupPlaceholders";
import { POPUP_ALERTS_CATALOG_BY_VIEW } from "../../../constants/notificationPreferences";
import "../../../components/Profile/Notificacoes.css";
import "./NotificationPopupSection.css";
import "./NotificationCenterSectionCard.css";

function prefKey(alertKey) {
  return `popup_alert.${String(alertKey ?? "").trim().toUpperCase()}`;
}

function isEnabled(rawPrefs, alertKey) {
  const key = prefKey(alertKey);
  const val = rawPrefs?.[key] ?? rawPrefs?.[key.toLowerCase?.()];
  if (val && typeof val === "object" && typeof val.enabled === "boolean") return val.enabled;
  return true;
}

function renderPlaceholderCards(isGrid, listClassName, items, switchHint) {
  return (
    <div className={listClassName}>
      {items.map((item) => (
        <article
          key={item.key}
          className={`notif-type-card notif-type-card--neutral s7-ncenter-popup__card ${isGrid ? "s7-ncenter-popup__card--grid" : ""}`}
        >
          <header className="notif-type-card__head">
            <div>
              <h4>{item.label}</h4>
              <p>{item.description}</p>
            </div>
          </header>
          <div className="notif-channels" role="group" aria-label={`Configuração de ${item.label}`}>
            <button
              type="button"
              role="switch"
              aria-checked={false}
              aria-disabled="true"
              aria-label={`${item.label} — ${switchHint}`}
              title={switchHint}
              className="notif-switch-row notif-switch-row--disabled"
              disabled
            >
              <span className="notif-switch-row__label">Ativar alerta pop-up</span>
              <span className="notif-switch" aria-hidden>
                <span className="notif-switch__thumb" />
              </span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * @param {{
 *   categoryKey: string;
 *   hideHeader?: boolean;
 *   layout?: "stack" | "grid";
 *   useVisualPlaceholders?: boolean;
 *   visualPlaceholderItems?: readonly { key: string, label: string, description: string }[] | null;
 * }} props
 */
export default function NotificationPopupSection({
  categoryKey,
  hideHeader = false,
  layout = "stack",
  useVisualPlaceholders = false,
  visualPlaceholderItems = null,
}) {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(!useVisualPlaceholders);
  const activeGroup = POPUP_ALERTS_CATALOG_BY_VIEW[categoryKey];
  const realItems = activeGroup?.items ?? [];
  const isGrid = layout === "grid";
  const placeholderItems = visualPlaceholderItems ?? S7_SALES_POPUP_VISUAL_PLACEHOLDERS;

  useEffect(() => {
    if (useVisualPlaceholders) return undefined;
    let cancelled = false;
    getPreferences("popup_alert.").then(({ ok, data }) => {
      if (cancelled) return;
      setPrefs(ok && data ? data : {});
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [useVisualPlaceholders]);

  if (!useVisualPlaceholders && !realItems.length) return null;

  const listClassName = isGrid
    ? "s7-ncenter-section-grid s7-ncenter-popup__list s7-ncenter-popup__list--grid"
    : "s7-ncenter-popup__list";

  const handleToggle = async (alertKey, enabled) => {
    const key = prefKey(alertKey);
    const prev = { ...prefs };
    setPrefs((state) => ({ ...state, [key]: { enabled } }));
    const { ok } = await setPreference(key, { enabled });
    if (!ok) {
      setPrefs(prev);
      return;
    }
    window.dispatchEvent(new Event("suse7:notifyPrefsChanged"));
  };

  return (
    <section
      className={`s7-ncenter-popup ${hideHeader ? "s7-ncenter-popup--embedded" : ""}`.trim()}
      aria-labelledby={hideHeader ? undefined : "s7-ncenter-popup-title"}
    >
      {!hideHeader ? (
        <header className="s7-ncenter-popup__head">
          <h3 id="s7-ncenter-popup-title">Alertas pop-up</h3>
          <p>Avisos internos exibidos no app durante a operação.</p>
        </header>
      ) : null}

      {useVisualPlaceholders ? (
        renderPlaceholderCards(isGrid, listClassName, placeholderItems, S7_SALES_POPUP_PLACEHOLDER_SWITCH_HINT)
      ) : loading ? (
        <p className="s7-ncenter-popup__loading">Carregando alertas pop-up…</p>
      ) : (
        <div className={listClassName}>
          {realItems.map((item) => {
            const enabled = isEnabled(prefs, item.key);
            return (
              <article
                key={item.key}
                className={`notif-type-card notif-type-card--neutral s7-ncenter-popup__card ${isGrid ? "s7-ncenter-popup__card--grid" : ""}`}
              >
                <header className="notif-type-card__head">
                  <div>
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                </header>
                <div className="notif-channels" role="group" aria-label={`Configuração de ${item.label}`}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    className="notif-switch-row"
                    onClick={() => handleToggle(item.key, !enabled)}
                  >
                    <span className="notif-switch-row__label">Ativar alerta pop-up</span>
                    <span className={`notif-switch ${enabled ? "is-on" : ""}`} aria-hidden>
                      <span className="notif-switch__thumb" />
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
