// src/pages/Privacidade.jsx

// -------------------------------------------------------------
// IMPORTS
// -------------------------------------------------------------
import { Link } from "react-router-dom";
import SuseLogo from "../assets/suse7-logo-redonda.png";
import { useState } from "react";
import ContactModal from "../components/ContactModal";

// -------------------------------------------------------------
// COMPONENTE — PRIVACIDADE E SEGURANÇA (LGPD)
// -------------------------------------------------------------
export default function Privacidade() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="privacy-wrapper">

      {/* ---------------------------------------------------------
        NAVBAR PÚBLICA — Igual à página de Termos
      --------------------------------------------------------- */}
      <header className="terms-navbar">
        <div className="terms-navbar-inner">

          <div className="terms-navbar-left">
            <Link to="/login">
              <img src={SuseLogo} className="terms-navbar-logo" />
            </Link>
          </div>

          <nav className="terms-navbar-right">
            <span className="terms-navbar-link" onClick={() => setShowContactModal(true)}>Contato</span>
            <Link to="/login" className="terms-navbar-link">Login</Link>
            <Link to="/signup" className="terms-navbar-btn">Teste grátis</Link>
          </nav>

        </div>
      </header>


      {/* ---------------------------------------------------------
        CONTEÚDO PRINCIPAL
      --------------------------------------------------------- */}
      <main className="privacy-container">
        <div className="privacy-box">

          <h1 className="privacy-title">Segurança e Privacidade</h1>
          <p className="privacy-update">Última atualização: 27/11/2025</p>

          {/* Introdução */}
          <section className="privacy-section">
            <p>
              A proteção dos seus dados é uma prioridade absoluta para o
              <strong> Suse7 Precifica</strong>. Este documento apresenta de forma
              clara e objetiva como tratamos as informações, seguindo as melhores
              práticas de mercado e atendendo integralmente à
              <strong> Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
            </p>

            <p>
              Nosso objetivo é garantir que todo Usuário tenha transparência,
              segurança e controle sobre suas informações.
            </p>
          </section>

          <h2 className="privacy-subtitle">1. Princípios da LGPD que seguimos</h2>
          <ul className="privacy-list">
            <li><strong>Finalidade:</strong> tratamos dados apenas para objetivos legítimos.</li>
            <li><strong>Necessidade:</strong> coletamos somente o que é essencial.</li>
            <li><strong>Transparência:</strong> sempre mostramos como usamos os dados.</li>
            <li><strong>Segurança:</strong> aplicamos tecnologias avançadas de proteção.</li>
            <li><strong>Prevenção:</strong> monitoramento constante e auditorias.</li>
          </ul>

          <h2 className="privacy-subtitle">2. Dados que Coletamos</h2>
          <p>Coletamos somente o necessário para operação da plataforma:</p>
          <ul className="privacy-list">
            <li>Nome completo;</li>
            <li>E-mail e senha criptografada;</li>
            <li>Informações de assinatura;</li>
            <li>Registros de acesso (logs);</li>
            <li>Preferências e configurações do usuário.</li>
          </ul>

          <h2 className="privacy-subtitle">3. Como Protegemos Seus Dados</h2>
          <ul className="privacy-list">
            <li>Criptografia de senhas (bcrypt/argon2);</li>
            <li>Firewall e proteção contra ataques;</li>
            <li>Sistemas de detecção e monitoramento;</li>
            <li>Servidores isolados e seguros;</li>
            <li>Backups automáticos e redundantes.</li>
          </ul>

          <h2 className="privacy-subtitle">4. Compartilhamento de Dados</h2>
          <p>Somente compartilhamos quando necessário:</p>
          <ul className="privacy-list">
            <li>Processadores de pagamento (cobranças);</li>
            <li>Serviços de auditoria e segurança;</li>
            <li>Autoridades legais, quando exigido.</li>
          </ul>

          <h2 className="privacy-subtitle">5. Direitos do Usuário</h2>
          <p>Você pode solicitar a qualquer momento:</p>
          <ul className="privacy-list">
            <li>Consulta e acesso aos dados;</li>
            <li>Correções;</li>
            <li>Exclusão (direito ao esquecimento);</li>
            <li>Revogação de consentimento;</li>
            <li>Portabilidade.</li>
          </ul>

          <h2 className="privacy-subtitle">6. Canal Oficial de Privacidade</h2>
          <p>
            📩 <strong>privacidade@suse7.com.br</strong><br />
          </p>

          <p className="privacy-footer">
            O Suse7 está comprometido com a segurança, transparência e integridade dos dados.
          </p>

        </div>
      </main>

      {/* ---------------------------------------------------------
        ESTILOS — Agora com a navbar limpa e corrigida
      --------------------------------------------------------- */}
      <style>{`
        body {
          overflow-x: hidden;
          background: #f1f3f7;
        }

        .privacy-container {
          display: flex;
          justify-content: center;
          padding: 110px 20px 40px;
        }

        .privacy-box {
          background: #fff;
          max-width: 950px;
          padding: 45px;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.08);
        }

        .privacy-title {
          text-align: center;
          font-size: 38px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .privacy-update {
          text-align: center;
          color: #666;
          margin-bottom: 35px;
        }

        .privacy-subtitle {
          margin-top: 35px;
          font-size: 24px;
          font-weight: 600;
        }

        .privacy-list {
          padding-left: 22px;
          line-height: 1.6;
        }

        .privacy-footer {
          margin-top: 45px;
          text-align: center;
          color: #555;
          font-style: italic;
        }

        /* ----------------------------------------------
          NAVBAR — CORREÇÃO E LIMPEZA DOS ESTILOS
        ---------------------------------------------- */
        .terms-navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          /* Altura ajustada */
          height: 70px; 
          background: #ffffffee;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb;
          z-index: 9999;
        }

        /* CONTAINER CENTRAL DA NAVBAR (FLUIDO E ALINHADO) */
        .terms-navbar-inner {
          width: 100%;
          /* Centralização horizontal */
          max-width: 1360px; 
          margin: 0 auto;
          /* Preenchimento horizontal */
          padding: 0 40px; 
          /* Alinhamento dos elementos internos */
          display: flex;
          justify-content: space-between; /* Logo esquerda / links direita */
          align-items: center; /* Centralização vertical perfeita */
          /* Garante que o conteúdo ocupe a altura total da navbar */
          height: 100%; 
        }

        /* Logo */
        .terms-navbar-left {
          display: flex;
          align-items: center;
        }

        .terms-navbar-logo {
          height: 42px;
          cursor: pointer;
        }

        /* Itens do lado direito */
        .terms-navbar-right {
          display: flex;
          align-items: center;
          /* Espaço entre os links */
          gap: 35px; 
        }

        .terms-navbar-link {
          cursor: pointer;
          font-size: 16px;
          color: #333;
          transition: 0.2s;
        }

        .terms-navbar-link:hover {
          color: #2563eb;
        }

        /* Botão Teste grátis */
        .terms-navbar-btn {
          background: #2563eb;
          color: #fff;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          transition: 0.2s;
        }

        .terms-navbar-btn:hover {
          background: #1e4ec9;
        }
      `}</style>

      {/* MODAL DE CONTATO */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}

    </div>
  );
}