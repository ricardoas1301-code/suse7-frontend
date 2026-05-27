import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  buildTimelineMockEvents,
  resolveTimelinePanelState,
  sortTimelineEventsDesc,
} from "./timelineModel";

/** @typedef {import("./timelineModel").TimelineEventViewModel} TimelineEventViewModel */

/**
 * @typedef {{
 *   panelState: import("./timelineModel").TimelinePanelState;
 *   events: TimelineEventViewModel[];
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   resetTimeline: () => void;
 *   setTimelineEvents: (events: TimelineEventViewModel[]) => void;
 * }} TimelineViewValue
 */

/** @type {import("react").Context<TimelineViewValue | null>} */
const TimelineViewContext = createContext(null);

function createInitialTimelineState() {
  return {
    events: /** @type {TimelineEventViewModel[]} */ ([]),
    loadState: /** @type {"idle" | "loading" | "loaded" | "error"} */ ("idle"),
    loadError: "",
    forceEmpty: false,
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function TimelineViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const [timelineState, setTimelineState] = useState(createInitialTimelineState);

  const loadMockEvents = useCallback((forceEmpty = false) => {
    if (forceEmpty) {
      setTimelineState({
        events: [],
        loadState: "loaded",
        loadError: "",
        forceEmpty: true,
      });
      return;
    }

    setTimelineState({
      events: sortTimelineEventsDesc(buildTimelineMockEvents()),
      loadState: "loaded",
      loadError: "",
      forceEmpty: false,
    });
  }, []);

  useEffect(() => {
    if (!sellerId) {
      setTimelineState(createInitialTimelineState());
      return;
    }

    setTimelineState((current) => ({
      ...current,
      loadState: "loading",
      loadError: "",
    }));

    const timer = window.setTimeout(() => {
      loadMockEvents(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [sellerId, loadMockEvents]);

  const panelState = useMemo(
    () =>
      resolveTimelinePanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
        forceEmpty: timelineState.forceEmpty,
      }),
    [sellerId, drawerState, toolboxState, isReady, timelineState.forceEmpty],
  );

  const resetTimeline = useCallback(() => {
    loadMockEvents(false);
  }, [loadMockEvents]);

  const setTimelineEvents = useCallback((events) => {
    setTimelineState({
      events: sortTimelineEventsDesc(events),
      loadState: "loaded",
      loadError: "",
      forceEmpty: events.length === 0,
    });
  }, []);

  const stateRef = useRef(timelineState);
  stateRef.current = timelineState;

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    window.__S7_TOOLBOX_TIMELINE__ = {
      get: () => stateRef.current,
      reset: () => resetTimeline(),
      empty: () => loadMockEvents(true),
    };
  }, [resetTimeline, loadMockEvents]);

  const loading = panelState === "loading" || timelineState.loadState === "loading";
  const error =
    timelineState.loadError ||
    (timelineState.loadState === "error" ? "Não foi possível carregar a timeline." : "");
  const empty =
    timelineState.forceEmpty ||
    (timelineState.loadState === "loaded" && timelineState.events.length === 0);

  const value = useMemo(
    () => ({
      panelState,
      events: timelineState.events,
      loading,
      error,
      empty,
      resetTimeline,
      setTimelineEvents,
    }),
    [panelState, timelineState.events, loading, error, empty, resetTimeline, setTimelineEvents],
  );

  return <TimelineViewContext.Provider value={value}>{children}</TimelineViewContext.Provider>;
}

export function useTimelineView() {
  const context = useContext(TimelineViewContext);
  if (!context) {
    throw new Error("useTimelineView must be used within TimelineViewProvider");
  }
  return context;
}
