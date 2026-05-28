import { memo } from "react";
import {
  classeCssFeedbackOperacional,
  rotuloFeedbackOperacional,
} from "./devCenterOperationalFeedbackModel";
import { useDevCenterOperationalFeedback } from "./useDevCenterOperationalFeedback";
import "./devCenterOperational.css";

function DevCenterOperationalFeedbackBanner() {
  const { feedback, feedbackVisivel, limparFeedback } = useDevCenterOperationalFeedback();

  if (!feedbackVisivel || !feedback) return null;

  return (
    <div
      className={classeCssFeedbackOperacional(feedback.tipo)}
      role={feedback.tipo === "erro" || feedback.tipo === "destrutivo" ? "alert" : "status"}
      aria-live="polite"
      data-bloqueia={feedback.bloqueiaInteracao ? "true" : undefined}
    >
      <div className="dc-operacional-feedback__content">
        <span className="dc-operacional-feedback__tipo">
          {rotuloFeedbackOperacional(feedback.tipo)}
        </span>
        <strong className="dc-operacional-feedback__titulo">{feedback.titulo}</strong>
        <p className="dc-operacional-feedback__desc">{feedback.descricao}</p>
      </div>

      <div className="dc-operacional-feedback__actions">
        {feedback.rotuloAcao && feedback.acao ? (
          <button type="button" className="s7-btn s7-btn--ghost s7-btn--sm" onClick={feedback.acao}>
            <span className="s7-btn__label">{feedback.rotuloAcao}</span>
          </button>
        ) : null}
        <button type="button" className="s7-btn s7-btn--ghost s7-btn--sm" onClick={limparFeedback}>
          <span className="s7-btn__label">Fechar</span>
        </button>
      </div>
    </div>
  );
}

export default memo(DevCenterOperationalFeedbackBanner);
