import { useState } from "react";
import { ArrowLeft, Pencil, Save, X, ArrowRight, User, CalendarClock } from "lucide-react";
import { S7Input, S7Textarea, S7Button } from "../../../ui";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import DocVivaStatusSelect from "./DocVivaStatusSelect";
import DocVivaOwnerSelect from "./DocVivaOwnerSelect";
import DocVivaMaturitySelect from "./DocVivaMaturitySelect";
import DocVivaReviewBadge from "./DocVivaReviewBadge";
import DocVivaGovernancePanel from "./DocVivaGovernancePanel";
import DocVivaTimeline from "./DocVivaTimeline";
import DomainSection from "./DomainSection";
import { useDocumentacaoVivaStore } from "./documentacaoVivaContext";
import {
  DOC_FLUXO_HOMOLOGACAO,
  metaMaturidade,
  metaStatusDocumentacao,
  proximaEtapaHomologacao,
} from "./documentacaoVivaModel";

// Detalhe de um domínio com edição (S1_1.9A.1) + seções editáveis.
// Read-only vira editável; persistência é local via store.

/**
 * @param {{ domain: import("./documentacaoVivaModel").DocDomain; onBack: () => void }} props
 */
export default function DomainDetail({ domain, onBack }) {
  const { salvarDominio, salvarSecao, historicoDoDominio } = useDocumentacaoVivaStore();
  const entradasHistorico = historicoDoDominio(domain);
  const [editandoDominio, setEditandoDominio] = useState(false);
  const [draft, setDraft] = useState({
    domain_name: domain.domain_name,
    description: domain.description,
    status: domain.status,
    owner: domain.owner,
    maturity: domain.maturity,
    next_review_at: domain.next_review_at,
  });

  const status = metaStatusDocumentacao(domain.status);
  const maturidade = metaMaturidade(domain.maturity);
  const proxima = proximaEtapaHomologacao(domain.status);

  const iniciarEdicao = () => {
    setDraft({
      domain_name: domain.domain_name,
      description: domain.description,
      status: domain.status,
      owner: domain.owner,
      maturity: domain.maturity,
      next_review_at: domain.next_review_at,
    });
    setEditandoDominio(true);
  };

  const salvarDominioLocal = () => {
    salvarDominio(domain.domain_slug, draft);
    setEditandoDominio(false);
  };

  const avancarEtapa = () => {
    if (proxima) salvarDominio(domain.domain_slug, { status: proxima });
  };

  return (
    <div className="s7-docviva-detail">
      <button type="button" className="s7-docviva-detail__back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden /> Voltar para domínios
      </button>

      {editandoDominio ? (
        <div className="s7-docviva-detail__editor">
          <S7Input
            label="Nome do domínio"
            name="domain_name"
            value={draft.domain_name}
            onChange={(event) => setDraft((d) => ({ ...d, domain_name: event.target.value }))}
          />
          <S7Textarea
            label="Descrição"
            name="domain_description"
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
          />
          <div className="s7-docviva-detail__editor-grid">
            <DocVivaStatusSelect
              value={draft.status}
              onChange={(value) => setDraft((d) => ({ ...d, status: value }))}
            />
            <DocVivaOwnerSelect
              value={draft.owner}
              onChange={(value) => setDraft((d) => ({ ...d, owner: value }))}
            />
            <DocVivaMaturitySelect
              value={draft.maturity}
              onChange={(value) => setDraft((d) => ({ ...d, maturity: value }))}
            />
            <S7Input
              label="Próxima revisão"
              name="next_review_at"
              type="date"
              value={draft.next_review_at}
              onChange={(event) => setDraft((d) => ({ ...d, next_review_at: event.target.value }))}
            />
          </div>
          <div className="s7-docviva-detail__editor-actions">
            <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={() => setEditandoDominio(false)}>
              Cancelar
            </S7Button>
            <S7Button type="button" variant="primary" size="sm" icon={<Save size={14} />} onClick={salvarDominioLocal}>
              Salvar alterações
            </S7Button>
          </div>
        </div>
      ) : (
        <div className="s7-docviva-detail__head">
          <div>
            <h3 className="s7-docviva-detail__title">{domain.domain_name}</h3>
            <p className="s7-docviva-detail__subtitle">{domain.description}</p>
          </div>
          <div className="s7-docviva-detail__head-actions">
            <DocVivaStatusBadge label={status.label} tone={status.tone} />
            <S7Button type="button" variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={iniciarEdicao}>
              Editar domínio
            </S7Button>
          </div>
        </div>
      )}

      {/* Barra de metadados de governança (S1_1.9B.8) — escaneável */}
      <div className="s7-docviva-meta" aria-label="Metadados de governança">
        <div className="s7-docviva-meta__item">
          <span className="s7-docviva-meta__label">
            <User size={13} aria-hidden /> Responsável
          </span>
          <span className="s7-docviva-meta__value">{domain.owner}</span>
        </div>
        <div className="s7-docviva-meta__item">
          <span className="s7-docviva-meta__label">Maturidade</span>
          <DocVivaStatusBadge label={maturidade.label} tone={maturidade.tone} />
        </div>
        <div className="s7-docviva-meta__item">
          <span className="s7-docviva-meta__label">
            <CalendarClock size={13} aria-hidden /> Próxima revisão
          </span>
          <span className="s7-docviva-meta__value">{domain.next_review_at || "Não definida"}</span>
        </div>
        <div className="s7-docviva-meta__item">
          <span className="s7-docviva-meta__label">Situação</span>
          <DocVivaReviewBadge nextReviewAt={domain.next_review_at} />
        </div>
      </div>

      {/* Painel executivo de governança (S1_1.11A.11) */}
      <DocVivaGovernancePanel domain={domain} />

      {/* Fluxo de governança (S1_1.11A.7): Rascunho → Em documentação → Em revisão → Homologado */}
      <div className="s7-docviva-flow" aria-label="Fluxo de governança">
        <div className="s7-docviva-flow__steps">
          {DOC_FLUXO_HOMOLOGACAO.map((etapa, idx) => {
            const meta = metaStatusDocumentacao(etapa);
            const ativa = etapa === domain.status;
            return (
              <div key={etapa} className="s7-docviva-flow__step-wrap">
                <span
                  className={`s7-docviva-flow__step ${
                    ativa ? "s7-docviva-flow__step--active" : ""
                  }`}
                >
                  {meta.label}
                </span>
                {idx < DOC_FLUXO_HOMOLOGACAO.length - 1 ? (
                  <ArrowRight size={14} className="s7-docviva-flow__arrow" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
        {proxima ? (
          <S7Button type="button" variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={avancarEtapa}>
            Avançar para {metaStatusDocumentacao(proxima).label}
          </S7Button>
        ) : null}
      </div>

      {domain.sections.map((section) => (
        <DomainSection
          key={section.section_id}
          section={section}
          onSave={(sectionId, items) => salvarSecao(domain.domain_slug, sectionId, items)}
        />
      ))}

      {/* Timeline de alterações (S1_1.11A.6) */}
      <DocVivaTimeline entradas={entradasHistorico} />
    </div>
  );
}
