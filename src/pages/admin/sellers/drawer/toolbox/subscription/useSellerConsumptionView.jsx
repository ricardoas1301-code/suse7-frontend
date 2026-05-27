import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { isSellerToolboxSubscriptionEmpty } from "../sellerToolboxSubscriptionModel";
import {
  normalizeConsumptionAmount,
  buildSellerConsumptionViewModel,
  createSellerConsumptionMockInput,
  resolveSellerConsumptionViewState,
  SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK,
} from "./sellerToolboxConsumptionModel";

/** @typedef {import("./sellerToolboxConsumptionModel").SellerConsumptionViewModel} SellerConsumptionViewModel */
/** @typedef {import("./sellerToolboxConsumptionModel").SellerConsumptionViewState} SellerConsumptionViewState */

/**
 * @typedef {{
 *   viewState: SellerConsumptionViewState;
 *   consumption: SellerConsumptionViewModel | null;
 *   setMockConsumed: (consumed: number) => void;
 *   setMockLimit: (monthlyLimit: number) => void;
 *   resetMockConsumption: () => void;
 *   resetConsumption: (result: Record<string, unknown>) => void;
 *   recalculateConsumption: (result: Record<string, unknown>) => void;
 *   applyConsumptionOperationResult: (result: Record<string, unknown>) => void;
 * }} SellerConsumptionViewValue
 */

/** @type {import("react").Context<SellerConsumptionViewValue | null>} */
const SellerConsumptionViewContext = createContext(null);

let devBridgeInitialized = false;

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerConsumptionViewProvider({ children }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const [mockInput, setMockInput] = useState(() =>
    createSellerConsumptionMockInput({ sellerId: sellerId ?? null }),
  );

  useEffect(() => {
    setMockInput(createSellerConsumptionMockInput({ sellerId: sellerId ?? null }));
  }, [sellerId]);

  const subscriptionEmpty = useMemo(
    () => isSellerToolboxSubscriptionEmpty({ listPreview, detail }),
    [listPreview, detail],
  );

  const viewState = useMemo(
    () =>
      resolveSellerConsumptionViewState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
        isSubscriptionEmpty: subscriptionEmpty,
      }),
    [sellerId, drawerState, toolboxState, isReady, subscriptionEmpty],
  );

  const consumption = useMemo(() => {
    if (viewState !== "loaded") return null;
    return buildSellerConsumptionViewModel({
      ...mockInput,
      sellerId: sellerId ?? null,
    });
  }, [viewState, mockInput, sellerId]);

  const setMockConsumed = useCallback((consumed) => {
    setMockInput((current) => ({
      ...current,
      consumed,
    }));
  }, []);

  const setMockLimit = useCallback((monthlyLimit) => {
    setMockInput((current) => ({
      ...current,
      monthlyLimit,
    }));
  }, []);

  const resetMockConsumption = useCallback(() => {
    setMockInput(createSellerConsumptionMockInput({ sellerId: sellerId ?? null }));
  }, [sellerId]);

  const applyConsumptionOperationResult = useCallback((result) => {
    const nextConsumed = normalizeConsumptionAmount(result?.newConsumed ?? result?.consumed ?? 0);
    setMockInput((current) => ({
      ...current,
      consumed: nextConsumed,
      ...(Object.prototype.hasOwnProperty.call(result, "sources")
        ? { sources: Array.isArray(result.sources) ? result.sources.map((source) => ({ ...source })) : [] }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(result, "recalculatedAt")
        ? { recalculatedAt: result.recalculatedAt ?? null }
        : {}),
    }));
  }, []);

  const resetConsumption = useCallback(
    (result) => {
      applyConsumptionOperationResult({
        ...result,
        newConsumed: 0,
        consumed: 0,
        sources: [],
        recalculatedAt: null,
      });
    },
    [applyConsumptionOperationResult],
  );

  const recalculateConsumption = useCallback(
    (result) => {
      applyConsumptionOperationResult(result);
    },
    [applyConsumptionOperationResult],
  );

  const consumptionRef = useRef(consumption);
  consumptionRef.current = consumption;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_CONSUMPTION__ = {
      get: () => consumptionRef.current,
      setMockConsumed: (consumed) => {
        setMockConsumed(consumed);
      },
      setMockLimit: (monthlyLimit) => {
        setMockLimit(monthlyLimit);
      },
      reset: () => {
        resetMockConsumption();
      },
      scenarios: {
        healthy: () =>
          setMockConsumed(Math.round(SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit * 0.35)),
        warning: () =>
          setMockConsumed(Math.round(SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit * 0.75)),
        danger: () =>
          setMockConsumed(Math.round(SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit * 0.95)),
        blocked: () =>
          setMockConsumed(SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit + 250),
      },
    };
  }, [setMockConsumed, setMockLimit, resetMockConsumption]);

  const value = useMemo(
    () => ({
      viewState,
      consumption,
      setMockConsumed,
      setMockLimit,
      resetMockConsumption,
      resetConsumption,
      recalculateConsumption,
      applyConsumptionOperationResult,
    }),
    [
      viewState,
      consumption,
      setMockConsumed,
      setMockLimit,
      resetMockConsumption,
      resetConsumption,
      recalculateConsumption,
      applyConsumptionOperationResult,
    ],
  );

  return (
    <SellerConsumptionViewContext.Provider value={value}>
      {children}
    </SellerConsumptionViewContext.Provider>
  );
}

export function useSellerConsumptionView() {
  const context = useContext(SellerConsumptionViewContext);
  if (!context) {
    throw new Error("useSellerConsumptionView must be used within SellerConsumptionViewProvider");
  }
  return context;
}
