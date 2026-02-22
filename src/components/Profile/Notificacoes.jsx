// ======================================================================
//  PERFIL — PREFERÊNCIAS > NOTIFICAÇÕES
//  Configurações de alertas: in-app (sininho) e WhatsApp
//  Keys: notify.<TYPE>.in_app, notify.<TYPE>.whatsapp -> { enabled: true/false }
// ======================================================================

import { useState, useEffect } from "react";
import { getPreferences, setPreference, resetPreferences } from "../../services/userPreferencesService";
import { useNotifications } from "../../contexts/NotificationContext";
import "./Notificacoes.css";

const NOTIFY_TYPES = [
  { key: "STOCK_LOW", label: "Estoque baixo" },
  { key: "STOCK_BELOW_MIN", label: "Estoque abaixo do mínimo" },
  { key: "STOCK_REAL_ZERO", label: "Estoque zerado" },
];

function getPrefKey(type, channel) {
  return `notify.${type}.${channel}`;
}

export default function Notificacoes() {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { addNotification } = useNotifications();

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
    const key = getPrefKey(type, channel);
    const val = prefs?.[key] ?? prefs?.[key.toLowerCase?.()];
    if (channel === "in_app") return val?.enabled !== false; // default true
    return val?.enabled === true; // default false para whatsapp
  };

  const setEnabled = async (type, channel, enabled) => {
    const key = getPrefKey(type, channel);
    const prev = { ...prefs };
    setPrefs((p) => ({ ...p, [key]: { enabled } }));
    const { ok, error } = await setPreference(key, { enabled });
    if (!ok) {
      setPrefs(prev);
      addNotification({ type: "error", title: "Erro", message: error ?? "Não foi possível salvar." });
    } else {
      window.dispatchEvent(new Event("suse7:notifyPrefsChanged"));
    }
  };

  const handleResetModals = async () => {
    setResetting(true);
    try {
      const { ok, error } = await resetPreferences("modal.");
      if (ok) {
        addNotification({ type: "success", title: "Preferências", message: "Avisos de modais resetados. Você voltará a ver os avisos." });
      } else {
        addNotification({ type: "error", title: "Erro", message: error ?? "Não foi possível resetar." });
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="profile-section notif-page">
      <h2>Notificações</h2>
      <p>Configure como deseja receber cada tipo de alerta.</p>

      {/* Preferências por tipo: in-app + whatsapp */}
      <section className="notif-types">
        <h3>Tipos de alerta</h3>
        {loading ? (
          <p className="notif-loading">Carregando…</p>
        ) : (
          <div className="notif-type-list">
            {NOTIFY_TYPES.map(({ key, label }) => (
              <div key={key} className="notif-type-card">
                <h4>{label}</h4>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={getEnabled(key, "in_app")}
                    onChange={(e) => setEnabled(key, "in_app", e.target.checked)}
                  />
                  <span>Mostrar no sininho</span>
                </label>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={getEnabled(key, "whatsapp")}
                    onChange={(e) => setEnabled(key, "whatsapp", e.target.checked)}
                  />
                  <span>Enviar via WhatsApp</span>
                </label>
                <p className="notif-whatsapp-hint">
                  WhatsApp será ativado após configurar número/integração.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="notif-modals">
        <h3>Modais</h3>
        <p>Se você marcou &quot;Não mostrar mais&quot; em algum aviso (ex: sair sem salvar), pode reativar aqui.</p>
        <button
          type="button"
          className="s7-btn s7-btn--secondary"
          onClick={handleResetModals}
          disabled={resetting}
        >
          {resetting ? "Resetando…" : "Resetar avisos de modais"}
        </button>
      </section>
    </div>
  );
}
