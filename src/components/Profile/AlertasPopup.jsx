// ======================================================================
//  PERFIL — PREFERÊNCIAS > ALERTAS POP-UP
//  Preferências de avisos internos exibidos no app (sem canais externos).
// ======================================================================

import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getPreferences, setPreference } from "../../services/userPreferencesService";
import {
  POPUP_ALERTS_CATEGORY_VIEWS,
  POPUP_ALERTS_CATALOG_BY_VIEW,
} from "../../constants/notificationPreferences";
import "./Notificacoes.css";

function prefKey(alertKey) {
  return `popup_alert.${String(alertKey ?? "").trim().toUpperCase()}`;
}

function isEnabled(rawPrefs, alertKey) {
  const key = prefKey(alertKey);
  const val = rawPrefs?.[key] ?? rawPrefs?.[key.toLowerCase?.()];
  if (val && typeof val === "object" && typeof val.enabled === "boolean") return val.enabled;
  return true;
}

export default function AlertasPopup() {
  const { category } = useParams();
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const categoryKey = category ?? POPUP_ALERTS_CATEGORY_VIEWS.sales;
  const validCategories = new Set(Object.keys(POPUP_ALERTS_CATALOG_BY_VIEW));
  const activeGroup = POPUP_ALERTS_CATALOG_BY_VIEW[categoryKey];

  if (!validCategories.has(categoryKey)) {
    return <Navigate to={`/perfil/preferencias/alertas-pop-up/${POPUP_ALERTS_CATEGORY_VIEWS.sales}`} replace />;
  }

  useEffect(() => {
    let cancelled = false;
    getPreferences("popup_alert.").then(({ ok, data }) => {
      if (cancelled) return;
      setPrefs(ok && data ? data : {});
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="profile-section notif-page">
      <h2>Alertas pop-up</h2>
      <p>Gerencie avisos internos do app para manter a operação clara e sem ruído.</p>

      <section className="notif-types">
        <h3>Alertas da categoria</h3>
        {loading ? (
          <p className="notif-loading">Carregando…</p>
        ) : activeGroup ? (
          <div className="notif-group">
            <h4 className="notif-group__title">{activeGroup.title}</h4>
            <div className="notif-type-list">
              {activeGroup.items.map((item) => {
                const enabled = isEnabled(prefs, item.key);
                return (
                  <article key={item.key} className="notif-type-card notif-type-card--neutral">
                    <header className="notif-type-card__head">
                      <div>
                        <h5>{item.label}</h5>
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
          </div>
        ) : null}
      </section>
    </div>
  );
}

