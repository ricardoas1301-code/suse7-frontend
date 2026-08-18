import "./ContactModal.css";
import { useRef, useState } from "react";
import { postFaleConoscoContact } from "../services/faleConoscoContactApi.js";
import { FALE_CONOSCO_SUBJECT_OPTIONS } from "../services/faleConoscoContactUi.js";
import { useS7DialogFocus } from "./ui/useS7DialogFocus.js";
import modalFaleConoscoAvatar from "../assets/profile/modal-fale-conosco-avatar.png";

/**
 * @param {{
 *   onClose: () => void;
 *   prefill?: { subject?: string; message?: string } | null;
 *   context?: { source?: string; plan_key?: string } | null;
 * }} props
 */
export default function ContactModal({ onClose, prefill = null, context = null }) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useS7DialogFocus({ open: true, onClose, containerRef: panelRef });

  const subjectDefault = String(prefill?.subject ?? "").trim();
  const messageDefault = String(prefill?.message ?? "").trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSuccess(false);
    setError("");

    const form = new FormData(e.target);

    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
      source: context?.source,
      plan_key: context?.plan_key,
    };

    try {
      const data = await postFaleConoscoContact(payload);
      setLoading(false);

      if (data.success) {
        setSuccess(true);
        e.target.reset();

        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Erro ao enviar sua mensagem.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao enviar.");
      setLoading(false);
    }
  }

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget && !loading) onClose();
  };

  return (
    <div className="modal-bg" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div
        ref={panelRef}
        className="modal-box contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        aria-describedby="contact-modal-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="contact-modal__body">
          <div className="contact-modal__main">
            <header className="contact-modal__head">
              <h2 id="contact-modal-title">Fale Conosco</h2>
              <p id="contact-modal-desc">Envie sua mensagem</p>
            </header>

            <form onSubmit={handleSubmit}>
              <label className="label">Nome completo</label>
              <input name="name" type="text" placeholder="Seu nome completo" required disabled={loading} />

              <label className="label">Seu e-mail</label>
              <input name="email" type="email" placeholder="Seu e-mail" required disabled={loading} />

              <label className="label">Assunto</label>
              <select name="subject" required defaultValue={subjectDefault} disabled={loading}>
                <option value="">Selecione o assunto</option>
                {FALE_CONOSCO_SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label className="label">Mensagem</label>
              <textarea
                name="message"
                placeholder="Digite sua mensagem"
                required
                defaultValue={messageDefault}
                disabled={loading}
                onInvalid={(event) => event.preventDefault()}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>

            {error ? <p className="msg-error">{error}</p> : null}
          </div>

          <aside className="contact-modal__avatar-col">
            <img
              className="contact-modal__avatar"
              src={modalFaleConoscoAvatar}
              alt=""
              decoding="async"
              aria-hidden="true"
            />
            {success ? (
              <p className="contact-modal__success msg-success" role="status" aria-live="polite">
                Mensagem enviada com sucesso! 🎉
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
