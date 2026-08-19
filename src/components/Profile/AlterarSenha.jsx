// ======================================================================
// PERFIL — ALTERAR SENHA
// Objetivo: Permitir que o usuário altere sua senha com segurança
// ======================================================================

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./AlterarSenha.css";
import FeedbackModal from "../FeedbackModal/FeedbackModal";
import S7PasswordVisibilityToggle from "../ui/S7PasswordVisibilityToggle";
import alterarSenhaIllustration from "../../assets/profile/alterar-senha-illustration.png";

function CampoSenha({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
}) {
  return (
    <div className="s7-alterar-senha-field">
      <label htmlFor={id}>{label} *</label>
      <div className="password-wrapper">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        <S7PasswordVisibilityToggle
          visible={visible}
          onToggle={onToggleVisible}
          ariaLabelShow={`Mostrar ${label.toLowerCase()}`}
          ariaLabelHide={`Ocultar ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

export default function AlterarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    title: "",
    message: "",
  });

  const openFeedback = ({ type, title, message }) => {
    setFeedback({ type, title, message });
    setShowFeedback(true);
  };

  const closeFeedback = () => {
    setShowFeedback(false);
    setFeedback({
      type: "",
      title: "",
      message: "",
    });
  };

  const handleChangePassword = async () => {
    try {
      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        openFeedback({
          type: "error",
          title: "Campos obrigatórios",
          message: "Preencha todos os campos para alterar sua senha.",
        });
        return;
      }

      if (novaSenha.length < 6) {
        openFeedback({
          type: "error",
          title: "Senha inválida",
          message: "A nova senha deve ter no mínimo 6 caracteres.",
        });
        return;
      }

      if (novaSenha !== confirmarSenha) {
        openFeedback({
          type: "error",
          title: "Senhas não conferem",
          message: "A confirmação da senha está diferente da nova senha.",
        });
        return;
      }

      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        openFeedback({
          type: "error",
          title: "Erro de sessão",
          message: "Não foi possível identificar seu usuário. Faça login novamente.",
        });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });

      if (signInError) {
        openFeedback({
          type: "error",
          title: "Senha incorreta",
          message: "A senha atual informada está incorreta.",
        });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        openFeedback({
          type: "error",
          title: "Erro ao atualizar",
          message: "Não foi possível atualizar sua senha. Tente novamente.",
        });
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      openFeedback({
        type: "success",
        title: "Senha atualizada",
        message: "Sua senha foi alterada com sucesso.",
      });
    } catch {
      openFeedback({
        type: "error",
        title: "Erro inesperado",
        message: "Ocorreu um erro ao alterar sua senha. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alterar-senha-page">
      <div className="profile-card s7-alterar-senha-hero">
        <div className="s7-alterar-senha-body">
          <aside className="s7-alterar-senha-body__illustration" aria-hidden="true">
            <img
              className="s7-alterar-senha-illustration"
              src={alterarSenhaIllustration}
              alt=""
              decoding="async"
            />
          </aside>

          <div className="s7-alterar-senha-body__form">
            <div className="s7-alterar-senha-frame">
              <header className="s7-alterar-senha-header">
                <h2 className="s7-alterar-senha-header__title">Alterar Senha</h2>
                <p className="s7-alterar-senha-header__subtitle">
                  Atualize sua senha de acesso com segurança.
                </p>
                <span className="s7-alterar-senha-header__required">* Campos obrigatórios</span>
              </header>

              <div className="s7-alterar-senha-form">
                <CampoSenha
                  id="senha-atual"
                  label="Senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  visible={showSenhaAtual}
                  onToggleVisible={() => setShowSenhaAtual((prev) => !prev)}
                  autoComplete="current-password"
                />

                <CampoSenha
                  id="nova-senha"
                  label="Nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  visible={showNovaSenha}
                  onToggleVisible={() => setShowNovaSenha((prev) => !prev)}
                  autoComplete="new-password"
                />

                <CampoSenha
                  id="confirmar-senha"
                  label="Confirmar nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  visible={showConfirmarSenha}
                  onToggleVisible={() => setShowConfirmarSenha((prev) => !prev)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="button"
                className="btn-primary s7-alterar-senha-submit"
                onClick={handleChangePassword}
                disabled={loading}
              >
                {loading ? "Atualizando..." : "Salvar nova senha"}
              </button>
            </div>
          </div>
        </div>

        {showFeedback && (
          <FeedbackModal
            show={showFeedback}
            onClose={closeFeedback}
            type={feedback.type}
            title={feedback.title}
            message={feedback.message}
          />
        )}
      </div>
    </div>
  );
}
