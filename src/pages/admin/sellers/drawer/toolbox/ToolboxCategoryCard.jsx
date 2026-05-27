import { memo, useCallback } from "react";
import {
  CreditCard,
  Database,
  Flag,
  History,
  Package,
  Plug,
  RefreshCw,
  ScanSearch,
  User,
} from "lucide-react";
import { useSellerToolbox } from "./SellerToolboxContext";
import { useSellerToolboxNavigation } from "./SellerToolboxNavigation";

/** @type {Record<string, import("react").ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>>} */
const ICONS = {
  User,
  CreditCard,
  Plug,
  Flag,
  Database,
  ScanSearch,
  RefreshCw,
  Package,
  History,
};

/**
 * @param {import("./sellerToolboxCategoriesModel").SellerToolboxCategory} props
 */
function ToolboxCategoryCard({ id, label, description, icon }) {
  const { sellerId, toolboxState, isReady } = useSellerToolbox();
  const { selectedCategoryId, selectCategory } = useSellerToolboxNavigation();
  const Icon = ICONS[icon] ?? User;

  const isSelected = selectedCategoryId === id;
  const isDisabled = !isReady;

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    selectCategory(id);
  }, [id, isDisabled, selectCategory]);

  return (
    <button
      type="button"
      className={[
        "seller-toolbox-category",
        isSelected ? "seller-toolbox-category--selected" : "",
        isDisabled ? "seller-toolbox-category--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-category-id={id}
      data-seller-id={sellerId ?? undefined}
      data-toolbox-state={toolboxState}
      data-context-ready={isReady || undefined}
      aria-label={label}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={handleClick}
    >
      <div className="seller-toolbox-category__icon-wrap" aria-hidden>
        <Icon className="seller-toolbox-category__icon" strokeWidth={2} />
      </div>
      <div className="seller-toolbox-category__copy">
        <h4 className="seller-toolbox-category__title">{label}</h4>
        <p className="seller-toolbox-category__desc">{description}</p>
      </div>
      <span className="seller-toolbox-category__badge">Em breve</span>
    </button>
  );
}

export default memo(ToolboxCategoryCard);
