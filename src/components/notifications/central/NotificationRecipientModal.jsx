import { useCallback, useEffect, useRef, useState } from "react";
import { useS7DialogFocus } from "../../ui/useS7DialogFocus.js";
import {
  formatWhatsAppBr,
  sanitizeWhatsAppInput,
  validateRecipientForm,
} from "./recipientContactUi";
import modalEditarDestinatarioAvatar from "../../../assets/profile/modal-editar-destinatario-avatar.png";
import "./NotificationRecipientModal.css";

const emptyForm = () => ({
  label: "",
  role_tag: "",
  email: "",
  whatsapp: "",
  is_active: true,
});

const REQUIRED_FIELD_ORDER = ["label", "email", "whatsapp"];

/**
 * @param {string} text
 */
function LabelObrigatorio({ text }) {
  return (
    <span className="s7-nrec-modal__label-text">
      {text}{" "}
      <span className="s7-nrec-modal__required" aria-hidden="true">
        *
      </span>
    </span>
  );
}

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
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const onCloseRef = useRef(onClose);
  const focusInvalidPendingRef = useRef(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isPrimary = Boolean(initialGroup?.is_primary);
  const isEditing = Boolean(initialGroup);

  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    if (saving) return;
    onCloseRef.current?.();
  }, [saving]);

  useS7DialogFocus({
    open,
    onClose: handleClose,
    containerRef: panelRef,
  });

  useEffect(() => {
    if (!open) return;
    setForm(groupToForm(initialGroup));
    setErrors({});
    setSubmitted(false);
    focusInvalidPendingRef.current = false;
  }, [open, initialGroup]);

  useEffect(() => {
    if (!serverFieldErrors || !open) return;
    setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
    setSubmitted(true);
    focusInvalidPendingRef.current = true;
  }, [serverFieldErrors, open]);

  useEffect(() => {
    if (!open || !submitted || !focusInvalidPendingRef.current) return;

    const firstInvalid = REQUIRED_FIELD_ORDER.find((name) => errors[name]);
    if (!firstInvalid) {
      focusInvalidPendingRef.current = false;
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const input = panelRef.current?.querySelector(`#s7-nrec-field-${firstInvalid}`);
      if (input instanceof HTMLElement) {
        input.focus();
      }
      focusInvalidPendingRef.current = false;
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [open, submitted, errors]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const result = validateRecipientForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      focusInvalidPendingRef.current = true;
      return;
    }
    setErrors({});
    const payload = {
      label: result.label,
      role_tag: form.role_tag.trim() || null,
      is_active: form.is_active,
    };
    if (!isPrimary) {
      payload.email = result.email;
      payload.whatsapp = result.whatsapp;
    }
    onSubmit?.(payload);
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  if (!open) return null;

  return (
    <div className="s7-nrec-modal" role="presentation" onMouseDown={handleOverlayMouseDown}>
      <div
        ref={panelRef}
        className="s7-nrec-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-nrec-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form className="s7-nrec-modal__form" onSubmit={handleSubmit} noValidate>
          <header className="s7-nrec-modal__head">
            <div className="s7-nrec-modal__head-copy">
              <h3 id="s7-nrec-modal-title">{isEditing ? "Editar destinatário" : "Novo destinatário"}</h3>
              <p className="s7-nrec-modal__required-legend">
                <span className="s7-nrec-modal__required" aria-hidden="true">
                  *
                </span>{" "}
                Campos obrigatórios
              </p>
            </div>
          </header>

          <div className="s7-nrec-modal__body">
            <div className="s7-nrec-modal__main">
              <div className="s7-nrec-modal__fields">
                <label className={fieldClass("label", errors, submitted)}>
                  <LabelObrigatorio text="Nome" />
                  <input
                    id="s7-nrec-field-label"
                    name="label"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    maxLength={120}
                    required
                    aria-required="true"
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

                <label className={fieldClass("email", errors, submitted)}>
                  <LabelObrigatorio text="E-mail" />
                  <input
                    id="s7-nrec-field-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="nome@empresa.com"
                    readOnly={isPrimary}
                    required
                    aria-required="true"
                    aria-readonly={isPrimary || undefined}
                    aria-invalid={Boolean(submitted && errors.email)}
                    className={isPrimary ? "s7-co-input-readonly" : undefined}
                  />
                  {isPrimary ? (
                    <span className="s7-nrec-modal__helper">
                      Este e-mail vem de Dados da Empresa e não pode ser alterado aqui.
                    </span>
                  ) : null}
                  {submitted && errors.email ? (
                    <span className="s7-nrec-modal__field-error">{errors.email}</span>
                  ) : null}
                </label>

                <label className={fieldClass("whatsapp", errors, submitted)}>
                  <LabelObrigatorio text="WhatsApp" />
                  <input
                    id="s7-nrec-field-whatsapp"
                    name="whatsapp"
                    inputMode="numeric"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: sanitizeWhatsAppInput(e.target.value) }))}
                    placeholder="(11) 99999-9999"
                    readOnly={isPrimary}
                    required
                    aria-required="true"
                    aria-readonly={isPrimary || undefined}
                    aria-invalid={Boolean(submitted && errors.whatsapp)}
                    className={isPrimary ? "s7-co-input-readonly" : undefined}
                  />
                  {isPrimary ? (
                    <span className="s7-nrec-modal__helper">
                      Este WhatsApp vem de Dados da Empresa e não pode ser alterado aqui.
                    </span>
                  ) : null}
                  {submitted && errors.whatsapp ? (
                    <span className="s7-nrec-modal__field-error">{errors.whatsapp}</span>
                  ) : null}
                </label>
              </div>

              <footer className="s7-nrec-modal__footer">
                <div className="s7-nrec-modal__footer-status">
                  <label
                    className={`s7-nrec-modal__switch ${form.is_active ? "s7-nrec-modal__switch--on" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      disabled={saving}
                      aria-checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="s7-nrec-modal__switch-track" aria-hidden />
                    <span className="s7-nrec-modal__switch-label">Ativo</span>
                  </label>
                </div>
                <button type="submit" className="s7-nrec-modal__btn" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </footer>
            </div>

            <aside className="s7-nrec-modal__avatar-col" aria-hidden="true">
              <img
                className="s7-nrec-modal__avatar"
                src={modalEditarDestinatarioAvatar}
                alt="Ilustração de destinatário configurando canais de notificação por e-mail e WhatsApp"
                decoding="async"
              />
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
