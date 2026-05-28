import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { useDevCenterOperationalReloadOpcional } from "../../../../../../components/devCenter/operational";
import {
  buildSellerFeatureFlagsViewModel,
  createSellerFeatureFlagsMockInput,
  mapApiFeatureFlagsToMockEntries,
  resolveSellerFeatureFlagsViewState,
  SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK,
} from "./sellerToolboxFeatureFlagsModel";

/** @typedef {import("./sellerToolboxFeatureFlagsModel").SellerFeatureFlag} SellerFeatureFlag */
/** @typedef {import("./sellerToolboxFeatureFlagsModel").SellerFeatureFlagsViewState} SellerFeatureFlagsViewState */

/**
 * @typedef {{
 *   viewState: SellerFeatureFlagsViewState;
 *   flags: SellerFeatureFlag[];
 *   enabledCount: number;
 *   disabledCount: number;
 *   loading: boolean;
 *   error: boolean;
 *   empty: boolean;
 *   setMockEntries: (entries: import("./sellerToolboxFeatureFlagsModel").SellerFeatureFlagMockEntry[]) => void;
 *   resetMockFeatureFlags: () => void;
 *   applyFeatureFlagOperationResult: (result: Record<string, unknown>) => void;
 * }} SellerFeatureFlagsViewValue
 */

/** @type {import("react").Context<SellerFeatureFlagsViewValue | null>} */
const SellerFeatureFlagsViewContext = createContext(null);

let devBridgeInitialized = false;

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerFeatureFlagsViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady, detail } = useSellerToolbox();
  const reloadOperacional = useDevCenterOperationalReloadOpcional();
  const featureFlagsVersion = reloadOperacional?.versoesCategoria?.feature_flags ?? 0;

  const apiEntries = useMemo(
    () => mapApiFeatureFlagsToMockEntries(detail?.feature_flags),
    [detail?.feature_flags, featureFlagsVersion],
  );

  const hasApiFlags = apiEntries.length > 0;

  const [mockInput, setMockInput] = useState(() =>
    createSellerFeatureFlagsMockInput({ sellerId: sellerId ?? null }),
  );

  useEffect(() => {
    if (hasApiFlags) {
      setMockInput({
        sellerId: sellerId ?? null,
        entries: apiEntries,
      });
      return;
    }
    setMockInput(createSellerFeatureFlagsMockInput({ sellerId: sellerId ?? null }));
  }, [sellerId, hasApiFlags, apiEntries]);

  const flags = useMemo(
    () => buildSellerFeatureFlagsViewModel(mockInput.entries),
    [mockInput.entries],
  );

  const viewState = useMemo(
    () =>
      resolveSellerFeatureFlagsViewState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
        hasFlags: flags.length > 0,
      }),
    [sellerId, drawerState, toolboxState, isReady, flags.length],
  );

  const setMockEntries = useMemo(
    () => (entries) => {
      setMockInput((current) => ({
        ...current,
        entries: Array.isArray(entries) ? [...entries] : [],
      }));
    },
    [],
  );

  const resetMockFeatureFlags = useMemo(
    () => () => {
      if (hasApiFlags) {
        setMockInput({ sellerId: sellerId ?? null, entries: apiEntries });
        return;
      }
      setMockInput(createSellerFeatureFlagsMockInput({ sellerId: sellerId ?? null }));
    },
    [sellerId, hasApiFlags, apiEntries],
  );

  const applyFeatureFlagOperationResult = useCallback((result) => {
    const flagKey = String(result?.flagKey ?? "").trim();
    if (!flagKey) return;

    const nextEnabled = typeof result.enabled === "boolean" ? result.enabled : true;

    setMockInput((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.key === flagKey
          ? {
              ...entry,
              enabled: nextEnabled,
              source: "manual",
              updatedAt:
                typeof result.updatedAt === "string" && result.updatedAt
                  ? result.updatedAt
                  : new Date().toISOString(),
            }
          : entry,
      ),
    }));
  }, []);

  const flagsRef = useRef(flags);
  flagsRef.current = flags;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_FEATURE_FLAGS__ = {
      get: () => flagsRef.current,
      setMockEntries: (entries) => {
        setMockEntries(entries);
      },
      reset: () => {
        resetMockFeatureFlags();
      },
      scenarios: {
        loaded: () => {
          setMockEntries([...SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK]);
        },
        empty: () => {
          setMockEntries([]);
        },
        allActive: () => {
          setMockEntries(
            SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK.map((entry) => ({
              ...entry,
              enabled: true,
            })),
          );
        },
        allInactive: () => {
          setMockEntries(
            SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK.map((entry) => ({
              ...entry,
              enabled: false,
            })),
          );
        },
      },
    };
  }, [setMockEntries, resetMockFeatureFlags]);

  const value = useMemo(() => {
    const enabledCount = flags.filter((flag) => flag.enabled).length;
    const disabledCount = flags.filter((flag) => !flag.enabled).length;
    const loading = viewState === "loading";
    const error = viewState === "error";
    const empty = viewState === "empty";

    return {
      viewState,
      flags,
      enabledCount,
      disabledCount,
      loading,
      error,
      empty,
      setMockEntries,
      resetMockFeatureFlags,
      applyFeatureFlagOperationResult,
    };
  }, [viewState, flags, setMockEntries, resetMockFeatureFlags, applyFeatureFlagOperationResult]);

  return (
    <SellerFeatureFlagsViewContext.Provider value={value}>
      {children}
    </SellerFeatureFlagsViewContext.Provider>
  );
}

export function useSellerFeatureFlagsView() {
  const context = useContext(SellerFeatureFlagsViewContext);
  if (!context) {
    throw new Error("useSellerFeatureFlagsView must be used within SellerFeatureFlagsViewProvider");
  }

  return context;
}
