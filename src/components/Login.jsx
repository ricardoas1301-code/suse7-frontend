// ======================================================================
// Login.jsx — SUSE7 (VERSÃO PREMIUM + LOGIN SOCIAL)
// ======================================================================

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";// ✅ CSS do login (já existia antes)

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
  // Login Social (Google)
  // --------------------------------------------------------
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError("Erro ao fazer login com Google");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h2 className="login-title">Entrar no Suse7</h2>

        {error && <p className="login-error">{error}</p>}

        <input
          className="login-input"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin}>
          Entrar
        </button>

        <div className="login-divider">ou</div>

        <button className="login-google-btn" onClick={handleGoogleLogin}>
          Entrar com Google
        </button>

        <div className="login-links">
          <Link to="/forgot-password">Esqueci minha senha</Link>
          <Link to="/signup">Criar conta</Link>
        </div>

      </div>
    </div>
  );
}
