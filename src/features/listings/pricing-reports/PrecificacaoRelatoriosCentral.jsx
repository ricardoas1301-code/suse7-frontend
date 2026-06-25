import { useEffect, useMemo } from "react";
import S7Button from "../../../components/ui/S7Button";
import S7EmptyState from "../../../components/ui/S7EmptyState";
import S7Icon from "../../../components/ui/S7Icon";
import PrecificacaoRelatorioCard from "./PrecificacaoRelatorioCard.jsx";
import { PRECIFICACAO_RELATORIOS_CATEGORIAS, contarRelatoriosPrecificacao } from "./precificacaoRelatoriosCatalog.js";
import {
  PRECIFICACAO_RELATORIOS_MARKETPLACES_FUTUROS,
  PRECIFICACAO_RELATORIOS_VIEW,
} from "./precificacaoRelatoriosConstants.js";
import "./PrecificacaoRelatoriosCentral.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   viewState?: import("./precificacaoRelatoriosConstants.js").PrecificacaoRelatoriosCentralViewId;
 *   mode?: "precificacoes" | "anuncios";
 * }} props
 */
export default function PrecificacaoRelatoriosCentral({
  open,
  onClose,
  viewState = PRECIFICACAO_RELATORIOS_VIEW.CATALOGO,
  mode = "precificacoes",
}) {
  const totalRelatorios = useMemo(() => contarRelatoriosPrecificacao(), []);
  const isAdsMode = mode === "anuncios";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const bodyContent = (() => {
    if (isAdsMode) {
      return (
        <S7EmptyState
          className="prec-relatorios-central__empty"
          iconName="reports"
          title="Central de relatórios de anúncios"
          description="Estrutura do modal já ativada. O motor e os dados reais serão conectados nas próximas etapas."
        />
      );
    }

    switch (viewState) {
      case PRECIFICACAO_RELATORIOS_VIEW.LOADING:
        return (
          <div className="prec-relatorios-central__state" role="status" aria-live="polite">
            <span className="prec-relatorios-central__spinner" aria-hidden />
            <p className="prec-relatorios-central__state-title">Carregando relatórios</p>
            <p className="prec-relatorios-central__state-desc">Preparando a central de relatórios da precificação…</p>
          </div>
        );

      case PRECIFICACAO_RELATORIOS_VIEW.VAZIO:
        return (
          <S7EmptyState
            className="prec-relatorios-central__empty"
            iconName="empty"
            title="Central sem categorias"
            description="Nenhuma categoria de relatório configurada neste momento."
          />
        );

      case PRECIFICACAO_RELATORIOS_VIEW.SEM_RELATORIOS:
        return (
          <S7EmptyState
            className="prec-relatorios-central__empty"
            iconName="records"
            title="Nenhum relatório disponível"
            description="As categorias estão preparadas, mas ainda não há relatórios cadastrados na central."
          />
        );

      case PRECIFICACAO_RELATORIOS_VIEW.INDISPONIVEL:
        return (
          <S7EmptyState
            className="prec-relatorios-central__empty"
            iconName="info"
            title="Relatório indisponível"
            description="Este relatório ainda não está liberado. Acompanhe as próximas fases da trilha de Precificação."
          />
        );

      case PRECIFICACAO_RELATORIOS_VIEW.CATALOGO:
      default:
        if (PRECIFICACAO_RELATORIOS_CATEGORIAS.length === 0) {
          return (
            <S7EmptyState
              className="prec-relatorios-central__empty"
              iconName="empty"
              title="Central sem categorias"
              description="Nenhuma categoria de relatório configurada neste momento."
            />
          );
        }
        if (totalRelatorios === 0) {
          return (
            <S7EmptyState
              className="prec-relatorios-central__empty"
              iconName="records"
              title="Nenhum relatório disponível"
              description="As categorias estão preparadas, mas ainda não há relatórios cadastrados na central."
            />
          );
        }
        return (
          <div className="prec-relatorios-central__catalog">
            {PRECIFICACAO_RELATORIOS_CATEGORIAS.map((categoria) => (
              <section
                key={categoria.id}
                className="prec-relatorios-central__category"
                aria-labelledby={`prec-relatorios-cat-${categoria.id}`}
              >
                <header className="prec-relatorios-central__category-head">
                  <h3 id={`prec-relatorios-cat-${categoria.id}`} className="prec-relatorios-central__category-title">
                    {categoria.titulo}
                  </h3>
                  <p className="prec-relatorios-central__category-desc">{categoria.descricao}</p>
                </header>
                <div className="prec-relatorios-central__grid">
                  {categoria.relatorios.map((rel) => (
                    <PrecificacaoRelatorioCard key={rel.id} relatorio={rel} categoriaTitulo={categoria.titulo} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        );
    }
  })();

  return (
    <div className="prec-relatorios-central__backdrop" onClick={onClose} role="presentation">
      <aside
        className="prec-relatorios-central"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prec-relatorios-central-title"
        onClick={(e) => e.stopPropagation()}
        data-view-state={viewState}
      >
        <header className="prec-relatorios-central__header">
          <div className="prec-relatorios-central__header-main">
            <span className="prec-relatorios-central__header-icon" aria-hidden>
              <S7Icon name="reports" size={20} strokeWidth={1.85} />
            </span>
            <div className="prec-relatorios-central__header-text">
              <h2 id="prec-relatorios-central-title" className="prec-relatorios-central__title">
                {isAdsMode ? "Relatórios de anúncios" : "Central de Relatórios"}
              </h2>
              <p className="prec-relatorios-central__subtitle">
                {isAdsMode
                  ? "Modal de relatórios do módulo Anúncios (stub inicial). A estrutura está pronta para receber os relatórios oficiais."
                  : "Relatórios estratégicos sobre a saúde financeira dos seus anúncios — estrutura inicial, sem processamento nesta fase."}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="prec-relatorios-central__close"
            onClick={onClose}
            aria-label="Fechar central de relatórios"
          >
            <S7Icon name="close" size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="prec-relatorios-central__scope" aria-label="Escopo futuro por marketplace e conta">
          <span className="prec-relatorios-central__scope-label">Canais (preparação)</span>
          <div className="prec-relatorios-central__scope-chips" role="list">
            {PRECIFICACAO_RELATORIOS_MARKETPLACES_FUTUROS.map((m) => (
              <span
                key={m.id}
                role="listitem"
                className={`prec-relatorios-central__scope-chip${
                  m.ativo ? " prec-relatorios-central__scope-chip--ativo" : ""
                }`}
                title={m.ativo ? "Canal integrado hoje" : "Disponível em expansões futuras"}
              >
                {m.label}
              </span>
            ))}
          </div>
          <p className="prec-relatorios-central__scope-hint">
            {isAdsMode
              ? "Estrutura pronta para filtros globais por marketplace, conta e CNPJ nas próximas fases."
              : "Arquitetura preparada para múltiplos marketplaces, CNPJs e contas — filtros globais virão nas próximas fases."}
          </p>
        </div>

        <div className="prec-relatorios-central__body">{bodyContent}</div>

        <footer className="prec-relatorios-central__footer">
          <span className="prec-relatorios-central__footer-meta">
            {isAdsMode
              ? "Módulo de relatórios de anúncios em preparação · exportação (PDF, Excel, CSV) em fase futura"
              : `${totalRelatorios} relatórios estruturados · exportação (PDF, Excel, CSV) em fase futura`}
          </span>
          <S7Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </S7Button>
        </footer>
      </aside>
    </div>
  );
}
