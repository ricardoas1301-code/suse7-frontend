import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  applySubscriptionManagementOperationResult,
  buildSubscriptionManagementMockState,
  resolveSubscriptionManagementPanelState,
} from "./subscriptionManagementModel";

/** @typedef {import("./subscriptionManagementModel").SubscriptionManagementStateViewModel} SubscriptionManagementStateViewModel */
/** @typedef {import("./subscriptionManagementModel").SubscriptionManagementPanelState} SubscriptionManagementPanelState */

/**
 * @typedef {{
 *   panelState: SubscriptionManagementPanelState;
 *   currentState: SubscriptionManagementStateViewModel;
 *   loading: boolean;
 *   error: string;
 *   applySubscriptionManagementResult: (result: Record<string, unknown>) => void;
 *   resetSubscriptionManagement: () => void;
 * }} SubscriptionManagementViewValue
 */

/** @type {import("react").Context<SubscriptionManagementViewValue | null>} */
const SubscriptionManagementViewContext = createContext(null);

function createInitialManagementState() {
  return {
    currentState: buildSubscriptionManagementMockState(),
    loadState: /** @type {"idle" | "loading" | "loaded" | "error"} */ ("idle"),
    loadError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SubscriptionManagementViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const [managementState, setManagementState] = useState(createInitialManagementState);

  useEffect(() => {
    if (!sellerId) {
      setManagementState(createInitialManagementState());
      return;
    }

    setManagementState((current) => ({
      ...current,
      loadState: "loading",
      loadError: "",
    }));

    const timer = window.setTimeout(() => {
      setManagementState({
        currentState: buildSubscriptionManagementMockState(),
        loadState: "loaded",
        loadError: "",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveSubscriptionManagementPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applySubscriptionManagementResult = useCallback((result) => {
    setManagementState((current) => ({
      ...current,
      currentState: applySubscriptionManagementOperationResult(result, current.currentState),
      loadState: "loaded",
      loadError: "",
    }));
  }, []);

  const resetSubscriptionManagement = useCallback(() => {
    setManagementState({
      currentState: buildSubscriptionManagementMockState(),
      loadState: "loaded",
      loadError: "",
    });
  }, []);

  const stateRef = useRef(managementState);
  stateRef.current = managementState;

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    window.__S7_TOOLBOX_SUBSCRIPTION_MANAGEMENT__ = {
      get: () => stateRef.current,
      reset: () => resetSubscriptionManagement(),
    };
  }, [resetSubscriptionManagement]);

  const loading = panelState === "initial" || managementState.loadState === "loading";
  const error =
    managementState.loadError ||
    (managementState.loadState === "error" ? "Não foi possível carregar a gestão de assinatura." : "");

  const value = useMemo(
    () => ({
      panelState,
      currentState: managementState.currentState,
      loading,
      error,
      applySubscriptionManagementResult,
      resetSubscriptionManagement,
    }),
    [
      panelState,
      managementState.currentState,
      loading,
      error,
      applySubscriptionManagementResult,
      resetSubscriptionManagement,
    ],
  );

  return (
    <SubscriptionManagementViewContext.Provider value={value}>
      {children}
    </SubscriptionManagementViewContext.Provider>
  );
}

export function useSubscriptionManagementView() {
  const context = useContext(SubscriptionManagementViewContext);
  if (!context) {
    throw new Error("useSubscriptionManagementView must be used within SubscriptionManagementViewProvider");
  }
  return context;
}
