// src/pages/PasswordForgot.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SuseLogo from "../assets/suse7-logo-redonda.png";
import "../styles/auth-pages.css";

export default function PasswordForgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${import.meta.env.VITE_FRONTEND_URL}/reset-password`,
    });

    if (error) setMsg("❌ Erro ao enviar link. Verifique o e-mail.");
    else setMsg("✅ Enviamos um link de redefinição para o seu e-mail!");
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">

        <img src={SuseLogo} className="auth-logo" />

        <h2 className="auth-title">Redefinir senha</h2>
        <p className="auth-subtext">
          Insira o e-mail cadastrado para receber o link de recuperação.
        </p>

        <label className="auth-label">E-mail cadastrado</label>
        <input
          type="email"
          className="auth-input"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="auth-btn" onClick={handleReset}>
          Enviar link
        </button>

        {msg && <p style={{ marginTop: 14 }}>{msg}</p>}

        <Link to="/login" className="auth-link">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
