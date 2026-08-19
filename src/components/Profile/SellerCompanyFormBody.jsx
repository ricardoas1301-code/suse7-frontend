import S7Icon from "../ui/S7Icon.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import S7PercentDigitsInput from "../ui/S7PercentDigitsInput.jsx";
import {
  COMPANY_OPERATIONAL_COST_STANDARD_LABEL,
  COMPANY_OPERATIONAL_COST_TOOLTIP,
} from "../../domain/costs/costSemanticsPresentation.js";
import { formatCpfCnpjBr } from "../../utils/profileInputMasks";
import { MAX_DIGITOS_PERCENTUAL_SIMULACAO } from "../../utils/percentualDigitos.js";
/** @param {{ children: import("react").ReactNode; required?: boolean }} props */
function CoFieldLabel({ children, required = false }) {
  return (
    <span className="s7-co-field-label">
      {children}
      {required ? (
        <span className="s7-co-required" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}

/** @param {{ text: string; tooltip: string }} props */
function FieldLabelWithTooltip({ text, tooltip }) {
  return (
    <span className="s7-co-label-with-tip">
      <span>{text}</span>
      <S7Tooltip content={tooltip} placement="top-start" offset={6} wrap>
        <button type="button" className="s7-co-label-with-tip__btn" aria-label={`Informações sobre ${text}`}>
          <S7Icon name="info" size={12} strokeWidth={2} />
        </button>
      </S7Tooltip>
    </span>
  );
}

/** @param {{ letter: string; logoUrl: string; uploading: boolean; disabled: boolean; inputRef: import("react").RefObject<HTMLInputElement | null>; onFileChange: (e: import("react").ChangeEvent<HTMLInputElement>) => void; onActivate: () => void }} props */
export function CompanyLogoAvatar({ letter, logoUrl, uploading, disabled, inputRef, onFileChange, onActivate }) {
  const hasLogo = Boolean(logoUrl);
  const tooltip = hasLogo ? "Alterar logo da empresa" : "Selecionar logo da empresa";
  const showLetter = letter && letter !== "?";

  return (
    <div className="s7-co-logo-avatar-field">
      <div className="s7-co-logo-avatar-row">
        <S7Tooltip content={tooltip} placement="bottom-start" offset={6} wrap>
          <button
            type="button"
            className="s7-co-logo-avatar-btn"
            onClick={onActivate}
            disabled={disabled || uploading}
            aria-label={tooltip}
          >
            {hasLogo ? (
              <img src={logoUrl} alt="" className="s7-co-logo-avatar-img" />
            ) : showLetter ? (
              <span className="s7-co-logo-avatar-fallback" aria-hidden>
                {letter}
              </span>
            ) : (
              <span className="s7-co-logo-avatar-fallback s7-co-logo-avatar-fallback--icon" aria-hidden>
                <S7Icon name="catalog_filter_mkt" size={22} />
              </span>
            )}
            <span className="s7-co-logo-avatar-edit" aria-hidden>
              <S7Icon name="edit" size={11} strokeWidth={2.5} />
            </span>
          </button>
        </S7Tooltip>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          disabled={disabled || uploading}
          className="s7-co-file-input-hidden"
          tabIndex={-1}
        />
        {uploading ? <span className="s7-co-upload-hint">Enviando...</span> : null}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   form: Record<string, unknown>;
 *   isEdit: boolean;
 *   isCreate?: boolean;
 *   isPrimaryCompany?: boolean; *   accountLoginEmail?: string;
 *   letter: string;
 *   logoInputRef: import("react").RefObject<HTMLInputElement | null>;
 *   uploadingLogo: boolean;
 *   saving: boolean;
 *   onChange: (e: import("react").ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
 *   onTaxPercent: (field: string) => (value: string) => void; *   onPhoneField: (field: string) => (e: import("react").ChangeEvent<HTMLInputElement>) => void;
 *   onCnpjInput: (e: import("react").ChangeEvent<HTMLInputElement>) => void;
 *   onCepChange: (e: import("react").ChangeEvent<HTMLInputElement>) => void;
 *   onCepBlur: () => void;
 *   onLogo: (e: import("react").ChangeEvent<HTMLInputElement>) => void;
 *   onLogoActivate: () => void;
 * }} props
 */
export default function SellerCompanyFormBody({
  form,
  isEdit,
  isCreate = false,
  isPrimaryCompany = false,  accountLoginEmail = "",
  letter,
  logoInputRef,
  uploadingLogo,
  saving,
  onChange,
  onTaxPercent,
  onPhoneField,
  onCnpjInput,
  onCepChange,
  onCepBlur,
  onLogo,
  onLogoActivate,
}) {
  const disabled = saving || uploadingLogo;
  const contactEmailValue = isPrimaryCompany ? accountLoginEmail : String(form.contact_email ?? "");
  const contactEmailLocked = isPrimaryCompany;
  const requireOnCreate = isCreate;
  return (
    <div className="s7-co-form-aligned">
      <div className="s7-co-form-aligned__headers">
        <h3 id="s7-co-block-company" className="s7-co-form-aligned__section-title">
          Dados da empresa
        </h3>
        <h3 id="s7-co-block-contact" className="s7-co-form-aligned__section-title">
          Contato e endereço
        </h3>
      </div>

      <div className="s7-co-form-aligned__row">
        <div className="s7-co-form-aligned__cell s7-co-form-aligned__cell--logo">
          <CompanyLogoAvatar
            letter={letter}
            logoUrl={String(form.logo_url ?? "")}
            uploading={uploadingLogo}
            disabled={disabled}
            inputRef={logoInputRef}
            onFileChange={onLogo}
            onActivate={onLogoActivate}
          />
        </div>
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid">
            <label>
              <CoFieldLabel>Telefone</CoFieldLabel>
              <input
                name="phone"
                value={String(form.phone ?? "")}
                onChange={onPhoneField("phone")}
                inputMode="tel"
                autoComplete="tel"
                disabled={disabled}
              />
            </label>
            <label>
              <CoFieldLabel required={requireOnCreate}>WhatsApp</CoFieldLabel>
              <input
                name="whatsapp"
                value={String(form.whatsapp ?? "")}
                onChange={onPhoneField("whatsapp")}
                inputMode="tel"
                autoComplete="tel"
                required={requireOnCreate}
                aria-required={requireOnCreate || undefined}
                disabled={disabled}
              />
            </label>          </div>
        </div>
      </div>

      <div className="s7-co-form-aligned__row">
        <div className="s7-co-form-aligned__cell">
          <label className="s7-co-field-block">
            <CoFieldLabel required>Razão social</CoFieldLabel>
            <input
              name="company_name"
              value={String(form.company_name ?? "")}
              onChange={onChange}
              autoComplete="organization"
              required
              aria-required="true"
              disabled={disabled}
            />
          </label>
        </div>
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid">
            <label>
              <CoFieldLabel required={requireOnCreate}>CEP</CoFieldLabel>
              <input
                name="cep"
                value={String(form.cep ?? "")}
                onChange={onCepChange}
                onBlur={onCepBlur}
                placeholder="00000-000"
                required={requireOnCreate}
                aria-required={requireOnCreate || undefined}
                disabled={disabled}
              />
            </label>
            <label>
              <CoFieldLabel required={requireOnCreate}>Número</CoFieldLabel>
              <input
                name="address_number"
                value={String(form.address_number ?? "")}
                onChange={onChange}
                required={requireOnCreate}
                aria-required={requireOnCreate || undefined}
                disabled={disabled}
              />
            </label>          </div>
        </div>
      </div>

      <div className="s7-co-form-aligned__row">
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid">
            <label>
              <CoFieldLabel required={requireOnCreate}>Nome fantasia</CoFieldLabel>
              <input
                name="trade_name"
                value={String(form.trade_name ?? "")}
                onChange={onChange}
                required={requireOnCreate}
                aria-required={requireOnCreate || undefined}
                disabled={disabled}
              />
            </label>            <label>
              <CoFieldLabel required>CNPJ</CoFieldLabel>
              <input
                name="document_cnpj"
                value={formatCpfCnpjBr(String(form.document_cnpj ?? ""))}
                onChange={onCnpjInput}
                inputMode="numeric"
                autoComplete="off"
                required={!isEdit}
                aria-required="true"
                disabled={isEdit || disabled}
                readOnly={isEdit}
                className={isEdit ? "s7-co-input-readonly" : undefined}
              />
            </label>
          </div>
        </div>
        <div className="s7-co-form-aligned__cell">
          <label className="s7-co-field-block">
            <CoFieldLabel>Endereço</CoFieldLabel>
            <input
              name="address_street"
              value={String(form.address_street ?? "")}
              onChange={onChange}
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <div className="s7-co-form-aligned__row">
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid">
            <label>
              <CoFieldLabel required={requireOnCreate}>Alíquota de imposto (%)</CoFieldLabel>
              <S7PercentDigitsInput
                id="default_tax_rate"
                value={String(form.default_tax_rate ?? "")}
                onChange={onTaxPercent("default_tax_rate")}
                disabled={disabled}
                placeholder="0,00"
                maxDigitos={MAX_DIGITOS_PERCENTUAL_SIMULACAO}
                fieldClassName="s7-co-percent-input__field"
                className="s7-co-percent-input"
                aria-label="Alíquota de imposto (%)"
              />
            </label>
            <label>
              <span className="s7-co-field-label s7-co-field-label--with-tip">
                <FieldLabelWithTooltip
                  text={COMPANY_OPERATIONAL_COST_STANDARD_LABEL}
                  tooltip={COMPANY_OPERATIONAL_COST_TOOLTIP}
                />
              </span>
              <S7PercentDigitsInput
                id="operational_cost_rate"
                value={String(form.operational_cost_rate ?? "")}
                onChange={onTaxPercent("operational_cost_rate")}
                disabled={disabled}
                placeholder="0,00"
                maxDigitos={MAX_DIGITOS_PERCENTUAL_SIMULACAO}
                fieldClassName="s7-co-percent-input__field"
                className="s7-co-percent-input"
                aria-label={COMPANY_OPERATIONAL_COST_STANDARD_LABEL}
              />
            </label>          </div>
        </div>
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid">
            <label>
              <CoFieldLabel>Complemento</CoFieldLabel>
              <input
                name="address_complement"
                value={String(form.address_complement ?? "")}
                onChange={onChange}
                disabled={disabled}
              />
            </label>
            <label>
              <CoFieldLabel>Bairro</CoFieldLabel>
              <input
                name="address_district"
                value={String(form.address_district ?? "")}
                onChange={onChange}
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="s7-co-form-aligned__row">
        <div className="s7-co-form-aligned__cell">
          <label className="s7-co-field-block">
            <CoFieldLabel required={requireOnCreate && !contactEmailLocked}>E-mail da empresa</CoFieldLabel>
            <input
              name="contact_email"
              type="email"
              value={contactEmailValue}
              onChange={onChange}
              autoComplete="email"
              placeholder="contato@suaempresa.com.br"
              required={requireOnCreate && !contactEmailLocked}
              aria-required={requireOnCreate && !contactEmailLocked ? true : undefined}
              disabled={contactEmailLocked || disabled}
              readOnly={contactEmailLocked}
              className={contactEmailLocked ? "s7-co-input-readonly" : undefined}
            />          </label>
        </div>
        <div className="s7-co-form-aligned__cell">
          <div className="profile-grid s7-co-form-city-uf">
            <label>
              <CoFieldLabel>Cidade</CoFieldLabel>
              <input name="address_city" value={String(form.address_city ?? "")} onChange={onChange} disabled={disabled} />
            </label>
            <label>
              <CoFieldLabel>Estado (UF)</CoFieldLabel>
              <input
                name="address_state"
                maxLength={2}
                value={String(form.address_state ?? "")}
                onChange={onChange}
                disabled={disabled}
                readOnly
                aria-readonly="true"
                autoComplete="address-level1"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
