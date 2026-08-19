import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient.js";
import S7ImportantNotice from "../../../components/ui/S7ImportantNotice.jsx";
import { CONFIGURATION_MILESTONE_STATUS } from "./configurationOnboardingTypes.js";
import { milestoneAcaoClicavel } from "./configurationMilestoneActionRegistry.js";
import { milestoneVisualmenteBloqueado } from "./configurationMilestoneEligibility.js";
import { obterApresentacaoMilestone, ordenarMilestonesParaApresentacao } from "./configurationMilestonePresentationRegistry.js";
import {
  configuracaoEstaCompleta,
  extrairResumoProgresso,
} from "./configurationOnboardingSelectors.js";
import "./S7ConfigurationOnboardingSection.css";

/**
 * @param {{
 *   initialLoading: boolean;
 *   refreshing?: boolean;
 *   error?: string | null;
 *   snapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null;
 *   onRetry?: () => void;
 *   onMilestoneAction?: (milestoneId: string) => void;
 *   modoConclusao?: boolean;
 * }} props
 */
export default function S7ConfigurationOnboardingSection({
  initialLoading,
  refreshing = false,
  error = null,
  snapshot,
  onRetry,
  onMilestoneAction,
  modoConclusao = false,
}) {
  const sectionId = useId();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderLogoutButton = () => (
    <button type="button" className="s7-configuration-onboarding__logout" onClick={() => void handleLogout()}>
      Sair da conta
    </button>
  );

  if (initialLoading) {
    return (
      <section
        className="s7-configuration-onboarding"
        aria-busy="true"
      >
        <div className="s7-configuration-onboarding__header">
          <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--intro" />
        </div>
        <div className="s7-configuration-onboarding__main">
          <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--next" />
          <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--checklist" />
        </div>
        <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--bar" />
        <div className="s7-configuration-onboarding__skeleton s7-configuration-onboarding__skeleton--line" />
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
        <footer className="s7-configuration-onboarding__footer s7-configuration-onboarding__footer--minimal">
          {renderLogoutButton()}
        </footer>
      </section>
    );
  }

  if (!snapshot) {
    return null;
  }

  const concluido = modoConclusao || configuracaoEstaCompleta(snapshot);
  if (concluido && !modoConclusao) {
    return null;
  }

  const resumo = extrairResumoProgresso(snapshot);
  const percent = concluido ? 100 : resumo.percent;
  const completed = concluido ? resumo.total ?? 6 : resumo.completed;
  const total = resumo.total;
  const milestones = ordenarMilestonesParaApresentacao(
    Array.isArray(snapshot.milestones) ? snapshot.milestones : [],
  ).map((milestone) =>
    concluido
      ? { ...milestone, status: CONFIGURATION_MILESTONE_STATUS.COMPLETED }
      : milestone,
  );
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;

  return (
    <section
      className={[
        "s7-configuration-onboarding",
        refreshing ? "s7-configuration-onboarding--refreshing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-describedby={`${sectionId}-intro`}
      aria-busy={refreshing || undefined}
    >
      <div className="s7-configuration-onboarding__header">
        {concluido ? (
          <p id={`${sectionId}-intro`} className="s7-configuration-onboarding__intro">
            Preparação inicial concluída. Sua SUSE7 já está liberada para operar.
          </p>
        ) : (
          <S7ImportantNotice id={`${sectionId}-intro`}>
            Completar estas etapas é essencial para preparar sua operação e começar a usar o SUSE7. Essa etapa leva menos de dois minutos.
          </S7ImportantNotice>
        )}
      </div>

      <div className="s7-configuration-onboarding__main">
        <div className="s7-configuration-onboarding__next-spacer" aria-hidden="true" />

        <ul id={`${sectionId}-checklist`} className="s7-configuration-onboarding__checklist">
        {milestones.map((milestone) => {
          const id = String(milestone?.id ?? "");
          const presentation = obterApresentacaoMilestone(id);
          const isCompleted = milestone?.status === CONFIGURATION_MILESTONE_STATUS.COMPLETED;
          const isVisuallyLocked = milestoneVisualmenteBloqueado(id, milestones);
          const isClickable =
            !isVisuallyLocked &&
            milestoneAcaoClicavel(id, String(milestone?.status ?? ""), milestones) &&
            Boolean(onMilestoneAction);
          const itemClassName = [
            "s7-configuration-onboarding__checklist-item",
            isCompleted ? "s7-configuration-onboarding__checklist-item--completed" : "",
            isVisuallyLocked ? "s7-configuration-onboarding__checklist-item--locked" : "",
            presentation.isUnknown ? "s7-configuration-onboarding__checklist-item--unknown" : "",
            isClickable ? "s7-configuration-onboarding__checklist-item--actionable" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <span
                className={[
                  "s7-configuration-onboarding__checklist-icon",
                  isCompleted
                    ? "s7-configuration-onboarding__checklist-icon--completed"
                    : "s7-configuration-onboarding__checklist-icon--pending",
                ].join(" ")}
                aria-hidden
              >
                {isCompleted ? "✓" : null}
              </span>
              <span className="s7-configuration-onboarding__checklist-label">{presentation.label}</span>
            </>
          );

          return (
            <li key={id || presentation.label} className={itemClassName}>
              {isClickable ? (
                <button
                  type="button"
                  className="s7-configuration-onboarding__checklist-button"
                  onClick={() => onMilestoneAction?.(id)}
                  disabled={refreshing}
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
        </ul>
      </div>

      <footer className="s7-configuration-onboarding__footer">
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
          <div className="s7-configuration-onboarding__summary-row">
            <p className="s7-configuration-onboarding__summary">
              {completed} de {total} etapas concluídas
            </p>
            <span className="s7-configuration-onboarding__percent" aria-hidden={!Number.isFinite(percent)}>
              {Number.isFinite(percent) ? `${percent}%` : "—"}
            </span>
          </div>
        ) : null}

        {renderLogoutButton()}
      </footer>
    </section>
  );
}
