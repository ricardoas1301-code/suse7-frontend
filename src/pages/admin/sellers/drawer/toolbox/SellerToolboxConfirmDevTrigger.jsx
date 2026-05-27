import { memo } from "react";
import { S7Button } from "../../../../../components/ui";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";

function SellerToolboxConfirmDevTrigger() {
  const { openConfirm, isConfirmOpen } = useSellerToolboxConfirmAction();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="seller-toolbox-confirm-dev" data-dev-only>
      <S7Button
        type="button"
        variant="utility"
        size="sm"
        className="seller-toolbox-confirm-dev__btn"
        disabled={isConfirmOpen}
        onClick={() =>
          openConfirm({
            id: "dev_test_sensitive_action",
            title: "Forçar sincronização",
            description:
              "Simulação DEV — nenhuma operação real será executada nesta fase. Use para validar o fluxo de confirmação.",
            riskLevel: "danger",
            confirmLabel: "Confirmar (fake)",
            cancelLabel: "Cancelar",
            metadata: { dev: true, futureAction: "force_sync" },
          })
        }
      >
        DEV · testar confirmação
      </S7Button>
    </div>
  );
}

export default memo(SellerToolboxConfirmDevTrigger);
