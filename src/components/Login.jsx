// ======================================================================
// Login.jsx — SUSE7 (VERSÃO ORIGINAL / PREMIUM)
// ======================================================================

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    <div className="login-wrapper">

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <img src="/logo-suse7.svg" alt="Suse7" />
        </div>

        <h2 className="login-title">Acesse sua conta</h2>

        {error && <p className="login-error">{error}</p>}

        <label>E-mail ou usuário</label>
        <input
          className="login-input"
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Senha</label>
        <input
          className="login-input"
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <div className="login-forgot">
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Entrar
        </button>

        <div className="login-divider">Ou acesse via</div>

        <button className="login-google-btn" onClick={handleGoogleLogin}>
          <img src="/google-icon.svg" alt="Google" />
          Google
        </button>

        <div className="login-signup">
          Ainda não tem cadastro?{" "}
          <Link to="/signup">Inscreva-se agora</Link>
        </div>

      </div>

      <footer className="login-footer">
        <Link to="/contato">Fale conosco</Link> |{" "}
        <Link to="/termos">Termos de uso</Link> |{" "}
        <Link to="/privacidade">Segurança e privacidade</Link>
        <p>Suse7 2025 © Todos os direitos reservados</p>
      </footer>

    </div>
  );
}
