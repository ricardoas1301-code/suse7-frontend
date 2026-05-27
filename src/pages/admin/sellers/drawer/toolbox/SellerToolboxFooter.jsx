import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import { S7Button } from "../../../../../components/ui";

/**
 * @param {{ onClose: () => void }} props
 */
function SellerToolboxFooter({ onClose }) {
  return (
    <footer className="seller-toolbox-footer dc-sellers-drawer__foot">
      <S7Button
        type="button"
        variant="secondary"
        size="sm"
        className="seller-toolbox-footer__back"
        onClick={onClose}
      >
        <ArrowLeft className="seller-toolbox-footer__back-icon" strokeWidth={2} aria-hidden />
        Voltar
      </S7Button>
    </footer>
  );
}

export default memo(SellerToolboxFooter);
