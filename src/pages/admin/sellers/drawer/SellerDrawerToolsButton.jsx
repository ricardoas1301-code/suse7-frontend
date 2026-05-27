import { memo, useCallback, useState } from "react";
import { Wrench } from "lucide-react";
import { logSellerToolbox } from "../sellerToolboxDevLog";

/**
 * Entrada oficial para a futura Seller Toolbox (S_5.1.6).
 *
 * @param {{
 *   disabled?: boolean;
 *   sellerId?: string | null;
 *   onOpenTools?: () => void;
 * }} props
 */
function SellerDrawerToolsButton({ disabled = false, sellerId = null, onOpenTools }) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;

    logSellerToolbox("tools_button_clicked", { sellerId });
    setAcknowledged(true);
    onOpenTools?.();

    window.setTimeout(() => {
      setAcknowledged(false);
    }, 1400);
  }, [disabled, onOpenTools, sellerId]);

  return (
    <div className="seller-drawer-footer__slot" data-footer-slot>
      <button
        type="button"
        className={[
          "seller-drawer-footer__tools-btn",
          acknowledged ? "seller-drawer-footer__tools-btn--ack" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        aria-label="Abrir ferramentas do seller"
        aria-disabled={disabled || undefined}
        title={disabled ? "Carregue o seller para abrir ferramentas" : "Ferramentas — em breve"}
        onClick={handleClick}
      >
        <Wrench className="seller-drawer-footer__tools-icon" strokeWidth={2} aria-hidden />
        <span className="seller-drawer-footer__tools-label">Ferramentas</span>
      </button>
    </div>
  );
}

export default memo(SellerDrawerToolsButton);
