import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolboxOperationalLog } from "./useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "./sellerToolboxOperationalLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import { findSellerToolboxCategory } from "./sellerToolboxCategoriesModel";

/**
 * @typedef {{
 *   selectedCategoryId: string | null;
 *   selectedCategory: import("./sellerToolboxCategoriesModel").SellerToolboxCategory | null;
 *   selectCategory: (categoryId: string) => void;
 *   clearCategory: () => void;
 * }} SellerToolboxNavigationValue
 */

/** @type {import("react").Context<SellerToolboxNavigationValue | null>} */
const SellerToolboxNavigationContext = createContext(null);

function SellerToolboxNavigationProvider({ children }) {
  const { sellerId, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [selectedCategoryId, setSelectedCategoryId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [sellerId]);

  const selectedCategory = useMemo(
    () => findSellerToolboxCategory(selectedCategoryId),
    [selectedCategoryId],
  );

  const selectCategory = useCallback(
    (categoryId) => {
      if (!isReady || !categoryId) return;
      setSelectedCategoryId(categoryId);
      logSellerToolbox("category_selected", { sellerId, categoryId });
      logOperation({
        event: "category_selected",
        category: SELLER_TOOLBOX_OPERATION_CATEGORIES.NAVIGATION,
        metadata: { categoryId },
      });
    },
    [isReady, sellerId, logOperation],
  );

  const clearCategory = useCallback(() => {
    if (!selectedCategoryId) return;
    logSellerToolbox("category_back", { sellerId, categoryId: selectedCategoryId });
    setSelectedCategoryId(null);
  }, [selectedCategoryId, sellerId]);

  const value = useMemo(
    () => ({
      selectedCategoryId,
      selectedCategory,
      selectCategory,
      clearCategory,
    }),
    [selectedCategoryId, selectedCategory, selectCategory, clearCategory],
  );

  return (
    <SellerToolboxNavigationContext.Provider value={value}>
      {children}
    </SellerToolboxNavigationContext.Provider>
  );
}

export default memo(SellerToolboxNavigationProvider);

/**
 * @returns {SellerToolboxNavigationValue}
 */
export function useSellerToolboxNavigation() {
  const context = useContext(SellerToolboxNavigationContext);
  if (!context) {
    throw new Error("useSellerToolboxNavigation must be used within SellerToolboxNavigationProvider");
  }
  return context;
}
