import { Link } from "react-router-dom";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext.jsx";
import "./AuthCallbackGate.css";

/**
 * Gate de entrada autenticada — evita loading infinito pós-confirmação de e-mail.
 */
export default function AuthCallbackGate({ children }) {
  const { loading, session, callbackError, birthCompletionState } = useAuthBootstrap();

  if (loading) {
    return (
      <div className="auth-callback-gate" role="status" aria-live="polite">
        <p className="auth-callback-gate__message">Carregando...</p>
      </div>
    );
  }

  if (callbackError) {
    return (
      <div className="auth-callback-gate auth-callback-gate--error" role="alert">
        <h1 className="auth-callback-gate__title">Não conseguimos concluir sua entrada</h1>
        <p className="auth-callback-gate__message">{callbackError.message}</p>
        <Link to="/login" className="auth-callback-gate__link">
          Tentar entrar novamente
        </Link>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (birthCompletionState === "failed") {
    return (
      <div className="auth-callback-gate auth-callback-gate--error" role="alert">
        <h1 className="auth-callback-gate__title">Cadastro confirmado, mas houve um problema</h1>
        <p className="auth-callback-gate__message">
          Sua sessão foi criada, mas não conseguimos finalizar a configuração inicial da conta.
          Tente entrar novamente ou contate o suporte.
        </p>
        <Link to="/login" className="auth-callback-gate__link">
          Ir para o login
        </Link>
      </div>
    );
  }

  return children;
}
