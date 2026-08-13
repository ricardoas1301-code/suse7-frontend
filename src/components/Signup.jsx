// ======================================================================
// SUSE7 — Signup (cadastro de usuário)
// Dois fluxos: formulário (email/senha) e login social (Google).
// Regra primeiro_login: formulário = false, social = true.
// ======================================================================

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes.js";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "../assets/google.png";
import "./Signup.css";
import Suse7Alert from "../components/Suse7Alert";
import SignupMarketingColumn from "./SignupMarketingColumn.jsx";
import TermsAcceptanceModal from "./legal/TermsAcceptanceModal.jsx";
import SignupCheckEmail from "../pages/SignupCheckEmail.jsx";
import {
  criarSignupPendingBirth,
  vincularSignupPendingBirth,
  abortarSignupPendingBirth,
} from "../services/signupPendingBirthApi.js";
import {
  clearSignupFieldValidityForField,
  getFirstSignupValidationError,
  getSignupRequiredFieldMessage,
  showSignupFieldValidation,
  toSequentialSignupErrors,
} from "./signupFormPresentation.js";


// --- Funções de Validação de CPF/CNPJ (CNPJ Corrigido Novamente) ---
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

// 🔥 CNPJ VALIDATION CORRIGIDA DEFINITIVAMENTE
function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado == digitos.charAt(1);
}

/**
 * Mensagens para Suse7Alert a partir de AuthError / GoTrue.
 * Ordem: rate limit antes de “já existe”, pois 429 pode vir com texto genérico.
 */
/** Ícone olho (senha oculta — clique para mostrar). */
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

/** Ícone olho riscado (senha visível — clique para ocultar). */
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

