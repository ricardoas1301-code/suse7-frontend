import { useCallback, useEffect, useId, useRef, useState } from "react";
import S7Button from "../../../components/ui/S7Button.jsx";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import S7PercentDirectInput from "../../../components/ui/S7PercentDirectInput.jsx";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import { formatarPercentualDiretoFinal } from "../../../utils/s7PercentDirectInput.js";
import ConfigurationTaskModalShell from "./ConfigurationTaskModalShell.jsx";
import { CONFIGURATION_TASK_MODAL_SIZE } from "./configurationTaskModalSizes.js";
import {
  buildConfigurationPercentPatchValue,
  resolveConfigurationPercentInitialDisplay,
  validateConfigurationPercentInput,
} from "./configurationOnboardingFormHelpers.js";
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
 *   title: string;
 *   accessibleInputLabel: string;
 *   emptyMessage: string;
 *   fieldLabel?: string;
 *   fieldLabelTooltip?: string;
 *   helperText?: string;
 *   placeholder?: string;
 *   initialValue?: unknown;
 *   saving?: boolean;
 *   loading?: boolean;
 *   error?: string | null;
 *   onSave: (value: string) => Promise<void>;
 *   showNotApplicable?: boolean;
 *   notApplicableLabel?: string;
 * }} props
 */
export default function ConfigurationPercentModal({
  open,
  onClose,
  title,
  accessibleInputLabel,
  emptyMessage,
  fieldLabel = "",
  fieldLabelTooltip = "",
  helperText = "",
  placeholder = "0,00",
  initialValue = "",
  saving = false,
  loading = false,
  error = null,
  onSave,
  showNotApplicable = false,
  notApplicableLabel = "Não se aplica",
}) {
  const formId = useId();
  const percentInputId = useId();
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const { addNotification } = useNotifications();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(resolveConfigurationPercentInitialDisplay(initialValue));
    clearConfigurationFieldValidityForField(formRef.current, "percent");
  }, [open, initialValue]);

  const requestFormSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const handleNotApplicable = useCallback(async () => {
    const normalized = buildConfigurationPercentPatchValue("0");
    if (!normalized) return;
    await onSave(normalized);
  }, [onSave]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const normalizedDisplay = value ? formatarPercentualDiretoFinal(value) : "";
      const validation = validateConfigurationPercentInput(normalizedDisplay, { emptyMessage });
      if (!validation.ok) {
        notifyConfigurationRequiredField(addNotification, validation.message, NOTIFICATION_SEVERITY.ERROR);
        showConfigurationFieldValidation(formRef.current, validation.field, validation.message);
        return;
      }
      const payload = buildConfigurationPercentPatchValue(normalizedDisplay);
      if (!payload) {
        const message = "Percentual inválido.";
        notifyConfigurationRequiredField(addNotification, message, NOTIFICATION_SEVERITY.ERROR);
        showConfigurationFieldValidation(formRef.current, "percent", message);
        return;
      }
      await onSave(payload);
    },
    [addNotification, emptyMessage, onSave, value],
  );

  const busy = saving || loading;

  return (
    <ConfigurationTaskModalShell
      open={open}
      title={title}
      onClose={onClose}
      error={error}
      closeDisabled={busy}
      loading={loading}
      size={CONFIGURATION_TASK_MODAL_SIZE.COMPACT}
      secondaryAction={
        showNotApplicable ? (
          <S7Button
            type="button"
            variant="secondary"
            className="configuration-onboarding-modal-form__not-applicable-btn"
            loading={busy}
            disabled={busy}
            onClick={() => {
              void handleNotApplicable();
            }}
          >
            {notApplicableLabel}
          </S7Button>
        ) : null
      }
      primaryAction={
        <S7Button
          type="submit"
          form={formId}
          variant="primary"
          loading={busy}
          disabled={busy}
          onClick={requestFormSubmit}
        >
          Salvar
        </S7Button>
      }
    >
      <form
        ref={formRef}
        id={formId}
        className="configuration-onboarding-modal-form configuration-onboarding-modal-form--compact"
        onSubmit={handleSubmit}
      >
        <div
          className="configuration-onboarding-modal-form__field configuration-onboarding-modal-form__field--percent"
          data-field="percent"
        >
          {helperText ? (
            <p className="configuration-onboarding-modal-form__helper">{helperText}</p>
          ) : null}
          {fieldLabel ? (
            fieldLabelTooltip ? (
              <span className="configuration-onboarding-modal-form__label configuration-onboarding-modal-form__label--with-tip s7-co-label-with-tip">
                <span>{fieldLabel}</span>
                <S7Tooltip content={fieldLabelTooltip} placement="top-start" offset={6} wrap>
                  <button
                    type="button"
                    className="s7-co-label-with-tip__btn"
                    aria-label={`Informações sobre ${fieldLabel}`}
                  >
                    <S7Icon name="info" size={12} strokeWidth={2} />
                  </button>
                </S7Tooltip>
              </span>
            ) : (
              <span className="configuration-onboarding-modal-form__label">{fieldLabel}</span>
            )
          ) : null}
          <S7PercentDirectInput
            id={percentInputId}
            name="percent"
            value={value}
            onChange={setValue}
            disabled={busy}
            placeholder={placeholder}
            aria-label={accessibleInputLabel}
          />
        </div>
      </form>
    </ConfigurationTaskModalShell>
  );
}
