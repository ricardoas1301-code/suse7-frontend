import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import {
  CENTRAL_TEMPLATES_SECOES,
  CENTRAL_TEMPLATES_SECAO_PADRAO,
} from "./centralTemplatesModel";
import "./centralTemplates.css";

// ======================================================
// CENTRAL DE TEMPLATES — PAINEL (S5.4)
// ------------------------------------------------------
// Estrutura inicial read-only. Integra com o Motor Central de Comunicação.
// Sem CRUD / edição / criação nesta fase — apenas navegação e espaço
// reservado para os modelos de cada canal.
// ======================================================

function SecaoReservada({ secao }) {
  const Icon = secao.icon;
  const ehPopupOficial = secao.id === "popup" && secao.canalOficial === true;
  return (
    <div className="s7-tpl__content" role="tabpanel" aria-label={secao.label}>
      <span className="s7-tpl__content-icon" aria-hidden>
        <Icon size={22} />
      </span>
      <h3>{secao.label}</h3>
      <p>{secao.descricao}</p>
      {ehPopupOficial ? (
        <p>
          Canal reconhecido oficialmente pelo Motor Central ({secao.motorPhase}). Estrutura preparada
          para templates de Pop-up, preview visual e versionamento — sem cadastro nesta fase.
        </p>
      ) : (
        <p>
          Espaço reservado da Central de Templates. O cadastro, versionamento e preview dos modelos
          deste canal serão habilitados em uma próxima fase.
        </p>
      )}
      <span className="s7-tpl__reserved">
        {ehPopupOficial ? `Canal oficial ${secao.motorPhase} — CRUD em breve` : "Reservado para futuras fases"}
      </span>
    </div>
  );
}

export default function CentralTemplatesPanel() {
  const [secaoAtiva, setSecaoAtiva] = useState(CENTRAL_TEMPLATES_SECAO_PADRAO);
  const secao =
    CENTRAL_TEMPLATES_SECOES.find((s) => s.id === secaoAtiva) ?? CENTRAL_TEMPLATES_SECOES[0];

  return (
    <section className="s7-tpl">
      <header className="s7-tpl__header">
        <h2 className="s7-tpl__title">
          <LayoutTemplate size={18} aria-hidden /> Central de Templates
        </h2>
        <p className="s7-tpl__subtitle">
          Fonte única de verdade dos modelos de comunicação do Suse7, integrada ao Motor Central de
          Comunicação. Estrutura preparada para receber os templates de cada canal nas próximas
          fases.
        </p>
        <span className="s7-tpl__badge">S5.4 — Estrutura inicial (somente leitura)</span>
      </header>

      <div className="s7-tpl__layout">
        <nav className="s7-tpl__nav" role="tablist" aria-label="Canais da Central de Templates">
          {CENTRAL_TEMPLATES_SECOES.map((item) => {
            const Icon = item.icon;
            const ativa = item.id === secaoAtiva;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                className={`s7-tpl__nav-btn ${ativa ? "s7-tpl__nav-btn--active" : ""}`}
                onClick={() => setSecaoAtiva(item.id)}
              >
                <Icon size={16} aria-hidden /> {item.label}
                {!item.enabled ? (
                  <span className="s7-tpl__nav-soon">
                    {item.canalOficial ? "oficial" : "em breve"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <SecaoReservada secao={secao} />
      </div>
    </section>
  );
}
