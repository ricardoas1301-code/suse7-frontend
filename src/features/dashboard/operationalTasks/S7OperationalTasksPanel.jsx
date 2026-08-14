import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../../../components/ui/S7Button.jsx";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import S7ConfigurationOnboardingSection from "../configurationOnboarding/S7ConfigurationOnboardingSection.jsx";
import {
  CARD_PANEL_MODE,
  painelCentralDeveSerVisivel,
  painelCentralRecolhivel,
  possuiPendenciasOperacionaisAcionaveis,
  resolverModoPainelCentral,
  rotuloPainelCentralRecolhido,
  secaoConfiguracaoDeveAparecer,
} from "../configurationOnboarding/configurationOnboardingPanelState.js";
import { executeOperationalTaskAction } from "./operationalTaskActionRegistry.js";
import {
  readOperationalTasksCollapsedPreference,
  writeOperationalTasksCollapsedPreference,
} from "./operationalTasksCollapseStorage.js";
import "./S7OperationalTasksPanel.css";

/**
 * @param {{
 *   visible?: boolean;
 *   configurationInitialLoading: boolean;
 *   configurationRefreshing?: boolean;
 *   configurationError?: string | null;
 *   configurationHasResolvedOnce: boolean;
 *   configurationSnapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   onConfigurationRetry?: () => void;
 *   tasks: Record<string, unknown>[];
 *   totalTasks: number;
 *   initialLoading: boolean;
 *   refreshing?: boolean;
 *   operationalError?: string | null;
 *   hasResolvedOnce: boolean;
 *   showResolvedCelebration?: boolean;
 *   onTaskAction: (actionType: string) => void;
 * }} props
 */
