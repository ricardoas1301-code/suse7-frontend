import { useCallback, useEffect, useId, useRef, useState } from "react";
import S7Button from "../../../components/ui/S7Button.jsx";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import { formatCpfCnpjBr, formatPhoneBr } from "../../../utils/profileInputMasks.js";
import ConfigurationTaskModalShell from "./ConfigurationTaskModalShell.jsx";
import { CONFIGURATION_TASK_MODAL_SIZE } from "./configurationTaskModalSizes.js";
import {
  buildConfigurationCompanyDataPatchBody,
  mapConfigurationCompanyDataForm,
  validateConfigurationCompanyDataForm,
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
 *   company: Record<string, unknown> | null;
 *   accountEmail?: string;
 *   emailLocked?: boolean;
 *   saving?: boolean;
 *   loading?: boolean;
 *   error?: string | null;
 *   onSave: (body: Record<string, unknown>) => Promise<void>;
 * }} props
 */
export default function ConfigurationCompanyDataModal({
  open,
  onClose,
  company,
  accountEmail = "",
  emailLocked = false,
  saving = false,
  loading = false,
  error = null,
  onSave,
}) {
  const formId = useId();
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const { addNotification } = useNotifications();
  const [form, setForm] = useState(() => mapConfigurationCompanyDataForm({}, { accountEmail }));

  useEffect(() => {
    if (!open) return;
    setForm(mapConfigurationCompanyDataForm(company ?? {}, { accountEmail }));
  }, [open, company, accountEmail]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearConfigurationFieldValidityForField(formRef.current, field);
  }, []);

  const requestFormSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const validation = validateConfigurationCompanyDataForm(form);
      if (!validation.ok) {
        notifyConfigurationRequiredField(addNotification, validation.message, NOTIFICATION_SEVERITY.ERROR);
        showConfigurationFieldValidation(formRef.current, validation.field, validation.message);
        return;
      }
      await onSave(buildConfigurationCompanyDataPatchBody(form));
    },
    [addNotification, form, onSave],
  );

  const busy = saving || loading;
  const contactEmailLocked = emailLocked && Boolean(String(accountEmail ?? "").trim());

  return (
    <ConfigurationTaskModalShell
      open={open}
      title="Dados da Loja"
      subtitle="Informe os dados principais da loja para continuar."
      onClose={onClose}
      error={error}
      closeDisabled={busy}
      loading={loading}
      size={CONFIGURATION_TASK_MODAL_SIZE.FORM}
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
        className="configuration-onboarding-modal-form configuration-onboarding-modal-form--signup-parity"
        onSubmit={handleSubmit}
      >
        <div className="configuration-onboarding-modal-form__row">
          <label className="configuration-onboarding-modal-form__field">
            <span>Razão social</span>
            <input
              name="company_name"
              value={String(form.company_name ?? "")}
              onChange={(e) => updateField("company_name", e.target.value)}
              disabled={busy}
              autoComplete="organization"
            />
          </label>
          <label className="configuration-onboarding-modal-form__field">
            <span>Nome da Loja</span>
            <input
              name="trade_name"
              value={String(form.trade_name ?? "")}
              onChange={(e) => updateField("trade_name", e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="configuration-onboarding-modal-form__row">
          <label className="configuration-onboarding-modal-form__field">
            <span>CNPJ</span>
            <input
              name="document_cnpj"
              value={formatCpfCnpjBr(String(form.document_cnpj ?? ""))}
              onChange={(e) => updateField("document_cnpj", e.target.value.replace(/\D/g, "").slice(0, 14))}
              disabled={busy || form.documentReadOnly}
              readOnly={form.documentReadOnly}
            />
          </label>
          <label className="configuration-onboarding-modal-form__field">
            <span>E-mail</span>
            <input
              name="contact_email"
              type="email"
              value={String(form.contact_email ?? "")}
              onChange={(e) => updateField("contact_email", e.target.value)}
              disabled={busy || contactEmailLocked}
              readOnly={contactEmailLocked}
              className={contactEmailLocked ? "s7-co-input-readonly" : undefined}
              autoComplete="email"
            />
          </label>
        </div>

        <div className="configuration-onboarding-modal-form__row">
          <label className="configuration-onboarding-modal-form__field">
            <span>WhatsApp</span>
            <input
              name="whatsapp"
              value={formatPhoneBr(String(form.whatsapp ?? ""))}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              disabled={busy}
              inputMode="tel"
            />
          </label>
          <label className="configuration-onboarding-modal-form__field">
            <span>Telefone</span>
            <input
              name="phone"
              value={formatPhoneBr(String(form.phone ?? ""))}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={busy}
              inputMode="tel"
            />
          </label>
        </div>
      </form>
    </ConfigurationTaskModalShell>
  );
}
