// src/pages/Terms.jsx

// -------------------------------------------------------------
// IMPORTS
// -------------------------------------------------------------
import { Link } from "react-router-dom";               // Links para login / signup
import SuseLogo from "../assets/suse7-logo-redonda.png"; // Logo Suse7
import { useState } from "react";                      // Hook para estado
import ContactModal from "../components/ContactModal";  // Modal de contato


// -------------------------------------------------------------
// COMPONENTE PRINCIPAL — TERMOS DE USO
// -------------------------------------------------------------
export default function Terms() {
  // Controle do modal "Fale conosco"
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="terms-wrapper">
      
      {/* ---------------------------------------------------------
         NAVBAR PÚBLICA — Criada dentro da página de Termos
         --------------------------------------------------------- */}
      <header className="terms-navbar">
  
  <div className="terms-navbar-inner">

    {/* ESQUERDA — LOGO */}
    <div className="terms-navbar-left">
  <Link to="/login">
    <img src={SuseLogo} alt="Suse7" className="terms-navbar-logo" />
  </Link>
</div>

    {/* DIREITA — LINKS */}
    <nav className="terms-navbar-right">
      <span 
        className="terms-navbar-link"
        onClick={() => setShowContactModal(true)}
      >
        Contato
      </span>

      <Link to="/login" className="terms-navbar-link">
        Login
      </Link>

      <Link to="/signup" className="terms-navbar-btn">
        Teste grátis
      </Link>
    </nav>

  </div>
</header>


      {/* ---------------------------------------------------------
         CONTEÚDO PRINCIPAL DOS TERMOS
         --------------------------------------------------------- */}
      <main className="terms-container">
        <div className="terms-box">

          <h1 className="terms-title">
            Termos e Condições <span className="highlight">Suse7 Precifica</span>
          </h1>

          <p className="terms-update">Última atualização: 27/11/2025</p>

          {/* INTRO */}
          <section className="terms-section">
            <p>
              Este instrumento contempla os Termos e Condições de Uso da plataforma de gestão e precificação
              empresarial <strong>Suse7 Precifica</strong>.
            </p>

            <p>
              Antes de realizar o acesso e iniciar a utilização da Plataforma, certifique-se de que compreendeu todas
              as condições estabelecidas. Ao utilizá-la, o Usuário aceita integralmente todas as regras aqui dispostas.
            </p>

            <p>
              Em caso de dúvidas, entre em contato conosco através do e-mail:
              <strong> contato@suse7.com.br</strong>.
            </p>

            <p>
              A utilização contínua da Plataforma representa a aceitação plena e irrestrita destes Termos,
              incluindo futuras atualizações.
            </p>
          </section>

          {/* --- SEÇÕES --- */}
          <h2 className="terms-subtitle">1. Definições</h2>
          <p>1.1. Para fins deste Termo, aplicam-se as seguintes definições:</p>

          <ul className="terms-list">
            <li><strong>Suse7 Precifica:</strong> plataforma digital dedicada à precificação e análises financeiras.</li>
            <li><strong>Usuário:</strong> pessoa física ou jurídica cadastrada.</li>
            <li><strong>Plano de Assinatura:</strong> modalidade contratada para acessar as funcionalidades.</li>
            <li><strong>Plataforma:</strong> sistema web do Suse7.</li>
            <li><strong>Política de Privacidade:</strong> regras sobre proteção de dados pessoais.</li>
            <li><strong>Conta:</strong> acesso individual protegido por e-mail e senha.</li>
          </ul>

          <h2 className="terms-subtitle">2. Objeto</h2>
          <p>Este Termo regula as condições de uso da plataforma Suse7.</p>

          <h2 className="terms-subtitle">3. Cadastro de Usuários</h2>
          <p>O Usuário declara que todas as informações fornecidas são verdadeiras e atualizadas.</p>
          <p>O compartilhamento de senhas é proibido.</p>

          <h2 className="terms-subtitle">4. Uso da Plataforma</h2>
          <p>O uso deve ser ético, legal e respeitando o plano contratado.</p>

          <h2 className="terms-subtitle">5. Assinaturas e Pagamentos</h2>
          <p>O uso completo depende de assinatura ativa. O não pagamento bloqueia a conta.</p>

          <h2 className="terms-subtitle">6. Responsabilidades</h2>
          <p>O Suse7 oferece estabilidade e atualizações, mas não garante disponibilidade ininterrupta.</p>

          <h2 className="terms-subtitle">7. Propriedade Intelectual</h2>
          <p>Todo o conteúdo da plataforma é protegido por direitos autorais.</p>

          <h2 className="terms-subtitle">8. Cancelamento</h2>
          <p>O Usuário pode cancelar a assinatura a qualquer momento.</p>

          <h2 className="terms-subtitle">9. Alterações nos Termos</h2>
          <p>Os Termos poderão ser atualizados a qualquer momento.</p>

          <h2 className="terms-subtitle">10. Contato</h2>
          <p>
            📧 <strong>contato@suse7.com.br</strong><br />
            🌐 suse7.com.br
          </p>

          <p className="terms-footer">
            Suse7 Precifica — Tecnologia criada para impulsionar seus resultados.
          </p>

        </div>
      </main>


      {/* ---------------------------------------------------------
         ESTILOS ESPECÍFICOS DA PÁGINA DE TERMOS
         (mantivemos o padrão de usar <style> aqui dentro)
         --------------------------------------------------------- */}
      <style>{`
        body {
          overflow-x: hidden;
          overflow-y: auto !important;
          background: #f1f3f7;
        }

        .terms-wrapper {
          width: 100%;
          min-height: 100vh;
        }

/* -------------------------------------------------------------
   NAVBAR DO TERMS — VERSÃO AJUSTADA E ALINHADA
   ------------------------------------------------------------- */
.terms-navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: #ffffffee;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  z-index: 9999;

  display: flex;                 /* 🔥 ativa flexbox */
  justify-content: center;       /* 🔥 centraliza horizontalmente */
  align-items: center;           /* 🔥 centraliza verticalmente */
}


/* -------------------------------------------------------------
   CONTAINER INTERNO DO NAVBAR — centraliza e limita largura
------------------------------------------------------------- */
.terms-navbar-inner {
  width: 100%;
  max-width: 1160px;     /* 🔥 Mesma largura do seu conteúdo */
  margin: 0 auto;        /* 🔥 Centraliza tudo */
  padding: 0 24px;

  display: flex;
  justify-content: space-between;
  align-items: center;
}


/* LOGO */
.terms-navbar-left {
  display: flex;
  align-items: center;
}

.terms-navbar-logo {
  height: 42px;                    /* Logo um pouco maior */
  cursor: pointer;
}

/* LINKS */
.terms-navbar-right {
   display: flex;
  align-items: center;
  gap: 35px;
  margin-right: -110px;   /* 🔥 Empurra os links mais pra direita */
}

.terms-navbar-link {
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: 0.2s;
}

.terms-navbar-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* BOTÃO TESTE GRÁTIS */
.terms-navbar-btn {
  background: #2563eb;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: 0.2s;
}

.terms-navbar-btn:hover {
  background: #1e4ec9;
}

        /* -------------------------------------------------------------
           CONTEÚDO — empurra para baixo por causa do header fixo
           ------------------------------------------------------------- */
        .terms-container {
          display: flex;
          justify-content: center;
          padding: 110px 20px 40px;  /* 110px para não ficar atrás da navbar */
        }

        .terms-box {
          background: #fff;
          max-width: 950px;
          width: 100%;
          padding: 45px;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.08);
        }

        .terms-title {
          text-align: center;
          font-size: 38px;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .highlight {
          color: #0057ff;
        }

        .terms-update {
          text-align: center;
          color: #666;
          margin-bottom: 35px;
        }

        .terms-subtitle {
          margin-top: 30px;
          font-size: 24px;
          font-weight: 600;
        }

        .terms-list {
          padding-left: 22px;
          line-height: 1.6;
        }

        .terms-footer {
          margin-top: 45px;
          text-align: center;
          color: #555;
          font-style: italic;
        }
      `}</style>

      {/* ---------------------------------------------------------
         MODAL DE CONTATO
         --------------------------------------------------------- */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </div>
  );
}
