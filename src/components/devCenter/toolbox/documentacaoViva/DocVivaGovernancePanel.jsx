import { User, Clock, ShieldCheck, CalendarClock, UserCog } from "lucide-react";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import DocVivaReviewBadge from "./DocVivaReviewBadge";
import { metaStatusDocumentacao } from "./documentacaoVivaModel";
import { formatarDataHora } from "./documentacaoVivaHistory";

// Painel executivo de governança do domínio (S1_1.11A.11).
// Bloco escaneável — somente leitura.

/**
 * @param {{ domain: import("./documentacaoVivaModel").DocDomain }} props
 */
export default function DocVivaGovernancePanel({ domain }) {
  const status = metaStatusDocumentacao(domain.status);
  const homologacao = domain.homologated_at
    ? `${formatarDataHora(domain.homologated_at)} · ${domain.homologated_by || "—"}`
    : "Nunca homologado";

  return (
    <section className="s7-docviva-gov" aria-label="Painel de governança">
      <div className="s7-docviva-gov__head">
        <ShieldCheck size={16} aria-hidden />
        <h4 className="s7-docviva-gov__title">Painel de Governança</h4>
        <DocVivaStatusBadge label={status.label} tone={status.tone} />
      </div>

      <div className="s7-docviva-gov__grid">
        <div className="s7-docviva-gov__item">
          <span className="s7-docviva-gov__label">
            <User size={13} aria-hidden /> Responsável
          </span>
          <span className="s7-docviva-gov__value">{domain.owner}</span>
        </div>

        <div className="s7-docviva-gov__item">
          <span className="s7-docviva-gov__label">
            <Clock size={13} aria-hidden /> Última alteração
          </span>
          <span className="s7-docviva-gov__value">{domain.updated_at || "—"}</span>
        </div>

        <div className="s7-docviva-gov__item">
          <span className="s7-docviva-gov__label">
            <UserCog size={13} aria-hidden /> Último operador
          </span>
          <span className="s7-docviva-gov__value">{domain.last_operator || "—"}</span>
        </div>

        <div className="s7-docviva-gov__item">
          <span className="s7-docviva-gov__label">
            <ShieldCheck size={13} aria-hidden /> Última homologação
          </span>
          <span className="s7-docviva-gov__value">{homologacao}</span>
        </div>

        <div className="s7-docviva-gov__item">
          <span className="s7-docviva-gov__label">
            <CalendarClock size={13} aria-hidden /> Próxima revisão
          </span>
          <span className="s7-docviva-gov__value">
            {domain.next_review_at || "Não definida"}{" "}
            <DocVivaReviewBadge nextReviewAt={domain.next_review_at} />
          </span>
        </div>
      </div>
    </section>
  );
}
