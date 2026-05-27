import { createContext, memo, useContext, useEffect, useMemo, useRef } from "react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import {
  isSellerToolboxContextInvalid,
  isSellerToolboxContextReady,
  resolveSellerToolboxState,
} from "./sellerToolboxContextModel";

/** @type {import("react").Context<import("./sellerToolboxContextModel").SellerToolboxContextValue | null>} */
const SellerToolboxContext = createContext(null);

/** @type {import("./sellerToolboxContextModel").SellerToolboxContextValue} */
const EMPTY_SELLER_TOOLBOX_CONTEXT = Object.freeze({
  sellerId: null,
  listPreview: null,
  detail: null,
  drawerState: null,
  toolboxState: "empty",
  isReady: false,
});

/**
 * @param {{
 *   sellerId: string;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState: import("../SellerDrawerStateResolver").SellerDrawerState;
 *   children: import("react").ReactNode;
 * }} props
 */
function SellerToolboxProvider({
  sellerId,
  listPreview = null,
  detail = null,
  drawerState,
  children,
}) {
  const contextValue = useMemo(() => {
    const input = { sellerId, listPreview, detail, drawerState };
    const toolboxState = resolveSellerToolboxState(input);
    const isReady = isSellerToolboxContextReady(input);

    return {
      sellerId,
      listPreview: listPreview ?? null,
      detail: detail ?? null,
      drawerState,
      toolboxState,
      isReady,
    };
  }, [sellerId, listPreview, detail, drawerState]);

  const lastReadyRef = useRef(false);
  const lastInvalidRef = useRef(false);

  useEffect(() => {
    logSellerToolbox("context_init", {
      sellerId,
      drawerState,
      toolboxState: contextValue.toolboxState,
    });
  }, [sellerId]);

  useEffect(() => {
    if (contextValue.isReady && !lastReadyRef.current) {
      logSellerToolbox("context_ready", { sellerId, drawerState });
    }
    lastReadyRef.current = contextValue.isReady;
  }, [contextValue.isReady, sellerId, drawerState]);

  useEffect(() => {
    const isInvalid = isSellerToolboxContextInvalid(contextValue);
    if (isInvalid && !lastInvalidRef.current) {
      logSellerToolbox("context_invalid", {
        sellerId,
        drawerState,
        toolboxState: contextValue.toolboxState,
      });
    }
    lastInvalidRef.current = isInvalid;
  }, [contextValue, sellerId, drawerState]);

  return (
    <SellerToolboxContext.Provider value={contextValue}>{children}</SellerToolboxContext.Provider>
  );
}

export default memo(SellerToolboxProvider);

/**
 * Hook oficial da Seller Toolbox — somente leitura, sem setters.
 * @returns {import("./sellerToolboxContextModel").SellerToolboxContextValue}
 */
export function useSellerToolbox() {
  const context = useContext(SellerToolboxContext);
  return context ?? EMPTY_SELLER_TOOLBOX_CONTEXT;
}

/**
 * Fallback seguro quando o contexto não está disponível.
 * @param {{ children?: import("react").ReactNode }} props
 */
export function SellerToolboxContextFallback({ children = null }) {
  const { isReady, toolboxState } = useSellerToolbox();

  if (isReady) return children;
  if (toolboxState === "loading") return children;

  return (
    <div className="seller-toolbox-context-fallback" role="status" aria-live="polite">
      {children}
    </div>
  );
}
