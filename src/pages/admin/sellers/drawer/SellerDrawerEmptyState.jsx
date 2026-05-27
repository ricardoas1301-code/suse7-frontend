import { memo } from "react";
import { S7Button } from "../../../../components/ui";

/**
 * @param {{ onClose: () => void }} props
 */
function SellerDrawerEmptyState({ onClose }) {
  return (
    <div className="seller-drawer-state seller-drawer-state--empty drawer-empty" role="status">
      <div className="seller-drawer-state__icon seller-drawer-state__icon--empty" aria-hidden />
      <h4 className="seller-drawer-state__title">Nenhum dado encontrado para este seller</h4>
      <p className="seller-drawer-state__message">
        Não há informações operacionais disponíveis no momento. Você pode fechar e tentar outro seller.
      </p>
      <S7Button type="button" variant="secondary" size="sm" className="seller-drawer-state__cta" onClick={onClose}>
        Fechar
      </S7Button>
    </div>
  );
}

export default memo(SellerDrawerEmptyState);
