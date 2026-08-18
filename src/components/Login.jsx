// ======================================================================
// Login.jsx — SUSE7 (FINAL / PRODUÇÃO)
// Estrutura fiel à build original + assets locais
// ======================================================================

import { useEffect, useState } from "react";
import ContactModal from "./ContactModal";
import { mapSupabaseAuthErrorMessage } from "../lib/supabaseEnv.js";
import { getSupabaseLoginDebug, supabase, supabaseProjectRef } from "../supabaseClient";
import {
  clearIntroSessionFlags,
  logIntroAuthDev,
  markIntroPendingForNextLogin,
} from "../auth/introAuthSession.js";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function IconEye({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconEyeOff({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Assets (src/assets)
import suse7Logo from "../assets/suse7-logo-redonda.png";
import googleLogo from "../assets/google.png";


export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.info("[Suse7][Login] mount", getSupabaseLoginDebug());
  }, []);

  // --------------------------------------------------------
  // Login com e-mail e senha
  // --------------------------------------------------------
  const handleLogin = async () => {
    setError("");

    const authDebug = getSupabaseLoginDebug();
    console.info("[Suse7][Login] antes do signIn", authDebug);
    if (authDebug.usesLocalhost) {
      setError(
        "Configuração inválida: Supabase apontando para localhost. Pare o Vite, apague node_modules/.vite, confira .env.development e suba npm run dev de novo."
      );
      return;
    }

    let authError = null;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      authError = error;
    } catch (err) {
      authError = err;
    }

    if (authError) {
      console.warn("[Suse7][Login] signIn erro", {
        message: authError?.message,
        name: authError?.name,
        status: authError?.status,
        authDebug,
      });
      setError(
        mapSupabaseAuthErrorMessage(authError, {
          projectRef: supabaseProjectRef,
        })
      );
      return;
    }

    console.info("[Suse7][Login] signIn ok", { projectRef: supabaseProjectRef });
    markIntroPendingForNextLogin("password_login");
    logIntroAuthDev("auth_login_success", { provider: "password" });
    navigate("/", { replace: true });
  };

  // --------------------------------------------------------
  // Login com Google
  // - Usa redirectTo baseado em env (VITE_FRONTEND_URL) para PROD/DEV
  // --------------------------------------------------------
  const handleGoogleLogin = async () => {
    const redirectTo =
      import.meta.env.VITE_FRONTEND_URL || window.location.origin;

    markIntroPendingForNextLogin("oauth_google_start");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      logIntroAuthDev("intro_skipped_reason", {
        reason: "oauth_start_failed",
        message: error?.message ?? null,
      });
      clearIntroSessionFlags("oauth_start_failed");
      setError(
        mapSupabaseAuthErrorMessage(error, {
          projectRef: supabaseProjectRef,
        })
      );
    }
  };

  return (
    <div className="login-bg">

      {/* -------------------- Card -------------------- */}
      <div className="login-box">

        {/* Logo */}
        <img
          src={suse7Logo}
          alt="Suse7"
          className="login-logo"
        />

        <p className="login-subtitle">Acesse sua conta</p>

        {error && (
            <div className="login-error-msg">
            {error}
          </div>
        )}


        {/* E-mail */}
        <div className="login-field">
          <label className="login-label" htmlFor="login-email">
            E-mail ou usuário
          </label>
          <input
            id="login-email"
            className={`login-input ${error ? "login-input-error" : ""}`}
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Senha */}
        <div className="login-field">
          <label className="login-label" htmlFor="login-senha">
            Senha
          </label>
          <div className="password-wrapper">
            <input
              id="login-senha"
              className={`login-input-password ${error ? "login-input-error" : ""}`}
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        {/* Esqueci senha */}
        <Link className="forgot-password" to="/forgot-password">
          Esqueci minha senha
        </Link>

        {/* Entrar */}
        <button className="login-submit" onClick={handleLogin}>
          Entrar
        </button>

        {/* Divider */}
        <div className="login-divider">Ou acesse via</div>

        {/* Google */}
        <button className="login-google-btn" onClick={handleGoogleLogin}>
          <img
            src={googleLogo}
            alt="Google"
            className="google-logo"
          />
          <span>Google</span>
        </button>

        {/* Signup */}
        <p className="login-footer-small">
          Ainda não tem cadastro?{" "}
          <Link to="/signup">Inscreva-se agora</Link>
        </p>

      </div>

      {/* -------------------- Footer -------------------- */}
      <div className="login-footer">
        <span
  className="footer-contact"
  style={{ cursor: "pointer" }}
  onClick={() => setShowContactModal(true)}
>
  Fale conosco
</span>

{showContactModal && (
  <ContactModal onClose={() => setShowContactModal(false)} />
)}

        <Link to="/termos">Termos de uso</Link> |{" "}
        <Link to="/privacidade">Política de Privacidade</Link>
        <span className="login-copy">
          Suse7 2026 © Todos os direitos reservados
        </span>
      </div>

    </div>
  );
}
