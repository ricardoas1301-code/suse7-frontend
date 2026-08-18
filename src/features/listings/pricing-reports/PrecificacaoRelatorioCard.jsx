import S7Icon from "../../../components/ui/S7Icon";
import { PRECIFICACAO_RELATORIO_STATUS_UI } from "./precificacaoRelatoriosConstants.js";

/**
 * Card estrutural de um relatório (sem geração/exportação nesta fase).
 * @param {{
 *   relatorio: import("./precificacaoRelatoriosCatalog.js").PrecificacaoRelatorioDef;
 *   categoriaTitulo: string;
 * }} props
 */
export default function PrecificacaoRelatorioCard({ relatorio, categoriaTitulo }) {
  const statusUi = PRECIFICACAO_RELATORIO_STATUS_UI[relatorio.status] ?? PRECIFICACAO_RELATORIO_STATUS_UI.preparacao;
  const interativo = relatorio.status === "disponivel";

  return (
    <article
      className={`prec-relatorio-card${interativo ? " prec-relatorio-card--interactive" : ""}`}
      data-status={relatorio.status}
      aria-labelledby={`prec-relatorio-${relatorio.id}-title`}
    >
      <div className="prec-relatorio-card__top">
        <span
          className={`prec-relatorio-card__icon prec-relatorio-card__icon--${relatorio.iconTone}`}
          aria-hidden
        >
          <S7Icon name={relatorio.icon} size={18} strokeWidth={1.65} />
        </span>
        <span className={`prec-relatorio-card__status prec-relatorio-card__status--${statusUi.tone}`}>
          {statusUi.label}
        </span>
      </div>

      <h4 id={`prec-relatorio-${relatorio.id}-title`} className="prec-relatorio-card__nome">
        {relatorio.nome}
      </h4>
      <p className="prec-relatorio-card__desc">{relatorio.descricao}</p>

      <footer className="prec-relatorio-card__meta">
        <span className="prec-relatorio-card__categoria" title={categoriaTitulo}>
          {categoriaTitulo}
        </span>
      </footer>
    </article>
  );
}
