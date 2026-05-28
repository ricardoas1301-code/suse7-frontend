import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { devCenterGetSellerOperationalTimeline } from "../../../../../../services/devCenterApi";
import { useDevCenterOperationalReloadOpcional } from "../../../../../../components/devCenter/operational";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  buildTimelineMockEvents,
  createInitialTimelineFilters,
  filterTimelineEvents,
  mapApiTimelineEventsToViewModel,
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
 *   error: boolean;
 *   empty: boolean;
 *   filteredEmpty: boolean;
 *   loadError: string;
 *   updateFilters: (patch: Partial<TimelineFiltersViewModel>) => void;
 *   resetFilters: () => void;
 *   resetTimeline: () => void;
 *   reloadTimeline: () => Promise<void>;
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
  const reloadOperacional = useDevCenterOperationalReloadOpcional();
  const timelineVersion = reloadOperacional?.versoesCategoria?.timeline ?? 0;

  const [timelineState, setTimelineState] = useState(createInitialTimelineState);

  const reloadTimeline = useCallback(async () => {
    if (!sellerId) return;

    setTimelineState((current) => ({
      ...current,
      loadState: "loading",
      loadError: "",
    }));

    const response = await devCenterGetSellerOperationalTimeline(sellerId, { limit: 50 });

    if (!response.ok) {
      setTimelineState((current) => ({
        ...current,
        loadState: "error",
        loadError: response.error ?? "Não foi possível carregar a timeline operacional.",
      }));
      return;
    }

    const apiEvents = response.data?.timeline?.events ?? [];
    const events = sortTimelineEventsDesc(mapApiTimelineEventsToViewModel(apiEvents));

    setTimelineState((current) => ({
      ...current,
      events,
      loadState: "loaded",
      loadError: "",
      forceEmpty: events.length === 0,
    }));
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId || !isReady) {
      setTimelineState(createInitialTimelineState());
      return;
    }
    void reloadTimeline();
  }, [sellerId, isReady, timelineVersion, reloadTimeline]);

  const loadMockEvents = useCallback(() => {
    setTimelineState((current) => ({
      ...current,
      events: sortTimelineEventsDesc(buildTimelineMockEvents()),
      loadState: "loaded",
      loadError: "",
      forceEmpty: false,
    }));
  }, []);

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
    void reloadTimeline();
  }, [reloadTimeline]);

  const setTimelineEvents = useCallback((events) => {
    setTimelineState((current) => ({
      ...current,
      events: sortTimelineEventsDesc(events),
      loadState: "loaded",
      forceEmpty: !events?.length,
    }));
  }, []);

  const stateRef = useRef(timelineState);
  stateRef.current = timelineState;

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    window.__S7_TOOLBOX_TIMELINE__ = {
      get: () => stateRef.current,
      reload: () => reloadTimeline(),
      loadMock: () => loadMockEvents(),
      updateFilters,
    };
  }, [reloadTimeline, loadMockEvents, updateFilters]);

  const loading = panelState === "loading" || timelineState.loadState === "loading";
  const error = panelState === "error" || timelineState.loadState === "error";
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
      loadError: timelineState.loadError,
      updateFilters,
      resetFilters,
      resetTimeline,
      reloadTimeline,
      setTimelineEvents,
    }),
    [
      panelState,
      timelineState.events,
      timelineState.filters,
      timelineState.loadError,
      filteredEvents,
      loading,
      error,
      empty,
      filteredEmpty,
      updateFilters,
      resetFilters,
      resetTimeline,
      reloadTimeline,
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
