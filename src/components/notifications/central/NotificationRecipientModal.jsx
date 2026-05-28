import { useEffect, useState } from "react";
import {
  formatWhatsAppBr,
  sanitizeWhatsAppInput,
  validateRecipientForm,
} from "./recipientContactUi";
import "./NotificationRecipientModal.css";

const emptyForm = () => ({
  label: "",
  role_tag: "",
  email: "",
  whatsapp: "",
  is_active: true,
});

/**
 * @param {Record<string, unknown> | null | undefined} group
 */
function groupToForm(group) {
  if (!group) return emptyForm();
  const email = group.channels?.email?.destination ?? "";
  const whatsapp = group.channels?.whatsapp?.destination ?? "";
  return {
    label: String(group.label ?? ""),
    role_tag: group.role_tag != null ? String(group.role_tag) : "",
    email: String(email),
    whatsapp: whatsapp ? formatWhatsAppBr(String(whatsapp)) : "",
    is_active: group.is_active !== false,
  };
}

/**
 * @param {string} name
 * @param {Record<string, string>} errors
 * @param {boolean} submitted
 */
function fieldClass(name, errors, submitted) {
  return submitted && errors[name] ? "s7-nrec-modal__field s7-nrec-modal__field--error" : "s7-nrec-modal__field";
}

export default function NotificationRecipientModal({
  open,
  initialGroup,
  saving,
  serverFieldErrors,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(groupToForm(initialGroup));
    setErrors({});
    setSubmitted(false);
  }, [open, initialGroup]);

  useEffect(() => {
    if (!serverFieldErrors || !open) return;
    setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
    setSubmitted(true);
  }, [serverFieldErrors, open]);

  if (!open) return null;

  const runValidation = () => {
    const result = validateRecipientForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return null;
    }
    setErrors({});
    return result;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const result = runValidation();
    if (!result) return;
    onSubmit?.({
      label: result.label,
      role_tag: form.role_tag.trim() || null,
      email: result.email,
      whatsapp: result.whatsapp,
      is_active: form.is_active,
    });
  };

  return (
    <div className="s7-nrec-modal" role="dialog" aria-modal="true">
      <button type="button" className="s7-nrec-modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="s7-nrec-modal__panel">
        <header className="s7-nrec-modal__head">
          <h3>{initialGroup ? "Editar destinatário" : "Novo destinatário"}</h3>
          <button type="button" className="s7-nrec-modal__close" onClick={onClose} disabled={saving}>
            ×
          </button>
        </header>

        <form className="s7-nrec-modal__form" onSubmit={handleSubmit} noValidate>
          <label className={fieldClass("label", errors, submitted)}>
            Nome *
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              maxLength={120}
              aria-invalid={Boolean(submitted && errors.label)}
            />
            {submitted && errors.label ? (
              <span className="s7-nrec-modal__field-error">{errors.label}</span>
            ) : null}
          </label>

          <label className="s7-nrec-modal__field">
            Função (opcional)
            <input
              value={form.role_tag}
              onChange={(e) => setForm((f) => ({ ...f, role_tag: e.target.value }))}
              placeholder="Ex.: Financeiro, Operacional"
              maxLength={80}
            />
          </label>

          <fieldset className="s7-nrec-modal__contact-block">
            <legend>Contato</legend>

            <label className={fieldClass("email", errors, submitted)}>
              E-mail *
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="nome@empresa.com"
                aria-invalid={Boolean(submitted && errors.email)}
              />
              {submitted && errors.email ? (
                <span className="s7-nrec-modal__field-error">{errors.email}</span>
              ) : null}
            </label>

            <label className={fieldClass("whatsapp", errors, submitted)}>
              WhatsApp *
              <input
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: sanitizeWhatsAppInput(e.target.value) }))}
                placeholder="(11) 99999-9999"
                aria-invalid={Boolean(submitted && errors.whatsapp)}
              />
              <span className="s7-nrec-modal__helper">Somente números. Formato: (11) 99999-9999</span>
              {submitted && errors.whatsapp ? (
                <span className="s7-nrec-modal__field-error">{errors.whatsapp}</span>
              ) : null}
            </label>
          </fieldset>

          <label className="s7-nrec-modal__active">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Ativo
          </label>

          <footer className="s7-nrec-modal__footer">
            <button type="button" className="s7-nrec-modal__btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="s7-nrec-modal__btn" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
