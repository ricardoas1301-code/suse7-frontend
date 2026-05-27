import { useCallback } from "react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import {
  SELLER_OPEN_BUTTON_TOOLTIP,
  SHOW_SELLER_OPEN_BUTTON,
} from "./sellerOpsConstants";

/**
 * Fallback secundário — abrir drawer via botão (S_5.1.2).
 * Remoção futura: desligar SHOW_SELLER_OPEN_BUTTON em sellerOpsConstants.js.
 *
 * @param {{
 *   seller: import('./sellerOpsTypes').SellerListRow;
 *   isSelected: boolean;
 *   drawerPhase: "idle" | "loading" | "ok" | "error";
 *   onOpen: (seller: import('./sellerOpsTypes').SellerListRow, source: "button") => void;
 * }} props
 */
export default function SellerOpsOpenButton({ seller, isSelected, drawerPhase, onOpen }) {
  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      onOpen(seller, "button");
    },
    [onOpen, seller],
  );

  if (!SHOW_SELLER_OPEN_BUTTON) {
    return <span className="dc-sellers-queue__open-btn-slot" aria-hidden />;
  }

  const isDrawerOpen = isSelected && (drawerPhase === "loading" || drawerPhase === "ok");
  const isLoading = isSelected && drawerPhase === "loading";
  const label = isDrawerOpen ? "Aberto" : "Abrir";
  const disabled = isDrawerOpen;

  const button = (
    <button
      type="button"
      className={[
        "dc-sellers-queue__open-btn",
        isDrawerOpen ? "dc-sellers-queue__open-btn--open" : "",
        isLoading ? "dc-sellers-queue__open-btn--loading" : "",
        disabled ? "dc-sellers-queue__open-btn--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      aria-busy={isLoading || undefined}
      aria-label={isDrawerOpen ? `Seller ${seller.nome} aberto no drawer` : SELLER_OPEN_BUTTON_TOOLTIP}
      aria-pressed={isDrawerOpen || undefined}
      onClick={handleClick}
    >
      <span className="dc-sellers-queue__open-btn-label">{label}</span>
    </button>
  );

  return (
    <span className="dc-sellers-queue__open-btn-slot">
      <span className="dc-sellers-queue__open-btn-tooltip-host">
        <S7Tooltip content={SELLER_OPEN_BUTTON_TOOLTIP} placement="top-start" offset={6}>
          {button}
        </S7Tooltip>
      </span>
    </span>
  );
}