export default function S7OperationalTasksPanel({
  visible = true,
  configurationInitialLoading,
  configurationRefreshing = false,
  configurationError = null,
  configurationHasResolvedOnce,
  configurationSnapshot,
  onConfigurationRetry,
  tasks,
  totalTasks,
  initialLoading,
  refreshing = false,
  operationalError = null,
  hasResolvedOnce,
  onTaskAction,
}) {
  const panelId = useId();
  const panelRef = useRef(/** @type {HTMLElement | null} */ (null));
  const { user } = useAuthBootstrap();
  const userId = user?.id ?? null;

  const [collapsed, setCollapsed] = useState(() => readOperationalTasksCollapsedPreference(userId));

  useEffect(() => {
    setCollapsed(readOperationalTasksCollapsedPreference(userId));
  }, [userId]);

  const panelInput = useMemo(
    () => ({
      configurationInitialLoading,
      configurationError,
      configurationHasResolvedOnce,
      configurationSnapshot,
      operationalHasResolvedOnce: hasResolvedOnce,
      operationalTaskCount: tasks.length,
      operationalError,
    }),
    [
      configurationInitialLoading,
      configurationError,
      configurationHasResolvedOnce,
      configurationSnapshot,
      hasResolvedOnce,
      tasks.length,
      operationalError,
    ],
  );

  const collapsible = painelCentralRecolhivel(panelInput);
  const panelMode = resolverModoPainelCentral({
    ...panelInput,
    userPrefersCollapsed: collapsed,
  });
  const isCollapsed = panelMode === CARD_PANEL_MODE.COLLAPSED;

  useEffect(() => {
    if (!collapsible) {
      setCollapsed(false);
    }
  }, [collapsible]);

  const publishPanelHeight = useCallback(() => {
    if (typeof document === "undefined") return;
    const el = panelRef.current;
    if (!el) {
      document.documentElement.style.setProperty("--s7-operational-tasks-panel-height", "0px");
      return;
    }
    const height = Math.ceil(el.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--s7-operational-tasks-panel-height", `${height}px`);
  }, []);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      publishPanelHeight();
      return undefined;
    }

    publishPanelHeight();
    const observer = new ResizeObserver(() => publishPanelHeight());
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--s7-operational-tasks-panel-height", "0px");
    };
  }, [
    isCollapsed,
    tasks.length,
    initialLoading,
    configurationInitialLoading,
    configurationSnapshot,
    publishPanelHeight,
  ]);

  const showConfigurationSection = secaoConfiguracaoDeveAparecer(panelInput);
  const showOperationalSection = possuiPendenciasOperacionaisAcionaveis(panelInput);

  const panelShouldRender = painelCentralDeveSerVisivel({
    ...panelInput,
    operationalInitialLoading: initialLoading,
  });

  const toggleCollapsed = useCallback(() => {
    if (!collapsible) return;
    setCollapsed((prev) => {
      const next = !prev;
      writeOperationalTasksCollapsedPreference(userId, next);
      if (import.meta.env.DEV) {
        console.info(next ? "[task_collapsed]" : "[task_expanded]", { scope: "operational_tasks" });
      }
      return next;
    });
  }, [collapsible, userId]);

  const handleActionClick = useCallback(
    (/** @type {Record<string, unknown>} */ task) => {
      const action = task?.action;
      const actionType =
        action != null && typeof action === "object" && typeof action.type === "string"
          ? action.type
          : "";
      executeOperationalTaskAction(actionType, {
        open_bulk_listing_skus: () => onTaskAction(actionType),
        open_bulk_product_costs: () => onTaskAction(actionType),
      });
    },
    [onTaskAction],
  );

  if (!visible || !panelShouldRender) {
    return null;
  }

  const collapsedLabel = rotuloPainelCentralRecolhido({
    operationalTaskCount: totalTasks || tasks.length,
  });

  const panel = (
    <aside
      ref={panelRef}
      id={panelId}
      className={[
        "s7-operational-tasks-panel",
        isCollapsed ? "s7-operational-tasks-panel--collapsed" : "",
        refreshing || configurationRefreshing ? "s7-operational-tasks-panel--refreshing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label="Central de tarefas"
      aria-live="polite"
      aria-busy={refreshing || configurationRefreshing || undefined}
    >
      {isCollapsed ? (
        <button
          type="button"
          className="s7-operational-tasks-panel__collapsed-trigger"
          onClick={toggleCollapsed}
          aria-expanded="false"
          aria-controls={`${panelId}-content`}
        >
          <span className="s7-operational-tasks-panel__attention-icon" aria-hidden>
            ⚠
          </span>
          <span className="s7-operational-tasks-panel__collapsed-label">{collapsedLabel}</span>
          <S7Icon
            name="chevron_down"
            size={16}
            className="s7-operational-tasks-panel__chevron s7-operational-tasks-panel__chevron--up"
          />
        </button>
      ) : (
        <>
          <header className="s7-operational-tasks-panel__header">
            <h2 className="s7-operational-tasks-panel__title">Central de tarefas</h2>
            {collapsible ? (
              <button
                type="button"
                className="s7-operational-tasks-panel__toggle"
                onClick={toggleCollapsed}
                aria-expanded="true"
                aria-controls={`${panelId}-content`}
                aria-label="Recolher central de tarefas"
              >
                <S7Icon name="chevron_down" size={18} />
              </button>
            ) : null}
          </header>

          <div id={`${panelId}-content`} className="s7-operational-tasks-panel__body">
            {showConfigurationSection ? (
              <S7ConfigurationOnboardingSection
                initialLoading={configurationInitialLoading}
                refreshing={configurationRefreshing}
                error={configurationError}
                snapshot={configurationSnapshot}
                onRetry={onConfigurationRetry}
              />
            ) : null}

            {showConfigurationSection && showOperationalSection ? (
              <div className="s7-operational-tasks-panel__section-divider" role="separator" />
            ) : null}

            {showOperationalSection ? (
              <div className="s7-operational-tasks-panel__operational-section">
                <h3 className="s7-operational-tasks-panel__section-title">Pendências operacionais</h3>

                {operationalError ? (
                  <p className="s7-operational-tasks-panel__section-error" role="alert">
                    {operationalError}
                  </p>
                ) : null}

                {tasks.map((task) => {
                  const action =
                    task?.action != null && typeof task.action === "object"
                      ? /** @type {Record<string, unknown>} */ (task.action)
                      : {};
                  const actionLabel = typeof action.label === "string" ? action.label : "Abrir ação";
                  const title = typeof task.title === "string" ? task.title : "Tarefa";
                  const description = typeof task.description === "string" ? task.description : "";

                  return (
                    <article
                      key={String(task.id ?? task.type ?? title)}
                      className="s7-operational-tasks-panel__task-card"
                    >
                      <div className="s7-operational-tasks-panel__task-head">
                        <span className="s7-operational-tasks-panel__attention-icon" aria-hidden>
                          ⚠
                        </span>
                        <h4 className="s7-operational-tasks-panel__task-title">{title}</h4>
                      </div>
                      <p className="s7-operational-tasks-panel__task-description">{description}</p>
                      <S7Button
                        type="button"
                        variant="warning"
                        size="sm"
                        className="s7-operational-tasks-panel__action"
                        aria-label={`${actionLabel} — ${title}`}
                        onClick={() => handleActionClick(task)}
                      >
                        {actionLabel}
                      </S7Button>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );

  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
