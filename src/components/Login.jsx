// src/components/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import GoogleIcon from "../assets/google.png";
import SuseLogo from "../assets/suse7-logo-redonda.png";
import ContactModal from "./ContactModal";

export default function Login() {

  /* -------------------------------------------------------------
     STATES
  ------------------------------------------------------------- */
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // <-- MENSAGEM DE ERRO


  /* -------------------------------------------------------------
     LOGIN POR EMAIL
  ------------------------------------------------------------- */
  const handleEmailLogin = async () => {
    setErrorMsg(""); // limpa erro anterior

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErrorMsg("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }

    navigate("/");
  };


  /* -------------------------------------------------------------
     LOGIN COM GOOGLE
  ------------------------------------------------------------- */
  const handleGoogleLogin = async () => {
    const { error } = await 
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});

    if (error) {
      setErrorMsg("Erro ao conectar com o Google. Tente novamente.");
      return;
    }

    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          primeiro_login: true,
          created_at: new Date(),
          last_login: new Date(),
        });
      }
    }, 800);
  };


  /* -------------------------------------------------------------
     RETORNO FINAL DO COMPONENTE — APENAS 1 RETURN!
  ------------------------------------------------------------- */
  return (
    <div className="login-bg">

      <div className="login-box">

        {/* LOGO */}
        <img src={SuseLogo} alt="Suse7" className="login-logo" />

        {/* TÍTULO */}
        <p className="login-subtitle">Acesse sua conta</p>

        {/* MENSAGEM DE ERRO PERSONALIZADA */}
        {errorMsg && (
          <div className="login-error-msg">
            {errorMsg}
          </div>
        )}

        {/* EMAIL */}
        <label className="login-label">E-mail ou usuário</label>
        <input
          type="email"
          className="login-input"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* SENHA */}
        <label className="login-label">Senha</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            className="login-input-password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "✖" : "✔"}
          </button>
        </div>

        {/* ESQUECI SENHA */}
          <Link to="/forgot-password" className="forgot-password">
          Esqueci minha senha
          </Link>


        {/* BOTÃO LOGIN */}
        <button className="login-submit" onClick={handleEmailLogin}>
          Entrar
        </button>

        <div className="login-divider">Ou acesse via</div>

        {/* LOGIN GOOGLE */}
        <button className="login-google-btn" onClick={handleGoogleLogin}>
          <img src={GoogleIcon} className="google-logo" alt="Google" />
          <span>Google</span>
        </button>

        {/* CADASTRO */}
        <p className="login-footer-small">
          Ainda não tem cadastro? <Link to="/signup">Inscreva-se agora</Link>
        </p>
      </div>

      {/* MODAL CONTATO */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}

      {/* RODAPÉ */}
      <div className="login-footer">
        <span onClick={() => setShowContactModal(true)} className="footer-contact">
          Fale conosco
        </span>
        {" | "}
        <Link to="/termos">Termos de uso</Link>
        {" | "}
        <Link to="/privacidade">Segurança e privacidade</Link>

        <span className="login-copy">
          Suse7 2025 © Todos os direitos reservados
        </span>
      </div>

    </div>
  );
}
