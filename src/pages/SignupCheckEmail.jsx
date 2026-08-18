import { Link } from "react-router-dom";
import "./SignupCheckEmail.css";
import signupSuccessAvatarFeminino from "../assets/profile/signup-success-avatar-feminino.png";
import signupSuccessAvatarMasculino from "../assets/profile/signup-success-avatar-masculino.png";

/**
 * Tela própria de sucesso pós-cadastro (confirmação de e-mail).
 * @param {{ emailMasked: string }} props
 */
export default function SignupCheckEmail({ emailMasked }) {
  return (
    <div className="signup-success-page">
      <div className="signup-success-card" role="status" aria-live="polite">
        <div className="signup-success-card__body">
          <aside
            className="signup-success-card__avatar signup-success-card__avatar--left"
            aria-hidden="true"
          >
            <img
              className="signup-success-card__avatar-img"
              src={signupSuccessAvatarFeminino}
              alt=""
              decoding="async"
            />
          </aside>

          <div className="signup-success-card__main">
            <h1 className="signup-success-card__title">Conta criada com sucesso</h1>

            <p className="signup-success-card__welcome">
              <strong>Seja bem-vindo à SUSE7!</strong>
            </p>

            <p className="signup-success-card__lead">
              Sua conta foi criada com sucesso e já enviamos um e-mail de confirmação para{" "}
              <strong>{emailMasked || "seu endereço"}</strong>.
            </p>

            <p className="signup-success-card__next">
              Para continuar, confirme seu e-mail e ative seu acesso. Assim que a confirmação for
              concluída, você poderá entrar no SUSE7 e começar a organizar sua operação, proteger
              sua margem e vender com mais segurança.
            </p>

            <p className="signup-success-card__spam">
              Se não encontrar o e-mail na caixa de entrada, confira também a pasta de spam ou
              lixo eletrônico.
            </p>

            <Link to="/login" className="signup-success-card__cta">
              Ir para o login
            </Link>
          </div>

          <aside
            className="signup-success-card__avatar signup-success-card__avatar--right"
            aria-hidden="true"
          >
            <img
              className="signup-success-card__avatar-img"
              src={signupSuccessAvatarMasculino}
              alt=""
              decoding="async"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
