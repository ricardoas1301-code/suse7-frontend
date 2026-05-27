import { memo } from "react";
import { S7Button } from "../../../../components/ui";

/**
 * @param {{ onRetry: () => void; onClose: () => void }} props
 */
function SellerDrawerErrorState({ onRetry, onClose }) {
  return (
    <div className="seller-drawer-state seller-drawer-state--error drawer-error" role="alert">
      <div className="seller-drawer-state__icon seller-drawer-state__icon--error" aria-hidden />
      <h4 className="seller-drawer-state__title">Não foi possível carregar este seller</h4>
      <p className="seller-drawer-state__message">
        Ocorreu um problema ao buscar os dados. Tente novamente ou feche o drawer.
      </p>
      <div className="seller-drawer-state__actions">
        <S7Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </S7Button>
        <S7Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </S7Button>
      </div>
    </div>
  );
}

export default memo(SellerDrawerErrorState);
