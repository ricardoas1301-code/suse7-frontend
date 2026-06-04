import "./ContactModal.css";
import { useState, useEffect } from "react";
import { postFaleConoscoContact } from "../services/faleConoscoContactApi.js";

export default function ContactModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const form = new FormData(e.target);

    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    };

    try {
      const data = await postFaleConoscoContact(payload);
      setLoading(false);

      if (data.success) {
        setSuccess(true);
        e.target.reset();

        // FECHAMENTO AUTOMÁTICO
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

  return (
    <div className="modal-bg" onClick={onClose} role="presentation">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(e) => e.stopPropagation()}
      >

        <h2 id="contact-modal-title">Fale Conosco!</h2>
        <p>Envie sua mensagem</p>

        <form onSubmit={handleSubmit}>

          <label className="label">Nome completo</label>
          <input name="name" type="text" placeholder="Seu nome completo" required />

          <label className="label">Seu e-mail</label>
          <input name="email" type="email" placeholder="Seu e-mail" required />

          <label className="label">Assunto</label>
          <select name="subject" required>
            <option value="">Selecione o assunto</option>
            <option value="Suporte técnico">Suporte técnico</option>
            <option value="Dúvidas sobre assinatura">Dúvidas sobre assinatura</option>
            <option value="Sugestão">Sugestão</option>
            <option value="Problema com precificação">Problema com precificação</option>
            <option value="Outro">Outro</option>
          </select>

          <label className="label">Mensagem</label>
          <textarea name="message" placeholder="Digite sua mensagem" required></textarea>

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>

        {success && <p className="msg-success">Mensagem enviada com sucesso! 🎉</p>}
        {error && <p className="msg-error">{error}</p>}
      </div>
    </div>
  );
}
