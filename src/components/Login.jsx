// ======================================================================
// Login.jsx — SUSE7 (FINAL / PRODUÇÃO)
// Estrutura fiel à build original + assets locais
// ======================================================================

import { useState } from "react";
import ContactModal from "./ContactModal";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";


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



  // --------------------------------------------------------
  // Login com e-mail e senha
  // --------------------------------------------------------
  const handleLogin = async () => {
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setError("E-mail ou senha inválidos");
      return;
    }

    navigate("/");
  };

  // --------------------------------------------------------
  // Login com Google
  // --------------------------------------------------------
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError("Erro ao entrar com Google");
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
        <label className="login-label">E-mail ou usuário</label>
        <input
          className={`login-input ${error ? "login-input-error" : ""}`}
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Senha */}
        <label className="login-label">Senha</label>
        <div className="password-wrapper">
          <input
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
            >
            {showPassword ? "X" : "✔"}
          </button>
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
        <Link to="/privacidade">Segurança e privacidade</Link>
        <span className="login-copy">
          Suse7 2025 © Todos os direitos reservados
        </span>
      </div>

    </div>
  );
}
