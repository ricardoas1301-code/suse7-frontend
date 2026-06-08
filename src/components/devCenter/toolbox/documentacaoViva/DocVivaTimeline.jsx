import {
  FilePlus,
  Pencil,
  User,
  GitBranch,
  CheckCircle2,
  RotateCcw,
  ListChecks,
  History,
} from "lucide-react";
import { DOC_OPERACAO, metaOperacao, formatarDataHora } from "./documentacaoVivaHistory";

// Timeline de alterações de um domínio (S1_1.11A.6).
// Somente leitura — mais recente primeiro. Dados vêm do store.

const ICONE_OPERACAO = {
  [DOC_OPERACAO.DOMAIN_CREATED]: FilePlus,
  [DOC_OPERACAO.DOMAIN_UPDATED]: Pencil,
  [DOC_OPERACAO.OWNER_CHANGED]: User,
  [DOC_OPERACAO.STATUS_CHANGED]: GitBranch,
  [DOC_OPERACAO.HOMOLOGATED]: CheckCircle2,
  [DOC_OPERACAO.GOVERNANCE_REOPENED]: RotateCcw,
  [DOC_OPERACAO.SECTION_UPDATED]: ListChecks,
  [DOC_OPERACAO.ITEM_UPDATED]: Pencil,
};

/**
 * @param {{ entradas: Array<object> }} props
 */
export default function DocVivaTimeline({ entradas }) {
  return (
    <section className="s7-docviva-timeline" aria-label="Histórico de alterações">
      <div className="s7-docviva-timeline__head">
        <h4 className="s7-docviva-timeline__title">
          <History size={16} aria-hidden /> Histórico de Alterações
        </h4>
        <span className="s7-docviva-timeline__count">{entradas.length}</span>
      </div>

      {entradas.length === 0 ? (
        <p className="s7-docviva-empty">Sem alterações registradas ainda.</p>
      ) : (
        <ol className="s7-docviva-timeline__list">
          {entradas.map((entrada) => {
            const meta = metaOperacao(entrada.operation_type);
            const Icon = ICONE_OPERACAO[entrada.operation_type] ?? Pencil;
            return (
              <li key={entrada.history_id} className="s7-docviva-timeline__item">
                <span
                  className={`s7-docviva-timeline__dot s7-docviva-timeline__dot--${meta.tone}`}
                  aria-hidden
                >
                  <Icon size={13} />
                </span>
                <div className="s7-docviva-timeline__body">
                  <p className="s7-docviva-timeline__label">{entrada.label || meta.rotulo}</p>
                  <p className="s7-docviva-timeline__meta">
                    {formatarDataHora(entrada.created_at)} · {entrada.operator_name}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
