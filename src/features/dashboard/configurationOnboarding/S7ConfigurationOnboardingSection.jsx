import { useId } from "react";
import { CONFIGURATION_MILESTONE_STATUS } from "./configurationOnboardingTypes.js";
import { obterApresentacaoMilestone, ordenarMilestonesParaApresentacao } from "./configurationMilestonePresentationRegistry.js";
import {
  configuracaoEstaCompleta,
  extrairResumoProgresso,
  selecionarProximoMilestonePendente,
} from "./configurationOnboardingSelectors.js";
import "./S7ConfigurationOnboardingSection.css";

/**
 * @param {{
 *   initialLoading: boolean;
 *   refreshing?: boolean;
 *   error?: string | null;
 *   snapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   onRetry?: () => void;
 * }} props
 */
export default function S7ConfigurationOnboardingSection({
  initialLoading,
  refreshing = false,
  error = null,
  snapshot,
  onRetry,
}) {
  const sectionId = useId();

  if (initialLoading) {
    return (
      <section
        className="s7-configuration-onboarding"
        aria-labelledby={`${sectionId}-title`}
        aria-busy="true"
      >
        <div className="s7-configuration-onboarding__header">
          <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--title" />
          <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--percent" />
        </div>
        <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--bar" />
        <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--line" />
        <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--checklist" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="s7-configuration-onboarding s7-configuration-onboarding--error" aria-live="polite">
        <p className="s7-configuration-onboarding__error-text">{error}</p>
        {onRetry ? (
          <button type="button" className="s7-configuration-onboarding__retry" onClick={onRetry}>
            Tentar novamente
          </button>
        ) : null}
      </section>
    );
  }

  if (!snapshot || configuracaoEstaCompleta(snapshot)) {
    return null;
  }

  const resumo = extrairResumoProgresso(snapshot);
  const percent = resumo.percent;
  const completed = resumo.completed;
  const total = resumo.total;
  const milestones = ordenarMilestonesParaApresentacao(
    Array.isArray(snapshot.milestones) ? snapshot.milestones : [],
  );
  const proximo = selecionarProximoMilestonePendente(milestones);
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;

  return (
    <section
      className={[
        "s7-configuration-onboarding",
        refreshing ? "s7-configuration-onboarding--refreshing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`${sectionId}-title`}
      aria-busy={refreshing || undefined}
    >
      <div className="s7-configuration-onboarding__header">
        <h3 id={`${sectionId}-title`} className="s7-configuration-onboarding__title">
          Configuração inicial
        </h3>
        <span className="s7-configuration-onboarding__percent" aria-hidden={!Number.isFinite(percent)}>
          {Number.isFinite(percent) ? `${percent}%` : "—"}
        </span>
      </div>

      <div
        className="s7-configuration-onboarding__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        aria-label={`Progresso da configuração inicial: ${safePercent}%`}
      >
        <div className="s7-configuration-onboarding__progress-track">
          <div
            className="s7-configuration-onboarding__progress-fill"
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </div>

      {Number.isFinite(completed) && Number.isFinite(total) ? (
        <p className="s7-configuration-onboarding__summary">
          {completed} de {total} etapas concluídas
        </p>
      ) : null}

      {proximo ? (
        <div className="s7-configuration-onboarding__next">
          <p className="s7-configuration-onboarding__next-label">Próxima etapa</p>
          <p className="s7-configuration-onboarding__next-title">{proximo.presentation.label}</p>
          {proximo.presentation.description ? (
            <p className="s7-configuration-onboarding__next-description">{proximo.presentation.description}</p>
          ) : null}
        </div>
      ) : null}

      <ul id={`${sectionId}-checklist`} className="s7-configuration-onboarding__checklist">
        {milestones.map((milestone) => {
          const id = String(milestone?.id ?? "");
          const presentation = obterApresentacaoMilestone(id);
          const isCompleted = milestone?.status === CONFIGURATION_MILESTONE_STATUS.COMPLETED;
          return (
            <li
              key={id || presentation.label}
              className={[
                "s7-configuration-onboarding__checklist-item",
                isCompleted ? "s7-configuration-onboarding__checklist-item--completed" : "",
                presentation.isUnknown ? "s7-configuration-onboarding__checklist-item--unknown" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="s7-configuration-onboarding__checklist-icon" aria-hidden>
                {isCompleted ? "✓" : "○"}
              </span>
              <span className="s7-configuration-onboarding__checklist-label">{presentation.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
