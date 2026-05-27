import { memo } from "react";
import { S7Button } from "../../../../../components/ui";
import { useSellerToolboxFeedback } from "./useSellerToolboxFeedback";

const DEV_FEEDBACK_SAMPLES = [
  {
    key: "success",
    label: "DEV · sucesso",
    payload: {
      type: "success",
      title: "Operação simulada concluída",
      description: "Feedback de sucesso — nenhuma ação real foi executada nesta fase.",
    },
  },
  {
    key: "error",
    label: "DEV · erro",
    payload: {
      type: "error",
      title: "Falha simulada",
      description: "Feedback de erro elegante — apenas validação visual do padrão da Toolbox.",
    },
  },
  {
    key: "warning",
    label: "DEV · aviso",
    payload: {
      type: "warning",
      title: "Atenção simulada",
      description: "Feedback de aviso leve — preparado para ações sensíveis futuras.",
    },
  },
  {
    key: "info",
    label: "DEV · info",
    payload: {
      type: "info",
      title: "Informação operacional",
      description: "Feedback informativo — leitura rápida sem bloquear a navegação.",
      actionLabel: "Ação fake",
      action: () => {},
    },
  },
];

function SellerToolboxFeedbackDevTrigger() {
  const { showFeedback } = useSellerToolboxFeedback();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="seller-toolbox-feedback-dev" data-dev-only>
      <p className="seller-toolbox-feedback-dev__label">Validação DEV — feedback</p>
      <div className="seller-toolbox-feedback-dev__actions">
        {DEV_FEEDBACK_SAMPLES.map((sample) => (
          <S7Button
            key={sample.key}
            type="button"
            variant="utility"
            size="sm"
            className="seller-toolbox-feedback-dev__btn"
            onClick={() => showFeedback(sample.payload)}
          >
            {sample.label}
          </S7Button>
        ))}
      </div>
    </div>
  );
}

export default memo(SellerToolboxFeedbackDevTrigger);