function mapAuthSignupError(error) {
  const status = error?.status;
  const code = error?.code;
  const msg = String(error?.message || "").toLowerCase();

  if (
    status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    msg.includes("rate limit") ||
    msg.includes("email rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("too many")
  ) {
    return {
      title: "Muitas tentativas",
      message:
        "O servidor limitou novas tentativas de cadastro neste momento (proteção anti-abuso).\n" +
        "Aguarde alguns minutos e tente novamente. Confira também se não há outra aba tentando cadastrar.",
    };
  }

  const duplicateCodes = new Set([
    "email_exists",
    "user_already_exists",
    "identity_already_exists",
    "phone_exists",
  ]);
  if (
    duplicateCodes.has(code) ||
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already exists") ||
    (msg.includes("email") && msg.includes("already"))
  ) {
    return {
      title: "Conta já existente",
      message:
        "O e-mail informado já está cadastrado no Suse7.\n" +
        "Se você já possui uma conta, faça login para continuar.\n" +
        "Caso precise recuperar o acesso, use “Esqueci minha senha” na tela de login.",
    };
  }

  if (code === "signup_disabled" || code === "email_provider_disabled") {
    return {
      title: "Cadastro indisponível",
      message:
        "O cadastro por e-mail está temporariamente indisponível. Tente mais tarde ou use outro método de acesso.",
    };
  }

  if (code === "weak_password") {
    return {
      title: "Senha fraca",
      message:
        error.message?.trim() || "Escolha uma senha mais forte, conforme as regras do sistema.",
    };
  }

  return {
    title: "Erro ao criar conta",
    message: error.message?.trim()
      ? `${error.message.trim()}\n\nSe o problema persistir, tente novamente em alguns instantes.`
      : "Não foi possível concluir o cadastro. Tente novamente.",
  };
}

/** Asterisco de campo obrigatório — paridade Nova empresa (`.s7-co-required`) */
function ReqMark() {
  return (
    <span className="s7-co-required" aria-hidden="true">
      *
    </span>
  );
}

export default function Signup() {
  useEffect(() => {
    document.documentElement.classList.add("signup-page-lock");
    document.body.classList.add("signup-page-lock");
    return () => {
      document.documentElement.classList.remove("signup-page-lock");
      document.body.classList.remove("signup-page-lock");
    };
  }, []);

  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const formRef = useRef(null);

  // --- Estados para mostrar/esconder senha ---
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // -------------------------------
  // CAMPOS DO FORMULÁRIO
  // -------------------------------
  const [form, setForm] = useState({
    nome: "",
    nome_loja: "",
    email: "",
    whatsapp: "",
    telefone: "",
    cpf_cnpj: "",
    senha: "",
    senha2: "",
    termos: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosAceite, setTermosAceite] = useState(/** @type {null | {
   * document_type: string;
   * document_version: string;
   * document_hash: string;
   * accepted_at: string;
   * source: string;
   * scrolled_to_end: boolean;
  }} */ (null));
  /** Após PRE-CONFIRM success — exibe instruções de confirmação por e-mail. */
  const [preConfirmSuccess, setPreConfirmSuccess] = useState(/** @type {null | { emailMasked: string }} */ (null));
  /** Evita duplo submit antes do React aplicar `loading` (setState é assíncrono). */
  const signupInFlightRef = useRef(false);
  const oauthInFlightRef = useRef(false);

  // ----------------------------------------
  // Atualizar campos com MÁSCARAS e validação numérica
  // ----------------------------------------
  const update = (field, value) => {
    clearSignupFieldValidityForField(formRef.current, field);

    let formattedValue = value;
    let newErrors = { ...errors, [field]: "" };

    const onlyNumbers = value.replace(/\D/g, "");

    if (field === 'whatsapp' || field === 'telefone') {
      formattedValue = onlyNumbers.slice(0, 11)
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{4})$/, '$1-$2')
        .replace(/(\d{5})(\d{4})$/, '$1-$2');
    } else if (field === 'cpf_cnpj') {
      if (onlyNumbers.length <= 11) { 
        formattedValue = onlyNumbers.slice(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else { 
        formattedValue = onlyNumbers.slice(0, 14)
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
    }

    setForm((prev) => ({ ...prev, [field]: formattedValue }));
    setErrors(newErrors);
  };

  // ----------------------------------------
  // Validação dos campos obrigatórios e CPF/CNPJ
  // ----------------------------------------
  /** Validação lógica completa — não aplica estado visual (sequencial no submit). */
  const validarCampos = () => {
    const e = {};

    if (!String(form.nome ?? "").trim()) e.nome = getSignupRequiredFieldMessage("nome");
    if (!form.nome_loja) e.nome_loja = getSignupRequiredFieldMessage("nome_loja");

    // Validação de CPF/CNPJ
    const cpfCnpjLimpo = form.cpf_cnpj.replace(/\D/g, "");
    if (!form.cpf_cnpj) {
      e.cpf_cnpj = getSignupRequiredFieldMessage("cpf_cnpj");
    } else if (cpfCnpjLimpo.length === 11) {
      if (!validarCPF(cpfCnpjLimpo)) e.cpf_cnpj = "CPF inválido";
    } else if (cpfCnpjLimpo.length === 14) {
      if (!validarCNPJ(cpfCnpjLimpo)) e.cpf_cnpj = "CNPJ inválido";
    } else {
      e.cpf_cnpj = "CPF ou CNPJ inválido";
    }

    if (!form.email) e.email = getSignupRequiredFieldMessage("email");
    if (!form.whatsapp) e.whatsapp = getSignupRequiredFieldMessage("whatsapp");

    if (!form.senha) e.senha = getSignupRequiredFieldMessage("senha");
    if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (form.senha !== form.senha2) e.senha2 = "As senhas não coincidem";

    if (!form.termos || !termosAceite) e.termos = "Você deve aceitar os termos";

    return e;
  };

  // ----------------------------------------
  // Google Login (cadastro/entrada via OAuth)
  // - Cria profile com primeiro_login = true (usuário ainda completa cadastro depois).
  // - redirectTo baseado em env (VITE_FRONTEND_URL) para PROD/DEV.
  // ----------------------------------------
  const handleGoogleLogin = async () => {
    if (oauthInFlightRef.current || oauthLoading || loading) return;
    oauthInFlightRef.current = true;
    setOauthLoading(true);
    const redirectTo = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        console.error(error);
        setAlertData({
          title: "Não foi possível usar o Google",
          message: "Não foi possível conectar ao Google.\nPor favor, tente novamente.",
        });
        return;
      }

      setTimeout(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (existingProfile) return;

        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          primeiro_login: true,
          created_at: new Date(),
          last_login: new Date(),
        });
      }, 800);
    } finally {
      oauthInFlightRef.current = false;
      setOauthLoading(false);
    }
  };


  // ----------------------------------------
  // Enviar cadastro para Supabase
  // Fluxo: 1) Auth signUp  2) Profile upsert com primeiro_login = false
  // ----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (signupInFlightRef.current || loading || preConfirmSuccess) return;

    const allValidationErrors = validarCampos();
    if (Object.keys(allValidationErrors).length > 0) {
      const sequentialErrors = toSequentialSignupErrors(allValidationErrors);
      setErrors(sequentialErrors);
      const firstError = getFirstSignupValidationError(allValidationErrors);
      if (firstError) {
        addNotification({
          event_type: "SIGNUP_REQUIRED",
          entity_type: "signup",
          entity_id: null,
          title: "Campos obrigatórios",
          message: firstError.message,
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        if (firstError.field !== "termos") {
          showSignupFieldValidation(formRef.current, firstError.field, firstError.message);
        }
      }
      const btn = document.querySelector(".signup-btn");
      if (btn) {
        btn.classList.add("shake");
        setTimeout(() => btn.classList.remove("shake"), 500);
      }
      return;
    }

    signupInFlightRef.current = true;
    setLoading(true);
    const emailTrimmed = form.email.trim();
    /** @type {string | null} */
    let bindToken = null;

    try {
      if (import.meta.env.DEV) {
        console.log("SIGNUP START two-phase", { email: emailTrimmed, timestamp: Date.now() });
      }

      if (!termosAceite) {
        setErrors((prev) => ({ ...prev, termos: "Você deve aceitar os termos" }));
        return;
      }

      const pendingRes = await criarSignupPendingBirth(form, termosAceite);
      if (!pendingRes.ok) {
        const msg =
          pendingRes.error ||
          (pendingRes.status === 409
            ? "Este e-mail ou CNPJ já está cadastrado."
            : "Não foi possível iniciar o cadastro.");
        setAlertData({ title: "Não foi possível criar conta", message: msg });
        return;
      }

      bindToken = pendingRes.data?.bind_token ?? null;
      if (!bindToken) {
        setAlertData({
          title: "Erro ao criar conta",
          message: "Resposta inválida ao registrar cadastro. Tente novamente.",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailTrimmed,
        password: form.senha,
        options: {
          data: {
            signup_pending_pointer: pendingRes.data?.pending_id ?? null,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        await abortarSignupPendingBirth(bindToken, "AUTH_SIGNUP_FAILED");
        setAlertData(mapAuthSignupError(error));
        return;
      }

      const user = data?.user;
      if (!user?.id) {
        await abortarSignupPendingBirth(bindToken, "AUTH_SIGNUP_NO_USER");
        setAlertData({
          title: "Confirme seu e-mail",
          message:
            "Se este endereço estiver disponível, você receberá um e-mail com o link de confirmação.\n" +
            "Confira também a pasta de spam.",
        });
        return;
      }

      const bindRes = await vincularSignupPendingBirth(bindToken, user.id, emailTrimmed);
      if (!bindRes.ok) {
        setAlertData({
          title: "Conta criada parcialmente",
          message:
            "Sua conta foi criada, mas houve falha ao vincular os dados do cadastro.\n" +
            "Entre em contato com o suporte informando seu e-mail.",
        });
        return;
      }

      const session = data?.session;
      if (session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      setPreConfirmSuccess({
        emailMasked: pendingRes.data?.email_masked || emailTrimmed.replace(/(.{2}).+(@.+)/, "$1***$2"),
      });
    } catch (err) {
      console.error("Signup error:", err);
      if (bindToken) {
        await abortarSignupPendingBirth(bindToken, "UNEXPECTED_ERROR");
      }
      setAlertData({
        title: "Erro ao criar conta",
        message: "Ocorreu um erro inesperado. Tente novamente em alguns instantes.",
      });
    } finally {
      signupInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">

      <SignupMarketingColumn />

      {/* COLUNA DIREITA (FORMULÁRIO) — congelado / homologado */}
      <div className="signup-right">
        {preConfirmSuccess ? (
          <SignupCheckEmail
            emailMasked={preConfirmSuccess.emailMasked}
            onClose={() => navigate("/login")}
          />
        ) : (
          <>
        {/* Google Login */}
        <button
          type="button"
          className="google-btn"
          disabled={oauthLoading || loading}
          aria-busy={oauthLoading}
          onClick={handleGoogleLogin}
        >
          <img src={GoogleIcon} alt="Google" />
          <span>{oauthLoading ? "Abrindo Google…" : "Entrar com Google"}</span>
        </button>

        <div className="signup-divider" role="separator" aria-label="ou preencha seus dados abaixo">
          <span className="signup-divider__text">ou preencha seus dados abaixo</span>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="signup-form">

          {/* Linha 1: Razão social | Nome fantasia */}
          <div className="row">
            <div className="field">
              <label htmlFor="signup-nome">
                Razão social <ReqMark />
              </label>
              <input
                id="signup-nome"
                name="nome"
                type="text"
                className={errors.nome ? "error" : ""}
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                autoComplete="organization"
              />
            </div>

            <div className="field">
              <label htmlFor="signup-nome-loja">
                Nome fantasia <ReqMark />
              </label>
              <input
                id="signup-nome-loja"
                name="nome_loja"
                type="text"
                className={errors.nome_loja ? "error" : ""}
                value={form.nome_loja}
                onChange={(e) => update("nome_loja", e.target.value)}
              />
            </div>
          </div>

          {/* Linha 2: CPF/CNPJ | E-mail */}
          <div className="row">
            <div className="field">
              <label htmlFor="signup-cpf-cnpj">
                CPF/CNPJ <ReqMark />
              </label>
              <input
                id="signup-cpf-cnpj"
                name="cpf_cnpj"
                type="text"
                className={errors.cpf_cnpj ? "error" : ""}
                value={form.cpf_cnpj}
                onChange={(e) => update("cpf_cnpj", e.target.value)}
                maxLength={18}
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="signup-email">
                E-mail <ReqMark />
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className={errors.email ? "error" : ""}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Linha 3: WhatsApp | Telefone */}
          <div className="row">
            <div className="field">
              <label htmlFor="signup-whatsapp">
                WhatsApp <ReqMark />
              </label>
              <input
                id="signup-whatsapp"
                name="whatsapp"
                type="tel"
                className={errors.whatsapp ? "error" : ""}
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                maxLength={15}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="field">
              <label htmlFor="signup-telefone">Telefone</label>
              <input
                id="signup-telefone"
                name="telefone"
                type="tel"
                value={form.telefone}
                onChange={(e) => update("telefone", e.target.value)}
                maxLength={14}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Senha / Confirmar senha */}
          <div className="row">
            <div className="field">
              <label htmlFor="signup-senha">
                Senha <ReqMark />
              </label>
              <div className="password-wrapper">
                <input
                  id="signup-senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  className={errors.senha ? "error" : ""}
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  autoComplete="new-password"
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

            <div className="field">
              <label htmlFor="signup-senha2">
                Confirmar senha <ReqMark />
              </label>
              <div className="password-wrapper">
                <input
                  id="signup-senha2"
                  name="senha2"
                  type={showPassword2 ? "text" : "password"}
                  className={errors.senha2 ? "error" : ""}
                  value={form.senha2}
                  onChange={(e) => update("senha2", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword2(!showPassword2)}
                  aria-label={showPassword2 ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                >
                  {showPassword2 ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Termos + CTA empilhados */}
          <div className="signup-form-footer">
            <div className={`termos-box${errors.termos ? " termos-box--invalid" : ""}`}>
              <input
                id="signup-termos"
                name="termos"
                type="checkbox"
                checked={form.termos}
                onClick={(event) => {
                  if (!form.termos) {
                    event.preventDefault();
                    setTermosModalOpen(true);
                  }
                }}
                onChange={(event) => {
                  if (!event.target.checked) {
                    setTermosAceite(null);
                    setForm((prev) => ({ ...prev, termos: false }));
                    setErrors((prev) => ({ ...prev, termos: "" }));
                  }
                }}
              />
              <label htmlFor="signup-termos">
                Li e aceito os{" "}
                <button
                  type="button"
                  className="signup-termos-link"
                  onClick={(event) => {
                    event.preventDefault();
                    setTermosModalOpen(true);
                  }}
                >
                  Termos de Uso
                </button>{" "}
                <ReqMark />
              </label>
            </div>
            {errors.termos ? <p className="err err--termos">{errors.termos}</p> : null}
            <button
              type="submit"
              className="signup-btn signup-btn--stacked"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? "Criando conta, aguarde" : "Criar conta"}
            >
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </div>

        </form>
          </>
        )}
      </div>

{alertData && (
  <Suse7Alert
    title={alertData.title}
    message={alertData.message}
    onClose={() => setAlertData(null)}
  />
)}

      <TermsAcceptanceModal
        open={termosModalOpen}
        onClose={() => setTermosModalOpen(false)}
        onAccepted={(registro) => {
          setTermosAceite(registro);
          setForm((prev) => ({ ...prev, termos: true }));
          setErrors((prev) => ({ ...prev, termos: "" }));
          setTermosModalOpen(false);
        }}
      />


    </div>
  );
}
