import { useState } from "react";
import { Radio } from "lucide-react";
import { COMUNICACAO_SECOES, COMUNICACAO_SECAO_PADRAO } from "./comunicacaoModel";
import "./comunicacao.css";

// ======================================================
// COMUNICAÇÃO — PAINEL (S5.8)
// ------------------------------------------------------
// Estrutura inicial read-only do Motor Central de Comunicação.
// Sem CRUD / edição / telas completas nesta fase.
// ======================================================

function SecaoCanal({ secao }) {
  const Icon = secao.icon;
  return (
    <div className="s7-com__content" role="tabpanel" aria-label={secao.label}>
      <span className="s7-com__content-icon" aria-hidden>
        <Icon size={22} />
      </span>
      <h3>{secao.label}</h3>
      <p>{secao.descricao}</p>
      <p>
        Canal reconhecido oficialmente pelo Motor Central ({secao.motorPhase}). Código canônico:{" "}
        <code>{secao.channelCode}</code>. Administração operacional (políticas, templates, histórico)
        será habilitada em fases futuras.
      </p>
      {secao.futuro?.length > 0 ? (
        <ul className="s7-com__futuro">
          {secao.futuro.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <span className="s7-com__reserved">Canal oficial {secao.motorPhase} — CRUD em breve</span>
    </div>
  );
}

export default function ComunicacaoPanel() {
  const [secaoAtiva, setSecaoAtiva] = useState(COMUNICACAO_SECAO_PADRAO);
  const secao = COMUNICACAO_SECOES.find((s) => s.id === secaoAtiva) ?? COMUNICACAO_SECOES[0];

  return (
    <section className="s7-com">
      <header className="s7-com__header">
        <h2 className="s7-com__title">
          <Radio size={18} aria-hidden /> Comunicação
        </h2>
        <p className="s7-com__subtitle">
          Governança do Motor Central de Comunicação do Suse7 — canais oficiais, integração com
          Dispatcher, Registro de Canais e Central de Templates. Estrutura preparada para
          administração completa nas próximas fases.
        </p>
        <span className="s7-com__badge">S5.8 — Módulo Comunicação (somente leitura)</span>
      </header>

      <div className="s7-com__layout">
        <nav className="s7-com__nav" role="tablist" aria-label="Canais do Motor Central">
          {COMUNICACAO_SECOES.map((item) => {
            const Icon = item.icon;
            const ativa = item.id === secaoAtiva;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                className={`s7-com__nav-btn ${ativa ? "s7-com__nav-btn--active" : ""}`}
                onClick={() => setSecaoAtiva(item.id)}
              >
                <Icon size={16} aria-hidden /> {item.label}
                {item.canalOficial ? <span className="s7-com__nav-tag">oficial</span> : null}
              </button>
            );
          })}
        </nav>

        <SecaoCanal secao={secao} />
      </div>
    </section>
  );
}
