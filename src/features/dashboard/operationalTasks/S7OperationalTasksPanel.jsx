import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import S7Button from "../../../components/ui/S7Button.jsx";

import S7Icon from "../../../components/ui/S7Icon.jsx";

import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";

import S7ConfigurationOnboardingSection from "../configurationOnboarding/S7ConfigurationOnboardingSection.jsx";

import {

  CARD_PANEL_MODE,
  celebracaoConfiguracaoAtiva,
  configuracaoInicialPendente,
  painelCentralDeveSerVisivel,
  painelCentralRecolhivel,
  painelCentralOnboardingOverlay,
  secaoOperacionalPosOnboardingDeveAparecer,

  resolverModoPainelCentral,

  rotuloPainelCentralRecolhido,

  secaoConfiguracaoDeveAparecer,

} from "../configurationOnboarding/configurationOnboardingPanelState.js";

import { executeOperationalTaskAction } from "./operationalTaskActionRegistry.js";

import {
  estadoInicialRecolhidoPainelOperacional,
  persistirPreferenciaRecolhidoPainelOperacional,
} from "./operationalTasksCollapsePolicy.js";

import { buildCollapsedOperationalTasksLabel } from "./operationalTaskDescriptions.js";

import { cliqueForaPainelOperacional } from "./operationalTasksPanelOutsideClick.js";

