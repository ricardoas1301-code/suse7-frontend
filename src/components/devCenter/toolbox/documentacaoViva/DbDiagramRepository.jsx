import { useMemo, useState } from "react";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import {
  DB_DIAGRAM_CATEGORIAS,
  listarBlocosDbDiagram,
  metaStatusDbDiagram,
} from "./dbDiagramRepositoryModel";

const FILTRO_TODOS = "__todos__";

// Repositório de blocos do dbdiagram.io (comandos, notas, trechos).
// Filtro por categoria. Local/mock nesta fase.

export default function DbDiagramRepository() {
  const blocos = useMemo(() => listarBlocosDbDiagram(), []);
  const [categoriaAtiva, setCategoriaAtiva] = useState(FILTRO_TODOS);

  const blocosFiltrados = useMemo(() => {
    if (categoriaAtiva === FILTRO_TODOS) return blocos;
    return blocos.filter((bloco) => bloco.category === categoriaAtiva);
  }, [blocos, categoriaAtiva]);

  return (
    <div className="s7-docviva">
      <div className="s7-docviva__intro">
        <h3>DB Diagram Repository</h3>
        <p>
          Comandos, blocos, notas e trechos usados no dbdiagram.io. Centraliza o esquema vivo do
          banco do Suse7 — preparado para persistência futura no Supabase.
        </p>
      </div>

      <div className="s7-dbdiagram__toolbar" role="tablist" aria-label="Categorias do repositório">
        <button
          type="button"
          className={`s7-dbdiagram__filter ${
            categoriaAtiva === FILTRO_TODOS ? "s7-dbdiagram__filter--active" : ""
          }`}
          onClick={() => setCategoriaAtiva(FILTRO_TODOS)}
        >
          Todos
        </button>
        {DB_DIAGRAM_CATEGORIAS.map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={`s7-dbdiagram__filter ${
              categoriaAtiva === categoria ? "s7-dbdiagram__filter--active" : ""
            }`}
            onClick={() => setCategoriaAtiva(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>

      {blocosFiltrados.length === 0 ? (
        <div className="s7-docviva-empty">Nenhum bloco nesta categoria ainda.</div>
      ) : (
        <div className="s7-dbdiagram__grid">
          {blocosFiltrados.map((bloco) => {
            const status = metaStatusDbDiagram(bloco.status);
            return (
              <article key={bloco.entry_id} className="s7-dbdiagram-card">
                <div className="s7-dbdiagram-card__head">
                  <div>
                    <h4 className="s7-dbdiagram-card__title">{bloco.title}</h4>
                    <span className="s7-dbdiagram-card__category">{bloco.category}</span>
                  </div>
                  <DocVivaStatusBadge label={status.label} tone={status.tone} />
                </div>

                <pre className="s7-dbdiagram-card__code">{bloco.content}</pre>

                {bloco.notes ? <p className="s7-dbdiagram-card__notes">{bloco.notes}</p> : null}

                <div className="s7-dbdiagram-card__foot">
                  <span>Última atualização: {bloco.updated_at}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
