import { FileText, ChevronRight, User } from "lucide-react";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import DocVivaReviewBadge from "./DocVivaReviewBadge";
import { metaMaturidade, metaStatusDocumentacao } from "./documentacaoVivaModel";

// Card de um domínio da Documentação Viva (estilo dos cards de empresas/CNPJs do seller).
// Clicável: abre o detalhe do domínio. Exibe metadados de governança escaneáveis.

/**
 * @param {{ domain: import("./documentacaoVivaModel").DocDomain; onOpen: (slug: string) => void }} props
 */
export default function DomainCard({ domain, onOpen }) {
  const status = metaStatusDocumentacao(domain.status);
  const maturidade = metaMaturidade(domain.maturity);

  return (
    <button
      type="button"
      className="s7-docviva-card"
      onClick={() => onOpen(domain.domain_slug)}
      aria-label={`Abrir documentação de ${domain.domain_name}`}
    >
      <div className="s7-docviva-card__head">
        <span className="s7-docviva-card__icon" aria-hidden>
          <FileText size={18} />
        </span>
        <div className="s7-docviva-card__badges">
          <DocVivaStatusBadge label={status.label} tone={status.tone} />
          <DocVivaStatusBadge label={maturidade.label} tone={maturidade.tone} />
        </div>
      </div>

      <h4 className="s7-docviva-card__title">{domain.domain_name}</h4>
      <p className="s7-docviva-card__desc">{domain.description}</p>

      <div className="s7-docviva-card__gov">
        <span className="s7-docviva-card__owner">
          <User size={12} aria-hidden /> {domain.owner}
        </span>
        <DocVivaReviewBadge nextReviewAt={domain.next_review_at} />
      </div>

      <div className="s7-docviva-card__foot">
        <span>Atualizado em {domain.updated_at}</span>
        <ChevronRight size={16} aria-hidden />
      </div>
    </button>
  );
}
