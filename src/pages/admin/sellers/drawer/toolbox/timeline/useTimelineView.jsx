import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  buildTimelineMockEvents,
  createInitialTimelineFilters,
  filterTimelineEvents,
  resolveTimelinePanelState,
  sortTimelineEventsDesc,
} from "./timelineModel";

/** @typedef {import("./timelineModel").TimelineEventViewModel} TimelineEventViewModel */
/** @typedef {import("./timelineModel").TimelineFiltersViewModel} TimelineFiltersViewModel */

/**
 * @typedef {{
 *   panelState: import("./timelineModel").TimelinePanelState;
 *   events: TimelineEventViewModel[];
 *   filteredEvents: TimelineEventViewModel[];
 *   filters: TimelineFiltersViewModel;
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   filteredEmpty: boolean;
 *   updateFilters: (patch: Partial<TimelineFiltersViewModel>) => void;
 *   resetFilters: () => void;
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
    filters: createInitialTimelineFilters(),
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
      setTimelineState((current) => ({
        ...current,
        events: [],
        loadState: "loaded",
        loadError: "",
        forceEmpty: true,
      }));
      return;
    }

    setTimelineState((current) => ({
      ...current,
      events: sortTimelineEventsDesc(buildTimelineMockEvents()),
      loadState: "loaded",
      loadError: "",
      forceEmpty: false,
    }));
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
      filters: createInitialTimelineFilters(),
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

  const filteredEvents = useMemo(
    () => filterTimelineEvents(timelineState.events, timelineState.filters),
    [timelineState.events, timelineState.filters],
  );

  const updateFilters = useCallback((patch) => {
    setTimelineState((current) => ({
      ...current,
      filters: {
        ...current.filters,
        ...patch,
      },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setTimelineState((current) => ({
      ...current,
      filters: createInitialTimelineFilters(),
    }));
  }, []);

  const resetTimeline = useCallback(() => {
    setTimelineState((current) => ({
      ...current,
      filters: createInitialTimelineFilters(),
    }));
    loadMockEvents(false);
  }, [loadMockEvents]);

  const setTimelineEvents = useCallback((events) => {
    setTimelineState((current) => ({
      ...current,
      events: sortTimelineEventsDesc(events),
      loadState: "loaded",
      loadError: "",
      forceEmpty: events.length === 0,
    }));
  }, []);

  const stateRef = useRef(timelineState);
  stateRef.current = timelineState;

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    window.__S7_TOOLBOX_TIMELINE__ = {
      get: () => stateRef.current,
      reset: () => resetTimeline(),
      empty: () => loadMockEvents(true),
      setFilters: (patch) => updateFilters(patch),
    };
  }, [resetTimeline, loadMockEvents, updateFilters]);

  const loading = panelState === "loading" || timelineState.loadState === "loading";
  const error =
    timelineState.loadError ||
    (timelineState.loadState === "error" ? "Não foi possível carregar a timeline." : "");
  const empty =
    timelineState.forceEmpty ||
    (timelineState.loadState === "loaded" && timelineState.events.length === 0);
  const filteredEmpty =
    !empty && timelineState.loadState === "loaded" && filteredEvents.length === 0;

  const value = useMemo(
    () => ({
      panelState,
      events: timelineState.events,
      filteredEvents,
      filters: timelineState.filters,
      loading,
      error,
      empty,
      filteredEmpty,
      updateFilters,
      resetFilters,
      resetTimeline,
      setTimelineEvents,
    }),
    [
      panelState,
      timelineState.events,
      timelineState.filters,
      filteredEvents,
      loading,
      error,
      empty,
      filteredEmpty,
      updateFilters,
      resetFilters,
      resetTimeline,
      setTimelineEvents,
    ],
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