import OperationalTasksPanelIcon from "./OperationalTasksPanelIcon.jsx";

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
 *   onConfigurationMilestoneAction?: (milestoneId: string) => void;

 *   tasks: Record<string, unknown>[];

 *   totalTasks: number;

 *   initialLoading: boolean;

 *   refreshing?: boolean;

 *   operationalError?: string | null;

 *   hasResolvedOnce: boolean;

 *   mlInitialSyncPhase?: string | null;

 *   showResolvedCelebration?: boolean;
 *   configurationCompletionCelebrationActive?: boolean;
 *   onDismissConfigurationCelebration?: () => void;
 *   onTaskAction: (actionType: string, task?: Record<string, unknown>) => void;

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
  onConfigurationMilestoneAction,

  tasks,

  totalTasks,

  initialLoading,

  refreshing = false,

  operationalError = null,

  hasResolvedOnce,

  mlInitialSyncPhase = null,

  onTaskAction,

  configurationCompletionCelebrationActive = false,
  onDismissConfigurationCelebration,

}) {

  const panelId = useId();

  const panelRef = useRef(/** @type {HTMLElement | null} */ (null));

  const { user } = useAuthBootstrap();

  const userId = user?.id ?? null;



  const [collapsed, setCollapsed] = useState(() =>
    estadoInicialRecolhidoPainelOperacional({ userId, initialSyncPhase: mlInitialSyncPhase }),
  );



  useEffect(() => {

    setCollapsed(
      estadoInicialRecolhidoPainelOperacional({ userId, initialSyncPhase: mlInitialSyncPhase }),
    );

  }, [userId, mlInitialSyncPhase]);



  useEffect(() => {

    if (mlInitialSyncPhase !== "awaiting_start") return;

    if (initialLoading) return;

    setCollapsed(true);

  }, [mlInitialSyncPhase, initialLoading, refreshing, tasks.length, hasResolvedOnce]);



  const panelInput = useMemo(

    () => ({

      configurationInitialLoading,

      configurationError,

      configurationHasResolvedOnce,

      configurationSnapshot,

      operationalHasResolvedOnce: hasResolvedOnce,

      operationalTaskCount: tasks.length,

      operationalError,

      configurationCompletionCelebrationActive,

    }),

    [

      configurationInitialLoading,

      configurationError,

      configurationHasResolvedOnce,

      configurationSnapshot,

      hasResolvedOnce,

      tasks.length,

      operationalError,

      configurationCompletionCelebrationActive,

    ],

  );



  const collapsible = painelCentralRecolhivel(panelInput);

  const panelMode = resolverModoPainelCentral({

    ...panelInput,

    userPrefersCollapsed: collapsed,

  });

  const isCollapsed = panelMode === CARD_PANEL_MODE.COLLAPSED;

  const onboardingCentered = painelCentralOnboardingOverlay(panelInput);



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

  const showOperationalSection = secaoOperacionalPosOnboardingDeveAparecer(panelInput);

  const pendingTasksCount = totalTasks || tasks.length;

  const showOnboardingExpandedHeader = showConfigurationSection;

  const expandedPanelTitle = showOnboardingExpandedHeader
    ? "Sua operação começa aqui"
    : "Central de pendências";

  const expandedPanelSubtitle = showOnboardingExpandedHeader
    ? null
    : buildCollapsedOperationalTasksLabel(pendingTasksCount);

  const expandedPanelAriaLabel = expandedPanelSubtitle
    ? `${expandedPanelTitle} — ${expandedPanelSubtitle}`
    : expandedPanelTitle;



  const panelShouldRender = painelCentralDeveSerVisivel({

    ...panelInput,

    operationalInitialLoading: initialLoading,

  });



  const toggleCollapsed = useCallback(() => {

    if (!collapsible) return;

    setCollapsed((prev) => {

      const next = !prev;

      persistirPreferenciaRecolhidoPainelOperacional({
        userId,
        initialSyncPhase: mlInitialSyncPhase,
        collapsed: next,
      });

      if (import.meta.env.DEV) {

        console.info(next ? "[task_collapsed]" : "[task_expanded]", { scope: "operational_tasks" });

      }

      return next;

    });

  }, [collapsible, userId, mlInitialSyncPhase]);



  const recolherPainel = useCallback(() => {

    if (!collapsible) return;

    setCollapsed(true);

    persistirPreferenciaRecolhidoPainelOperacional({
      userId,
      initialSyncPhase: mlInitialSyncPhase,
      collapsed: true,
    });

    if (import.meta.env.DEV) {

      console.info("[task_collapsed]", { scope: "operational_tasks", reason: "collapse" });

    }

  }, [collapsible, userId, mlInitialSyncPhase]);



  useEffect(() => {

    if (!collapsible || isCollapsed) {

      return undefined;

    }



    const handlePointerDownOutside = (/** @type {PointerEvent} */ event) => {

      if (!cliqueForaPainelOperacional(panelRef.current, event.target)) return;

      recolherPainel();

    };



    document.addEventListener("pointerdown", handlePointerDownOutside);



    return () => {

      document.removeEventListener("pointerdown", handlePointerDownOutside);

    };

  }, [collapsible, isCollapsed, recolherPainel]);



  const recolherPainelAntesAcao = recolherPainel;



  const handleActionClick = useCallback(

    (/** @type {Record<string, unknown>} */ task) => {

      recolherPainelAntesAcao();

      const action = task?.action;

      const actionType =

        action != null && typeof action === "object" && typeof action.type === "string"

          ? action.type

          : "";

      executeOperationalTaskAction(actionType, {

        open_bulk_listing_skus: () => onTaskAction(actionType, task),

        open_bulk_product_costs: () => onTaskAction(actionType, task),

        open_ml_initial_sync_modal: () => onTaskAction(actionType, task),

        open_ml_sync_modal: () => onTaskAction(actionType, task),

        open_marketplace_connect: () => onTaskAction(actionType, task),

        open_company_edit: () => onTaskAction(actionType, task),

        open_profile_avatar: () => onTaskAction(actionType, task),

        open_profile_contact: () => onTaskAction(actionType, task),

      });

    },

    [onTaskAction, recolherPainelAntesAcao],

  );



  if (!visible || !panelShouldRender) {

    return null;

  }



  const collapsedLabel = rotuloPainelCentralRecolhido({

    operationalTaskCount: pendingTasksCount,

  });



  const panel = (

    <>

      {onboardingCentered && configurationCompletionCelebrationActive ? (

        <div

          className="s7-operational-tasks-panel__celebration-backdrop"

          role="presentation"

          onMouseDown={() => onDismissConfigurationCelebration?.()}

        />

      ) : null}



    <aside

      ref={panelRef}

      id={panelId}

      className={[

        "s7-operational-tasks-panel",

        onboardingCentered ? "s7-operational-tasks-panel--onboarding-centered" : "",

        isCollapsed ? "s7-operational-tasks-panel--collapsed" : "",

        refreshing || configurationRefreshing ? "s7-operational-tasks-panel--refreshing" : "",

      ]

        .filter(Boolean)

        .join(" ")}

      role="region"

      aria-label={expandedPanelAriaLabel}

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

          <OperationalTasksPanelIcon variant="collapsed" />

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

            <h2
              className={[
                "s7-operational-tasks-panel__title",
                showOnboardingExpandedHeader ? "" : "s7-operational-tasks-panel__title--stacked",
                collapsible ? "s7-operational-tasks-panel__title--collapsible" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={collapsible ? toggleCollapsed : undefined}
              onKeyDown={
                collapsible
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleCollapsed();
                      }
                    }
                  : undefined
              }
              role={collapsible ? "button" : undefined}
              tabIndex={collapsible ? 0 : undefined}
              aria-expanded={collapsible ? true : undefined}
              aria-controls={collapsible ? `${panelId}-content` : undefined}
            >
              {!showOnboardingExpandedHeader ? <OperationalTasksPanelIcon variant="expanded" /> : null}
              <span className="s7-operational-tasks-panel__title-block">
                <span className="s7-operational-tasks-panel__title-text">{expandedPanelTitle}</span>
                {expandedPanelSubtitle ? (
                  <span className="s7-operational-tasks-panel__title-subtitle">{expandedPanelSubtitle}</span>
                ) : null}
              </span>
              {showOnboardingExpandedHeader ? <OperationalTasksPanelIcon variant="onboarding" /> : null}
            </h2>

            {collapsible ? (

              <button

                type="button"

                className="s7-operational-tasks-panel__toggle"

                onClick={toggleCollapsed}

                aria-expanded="true"

                aria-controls={`${panelId}-content`}

                aria-label="Recolher painel de preparação"

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

                onMilestoneAction={onConfigurationMilestoneAction}

                modoConclusao={configurationCompletionCelebrationActive}

              />

            ) : null}



            {showConfigurationSection && showOperationalSection ? (

              <div className="s7-operational-tasks-panel__section-divider" role="separator" />

            ) : null}



            {showOperationalSection ? (

              <div className="s7-operational-tasks-panel__operational-section">

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

    </>

  );



  if (typeof document === "undefined") return panel;

  return createPortal(panel, document.body);

}

