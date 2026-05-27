import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../sellerToolboxOperationalLog";
import {
  applySubscriptionManagementOperationResult,
  buildSubscriptionManagementMockState,
  resolveSubscriptionManagementPanelState,
} from "./subscriptionManagementModel";

/** @typedef {import("./subscriptionManagementModel").SubscriptionManagementStateViewModel} SubscriptionManagementStateViewModel */
/** @typedef {import("./subscriptionManagementModel").SubscriptionManagementPanelState} SubscriptionManagementPanelState */
/** @typedef {import("./subscriptionManagementAuditModel").SubscriptionManagementAuditLogEntry} SubscriptionManagementAuditLogEntry */

const MAX_AUDIT_LOGS = 50;

/**
 * @typedef {{
 *   panelState: SubscriptionManagementPanelState;
 *   currentState: SubscriptionManagementStateViewModel;
 *   auditLogs: SubscriptionManagementAuditLogEntry[];
 *   loading: boolean;
 *   error: string;
 *   applySubscriptionManagementResult: (result: Record<string, unknown>) => void;
 *   appendAuditLog: (entry: SubscriptionManagementAuditLogEntry) => void;
 *   resetSubscriptionManagement: () => void;
 * }} SubscriptionManagementViewValue
 */

/** @type {import("react").Context<SubscriptionManagementViewValue | null>} */
const SubscriptionManagementViewContext = createContext(null);

function createInitialManagementState() {
  return {
    currentState: buildSubscriptionManagementMockState(),
    auditLogs: /** @type {SubscriptionManagementAuditLogEntry[]} */ ([]),
    loadState: /** @type {"idle" | "loading" | "loaded" | "error"} */ ("idle"),
    loadError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SubscriptionManagementViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
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
      auditLogs: [],
    }));

    const timer = window.setTimeout(() => {
      setManagementState({
        currentState: buildSubscriptionManagementMockState(),
        auditLogs: [],
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

  const appendAuditLog = useCallback(
    (entry) => {
      setManagementState((current) => ({
        ...current,
        auditLogs: [entry, ...current.auditLogs].slice(0, MAX_AUDIT_LOGS),
      }));

      logSellerToolbox("subscription_management_audit_created", {
        sellerId: entry.sellerId,
        auditId: entry.auditId,
        operationType: entry.operationType,
        adminName: entry.adminName,
        immutable: entry.immutable,
        timestamp: entry.createdAt,
      });

      logOperation({
        event: "subscription_management_audit_created",
        category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
        metadata: {
          auditId: entry.auditId,
          operationType: entry.operationType,
          immutable: entry.immutable,
          sellerId: entry.sellerId,
          adminName: entry.adminName,
          timestamp: entry.createdAt,
        },
      });
    },
    [logOperation],
  );

  const resetSubscriptionManagement = useCallback(() => {
    setManagementState({
      currentState: buildSubscriptionManagementMockState(),
      auditLogs: [],
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
      getAuditLogs: () => stateRef.current.auditLogs,
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
      auditLogs: managementState.auditLogs,
      loading,
      error,
      applySubscriptionManagementResult,
      appendAuditLog,
      resetSubscriptionManagement,
    }),
    [
      panelState,
      managementState.currentState,
      managementState.auditLogs,
      loading,
      error,
      applySubscriptionManagementResult,
      appendAuditLog,
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
