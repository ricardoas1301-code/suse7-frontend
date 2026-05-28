// ============================================================
// Preferências > Notificações > Destinatários de notificações
// Cadastro de contatos operacionais (sem login no sistema)
// ============================================================

import { useCallback, useEffect, useState } from "react";
import {
  createNotificationContact,
  fetchNotificationContacts,
  patchNotificationContact,
} from "../../services/notificationRoutingService";
import { useNotifications } from "../../contexts/NotificationContext";
import "./DestinatariosNotificacoes.css";

const emptyForm = () => ({
  name: "",
  role: "",
  whatsapp: "",
  email: "",
  active: true,
});

function formatWhatsAppDisplay(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  if (d.length < 10) return d || "—";
  const tail = d.slice(-8);
  const ddd = d.slice(-10, -8);
  return `(${ddd}) ${tail.slice(0, 4)}-${tail.slice(4)}`;
}

export default function DestinatariosNotificacoes() {
  const { addNotification } = useNotifications();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchNotificationContacts();
    setLoading(false);
    if (!res.ok) {
      addNotification({
        type: "error",
        title: "Destinatários",
        message: res.error ?? "Não foi possível carregar a lista.",
      });
      setContacts([]);
      return;
    }
    setContacts(Array.isArray(res.data?.contacts) ? res.data.contacts : []);
  }, [addNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      role: row.role ?? "",
      whatsapp: row.whatsapp ?? "",
      email: row.email ?? "",
      active: row.active !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const name = String(form.name || "").trim();
    const waDigits = String(form.whatsapp || "").replace(/\D/g, "");
    const email = String(form.email || "").trim().toLowerCase();
    if (!name) {
      addNotification({ type: "error", title: "Validação", message: "Nome do contato é obrigatório." });
      return;
    }
    if (!waDigits && !email) {
      addNotification({
        type: "error",
        title: "Validação",
        message: "Informe pelo menos WhatsApp ou e-mail.",
      });
      return;
    }

    setSaving(true);
    const payload = {
      name,
      role: String(form.role || "").trim() || null,
      whatsapp: waDigits || null,
      email: email || null,
      active: Boolean(form.active),
    };

    const res = editingId
      ? await patchNotificationContact(editingId, payload)
      : await createNotificationContact(payload);
    setSaving(false);

    if (!res.ok) {
      addNotification({
        type: "error",
        title: "Destinatários",
        message: res.error ?? "Não foi possível salvar.",
      });
      return;
    }

    addNotification({
      type: "success",
      title: "Destinatários",
      message: editingId ? "Contato atualizado." : "Contato criado.",
    });
    setModalOpen(false);
    await load();
  };

  const onToggleActive = async (row) => {
    const res = await patchNotificationContact(row.id, { active: !row.active });
    if (!res.ok) {
      addNotification({ type: "error", title: "Destinatários", message: res.error ?? "Falha ao atualizar status." });
      return;
    }
    await load();
  };

  const onDeactivate = async (row) => {
    const res = await deactivateNotificationContact(row.id);
    if (!res.ok) {
      addNotification({ type: "error", title: "Destinatários", message: res.error ?? "Falha ao desativar." });
      return;
    }
    addNotification({ type: "success", title: "Destinatários", message: "Contato desativado." });
    await load();
  };

  const sorted = [...contacts].sort((a, b) => {
    if (Boolean(b.active) !== Boolean(a.active)) return (b.active ? 1 : 0) - (a.active ? 1 : 0);
    return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
  });

  return (
    <div className="s7-destinatarios-page">
      <header className="s7-destinatarios-page__header">
        <div>
          <h2>Destinatários de notificações</h2>
          <p>Gerencie quem recebe alertas operacionais do Suse7 por e-mail e WhatsApp.</p>
        </div>
        <button type="button" className="s7-destinatarios-page__primary" onClick={openNew}>
          Novo destinatário
        </button>
      </header>

      {loading ? (
        <p className="s7-destinatarios-page__loading">Carregando…</p>
      ) : sorted.length === 0 ? (
        <div className="s7-destinatarios-page__empty">
          <p>Nenhum destinatário cadastrado ainda.</p>
          <button type="button" className="s7-destinatarios-page__primary" onClick={openNew}>
            Novo destinatário
          </button>
        </div>
      ) : (
        <div className="s7-destinatarios-page__grid">
          {sorted.map((row) => (
            <article key={row.id} className="s7-destinatarios-card">
              <div className="s7-destinatarios-card__head">
                <div>
                  <h3>{row.name}</h3>
                  {row.role ? <p className="s7-destinatarios-card__role">{row.role}</p> : null}
                </div>
                <span className={`s7-destinatarios-card__status ${row.active ? "is-on" : "is-off"}`}>
                  {row.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="s7-destinatarios-card__badges">
                {row.whatsapp ? (
                  <span className="s7-destinatarios-badge s7-destinatarios-badge--wa">WhatsApp</span>
                ) : null}
                {row.email ? <span className="s7-destinatarios-badge s7-destinatarios-badge--mail">E-mail</span> : null}
              </div>
              <dl className="s7-destinatarios-card__dl">
                {row.whatsapp ? (
                  <>
                    <dt>WhatsApp</dt>
                    <dd>{formatWhatsAppDisplay(row.whatsapp)}</dd>
                  </>
                ) : null}
                {row.email ? (
                  <>
                    <dt>E-mail</dt>
                    <dd>{row.email}</dd>
                  </>
                ) : null}
              </dl>
              <div className="s7-destinatarios-card__actions">
                <button type="button" className="s7-destinatarios-linkbtn" onClick={() => openEdit(row)}>
                  Editar
                </button>
                <button type="button" className="s7-destinatarios-linkbtn" onClick={() => onToggleActive(row)}>
                  {row.active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="s7-destinatarios-modal-overlay" role="presentation" onMouseDown={closeModal}>
          <div
            className="s7-destinatarios-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="s7-dest-modal-title"
            onMouseDown={(ev) => ev.stopPropagation()}
          >
            <h3 id="s7-dest-modal-title">{editingId ? "Editar destinatário" : "Novo destinatário"}</h3>
            <form onSubmit={onSubmit}>
              <label className="s7-destinatarios-field">
                <span>Nome do contato</span>
                <input
                  value={form.name}
                  onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="s7-destinatarios-field">
                <span>Cargo / função</span>
                <input
                  value={form.role}
                  onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
                  autoComplete="organization-title"
                />
              </label>
              <label className="s7-destinatarios-field">
                <span>WhatsApp</span>
                <input
                  value={form.whatsapp}
                  onChange={(ev) => setForm((f) => ({ ...f, whatsapp: ev.target.value }))}
                  inputMode="tel"
                  placeholder="DDD + número"
                />
              </label>
              <label className="s7-destinatarios-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
                  autoComplete="email"
                />
              </label>
              <label className="s7-destinatarios-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(ev) => setForm((f) => ({ ...f, active: ev.target.checked }))}
                />
                <span>Ativo</span>
              </label>
              <div className="s7-destinatarios-modal__actions">
                <button type="button" className="s7-destinatarios-btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="s7-destinatarios-page__primary" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
