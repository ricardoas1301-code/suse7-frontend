import { useCallback, useEffect, useId, useRef, useState } from "react";
import S7Button from "../../../components/ui/S7Button.jsx";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import OperationalWorkingDaysField from "../../../components/Profile/OperationalWorkingDaysField.jsx";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  normalizeOperationalDayClosesAt,
} from "../operationalDayCycle.js";
import {
  DEFAULT_OPERATIONAL_WORKING_DAYS,
  normalizeOperationalWorkingDays,
} from "../operationalWorkingDays.js";
import ConfigurationTaskModalShell from "./ConfigurationTaskModalShell.jsx";
import { CONFIGURATION_TASK_MODAL_SIZE } from "./configurationTaskModalSizes.js";
import { validateConfigurationOperationalCycleForm } from "./configurationOnboardingFormHelpers.js";
import {
  clearConfigurationFieldValidityForField,
  notifyConfigurationRequiredField,
  showConfigurationFieldValidation,
} from "./configurationRequiredFieldUx.js";
import "./ConfigurationOnboardingModals.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   initialClosesAt?: string;
 *   initialWorkingDays?: number[];
 *   saving?: boolean;
 *   error?: string | null;
 *   onSave: (payload: { close_time: string; working_days: number[] }) => Promise<void>;
 * }} props
 */
export default function ConfigurationOperationalCycleModal({
  open,
  onClose,
  initialClosesAt = DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  initialWorkingDays = DEFAULT_OPERATIONAL_WORKING_DAYS,
  saving = false,
  error = null,
  onSave,
}) {
  const formId = useId();
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const { addNotification } = useNotifications();
  const [closesAt, setClosesAt] = useState(DEFAULT_OPERATIONAL_DAY_CLOSES_AT);
  const [workingDays, setWorkingDays] = useState([...DEFAULT_OPERATIONAL_WORKING_DAYS]);

  useEffect(() => {
    if (!open) return;
    setClosesAt(normalizeOperationalDayClosesAt(initialClosesAt));
    setWorkingDays(normalizeOperationalWorkingDays(initialWorkingDays));
    clearConfigurationFieldValidityForField(formRef.current, "operational_close_time");
    clearConfigurationFieldValidityForField(formRef.current, "operational_working_days");
  }, [open, initialClosesAt, initialWorkingDays]);

  const requestFormSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const validation = validateConfigurationOperationalCycleForm({ closesAt, workingDays });
      if (!validation.ok) {
        notifyConfigurationRequiredField(addNotification, validation.message, NOTIFICATION_SEVERITY.ERROR);
        showConfigurationFieldValidation(formRef.current, validation.field, validation.message);
        return;
      }
      await onSave({
        close_time: normalizeOperationalDayClosesAt(closesAt),
        working_days: [...workingDays],
      });
    },
    [addNotification, closesAt, onSave, workingDays],
  );

  return (
    <ConfigurationTaskModalShell
      open={open}
      title="Configuração operacional"
      subtitle="Confirme horário de encerramento e dias de operação."
      onClose={onClose}
      error={error}
      closeDisabled={saving}
      size={CONFIGURATION_TASK_MODAL_SIZE.MEDIUM}
      primaryAction={
        <S7Button
          type="submit"
          form={formId}
          variant="primary"
          loading={saving}
          disabled={saving}
          onClick={requestFormSubmit}
        >
          Salvar
        </S7Button>
      }
    >
      <form ref={formRef} id={formId} className="configuration-onboarding-modal-form" onSubmit={handleSubmit}>
        <label
          className="configuration-onboarding-modal-form__field configuration-onboarding-modal-form__field--time"
          data-field="operational_close_time"
        >
          <span>Hora de encerramento operacional</span>
          <input
            type="time"
            name="operational_close_time"
            value={closesAt}
            onChange={(event) => {
              setClosesAt(normalizeOperationalDayClosesAt(event.target.value));
              clearConfigurationFieldValidityForField(formRef.current, "operational_close_time");
            }}
            disabled={saving}
            step={60}
            required
          />
        </label>
        <div data-field="operational_working_days">
          <OperationalWorkingDaysField
            value={workingDays}
            onChange={setWorkingDays}
            compactLabels
            helpText="Usaremos estes dias junto com a hora de encerramento para calcular corretamente o Resumo Diário."
          />
        </div>
      </form>
    </ConfigurationTaskModalShell>
  );
}
