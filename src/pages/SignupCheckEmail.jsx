import { Link } from "react-router-dom";
import "../components/Signup.css";

/**
 * @param {{
 *   emailMasked: string;
 *   onClose: () => void;
 * }} props
 */
export default function SignupCheckEmail({ emailMasked, onClose }) {
  return (
    <div className="signup-check-email">
      <h2 className="signup-check-email__title">Conta criada com sucesso</h2>
      <p className="signup-check-email__lead">
        Enviamos um e-mail de confirmação para{" "}
        <strong>{emailMasked || "seu endereço"}</strong>.
      </p>
      <p className="signup-check-email__hint">Confirme seu e-mail para continuar.</p>
      <p className="signup-check-email__spam">Confira também a pasta de spam.</p>
      <div className="signup-check-email__actions">
        <button type="button" className="signup-btn signup-btn--stacked" onClick={onClose}>
          Entendi
        </button>
        <Link to="/login" className="signup-check-email__login-link">
          Ir para login
        </Link>
      </div>
    </div>
  );
}
