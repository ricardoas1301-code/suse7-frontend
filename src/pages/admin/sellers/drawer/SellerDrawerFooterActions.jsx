import { memo } from "react";
import { S7Button } from "../../../../components/ui";

/**
 * @param {{ onClose: () => void }} props
 */
function SellerDrawerFooterActions({ onClose }) {
  return (
    <div className="seller-drawer-footer__actions">
      <S7Button type="button" variant="secondary" size="sm" className="seller-drawer-footer__close" onClick={onClose}>
        Fechar
      </S7Button>
    </div>
  );
}

export default memo(SellerDrawerFooterActions);
