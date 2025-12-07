// src/pages/PasswordReset.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SuseLogo from "../assets/suse7-logo-redonda.png";
import "../styles/auth-pages.css";

export default function PasswordReset() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) setMsg("❌ Não foi possível atualizar a senha.");
    else setMsg("✅ Senha alterada com sucesso! Faça login novamente.");
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">

        <img src={SuseLogo} className="auth-logo" />

        <h2 className="auth-title">Criar nova senha</h2>
        <p className="auth-subtext">
          Defina sua nova senha de acesso ao Suse7.
        </p>

        <label className="auth-label">Nova senha</label>
        <input
          type="password"
          className="auth-input"
          placeholder="Digite a nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn" onClick={handleUpdate}>
          Atualizar senha
        </button>

        {msg && <p style={{ marginTop: 14 }}>{msg}</p>}

        <Link to="/login" className="auth-link">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
