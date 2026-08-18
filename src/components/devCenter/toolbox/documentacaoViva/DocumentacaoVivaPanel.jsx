import { useMemo, useState } from "react";
import { BookOpen, Database } from "lucide-react";
import DomainCard from "./DomainCard";
import DomainDetail from "./DomainDetail";
import DomainCreateForm from "./DomainCreateForm";
import DbDiagramRepository from "./DbDiagramRepository";
import DocVivaDashboard from "./DocVivaDashboard";
import DocVivaToolbar from "./DocVivaToolbar";
import { aplicarBuscaEFiltros } from "./documentacaoVivaSelectors";
import { DocumentacaoVivaProvider } from "./documentacaoVivaStore";
import { useDocumentacaoVivaStore } from "./documentacaoVivaContext";
import "./documentacaoViva.css";

const CRITERIOS_INICIAIS = { termo: "", status: "", maturity: "", owner: "" };

// Painel da aba "Documentação Viva".
// Dois módulos: Source Of Truth Center (cards de domínio + detalhe + edição)
// e DB Diagram Repository. Navegação interna por estado local.

const MODULO = Object.freeze({
  SOURCE_OF_TRUTH: "source_of_truth",
  DB_DIAGRAM: "db_diagram",
});

function DocumentacaoVivaConteudo() {
  const { domains, adicionarDominio, fonte, carregando } = useDocumentacaoVivaStore();
  const [moduloAtivo, setModuloAtivo] = useState(MODULO.SOURCE_OF_TRUTH);
  const [slugSelecionado, setSlugSelecionado] = useState(null);
  const [criterios, setCriterios] = useState(CRITERIOS_INICIAIS);

  const dominioSelecionado = useMemo(
    () => domains.find((dominio) => dominio.domain_slug === slugSelecionado) ?? null,
    [domains, slugSelecionado],
  );

  const dominiosVisiveis = useMemo(
    () => aplicarBuscaEFiltros(domains, criterios),
    [domains, criterios],
  );

  const aoCriarDominio = (dominio) => {
    adicionarDominio(dominio);
    setSlugSelecionado(dominio.domain_slug);
  };

  const alterarCriterios = (patch) => setCriterios((atuais) => ({ ...atuais, ...patch }));
  const limparCriterios = () => setCriterios(CRITERIOS_INICIAIS);

  return (
    <div className="s7-docviva">
      <div className="s7-docviva__subnav" role="tablist" aria-label="Módulos da Documentação Viva">
        <button
          type="button"
          role="tab"
          aria-selected={moduloAtivo === MODULO.SOURCE_OF_TRUTH}
          className={`s7-docviva__subnav-btn ${
            moduloAtivo === MODULO.SOURCE_OF_TRUTH ? "s7-docviva__subnav-btn--active" : ""
          }`}
          onClick={() => setModuloAtivo(MODULO.SOURCE_OF_TRUTH)}
        >
          <BookOpen size={16} aria-hidden /> Source Of Truth Center
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={moduloAtivo === MODULO.DB_DIAGRAM}
          className={`s7-docviva__subnav-btn ${
            moduloAtivo === MODULO.DB_DIAGRAM ? "s7-docviva__subnav-btn--active" : ""
          }`}
          onClick={() => setModuloAtivo(MODULO.DB_DIAGRAM)}
        >
          <Database size={16} aria-hidden /> DB Diagram Repository
        </button>
      </div>

      {moduloAtivo === MODULO.DB_DIAGRAM ? (
        <DbDiagramRepository />
      ) : dominioSelecionado ? (
        <DomainDetail domain={dominioSelecionado} onBack={() => setSlugSelecionado(null)} />
      ) : (
        <>
          <div className="s7-docviva__intro">
            <div className="s7-docviva__intro-head">
              <div>
                <h3>
                  Source Of Truth Center
                  <span
                    className={`s7-docviva__fonte s7-docviva__fonte--${fonte}`}
                    title={
                      fonte === "remote"
                        ? "Dados carregados do backend (Supabase)"
                        : "Dados locais (fallback). Backend indisponível ou sem dados."
                    }
                  >
                    {carregando ? "sincronizando…" : fonte === "remote" ? "Supabase" : "local"}
                  </span>
                </h3>
                <p>
                  Documentação viva dos domínios do Suse7. Cada card representa uma página/domínio
                  com sua fonte oficial de dados, regras e governança. Edite, evolua o status e
                  salve.
                </p>
              </div>
              <DomainCreateForm onCreate={aoCriarDominio} />
            </div>
          </div>

          <DocVivaDashboard domains={domains} />

          <DocVivaToolbar
            criterios={criterios}
            onChange={alterarCriterios}
            onLimpar={limparCriterios}
          />

          {dominiosVisiveis.length === 0 ? (
            <div className="s7-docviva-empty">
              Nenhum domínio encontrado para a busca/filtros atuais.
            </div>
          ) : (
            <div className="s7-docviva__grid">
              {dominiosVisiveis.map((dominio) => (
                <DomainCard key={dominio.domain_id} domain={dominio} onOpen={setSlugSelecionado} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DocumentacaoVivaPanel() {
  return (
    <DocumentacaoVivaProvider>
      <DocumentacaoVivaConteudo />
    </DocumentacaoVivaProvider>
  );
}
